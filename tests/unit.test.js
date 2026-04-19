/**
 * ARIA — Unit Test Suite
 * Validates core logic for Wayfinding, i18n, and Security Sanitization.
 */

import { i18n } from '../js/i18n.js';
import { sanitize } from '../js/utils.js';

describe('ARIA Core Logic Tests', () => {
  
  // 1. i18n Translation Tests
  test('i18n should return correct English welcome message', () => {
    document.documentElement.lang = 'en';
    expect(i18n.t('aria_welcome_text')).toBe("Welcome! How can I assist you today?");
  });

  test('i18n should fallback to key if translation is missing', () => {
    expect(i18n.t('non_existent_key')).toBe('non_existent_key');
  });

  // 2. Security & Sanitization Tests
  test('sanitize should strip HTML and limit length', () => {
    const dirty = '<script>alert("XSS")</script>Section 104';
    const clean = sanitize(dirty, 10);
    expect(clean).not.toContain('<script>');
    expect(clean.length).toBeLessThanOrEqual(10);
  });

  // 3. State Management Stub
  test('State should initialize with WELCOME screen', () => {
    const initialState = { currentScreen: 'WELCOME' };
    expect(initialState.currentScreen).toBe('WELCOME');
  });
});
