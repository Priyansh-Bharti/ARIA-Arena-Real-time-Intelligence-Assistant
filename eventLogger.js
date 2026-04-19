/**
 * ARIA — Event Logger
 * Persists cyclic venue state snapshots to Google Firebase RTDB every 30 seconds.
 * Creates a queryable audit trail of crowd density changes and AI actions.
 */

const { getDatabase, ref, push, get } = require('firebase/database');

let loggerInterval = null;

/**
 * Starts the cyclic event logger, writing venue snapshots to Firebase RTDB.
 * @param {import('firebase/app').FirebaseApp} firebaseApp - Initialized Firebase app
 */
const startEventLogger = (firebaseApp) => {
  const db = getDatabase(firebaseApp);

  console.log('[ARIA EventLogger] 30s cyclic snapshot logger initialized → Firebase RTDB');

  loggerInterval = setInterval(async () => {
    try {
      const venueSnap = await get(ref(db, 'venue'));
      const venueState = venueSnap.val() || {};

      const eventPayload = {
        timestamp: new Date().toISOString(),
        type: 'cyclic_snapshot',
        data: {
          game_phase: venueState.game_phase || 'Unknown',
          crowd_density: venueState.crowd_density || {}
        },
        summary: `Gate density snapshot: ${JSON.stringify(venueState.crowd_density || {})}`
      };

      await push(ref(db, 'event_log'), eventPayload);
      console.log(`[ARIA EventLogger] Snapshot pushed to Firebase at ${eventPayload.timestamp}`);
    } catch (err) {
      console.error('[ARIA EventLogger] Firebase write error:', err.message);
    }
  }, 30000);
};

/**
 * Stops the event logger and cleans up the interval.
 */
const stopEventLogger = () => {
  if (loggerInterval) {
    clearInterval(loggerInterval);
    loggerInterval = null;
  }
};

module.exports = { startEventLogger, stopEventLogger };
