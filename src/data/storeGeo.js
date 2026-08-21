// ─────────────────────────────────────────────────────────────────────────────
// Geo layer for the store registry.
//
// PURELY ADDITIVE to src/data/stores.js — nothing in that file changes. This
// adds the two things the pincode module needs on top of the existing store
// identity: a coordinate for every store, and the answer to "is this a place a
// customer can walk into?".
//
// Coordinates here are a FALLBACK. `/api/stores` is the source of truth, but it
// reads lat/lng from Shopify *location metafields* (see backend
// routes/stores.js → `parseFloat(metafields.latitude || 0)`), which are blank
// for some locations and come back as 0. These values are the real coordinates
// from `location.address.{latitude,longitude}` in the Shopify Admin API, used
// whenever the API gives us a falsy/zero coordinate.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A store only earns a place in the "near you" ranking if a customer would
 * plausibly travel to it. 60 km keeps the whole Mumbai metro and the whole of
 * Delhi-NCR in play while correctly dropping cross-city stores — at 150 km a
 * Kandivali shopper would otherwise be told about Pune (131 km away).
 */
export const NEAREST_STORE_MAX_KM = 60;

/**
 * handle → { lat, lng, visitable }
 *
 * `visitable: false` means the location holds stock and fulfils orders but is
 * not a walk-in showroom, so it is never distance-ranked. Malad IS the Goregaon
 * head office / warehouse (Divinecarat Lifestyles, DLH Park, S.V. Road) — the
 * existing alias map in stores.js already routes "divinecarat" → "malad".
 */
export const STORE_GEO = {
  "malad":                    { lat: 19.1743803, lng: 72.8447280, visitable: false },
  "sky-city-borivali-store":  { lat: 19.2232556, lng: 72.8640139, visitable: true },
  "chembur-store":            { lat: 19.0579383, lng: 72.9004860, visitable: true },
  "pune-store":               { lat: 18.5233666, lng: 73.8499211, visitable: true },
  "noida-store":              { lat: 28.5699580, lng: 77.3233777, visitable: true },
  "paschim-vihar":            { lat: 28.6681970, lng: 77.0945777, visitable: true },
  "lajpat-nagar-store":       { lat: 28.5692718, lng: 77.2441075, visitable: true },
};

/** Coordinates for a store handle, or null when we have none. */
export function geoForHandle(handle) {
  return STORE_GEO[handle] || null;
}

/**
 * Can a customer walk into this store? Unknown handles default to `true` so a
 * newly-added store is never silently excluded from the ranking.
 */
export function isStoreVisitable(handle) {
  const g = STORE_GEO[handle];
  return g ? g.visitable !== false : true;
}

/**
 * Pick the best coordinate available for a store: whatever `/api/stores`
 * returned, falling back to the table above. Returns null if neither has one.
 */
export function resolveCoords(handle, apiLat, apiLng) {
  const lat = Number(apiLat);
  const lng = Number(apiLng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return { lat, lng };
  }
  const fallback = STORE_GEO[handle];
  return fallback ? { lat: fallback.lat, lng: fallback.lng } : null;
}

/**
 * Short, customer-facing store label. Mirrors `getStoreDisplayName` used on the
 * PDP and in AtcBar so the header never disagrees with them.
 */
const DISPLAY_NAMES = {
  "malad": "Malad",
  "sky-city-borivali-store": "Borivali",
  "chembur-store": "Chembur",
  "pune-store": "Pune",
  "noida-store": "Noida",
  "paschim-vihar": "Paschim Vihar",
  "lajpat-nagar-store": "Lajpat Nagar",
};

export function storeShortName(handle, fallbackName = "") {
  if (DISPLAY_NAMES[handle]) return DISPLAY_NAMES[handle];
  const n = String(fallbackName || "");
  if (n.includes("Divinecarat")) return "Malad";
  if (n === "BO1") return "Borivali";
  if (n === "CS1") return "Chembur";
  if (n === "PS1") return "Pune";
  if (n === "NOS18") return "Noida";
  return n;
}
