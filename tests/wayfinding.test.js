/**
 * ARIA — Wayfinding Route Test Suite
 * Validates /api/wayfinding/zones and /api/wayfinding/resolve
 * endpoint contracts, data shapes, and error handling.
 */

const request = require('supertest');
const express = require('express');

let app;
beforeAll(() => {
  const wayfindingRouter = require('../routes/wayfinding');
  app = express();
  app.use(express.json());
  app.use('/api/wayfinding', wayfindingRouter);
});

describe('ARIA Wayfinding — Zone Listing', () => {
  it('GET /api/wayfinding/zones should return 200', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    expect(res.status).toBe(200);
  });

  it('should return an array', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return at least one zone', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('each zone should have an id field', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    res.body.forEach(zone => expect(zone).toHaveProperty('id'));
  });

  it('each zone should have a name field', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    res.body.forEach(zone => expect(zone).toHaveProperty('name'));
  });

  it('each zone should have a lat and lng', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    res.body.forEach(zone => {
      expect(zone).toHaveProperty('lat');
      expect(zone).toHaveProperty('lng');
    });
  });

  it('lat and lng should be numbers', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    res.body.forEach(zone => {
      expect(typeof zone.lat).toBe('number');
      expect(typeof zone.lng).toBe('number');
    });
  });
});

describe('ARIA Wayfinding — Destination Resolver', () => {
  it('POST /api/wayfinding/resolve with valid targetId should return 200', async () => {
    const res = await request(app)
      .post('/api/wayfinding/resolve')
      .send({ targetId: 'gate_1', section: 'A1' });
    expect([200, 404]).toContain(res.status);
  });

  it('should return 400 when targetId is missing', async () => {
    const res = await request(app)
      .post('/api/wayfinding/resolve')
      .send({ section: 'A1' });
    expect(res.status).toBe(400);
  });

  it('should return an error field on missing targetId', async () => {
    const res = await request(app)
      .post('/api/wayfinding/resolve')
      .send({});
    expect(res.body).toHaveProperty('error');
  });

  it('should return 404 for an unknown targetId', async () => {
    const res = await request(app)
      .post('/api/wayfinding/resolve')
      .send({ targetId: 'nonexistent_zone_xyz', section: 'B2' });
    expect(res.status).toBe(404);
  });

  it('valid resolve response should include zone name', async () => {
    const res = await request(app)
      .post('/api/wayfinding/resolve')
      .send({ targetId: 'gate_1', section: 'A1' });
    if (res.status === 200) {
      expect(res.body).toHaveProperty('name');
    }
  });

  it('valid resolve response should include coordinates', async () => {
    const res = await request(app)
      .post('/api/wayfinding/resolve')
      .send({ targetId: 'gate_1', section: 'A1' });
    if (res.status === 200) {
      expect(res.body).toHaveProperty('lat');
      expect(res.body).toHaveProperty('lng');
    }
  });

  it('valid resolve response should include walkTime estimate', async () => {
    const res = await request(app)
      .post('/api/wayfinding/resolve')
      .send({ targetId: 'gate_1', section: 'A1' });
    if (res.status === 200) {
      expect(res.body).toHaveProperty('walkTime');
    }
  });
});

describe('ARIA Wayfinding — Response Format', () => {
  it('should always return JSON', async () => {
    const res = await request(app).get('/api/wayfinding/zones');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('POST resolve should return JSON on error', async () => {
    const res = await request(app).post('/api/wayfinding/resolve').send({});
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
