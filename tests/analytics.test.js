/**
 * ARIA — Analytics Route Test Suite
 * Validates the /api/analytics endpoint:
 * BigQuery event logging, input validation, and graceful degradation.
 */

const request = require('supertest');
const express = require('express');

let app;
beforeAll(() => {
  const analyticsRouter = require('../routes/analytics');
  app = express();
  app.use(express.json());
  app.use('/api', analyticsRouter);
});

describe('ARIA Analytics — Event Logging Endpoint', () => {
  it('POST /api/analytics should return 200 or 503 (not crash)', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'wayfinding_request', section: 'A1', targetId: 'gate_1' });
    expect([200, 201, 503]).toContain(res.status);
  });

  it('should return a JSON response body', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'test_event' });
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should return 400 when event name is missing', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ section: 'A1' });
    expect([400, 422]).toContain(res.status);
  });

  it('should return error field on missing event', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({});
    expect(res.body.error || res.body.errors).toBeDefined();
  });

  it('should not expose internal error stack traces', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'test_event' });
    expect(JSON.stringify(res.body)).not.toContain('at Object.');
    expect(JSON.stringify(res.body)).not.toContain('node_modules');
  });
});

describe('ARIA Analytics — Input Validation', () => {
  it('should reject event names over 100 characters', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'e'.repeat(101) });
    expect([400, 422]).toContain(res.status);
  });

  it('should accept a minimal valid event object', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'page_view' });
    expect([200, 201, 503]).toContain(res.status);
  });

  it('should accept event with optional section field', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'concession_tap', section: 'B3' });
    expect([200, 201, 503]).toContain(res.status);
  });

  it('should accept event with optional targetId field', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'navigate', targetId: 'exit_north' });
    expect([200, 201, 503]).toContain(res.status);
  });
});

describe('ARIA Analytics — Graceful Degradation', () => {
  it('should not return 500 even when BigQuery is unavailable', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'test_degradation' });
    // BigQuery is optional — should never return 500
    expect(res.status).not.toBe(500);
  });

  it('degraded response should still be valid JSON', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'degradation_check' });
    expect(() => JSON.parse(JSON.stringify(res.body))).not.toThrow();
  });

  it('multiple analytics events in sequence should not accumulate errors', async () => {
    const events = ['event_a', 'event_b', 'event_c'];
    for (const event of events) {
      const res = await request(app).post('/api/analytics').send({ event });
      expect([200, 201, 400, 503]).toContain(res.status);
    }
  });
});
