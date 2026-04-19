/**
 * ARIA — Performance Test Suite
 * Validates response times, concurrent request handling,
 * and payload size limits under load conditions.
 */

const request = require('supertest');
const express = require('express');
const helmet = require('helmet');

const buildPerfApp = () => {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '10mb' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));
  app.post('/api/echo', (req, res) => res.json({ echo: req.body }));
  return app;
};

describe('ARIA Performance — Response Time Benchmarks', () => {
  let app;
  beforeAll(() => { app = buildPerfApp(); });

  it('health check should respond within 200ms', async () => {
    const start = Date.now();
    const res = await request(app).get('/api/health');
    const duration = Date.now() - start;
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(200);
  });

  it('POST echo should respond within 200ms', async () => {
    const start = Date.now();
    const res = await request(app).post('/api/echo').send({ data: 'test payload' });
    const duration = Date.now() - start;
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(200);
  });

  it('should handle 10 sequential health checks under 2000ms total', async () => {
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      await request(app).get('/api/health');
    }
    const total = Date.now() - start;
    expect(total).toBeLessThan(2000);
  });
});

describe('ARIA Performance — Concurrent Request Handling', () => {
  let app;
  beforeAll(() => { app = buildPerfApp(); });

  it('should handle 5 concurrent requests without failing', async () => {
    const requests = Array.from({ length: 5 }, () =>
      request(app).get('/api/health')
    );
    const results = await Promise.all(requests);
    results.forEach(res => expect(res.status).toBe(200));
  });

  it('all concurrent responses should contain valid JSON', async () => {
    const requests = Array.from({ length: 5 }, () =>
      request(app).get('/api/health')
    );
    const results = await Promise.all(requests);
    results.forEach(res => {
      expect(res.body).toBeDefined();
      expect(res.body.status).toBe('ok');
    });
  });

  it('should handle mixed GET and POST concurrently without errors', async () => {
    const mixed = [
      request(app).get('/api/health'),
      request(app).post('/api/echo').send({ test: 1 }),
      request(app).get('/api/health'),
      request(app).post('/api/echo').send({ test: 2 }),
    ];
    const results = await Promise.all(mixed);
    results.forEach(res => expect([200, 201]).toContain(res.status));
  });
});

describe('ARIA Performance — Payload Size Handling', () => {
  let app;
  beforeAll(() => { app = buildPerfApp(); });

  it('should accept small payloads efficiently', async () => {
    const res = await request(app).post('/api/echo').send({ message: 'short' });
    expect(res.status).toBe(200);
  });

  it('should accept medium payload (5KB) within time limit', async () => {
    const payload = { data: 'x'.repeat(5000) };
    const start = Date.now();
    const res = await request(app).post('/api/echo').send(payload);
    expect(res.status).toBe(200);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('should not crash on deeply nested JSON payload', async () => {
    const nested = { a: { b: { c: { d: { e: 'deep' } } } } };
    const res = await request(app).post('/api/echo').send(nested);
    expect(res.status).toBe(200);
  });
});

describe('ARIA Performance — Memory Stability', () => {
  let app;
  beforeAll(() => { app = buildPerfApp(); });

  it('should respond consistently after many requests (no memory leak indicator)', async () => {
    // 20 sequential requests — if the server bleeds memory it will slow dramatically
    const times = [];
    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      await request(app).get('/api/health');
      times.push(Date.now() - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeLessThan(100); // avg must stay under 100ms
  });
});
