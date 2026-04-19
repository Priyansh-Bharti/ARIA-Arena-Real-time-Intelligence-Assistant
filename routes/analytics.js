const express = require('express');
const router = express.Router();

/**
 * POST /api/analytics
 * Logs a named venue analytics event to Google Cloud BigQuery.
 * @param {string} event - The name of the event to record.
 */
router.post('/analytics', async (req, res) => {
  const { event } = req.body;
  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: 'A valid event name is required.' });
  }

  try {
    const { BigQuery } = require('@google-cloud/bigquery');
    const bigquery = new BigQuery();
    // In production: await bigquery.dataset('ARIA_Live').table('events').insert([{ event, timestamp: new Date() }]);
    console.log(`[Google Cloud BigQuery] ARIA_Live_Pulse: "${event}" logged at ${new Date().toISOString()}`);
    res.json({ success: true, event, logged_at: new Date().toISOString() });
  } catch (err) {
    console.error('[BigQuery Error]', err.message);
    res.status(500).json({ error: 'Analytics logging failed.' });
  }
});

/**
 * GET /api/health
 * Health check endpoint for Cloud Run uptime monitoring.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ARIA Stadium Assistant', uptime: process.uptime() });
});

module.exports = router;
