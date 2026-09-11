// ─────────────────────────────────────────────────────────────────────────────
// Book Appointment — shared data + pure helpers for /pages/book-an-appointment.
//
// Three journeys live on that page and all of them end the same way: verify the
// shopper's number over OTP, then push one verified lead to the store-footfall
// webhook. Everything they need that is not React lives here.
//
// The webhook is the SAME endpoint the PDP "Stores Nearby" sticky CTA posts to
// (see src/components/AtcBar.jsx), so the `name` / `pincode` / `phone` keys are
// spelled exactly as that form spells them — the sheet behind it already has
// those columns. Appointment-only fields are added alongside, never renamed.
// ─────────────────────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";
import { calculateDistance } from "@/utils/distance";
import { handleFromStoreName } from "@/data/stores";

export const APPOINTMENT_WEBHOOK =
  "https://store-footfall-pdp-forn-385594025448.asia-south1.run.app";

// A store only counts as "nearby" within this radius. Beyond it both the store
// visit and the try-at-home journeys fall back to the video-call offer, which is
// what the flow doc calls the `x` in "If No Store is Available Near `x` kms".
export const NEARBY_RADIUS_KM = 30;

// Stores open at 10:30 AM and shut at 10 PM, so the bookable window carries a
// 30-min opening buffer and a 1-hour closing buffer: 11 AM → 9 PM, hourly.
const FIRST_SLOT_HOUR = 11;
const LAST_SLOT_HOUR = 21;

// A slot has to be at least this far out to still be bookable today — nobody can
// take a booking for a slot that starts in four minutes.
const SLOT_LEAD_MINUTES = 30;

export const APPOINTMENT_TYPES = {
  videoCall: "video_call",
  visitStore: "visit_store",
  tryAtHome: "try_at_home",
};

export const PRODUCT_CATEGORIES = [
  "Engagement Rings",
  "Wedding Rings",
  "Rings",
  "Earrings",
  "Necklaces",
  "Pendants",
  "Bracelets",
  "Bangles",
  "Mangalsutra",
  "Nosepins",
  "Mens Jewelry",
  "Solitaires",
];

export const VISIT_PURPOSES = [
  "Engagement / Proposal",
  "Wedding Shopping",
  "Anniversary Gift",
  "Birthday Gift",
  "Self Purchase",
  "Old Gold Exchange",
  "Just Browsing",
  "Other",
];

/* ─── Stores ──────────────────────────────────────────────────────────────── */

// Shopify location codes are not shopper-facing names. Same mapping the PDP
// nearest-store surfaces use, so every surface names a store identically.
export function getStoreDisplayName(name) {
  if (!name) return "";
  if (name.includes("Divinecarat")) return "Head Office";
  if (name === "BO1") return "Borivali";
  if (name === "CS1") return "Chembur";
  if (name === "PS1") return "Pune";
  if (name === "NOS18") return "Noida";
  return name;
}

/** Shopper-facing label used across the cards and drawers: "Borivali Store". */
export function storeLabel(store) {
  const name = getStoreDisplayName(store?.name);
  if (!name) return "Lucira Store";
  return /store/i.test(name) ? name : `${name} Store`;
}

/** The store's own PLP, e.g. /collections/sky-city-borivali-store. */
export function storeCollectionUrl(store) {
  const handle = handleFromStoreName(store?.name || "");
  return handle ? `/collections/${handle}` : "/collections/fast-shipping";
}

export function storeAddress(store) {
  if (!store) return "";
  const base = store.address1 || store.address || "";
  // The backend already appends city/province/zip to `address`; only the legacy
  // `address1` shape needs the city glued back on.
  if (store.address1 && store.city && !base.includes(store.city)) {
    return `${base}, ${store.city}`;
  }
  return base;
}

/**
 * The pincode the shopper has already given the site (header pill / delivery
 * check), read from the cookie the header writes. Prefilled into both
 * pincode-gated journeys so nobody types the same six digits twice — they still
 * press Continue, so it stays a suggestion rather than a silent assumption.
 */
export function savedPincode() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(^| )user_pincode=([^;]+)/);
  if (!match) return "";
  const digits = decodeURIComponent(match[2]).replace(/\D/g, "").slice(0, 6);
  return digits.length === 6 ? digits : "";
}

export function formatDistance(km) {
  if (km === null || km === undefined) return "";
  return km < 10 ? `${km.toFixed(1)} km away` : `${Math.round(km)} km away`;
}

/**
 * Free-text geocode for a pincode we do not have on file.
 *
 * /api/pincodes/check only knows serviceable pincodes, so a perfectly real
 * pincode outside the delivery list would otherwise come back without
 * coordinates and every store would look infinitely far away. Nominatim is
 * already the site's geocoder (see PincodePanel's "Locate Me"), so reuse it
 * rather than failing the shopper closed.
 */
async function geocodePincode(pincode) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&country=India&postalcode=${pincode}&limit=1`
    );
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

/**
 * Every live store, ordered nearest-first for the given pincode.
 *
 * Returns `{ stores, coords }`. `coords: null` means we could not place the
 * pincode at all — callers must treat that as "no store nearby" rather than
 * guessing, otherwise the distance-free list would read as if the first store
 * were the closest one.
 */
export async function fetchStoresForPincode(pincode) {
  const [storesRes, pinRes] = await Promise.allSettled([
    apiFetch("/api/stores"),
    apiFetch(`/api/pincodes/check?pincode=${pincode}`, { suppressErrorLog: true }),
  ]);

  const allStores = storesRes.status === "fulfilled" ? storesRes.value?.stores || [] : [];
  if (!allStores.length) return { stores: [], coords: null };

  const pinData = pinRes.status === "fulfilled" ? pinRes.value?.data : null;
  let coords =
    pinData?.latitude && pinData?.longitude
      ? { lat: pinData.latitude, lng: pinData.longitude }
      : null;
  if (!coords) coords = await geocodePincode(pincode);

  const stores = allStores.map((store) => {
    const lat = store.latitude || store.lat;
    const lng = store.longitude || store.lng;
    const distance = coords && lat && lng ? calculateDistance(coords.lat, coords.lng, lat, lng) : null;
    return { ...store, distance };
  });

  stores.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    if (a.distance !== null) return -1;
    if (b.distance !== null) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return { stores, coords };
}

/** The nearest store inside NEARBY_RADIUS_KM, or null when there is none. */
export function nearestStoreWithin(stores, radiusKm = NEARBY_RADIUS_KM) {
  const first = (stores || []).find((s) => s.distance !== null && s.distance <= radiusKm);
  return first || null;
}

/* ─── Dates & slots ───────────────────────────────────────────────────────── */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today plus the next `count - 1` days, the window the flow doc asks for. */
export function upcomingDays(count = 7, from = new Date()) {
  const days = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    days.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      date: d,
      dayNum: d.getDate(),
      dayName: DAY_NAMES[d.getDay()],
      label: `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      isToday: i === 0,
    });
  }
  return days;
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(display).padStart(2, "0")}:00 ${suffix}`;
}

/** The fixed 11 AM → 9 PM hourly grid, as `{ hour, label }`. */
export function timeSlots() {
  const slots = [];
  for (let h = FIRST_SLOT_HOUR; h <= LAST_SLOT_HOUR; h += 1) {
    slots.push({ hour: h, label: formatHour(h) });
  }
  return slots;
}

/** A slot on a future day is always open; today's slots need SLOT_LEAD_MINUTES. */
export function isSlotAvailable(day, slot, now = new Date()) {
  if (!day?.isToday) return true;
  const start = new Date(
    day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), slot.hour, 0, 0, 0
  );
  return start.getTime() - now.getTime() >= SLOT_LEAD_MINUTES * 60 * 1000;
}

/** First day in the list that still has a bookable slot — today may not. */
export function firstBookableDay(days, now = new Date()) {
  const slots = timeSlots();
  return days.find((d) => slots.some((s) => isSlotAvailable(d, s, now))) || days[0];
}

/* ─── Lead submission ─────────────────────────────────────────────────────── */

/**
 * Push one OTP-verified appointment to the store-footfall webhook.
 *
 * Called only after verify-otp succeeds: the flow doc is explicit that the OTP
 * step exists to keep unverified leads away from the store teams.
 */
export async function submitAppointmentLead(payload) {
  const body = {
    // Keys shared with the PDP store-footfall form — do not rename.
    name: (payload.name || "").trim(),
    pincode: payload.pincode || "",
    phone: payload.phone || "",
    page_url: typeof window !== "undefined" ? window.location.href : "",
    timestamp: new Date().toISOString(),
    // Appointment-specific fields.
    source: "book-an-appointment",
    appointment_type: payload.appointmentType || "",
    email: (payload.email || "").trim(),
    store_name: payload.storeName || "",
    store_address: payload.storeAddress || "",
    appointment_date: payload.appointmentDate || "",
    appointment_time: payload.appointmentTime || "",
    purpose_of_visit: payload.purpose || "",
    product_categories: (payload.categories || []).join(", "),
    otp_verified: true,
  };

  const res = await fetch(APPOINTMENT_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}
