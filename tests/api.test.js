/**
 * ARIA — HTTP API Integration Tests (supertest)
 * Tests live Express routes to validate proper API behavior under real HTTP conditions.
 */

const request = require('supertest');
const app = require('../server');

describe('ARIA API Integration — Health & Venue Routes', () => {

  test('GET /api/health returns 200 with OK status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ARIA Stadium Assistant');
  });

  test('GET /api/venue/zones returns a valid zones array', async () => {
    const res = await request(app).get('/api/venue/zones');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.zones)).toBe(true);
    expect(res.body.zones.length).toBeGreaterThan(0);
    expect(res.body.zones[0]).toHaveProperty('id');
  });

  test('GET /api/venue/status returns live game phase data', async () => {
    const res = await request(app).get('/api/venue/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('game_phase');
    expect(res.body).toHaveProperty('crowd_density');
  });

  test('POST /api/analytics with valid event returns 200', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ event: 'USER_WAYFINDING_REQUEST' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/analytics with missing event returns 400', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

});
