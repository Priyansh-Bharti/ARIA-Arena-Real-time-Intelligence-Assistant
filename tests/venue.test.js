/**
 * ARIA — Venue Routes Test Suite
 * Validates the /api/venue/* endpoints:
 * zone listing, status reporting, and data shape contracts.
 */

const request = require('supertest');

// ─── Build a minimal test server with the venue router ───────────────────────
let app;
beforeAll(() => {
  // Require the real express app (server.js exports are not needed — build inline)
  const express = require('express');
  const venueRouter = require('../routes/venue');
  app = express();
  app.use(express.json());
  app.use('/api/venue', venueRouter);
});

describe('ARIA Venue — Zone Listing', () => {
  it('GET /api/venue/zones should return 200', async () => {
    const res = await request(app).get('/api/venue/zones');
    expect(res.status).toBe(200);
  });

  it('should return an array of zones', async () => {
    const res = await request(app).get('/api/venue/zones');
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('each zone should have an id field', async () => {
    const res = await request(app).get('/api/venue/zones');
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id');
    }
  });

  it('each zone should have a name field', async () => {
    const res = await request(app).get('/api/venue/zones');
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('name');
    }
  });

  it('each zone should have a type field', async () => {
    const res = await request(app).get('/api/venue/zones');
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('type');
    }
  });
});

describe('ARIA Venue — Status Endpoint', () => {
  it('GET /api/venue/status should return 200', async () => {
    const res = await request(app).get('/api/venue/status');
    expect(res.status).toBe(200);
  });

  it('status response should contain game_phase field', async () => {
    const res = await request(app).get('/api/venue/status');
    expect(res.body).toHaveProperty('game_phase');
  });

  it('status response should contain crowd_density field', async () => {
    const res = await request(app).get('/api/venue/status');
    expect(res.body).toHaveProperty('crowd_density');
  });

  it('crowd_density should be an object', async () => {
    const res = await request(app).get('/api/venue/status');
    expect(typeof res.body.crowd_density).toBe('object');
  });

  it('should return JSON content type', async () => {
    const res = await request(app).get('/api/venue/status');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('ARIA Venue — Data Integrity', () => {
  it('zones count should be greater than 0', async () => {
    const res = await request(app).get('/api/venue/zones');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('zone types should only be valid venue types', async () => {
    const validTypes = ['food', 'restroom', 'exit', 'gate', 'seating', 'medical', 'staff'];
    const res = await request(app).get('/api/venue/zones');
    res.body.forEach(zone => {
      expect(validTypes).toContain(zone.type);
    });
  });

  it('status game_phase should be a non-empty string', async () => {
    const res = await request(app).get('/api/venue/status');
    expect(typeof res.body.game_phase).toBe('string');
    expect(res.body.game_phase.length).toBeGreaterThan(0);
  });
});
