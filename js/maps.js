/**
 * ARIA — Google Maps Integration
 * Handles venue markers, dark mode styling, and dynamic wayfinding routes.
 * @module maps
 */

import { debug } from './utils.js';

let map, routePath;
let lastRoute = null;

const STADIUM_COORDS = { lat: 51.5560, lng: -0.2796 };
const COLORS = { primary: '#2979FF', bg: '#0F131F', accent: '#FFF3D2' };

/* ── Venue Registry ─────────────────────────────────────────────── */

const VENUE_ZONES = [
  { id: 'gate_1', name: 'Gate 1 North', lat: 51.5570, lng: -0.2796, type: 'GATE' },
  { id: 'gate_2', name: 'Gate 2 South', lat: 51.5550, lng: -0.2796, type: 'GATE' },
  { id: 'gate_3', name: 'Gate 3 East', lat: 51.5560, lng: -0.2780, type: 'GATE' },
  { id: 'gate_4', name: 'Gate 4 West', lat: 51.5560, lng: -0.2810, type: 'GATE' },
  { id: 'food', name: 'Food Court Level 1', lat: 51.5565, lng: -0.2800, type: 'FOOD' },
  { id: 'restroom_b', name: 'Restroom Block B', lat: 51.5562, lng: -0.2805, type: 'RESTROOM' },
  { id: 'medical', name: 'Medical Station North', lat: 51.5568, lng: -0.2790, type: 'MEDICAL' }
];

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] }
];

/* ── Map Lifecycle ──────────────────────────────────────────────── */

/**
 * Initializes the venue map within the specified container.
 * @param {string} containerId - DOM ID for the map instance
 * @param {boolean} isCompact - Whether to show the simplified 'mini' view
 */
export async function initArenaMap(containerId, isCompact = false) {
  const apiKey = window.MAPS_API_KEY;
  if (!apiKey) { debug('MAPS_API_KEY missing'); return; }

  try {
    if (!window.google) {
      await Promise.race([
        loadScript(apiKey),
        new Promise((_, reject) => setTimeout(() => reject('Maps timeout'), 5000))
      ]);
    }
  } catch (err) {
    debug('Maps SDK failed:', err);
    return;
  }

  const el = document.getElementById(containerId);
  if (!el || (map && el.dataset.initialized)) return;

  map = new google.maps.Map(el, {
    center: STADIUM_COORDS,
    zoom: isCompact ? 16 : 17,
    mapId: 'ARIA_VENUE_MAP',
    disableDefaultUI: true,
    zoomControl: true,
    styles: DARK_STYLE
  });

  el.dataset.initialized = 'true';
  el.setAttribute('aria-label', 'Stadium navigation map');
  addMarkers();

  if (lastRoute) {
    drawAnimatedRoute(lastRoute.start, lastRoute.end);
  }
}

function loadScript(key) {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMapCallback&libraries=geometry`;
    s.async = true;
    s.defer = true;
    window.initMapCallback = resolve;
    document.head.appendChild(s);
  });
}

function addMarkers() {
  VENUE_ZONES.forEach(zone => {
    new google.maps.Marker({
      position: { lat: zone.lat, lng: zone.lng },
      map,
      title: zone.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: zone.type === 'GATE' ? COLORS.primary : COLORS.accent,
        fillOpacity: 0.9,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 8
      }
    });
  });
}

/* ── Wayfinding Logic ───────────────────────────────────────────── */

/**
 * Resolves a destination ID (e.g., 'food', 'restroom_b') to a coordinate pair
 * and draws an animated route from the user's base stadium position.
 * @param {string} targetId - Identifier for the destination zone
 */
export function routeToDestination(targetId) {
  const zone = VENUE_ZONES.find(z => z.id === targetId || z.type.toLowerCase() === targetId);
  if (zone) {
    drawAnimatedRoute(STADIUM_COORDS, { lat: zone.lat, lng: zone.lng });
  } else {
    // Default to Center Pitch if target is unknown
    drawAnimatedRoute(STADIUM_COORDS, STADIUM_COORDS);
  }
}

/**
 * Draws an animated polyline between two stadium coordinates.
 * @param {Object} start - Starting LatLng
 * @param {Object} end - Destination LatLng
 */
export function drawAnimatedRoute(start = STADIUM_COORDS, end) {
  if (!map || !end) return;
  if (routePath) routePath.setMap(null);

  lastRoute = { start, end };

  routePath = new google.maps.Polyline({
    path: [start, start],
    geodesic: true,
    strokeColor: COLORS.primary,
    strokeOpacity: 0,
    icons: [{
      icon: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 3,
        strokeColor: COLORS.primary
      },
      offset: '0',
      repeat: '15px'
    }],
    map
  });

  let step = 0;
  const total = 40;
  const interval = setInterval(() => {
    step++;
    if (step > total) { clearInterval(interval); return; }
    routePath.setPath([start, {
      lat: start.lat + (end.lat - start.lat) * (step / total),
      lng: start.lng + (end.lng - start.lng) * (step / total)
    }]);
  }, 20);
}
