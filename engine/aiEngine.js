/**
 * ARIA — AI Engine
 * Isolated module for all Gemini API interactions.
 *
 * Architecture principle:
 *   ✅ AI Engine PHRASES responses — it explains & narrates.
 *   ❌ AI Engine NEVER decides routing — that is the Decision Engine's job.
 *
 * This isolation prevents:
 *   - Prompt injection attacks that could redirect fans to wrong locations
 *   - Hallucinated route steps that don't exist in the venue graph
 *   - Non-deterministic path decisions that can't be audited
 */

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Gemini client (lazy-initialised) ────────────────────────────────────────
let _client = null;
const getClient = () => {
  if (!_client && process.env.GEMINI_API_KEY) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _client;
};

// ─── Default fallback response (used when Gemini is unavailable) ─────────────
const DEFAULT_FALLBACK = (targetName) => ({
  narrative: `Head to ${targetName || 'your destination'}. Follow the venue signs and staff directions.`,
  tip: 'ARIA is currently experiencing high load. Please check the venue map for directions.',
  usedFallback: true,
});

// ─── System prompt — Gemini RECEIVES the route, it only narrates ─────────────
const buildSystemPrompt = (lang = 'en') => `
You are ARIA, a friendly stadium concierge assistant.
A routing engine has ALREADY computed the optimal path for the fan.
Your job is ONLY to:
1. Explain the route in a friendly, reassuring tone.
2. Add a helpful tip about the destination (wait time, what to bring, etc.).
3. NEVER suggest a different route or destination.
4. ALWAYS respond in ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : lang === 'ar' ? 'Arabic' : lang === 'zh' ? 'Chinese' : 'English'}.

Respond in strict JSON: { "narrative": "...", "tip": "..." }
Do not add markdown fences, explanations, or any other text.
`.trim();

/**
 * Generates a natural-language narrative for a pre-computed route.
 * AI receives the computed path — it NEVER computes it.
 * @param {object} route - Route object from DecisionEngine.computeRoute()
 * @param {string} userMessage - Original fan query
 * @param {string} lang - Language code
 * @param {object} twinContext - Optional live venue context from VenueTwin
 * @returns {Promise<{ narrative: string, tip: string, usedFallback: boolean }>}
 */
const narrateRoute = async (route, userMessage, lang = 'en', twinContext = {}) => {
  const client = getClient();
  if (!client) return DEFAULT_FALLBACK(route?.routeSteps?.at(-1)?.name);

  const routeSummary = route.routeSteps?.map(s => s.name).join(' → ') || 'your destination';
  const gamePhase = twinContext.live_state?.game_phase || 'match';
  const destName = route.routeSteps?.at(-1)?.name || 'destination';

  const userPrompt = `
Fan query: "${userMessage}"
Pre-computed route: ${routeSummary}
Walk time: ${route.walkTime}
Mode: ${route.mode}
Crowd-aware: ${route.crowdPenaltiesApplied}
Accessible route: ${route.accessibleRoute}
Current game phase: ${gamePhase}
Destination: ${destName}

Narrate this route for the fan. Do not change the route.
`.trim();

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });
    const result = await Promise.race([
      model.generateContent([buildSystemPrompt(lang), userPrompt]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);

    const text = result.response.text().trim().replace(/```json\n?|\n?```/g, '');
    const parsed = JSON.parse(text);

    if (!parsed.narrative || !parsed.tip) throw new Error('Invalid response schema');
    return { ...parsed, usedFallback: false };
  } catch (err) {
    console.warn('[AIEngine] Gemini unavailable, using fallback:', err.message);
    return DEFAULT_FALLBACK(route?.routeSteps?.at(-1)?.name);
  }
};

/**
 * Answers a general venue FAQ using grounded structured data.
 * AI only phrases the answer — it reads from venueFacts, never invents.
 * @param {string} question - Fan's question
 * @param {object} venueFacts - Structured venue data (rules, timing, etc.)
 * @param {string} lang - Language code
 * @returns {Promise<string>} Answer string
 */
const answerFaq = async (question, venueFacts = {}, lang = 'en') => {
  const client = getClient();
  if (!client) return 'Please ask a staff member or check the venue information boards.';

  const factsText = Object.entries(venueFacts)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const prompt = `
Venue facts (answer ONLY from these facts):
${factsText || 'No specific facts provided. Give general stadium advice.'}

Fan question: "${question}"
Language: ${lang}
Answer concisely (1-2 sentences). Do not invent facts not listed above.
`.trim();

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
    ]);
    return result.response.text().trim();
  } catch {
    return 'Please check with a venue staff member for assistance.';
  }
};

/**
 * Returns whether the Gemini client is currently configured.
 * @returns {boolean}
 */
const isAvailable = () => Boolean(process.env.GEMINI_API_KEY);

module.exports = { narrateRoute, answerFaq, isAvailable };
