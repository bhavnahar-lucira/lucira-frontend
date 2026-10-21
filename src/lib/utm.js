// Single home for UTM capture and carry-through.
//
// Why this exists: a campaign link into a login-gated page (e.g.
// /admin/orders?utm_source=…) used to be rewritten to a bare /login before GTM
// had loaded, so GA4's first page_view saw no UTMs and the session was
// attributed to (direct)/(none). The helpers here let the auth redirects keep
// the UTMs on the URL, and let the data layer fall back to the UTMs that
// opened this browser session when the current URL has none.
//
// Storage (unchanged shape — the backend reads the cookie in routes/cart.js and
// routes/checkout.js):
//   cookie        lucira_utms          30 days   last-known campaign, CRM attribution
//   localStorage  lucira_utms          persists  fallback for the cookie
//   sessionStorage lucira_utms_session this tab  campaign that opened THIS session

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
];

const STORAGE_KEY = "lucira_utms";
const SESSION_KEY = "lucira_utms_session";
const COOKIE_DAYS = 30;

const isBrowser = () => typeof window !== "undefined";

const readCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const safeParse = (str) => {
  if (!str) return null;
  try {
    const parsed = JSON.parse(str);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null;
  }
};

/**
 * Pull the utm_* keys out of a URLSearchParams (or a plain object).
 * Only keys with a non-empty value are returned.
 */
export const pickUtms = (params) => {
  const out = {};
  if (!params) return out;
  const get =
    typeof params.get === "function" ? (k) => params.get(k) : (k) => params[k];
  for (const key of UTM_KEYS) {
    const value = get(key);
    if (value) out[key] = String(value);
  }
  return out;
};

/** UTMs present on the URL the browser is showing right now. */
export const getCurrentUrlUtms = () => {
  if (!isBrowser()) return {};
  try {
    return pickUtms(new URLSearchParams(window.location.search));
  } catch (e) {
    return {};
  }
};

/**
 * Last-known UTMs: cookie first, then localStorage. Same precedence as before
 * this file existed (moved here from checkout-crm.js).
 */
export const getStoredUtms = () => {
  if (!isBrowser()) return {};
  try {
    const fromCookie = safeParse(decodeURIComponent(readCookie(STORAGE_KEY) || ""));
    if (fromCookie) return fromCookie;
    return safeParse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
};

/** UTMs that opened this browser tab's session (sessionStorage). */
export const getSessionUtms = () => {
  if (!isBrowser()) return {};
  try {
    return safeParse(sessionStorage.getItem(SESSION_KEY)) || {};
  } catch (e) {
    return {};
  }
};

/**
 * Persist the UTMs found on `searchParams`. Behaviour is unchanged from the
 * previous checkout-crm.js implementation (keys present on the URL overwrite
 * the stored ones, keys absent are left as they were), plus:
 *   - utm_id is now captured too
 *   - a session-scoped copy is written for the data-layer fallback
 */
export const saveUtmsFromUrl = (searchParams) => {
  if (!isBrowser()) return;
  const utms = pickUtms(searchParams);
  if (Object.keys(utms).length === 0) return;

  const newUtms = { ...getStoredUtms(), ...utms };
  const strUtms = JSON.stringify(newUtms);

  try {
    localStorage.setItem(STORAGE_KEY, strUtms);
  } catch (e) {}

  try {
    const date = new Date();
    date.setTime(date.getTime() + COOKIE_DAYS * 24 * 60 * 60 * 1000);
    document.cookie =
      STORAGE_KEY +
      "=" +
      encodeURIComponent(strUtms) +
      "; expires=" +
      date.toUTCString() +
      "; path=/; SameSite=Lax";
  } catch (e) {}

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...getSessionUtms(), ...utms }));
  } catch (e) {}
};

/**
 * Only allow same-origin relative paths as redirect targets so a crafted
 * ?redirect=https://evil.example can never bounce a logged-in user off-site.
 */
export const safeInternalPath = (value, fallback = "/") => {
  if (typeof value !== "string" || !value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
};

/** Path + query + hash of the page the browser is on, for a `redirect` param. */
export const getCurrentFullPath = () => {
  if (!isBrowser()) return "/";
  return window.location.pathname + window.location.search + window.location.hash;
};

/**
 * Return `path` with the UTMs from the CURRENT URL appended (if the path does
 * not already carry them) plus any `extra` params. Only the live URL is used,
 * never the 30-day cookie: re-attaching a weeks-old campaign to a fresh direct
 * visit would mis-attribute that session in GA4.
 *
 *   withUtms("/login", { redirect: "/admin/orders?utm_source=x" })
 *   → "/login?utm_source=x&redirect=%2Fadmin%2Forders%3Futm_source%3Dx"
 */
export const withUtms = (path, extra = {}) => {
  const target = typeof path === "string" && path ? path : "/";
  const hashIndex = target.indexOf("#");
  const hash = hashIndex >= 0 ? target.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? target.slice(0, hashIndex) : target;
  const qIndex = base.indexOf("?");
  const pathname = qIndex >= 0 ? base.slice(0, qIndex) : base;
  const params = new URLSearchParams(qIndex >= 0 ? base.slice(qIndex + 1) : "");

  const utms = getCurrentUrlUtms();
  for (const key of UTM_KEYS) {
    if (utms[key] && !params.has(key)) params.set(key, utms[key]);
  }
  for (const [key, value] of Object.entries(extra || {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }

  const query = params.toString();
  return pathname + (query ? `?${query}` : "") + hash;
};
