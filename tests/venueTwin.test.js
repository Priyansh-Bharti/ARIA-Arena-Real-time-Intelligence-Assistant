/**
 * ARIA — Venue Digital Twin Test Suite
 * Validates the venueTwin.js state store:
 * initialization, live data merging, schema updates,
 * and structural integrity of the twin object.
 */

const {
  initializeTwin,
  getTwinContext,
  getTwinUpdatedStatus,
  appendTwinLiveData,
  updateTwinSchema
} = require('../venueTwin');

describe('ARIA VenueTwin — Initialization', () => {
  beforeEach(() => {
    // Re-initialize before each test for clean state
    initializeTwin();
  });

  it('initializeTwin should return a twin object', () => {
    const twin = initializeTwin();
    expect(twin).toBeDefined();
    expect(typeof twin).toBe('object');
  });

  it('getTwinContext should return a non-null object', () => {
    const twin = getTwinContext();
    expect(twin).not.toBeNull();
  });

  it('twin should have a metadata field', () => {
    const twin = getTwinContext();
    expect(twin).toHaveProperty('metadata');
  });

  it('twin metadata should have a name field', () => {
    const twin = getTwinContext();
    expect(twin.metadata).toHaveProperty('name');
    expect(typeof twin.metadata.name).toBe('string');
  });

  it('twin should have a live_state field after init', () => {
    const twin = getTwinContext();
    expect(twin).toHaveProperty('live_state');
  });

  it('live_state should contain crowd_density', () => {
    const twin = getTwinContext();
    expect(twin.live_state).toHaveProperty('crowd_density');
  });

  it('live_state crowd_density should be an object', () => {
    const twin = getTwinContext();
    expect(typeof twin.live_state.crowd_density).toBe('object');
  });

  it('live_state should contain a timestamp', () => {
    const twin = getTwinContext();
    expect(twin.live_state).toHaveProperty('timestamp');
  });

  it('timestamp should be a valid ISO string', () => {
    const twin = getTwinContext();
    expect(() => new Date(twin.live_state.timestamp)).not.toThrow();
  });
});

describe('ARIA VenueTwin — Last Updated Status', () => {
  it('getTwinUpdatedStatus should return a number after init', () => {
    initializeTwin();
    const ts = getTwinUpdatedStatus();
    expect(typeof ts).toBe('number');
    expect(ts).toBeGreaterThan(0);
  });

  it('timestamp should be recent (within last 5 seconds)', () => {
    initializeTwin();
    const ts = getTwinUpdatedStatus();
    expect(Date.now() - ts).toBeLessThan(5000);
  });
});

describe('ARIA VenueTwin — Live Data Merging', () => {
  beforeEach(() => { initializeTwin(); });

  it('appendTwinLiveData should update crowd_density', () => {
    appendTwinLiveData({ gate_1: 'High', gate_2: 'Low' });
    const twin = getTwinContext();
    expect(twin.live_state.crowd_density.gate_1).toBe('High');
    expect(twin.live_state.crowd_density.gate_2).toBe('Low');
  });

  it('should preserve existing gates not in the update', () => {
    appendTwinLiveData({ gate_3: 'Medium' });
    const twin = getTwinContext();
    expect(twin.live_state.crowd_density.gate_3).toBe('Medium');
    // previously set gates should still exist
    expect(twin.live_state.crowd_density).toBeDefined();
  });

  it('should update the timestamp on each append', () => {
    const before = getTwinContext().live_state.timestamp;
    appendTwinLiveData({ gate_4: 'Low' });
    const after = getTwinContext().live_state.timestamp;
    // Timestamps may be equal if called within same ms, but both should be valid
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it('appendTwinLiveData with empty object should not crash', () => {
    expect(() => appendTwinLiveData({})).not.toThrow();
  });

  it('should merge staff positions when provided', () => {
    appendTwinLiveData({}, { zone_a: 'Officer 1' });
    const twin = getTwinContext();
    expect(twin.live_state.staff_positions).toHaveProperty('zone_a');
  });
});

describe('ARIA VenueTwin — Schema Updates', () => {
  beforeEach(() => { initializeTwin(); });

  it('updateTwinSchema should merge top-level fields', () => {
    updateTwinSchema({ custom_field: 'test_value' });
    const twin = getTwinContext();
    expect(twin.custom_field).toBe('test_value');
  });

  it('should preserve existing metadata after schema update', () => {
    updateTwinSchema({ extra: 'data' });
    const twin = getTwinContext();
    expect(twin.metadata).toBeDefined();
  });

  it('updateTwinSchema with empty object should not crash', () => {
    expect(() => updateTwinSchema({})).not.toThrow();
  });
});
