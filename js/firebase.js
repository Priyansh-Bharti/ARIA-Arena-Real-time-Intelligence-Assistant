/**
 * ARIA — Firebase Integration
 * Anonymous Auth, Realtime Database listeners, and Analytics.
 * @module firebase
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
import { debug } from './utils.js';

let app, auth, db, analytics;
let currentVenueData = {};

/**
 * Initializes Firebase services and sets up RTDB listener.
 * Dispatches 'aria-venue-update' CustomEvent when venue data changes.
 */
export function initFirebase() {
  const config = {
    apiKey: window.FIREBASE_API_KEY,
    authDomain: window.FIREBASE_AUTH_DOMAIN,
    databaseURL: window.FIREBASE_DATABASE_URL,
    projectId: window.FIREBASE_PROJECT_ID,
    storageBucket: window.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID,
    appId: window.FIREBASE_APP_ID,
    measurementId: window.FIREBASE_MEASUREMENT_ID
  };

  if (!config.apiKey) { debug('Firebase config missing'); return; }

  app = initializeApp(config);
  auth = getAuth(app);
  db = getDatabase(app);

  // Analytics may be blocked by CSP or ad-blockers
  try { analytics = getAnalytics(app); }
  catch (e) { debug('Analytics unavailable'); }

  // Zero-friction auth — no user credentials required
  signInAnonymously(auth).catch((err) => debug('Auth failed:', err));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      debug('Session active', user.uid);
      trackEvent('app_open');
    }
  });

  // Real-time listener on venue telemetry node
  const venueRef = ref(db, 'venue');
  onValue(venueRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      currentVenueData = data;
      window.dispatchEvent(new CustomEvent('aria-venue-update', { detail: data }));
    }
  });
}

/** @returns {Object} Latest crowd density from RTDB */
export function getCrowdData() {
  return currentVenueData.crowd_density || {};
}

/** @returns {string} Current game phase from RTDB */
export function getGamePhase() {
  return currentVenueData.game_phase || 'Pre-Game';
}

/**
 * Logs analytics event. Silently fails if analytics is blocked.
 * @param {string} eventName
 * @param {Object} params
 */
export function trackEvent(eventName, params = {}) {
  if (analytics) {
    try { logEvent(analytics, eventName, params); }
    catch (e) { /* Analytics blocked */ }
  }
}
