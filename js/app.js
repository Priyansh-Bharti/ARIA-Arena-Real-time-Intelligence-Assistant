/**
 * ARIA — Main Application Controller
 * Orchestrates state management, UI rendering, and AI response lifecycle.
 * @module app
 */

import { askAria } from './gemini.js?v=4';
import { initFirebase, trackEvent } from './firebase.js?v=4';
import { initArenaMap, routeToDestination, drawAnimatedRoute } from './maps.js?v=4';
import { requestNotificationPermission, handleVenueAlertTriggers } from './notifications.js?v=4';
import { i18n } from './i18n.js?v=4';
import { sanitize, debug } from './utils.js?v=4';

/* ── Global App Configuration ───────────────────────────────────── */

const CONFIG = {
  PROJECT_NAME: 'ARIA',
  SCREENS: { WELCOME: 'WELCOME', ASSISTANT: 'ASSISTANT', MAP: 'MAP' }
};

/* ── Reactive Application state ─────────────────────────────────── */

const State = {
  currentScreen: CONFIG.SCREENS.WELCOME,
  userSeat: { section: '', row: '', seatId: '' },
  gamePhase: 'Pre-Match',
  venueData: {},
  lastDirections: '', 
  isAriaThinking: false
};

/* ── UI Rendering Engine ────────────────────────────────────────── */

const TEMPLATES = {
  [CONFIG.SCREENS.WELCOME]: () => `
    <section class="screen animate-fade-in">
      <h1 class="display-sm" style="margin-bottom: var(--spacing-sm); color: var(--color-primary);">${i18n.t('welcome_title')}</h1>
      <p style="color: var(--color-on-surface-variant); margin-bottom: var(--spacing-xl);">${i18n.t('welcome_subtitle')}</p>
      <div class="card">
        <div class="form-group">
          <label class="form-label" for="input-section">${i18n.t('section')}</label>
          <input type="text" class="input-field" placeholder="e.g., 104" id="input-section">
        </div>
        <div style="display: flex; gap: var(--spacing-md);">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">${i18n.t('row')}</label>
            <input type="text" class="input-field" placeholder="e.g., K" id="input-row">
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">${i18n.t('seat')}</label>
            <input type="text" class="input-field" placeholder="e.g., 12" id="input-seat">
          </div>
        </div>
        <button class="btn btn-primary" id="btn-enter" style="width: 100%; margin-top: var(--spacing-md);">${i18n.t('enter_arena')}</button>
      </div>
    </section>
  `,

  [CONFIG.SCREENS.ASSISTANT]: () => `
    <section class="screen animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-xl);">
        <div>
          <h1 style="font-size: 2.5rem; line-height: 1;">${i18n.t('assistant_title')} ${State.userSeat.section || ''}</h1>
          <p class="form-label" style="margin: 0; color: var(--color-secondary);">${i18n.t('location_label')}</p>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-primary" id="phase-badge">${State.gamePhase}</span>
        </div>
      </div>

      <article class="card card-high" id="aria-response-card" aria-busy="${State.isAriaThinking}" style="margin-bottom: var(--spacing-lg);">
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-md);">
          <h2 class="form-label">${i18n.t('aria_intelligence')}</h2>
          <span class="chip" id="loading-indicator" style="display: ${State.isAriaThinking ? 'block' : 'none'};">THINKING...</span>
        </div>
        <div id="mini-map" style="height: 160px; border-radius: var(--radius-md); background: #111; margin-bottom: var(--spacing-md); overflow: hidden;"></div>
        <div id="aria-text-response">
          <p style="font-weight: 600; margin-bottom: var(--spacing-md);">Welcome to Section ${State.userSeat.section}. ARIA is monitoring live crowd density for your gate.</p>
        </div>
        <button class="btn btn-secondary" style="width: 100%; border: none; color: var(--color-on-surface-variant);" id="btn-view-map">${i18n.t('view_map')} →</button>
      </article>

      <div class="quick-actions-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); margin-bottom: var(--spacing-xxl);">
        <button class="card qa-btn" id="qa-food">
          <span style="font-size: 1.5rem;">🍔</span>
          <span class="form-label" style="margin: 0;">${i18n.t('food_drinks')}</span>
        </button>
        <button class="card qa-btn" id="qa-restroom">
          <span style="font-size: 1.5rem;">🚻</span>
          <span class="form-label" style="margin: 0;">${i18n.t('restrooms')}</span>
        </button>
        <button class="card qa-btn" id="qa-track">
          <span style="font-size: 1.5rem;">🚶</span>
          <span class="form-label" style="margin: 0;">${i18n.t('exit_route')}</span>
        </button>
        <button class="card qa-btn" id="qa-emergency" style="background: rgba(255, 180, 171, 0.1);">
          <span style="font-size: 1.5rem;">🆘</span>
          <span class="form-label" style="margin: 0;">${i18n.t('emergency')}</span>
        </button>
      </div>
    </section>
  `,

  [CONFIG.SCREENS.MAP]: () => `
    <section class="screen animate-fade-in">
      <header style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
        <button class="chip" id="btn-map-back">${i18n.t('back')}</button>
        <h1 style="font-size: 1.25rem;">${i18n.t('wayfinding')}</h1>
      </header>
      <div id="full-map" style="height: 400px; border-radius: var(--radius-lg); background: var(--color-background-lowest); border: 1px solid var(--color-outline-variant); margin-bottom: var(--spacing-lg); overflow: hidden;"></div>
      <div id="text-directions">
        <h2 class="form-label">DIRECTIONS</h2>
        <div id="directions-list" style="color: var(--color-on-surface-variant); font-size: 0.875rem; line-height: 1.6;">
          ${State.lastDirections || 'Select a destination to begin...'}
        </div>
      </div>
    </section>
  `
};

/* ── Security Utilities ─────────────────────────────────────────── */

/**
 * Escapes HTML characters to prevent XSS from AI-generated content.
 * @param {string} str - Data to sanitize
 * @returns {string} - Safe escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

/* ── Core Application Logic ─────────────────────────────────────── */

/**
 * System Entry Point: Initializes services and global event listeners.
 */
function init() {
  debug(`${CONFIG.PROJECT_NAME} initializing`);

  try { initFirebase(); } catch (e) { debug('Firebase offline fallback'); }

  registerServiceWorker();
  bindEvents();
  updateOnlineStatus(); // Immediate sync for badge on startup
  render();

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  document.getElementById('lang-selector').addEventListener('change', (e) => {
    i18n.currentLang = e.target.value;
    render();
  });

  // Listen for real-time venue telemetry from the Firebase module
  window.addEventListener('aria-venue-update', (e) => {
    State.venueData = e.detail;
    State.gamePhase = e.detail.game_phase || 'Live';
    handleVenueAlertTriggers(e.detail);
    
    const badge = document.getElementById('phase-badge');
    if (badge) badge.textContent = State.gamePhase;
  });

  // Handle deep-links dispatched from background notifications
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NAVIGATE') {
        const screen = event.data.screen.toUpperCase();
        if (event.data.text) State.lastDirections = event.data.text;
        navigateTo(screen);
        // Delay routing slightly to ensure map is initialized
        if (event.data.target) setTimeout(() => routeToDestination(event.data.target), 500);
      }
    });
  }
}

/**
 * Global Delegate Listener: Manages interactions for dynamic UI elements.
 */
function bindEvents() {
  document.addEventListener('click', (e) => {
    const id = e.target.closest('[id]')?.id;
    if (!id) return;

    // Login Flow
    if (id === 'btn-enter') {
      const sec = sanitize(document.getElementById('input-section').value, 10);
      if (sec) {
        State.userSeat.section = sec;
        State.userSeat.row = sanitize(document.getElementById('input-row')?.value, 5);
        State.userSeat.seatId = sanitize(document.getElementById('input-seat')?.value, 5);
        requestNotificationPermission();
        navigateTo(CONFIG.SCREENS.ASSISTANT);
      } else {
        document.getElementById('input-section').style.borderColor = 'var(--color-error)';
      }
    }

    // Quick Action Routing & AI Retrieval
    if (id.startsWith('qa-')) {
      const type = id.replace('qa-', '');
      handleAriaRequest(`Where is the nearest ${type}?`);
      routeToDestination(type); 
    }

    if (id === 'btn-view-map') navigateTo(CONFIG.SCREENS.MAP);
    if (id === 'btn-map-back') navigateTo(CONFIG.SCREENS.ASSISTANT);

    // AI Concierge Prompt
    if (id === 'concierge-trigger') {
      const userPrompt = prompt('Ask ARIA about the stadium:');
      if (userPrompt) {
        if (State.currentScreen !== CONFIG.SCREENS.ASSISTANT) navigateTo(CONFIG.SCREENS.ASSISTANT);
        handleAriaRequest(userPrompt);
      }
    }
  });
}

/**
 * Handles communication with Gemini API and UI state updates.
 * @param {string} prompt - User's query
 */
async function handleAriaRequest(prompt) {
  if (State.isAriaThinking) return;
  showLoading(true);

  try {
    const response = await askAria(prompt, {
      seat_section: State.userSeat.section,
      seat_row: State.userSeat.row,
      game_phase: State.gamePhase,
      crowd_data: State.venueData.crowd_density || {},
      language: i18n.currentLang
    });
    
    State.lastDirections = response.route; 
    displayAriaResponse(response);
    
    // Proactive: Draw destination if the AI suggests a specific point
    if (response.destination) {
       drawAnimatedRoute(undefined, response.destination);
    }
  } catch (err) {
    debug('Aria interaction failed', err);
    document.getElementById('aria-text-response').innerHTML = `<p style="color:var(--color-error)">${escapeHtml(err.message)}</p>`;
  } finally {
    showLoading(false);
  }
}

/**
 * Renders structured AI response into the interface.
 * @param {Object} response - Parsed response from Gemini
 */
function displayAriaResponse(response) {
  const textField = document.getElementById('aria-text-response');
  if (!textField) return;

  textField.innerHTML = `
    <p style="font-weight: 600; margin-bottom: var(--spacing-sm);">${escapeHtml(response.answer)}</p>
    <p style="font-size: 0.875rem; color: var(--color-primary); margin-bottom: var(--spacing-md);">🗺️ ${escapeHtml(response.route)}</p>
    <div style="background: var(--color-background-lowest); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--color-outline-variant);">
      <h3 class="form-label" style="color: var(--color-secondary); font-size: 0.75rem;">${i18n.t('pro_tip_label')}</h3>
      <p style="font-size: 0.875rem;">${escapeHtml(response.pro_tip)}</p>
    </div>
  `;
}

/* ── UI Helpers ─────────────────────────────────────────────────── */

function showLoading(isLoading) {
  State.isAriaThinking = isLoading;
  const indicator = document.getElementById('loading-indicator');
  if (indicator) indicator.style.display = isLoading ? 'block' : 'none';
}

function render() {
  const templateFn = TEMPLATES[State.currentScreen];
  if (templateFn) {
    document.getElementById('screen-outlet').innerHTML = templateFn();
    if (State.currentScreen === CONFIG.SCREENS.ASSISTANT) initArenaMap('mini-map', true);
    if (State.currentScreen === CONFIG.SCREENS.MAP) initArenaMap('full-map', false);
  }
}

function navigateTo(screenId) {
  State.currentScreen = screenId;
  debug(`Navigating to ${screenId}`);
  render();
}

/**
 * PWA Service Worker Registration with sub-directory portability.
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(() => debug('ServiceWorker active'))
      .catch(e => debug('SW initialization failed', e));
  }
}

/**
 * Syncs the 'Online/Offline' badge with the browser's connectivity state.
 */
function updateOnlineStatus() {
  const badge = document.getElementById('connection-status');
  if (!badge) return;
  const isOnline = navigator.onLine;
  badge.textContent = isOnline ? 'Online' : 'Offline';
  badge.className = `badge ${isOnline ? 'badge-primary' : 'badge-error'}`;
}

document.addEventListener('DOMContentLoaded', init);
