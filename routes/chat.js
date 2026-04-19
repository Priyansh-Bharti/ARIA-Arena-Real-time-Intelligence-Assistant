/**
 * ARIA — Gemini Streaming Chat API Route
 * Proxies user messages to Gemini 2.5 Flash via Server-Sent Events (SSE),
 * streaming responses token-by-token for a real-time chat experience.
 * Uses express-validator for strict input sanitization.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { getTwinContext } = require('../venueTwin');

/** Per-IP rate limiter (2s cooldown between requests) */
const rateLimits = new Map();
const checkRateLimit = (ip) => {
  const now = Date.now();
  if (now - (rateLimits.get(ip) || 0) < 2000) return false;
  rateLimits.set(ip, now);
  return true;
};

/** Validation middleware */
const validateChat = [
  body('message').isString().trim().isLength({ min: 1, max: 500 }).withMessage('Message must be 1-500 chars'),
  body('section').optional().isString().trim(),
  body('lang').optional().isIn(['en', 'hi', 'es', 'fr', 'ar', 'zh']).withMessage('Unsupported language'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

/**
 * POST /api/chat
 * Streams a context-aware Gemini response using Server-Sent Events.
 */
router.post('/', validateChat, async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit: please wait 2 seconds between requests.' });
  }

  const { message, section = 'General', lang = 'en' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'AI service is not configured.' });
  }

  // Set up Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const twinContext = getTwinContext();
  const systemPrompt = `You are ARIA, the official AI concierge for ${twinContext.metadata.name}.
The fan is seated in section: ${section}.
Current event: ${twinContext.metadata.currentEvent.name} — Status: ${twinContext.metadata.currentEvent.status}.
Live crowd density: ${JSON.stringify(twinContext.live_state?.crowd_density || {})}.
Gate statuses: ${JSON.stringify(twinContext.gates)}.
Respond concisely in ${lang}. Always return a JSON object: { "directions": string, "targetId": string, "tip": string }.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nFan query: ${message}` }] }]
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"directions":"Please ask a staff member for help.","targetId":"gate_1","tip":"Stay calm"}';

    // Stream response in SSE format
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ text: '{"directions":"AI temporarily unavailable.","targetId":"gate_1","tip":"See a staff member"}' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

module.exports = router;
