/**
 * ARIA — Jest Global Test Setup
 * Mocks all external dependencies (Firebase, Google Maps, fetch) 
 * so every test runs in full network isolation.
 */

// ─── Mock Firebase RTDB ───────────────────────────────────────────────────────
jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  get: jest.fn(async () => ({ val: () => ({ gate_1: 'Medium' }) })),
  set: jest.fn(async () => {}),
  push: jest.fn(() => ({})),
  update: jest.fn(async () => {}),
  onValue: jest.fn()
}));

// ─── Mock Firebase Auth ───────────────────────────────────────────────────────
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInAnonymously: jest.fn(async () => ({ user: { uid: 'test-uid-123' } })),
  onAuthStateChanged: jest.fn()
}));

// ─── Mock Global Fetch (Gemini API calls) ─────────────────────────────────────
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      candidates: [{ content: { parts: [{ text: '{"directions":"Go to Gate 1","targetId":"gate_1","tip":"Use the North exit"}' }] } }]
    })
  })
);

// ─── Mock Google Maps SDK ─────────────────────────────────────────────────────
global.google = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    Polyline: jest.fn(),
    MapTypeId: { ROADMAP: 'roadmap', SATELLITE: 'satellite' },
    SymbolPath: { CIRCLE: 0 }
  }
};

// ─── Suppress console noise in test output ────────────────────────────────────
global.console.log = jest.fn();
global.console.error = jest.fn();
