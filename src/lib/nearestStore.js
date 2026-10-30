// ─────────────────────────────────────────────────────────────────────────────
// Pincode → ranked nearest stores.
//
// Reuses the plumbing that already exists rather than adding any:
//   • `/api/stores`            (backend routes/stores.js — Mongo, Shopify-synced)
//   • `/api/pincodes/check`    (backend routes/pincodes.js — Mongo pincode geo)
//   • calculateDistance()      (src/utils/distance.js — Haversine)
//   • handleFromStoreName()    (src/data/stores.js — existing alias map)
//   • isStoreActive()          (src/data/stores.js — central on/off switch)
//
// PERFORMANCE: `/api/stores` is fetched at most once per page load and shared by
// every caller (in-flight requests are deduped, results memoised). Pincode
// lookups are memoised per pincode. Nothing here runs until something actually
// asks for a resolution — importing this module costs nothing.
// ─────────────────────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";
import { calculateDistance } from "@/utils/distance";
import { STORES, handleFromStoreName, isStoreActive } from "@/data/stores";
import {
  NEAREST_STORE_MAX_KM,
  STORE_GEO,
  isStoreVisitable,
  resolveCoords,
  storeShortName,
} from "@/data/storeGeo";

/* ---------------------------------------------------------------- caches ---- */

let storesPromise = null;              // dedupes the single /api/stores call
const pincodePromises = new Map();     // pincode -> Promise<pinData>
const MAX_PIN_CACHE = 20;

function getStores() {
  if (!storesPromise) {
    storesPromise = apiFetch("/api/stores")
      .then((res) => res?.stores || [])
      .catch(() => {
        // Allow a later retry rather than caching the failure forever.
        storesPromise = null;
        return [];
      });
  }
  return storesPromise;
}

function getPincodeData(pincode) {
  if (pincodePromises.has(pincode)) return pincodePromises.get(pincode);

  const p = apiFetch(`/api/pincodes/check?pincode=${pincode}`, {
    suppressErrorLog: true,
  })
    .then((res) => ({
      success: !!res?.success,
      deliverable: !!res?.deliverable,
      data: res?.data || null,
    }))
    .catch(() => {
      pincodePromises.delete(pincode);
      return null;
    });

  // Keep the cache small — a shopper only ever tries a handful of pincodes.
  if (pincodePromises.size >= MAX_PIN_CACHE) {
    pincodePromises.delete(pincodePromises.keys().next().value);
  }
  pincodePromises.set(pincode, p);
  return p;
}

/* ------------------------------------------------------------- normalise ---- */

/**
 * `/api/stores` returns one long address string with the city, state and pincode
 * repeated on the end, e.g.
 *   "Sky City Mall, S-40, 2nd Floor, Western Express Hwy, Borivali East,
 *    Mumbai - 400066 , Mumbai, Maharashtra - 400066"
 *
 * Reduce it to the landmark a shopper would actually navigate by: drop everything
 * from the first " - " (that's where the duplicated tail starts), throw away shop
 * numbers and floors, and keep the first two meaningful parts.
 */
function shortAddress(raw) {
  const head = String(raw || "").split(" - ")[0];
  const parts = head
    .split(",")
    .map((s) => s.trim())
    .filter(
      (s) =>
        s &&
        // shop/unit/plot numbers
        !/^(shop\s*no\.?|s-|no\.?\s*\d|unit|g-|plot)/i.test(s) &&
        // a bare street number on its own, e.g. "487" or "12A"
        !/^\d+[A-Za-z]?$/.test(s) &&
        // floors
        !/^\d+\s*(st|nd|rd|th)?\s*floor$/i.test(s) &&
        !/^(ground|first|second|third)\s*floor$/i.test(s)
    );
  return parts.slice(0, 2).join(", ");
}

/**
 * Turn a raw `/api/stores` row into the shape the UI wants, resolving its
 * collection handle through the alias map that already exists in stores.js.
 */
function decorate(store) {
  const handle = handleFromStoreName(store?.name || "");
  const coords = resolveCoords(handle, store?.latitude ?? store?.lat, store?.longitude ?? store?.lng);
  return {
    ...store,
    handle,
    shortName: storeShortName(handle, store?.name),
    addressShort: shortAddress(store?.address),
    mapLink: store?.mapLink || "",
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    visitable: isStoreVisitable(handle),
  };
}

/**
 * `/api/stores` reads a Mongo collection that is populated by a MANUAL sync
 * (`POST /api/stores/sync-shopify`). Any Shopify location added since the last
 * sync is simply absent — at the time of writing that is Lajpat Nagar and
 * Paschim Vihar, so a Delhi shopper would be pointed at Noida.
 *
 * Rather than let the header silently under-report stores whenever the sync is
 * stale, fill the gap from the registry in src/data/stores.js (which the team
 * already treats as the source of truth for which stores are live on the site)
 * plus the coordinates in storeGeo.js. Real rows always win; these only appear
 * for a store the API didn't return at all, and they disappear on the next sync.
 */
function mergeWithRegistry(apiStores) {
  const fromApi = (apiStores || []).map(decorate);
  const seen = new Set(fromApi.map((s) => s.handle).filter(Boolean));

  const missing = STORES.filter(
    (s) => s.active !== false && !seen.has(s.handle) && STORE_GEO[s.handle]
  ).map((s) => ({
    shopifyId: `registry:${s.handle}`,
    name: s.name,
    city: s.city,
    handle: s.handle,
    shortName: storeShortName(s.handle, s.name),
    lat: STORE_GEO[s.handle].lat,
    lng: STORE_GEO[s.handle].lng,
    visitable: isStoreVisitable(s.handle),
    fromRegistry: true,
  }));

  return [...fromApi, ...missing];
}

/* -------------------------------------------------------------- resolver ---- */

export const NO_PINCODE = {
  pincode: "",
  status: "empty",
  deliverable: false,
  coords: null,
  city: "",
  nearby: [],
  warehouses: [],
  nearest: null,
};

/**
 * Resolve a 6-digit pincode into a ranked list of stores.
 *
 * @returns {Promise<{
 *   pincode: string,
 *   status: "empty"|"invalid"|"out_of_range"|"resolved",
 *   deliverable: boolean,
 *   coords: {lat:number,lng:number}|null,
 *   city: string,
 *   nearby: Array<object>,      // visitable stores within NEAREST_STORE_MAX_KM, nearest first
 *   warehouses: Array<object>,  // non-visitable locations (Malad / Goregaon)
 *   nearest: object|null        // nearby[0], or null when out of range
 * }>}
 */
export async function resolveNearestStores(rawPincode) {
  const pincode = String(rawPincode || "").replace(/\D/g, "").slice(0, 6);
  if (pincode.length !== 6) return { ...NO_PINCODE, pincode };

  const [stores, pinData] = await Promise.all([getStores(), getPincodeData(pincode)]);

  // Unknown pincode — the lookup succeeded but has no such record.
  if (!pinData || !pinData.success || !pinData.data) {
    return { ...NO_PINCODE, pincode, status: "invalid" };
  }

  const lat = Number(pinData.data.latitude);
  const lng = Number(pinData.data.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
  const city = pinData.data.city || pinData.data.district || pinData.data.state || "";

  const live = mergeWithRegistry(stores)
    // Respect the central kill-switch in src/data/stores.js.
    .filter((s) => isStoreActive(s.handle));

  const warehouses = live.filter((s) => !s.visitable);

  // EVERY visitable store with coordinates, nearest first and NOT distance-capped.
  // This is the ordering signal: a shopper 900km from the nearest store is still
  // better served by a piece that physically exists at *some* store than by one
  // that has to be made to order, so the ranking degrades gradually instead of
  // falling off a cliff at NEAREST_STORE_MAX_KM.
  const ranked = hasCoords
    ? live
        .filter((s) => s.visitable && s.lat != null && s.lng != null)
        .map((s) => ({ ...s, distance: calculateDistance(lat, lng, s.lat, s.lng) }))
        .filter((s) => s.distance != null)
        .sort((a, b) => a.distance - b.distance)
    : [];

  // The UI signal, still capped. The header promises a store the shopper could
  // actually walk into, so "nearest store" must never read as one 900km away —
  // `status` and `nearest` keep hanging off this, unchanged.
  const nearby = ranked.filter((s) => s.distance <= NEAREST_STORE_MAX_KM);

  return {
    pincode,
    status: nearby.length ? "resolved" : "out_of_range",
    deliverable: pinData.deliverable,
    coords: hasCoords ? { lat, lng } : null,
    city,
    nearby,
    ranked,
    warehouses,
    nearest: nearby[0] || null,
  };
}

/** Human-readable distance: "3.6 km" under 10, "18 km" above. */
export function formatKm(km) {
  if (km == null) return "";
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}
