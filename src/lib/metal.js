// Display helpers for a cart/checkout line item's metal, shared by the cart page and
// the checkout summary so every surface renders purity identically.

// Live variant data stores metal purity as "09K" / "14K" (zero-padded, no T), while the
// design — and this app's own PDP fallback and sample data — use "14KT". Normalise for
// DISPLAY only; the raw value still goes to Shopify and analytics untouched.
//
//   "09K" -> "9KT"   "14K" -> "14KT"   "14KT" -> "14KT"   "Platinum 950" -> unchanged
export function formatKarat(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const m = s.match(/^0*(\d{1,2})\s*k(?:t)?$/i);
  return m ? `${m[1]}KT` : s;
}

// Full metal string for a line item, e.g. "14KT Yellow Gold".
export function formatMetal(karat, color) {
  const k = formatKarat(karat);
  const c = String(color ?? "").trim();
  if (!k) return c;
  // Some colours already carry the purity ("14KT Yellow Gold") — don't double it up.
  if (c.toLowerCase().includes(k.toLowerCase())) return c;
  return `${k} ${c}`;
}

// Products with no real size option (pendants, studs) carry the METAL as their variant
// option value, e.g. "9KT Yellow Gold". That isn't a size and must not be shown as one —
// the metal already has its own row.
const METAL_VALUE = /\b(gold|platinum|silver)\b/i;
export function isMetalOptionValue(size) {
  const s = String(size ?? "").trim();
  if (!s) return false;
  return METAL_VALUE.test(s) || /^\d{1,2}\s*kt?\b/i.test(s);
}

// The size worth showing for this item, or "" when the variant option is really a metal.
export function realSize(size) {
  return isMetalOptionValue(size) ? "" : String(size ?? "").trim();
}

// "Earrings" contains "ring", so a bare includes("ring") mislabels studs as rings.
// Match "ring" only at a word start.
export function sizeLabelFor(title) {
  const t = String(title ?? "");
  if (/\bring/i.test(t)) return "Ring Size";
  if (/\b(bracelet|bangle)/i.test(t)) return "Wrist Size";
  if (/\bnecklace/i.test(t)) return "Length";
  return "Size";
}
