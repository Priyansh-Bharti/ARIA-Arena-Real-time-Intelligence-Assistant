/**
 * ARIA — Notification Engine
 * Orchestrates event-driven alerts with idempotency and cooldown logic to prevent spam.
 * @module notifications
 */

import { debug } from './utils.js';

let muted = false;
let lastAlertedPhase = null; // State tracker for phase alerts (Halftime vs Post-game)
const recentlyNotifiedGates = new Set(); // Cooldown set for crowd density warnings

/**
 * Initiates notification permission flow using a 'soft-prompt' UX pattern.
 * Feature detects browser support before execution.
 * @returns {Promise<void>}
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return;

  if (Notification.permission === 'granted') {
    showLocalNotification('ARIA Active 🏟️', 'Stadium intelligence initialized.');
    return;
  }
  if (Notification.permission === 'denied') return;

  // Soft-prompt used to improve conversion rate and avoid blocking the native dialog
  const consent = window.confirm('Enable real-time stadium alerts from ARIA?');
  if (consent) {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      showLocalNotification('Notifications Enabled ✅', 'ARIA is now watching the arena for you.');
    }
  }
}

/**
 * Dispatches notifications with background support via Service Worker.
 * Degrades gracefully to native Notification API if Service Worker is unavailable.
 * @param {string} title
 * @param {string} body
 * @param {Object} data - Context for deep-linking (e.g., target screen, map ID)
 */
export function showLocalNotification(title, body, data = {}) {
  // Feature detection and user preference check
  if (typeof Notification === 'undefined' || muted || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Inter-thread messaging for Service Worker background handling
    navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', title, body, data });
  } else {
    try {
      new Notification(title, { body, icon: '/icons/icon-192x192.png', tag: 'aria-alert', data });
    } catch (e) {
      debug('Local notification failed', e);
    }
  }
}

/**
 * Evaluates live venue telemetry to trigger proactive fan assistance alerts.
 * Implements cooldowns to ensure high-priority messages are not lost in noise.
 * @param {Object} venueData - Real-time snapshot from Firebase RTDB
 */
export function handleVenueAlertTriggers(venueData) {
  if (!venueData) return;
  const { game_phase, crowd_density } = venueData;

  // ── Rule 1: Phase Alerts (Trigger once per phase change)
  if (game_phase !== lastAlertedPhase) {
    if (game_phase === 'Halftime') {
      showLocalNotification('Halftime — Beat the Rush 🏃', 'Restroom Block B on Level 2 has only a 2-min wait.', { screen: 'map', target: 'restroom_b' });
      lastAlertedPhase = game_phase;
    }
    if (game_phase === 'Post-Game') {
      showLocalNotification('Game over — Exit now 🚶', 'Fastest exit from your section is Gate 3 West.', { screen: 'map', target: 'gate_3' });
      lastAlertedPhase = game_phase;
    }
  }

  // ── Rule 2: Gate Congestion Alerts (Trigger with 5-minute cooldown)
  if (crowd_density) {
    Object.entries(crowd_density).forEach(([gateId, level]) => {
      if (level === 'High' && !recentlyNotifiedGates.has(gateId)) {
        showLocalNotification(
          `${gateId.replace('_', ' ').toUpperCase()} Congested`, 
          'Try an alternate exit. Check the live map for clear routes.',
          { screen: 'assistant' }
        );
        recentlyNotifiedGates.add(gateId);
        
        // Cooldown timer prevents duplicate alerts for the same event
        setTimeout(() => recentlyNotifiedGates.delete(gateId), 300000); // 5-minute window
      }
    });
  }
}

/**
 * Global mute toggle for the notification system.
 * @param {boolean} isMuted 
 */
export function setMuteStatus(isMuted) {
  muted = isMuted;
  debug(`Global Alerts: ${isMuted ? 'Muted' : 'Active'}`);
}
