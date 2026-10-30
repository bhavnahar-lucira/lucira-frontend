// ─────────────────────────────────────────────────────────────────────────────
// Shared section registry for platinum rate city pages — mirror of
// goldRateSections.js.
//
// PlatinumMetaContent stamps these ids onto its headings and OnThisPage builds
// its jump links from the same constants, so a link can never point at a
// heading that doesn't exist. Ids are deliberately city-independent:
// #weekly-platinum-price-trend resolves on every city page, which keeps the
// URL fragment for a given section stable across the whole city set.
//
// Kept dependency-free so both the client content component and the widget can
// import it without pulling in the Storefront fetch layer.
// ─────────────────────────────────────────────────────────────────────────────

// Headings hardcoded in PlatinumMetaContent (rate tables computed from live
// rates, so they aren't authored per city in Shopify). Values are the anchor ids.
export const PLATINUM_STATIC_SECTION_IDS = {
  atAGlance: "todays-platinum-rate-at-a-glance",
  todayVsYesterday: "today-vs-yesterday-platinum-rate-change",
  purityComparison: "platinum-purity-comparison",
  weeklyTrend: "weekly-platinum-price-trend",
  monthlyTrend: "monthly-platinum-rate-trend",
  nearbyCity: "nearby-city-platinum-rate",
  faq: "frequently-asked-questions",
};

/**
 * Build the ordered jump-link list in the same order the sections render.
 *
 * Static rate-table sections come first (they sit above the authored content in
 * PlatinumMetaContent), then the Shopify content blocks in sort_order, then the
 * FAQ. Only H2-level sections are listed — H3 subsections are intentionally
 * omitted to keep the list scannable.
 *
 * The `has*` flags mirror PlatinumMetaContent's own render conditions; passing
 * them in avoids listing a link to a section that got conditionally skipped.
 */
export function buildPlatinumRateSections(platinumMeta, opts = {}) {
  const {
    city = "",
    hasTodayVsYesterday = false,
    hasWeekly = false,
    hasMonthly = false,
  } = opts;

  const S = PLATINUM_STATIC_SECTION_IDS;
  const nearby = platinumMeta?.nearbyCityName || "";
  const sections = [];

  sections.push({ id: S.atAGlance, label: `Today's Platinum Rate in ${city} at a Glance` });
  if (hasTodayVsYesterday) {
    sections.push({ id: S.todayVsYesterday, label: `Today vs Yesterday - Platinum Rate Change` });
  }
  sections.push({ id: S.purityComparison, label: "Platinum Purity Comparison" });
  if (hasWeekly) {
    sections.push({ id: S.weeklyTrend, label: "Weekly Platinum Price Trend (Last 7 Days)" });
  }
  if (hasMonthly) {
    sections.push({ id: S.monthlyTrend, label: "Monthly Platinum Rate Trend (Last 12 Months)" });
  }
  if (nearby) {
    sections.push({ id: S.nearbyCity, label: `Today's Platinum Rate in ${nearby}` });
  }

  // Authored per-city content blocks, already sorted by sort_order upstream.
  (platinumMeta?.blocks || []).forEach((b) => {
    if (b.anchorId && b.heading) sections.push({ id: b.anchorId, label: b.heading });
  });

  if ((platinumMeta?.faqs || []).length > 0) {
    sections.push({ id: S.faq, label: "Frequently Asked Questions" });
  }

  return sections;
}
