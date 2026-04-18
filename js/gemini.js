/**
 * ARIA — Gemini AI Module
 * Handles prompt orchestration, sliding-window rate limiting, and robust JSON parsing.
 * @module gemini
 */

import { debug } from './utils.js';

/* ── Concurrency & Rate Limiting ────────────────────────────────── */

let requestCount = 0;
let windowStart = Date.now();
const MAX_RPM = 10; // Quota: 10 requests per rolling 60-second window

const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

/* ── System Persona & Guardrails ────────────────────────────────── */

const SYSTEM_PROMPT = `
You are ARIA, the official AI concierge for a 60,000-seat sports stadium.
Context-Aware Rules:
- Proactive: Append one unrequested relevant tip.
- Crowd High: Direct to clear alternate gates.
- Emergency: Medical tone, prioritize first-aid points.
- Output: Valid JSON ONLY.
{
  "answer": "Primary text response",
  "pro_tip": "Supporting context tip",
  "route": "Navigation instructions",
  "crowd_level": "Low|Medium|High",
  "alert": "Urgent alert or null",
  "destination": { "lat": 0, "lng": 0, "label": "Map target" }
}
`;

function getApiKey() {
  const key = window.GEMINI_API_KEY || '';
  if (!key) debug('GEMINI_API_KEY not found in global scope');
  return key;
}

/* ── API Operations ─────────────────────────────────────────────── */

/**
 * Executes a context-enriched request to the Gemini API.
 * Implements code-fence stripping and JSON extraction for high resilience against AI noise.
 * @param {string} userPrompt - Fan's question
 * @param {Object} context - Live state (seat, game phase, crowd density)
 * @returns {Promise<Object>} - Parsed and validated JSON object
 */
export async function askAria(userPrompt, context = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API Key Missing');

  // Sliding window throttle logic
  const now = Date.now();
  if (now - windowStart > 60000) { windowStart = now; requestCount = 0; }
  if (requestCount >= MAX_RPM) throw new Error('Stadium Wi-Fi limit reached. Please wait a minute.');
  requestCount++;

  // Assemble enriched prompt payload
  const fullPrompt = `
    LIVE CONTEXT:
    - User Section: ${context.seat_section}, Row: ${context.seat_row}
    - Phase: ${context.game_phase}
    - Gate Status: ${JSON.stringify(context.crowd_data)}
    - Language: ${context.language || 'English'}

    FAN QUERY: ${userPrompt}
  `;

  const API_V1BETA = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(API_V1BETA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generation_config: { response_mime_type: 'application/json', temperature: 0.7 }
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Gemini API Error (${response.status}): ${errorBody.error?.message || 'Unreachable'}`);
  }

  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;
  
  // Hardening: Strip markdown block formatting (e.g., ```json) often added by LLMs
  const cleanedText = rawText.replace(/```json|```/gi, '').trim();
  
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    // Robust Fallback: Extract the first JSON object using a greedy regex match
    const match = cleanedText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerE) {
        throw new Error('AI response structure invalid');
      }
    }
    throw new Error('Malformed AI response detected');
  }
}
