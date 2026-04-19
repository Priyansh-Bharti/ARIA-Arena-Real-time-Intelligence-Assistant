/**
 * ARIA — Wayfinding API Route (v2 — Dijkstra Pathfinding)
 * Uses Dijkstra's shortest-path algorithm with live crowd-density penalties
 * to compute the optimal, deterministic route through the stadium graph.
 *
 * Architecture: AI never controls routing. Gemini only phrases the response.
 * The path decision is always made by this deterministic engine.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// ─── Venue Zone Graph (Nodes) ─────────────────────────────────────────────────
const VENUE_ZONES = [
  { id: 'entrance',     name: 'Main Entrance',            lat: 51.5570, lng: -0.2800, type: 'gate' },
  { id: 'gate_1',       name: 'Gate 1 North Entry',       lat: 51.5570, lng: -0.2796, type: 'gate' },
  { id: 'gate_2',       name: 'Gate 2 South Entry',       lat: 51.5548, lng: -0.2801, type: 'gate' },
  { id: 'gate_3',       name: 'Gate 3 East Entry',        lat: 51.5560, lng: -0.2780, type: 'gate' },
  { id: 'gate_4',       name: 'Gate 4 West Entry',        lat: 51.5560, lng: -0.2820, type: 'gate' },
  { id: 'food_north',   name: 'North Stand Concessions',  lat: 51.5568, lng: -0.2788, type: 'food' },
  { id: 'food_south',   name: 'South Stand Concessions',  lat: 51.5550, lng: -0.2795, type: 'food' },
  { id: 'restroom_e',   name: 'East Wing Restrooms',      lat: 51.5559, lng: -0.2779, type: 'restroom' },
  { id: 'restroom_w',   name: 'West Wing Restrooms',      lat: 51.5559, lng: -0.2815, type: 'restroom' },
  { id: 'medic_centre', name: 'Medical Centre',           lat: 51.5555, lng: -0.2805, type: 'medical' },
  { id: 'exit_north',   name: 'Emergency Exit North',     lat: 51.5572, lng: -0.2798, type: 'exit' },
  { id: 'exit_south',   name: 'Emergency Exit South',     lat: 51.5546, lng: -0.2798, type: 'exit' },
  { id: 'seating_a',    name: 'Section A Seating',        lat: 51.5562, lng: -0.2792, type: 'seating' },
  { id: 'seating_b',    name: 'Section B Seating',        lat: 51.5558, lng: -0.2796, type: 'seating' },
  { id: 'staff_hub',    name: 'Staff Operations Hub',     lat: 51.5563, lng: -0.2810, type: 'staff' },
];

// ─── Venue Graph (Edges — adjacency with base distances in metres) ────────────
// Each edge: [from, to, baseDistance]
const GRAPH_EDGES = [
  ['entrance',   'gate_1',     45],
  ['entrance',   'gate_2',     80],
  ['entrance',   'gate_3',     95],
  ['entrance',   'gate_4',    110],
  ['gate_1',     'food_north', 60],
  ['gate_1',     'seating_a',  80],
  ['gate_1',     'exit_north', 25],
  ['gate_2',     'food_south', 55],
  ['gate_2',     'seating_b',  70],
  ['gate_2',     'exit_south', 30],
  ['gate_3',     'restroom_e', 40],
  ['gate_3',     'seating_a',  65],
  ['gate_4',     'restroom_w', 35],
  ['gate_4',     'seating_b',  60],
  ['gate_4',     'staff_hub',  50],
  ['food_north', 'seating_a',  45],
  ['food_south', 'seating_b',  40],
  ['restroom_e', 'seating_a',  30],
  ['restroom_w', 'seating_b',  30],
  ['seating_a',  'seating_b',  55],
  ['seating_a',  'medic_centre', 70],
  ['seating_b',  'medic_centre', 65],
  ['medic_centre','staff_hub',  40],
  ['staff_hub',  'exit_north', 75],
  ['staff_hub',  'exit_south', 80],
];

/**
 * Builds a weighted adjacency map from the edge list.
 * @param {object} crowdDensity - Map of zoneId → density level
 * @returns {object} adjacency map with crowd-penalised weights
 */
const buildGraph = (crowdDensity = {}) => {
  const graph = {};
  VENUE_ZONES.forEach(z => { graph[z.id] = []; });

  const CROWD_PENALTY = { High: 60, Medium: 20, Low: 0 };

  GRAPH_EDGES.forEach(([from, to, dist]) => {
    const penaltyFrom = CROWD_PENALTY[crowdDensity[from]] || 0;
    const penaltyTo   = CROWD_PENALTY[crowdDensity[to]]   || 0;
    const weight = dist + penaltyFrom + penaltyTo;
    graph[from].push({ node: to,   weight });
    graph[to].push(  { node: from, weight });   // undirected
  });
  return graph;
};

/**
 * Dijkstra's shortest-path algorithm.
 * Returns the minimum-cost path from start → end through the venue graph.
 * @param {object} graph - Adjacency map built by buildGraph()
 * @param {string} start - Source zone ID
 * @param {string} end   - Target zone ID
 * @returns {{ path: string[], cost: number }} Shortest path and total cost
 */
const dijkstra = (graph, start, end) => {
  const dist   = {};
  const prev   = {};
  const visited = new Set();
  const nodes  = Object.keys(graph);

  nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[start] = 0;

  while (visited.size < nodes.length) {
    // Pick unvisited node with smallest dist
    const current = nodes
      .filter(n => !visited.has(n))
      .reduce((min, n) => (dist[n] < dist[min] ? n : min), nodes.find(n => !visited.has(n)));

    if (!current || dist[current] === Infinity) break;
    if (current === end) break;

    visited.add(current);

    (graph[current] || []).forEach(({ node: neighbour, weight }) => {
      if (visited.has(neighbour)) return;
      const alt = dist[current] + weight;
      if (alt < dist[neighbour]) {
        dist[neighbour] = alt;
        prev[neighbour] = current;
      }
    });
  }

  // Reconstruct path
  const path = [];
  let cur = end;
  while (cur) { path.unshift(cur); cur = prev[cur]; }

  return { path: path[0] === start ? path : [], cost: dist[end] };
};

// ─── Validation ───────────────────────────────────────────────────────────────
const validateResolve = [
  body('targetId').isString().trim().notEmpty().withMessage('targetId is required'),
  body('section').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
    next();
  }
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/wayfinding/resolve
 * Computes the optimal Dijkstra path from entrance → targetId
 * with live crowd-density penalties applied to each edge.
 */
router.post('/resolve', validateResolve, (req, res) => {
  const { targetId, section, crowdDensity = {} } = req.body;

  const zone = VENUE_ZONES.find(z => z.id === targetId);
  if (!zone) {
    return res.status(404).json({ error: `Unknown destination: ${targetId}` });
  }

  const start = section ? 'entrance' : 'entrance';
  const graph = buildGraph(crowdDensity);
  const { path, cost } = dijkstra(graph, start, targetId);

  // Resolve full zone objects for each step
  const routeSteps = path.map(id => VENUE_ZONES.find(z => z.id === id)).filter(Boolean);

  // Estimate walk time: avg 1.4 m/s walking speed
  const walkTimeSecs = Math.round(cost / 1.4);
  const walkTime = walkTimeSecs < 60
    ? `${walkTimeSecs}s`
    : `${Math.ceil(walkTimeSecs / 60)} min`;

  res.json({
    targetId,
    name: zone.name,
    lat: zone.lat,
    lng: zone.lng,
    type: zone.type,
    section: section || 'Unknown',
    routeSteps,
    pathIds: path,
    totalCostMetres: cost,
    walkTime,
    algorithm: 'dijkstra',
    crowdPenaltiesApplied: Object.keys(crowdDensity).length > 0
  });
});

/**
 * GET /api/wayfinding/zones
 * Returns all navigable venue zones with type and coordinates.
 */
router.get('/zones', (req, res) => {
  res.json(VENUE_ZONES);
});

/**
 * GET /api/wayfinding/graph
 * Returns the venue graph structure (edges + node count) for debugging/viz.
 */
router.get('/graph', (req, res) => {
  res.json({
    nodeCount: VENUE_ZONES.length,
    edgeCount: GRAPH_EDGES.length,
    nodes: VENUE_ZONES.map(z => z.id),
    edges: GRAPH_EDGES.map(([from, to, dist]) => ({ from, to, dist }))
  });
});

module.exports = router;
