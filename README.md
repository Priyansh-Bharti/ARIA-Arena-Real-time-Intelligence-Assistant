<p align="center">
  <img src="https://img.shields.io/badge/ARIA-Stadium%20Assistant-blueviolet?style=for-the-badge&logo=googlecloud&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-2.5%20Flash%20v0.21-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Google%20Maps-Spatial%20AI-34A853?style=for-the-badge&logo=googlemaps&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloud%20Run-Deployed-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloud%20Storage-GCS-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" />
  <img src="https://img.shields.io/badge/BigQuery-Analytics-669DF6?style=for-the-badge&logo=googlebigquery&logoColor=white" />
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
| **IoT Sensor Simulator** | Gaussian-noise crowd data published to Firebase RTDB every 5 seconds |
| **Venue Digital Twin** | `venueTwin.js` merges static venue blueprint with live sensor state |
| **Spatial Wayfinding** | Animated Google Maps polyline routing with custom venue markers |
| **Satellite Toggle** | Switch between dark roadmap and photorealistic satellite imagery |
| **Multilingual Support** | Runtime i18n switching across EN, HI, ES, FR, AR, ZH (6 languages, RTL-aware) |
| **PWA Offline Mode** | Service Worker v5 caching all static assets |
| **BigQuery Analytics** | Venue telemetry streaming to GCP Data Warehouse |
| **Cloud Storage Uploads** | Receipt/ticket photo uploads via `POST /api/upload/receipt` → GCS signed URL |
| **SSE Streaming Chat** | Server-Sent Events for real-time token-by-token Gemini responses |
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
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ routes/venue  │  │ routes/chat  │  │ routes/upload   │  │
│  │ routes/      │  │ (SSE+Gemini) │  │ (Cloud Storage) │  │
│  │ analytics    │  └──────────────┘  └─────────────────┘  │
│  │ wayfinding   │                                          │
│  └───────────────┘                                         │
│  venueTwin.js · venueContext.js · eventLogger.js            │
│  helmet · cors · express-rate-limit · express-validator     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Google Cloud Infrastructure (7 Services)        │
│  Cloud Run · Cloud Build · BigQuery · Cloud Storage          │
│  Firebase Auth/RTDB · Gemini 2.5 Flash · Maps JS API         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES Modules) | Zero-framework, max efficiency PWA |
| **AI** | Gemini 2.5 Flash (`@google/generative-ai@0.21.0`) | Structured intent parsing, SSE streaming responses |
| **Mapping** | Google Maps JavaScript API | Spatial routing, polylines, satellite toggle |
| **Database** | Firebase Auth + Realtime Database | Live crowd state, event logging, user sessions |
| **Analytics** | Google Cloud BigQuery | Venue telemetry and crowd movement forecasting |
| **Storage** | Google Cloud Storage | Receipt/ticket photo uploads with signed URLs |
| **Backend** | Node.js + Express | 5-route modular REST API with security middleware |
| **Security** | Helmet, CORS Whitelist, express-rate-limit, express-validator | Enterprise-grade HTTP hardening + input validation |
| **CI/CD** | Google Cloud Build (`cloudbuild.yaml`) | Automated build + deploy pipeline |
| **Hosting** | Google Cloud Run | Auto-scaling containerized deployment |
| **Testing** | Jest + supertest | 7 test files: unit, AI, maps, integration, API, language |
| **Quality** | ESLint, Prettier, JSDoc | Enforced code standards and documentation |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Cloud Run uptime health check |
| `GET` | `/api/venue/zones` | Returns all venue zones with IDs and types |
| `GET` | `/api/venue/status` | Returns live game phase and crowd density |
| `POST` | `/api/analytics` | Logs a named event to Google Cloud BigQuery |
| `POST` | `/api/chat` | SSE-streamed Gemini 2.5 response with live twin context |
| `GET` | `/api/wayfinding/zones` | Returns all navigable venue zones |
| `POST` | `/api/wayfinding/resolve` | Resolves a destination ID to coordinates + walk time |
| `POST` | `/api/upload/receipt` | Uploads stadium receipt to Google Cloud Storage → signed URL |
| `GET` | `/api/upload/status` | Reports Cloud Storage connection status |

---

## 🏆 Evaluation Focus Areas

| Criterion | Implementation |
|---|---|
| **Code Quality** | ESLint-enforced, 5 modular routes (`analytics`, `venue`, `wayfinding`, `chat`, `upload`), `venueTwin.js` digital twin pattern, `venueContext.js` data layer, full JSDoc documentation |
| **Security** | Strict Helmet CSP, CORS whitelist, DDoS rate-limiting, `express-validator` input sanitization on all routes, `firebase.rules` DB-level auth, `.gcloudignore` secret isolation |
| **Efficiency** | Zero-framework Vanilla JS, Service Worker v5 caching, `npm prune --omit=dev` lean container, JSON body limits, Cloud Run auto-scaling |
| **Testing** | 7-file test suite: unit, AI edge cases, maps fallback, state integration, live HTTP API (supertest), language tests (6 langs), global mock setup (setup.js) |
| **Accessibility** | WCAG 2.1 AA, `aria-live` polite regions, semantic HTML5, RTL support for Arabic, 6-language i18n (EN/HI/ES/FR/AR/ZH), keyboard navigable, high-contrast dark theme |
| **Google Services** | **7 services**: Gemini 2.5 Flash, Google Maps API + Satellite, Firebase Auth/RTDB, Google Cloud Run, Cloud Build CI/CD, BigQuery analytics, Cloud Storage uploads |

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
├── index.html                  (PWA Entry Point — 6-lang selector)
├── offline.html                (Service Worker offline fallback)
├── manifest.json               (PWA manifest)
├── sw.js                       (Service Worker v5 — asset caching)
├── server.js                   (Modular production Express server)
├── package.json                (Dependencies + npm scripts)
├── Dockerfile                  (Cloud Run container + npm prune)
├── cloudbuild.yaml             (Google Cloud Build CI/CD pipeline)
├── firebase.rules              (Firebase RTDB security rules)
├── .env.example                (Environment variable template)
├── .eslintrc.json              (ESLint code quality rules)
├── .gcloudignore               (Cloud Run build exclusions)
├── venueContext.js             (Static venue data layer)
├── venueTwin.js                (Digital twin — live state store)
├── eventLogger.js              (Firebase push() every 30s — audit trail)
├── sensorSimulator.js          (IoT Gaussian-noise crowd data → Firebase)
├── routes/
│   ├── analytics.js            (BigQuery event logging API)
│   ├── venue.js                (Venue zones and status API)
│   ├── wayfinding.js           (Destination resolver + zone listing)
│   ├── chat.js                 (SSE-streamed Gemini chat API)
│   └── upload.js               (Google Cloud Storage receipt upload)
├── tests/
│   ├── setup.js                (Global Jest mocks — Firebase, Maps, fetch)
│   ├── unit.test.js            (Core utility and i18n specs)
│   ├── gemini.test.js          (AI edge case and rate limit specs)
│   ├── maps.test.js            (Routing fallback and toggle specs)
│   ├── integration.test.js     (State-to-router flow specs)
│   ├── api.test.js             (Live HTTP endpoint specs via supertest)
│   └── languageTests.js        (i18n validation for all 6 languages)
├── js/
│   ├── app.js                  (Main controller and screen router)
│   ├── gemini.js               (Hardened AI request controller)
│   ├── firebase.js             (Firebase Auth + RTDB client)
│   ├── maps.js                 (Google Maps engine + satellite toggle)
│   ├── notifications.js        (Idempotent push alert engine)
│   ├── i18n.js                 (Runtime multilingual engine — EN/HI/ES/FR/AR/ZH)
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
