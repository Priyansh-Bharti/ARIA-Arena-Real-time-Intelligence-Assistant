/**
 * ARIA — Wayfinding API Route (v3)
 * HTTP adapter layer — delegates ALL routing decisions to the Decision Engine.
 * This file handles only: request validation, engine calls, response formatting.
 */

'use strict';

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const decisionEngine = require('../engine/decisionEngine');
const crowdEngine    = require('../engine/crowdEngine');

const router = express.Router();

// ─── Validation middleware ────────────────────────────────────────────────────
const validateResolve = [
  body('targetId').isString().trim().notEmpty().withMessage('targetId is required'),
  body('startId').optional().isString().trim(),
  body('mode').optional().isIn(decisionEngine.getSupportedModes())
    .withMessage(`mode must be one of: ${decisionEngine.getSupportedModes().join(', ')}`),
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
 * Computes the optimal Dijkstra route from start → target using the Decision Engine.
 * Live crowd state from the Crowd Engine is applied automatically.
 */
router.post('/resolve', validateResolve, (req, res) => {
  const { targetId, startId = 'entrance', mode = 'balanced', section } = req.body;

  try {
    // Fetch live crowd state from the Crowd Engine
    const crowdState = crowdEngine.getCrowdState();

    // Delegate entirely to the Decision Engine — no routing logic here
    const route = decisionEngine.computeRoute(startId, targetId, mode, crowdState);

    // Augment with prediction for destination zone
    const prediction = crowdEngine.predictCongestion(targetId, 5);

    res.json({
      success: true,
      section: section || 'Unknown',
      ...route,
      destination: {
        ...route.routeSteps.at(-1),
        currentDensity: crowdEngine.getDensity(targetId),
        prediction,
      },
      crowdMetadata: crowdEngine.getMetadata(),
    });
  } catch (err) {
    const status = err.message.includes('Unknown') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/wayfinding/zones
 * Returns all navigable venue zones, optional filter by type.
 */
router.get('/zones', [
  query('type').optional().isString().trim(),
], (req, res) => {
  const zones = decisionEngine.getZones(req.query.type);
  res.json(zones);
});

/**
 * GET /api/wayfinding/modes
 * Returns all supported routing modes with descriptions.
 */
router.get('/modes', (req, res) => {
  res.json({
    supported: decisionEngine.getSupportedModes(),
    descriptions: {
      balanced:       'Default: shortest path with moderate crowd penalties',
      fast_exit:      'Shortest distance only — ignores crowd density',
      low_crowd:      'Avoids congested zones — may be longer but less crowded',
      accessible:     'Prefers accessible routes — avoids stairs and narrow passages',
      family_friendly:'Avoids high-density zones — suitable for families with children',
    }
  });
});

/**
 * GET /api/wayfinding/crowd
 * Returns current crowd state and hotspots from the Crowd Engine.
 */
router.get('/crowd', (req, res) => {
  res.json({
    state: crowdEngine.getCrowdState(),
    hotspots: crowdEngine.getHotspots('High'),
    metadata: crowdEngine.getMetadata(),
  });
});

/**
 * GET /api/wayfinding/graph
 * Returns the venue graph structure for debugging or visualisation.
 */
router.get('/graph', (req, res) => {
  res.json({
    nodeCount: decisionEngine.VENUE_ZONES.length,
    edgeCount: decisionEngine.GRAPH_EDGES.length,
    nodes: decisionEngine.VENUE_ZONES,
    edges: decisionEngine.GRAPH_EDGES.map(([from, to, dist]) => ({ from, to, dist })),
  });
});

module.exports = router;
