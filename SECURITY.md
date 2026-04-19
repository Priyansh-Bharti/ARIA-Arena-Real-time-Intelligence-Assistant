# Security Policy

## Supported Version

The current `1.x` line is the supported submission version for ARIA.

## Reporting a Vulnerability

Please do not open a public issue for security-sensitive findings.

Report vulnerabilities privately by opening a GitHub security advisory at:  
`https://github.com/Priyansh-Bharti/ARIA-Arena-Real-time-Intelligence-Assistant/security/advisories`

Please include:
- A short description of the issue
- Reproduction steps
- Likely impact estimate
- Suggested mitigation if known

Acknowledgement within 48 hours, triage within 5 working days.

---

## Security Controls in This Repository

### HTTP Layer (Helmet.js)
- `Content-Security-Policy` — restricts script/style/image origins to trusted domains only
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing attacks
- `X-Frame-Options: DENY` — prevents clickjacking via iFrame embedding
- `Strict-Transport-Security` — enforces HTTPS in production
- `Referrer-Policy: no-referrer` — no referrer leakage on cross-origin navigation
- `X-Powered-By` header removed — no server fingerprinting

### CORS Policy
- Explicit origin whitelist in production (`allowedOrigins` array in `server.js`)
- Wildcard CORS is **never** permitted — any unlisted origin receives a `403 CORS Policy Violation`

### Rate Limiting
- Global: 100 requests per IP per 15 minutes (express-rate-limit)
- `/api/chat` has an additional per-IP 2-second cooldown
- Exceeding limits returns `429 Too Many Requests`

### Input Validation
- All `POST` route bodies are validated using `express-validator`
- Message length bounded to 1–500 characters
- Language codes validated against an explicit allowlist (`en`, `hi`, `es`, `fr`, `ar`, `zh`)
- Invalid inputs return `400 Bad Request` with a descriptive error array

### Firebase Database Security
- `firebase.rules` enforces authentication on all read/write at the database level
- `crowd_density` values validated as strings with max length 10
- `event_log` entries require all mandatory fields before write is permitted
- Unauthenticated users receive a permission-denied error from Firebase directly

### Secret Management
- No API keys committed to source — `js/config.js` is in `.gitignore`
- `.env.example` documents all required variables without real values
- `.gcloudignore` prevents secret files from being uploaded to Cloud Run builds  
- All runtime secrets are injected via Cloud Run environment variables

### Container Hardening
- Production container built with `npm prune --omit=dev` — zero devDependencies in image
- `node:18-slim` base image — minimal attack surface
- Cloud Run enforces HTTPS termination at the load balancer

### Deterministic Routing
- Navigation paths are computed by the Dijkstra engine in `routes/wayfinding.js`
- **AI (Gemini) is never used to make routing decisions** — it only phrases responses
- This prevents prompt-injection attacks from redirecting fans to malicious locations

---

## Production Deployment Notes

- `NODE_ENV=production` must be set for Helmet's full header suite to activate
- `ALLOWED_ORIGINS` should be set to the live Cloud Run URL only
- Keep `DEBUG` URL parameter disabled in the load balancer for public-facing deployments
- Rotate all API keys immediately if a `js/config.js` with real keys is accidentally committed
