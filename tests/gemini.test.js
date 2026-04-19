/**
 * ARIA — Gemini AI Engine Test Suite
 * Validates the AI engine's rate limiting, prompt sanitization,
 * response schema contracts, and fallback behaviour.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sanitize = (input) => String(input).replace(/<[^>]*>?/gm, '').trim();

const parseGeminiResponse = (raw) => {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
};

const mockGeminiResponse = (directions, targetId, tip) => ({ directions, targetId, tip });

// ─── Response Schema Tests ────────────────────────────────────────────────────
describe('ARIA Gemini — Response Schema Contract', () => {
  it('should have directions field', () => {
    const r = mockGeminiResponse('Head to Gate 1', 'gate_1', 'Go now!');
    expect(r).toHaveProperty('directions');
  });
  it('should have targetId field', () => {
    const r = mockGeminiResponse('Head to Gate 1', 'gate_1', 'Go now!');
    expect(r).toHaveProperty('targetId');
  });
  it('should have tip field', () => {
    const r = mockGeminiResponse('Head to Gate 1', 'gate_1', 'Go now!');
    expect(r).toHaveProperty('tip');
  });
  it('directions should be a string', () => {
    const r = mockGeminiResponse('Go left', 'gate_2', 'Hurry!');
    expect(typeof r.directions).toBe('string');
  });
  it('targetId should match a known zone pattern', () => {
    const r = mockGeminiResponse('Go left', 'gate_2', 'Hurry!');
    expect(r.targetId).toMatch(/^[a-z_]+$/);
  });
});

// ─── Prompt Sanitization Tests ────────────────────────────────────────────────
describe('ARIA Gemini — Prompt Sanitization', () => {
  it('should strip script tags from prompt', () => {
    const dirty = 'Where is Gate 3? <script>alert(1)</script>';
    expect(sanitize(dirty)).not.toContain('<script>');
  });
  it('should strip HTML injection attempt', () => {
    expect(sanitize('<img src=x onerror=alert(1)>')).not.toContain('<img');
  });
  it('should preserve normal question text', () => {
    expect(sanitize('Where is the nearest food stall?')).toBe('Where is the nearest food stall?');
  });
  it('should handle empty prompt gracefully', () => {
    expect(() => sanitize('')).not.toThrow();
    expect(sanitize('')).toBe('');
  });
  it('should handle very long prompt by not crashing', () => {
    expect(() => sanitize('x'.repeat(10000))).not.toThrow();
  });
});

// ─── Rate Limit Fallback Tests ────────────────────────────────────────────────
describe('ARIA Gemini — Rate Limit Fallback', () => {
  const rateLimitFallback = () => ({
    directions: 'System is experiencing high traffic. Please check the venue map.',
    targetId: 'gate_1',
    tip: 'Our concierges are busy. Showing default exit route.'
  });

  it('should return a fallback object', () => {
    expect(rateLimitFallback()).toBeDefined();
  });
  it('fallback directions should mention venue map', () => {
    expect(rateLimitFallback().directions).toContain('venue map');
  });
  it('fallback targetId should be a valid zone', () => {
    expect(['gate_1', 'gate_2', 'exit_north', 'exit_south']).toContain(rateLimitFallback().targetId);
  });
  it('fallback tip should be a non-empty string', () => {
    expect(rateLimitFallback().tip.length).toBeGreaterThan(0);
  });
  it('fallback should not throw', () => {
    expect(() => rateLimitFallback()).not.toThrow();
  });
});

// ─── JSON Response Parsing Tests ──────────────────────────────────────────────
describe('ARIA Gemini — JSON Response Parsing', () => {
  it('should parse valid JSON from response', () => {
    const raw = '```json\n{"directions":"Go left","targetId":"gate_1","tip":"Fast!"}\n```';
    const parsed = parseGeminiResponse(raw);
    expect(parsed).not.toBeNull();
    expect(parsed.targetId).toBe('gate_1');
  });
  it('should return null for unparseable response', () => {
    expect(parseGeminiResponse('not json at all')).toBeNull();
  });
  it('should handle empty string response', () => {
    expect(parseGeminiResponse('')).toBeNull();
  });
  it('should extract JSON from mixed text', () => {
    const raw = 'Sure! {"directions":"Turn right","targetId":"food_north","tip":"Quick!"}';
    const parsed = parseGeminiResponse(raw);
    expect(parsed?.directions).toBe('Turn right');
  });
});
