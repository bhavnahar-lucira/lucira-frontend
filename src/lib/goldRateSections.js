// ─────────────────────────────────────────────────────────────────────────────
// Shared section registry for gold rate city pages.
//
// GoldMetaContent stamps these ids onto its headings and OnThisPage builds its
// jump links from the same constants, so a link can never point at a heading
// that doesn't exist. Ids are deliberately city-independent: #weekly-gold-price-trend
// resolves on Mumbai, Delhi and every other city page, which keeps the URL
// fragment for a given section stable across the whole city set.
//
// Kept dependency-free so both the client content component and the widget can
// import it without pulling in the Storefront fetch layer.
// ─────────────────────────────────────────────────────────────────────────────

// Headings hardcoded in GoldMetaContent (rate tables computed from live rates,
// so they aren't authored per city in Shopify). Values are the anchor ids.
export const GOLD_STATIC_SECTION_IDS = {
  atAGlance: "todays-gold-rate-at-a-glance",
  todayVsYesterday: "today-vs-yesterday-gold-rate-change",
  purityComparison: "gold-karat-purity-comparison",
  weeklyTrend: "weekly-gold-price-trend",
  monthlyTrend: "monthly-gold-rate-trend",
  nearbyCity: "nearby-city-gold-rate",
  faq: "frequently-asked-questions",
};

/**
 * Build the ordered jump-link list in the same order the sections render.
 *
 * Static rate-table sections come first (they sit above the authored content in
 * GoldMetaContent), then the Shopify content blocks in sort_order, then the FAQ.
 * Only H2-level sections are listed — H3 subsections are intentionally omitted
 * to keep the list scannable.
 *
 * The `has*` flags mirror GoldMetaContent's own render conditions; passing them
 * in avoids listing a link to a section that got conditionally skipped.
 */
export function buildGoldRateSections(goldMeta, opts = {}) {
  const {
    city = "",
    hasTodayVsYesterday = false,
    hasWeekly = false,
    hasMonthly = false,
  } = opts;

  const S = GOLD_STATIC_SECTION_IDS;
  const nearby = goldMeta?.nearbyCityName || "";
  const sections = [];

  sections.push({ id: S.atAGlance, label: `Today's Gold Rate in ${city} at a Glance` });
  if (hasTodayVsYesterday) {
    sections.push({ id: S.todayVsYesterday, label: `Today vs Yesterday — Gold Rate Change` });
  }
  sections.push({ id: S.purityComparison, label: "Gold Karat Purity Comparison" });
  if (hasWeekly) {
    sections.push({ id: S.weeklyTrend, label: "Weekly Gold Price Trend (Last 7 Days)" });
  }
  if (hasMonthly) {
    sections.push({ id: S.monthlyTrend, label: "Monthly Gold Rate Trend (Last 12 Months)" });
  }
  if (nearby) {
    sections.push({ id: S.nearbyCity, label: `Today's Gold Rate in ${nearby}` });
  }

  // Authored per-city content blocks, already sorted by sort_order upstream.
  (goldMeta?.blocks || []).forEach((b) => {
    if (b.anchorId && b.heading) sections.push({ id: b.anchorId, label: b.heading });
  });

  if ((goldMeta?.faqs || []).length > 0) {
    sections.push({ id: S.faq, label: "Frequently Asked Questions" });
  }

  return sections;
}
