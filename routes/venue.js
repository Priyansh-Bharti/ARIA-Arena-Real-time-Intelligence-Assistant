const express = require('express');
const router = express.Router();

/**
 * GET /api/venue/zones
 * Returns the live venue zone definitions with crowd density codes.
 */
router.get('/zones', (req, res) => {
  const zones = [
    { id: 'gate_1', name: 'Gate 1 North Entry', type: 'GATE', status: 'open' },
    { id: 'gate_2', name: 'Gate 2 South Entry', type: 'GATE', status: 'open' },
    { id: 'food_north', name: 'North Stand Concessions', type: 'FOOD', status: 'open' },
    { id: 'toilets_east', name: 'East Wing Washrooms', type: 'UTILITY', status: 'open' },
    { id: 'medic_centre', name: 'Medical Centre', type: 'EMERGENCY', status: 'standby' },
    { id: 'vip_lounge', name: 'VIP Hospitality Lounge', type: 'VIP', status: 'open' }
  ];
  res.json({ zones, count: zones.length });
});

/**
 * GET /api/venue/status
 * Returns the current live venue operating status (mocked for hackathon).
 */
router.get('/status', (req, res) => {
  res.json({
    game_phase: 'Live',
    crowd_density: {
      gate_1: 'Medium',
      gate_2: 'Low',
      food_north: 'High'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
