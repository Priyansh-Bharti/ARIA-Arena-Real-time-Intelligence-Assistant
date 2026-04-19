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

ARIA is built around a **three-engine architecture** with strict separation of concerns:

1. **Crowd Engine (`engine/crowdEngine.js`)** — Simulates live venue crowd density using Gaussian-noise time-of-day curves for 5 game phases (pre-match → post-match). Merges real Firebase RTDB data, predicts short-term congestion, and surfaces hotspot zones. This is the single source of truth for all crowd state.
2. **Decision Engine (`engine/decisionEngine.js`)** — Implements Dijkstra's shortest-path algorithm on a 15-node venue graph with 24 bidirectional edges. Applies live crowd-density penalties per edge. Supports 5 routing priority modes. **Routing is always deterministic — AI never decides the path.**
3. **AI Engine (`engine/aiEngine.js`)** — Isolated Gemini integration. Receives the pre-computed Dijkstra route and phrases it as a natural-language narrative. AI is architecturally prevented from making routing decisions — this eliminates prompt-injection attacks and ensures auditable, explainable paths.

All three engines feed a thin HTTP adapter layer (`routes/`) and a real-time Firebase nervous system that streams live state to every connected frontend simultaneously.

---

## ⚙️ How the Solution Works

1. **Onboarding** — A fan enters their section/row. ARIA registers their spatial position within the venue grid.
2. **Crowd Engine tick** — Gaussian-noise simulation (5 game phases) generates per-zone density; Firebase RTDB live data overrides simulated values in real time.
3. **Fan query received** — User message is sanitized, language-detected, and bundled with the live Venue Digital Twin context.
4. **Decision Engine routing** — Dijkstra's algorithm runs on the crowd-penalised graph using the selected routing mode (balanced / low_crowd / accessible / family_friendly / fast_exit).
5. **AI Engine narrates** — Gemini receives the computed route steps and rephrases them as a friendly walking narrative in the fan's chosen language.
6. **Map renders** — Google Maps JS API animates a polyline along the computed path coordinates. Satellite toggle available for spatial orientation.

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
| **Dijkstra Pathfinding** | Deterministic shortest-path routing on a 15-node venue graph with 24 edges |
| **5 Routing Modes** | `balanced`, `fast_exit`, `low_crowd`, `accessible`, `family_friendly` — each with different crowd and accessibility penalty weights |
| **Crowd Engine** | Gaussian-noise simulation across 5 game phases + Firebase live data merging + short-term congestion prediction |
| **Decision Engine** | AI-isolated routing — Gemini never decides the path; Dijkstra always does |
| **AI Engine** | Gemini 2.5 Flash phrases the pre-computed route — grounded narration, never hallucinated routing |
| **Venue Digital Twin** | `venueTwin.js` merges static blueprint + live sensor state for AI context injection |
| **Real-time Telemetry** | Firebase RTDB live crowd density with IoT Gaussian-noise simulator every 5 seconds |
| **Spatial Wayfinding** | Animated Google Maps polyline routing with satellite toggle and custom markers |
| **Multilingual Support** | Runtime i18n switching across EN, HI, ES, FR, AR, ZH (6 languages, RTL-aware) |
| **PWA Offline Mode** | Service Worker v5 caching all static assets — works at venue without internet |
| **BigQuery Analytics** | Venue telemetry streaming to GCP Data Warehouse |
| **Cloud Storage Uploads** | Receipt/ticket photo uploads via `POST /api/upload/receipt` → GCS signed URL |
| **SSE Streaming Chat** | Server-Sent Events for real-time token-by-token Gemini responses |
| **WCAG 2.1 AA** | Full accessibility compliance — `ACCESSIBILITY.md` policy document included |

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
                         │ HTTP / SSE
┌────────────────────────┴────────────────────────────────────┐
│              Node.js + Express (HTTP Adapter Layer)         │
│  routes/venue · routes/chat · routes/wayfinding             │
│  routes/analytics · routes/upload                           │
│  helmet · cors · express-rate-limit · express-validator     │
└────────────┬────────────────────────────────────────────────┘
             │ delegates to
┌────────────┴────────────────────────────────────────────────┐
│                  3-Engine Core (Deterministic)              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ crowdEngine.js   │  │ decisionEngine.js│                 │
│  │ Gaussian noise   │  │ Dijkstra algo    │                 │
│  │ Phase multipliers│  │ 5 routing modes  │                 │
│  │ Firebase merge   │  │ Crowd penalties  │                 │
│  │ Hotspot detect   │  │ Accessibility    │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  aiEngine.js     │  │  venueTwin.js    │                 │
│  │  Gemini narrates │  │  Digital twin    │                 │
│  │  NEVER routes    │  │  Live state      │                 │
│  └──────────────────┘  └──────────────────┘                 │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────┴────────────────────────────────────────────────┐
│         Google Cloud Infrastructure (7 Services)            │
│  Cloud Run · Cloud Build · BigQuery · Cloud Storage         │
│  Firebase Auth/RTDB · Gemini 2.5 Flash · Maps JS API        │
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
| **Routing Engine** | Dijkstra's algorithm (`engine/decisionEngine.js`) | Deterministic crowd-aware pathfinding — 5 priority modes |
| **Crowd Engine** | Gaussian noise + Firebase RTDB (`engine/crowdEngine.js`) | Time-of-day simulation, prediction, hotspot detection |
| **AI Engine** | Gemini 2.5 Flash isolated (`engine/aiEngine.js`) | Narration-only — never makes routing decisions |
| **Backend** | Node.js + Express | 5-route thin HTTP adapter layer + security middleware |
| **Security** | Helmet, CORS Whitelist, express-rate-limit, express-validator, `SECURITY.md` | Enterprise-grade hardening + policy documentation |
| **CI/CD** | Google Cloud Build (`cloudbuild.yaml`) | Automated build + deploy pipeline |
| **Hosting** | Google Cloud Run | Auto-scaling containerized deployment |
| **Testing** | Jest + supertest | 14 test files · 195+ test cases |
| **Quality** | ESLint, Prettier, JSDoc | Enforced code standards and inline documentation |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Cloud Run uptime health check |
| `GET` | `/api/venue/zones` | Returns all venue zones with IDs and types |
| `GET` | `/api/venue/status` | Returns live game phase and crowd density |
| `POST` | `/api/analytics` | Logs a named event to Google Cloud BigQuery |
| `POST` | `/api/chat` | SSE-streamed Gemini 2.5 response with live Digital Twin context |
| `GET` | `/api/wayfinding/zones` | Returns all 15 navigable venue zones with coordinates |
| `POST` | `/api/wayfinding/resolve` | **Dijkstra route** from entrance → target with crowd penalties |
| `GET` | `/api/wayfinding/modes` | Lists all 5 routing modes with descriptions |
| `GET` | `/api/wayfinding/crowd` | Live crowd state + hotspots from Crowd Engine |
| `GET` | `/api/wayfinding/graph` | Venue graph: nodes, edges, distances (for visualisation) |
| `POST` | `/api/upload/receipt` | Uploads stadium receipt to Google Cloud Storage → signed URL |
| `GET` | `/api/upload/status` | Reports Cloud Storage connection status |

---

## 🏆 Evaluation Focus Areas

| Criterion | Implementation |
|---|---|
| **Code Quality** | 3-engine architecture (`crowdEngine`, `decisionEngine`, `aiEngine`) with strict separation of concerns. Thin HTTP adapters in `routes/`. Dijkstra pathfinding with 5 routing modes. AI-isolated narration. Full JSDoc + ESLint throughout. |
| **Security** | Helmet CSP, CORS whitelist, rate-limiting, `express-validator` on all POST routes, `firebase.rules` DB-level auth, `.gcloudignore` secret isolation, `SECURITY.md` policy document |
| **Efficiency** | Zero-framework Vanilla JS, Service Worker v5 caching (offline-capable), `npm prune --omit=dev` lean Docker image, deterministic Dijkstra routing (no AI latency in path computation) |
| **Testing** | **14 test files · 195+ test cases** — unit, AI schema, maps/coordinate, integration flows, live HTTP (supertest), 6-language i18n, security headers, performance benchmarks, venue contracts, upload, wayfinding, digital twin lifecycle, analytics, crowd engine |
| **Accessibility** | WCAG 2.1 AA · `ACCESSIBILITY.md` policy document · `aria-live` regions · RTL Arabic · 6-language i18n (EN/HI/ES/FR/AR/ZH) · `accessible` and `family_friendly` routing modes · keyboard navigable |
| **Google Services** | **7 services**: Gemini 2.5 Flash, Google Maps JS API + Satellite, Firebase Auth/RTDB, Google Cloud Run, Cloud Build CI/CD, BigQuery analytics, Cloud Storage uploads |

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
├── engine/
│   ├── crowdEngine.js          (Crowd simulation — Gaussian noise, phase curves, Firebase merge, prediction)
│   ├── decisionEngine.js       (Dijkstra routing — 5 modes, crowd penalties, accessibility flags)
│   └── aiEngine.js             (Gemini isolation — narrates routes, NEVER decides them)
├── routes/
│   ├── analytics.js            (BigQuery event logging API)
│   ├── venue.js                (Venue zones and status API)
│   ├── wayfinding.js           (HTTP adapter → decisionEngine + crowdEngine)
│   ├── chat.js                 (SSE-streamed Gemini chat → aiEngine)
│   └── upload.js               (Google Cloud Storage receipt upload)
├── tests/
│   ├── setup.js                (Global Jest mocks — Firebase, Maps, fetch)
│   ├── unit.test.js            (35 tests — utilities, i18n, state, sanitization)
│   ├── gemini.test.js          (22 tests — schema, sanitization, fallback, JSON parsing)
│   ├── maps.test.js            (20 tests — zone resolution, coords, Haversine, satellite)
│   ├── integration.test.js     (25 tests — login flow, wayfinding, crowd, lifecycle)
│   ├── api.test.js             (5 tests  — live HTTP endpoint specs via supertest)
│   ├── languageTests.js        (12 tests — i18n validation for all 6 languages)
│   ├── security.test.js        (13 tests — headers, validation, rate limits)
│   ├── performance.test.js     (12 tests — response time, concurrency, memory)
│   ├── venue.test.js           (13 tests — zone listing, status, data contracts)
│   ├── upload.test.js          (10 tests — GCS upload, fallback, filename contract)
│   ├── wayfinding.test.js      (15 tests — resolver, coordinates, response format)
│   ├── venueTwin.test.js       (25 tests — twin lifecycle, merge, schema updates)
│   └── analytics.test.js      (13 tests — BigQuery logging, degradation, validation)
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
