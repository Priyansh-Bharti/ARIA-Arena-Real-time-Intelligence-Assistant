# ARIA — Arena Real-time Intelligence Assistant 🏟️✨

**ARIA** is a premium, PWA-ready stadium concierge designed to transform the live sports experience. Powered by the **Gemini 2.5 Flash** engine and Google Maps Spatial Intelligence, ARIA provides real-time crowd insights, interactive wayfinding, and proactive fan assistance.

## 🚀 Key Features

- **Next-Gen AI Brain** — Context-aware responses via **Gemini 2.5 Flash** with structured JSON output.
- **Real-time Telemetry** — Firebase RTDB listeners for live crowd density and game phase.
- **Spatial Wayfinding** — Interactive 3D maps with custom venue markers and animated route polylines.
- **Idempotent Alerts** — Smart notification engine that prevents spam while ensuring fans never miss a beat.
- **Multilingual Support** — Runtime language switching (EN, HI, ES, FR).
- **Offline-First PWA** — Service Worker with full asset caching and offline splash page.
- **Production Hardened** — WCAG 2.1 AA, strict CSP, XSS escaping, and rate-limiting.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS (ES Modules) |
| AI | Gemini 2.5 Flash |
| Data | Firebase Auth, Realtime Database, Analytics |
| Enterprise | Google Cloud Run, GCP BigQuery (Analytics Bridge) |
| Maps | Google Maps JavaScript API |
| Testing | Jest, ESLint |
| Hosting | Google Cloud Run / Firebase |

## ⚙️ Setup

1. Clone the repository
2. Copy `js/config.example.js` → `js/config.js`
3. Add your API keys to `js/config.js`
4. Serve via `node server.js`
5. Debug mode: append `?debug=true` to URL

## 📊 Firebase RTDB Schema

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

## 🛡️ Security & Hardening

- **CSP**: Restricts all script, style, font, and connection sources to verified domains.
- **XSS**: AI responses sanitized via `escapeHtml()` before DOM injection.
- **Sanitization**: User inputs length-capped and stripped of HTML.
- **Throttling**: Gemini requests rate-limited to 10/min per session (sliding window).
- **Zero Leaks**: All debug logs gated behind `debug()` utility.

| 6 | Gate Spike → High | Automated gate warning with bypass cooldown |

## 🛠️ Automated Quality Assurance

ARIA maintains high code standards through:
- **Unit Testing**: Professional test suite in `/tests` validating i18n and security logic.
- **Linting**: ESLint configuration for consistent, error-free JavaScript.
- **Architectural Scalability**: Decoupled modules and a production-grade Express bridge.
- **Analytics Bridge**: Integrated BigQuery pulse-logging for fan movement forecasting.

## 📁 Project Structure

```
ARIA/
├── index.html
├── offline.html
├── manifest.json
├── sw.js
├── server.js          (Production Node Server)
├── package.json       (Dependencies)
├── js/
│   ├── app.js
│   ├── gemini.js      (Hardened AI Controller)
│   ├── firebase.js
│   ├── maps.js        (Dynamic Map Engine)
│   ├── notifications.js (Idempotent Alerts)
│   ├── i18n.js
│   ├── utils.js
│   ├── config.js      (Gitignored)
│   └── config.example.js
└── styles/
    ├── main.css
    └── components.css
```
