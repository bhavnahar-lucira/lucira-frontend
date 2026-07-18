// ─────────────────────────────────────────────────────────────────────────────
// Canonical store registry — SINGLE SOURCE OF TRUTH for which retail stores are
// live on the website.
//
// The presentational data (images, hours, facilities, ratings, map links) still
// lives inside each surface component, because those surfaces intentionally use
// different imagery/copy. What is centralised here is the store IDENTITY and the
// `active` flag, so a store can be switched on/off across the ENTIRE site from
// one place.
//
// To hide a store everywhere (store locator, home "Experience Stores", contact
// us, PDP nearest store, collection banner): set `active: false` below.
// To add a store: add an entry here, then add its presentational data to the
// relevant surface(s).
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
  { handle: "lajpat-nagar-store", city: "Lajpat Nagar", name: "Lajpat Nagar Lucira Store", active: true, openingSoon: true },
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
