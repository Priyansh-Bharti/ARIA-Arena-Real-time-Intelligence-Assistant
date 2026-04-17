# ARIA — Arena Real-time Intelligence Assistant

A progressive web app that serves as an AI-powered stadium concierge. ARIA uses Gemini 1.5 Flash, Firebase Realtime Database, and Google Maps to deliver personalized wayfinding, crowd intelligence, and proactive safety alerts to sports fans.

## Features

- **AI Concierge** — Context-aware responses via Gemini 1.5 Flash with structured JSON output
- **Real-time Telemetry** — Firebase RTDB listeners for live crowd density and game phase
- **Wayfinding** — Google Maps with custom venue markers and animated route polylines
- **Proactive Alerts** — Push notifications triggered by crowd spikes, halftime, and post-game
- **Multilingual** — Runtime language switching (EN, HI, ES, FR)
- **Offline Support** — Service Worker with full asset caching and offline fallback
- **Accessible** — WCAG 2.1 AA, semantic HTML, ARIA attributes, keyboard navigable

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES Modules) |
| AI | Gemini 1.5 Flash |
| Data | Firebase Auth, Realtime Database, Analytics |
| Maps | Google Maps JavaScript API |
| Security | CSP, XSS escaping, input sanitization, rate limiting |

## Setup

1. Clone the repository
2. Copy `js/config.example.js` → `js/config.js`
3. Add your API keys to `js/config.js`
4. Serve via `npx serve` or VS Code Live Server
5. Debug mode: append `?debug=true` to URL

## Firebase RTDB Schema

```json
{
  "venue": {
    "game_phase": "Live | Halftime | Post-Game",
    "crowd_density": {
      "gate_1": "Low | Medium | High",
      "gate_2": "Low | Medium | High",
      "gate_3": "Low | Medium | High",
      "gate_4": "Low | Medium | High"
    }
  }
}
```

## Security

- Content Security Policy restricts all script, style, font, and connection sources
- AI responses sanitized via `escapeHtml()` before DOM injection
- User inputs stripped of HTML and length-capped via `sanitize()`
- Gemini requests rate-limited to 10/min per session
- All API keys loaded from gitignored `config.js`
- Zero `console.log` in production — gated behind `debug()` utility

## Testing

| # | Case | Expected |
|---|------|----------|
| 1 | Empty section submit | Red border, `aria-invalid`, focus |
| 2 | XSS in section input | Tags stripped |
| 3 | Quick action tap | Gemini response with route + pro tip |
| 4 | 11th request in 60s | Rate limit error in UI |
| 5 | Language switch | All labels update instantly |
| 6 | Offline reload | Offline fallback page |
| 7 | Firebase `game_phase` → Halftime | Push notification fires |
| 8 | Firebase gate density → High | Crowd warning notification |
| 9 | Tab navigation | All elements reachable |
| 10 | `?debug=true` | `[ARIA]` logs in console |

## Project Structure

```
ARIA/
├── index.html
├── offline.html
├── manifest.json
├── sw.js
├── js/
│   ├── app.js
│   ├── gemini.js
│   ├── firebase.js
│   ├── maps.js
│   ├── notifications.js
│   ├── i18n.js
│   ├── utils.js
│   ├── config.js          (gitignored)
│   └── config.example.js
└── styles/
    ├── main.css
    └── components.css
```
