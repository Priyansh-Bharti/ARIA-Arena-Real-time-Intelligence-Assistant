/**
 * ARIA — Venue Digital Twin
 * Central in-memory state store for the live venue.
 * Loads the base venue blueprint from venueContext.js and layers
 * real-time crowd sensor data on top to create a single, unified
 * "digital twin" object that is injected into every AI prompt.
 *
 * Architecture:
 *   venueContext.js (static) → venueTwin.js (live) → AI system prompt
 */

const staticVenueContext = require('./venueContext');

let liveTwin = null;
let lastUpdated = null;

/**
 * Initializes the venue twin from the static context.
 * In production, this also reads the latest state from Firebase RTDB.
 */
const initializeTwin = () => {
  liveTwin = {
    ...staticVenueContext,
    live_state: {
      active_incidents: 0,
      crowd_density: {
        gate_1: 'Medium',
        gate_2: 'Low',
        gate_3: 'High',
        gate_4: 'Low'
      },
      staff_positions: {},
      timestamp: new Date().toISOString()
    }
  };
  lastUpdated = Date.now();
  console.log('[ARIA VenueTwin] Digital twin initialized from static venue context.');
  return liveTwin;
};

/**
 * Returns the current live twin state.
 * Always call initializeTwin() before calling this.
 * @returns {object} The full venue twin object.
 */
const getTwinContext = () => {
  if (!liveTwin) initializeTwin();
  return liveTwin;
};

/**
 * Returns the timestamp of the last twin update.
 * @returns {number|null} Unix timestamp in ms.
 */
const getTwinUpdatedStatus = () => lastUpdated;

/**
 * Merges live sensor data into the twin's live_state layer.
 * Called by sensorSimulator.js on each 5-second tick.
 * @param {object} crowdDensity - Map of gate IDs to density levels.
 * @param {object} staffData - Optional map of staff positions by zone.
 */
const appendTwinLiveData = (crowdDensity = {}, staffData = {}) => {
  if (!liveTwin) initializeTwin();
  liveTwin.live_state = {
    ...liveTwin.live_state,
    crowd_density: { ...liveTwin.live_state.crowd_density, ...crowdDensity },
    staff_positions: staffData,
    timestamp: new Date().toISOString()
  };
  lastUpdated = Date.now();
};

/**
 * Updates any top-level field in the twin (e.g. gate status, event name).
 * @param {object} updates - Partial object to merge into the twin.
 */
const updateTwinSchema = (updates = {}) => {
  if (!liveTwin) initializeTwin();
  liveTwin = { ...liveTwin, ...updates };
  lastUpdated = Date.now();
};

module.exports = {
  initializeTwin,
  getTwinContext,
  getTwinUpdatedStatus,
  appendTwinLiveData,
  updateTwinSchema
};
