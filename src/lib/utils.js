import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiFetch } from "./api";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    name + "=" + (JSON.stringify(value) || "") + expires + "; path=/";
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const val = decodeURIComponent(c.substring(nameEQ.length, c.length));
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
  }
  return null;
}

export async function uploadToShopify(file, customFilename = null) {
  try {
    const finalFilename = customFilename || file.name;
    // 1. Get staged target
    const { stagedTarget } = await apiFetch("/api/shopify/upload/staged", {
      method: "POST",
      body: JSON.stringify({
        filename: finalFilename,
        mimeType: file.type,
      }),
    });

    // 2. Upload to Shopify's URL
    const formData = new FormData();
    stagedTarget.parameters.forEach((param) => {
      formData.append(param.name, param.value);
    });
    formData.append("file", file);

    const uploadRes = await fetch(stagedTarget.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload file to Shopify storage");
    }

    // 3. Register file in Shopify
    const result = await apiFetch("/api/shopify/upload/register", {
      method: "POST",
      body: JSON.stringify({
        resourceUrl: stagedTarget.resourceUrl,
        mimeType: file.type,
        filename: finalFilename,
      }),
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to register file in Shopify");
    }

    return result.url;
  } catch (error) {
    console.error("Upload to Shopify error:", error);
    throw error;
  }
}

export function getValidSrc(src, fallback = "/images/product/1.jpg") {
  if (typeof src === "string" && src.trim() !== "") return src;
  if (src && typeof src === "object" && src.url) return src.url;
  return fallback;
}

// Generic stand-ins that some sources hand back in place of a real product shot.
const PLACEHOLDER_IMAGE_PATHS = ["/images/product/1.jpg"];

// Order/return thumbnails must show the actual item or nothing — a generic
// placeholder reads as "this is what you bought", which is worse than no image.
// Returns null when there's nothing real to show, so callers can skip the block.
export function getOrderImage(src) {
  let url = "";
  if (typeof src === "string") url = src.trim();
  else if (src && typeof src === "object" && src.url) url = String(src.url).trim();

  if (!url) return null;
  if (PLACEHOLDER_IMAGE_PATHS.some((path) => url === path || url.endsWith(path))) return null;
  return url;
}

/* ------------------------------------------------------------------
   Dispatch / delivery estimate
   ------------------------------------------------------------------
   DISPATCH_DEFAULTS mirrors DISPATCH_DEFAULTS in lucira-backend/routes/settings.js
   and DEFAULTS on the dashboard's dispatch-settings page — the shape the
   GET/POST /api/settings/dispatch endpoint speaks. The dashboard writes the
   config, the storefront reads it through the useDispatchInfo hook and renders
   it with formatDispatchMessage(). Keeping the defaults identical in all three
   places means the line still renders sensibly when the endpoint is
   unreachable, and that the dashboard's preview matches what shoppers see. */
export const DISPATCH_DEFAULTS = {
  enabled: true,
  timezone: "Asia/Kolkata",
  // A dispatch date that lands on a Sunday is bumped to Monday when true.
  excludeSundays: false,
  inStock: {
    label: "In stock",
    // Orders before this time dispatch after `beforeCutoffDays`, orders after
    // it dispatch after `afterCutoffDays`. Both counted from today.
    cutoffHour: 12,
    cutoffMinute: 0,
    beforeCutoffDays: 0,
    afterCutoffDays: 1,
    template: "Estimated dispatch by {date}",
    dateFormat: "MMM D, YYYY",
    timerEnabled: true,
    timerTemplate: "Order dispatches within {countdown} hrs",
  },
  madeToOrder: {
    label: "Made to order",
    // The product's own `lead_time` metafield overrides leadDays when present.
    leadDays: 12,
    bufferDays: 3,
    template: "Estimated dispatch by {date}",
    dateFormat: "MMM D, YYYY",
    timerEnabled: false,
    timerTemplate: "",
  },
};

// "Sept" rather than "Sep" — matches the dashboard's own preview strings.
const DISPATCH_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const DISPATCH_MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const dispatchInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const dispatchStr = (value, fallback) => {
  const s = String(value ?? "").trim();
  return s || fallback;
};

/* The same clamping the backend applies on write, repeated here because the
   config also reaches this file from a stale cache and from older saves that
   predate a field — a missing or junk number must never leak "NaN" into copy. */
export function mergeDispatchConfig(stored) {
  const s = stored || {};
  const inS = s.inStock || {};
  const mto = s.madeToOrder || {};
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : DISPATCH_DEFAULTS.enabled,
    timezone: dispatchStr(s.timezone, DISPATCH_DEFAULTS.timezone),
    excludeSundays: Boolean(s.excludeSundays),
    inStock: {
      label: dispatchStr(inS.label, DISPATCH_DEFAULTS.inStock.label),
      cutoffHour: dispatchInt(inS.cutoffHour, 0, 23, DISPATCH_DEFAULTS.inStock.cutoffHour),
      cutoffMinute: dispatchInt(inS.cutoffMinute, 0, 59, DISPATCH_DEFAULTS.inStock.cutoffMinute),
      beforeCutoffDays: dispatchInt(inS.beforeCutoffDays, 0, 60, DISPATCH_DEFAULTS.inStock.beforeCutoffDays),
      afterCutoffDays: dispatchInt(inS.afterCutoffDays, 0, 60, DISPATCH_DEFAULTS.inStock.afterCutoffDays),
      template: dispatchStr(inS.template, DISPATCH_DEFAULTS.inStock.template),
      dateFormat: dispatchStr(inS.dateFormat, DISPATCH_DEFAULTS.inStock.dateFormat),
      timerEnabled: typeof inS.timerEnabled === "boolean" ? inS.timerEnabled : DISPATCH_DEFAULTS.inStock.timerEnabled,
      timerTemplate: dispatchStr(inS.timerTemplate, DISPATCH_DEFAULTS.inStock.timerTemplate),
    },
    madeToOrder: {
      label: dispatchStr(mto.label, DISPATCH_DEFAULTS.madeToOrder.label),
      leadDays: dispatchInt(mto.leadDays, 0, 365, DISPATCH_DEFAULTS.madeToOrder.leadDays),
      bufferDays: dispatchInt(mto.bufferDays, 0, 90, DISPATCH_DEFAULTS.madeToOrder.bufferDays),
      template: dispatchStr(mto.template, DISPATCH_DEFAULTS.madeToOrder.template),
      dateFormat: dispatchStr(mto.dateFormat, DISPATCH_DEFAULTS.madeToOrder.dateFormat),
      timerEnabled: typeof mto.timerEnabled === "boolean" ? mto.timerEnabled : DISPATCH_DEFAULTS.madeToOrder.timerEnabled,
      timerTemplate: dispatchStr(mto.timerTemplate, DISPATCH_DEFAULTS.madeToOrder.timerTemplate),
    },
  };
}

/* Wall-clock parts of `date` in an IANA timezone. Cutoffs belong to the store,
   not the shopper, so everything downstream works off these numbers rather than
   the browser's own clock. An unusable timezone name falls back to local time
   instead of blanking the line. */
function dispatchZonedParts(date, timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const bag = {};
    for (const { type, value } of parts) bag[type] = value;
    return {
      year: Number(bag.year),
      month: Number(bag.month) - 1,
      day: Number(bag.day),
      // Some engines report midnight as hour 24.
      hour: Number(bag.hour) % 24,
      minute: Number(bag.minute),
      second: Number(bag.second),
    };
  } catch (e) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };
  }
}

/* Calendar-only arithmetic, anchored at UTC midnight so neither a DST shift nor
   the browser's offset can move the day. */
function dispatchAddDays(parts, days, excludeSundays) {
  const d = new Date(Date.UTC(parts.year, parts.month, parts.day));
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.trunc(days) || 0));
  if (excludeSundays && d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function formatDispatchDate(date, format) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const day = date.getUTCDate();
  switch (format) {
    case "MMMM D, YYYY": return `${DISPATCH_MONTHS_LONG[m]} ${day}, ${y}`;
    case "D MMM YYYY": return `${day} ${DISPATCH_MONTHS_SHORT[m]} ${y}`;
    case "DD/MM/YYYY": return `${String(day).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/${y}`;
    default: return `${DISPATCH_MONTHS_SHORT[m]} ${day}, ${y}`;
  }
}

function fillDispatchTokens(template, tokens) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => (key in tokens ? tokens[key] : `{${key}}`));
}

const pad2 = (n) => String(n).padStart(2, "0");

/* True only when the dashboard's countdown could actually tick — lets
   useDispatchInfo skip the 1s interval entirely when no timer is configured. */
export function dispatchConfigHasTimer(config) {
  const cfg = mergeDispatchConfig(config);
  if (!cfg.enabled) return false;
  const inStockTimer =
    cfg.inStock.timerEnabled &&
    Boolean(cfg.inStock.timerTemplate) &&
    cfg.inStock.beforeCutoffDays !== cfg.inStock.afterCutoffDays;
  const mtoTimer = cfg.madeToOrder.timerEnabled && Boolean(cfg.madeToOrder.timerTemplate);
  return inStockTimer || mtoTimer;
}

/**
 * The single source of truth for the dispatch line on the PDP, cart, checkout
 * summary and shipping page.
 *
 * @param config      the /api/settings/dispatch payload; a partial one is fine
 * @param inStock     true for the in-stock branch, false for made-to-order
 * @param leadTime    the product's `lead_time` metafield — made-to-order only,
 *                    falls back to config.madeToOrder.leadDays when absent
 * @param now         injectable clock (useDispatchInfo passes its ticking value)
 * @param allowTimer  false forces the plain-date wording; the first render uses
 *                    this so a ticking countdown can't cause a hydration mismatch
 *
 * @returns { enabled, label, date, dateText, text, sentence, showTimer, countdown, secondsToCutoff }
 *          `text` is the wording alone, `sentence` prefixes it with the label.
 */
export function formatDispatchMessage(config, options = {}) {
  const { inStock = true, leadTime, now = new Date(), allowTimer = true } = options;
  const cfg = mergeDispatchConfig(config);
  const section = inStock ? cfg.inStock : cfg.madeToOrder;
  const parts = dispatchZonedParts(now, cfg.timezone);

  // Seconds left until the next in-stock cutoff, and whether today's has passed.
  const cutoffSeconds = cfg.inStock.cutoffHour * 3600 + cfg.inStock.cutoffMinute * 60;
  const nowSeconds = parts.hour * 3600 + parts.minute * 60 + parts.second;
  let secondsToCutoff = cutoffSeconds - nowSeconds;
  let cutoffDayOffset = 0;
  if (secondsToCutoff <= 0) {
    secondsToCutoff += 86400;
    cutoffDayOffset = 1;
  }
  const countdown = `${pad2(Math.floor(secondsToCutoff / 3600))}:${pad2(Math.floor((secondsToCutoff % 3600) / 60))}:${pad2(secondsToCutoff % 60)}`;

  let showTimer = false;
  let dispatchDate;

  if (inStock) {
    // A countdown only means something when beating the cutoff changes the date.
    showTimer =
      allowTimer &&
      cfg.inStock.timerEnabled &&
      Boolean(cfg.inStock.timerTemplate) &&
      cfg.inStock.beforeCutoffDays !== cfg.inStock.afterCutoffDays;
    const offset = showTimer
      // The timer counts down to the *next* cutoff, so the date shown is the one
      // the shopper gets by beating it — tomorrow's once today's has passed.
      ? cutoffDayOffset + cfg.inStock.beforeCutoffDays
      : cutoffDayOffset === 0
        ? cfg.inStock.beforeCutoffDays
        : cfg.inStock.afterCutoffDays;
    dispatchDate = dispatchAddDays(parts, offset, cfg.excludeSundays);
  } else {
    const parsedLead = parseInt(leadTime, 10);
    const leadDays = Number.isNaN(parsedLead) || parsedLead <= 0 ? cfg.madeToOrder.leadDays : parsedLead;
    dispatchDate = dispatchAddDays(parts, leadDays + cfg.madeToOrder.bufferDays, cfg.excludeSundays);
    // Made-to-order has no cutoff of its own; if its copy asks for a countdown
    // it gets the in-stock one, so {countdown} never renders literally.
    showTimer = allowTimer && cfg.madeToOrder.timerEnabled && Boolean(cfg.madeToOrder.timerTemplate);
  }

  const dateText = formatDispatchDate(dispatchDate, section.dateFormat);
  const tokens = { date: dateText, countdown, label: section.label };
  const text = fillDispatchTokens(showTimer ? section.timerTemplate : section.template, tokens);

  return {
    enabled: cfg.enabled,
    label: section.label,
    date: dispatchDate,
    dateText,
    text,
    sentence: text ? `${section.label}. ${text}` : section.label,
    showTimer,
    countdown,
    secondsToCutoff,
  };
}

/**
 * Legacy string form, kept for callers that only need a sentence. Always the
 * plain-date wording — a frozen string can't tick, so it never renders the
 * countdown template. Prefer useDispatchInfo() / formatDispatchMessage().
 */
export function getEstimatedDispatchDate(isInStock, leadTime = 12, config = null) {
  const info = formatDispatchMessage(config, {
    inStock: Boolean(isInStock),
    leadTime,
    allowTimer: false,
  });
  return info.enabled ? info.text : "";
}
