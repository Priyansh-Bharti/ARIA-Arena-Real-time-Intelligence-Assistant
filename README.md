<p align="center">
  <img src="https://img.shields.io/badge/ARIA-Stadium%20Assistant-blueviolet?style=for-the-badge&logo=googlecloud&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Google%20Maps-Spatial%20AI-34A853?style=for-the-badge&logo=googlemaps&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloud%20Run-Deployed-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" />
</p>

<h1 align="center">🏟️ ARIA — Arena Real-time Intelligence Assistant</h1>

<p align="center">
  <strong>AI-powered stadium concierge providing real-time crowd intelligence, spatial wayfinding, and proactive fan assistance.</strong>
</p>

<p align="center">
  <i>Built for the Hack2Skill PromptWars Competition · Deployed on Google Cloud Run · April 2026</i>
</p>

---

## 📋 Table of Contents

- [Chosen Vertical](#-chosen-vertical)
- [Approach and Logic](#-approach-and-logic)
- [How the Solution Works](#-how-the-solution-works)
- [Assumptions Made](#-assumptions-made)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [API Endpoints](#-api-endpoints)
- [Evaluation Focus Areas](#-evaluation-focus-areas)
- [Setup & Installation](#-setup--installation)
- [Project Structure](#-project-structure)

---

## 🎯 Chosen Vertical

**Sports & Entertainment (Fan Venue Concierge)**

ARIA addresses the critical logistical challenges of megavenues — where 50,000+ fans simultaneously struggle to find their seats, nearest concessions, restrooms, or emergency exits, often missing critical moments of the event they paid for.

---

## 🧠 Approach and Logic

We architected ARIA around a three-layer intelligence pipeline:

1. **AI Brain (Gemini 2.5 Flash)** — acts as an intent parser, not just a chatbot. Converts natural language ("I'm hungry") into structured JSON output containing coordinates, route targets, and contextual tips.
2. **Real-time Nervous System (Firebase RTDB)** — streams live venue state (crowd density, game phase, gate status) to every connected fan simultaneously without polling.
3. **Spatial Navigation Layer (Google Maps JS API)** — consumes Gemini's route output and renders animated, real-time polylines across the stadium, with a Satellite toggle for spatial clarity.

---

## ⚙️ How the Solution Works

1. **Onboarding** — A fan enters their section/row. ARIA registers their spatial position within the venue grid.
2. **Context-Aware Query** — The AI receives the user's message bundled with their seat location + live stadium state (e.g., "Gate 1 is currently High density").
3. **Structured Response** — Gemini returns strict JSON: `{ directions, targetId, tip }`.
4. **Wayfinding** — `maps.js` parses `targetId`, resolves the coordinate from `VENUE_ZONES`, and animates a blue polyline route directly on the Google Map.
5. **Satellite Toggle** — Users can switch from dark-mode roadmap to photorealistic satellite imagery for spatial orientation.

---

## 📌 Assumptions Made

- `VENUE_ZONES` in `js/maps.js` represents a mapped coordinate array for a real-world venue (Wembley Stadium, London).
- Fan devices have mobile data or venue Wi-Fi (PWA caches static assets offline).
- Firebase RTDB `crowd_density` values are updated by venue operators or simulated IoT sensors.
- The BigQuery analytics pipeline logs routing events; a live dataset would be attached in a full production rollout.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Gemini 2.5 Flash AI** | Context-aware, structured JSON responses with seat-location awareness |
| **Real-time Telemetry** | Firebase RTDB live crowd density and game phase broadcast |
| **Spatial Wayfinding** | Animated Google Maps polyline routing with custom venue markers |
| **Satellite Toggle** | Switch between dark roadmap and photorealistic satellite imagery |
| **Multilingual Support** | Runtime i18n switching across EN, HI, ES, FR |
| **PWA Offline Mode** | Service Worker v5 caching all static assets |
| **BigQuery Analytics** | Venue telemetry streaming to GCP Data Warehouse |
| **WCAG 2.1 AA** | Full accessibility compliance with `aria-live` regions and semantic HTML |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ARIA PWA (Vanilla JS, ES Modules)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐   │
│  │ app.js   │  │ gemini.js│  │ maps.js  │  │firebase.js│   │
│  │ (Router) │  │ (AI Core)│  │ (Spatial)│  │ (RTDB)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
┌────────────────────────┴────────────────────────────────────┐
│              Node.js + Express Production Server            │
│  ┌──────────────────┐  ┌───────────────────────────────┐   │
│  │ routes/venue.js  │  │ routes/analytics.js (BigQuery)│   │
│  └──────────────────┘  └───────────────────────────────┘   │
│  helmet · cors · express-rate-limit · firebase-admin        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Google Cloud Infrastructure                     │
│  Cloud Run · BigQuery · Firebase Auth/RTDB · Maps API       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES Modules) | Zero-framework, max efficiency PWA |
| **AI** | Gemini 2.5 Flash | Structured intent parsing and concierge responses |
| **Mapping** | Google Maps JavaScript API | Spatial routing, polylines, satellite toggle |
| **Database** | Firebase Auth + Realtime Database | Live crowd state and user session management |
| **Analytics** | Google Cloud BigQuery | Venue telemetry and crowd movement forecasting |
| **Backend** | Node.js + Express | Modular REST API with security middleware |
| **Security** | Helmet, CORS Whitelist, express-rate-limit | Enterprise-grade HTTP hardening |
| **Hosting** | Google Cloud Run | Auto-scaling containerized deployment |
| **Testing** | Jest + supertest | Unit, integration, and edge case validation |
| **Quality** | ESLint, Prettier, JSDoc | Enforced code standards and documentation |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Cloud Run uptime health check |
| `GET` | `/api/venue/zones` | Returns all venue zones with IDs and types |
| `GET` | `/api/venue/status` | Returns live game phase and crowd density |
| `POST` | `/api/analytics` | Logs a named event to Google Cloud BigQuery |

---

## 🏆 Evaluation Focus Areas

| Criterion | Implementation |
|---|---|
| **Code Quality** | ESLint-enforced, modular route architecture (`routes/`), full JSDoc documentation across all modules |
| **Security** | Strict Helmet CSP, CORS origin whitelist, DDoS rate-limiting, XSS input sanitization in `utils.js`, `.gcloudignore` secret isolation |
| **Efficiency** | Zero-framework Vanilla JS, Service Worker v5 caching, JSON body limits, Cloud Run auto-scaling |
| **Testing** | 5-file test suite: unit, AI edge cases, maps fallback, state integration flows, and live HTTP API tests via supertest |
| **Accessibility** | WCAG 2.1 AA, `aria-live` polite regions, semantic HTML5, `role` attributes, high-contrast dark theme, keyboard navigable |
| **Google Services** | Gemini 2.5 Flash, Google Maps API + Satellite, Firebase Auth/RTDB, Google Cloud Run, Cloud BigQuery analytics bridge |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key (Gemini)
- A [Firebase](https://console.firebase.google.com/) project (Spark Free Plan)
- A [Google Maps](https://console.cloud.google.com/apis/library/maps-javascript-backend.googleapis.com) JavaScript API key

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Priyansh-Bharti/ARIA---Arena-Real-time-Intelligence-Assistant.git
cd ARIA---Arena-Real-time-Intelligence-Assistant

# 2. Install all dependencies
npm install

# 3. Create configuration
cp js/config.example.js js/config.js
# Edit js/config.js with your actual API keys

# 4. Start the server
npm start

# 5. Run the full test suite
npm test
```

### Debug Mode
Append `?debug=true` to the URL for verbose console logging.

---

## 📁 Project Structure

```
ARIA/
├── index.html                  (PWA Entry Point)
├── offline.html                (Service Worker offline fallback)
├── manifest.json               (PWA manifest)
├── sw.js                       (Service Worker v5 — asset caching)
├── server.js                   (Modular production Express server)
├── package.json                (Dependencies + npm scripts)
├── Dockerfile                  (Cloud Run container definition)
├── .eslintrc.json              (ESLint code quality rules)
├── .gcloudignore               (Cloud Run build exclusions)
├── routes/
│   ├── analytics.js            (BigQuery event logging API)
│   └── venue.js                (Venue zones and status API)
├── tests/
│   ├── unit.test.js            (Core utility and i18n specs)
│   ├── gemini.test.js          (AI edge case and rate limit specs)
│   ├── maps.test.js            (Routing fallback and toggle specs)
│   ├── integration.test.js     (State-to-router flow specs)
│   └── api.test.js             (Live HTTP endpoint specs via supertest)
├── js/
│   ├── app.js                  (Main controller and screen router)
│   ├── gemini.js               (Hardened AI request controller)
│   ├── firebase.js             (Firebase Auth + RTDB client)
│   ├── maps.js                 (Google Maps engine + satellite toggle)
│   ├── notifications.js        (Idempotent push alert engine)
│   ├── i18n.js                 (Runtime multilingual engine)
│   ├── utils.js                (XSS sanitizer, debug logger, helpers)
│   └── config.example.js       (API key template — safe to commit)
├── styles/
│   ├── main.css                (Design system tokens and layout)
│   └── components.css          (UI component styles)
└── icons/                      (PWA icons and favicon assets)
```

---

<p align="center">
  Built with ❤️ for the <strong>Hack2Skill PromptWars Competition</strong> by <a href="https://github.com/Priyansh-Bharti">Priyansh Bharti</a>
</p>
