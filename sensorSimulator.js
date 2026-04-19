/**
 * ARIA — Real-time Venue Sensor Simulator
 * Publishes live crowd density data to Google Firebase RTDB every 5 seconds.
 * Simulates IoT sensor readings across stadium gates and zones using Gaussian noise.
 * 
 * In production, this is replaced by actual IoT hardware feeds.
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

// Guard: only run if Firebase is configured
if (!firebaseConfig.databaseURL) {
  console.log('[ARIA SensorSim] Firebase config missing. Simulator offline.');
  module.exports = {};
  return;
}

const firebaseApp = initializeApp(firebaseConfig, 'sensor-sim');
const db = getDatabase(firebaseApp);

const GATES = [
  { id: 'gate_1', label: 'Gate 1 North', baseDensity: 40 },
  { id: 'gate_2', label: 'Gate 2 South', baseDensity: 35 },
  { id: 'gate_3', label: 'Gate 3 East',  baseDensity: 50 },
  { id: 'gate_4', label: 'Gate 4 West',  baseDensity: 30 },
];

/**
 * Generates Gaussian noise for realistic sensor variance.
 * @returns {number} A normally distributed random number.
 */
const gaussianNoise = () => {
  const u = Math.random(), v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

/**
 * Converts a numeric density score into a human-readable level.
 * @param {number} density - Value between 0 and 100.
 * @returns {'Low'|'Medium'|'High'} Density level string.
 */
const densityLevel = (density) => {
  if (density > 70) return 'High';
  if (density > 40) return 'Medium';
  return 'Low';
};

/**
 * Reads all gate base densities, applies noise, and pushes to Firebase RTDB.
 */
const publishSensorUpdate = () => {
  const updates = {};
  const timestamp = new Date().toISOString();

  GATES.forEach(gate => {
    // Occasional spike events (2% chance per gate per tick)
    if (Math.random() > 0.98) {
      gate.baseDensity = Math.min(100, gate.baseDensity + 25);
    }

    const noise = gaussianNoise() * 6;
    const density = Math.max(0, Math.min(100, parseFloat((gate.baseDensity + noise).toFixed(1))));

    // Mean-reversion: pull back toward 40
    gate.baseDensity += (40 - gate.baseDensity) * 0.05;

    updates[`venue/crowd_density/${gate.id}`] = densityLevel(density);
    updates[`venue/sensor_raw/${gate.id}`] = { density, timestamp };
  });

  update(ref(db), updates)
    .then(() => console.log(`[ARIA SensorSim] Firebase pulse sent at ${timestamp}`))
    .catch(err => console.error('[ARIA SensorSim] Firebase write error:', err.message));
};

// Publish immediately on start, then every 5 seconds
publishSensorUpdate();
const simInterval = setInterval(publishSensorUpdate, 5000);

console.log('[ARIA SensorSim] IoT sensor simulation active (5s interval → Firebase RTDB)');

module.exports = { stop: () => clearInterval(simInterval) };
