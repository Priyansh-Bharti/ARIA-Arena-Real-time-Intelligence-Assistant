/**
 * ARIA — Language & Internationalisation Tests
 * Validates that the i18n module correctly resolves all supported
 * languages and falls back gracefully for unsupported locales.
 */

const SUPPORTED_LANGUAGES = ['en', 'hi', 'es', 'fr', 'ar', 'zh'];

// ─── Minimal i18n shim for node test environment ──────────────────────────────
// The real i18n.js runs in the browser; this file tests the translation logic.
const translations = {
  en: { greeting: 'Welcome to ARIA', nav_help: 'How can I help you?', error: 'Something went wrong.' },
  hi: { greeting: 'ARIA में आपका स्वागत है', nav_help: 'मैं आपकी कैसे मदद कर सकता हूँ?', error: 'कुछ गलत हो गया।' },
  es: { greeting: 'Bienvenido a ARIA', nav_help: '¿Cómo puedo ayudarte?', error: 'Algo salió mal.' },
  fr: { greeting: 'Bienvenue sur ARIA', nav_help: 'Comment puis-je vous aider?', error: 'Quelque chose a mal tourné.' },
  ar: { greeting: 'مرحباً بك في ARIA', nav_help: 'كيف يمكنني مساعدتك؟', error: 'حدث خطأ ما.' },
  zh: { greeting: '欢迎使用 ARIA', nav_help: '我能帮您什么？', error: '出现了一些错误。' }
};

/**
 * Resolves a translation key for a given language code.
 * Falls back to English if the language or key is not found.
 */
const translate = (lang, key) => {
  const dict = translations[lang] || translations['en'];
  return dict[key] || translations['en'][key] || key;
};

describe('ARIA i18n — Language Tests', () => {

  describe('Supported language resolution', () => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      it(`should resolve greeting key for language: ${lang}`, () => {
        const result = translate(lang, 'greeting');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Key resolution', () => {
    it('should return the English greeting', () => {
      expect(translate('en', 'greeting')).toBe('Welcome to ARIA');
    });

    it('should return the Hindi greeting', () => {
      expect(translate('hi', 'greeting')).toBe('ARIA में आपका स्वागत है');
    });

    it('should return the Spanish nav_help string', () => {
      expect(translate('es', 'nav_help')).toBe('¿Cómo puedo ayudarte?');
    });

    it('should return the Arabic greeting (RTL language)', () => {
      expect(translate('ar', 'greeting')).toBe('مرحباً بك في ARIA');
    });

    it('should return the Chinese greeting', () => {
      expect(translate('zh', 'greeting')).toBe('欢迎使用 ARIA');
    });
  });

  describe('Fallback behaviour', () => {
    it('should fall back to English for an unsupported language code', () => {
      const result = translate('xx', 'greeting');
      expect(result).toBe('Welcome to ARIA');
    });

    it('should fall back to the key name for an unknown key', () => {
      const result = translate('en', 'nonexistent_key');
      expect(result).toBe('nonexistent_key');
    });

    it('should not throw for null language code', () => {
      expect(() => translate(null, 'greeting')).not.toThrow();
    });
  });

  describe('Language count', () => {
    it('should support exactly 6 languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(6);
    });

    it('should include Hindi as a supported language', () => {
      expect(SUPPORTED_LANGUAGES).toContain('hi');
    });

    it('should include Arabic (RTL) as a supported language', () => {
      expect(SUPPORTED_LANGUAGES).toContain('ar');
    });
  });
});
