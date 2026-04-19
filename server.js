/**
 * ARIA — Production Express Server
 * Modular, security-hardened, and enterprise-ready backend for the ARIA Stadium PWA.
 * Integrates Google Cloud services including BigQuery analytics and Firebase Admin.
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Modular Route Imports
const analyticsRouter = require('./routes/analytics');
const venueRouter = require('./routes/venue');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Security: Helmet (HTTP Headers) ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false // Custom CSP enforced via meta tag in index.html
}));

// ─── Security: CORS Whitelist ──────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:8080',
  'https://aria-stadium-pro-93244820981.us-central1.run.app'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Violation: Unauthorized origin blocked.'));
    }
  }
}));

// ─── Security: Rate Limiting (DDoS Protection) ────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Static Assets ─────────────────────────────────────────────────────────────
app.use(express.static(__dirname));

// ─── Modular API Routes ────────────────────────────────────────────────────────
app.use('/api', analyticsRouter);
app.use('/api/venue', venueRouter);

// ─── SPA Fallback (PWA Routing) ───────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Server Launch ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ARIA Enterprise] Server listening on port ${PORT}`);
  });
}

module.exports = app; // Export for supertest integration testing
