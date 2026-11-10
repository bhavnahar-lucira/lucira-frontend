// ─────────────────────────────────────────────────────────────────────────────
// "Rate" / "Price" wording rotation for the metal rate pages' code-owned
// headings (fallback H1 + the hardcoded H2s and their On-this-page labels).
//
// Each page gets one of three variants, picked from its city/state name, so a
// given page always renders the same wording (a heading that changed on every
// request would look unstable to crawlers) while the full page set spreads
// across all three. An authored hero_title in Shopify still wins over the H1
// here. Anchor ids never change with the wording.
//
// Every variant mixes both words across its H2s, so each page carries "Rate"
// and "Price", and the three arrangements differ from one another even on
// pages whose H1 is authored. Variant 0 is the original wording.
// ─────────────────────────────────────────────────────────────────────────────

const RATE_HEADING_VARIANTS = [
  {
    h1: (metal, city) => `${metal} Rate Today in ${city}`,
    glance: "Rate", change: "Rate", weekly: "Price", monthly: "Rate", nearby: "Rate",
  },
  {
    h1: (metal, city) => `${metal} Price Today in ${city}`,
    glance: "Price", change: "Price", weekly: "Rate", monthly: "Price", nearby: "Price",
  },
  {
    h1: (metal, city) => `Today's ${metal} Price in ${city}`,
    glance: "Rate", change: "Price", weekly: "Rate", monthly: "Price", nearby: "Rate",
  },
];

export const DEFAULT_RATE_HEADING_VARIANT = RATE_HEADING_VARIANTS[0];

export function getRateHeadingVariant(city = "") {
  let hash = 0;
  for (const ch of String(city).trim().toLowerCase()) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return RATE_HEADING_VARIANTS[hash % RATE_HEADING_VARIANTS.length];
}
