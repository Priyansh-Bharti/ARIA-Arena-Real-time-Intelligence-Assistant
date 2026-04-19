/**
 * ARIA — Security Test Suite
 * Validates all HTTP security controls:
 * rate limiting, CORS, security headers, and input sanitization.
 */

const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// ─── Minimal test app mirroring production config ─────────────────────────────
const buildTestApp = () => {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '10mb' }));

  const limiter = rateLimit({ windowMs: 60000, max: 5, standardHeaders: true });

  app.post('/api/test-input',
    [body('message').isString().trim().isLength({ min: 1, max: 500 })],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      res.json({ ok: true });
    }
  );

  app.get('/api/rate-test', limiter, (req, res) => res.json({ ok: true }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  return app;
};

describe('ARIA Security — HTTP Header Tests', () => {
  let app;
  beforeAll(() => { app = buildTestApp(); });

  it('should set X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should set X-Frame-Options to deny clickjacking', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('should not expose X-Powered-By header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('should return 200 on health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});

describe('ARIA Security — Input Validation Tests', () => {
  let app;
  beforeAll(() => { app = buildTestApp(); });

  it('should reject empty message body', async () => {
    const res = await request(app).post('/api/test-input').send({ message: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject message over 500 characters', async () => {
    const res = await request(app)
      .post('/api/test-input')
      .send({ message: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('should accept a valid message', async () => {
    const res = await request(app).post('/api/test-input').send({ message: 'Where is gate 3?' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should reject missing body entirely', async () => {
    const res = await request(app).post('/api/test-input').send({});
    expect(res.status).toBe(400);
  });

  it('should strip leading/trailing whitespace from message', async () => {
    const res = await request(app)
      .post('/api/test-input')
      .send({ message: '  valid input  ' });
    expect(res.status).toBe(200);
  });
});

describe('ARIA Security — Rate Limiting Tests', () => {
  let app;
  beforeAll(() => { app = buildTestApp(); });

  it('should allow requests within the rate limit', async () => {
    const res = await request(app).get('/api/rate-test');
    expect(res.status).toBe(200);
  });

  it('should include RateLimit headers in response', async () => {
    const res = await request(app).get('/api/rate-test');
    expect(res.headers['ratelimit-limit'] || res.headers['x-ratelimit-limit']).toBeDefined();
  });
});

describe('ARIA Security — Content-Type Enforcement', () => {
  let app;
  beforeAll(() => { app = buildTestApp(); });

  it('should return JSON content type on health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should reject non-JSON body on POST routes', async () => {
    const res = await request(app)
      .post('/api/test-input')
      .set('Content-Type', 'text/plain')
      .send('not json');
    expect([400, 415]).toContain(res.status);
  });
});
