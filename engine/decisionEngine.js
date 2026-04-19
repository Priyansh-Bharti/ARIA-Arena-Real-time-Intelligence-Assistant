/**
 * ARIA — Decision Engine
 * Pure deterministic routing module using Dijkstra's shortest-path algorithm
 * with live crowd-density penalties and priority routing modes.
 *
 * Architecture: This module makes ALL navigation decisions.
 * AI (Gemini) is NEVER consulted for routing — only for phrasing the result.
 * This prevents prompt-injection attacks and ensures explainable, auditable routes.
 */

'use strict';

// ─── Venue Graph — Nodes ───────────────────────────────────────────────────────
const VENUE_ZONES = [
  { id: 'entrance',     name: 'Main Entrance',           lat: 51.5570, lng: -0.2800, type: 'gate',     accessible: true  },
  { id: 'gate_1',       name: 'Gate 1 North Entry',      lat: 51.5570, lng: -0.2796, type: 'gate',     accessible: true  },
  { id: 'gate_2',       name: 'Gate 2 South Entry',      lat: 51.5548, lng: -0.2801, type: 'gate',     accessible: true  },
  { id: 'gate_3',       name: 'Gate 3 East Entry',       lat: 51.5560, lng: -0.2780, type: 'gate',     accessible: false },
  { id: 'gate_4',       name: 'Gate 4 West Entry',       lat: 51.5560, lng: -0.2820, type: 'gate',     accessible: true  },
  { id: 'food_north',   name: 'North Stand Concessions', lat: 51.5568, lng: -0.2788, type: 'food',     accessible: true  },
  { id: 'food_south',   name: 'South Stand Concessions', lat: 51.5550, lng: -0.2795, type: 'food',     accessible: true  },
  { id: 'restroom_e',   name: 'East Wing Restrooms',     lat: 51.5559, lng: -0.2779, type: 'restroom', accessible: true  },
  { id: 'restroom_w',   name: 'West Wing Restrooms',     lat: 51.5559, lng: -0.2815, type: 'restroom', accessible: true  },
  { id: 'medic_centre', name: 'Medical Centre',          lat: 51.5555, lng: -0.2805, type: 'medical',  accessible: true  },
  { id: 'exit_north',   name: 'Emergency Exit North',    lat: 51.5572, lng: -0.2798, type: 'exit',     accessible: true  },
  { id: 'exit_south',   name: 'Emergency Exit South',    lat: 51.5546, lng: -0.2798, type: 'exit',     accessible: true  },
  { id: 'seating_a',    name: 'Section A Seating',       lat: 51.5562, lng: -0.2792, type: 'seating',  accessible: true  },
  { id: 'seating_b',    name: 'Section B Seating',       lat: 51.5558, lng: -0.2796, type: 'seating',  accessible: true  },
  { id: 'staff_hub',    name: 'Staff Operations Hub',    lat: 51.5563, lng: -0.2810, type: 'staff',    accessible: false },
];

// ─── Venue Graph — Edges [from, to, baseDistanceMetres] ──────────────────────
const GRAPH_EDGES = [
  ['entrance',   'gate_1',       45],
  ['entrance',   'gate_2',       80],
  ['entrance',   'gate_3',       95],
  ['entrance',   'gate_4',      110],
  ['gate_1',     'food_north',   60],
  ['gate_1',     'seating_a',    80],
  ['gate_1',     'exit_north',   25],
  ['gate_2',     'food_south',   55],
  ['gate_2',     'seating_b',    70],
  ['gate_2',     'exit_south',   30],
  ['gate_3',     'restroom_e',   40],
  ['gate_3',     'seating_a',    65],
  ['gate_4',     'restroom_w',   35],
  ['gate_4',     'seating_b',    60],
  ['gate_4',     'staff_hub',    50],
  ['food_north', 'seating_a',    45],
  ['food_south', 'seating_b',    40],
  ['restroom_e', 'seating_a',    30],
  ['restroom_w', 'seating_b',    30],
  ['seating_a',  'seating_b',    55],
  ['seating_a',  'medic_centre', 70],
  ['seating_b',  'medic_centre', 65],
  ['medic_centre','staff_hub',   40],
  ['staff_hub',  'exit_north',   75],
  ['staff_hub',  'exit_south',   80],
];

// ─── Routing Mode Penalty Tables ──────────────────────────────────────────────
const ROUTING_MODES = {
  /** Minimise total path distance only */
  fast_exit:       { crowd: { High: 0,   Medium: 0,   Low: 0   }, inaccessiblePenalty: 0   },
  /** Avoid congested zones — apply heavy crowd penalties */
  low_crowd:       { crowd: { High: 200, Medium: 80,  Low: 0   }, inaccessiblePenalty: 0   },
  /** Prefer accessible routes — penalise inaccessible nodes heavily */
  accessible:      { crowd: { High: 60,  Medium: 20,  Low: 0   }, inaccessiblePenalty: 500 },
  /** Like accessible but also avoids high-density zones for families */
  family_friendly: { crowd: { High: 150, Medium: 60,  Low: 0   }, inaccessiblePenalty: 400 },
  /** Default balanced mode */
  balanced:        { crowd: { High: 60,  Medium: 20,  Low: 0   }, inaccessiblePenalty: 0   },
};

/**
 * Builds a crowd-aware weighted adjacency graph.
 * @param {object} crowdState - Map of zoneId → { label: 'Low'|'Medium'|'High' }
 * @param {string} mode - Routing mode key
 * @returns {object} Weighted adjacency list
 */
const buildGraph = (crowdState = {}, mode = 'balanced') => {
  const penalties = ROUTING_MODES[mode] || ROUTING_MODES.balanced;
  const graph = {};
  VENUE_ZONES.forEach(z => { graph[z.id] = []; });

  GRAPH_EDGES.forEach(([from, to, baseDist]) => {
    const densityFrom = crowdState[from]?.label ?? 'Low';
    const densityTo   = crowdState[to]?.label   ?? 'Low';
    const crowdPenalty = penalties.crowd[densityFrom] + penalties.crowd[densityTo];

    // Accessible mode: penalise edges through inaccessible nodes
    const fromZone = VENUE_ZONES.find(z => z.id === from);
    const toZone   = VENUE_ZONES.find(z => z.id === to);
    const accessPenalty =
      (!fromZone?.accessible ? penalties.inaccessiblePenalty : 0) +
      (!toZone?.accessible   ? penalties.inaccessiblePenalty : 0);

    const weight = baseDist + crowdPenalty + accessPenalty;
    graph[from].push({ node: to,   weight });
    graph[to].push(  { node: from, weight });
  });

  return graph;
};

/**
 * Dijkstra's algorithm — computes optimal path accounting for
 * crowd-density and accessibility penalties.
 * @param {object} graph - Adjacency map from buildGraph()
 * @param {string} start - Source zone ID
 * @param {string} end   - Target zone ID
 * @returns {{ path: string[], cost: number }}
 */
const dijkstra = (graph, start, end) => {
  const dist  = {};
  const prev  = {};
  const visited = new Set();
  const nodes = Object.keys(graph);

  nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[start] = 0;

  while (visited.size < nodes.length) {
    const unvisited = nodes.filter(n => !visited.has(n));
    if (!unvisited.length) break;

    const current = unvisited.reduce((min, n) => dist[n] < dist[min] ? n : min, unvisited[0]);
    if (dist[current] === Infinity || current === end) break;
    visited.add(current);

    (graph[current] || []).forEach(({ node: nb, weight }) => {
      if (visited.has(nb)) return;
      const alt = dist[current] + weight;
      if (alt < dist[nb]) { dist[nb] = alt; prev[nb] = current; }
    });
  }

  // Reconstruct path from prev chain
  const path = [];
  let cur  = end;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  return { path: path[0] === start ? path : [], cost: dist[end] };
};

/**
 * High-level route computation entry point.
 * @param {string} startId    - Origin zone ID (usually 'entrance')
 * @param {string} endId      - Destination zone ID
 * @param {string} mode       - Routing mode: 'balanced'|'fast_exit'|'low_crowd'|'accessible'|'family_friendly'
 * @param {object} crowdState - Live crowd data from CrowdEngine.getCrowdState()
 * @returns {{
 *   pathIds: string[],
 *   routeSteps: object[],
 *   totalCostMetres: number,
 *   walkTime: string,
 *   mode: string,
 *   crowdPenaltiesApplied: boolean,
 *   accessibleRoute: boolean,
 * }}
 */
const computeRoute = (startId, endId, mode = 'balanced', crowdState = {}) => {
  if (!VENUE_ZONES.find(z => z.id === startId)) throw new Error(`Unknown start zone: ${startId}`);
  if (!VENUE_ZONES.find(z => z.id === endId))   throw new Error(`Unknown end zone: ${endId}`);

  const graph = buildGraph(crowdState, mode);
  const { path, cost } = dijkstra(graph, startId, endId);

  if (!path.length) throw new Error(`No route found from ${startId} to ${endId}`);

  const routeSteps = path.map(id => VENUE_ZONES.find(z => z.id === id)).filter(Boolean);
  const walkTimeSecs = Math.round(cost / 1.4); // 1.4 m/s average walking speed
  const walkTime = walkTimeSecs < 60 ? `${walkTimeSecs}s` : `${Math.ceil(walkTimeSecs / 60)} min`;
  const accessibleRoute = routeSteps.every(z => z.accessible);

  return {
    pathIds: path,
    routeSteps,
    totalCostMetres: cost,
    walkTime,
    mode,
    crowdPenaltiesApplied: Object.keys(crowdState).length > 0,
    accessibleRoute,
    algorithm: 'dijkstra',
  };
};

/**
 * Returns all zones, optionally filtered by type.
 * @param {string} [type] - Optional type filter ('gate', 'food', etc.)
 * @returns {object[]}
 */
const getZones = (type) => type ? VENUE_ZONES.filter(z => z.type === type) : VENUE_ZONES;

/**
 * Returns the supported routing modes.
 * @returns {string[]}
 */
const getSupportedModes = () => Object.keys(ROUTING_MODES);

module.exports = { computeRoute, getZones, getSupportedModes, dijkstra, buildGraph, VENUE_ZONES, GRAPH_EDGES };
