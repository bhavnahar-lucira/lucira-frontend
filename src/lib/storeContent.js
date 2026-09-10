// ─────────────────────────────────────────────────────────────────────────────
// Store content — one dashboard-managed source for every store surface.
//
// Surfaces fed from here:
//   collectionBanner → /collections/<handle> hero  (StoreCollectionBanner)
//   homepage         → "Visit Lucira Store Near You" on /  (StoreLocatorSection)
//   productPage      → the same section on the PDP
//   storeLocator     → /pages/store-locator cards
//   footerLink       → the "Visit our stores:" links in PopularSearches
//   experienceStores → the "Lucira's Experience Stores" phone/email/address
//                      block above the homepage footer copy
//
// Adding a store is a dashboard edit (Dashboard → Stores), not a code change.
//
// This module is universal on purpose: `getStorePages` is only ever called from
// server components, while the selectors and formatters below are pure and are
// imported by the client components that render the surfaces.
// ─────────────────────────────────────────────────────────────────────────────

import { STORE_PAGE_DEFAULTS } from "@/data/storePageDefaults";

/** Surface keys, mirroring `SURFACE_KEYS` in lucira-backend/lib/storePages.js. */
export const STORE_SURFACES = {
  collectionBanner: "collectionBanner",
  homepage: "homepage",
  productPage: "productPage",
  storeLocator: "storeLocator",
  footerLink: "footerLink",
  experienceStores: "experienceStores",
};

// The homepage and the PDP render the same component, so they share one order.
const SORT_KEY_BY_SURFACE = {
  homepage: "homepage",
  productPage: "homepage",
  storeLocator: "storeLocator",
  footerLink: "footerLink",
  experienceStores: "experienceStores",
};

function backendBase() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : "http://127.0.0.1:8080";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Fetch the store content for a server component.
 *
 * `force-cache` so it inherits the page's own `revalidate` window, exactly like
 * the PLP-banner fetch next to it. Any failure falls back to the generated
 * defaults, which are the verbatim pre-dashboard content — the store surfaces
 * can never go blank because the backend is down.
 */
export async function getStorePages() {
  try {
    const res = await fetch(`${backendBase()}/api/settings/store-pages`, { cache: "force-cache" });
    if (!res.ok) return STORE_PAGE_DEFAULTS;
    const data = await res.json();
    if (!data || !Array.isArray(data.stores) || data.stores.length === 0) return STORE_PAGE_DEFAULTS;
    return data;
  } catch {
    return STORE_PAGE_DEFAULTS;
  }
}

/** Normalise whatever a component was handed — prop, `null`, or a bare array. */
export function asStorePages(input) {
  if (Array.isArray(input)) return { ...STORE_PAGE_DEFAULTS, stores: input };
  if (input && Array.isArray(input.stores) && input.stores.length) return input;
  return STORE_PAGE_DEFAULTS;
}

/**
 * Published stores that opted into `surface`, in that surface's display order.
 * A store with no per-surface position falls back to its global one, so a newly
 * added store lands at the end instead of reshuffling the existing tabs.
 */
export function storesForSurface(input, surface) {
  const { stores } = asStorePages(input);
  const sortKey = SORT_KEY_BY_SURFACE[surface];
  return stores
    .filter((s) => s.published !== false && s?.surfaces?.[surface] !== false)
    .map((s, i) => {
      const override = sortKey ? s?.sortOverrides?.[sortKey] : null;
      const position = typeof override === "number" ? override : (typeof s.sort === "number" ? s.sort : i);
      return { store: s, position };
    })
    .sort((a, b) => a.position - b.position)
    .map((x) => x.store);
}

/** The store that owns /collections/<handle>, or null. */
export function storeByHandle(input, handle) {
  if (!handle) return null;
  const { stores } = asStorePages(input);
  return stores.find((s) => s.handle === handle) || null;
}

/**
 * Handles that render a store hero instead of the usual PLP banner. Includes
 * unpublished stores and stores with the hero switched off, so those collection
 * pages keep showing no top banner at all — which is what they do today.
 */
export function storeCollectionHandles(input) {
  const { stores } = asStorePages(input);
  return stores.map((s) => s.handle).filter(Boolean);
}

/* ── Hours & status ───────────────────────────────────────────────────────── */

function formatTime(time) {
  const [rawH, rawM] = String(time || "").split(":");
  let h = Number(rawH);
  const m = Number(rawM);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** "Monday - Sunday | 10:30 am - 10:00 pm", or the split Mon-Fri / Sat-Sun form. */
export function formatTimings(store) {
  if (store?.hoursLabel) return store.hoursLabel;
  const weekday = store?.hours?.weekday || {};
  const weekend = store?.hours?.weekend || {};
  const same = weekday.open === weekend.open && weekday.close === weekend.close;
  if (same) {
    return `Monday - Sunday | ${formatTime(weekday.open)} - ${formatTime(weekday.close)}`;
  }
  return `Mon-Fri | ${formatTime(weekday.open)} - ${formatTime(weekday.close)}  •  Sat-Sun | ${formatTime(weekend.open)} - ${formatTime(weekend.close)}`;
}

/** Is the store within its opening hours right now, in IST? */
export function isStoreOpenIST(store) {
  const hours = store?.hours;
  if (!hours) return false;

  const indiaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = indiaNow.getDay();
  const isWeekend = day === 0 || day === 6;
  const window = isWeekend ? hours.weekend : hours.weekday;
  if (!window) return false;

  const [openHour, openMinute] = String(window.open || "").split(":").map(Number);
  const [closeHour, closeMinute] = String(window.close || "").split(":").map(Number);
  if (![openHour, openMinute, closeHour, closeMinute].every(Number.isFinite)) return false;

  const currentMinutes = indiaNow.getHours() * 60 + indiaNow.getMinutes();
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  // Closing after midnight.
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

/**
 * The pill shown over the store image.
 * `tone: "open"` is the green treatment — "Opening Soon" has always used it too.
 */
export function storeStatus(store) {
  if (store?.status === "opening_soon") {
    return { label: "Opening Soon", tone: "open", openingSoon: true };
  }
  if (store?.status === "temporarily_closed") {
    return { label: "Temporarily Closed", tone: "closed", openingSoon: false };
  }
  const open = isStoreOpenIST(store);
  return { label: open ? "Open Now" : "Closed", tone: open ? "open" : "closed", openingSoon: false };
}

/** Where "VIEW AVAILABLE DESIGNS" points. */
export function designsLink(store) {
  return store?.links?.designs || (store?.handle ? `/collections/${store.handle}` : "/");
}

/* ── Store locator ────────────────────────────────────────────────────────── */

/**
 * Flatten a store into the shape the /pages/store-locator cards (and the
 * checkout pickup hook) have always consumed, so those call sites stay as they
 * were while the content behind them becomes dashboard-managed.
 */
export function toLocatorShape(store) {
  const links = store?.links || {};
  return {
    handle: store?.handle || "",
    city: store?.city || "",
    name: store?.name || "",
    rating: store?.rating ?? null,
    openingSoon: store?.status === "opening_soon",
    image: store?.images?.locator || store?.images?.homepage || "",
    timings: formatTimings(store),
    mapLink: links.map || "",
    whatsappLink: links.whatsapp || "",
    callLink: links.call || "",
    designLink: designsLink(store),
    directionsLink: links.directions || links.map || "",
    lat: store?.geo?.lat ?? 0,
    lng: store?.geo?.lng ?? 0,
    address: store?.address || "",
  };
}

/** The store-locator cards, in order. */
export function locatorStores(input) {
  return storesForSurface(input, "storeLocator").map(toLocatorShape);
}

/* ── Experience-stores footer block ───────────────────────────────────────── */

/**
 * The "Lucira's Experience Stores" cards: name, phone, email, address.
 *
 * `phone` is the number as it should read and `links.call` is what it dials —
 * they differ in spacing across the existing stores, so a blank `phone` falls
 * back to the dial target with the tel: prefix stripped. That way a store
 * configured with only a phone link still shows a number here.
 */
export function experienceStores(input) {
  return storesForSurface(input, "experienceStores").map((s) => {
    const call = s?.links?.call || "";
    const phone = s?.phone || call.replace(/^tel:/i, "");
    return {
      handle: s.handle,
      label: s.experienceLabel || (s.city ? `${s.city} Store` : s.name || ""),
      phone,
      phoneHref: call || (phone ? `tel:${phone.replace(/\s+/g, "")}` : ""),
      email: s.email || "",
      address: s.address || "",
      mapUrl: s?.links?.map || "",
    };
  });
}

/** Footer "Visit our stores:" entries, in surface order. */
export function footerStoreLinks(input) {
  return storesForSurface(input, "footerLink")
    .map((s) => ({
      label: s.footerLinkLabel || `Lab Grown Diamond Jewelry in ${s.city || s.name}`,
      href: `https://www.lucirajewelry.com/collections/${s.handle}`,
    }))
    .filter((l) => l.href);
}
