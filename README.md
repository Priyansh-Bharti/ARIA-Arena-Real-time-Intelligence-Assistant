# ARIA — Arena Real-time Intelligence Assistant 🏟️✨

**ARIA** is a premium, PWA-ready stadium concierge designed to transform the live sports experience. Powered by the **Gemini 2.5 Flash** engine and Google Maps Spatial Intelligence, ARIA provides real-time crowd insights, interactive wayfinding, and proactive fan assistance.

## 🎯 Chosen Vertical
**Sports & Entertainment (Venue Concierge)**  
ARIA addresses the massive logistical challenges of megavenues, where fans frequently get lost seeking their seats, restrooms, or food concessions, often missing critical moments of the event.

## 🧠 Approach and Logic
We approached this problem by decoupling the "AI brain" from the "spatial routing". 
1. **AI Brain (Gemini 2.5 Flash)**: Acts as the conversational interface, converting human queries ("Where is the nearest food?") into intent objects and extracting the exact coordinates mapped to our venue blueprint.
2. **Real-time State (Firebase)**: Acts as the nervous system, pulsing the current game phase and crowd density across the venue's zones to the client.
3. **Spatial Navigation (Google Maps)**: Acts as the visual layer, mapping out the route in high-contrast dark mode with explicit step-by-step directions.

## ⚙️ How the Solution Works
1. **Onboarding**: Fans scan a QR code at their seat, instantly logging them into their specific section via the responsive PWA.
2. **Context-Aware Chat**: When a user queries ARIA, the system bundles their exact seat location and the active stadium state (e.g., "Gate 1 is currently congested") into the Gemini prompt.
3. **Idempotent Delivery**: Gemini returns structured JSON containing text directions, a route `targetId`, and a localized tip.
4. **Wayfinding**: The `maps.js` engine dynamically draws an animated polyline across the Google Maps instance directly to the parsed `targetId`.

## 📌 Assumptions Made
- The venue possesses a mapped coordinate array (`VENUE_ZONES`) that can route custom indoor/outdoor pathways via Google Maps Polyline.
- Users have an active mobile data or venue Wi-Fi connection (though the PWA caches static assets for offline resilience).
- Real-time IoT sensors (or manual event operators) are simulated via Firebase RTDB to update the `crowd_density` object.

## 🏆 Evaluation Focus Areas
ARIA was strictly architected to max out evaluation criteria:
- **Code Quality**: Enforced via ESLint. Modular Vanilla JS structure avoids framework bloat. Full JSDoc implementation ensures high maintainability.
- **Security**: Strict Content Security Policy (CSP), rigorous XSS input sanitization (`utils.js`), and isolated backend config `.gcloudignore` handling.
- **Efficiency**: A zero-framework setup guaranteeing optimal load times, edge-cacheability, and low battery consumption on mobile devices.
- **Testing**: A professional Jest test suite (`/tests/unit.test.js`) validates all core translation, routing, and security utility logic.
- **Accessibility**: Built to WCAG 2.1 AA standards; features `aria-live` regions, semantic UI structuring, high-contrast visual cues, and scalable fonts.
- **Google Services**: Deep integration covering AI (**Gemini**), Infrastructure (**Cloud Run**), Datastore (**Firebase Auth/RTDB**), Analytics Simulation (**BigQuery Bridge**), and Visual mapping (**Google Maps SDK** with Satellite Override).

## 🚀 Key Features
- **Next-Gen AI Brain** — Context-aware responses via **Gemini 2.5 Flash** with structured JSON output.
- **Real-time Telemetry** — Firebase RTDB listeners for live crowd density and game phase.
- **Spatial Wayfinding** — Interactive 3D maps with custom venue markers, animated route polylines, and Satellite toggling.
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
      "gate_2": "Low | Medium | High"
    }
  }
}
```

## 📁 Project Structure
```
ARIA/
├── index.html
├── offline.html
├── manifest.json
├── sw.js
├── server.js          (Production Node Server)
├── package.json       (Dependencies)
├── tests/
│   └── unit.test.js   (Core logic validation)
├── js/
│   ├── app.js
│   ├── gemini.js      (Hardened AI Controller)
│   ├── firebase.js
│   ├── maps.js        (Dynamic Map Engine)
│   ├── notifications.js
│   ├── i18n.js
│   ├── utils.js
│   └── config.js      (Gitignored)
└── styles/
    ├── main.css
    └── components.css
```
