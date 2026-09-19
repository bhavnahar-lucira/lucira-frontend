/**
 * Canonical phone handling for the whole app.
 *
 * Every identifier we hand to an external system (WebEngage, Shopify, the CRM
 * webhooks) must go through here first. WebEngage keys users by the exact CUID
 * string, so `9967337489`, `919967337489` and `+919967337489` become three
 * separate profiles for one shopper — which is how a single user ended up
 * receiving the same WhatsApp/SMS several times and getting marked as spam.
 *
 * Invalid input returns "" rather than a best-effort string: forwarding junk
 * is what created the `+09967337489` and `+91+09967337489` profiles.
 */

const E164 = /^\+[1-9]\d{7,14}$/;
const IN_MOBILE = /^[6-9]\d{9}$/;

/**
 * Canonical identifier: `+91XXXXXXXXXX`.
 * Returns "" when the input is not a usable number — callers skip the send.
 */
export function toE164(input) {
  const raw = String(input ?? "").trim().replace(/[\s()\-.]/g, "");

  // A genuine non-India number (imported or international customer): keep it
  // as-is rather than slicing its last 10 digits into a fake Indian number.
  if (raw.startsWith("+") && !raw.startsWith("+91") && E164.test(raw)) return raw;

  const local = raw.replace(/\D/g, "").slice(-10);
  return IN_MOBILE.test(local) ? `+91${local}` : "";
}

/** 10-digit local form, for form fields and display. "" when invalid. */
export function toLocal(input) {
  const e164 = toE164(input);
  return e164.startsWith("+91") ? e164.slice(3) : "";
}
