/**
 * ARIA — Utility Module
 * Shared helper functions for sanitization, debugging, and performance.
 * @module utils
 */

/**
 * Strips HTML and caps string length to prevent injection and layout breaking.
 * @param {string} input - User-provided input
 * @param {number} maxLen - Character limit
 * @returns {string} Sanitized string
 */
export function sanitize(input, maxLen = 20) {
  if (!input) return '';
  const el = document.createElement('div');
  el.textContent = input.substring(0, maxLen);
  return el.innerHTML;
}

/**
 * Gated logging utility. 
 * Only outputs to console if '?debug=true' is present in the URL.
 * @param {string} msg - Log message
 * @param {any} data - Metadata for inspection
 */
export function debug(msg, data = '') {
  if (new URLSearchParams(window.location.search).get('debug') === 'true') {
    console.log(`[ARIA] ${msg}`, data);
  }
}

/**
 * Standard debounce implementation for performance-heavy event listeners.
 * @param {Function} func - Callback
 * @param {number} timeout - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}
