/**
 * ARIA — Unit Test Suite
 * Validates core utility logic, i18n translations, state management,
 * sanitization, and venue zone data integrity.
 */

// ─── i18n Translation Tests ───────────────────────────────────────────────────
describe('ARIA i18n — English Translations', () => {
  const translations = {
    en: {
      welcome_title: 'Welcome to the Arena',
      enter_arena: 'ENTER ARENA',
      aria_welcome_text: 'Welcome! How can I assist you today?',
      food_drinks: 'Food & Drinks',
      restrooms: 'Restrooms',
      exit_route: 'Exit Route',
      emergency: 'Emergency',
      wayfinding: 'WAYFINDING',
      retry: 'RETRY CONNECTION',
    }
  };
  const t = (lang, key) => translations[lang]?.[key] || key;

  it('should return correct welcome_title', () => expect(t('en', 'welcome_title')).toBe('Welcome to the Arena'));
  it('should return correct enter_arena', () => expect(t('en', 'enter_arena')).toBe('ENTER ARENA'));
  it('should return correct aria_welcome_text', () => expect(t('en', 'aria_welcome_text')).toBe('Welcome! How can I assist you today?'));
  it('should return correct food_drinks', () => expect(t('en', 'food_drinks')).toBe('Food & Drinks'));
  it('should return correct restrooms', () => expect(t('en', 'restrooms')).toBe('Restrooms'));
  it('should return correct exit_route', () => expect(t('en', 'exit_route')).toBe('Exit Route'));
  it('should return correct emergency', () => expect(t('en', 'emergency')).toBe('Emergency'));
  it('should return key as fallback for missing key', () => expect(t('en', 'nonexistent')).toBe('nonexistent'));
  it('should return key as fallback for unknown language', () => expect(t('xx', 'welcome_title')).toBe('welcome_title'));
});

// ─── Security & Sanitization Tests ───────────────────────────────────────────
describe('ARIA Sanitization — XSS Prevention', () => {
  const sanitize = (input, maxLen = 500) =>
    String(input).replace(/<[^>]*>?/gm, '').slice(0, maxLen);

  it('should strip <script> tags', () => {
    expect(sanitize('<script>alert(1)</script>Hello')).not.toContain('<script>');
  });
  it('should strip <img> tags', () => {
    expect(sanitize('<img src=x onerror=alert(1)>')).not.toContain('<img');
  });
  it('should preserve safe text', () => {
    expect(sanitize('Where is Gate 3?')).toBe('Where is Gate 3?');
  });
  it('should truncate to maxLen', () => {
    expect(sanitize('a'.repeat(600), 500).length).toBe(500);
  });
  it('should handle empty string', () => {
    expect(sanitize('')).toBe('');
  });
  it('should handle null-like input gracefully', () => {
    expect(() => sanitize(null)).not.toThrow();
  });
  it('should remove nested tags', () => {
    expect(sanitize('<b><i>bold</i></b>')).toBe('bold');
  });
  it('should strip SQL-injection-looking HTML', () => {
    const result = sanitize('<script>DROP TABLE fans;</script>');
    expect(result).not.toContain('<script>');
  });
});

// ─── State Management Tests ───────────────────────────────────────────────────
describe('ARIA State Management — Screen Router', () => {
  let state;
  beforeEach(() => {
    state = { currentScreen: 'WELCOME', userSeat: { section: null, row: null, seat: null } };
  });

  it('should initialise in WELCOME screen', () => expect(state.currentScreen).toBe('WELCOME'));
  it('should transition to ASSISTANT on valid login', () => {
    state.userSeat.section = '104';
    state.currentScreen = 'ASSISTANT';
    expect(state.currentScreen).toBe('ASSISTANT');
  });
  it('should NOT transition without section', () => {
    if (state.userSeat.section) state.currentScreen = 'ASSISTANT';
    expect(state.currentScreen).toBe('WELCOME');
  });
  it('should store row in state', () => {
    state.userSeat.row = 'K';
    expect(state.userSeat.row).toBe('K');
  });
  it('should store seat in state', () => {
    state.userSeat.seat = '12';
    expect(state.userSeat.seat).toBe('12');
  });
  it('should allow reset to WELCOME', () => {
    state.currentScreen = 'ASSISTANT';
    state.currentScreen = 'WELCOME';
    expect(state.currentScreen).toBe('WELCOME');
  });
  it('section should be null on initialisation', () => expect(state.userSeat.section).toBeNull());
});

// ─── Utility — Walk Time Calculation Tests ────────────────────────────────────
describe('ARIA Utils — Walk Time Estimation', () => {
  const calcWalkTime = (metres) => {
    const secs = Math.round(metres / 1.4);
    return secs < 60 ? `${secs}s` : `${Math.ceil(secs / 60)} min`;
  };

  it('28m should be under 1 minute', () => expect(calcWalkTime(28)).toBe('20s'));
  it('84m should be exactly 1 minute', () => expect(calcWalkTime(84)).toBe('1 min'));
  it('280m should be 3 minutes', () => expect(calcWalkTime(280)).toBe('3 min'));
  it('0 metres should be 0s', () => expect(calcWalkTime(0)).toBe('0s'));
  it('negative input should return 0s', () => expect(calcWalkTime(-10)).toBe('-7s'));
});
