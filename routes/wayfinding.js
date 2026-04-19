/**
 * ARIA — Wayfinding API Route
 * Resolves fan navigation requests to structured route objects.
 */

const express = require('express');
const router = express.Router();

const VENUE_ZONES = [
  { id: 'gate_1', name: 'Gate 1 North Entry', lat: 51.5570, lng: -0.2796, type: 'GATE' },
  { id: 'gate_2', name: 'Gate 2 South Entry', lat: 51.5548, lng: -0.2801, type: 'GATE' },
  { id: 'food_north', name: 'North Stand Concessions', lat: 51.5568, lng: -0.2788, type: 'FOOD' },
  { id: 'toilets_east', name: 'East Wing Washrooms', lat: 51.5559, lng: -0.2779, type: 'UTILITY' },
  { id: 'medic_centre', name: 'Medical Centre', lat: 51.5555, lng: -0.2805, type: 'EMERGENCY' },
  { id: 'vip_lounge', name: 'VIP Hospitality Lounge', lat: 51.5562, lng: -0.2792, type: 'VIP' }
];

/**
 * POST /api/wayfinding/resolve
 * Resolves a destination ID to full coordinate and route metadata.
 */
router.post('/resolve', (req, res) => {
  const { targetId, userSection } = req.body;

  if (!targetId) {
    return res.status(400).json({ error: 'targetId is required.' });
  }

  const zone = VENUE_ZONES.find(z => z.id === targetId);
  if (!zone) {
    return res.status(404).json({ error: `Unknown destination: ${targetId}` });
  }

  res.json({
    zone,
    userSection: userSection || 'Unknown',
    estimatedWalkTime: `${Math.floor(Math.random() * 5) + 2} min`,
    routeId: `route_${Date.now()}`
  });
});

/**
 * GET /api/wayfinding/zones
 * Returns all navigable venue zones.
 */
router.get('/zones', (req, res) => {
  res.json({ zones: VENUE_ZONES, count: VENUE_ZONES.length });
});

module.exports = router;
