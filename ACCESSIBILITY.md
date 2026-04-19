# Accessibility Notes — ARIA Stadium Assistant

ARIA is designed to support inclusive use across diverse fan populations, including fans with disabilities, elderly attendees, non-English speakers, and users in high-noise, high-distraction venue conditions.

---

## Current Accessibility Coverage

### Keyboard & Focus
- All interactive elements (buttons, selectors, inputs) are keyboard-reachable via `Tab` and `Enter`
- Visible focus states on all controls via CSS `:focus-visible`
- No keyboard traps — users can always navigate away from modal elements

### Screen Reader Support
- `aria-live="polite"` regions on all dynamic content:
  - AI assistant responses
  - Wayfinding route updates
  - Crowd density notifications
  - Connection status changes
- `aria-label` attributes on all icon-only buttons (e.g. "Ask ARIA AI Assistant")
- `role` attributes used correctly throughout (`role="status"`, `role="progressbar"`, `role="navigation"`)
- Semantic HTML5 structure: `<header>`, `<main>`, `<nav>`, `<section>`, with a single `<h1>` per page

### Language & Internationalisation
- Full UI translation in **6 languages**: English (en), Hindi (hi), Spanish (es), French (fr), Arabic (ar), Chinese (zh)
- **RTL layout support** — Arabic automatically sets `document.documentElement.dir = 'rtl'`
- Language selector is always visible in the header and keyboard-accessible
- AI responses are requested in the user's selected language

### Visual Design
- High-contrast dark theme — no pure white backgrounds, minimum 4.5:1 contrast ratio
- Non-color status cues — crowd density is shown as text labels (`High`, `Medium`, `Low`) **and** colour
- No flashing or blinking animations that would trigger photosensitivity

### Offline & Connectivity
- Service Worker caches all static assets — app functions at reduced capability when offline
- `offline.html` renders localized messaging when the AI feed is unavailable
- Connection status badge updates in real-time through an `aria-live` region

### Navigation Accessibility
- Wayfinding routes returned as **structured text steps** (`routeSteps` array), not only map polylines
- Route metadata includes `walkTime` estimation for planning by users with mobility considerations
- Dijkstra routing supports future extension for `accessible` priority routes (shortest + flattest path)

---

## Feature-Specific Accessibility

### AI Concierge Chat
- Chat updates stream via SSE and are appended to an `aria-live` container
- Text input is labelled with `<label>` and associated via `for` / `id`
- Error states are announced through the live region, not modal dialogs

### Language Selector
- `<select>` element with `aria-label="Select Language"` — native semantic control
- Works without JavaScript for initial render

### Google Maps Integration
- Map is paired with wayfinding text directions — map is **never the sole** source of route information
- Zoom controls are keyboard-accessible via the Maps JS API defaults

### Crowd Density Alerts
- Alerts announced through `aria-live="assertive"` for high-density events
- Users can dismiss alerts via keyboard

---

## Known Limitations

- The Google Maps satellite view is a raster image — not accessible to screen readers beyond the textual route overlay
- The PWA install prompt relies on a browser event that is not uniformly keyboard-triggered across all browsers

---

## WCAG 2.1 AA Compliance

ARIA targets **WCAG 2.1 Level AA** conformance across all screens.

| Success Criterion | Status |
|---|---|
| 1.3.1 Info and Relationships | ✅ Semantic HTML5 |
| 1.4.3 Contrast (Minimum) | ✅ 4.5:1+ dark theme |
| 2.1.1 Keyboard | ✅ All controls keyboard-accessible |
| 2.4.3 Focus Order | ✅ Logical tab sequence |
| 3.1.1 Language of Page | ✅ `<html lang>` set dynamically |
| 3.3.1 Error Identification | ✅ Inline error messages |
| 4.1.2 Name, Role, Value | ✅ aria-label + role throughout |
| 4.1.3 Status Messages | ✅ aria-live regions |
