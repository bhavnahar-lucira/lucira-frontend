// ─────────────────────────────────────────────────────────────────────────────
// Legacy store registry — NO LONGER where you add a store.
//
// Store content and which surfaces a store appears on are managed in
// Dashboard → Stores (/api/settings/store-pages) and read through
// src/lib/storeContent.js. Adding a store is a dashboard edit, not a code
// change, and an unknown handle is treated as live by everything below.
//
// What still lives here:
//   • `active: false` — an emergency, deploy-level kill switch that overrides
//     the dashboard on the store surfaces. Prefer the dashboard's own
//     "Published" toggle; this stays for the cases where you cannot reach it.
//   • `handleFromStoreName` — maps a Shopify location's name/code (BO1, PS1…)
//     to a collection handle for the PDP nearest-store surface. The backend
//     mirrors this table in lucira-backend/lib/storePages.js.
//
// See also src/data/storeGeo.js for the coordinate fallbacks.
//
// `handle` is the Shopify collection handle used at /collections/<handle>.
// ─────────────────────────────────────────────────────────────────────────────

export const STORES = [
  { handle: "malad", city: "Malad", name: "Head Office", active: true },
  { handle: "sky-city-borivali-store", city: "Borivali", name: "Borivali Lucira Store", active: true },
  { handle: "chembur-store", city: "Chembur", name: "Chembur Lucira Store", active: true },
  { handle: "pune-store", city: "Pune", name: "Pune Lucira Store", active: true },
  { handle: "noida-store", city: "Noida", name: "Noida Lucira Store", active: true },
  { handle: "paschim-vihar", city: "Paschim Vihar", name: "Paschim Vihar Lucira Store", active: true },
  { handle: "lajpat-nagar-store", city: "Lajpat Nagar", name: "Lajpat Nagar Lucira Store", active: true, openingSoon: false },
];

const _byHandle = Object.fromEntries(STORES.map((s) => [s.handle, s]));

// Maps the location names/codes returned by the backend `/api/stores` (as shown
// in Shopify Admin → Locations) to our collection handle, so the PDP nearest
// store surface can respect the same active flag.
const _backendNameToHandle = [
  { match: "divinecarat", handle: "malad" },
  { match: "bo1", handle: "sky-city-borivali-store" },
  { match: "borivali", handle: "sky-city-borivali-store" },
  { match: "cs1", handle: "chembur-store" },
  { match: "chembur", handle: "chembur-store" },
  { match: "ps1", handle: "pune-store" },
  { match: "pune", handle: "pune-store" },
  { match: "nos18", handle: "noida-store" },
  { match: "noida", handle: "noida-store" },
  { match: "paschim", handle: "paschim-vihar" },
  { match: "lajpat", handle: "lajpat-nagar-store" },
];

/** Extract a collection handle from a link like "/collections/pune-store". */
export function handleFromDesignLink(link = "") {
  const m = String(link).match(/\/collections\/([^/?#]+)/);
  return m ? m[1] : "";
}

/** Resolve a backend location name/code (e.g. "BO1", "Lajpat Nagar") to a handle. */
export function handleFromStoreName(name = "") {
  const n = String(name).toLowerCase();
  const found = _backendNameToHandle.find((e) => n.includes(e.match));
  return found ? found.handle : "";
}

/**
 * Is this store live on the site?
 * Unknown handles default to `true` so surfaces that reference a store not (yet)
 * in this registry are never accidentally hidden.
 */
export function isStoreActive(handle) {
  if (!handle) return true;
  const s = _byHandle[handle];
  return s ? s.active !== false : true;
}

/** Convenience for surfaces keyed by /collections link. */
export function isStoreActiveByLink(link) {
  return isStoreActive(handleFromDesignLink(link));
}

/** Is this store not yet open (show an "Opening Soon" state instead of live status)? */
export function isStoreOpeningSoon(handle) {
  if (!handle) return false;
  const s = _byHandle[handle];
  return !!(s && s.openingSoon);
}
