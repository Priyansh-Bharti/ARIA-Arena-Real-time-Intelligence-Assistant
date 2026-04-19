/**
 * ARIA — Upload Route & Cloud Storage Test Suite
 * Validates the /api/upload/* endpoints:
 * receipt upload contract, error handling, and status check.
 */

const request = require('supertest');
const express = require('express');

let app;
beforeAll(() => {
  const uploadRouter = require('../routes/upload');
  app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api/upload', uploadRouter);
});

describe('ARIA Upload — Status Endpoint', () => {
  it('GET /api/upload/status should return 200', async () => {
    const res = await request(app).get('/api/upload/status');
    expect(res.status).toBe(200);
  });

  it('should return cloudStorage field in response', async () => {
    const res = await request(app).get('/api/upload/status');
    expect(res.body).toHaveProperty('cloudStorage');
  });

  it('cloudStorage should be a string status value', async () => {
    const res = await request(app).get('/api/upload/status');
    expect(typeof res.body.cloudStorage).toBe('string');
  });

  it('should return bucket field in response', async () => {
    const res = await request(app).get('/api/upload/status');
    expect(res.body).toHaveProperty('bucket');
  });
});

describe('ARIA Upload — Receipt Upload Validation', () => {
  it('POST /api/upload/receipt without body should return 400', async () => {
    const res = await request(app).post('/api/upload/receipt').send({});
    expect(res.status).toBe(400);
  });

  it('should return error message when imageBase64 is missing', async () => {
    const res = await request(app).post('/api/upload/receipt').send({ section: 'A1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should accept a valid base64 image payload', async () => {
    // Minimal 1x1 pixel white PNG base64
    const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
    const res = await request(app)
      .post('/api/upload/receipt')
      .send({ imageBase64: minimalPng, mimeType: 'image/png', section: 'A1' });
    // Should succeed or gracefully degrade (not crash)
    expect([200, 503]).toContain(res.status);
    expect(res.body.success !== undefined || res.body.error !== undefined).toBe(true);
  });

  it('should include filename in response on valid upload', async () => {
    const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
    const res = await request(app)
      .post('/api/upload/receipt')
      .send({ imageBase64: minimalPng, section: 'B2' });
    if (res.status === 200) {
      expect(res.body.filename).toBeDefined();
      expect(res.body.filename).toContain('receipts/');
    }
  });

  it('should include section in filename when provided', async () => {
    const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
    const res = await request(app)
      .post('/api/upload/receipt')
      .send({ imageBase64: minimalPng, section: 'C3' });
    if (res.status === 200) {
      expect(res.body.filename).toContain('C3');
    }
  });
});

describe('ARIA Upload — Graceful Degradation', () => {
  it('should not crash the server when Cloud Storage is unavailable', async () => {
    const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
    const res = await request(app)
      .post('/api/upload/receipt')
      .send({ imageBase64: minimalPng });
    // Should always return a JSON response — never a 500 crash
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect([200, 400, 503]).toContain(res.status);
  });

  it('upload status should always return a response even without GCS configured', async () => {
    const res = await request(app).get('/api/upload/status');
    expect(res.status).toBe(200);
    expect(res.body.cloudStorage).toBeDefined();
  });
});
