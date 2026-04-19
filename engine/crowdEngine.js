/**
 * ARIA — Crowd Engine
 * Dedicated module for live crowd density simulation, time-of-day modelling,
 * short-term congestion prediction, and zone scoring.
 *
 * Architecture: This module is the single source of truth for all crowd state.
 * It feeds the Decision Engine with scored zone data.
 * It NEVER calls AI — that is the AI Engine's job.
 */

'use strict';

// ─── Zone base capacities ─────────────────────────────────────────────────────
const ZONE_CAPACITIES = {
  entrance:     5000,
  gate_1:       1200,
  gate_2:       1200,
  gate_3:        900,
  gate_4:        900,
  food_north:    600,
  food_south:    600,
  restroom_e:    200,
  restroom_w:    200,
  medic_centre:   80,
  exit_north:   2000,
  exit_south:   2000,
  seating_a:    8000,
  seating_b:    8000,
  staff_hub:     150,
};

// ─── Time-of-day density curves ───────────────────────────────────────────────
// Returns a base occupancy ratio (0.0 → 1.0) for each game phase
const PHASE_MULTIPLIERS = {
  pre_match:  { gate_1: 0.80, gate_2: 0.75, gate_3: 0.60, gate_4: 0.55, food_north: 0.40, food_south: 0.35, restroom_e: 0.30, restroom_w: 0.25, exit_north: 0.05, exit_south: 0.05 },
  first_half: { gate_1: 0.10, gate_2: 0.10, gate_3: 0.05, gate_4: 0.05, food_north: 0.20, food_south: 0.20, restroom_e: 0.15, restroom_w: 0.15, exit_north: 0.02, exit_south: 0.02 },
  halftime:   { gate_1: 0.05, gate_2: 0.05, gate_3: 0.05, gate_4: 0.05, food_north: 0.90, food_south: 0.85, restroom_e: 0.80, restroom_w: 0.75, exit_north: 0.03, exit_south: 0.03 },
  second_half:{ gate_1: 0.05, gate_2: 0.05, gate_3: 0.05, gate_4: 0.05, food_north: 0.15, food_south: 0.15, restroom_e: 0.10, restroom_w: 0.10, exit_north: 0.02, exit_south: 0.02 },
  post_match: { gate_1: 0.30, gate_2: 0.35, gate_3: 0.50, gate_4: 0.55, food_north: 0.20, food_south: 0.20, restroom_e: 0.25, restroom_w: 0.30, exit_north: 0.90, exit_south: 0.85 },
};

/** Internal crowd state — updated on each simulation tick */
let _crowdState = {};
let _currentPhase = 'pre_match';
let _lastUpdated = 0;

/**
 * Applies Gaussian-distributed noise to a base value.
 * Keeps the simulation probabilistic but realistic.
 * @param {number} base - Base occupancy ratio (0.0–1.0)
 * @param {number} sigma - Standard deviation of noise (default 0.05)
 * @returns {number} Noisy value clamped to [0, 1]
 */
const gaussianNoise = (base, sigma = 0.05) => {
  // Box-Muller transform for Gaussian noise
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return Math.min(1, Math.max(0, base + sigma * z));
};

/**
 * Converts an occupancy ratio to a labelled density level.
 * @param {number} ratio - Occupancy ratio 0.0–1.0
 * @returns {'Low'|'Medium'|'High'} Density label
 */
const ratioToLabel = (ratio) => {
  if (ratio < 0.35) return 'Low';
  if (ratio < 0.70) return 'Medium';
  return 'High';
};

/**
 * Simulates one tick of crowd data for all zones.
 * @param {string} phase - Game phase key
 * @returns {object} Map of zoneId → { ratio, label, count, capacity }
 */
const simulateTick = (phase = _currentPhase) => {
  const multipliers = PHASE_MULTIPLIERS[phase] || PHASE_MULTIPLIERS.pre_match;
  const state = {};

  Object.keys(ZONE_CAPACITIES).forEach(zoneId => {
    const base = multipliers[zoneId] ?? 0.15;
    const ratio = gaussianNoise(base, 0.05);
    const capacity = ZONE_CAPACITIES[zoneId];
    state[zoneId] = {
      ratio: parseFloat(ratio.toFixed(3)),
      label: ratioToLabel(ratio),
      count: Math.floor(ratio * capacity),
      capacity,
    };
  });

  _crowdState = state;
  _currentPhase = phase;
  _lastUpdated = Date.now();
  return state;
};

/**
 * Returns short-term congestion prediction for a zone.
 * Uses linear extrapolation from current phase multipliers.
 * @param {string} zoneId - Zone to predict
 * @param {number} minutesAhead - How far ahead to predict (default 5)
 * @returns {{ predicted: string, trend: 'increasing'|'stable'|'decreasing' }}
 */
const predictCongestion = (zoneId, minutesAhead = 5) => {
  const phases = ['pre_match', 'first_half', 'halftime', 'second_half', 'post_match'];
  const currentIdx = phases.indexOf(_currentPhase);
  const nextPhase = phases[Math.min(currentIdx + 1, phases.length - 1)];

  const currentRatio = _crowdState[zoneId]?.ratio ?? 0.2;
  const nextMultiplier = PHASE_MULTIPLIERS[nextPhase]?.[zoneId] ?? 0.15;

  const blendFactor = Math.min(minutesAhead / 20, 1); // 20 min ≈ full phase transition
  const predictedRatio = currentRatio * (1 - blendFactor) + nextMultiplier * blendFactor;

  const trend = predictedRatio > currentRatio + 0.05
    ? 'increasing'
    : predictedRatio < currentRatio - 0.05
    ? 'decreasing'
    : 'stable';

  return { predicted: ratioToLabel(predictedRatio), trend };
};

/**
 * Merges live Firebase RTDB crowd data into the simulation state.
 * Firebase values override the simulated values when available.
 * @param {object} firebaseData - Map of zoneId → 'Low'|'Medium'|'High'
 */
const mergeFirebaseData = (firebaseData = {}) => {
  Object.entries(firebaseData).forEach(([zoneId, label]) => {
    if (_crowdState[zoneId]) {
      _crowdState[zoneId].label = label;
      // Back-calculate approximate ratio from label
      _crowdState[zoneId].ratio = label === 'High' ? 0.80 : label === 'Medium' ? 0.50 : 0.15;
    }
  });
  _lastUpdated = Date.now();
};

/**
 * Returns the current density label for a zone.
 * @param {string} zoneId
 * @returns {'Low'|'Medium'|'High'}
 */
const getDensity = (zoneId) => _crowdState[zoneId]?.label ?? 'Low';

/**
 * Returns the full crowd state snapshot.
 * @returns {object}
 */
const getCrowdState = () => ({ ..._crowdState });

/**
 * Returns all hot-spot zones above a given density threshold.
 * @param {'Medium'|'High'} threshold
 * @returns {string[]} Array of zone IDs
 */
const getHotspots = (threshold = 'High') => {
  const order = { Low: 0, Medium: 1, High: 2 };
  return Object.entries(_crowdState)
    .filter(([, s]) => order[s.label] >= order[threshold])
    .map(([id]) => id);
};

/**
 * Returns crowd state metadata.
 * @returns {{ phase: string, lastUpdated: number, zoneCount: number }}
 */
const getMetadata = () => ({
  phase: _currentPhase,
  lastUpdated: _lastUpdated,
  zoneCount: Object.keys(_crowdState).length,
});

// Initialise with a pre-match simulation on module load
simulateTick('pre_match');

module.exports = {
  simulateTick,
  predictCongestion,
  mergeFirebaseData,
  getDensity,
  getCrowdState,
  getHotspots,
  getMetadata,
  ratioToLabel,
  gaussianNoise,
};
