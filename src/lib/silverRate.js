import { shopifyStorefrontFetch, toCacheInit } from "./shopify";
import { isNextControlFlowError } from "@/utils/helpers";
import { richTextToHtml, toGenericAnchorId, citySlugFromPageHandle } from "./goldRate";

// ─────────────────────────────────────────────────────────────────────────────
// Silver Rate City metaobject fetch (Shopify Storefront API)
//
// Mirror of lib/goldRate.js for the silver_rate_city pipeline: the page's
// custom.silver_rate_city metafield links a silver_rate_city metaobject whose
// referenced content blocks, tables and FAQs carry the authored city content.
// Same normalized return shape as getGoldRateCityMeta so SilverRatePage and
// SilverMetaContent can render exactly the way the gold pages do.
//
// All silver metaobject definitions are PUBLIC_READ on the Storefront API
// (verified), so the existing Storefront token can read them. If anything is
// missing the function returns null and the caller falls back to the hardcoded
// template. There is no silver_rate_state metaobject — state pages exist for
// gold only.
// ─────────────────────────────────────────────────────────────────────────────

const SILVER_CITY_FIELDS = `
            type
            city_name: field(key: "city_name") { value }
            state: field(key: "state") { value }
            hero_title: field(key: "hero_title") { value }
            hero_subtitle: field(key: "hero_subtitle") { value }
            seo_title: field(key: "seo_title") { value }
            seo_description: field(key: "seo_description") { value }
            city_intro: field(key: "city_intro") { value }
            nearby_city_name: field(key: "nearby_city_name") { value }
            nearby_city_note: field(key: "nearby_city_note") { value }
            content_blocks: field(key: "content_blocks") {
              references(first: 50) {
                nodes {
                  ... on Metaobject {
                    slug: field(key: "slug") { value }
                    heading: field(key: "heading") { value }
                    content: field(key: "content") { value }
                    sort_order: field(key: "sort_order") { value }
                    active: field(key: "active") { value }
                  }
                }
              }
            }
            faq: field(key: "faq") {
              references(first: 50) {
                nodes {
                  ... on Metaobject {
                    question: field(key: "question") { value }
                    answer: field(key: "answer") { value }
                  }
                }
              }
            }
            table_reference: field(key: "table_reference") {
              references(first: 25) {
                nodes {
                  ... on Metaobject {
                    table_title: field(key: "table_title") { value }
                    table_slug: field(key: "table_slug") { value }
                    table_description: field(key: "table_description") { value }
                  }
                }
              }
            }
`;

const SILVER_CITY_META_QUERY = `
  query silverRateCityMeta($handle: String!) {
    page(handle: $handle) {
      metafield(namespace: "custom", key: "silver_rate_city") {
        reference {
          ... on Metaobject {
${SILVER_CITY_FIELDS}
          }
        }
      }
    }
  }
`;

// Fallback lookup when the page has no custom.silver_rate_city metafield yet:
// resolve the metaobject directly by its handle (which matches the city slug
// for every city except a couple of spelling variants). New city metaobjects
// therefore work the moment they're created, before anyone links the page —
// the same resilience the Liquid gold section had via its slug lookup.
const SILVER_CITY_BY_HANDLE_QUERY = `
  query silverRateCityByHandle($handle: String!) {
    metaobject(handle: { type: "silver_rate_city", handle: $handle }) {
${SILVER_CITY_FIELDS}
    }
  }
`;

// Silver block slugs are authored as "<city>-silver-<suffix>" (mumbai-silver-
// todays-rate). Some cities carry a state disambiguator in the slug that the
// page handle doesn't have (amaravati-ap-silver-… on amaravati-silver-rate-
// today), which would leave "ap-silver-todays-rate" after the city strip and
// give those cities different anchor ids from everyone else. Strip that state
// token too, so #silver-todays-rate is the same fragment on every city page.
function toSilverAnchorId(slug, citySlug) {
  return toGenericAnchorId(slug, citySlug).replace(/^[a-z]{2}-(?=silver-)/, "");
}

// The authored "On This Page" block is superseded by the OnThisPage component
// (same reasoning as gold — its hardcoded jump links were dead).
const SKIPPED_BLOCK_IDS = new Set(["on-this-page", "silver-on-this-page"]);

/**
 * Fetch normalized Silver Rate City metaobject content for a page handle.
 * Returns null when the page has no linked metaobject (→ caller uses template fallback).
 */
export async function getSilverRateCityMeta(handle, cacheOption = "no-store") {
  let data;
  try {
    data = await shopifyStorefrontFetch(
      SILVER_CITY_META_QUERY,
      { handle },
      { ...toCacheInit(cacheOption), useRwToken: true }
    );
  } catch (e) {
    // Next's static-generation bailout is expected on the no-store rate pages —
    // rethrow so Next handles it; only log genuine fetch failures.
    if (isNextControlFlowError(e)) throw e;
    console.warn("Silver city metaobject fetch failed:", e?.message);
    return null;
  }

  const citySlug = citySlugFromPageHandle(handle);

  let ref = data?.page?.metafield?.reference;
  if (!ref) {
    // Page not linked (or page record missing entirely) — try the metaobject
    // by handle before giving up.
    try {
      const byHandle = await shopifyStorefrontFetch(
        SILVER_CITY_BY_HANDLE_QUERY,
        { handle: citySlug },
        { ...toCacheInit(cacheOption), useRwToken: true }
      );
      ref = byHandle?.metaobject || null;
    } catch (e) {
      if (isNextControlFlowError(e)) throw e;
      console.warn("Silver city metaobject handle lookup failed:", e?.message);
    }
  }
  if (!ref) return null;

  const val = (node) => (node && node.value != null ? node.value : null);

  const blocks = (ref.content_blocks?.references?.nodes || [])
    .map((n) => {
      const slug = val(n.slug) || "";
      return {
        slug,
        anchorId: toSilverAnchorId(slug, citySlug),
        heading: val(n.heading) || "",
        html: richTextToHtml(val(n.content)),
        sort: parseInt(val(n.sort_order) || "0", 10),
        active: val(n.active) !== "false",
      };
    })
    .filter((b) => b.active && (b.heading || b.html) && !SKIPPED_BLOCK_IDS.has(b.anchorId))
    .sort((a, b) => a.sort - b.sort);

  const faqs = (ref.faq?.references?.nodes || [])
    .map((n) => ({
      question: val(n.question) || "",
      answerHtml: richTextToHtml(val(n.answer)),
    }))
    .filter((f) => f.question);

  const tables = (ref.table_reference?.references?.nodes || [])
    .map((n) => ({
      title: val(n.table_title) || "",
      slug: val(n.table_slug) || "",
      description: val(n.table_description) || "",
    }))
    .filter((t) => t.title);

  // Nothing usable → let caller fall back to template.
  if (!blocks.length && !faqs.length) return null;

  return {
    cityName: val(ref.city_name),
    state: val(ref.state),
    heroTitle: val(ref.hero_title),
    heroSubtitle: val(ref.hero_subtitle),
    seoTitle: val(ref.seo_title),
    seoDescription: val(ref.seo_description),
    introHtml: richTextToHtml(val(ref.city_intro)),
    nearbyCityName: val(ref.nearby_city_name),
    nearbyCityNote: val(ref.nearby_city_note),
    blocks,
    faqs,
    tables,
  };
}

// ─── Silver Rate State metaobject ────────────────────────────────────────────
// State pages (maharashtra-silver-rate-today) mirror the city pipeline exactly,
// the same way gold_rate_state mirrors gold_rate_city: page →
// custom.silver_rate_state metafield → silver_rate_state metaobject, which
// reuses the same silver_rate_content_block / silver_rate_faq /
// silver_rate_table definitions the city pages use. The normalizer returns the
// SAME shape as getSilverRateCityMeta (state_name lands in cityName,
// state_intro in introHtml, major_city_* in nearbyCity*) so SilverRatePage and
// SilverMetaContent render both without knowing which kind of page they're on.
const SILVER_STATE_FIELDS = `
            type
            state_name: field(key: "state_name") { value }
            hero_title: field(key: "hero_title") { value }
            hero_subtitle: field(key: "hero_subtitle") { value }
            seo_title: field(key: "seo_title") { value }
            seo_description: field(key: "seo_description") { value }
            state_intro: field(key: "state_intro") { value }
            major_city_name: field(key: "major_city_name") { value }
            major_city_note: field(key: "major_city_note") { value }
            content_blocks: field(key: "content_blocks") {
              references(first: 50) {
                nodes {
                  ... on Metaobject {
                    slug: field(key: "slug") { value }
                    heading: field(key: "heading") { value }
                    content: field(key: "content") { value }
                    sort_order: field(key: "sort_order") { value }
                    active: field(key: "active") { value }
                  }
                }
              }
            }
            faq: field(key: "faq") {
              references(first: 50) {
                nodes {
                  ... on Metaobject {
                    question: field(key: "question") { value }
                    answer: field(key: "answer") { value }
                  }
                }
              }
            }
            table_reference: field(key: "table_reference") {
              references(first: 25) {
                nodes {
                  ... on Metaobject {
                    table_title: field(key: "table_title") { value }
                    table_slug: field(key: "table_slug") { value }
                    table_description: field(key: "table_description") { value }
                  }
                }
              }
            }
`;

const SILVER_STATE_META_QUERY = `
  query silverRateStateMeta($handle: String!) {
    page(handle: $handle) {
      metafield(namespace: "custom", key: "silver_rate_state") {
        reference {
          ... on Metaobject {
${SILVER_STATE_FIELDS}
          }
        }
      }
    }
  }
`;

// Fallback: resolve the state metaobject by its handle (state slug) when the
// page metafield isn't linked — new silver_rate_state entries then go live the
// moment they're created, exactly like the city fallback above.
const SILVER_STATE_BY_HANDLE_QUERY = `
  query silverRateStateByHandle($handle: String!) {
    metaobject(handle: { type: "silver_rate_state", handle: $handle }) {
${SILVER_STATE_FIELDS}
    }
  }
`;

/**
 * Fetch normalized Silver Rate State metaobject content for a page handle
 * ("maharashtra-silver-rate-today"). Same return shape as
 * getSilverRateCityMeta — cityName carries the state's display name. Returns
 * null when no metaobject exists (→ caller uses template fallback).
 */
export async function getSilverRateStateMeta(handle, cacheOption = "no-store") {
  let data;
  try {
    data = await shopifyStorefrontFetch(
      SILVER_STATE_META_QUERY,
      { handle },
      { ...toCacheInit(cacheOption), useRwToken: true }
    );
  } catch (e) {
    if (isNextControlFlowError(e)) throw e;
    console.warn("Silver state metaobject fetch failed:", e?.message);
    return null;
  }

  const stateSlug = citySlugFromPageHandle(handle);

  let ref = data?.page?.metafield?.reference;
  if (!ref) {
    try {
      const byHandle = await shopifyStorefrontFetch(
        SILVER_STATE_BY_HANDLE_QUERY,
        { handle: stateSlug },
        { ...toCacheInit(cacheOption), useRwToken: true }
      );
      ref = byHandle?.metaobject || null;
    } catch (e) {
      if (isNextControlFlowError(e)) throw e;
      console.warn("Silver state metaobject handle lookup failed:", e?.message);
    }
  }
  if (!ref) return null;

  const val = (node) => (node && node.value != null ? node.value : null);

  const blocks = (ref.content_blocks?.references?.nodes || [])
    .map((n) => {
      const slug = val(n.slug) || "";
      return {
        slug,
        anchorId: toSilverAnchorId(slug, stateSlug),
        heading: val(n.heading) || "",
        html: richTextToHtml(val(n.content)),
        sort: parseInt(val(n.sort_order) || "0", 10),
        active: val(n.active) !== "false",
      };
    })
    .filter((b) => b.active && (b.heading || b.html) && !SKIPPED_BLOCK_IDS.has(b.anchorId))
    .sort((a, b) => a.sort - b.sort);

  const faqs = (ref.faq?.references?.nodes || [])
    .map((n) => ({
      question: val(n.question) || "",
      answerHtml: richTextToHtml(val(n.answer)),
    }))
    .filter((f) => f.question);

  const tables = (ref.table_reference?.references?.nodes || [])
    .map((n) => ({
      title: val(n.table_title) || "",
      slug: val(n.table_slug) || "",
      description: val(n.table_description) || "",
    }))
    .filter((t) => t.title);

  if (!blocks.length && !faqs.length) return null;

  return {
    cityName: val(ref.state_name),
    state: val(ref.state_name),
    heroTitle: val(ref.hero_title),
    heroSubtitle: val(ref.hero_subtitle),
    seoTitle: val(ref.seo_title),
    seoDescription: val(ref.seo_description),
    introHtml: richTextToHtml(val(ref.state_intro)),
    nearbyCityName: val(ref.major_city_name),
    nearbyCityNote: val(ref.major_city_note),
    blocks,
    faqs,
    tables,
    isStatePage: true,
  };
}

// ─── Silver Rate Union Territory metaobject ──────────────────────────────────
// UT pages mirror the state pipeline exactly: page →
// custom.silver_rate_union_territory metafield → silver_rate_union_territory
// metaobject (ut_name lands in cityName, ut_intro in introHtml). The caller
// falls back to getSilverRateStateMeta for UTs whose content lives in
// silver_rate_state entries.
const SILVER_UT_FIELDS = `
            type
            ut_name: field(key: "ut_name") { value }
            hero_title: field(key: "hero_title") { value }
            hero_subtitle: field(key: "hero_subtitle") { value }
            seo_title: field(key: "seo_title") { value }
            seo_description: field(key: "seo_description") { value }
            ut_intro: field(key: "ut_intro") { value }
            major_city_name: field(key: "major_city_name") { value }
            major_city_note: field(key: "major_city_note") { value }
            content_blocks: field(key: "content_blocks") {
              references(first: 50) {
                nodes {
                  ... on Metaobject {
                    slug: field(key: "slug") { value }
                    heading: field(key: "heading") { value }
                    content: field(key: "content") { value }
                    sort_order: field(key: "sort_order") { value }
                    active: field(key: "active") { value }
                  }
                }
              }
            }
            faq: field(key: "faq") {
              references(first: 50) {
                nodes {
                  ... on Metaobject {
                    question: field(key: "question") { value }
                    answer: field(key: "answer") { value }
                  }
                }
              }
            }
            table_reference: field(key: "table_reference") {
              references(first: 25) {
                nodes {
                  ... on Metaobject {
                    table_title: field(key: "table_title") { value }
                    table_slug: field(key: "table_slug") { value }
                    table_description: field(key: "table_description") { value }
                  }
                }
              }
            }
`;

const SILVER_UT_META_QUERY = `
  query silverRateUtMeta($handle: String!) {
    page(handle: $handle) {
      metafield(namespace: "custom", key: "silver_rate_union_territory") {
        reference {
          ... on Metaobject {
${SILVER_UT_FIELDS}
          }
        }
      }
    }
  }
`;

const SILVER_UT_BY_HANDLE_QUERY = `
  query silverRateUtByHandle($handle: String!) {
    metaobject(handle: { type: "silver_rate_union_territory", handle: $handle }) {
${SILVER_UT_FIELDS}
    }
  }
`;

/**
 * Fetch normalized Silver Rate Union Territory metaobject content for a page
 * handle ("ladakh-silver-rate-today"). Same return shape as
 * getSilverRateCityMeta — cityName carries the UT's display name. Returns null
 * when no metaobject exists (→ caller falls back to the state metaobject, then
 * the template).
 */
export async function getSilverRateUtMeta(handle, cacheOption = "no-store") {
  let data;
  try {
    data = await shopifyStorefrontFetch(
      SILVER_UT_META_QUERY,
      { handle },
      { ...toCacheInit(cacheOption), useRwToken: true }
    );
  } catch (e) {
    if (isNextControlFlowError(e)) throw e;
    console.warn("Silver UT metaobject fetch failed:", e?.message);
    return null;
  }

  const utSlug = citySlugFromPageHandle(handle);

  let ref = data?.page?.metafield?.reference;
  if (!ref) {
    try {
      const byHandle = await shopifyStorefrontFetch(
        SILVER_UT_BY_HANDLE_QUERY,
        { handle: utSlug },
        { ...toCacheInit(cacheOption), useRwToken: true }
      );
      ref = byHandle?.metaobject || null;
    } catch (e) {
      if (isNextControlFlowError(e)) throw e;
      console.warn("Silver UT metaobject handle lookup failed:", e?.message);
    }
  }
  if (!ref) return null;

  const val = (node) => (node && node.value != null ? node.value : null);

  const blocks = (ref.content_blocks?.references?.nodes || [])
    .map((n) => {
      const slug = val(n.slug) || "";
      return {
        slug,
        anchorId: toSilverAnchorId(slug, utSlug),
        heading: val(n.heading) || "",
        html: richTextToHtml(val(n.content)),
        sort: parseInt(val(n.sort_order) || "0", 10),
        active: val(n.active) !== "false",
      };
    })
    .filter((b) => b.active && (b.heading || b.html) && !SKIPPED_BLOCK_IDS.has(b.anchorId))
    .sort((a, b) => a.sort - b.sort);

  const faqs = (ref.faq?.references?.nodes || [])
    .map((n) => ({
      question: val(n.question) || "",
      answerHtml: richTextToHtml(val(n.answer)),
    }))
    .filter((f) => f.question);

  const tables = (ref.table_reference?.references?.nodes || [])
    .map((n) => ({
      title: val(n.table_title) || "",
      slug: val(n.table_slug) || "",
      description: val(n.table_description) || "",
    }))
    .filter((t) => t.title);

  if (!blocks.length && !faqs.length) return null;

  return {
    cityName: val(ref.ut_name),
    state: val(ref.ut_name),
    heroTitle: val(ref.hero_title),
    heroSubtitle: val(ref.hero_subtitle),
    seoTitle: val(ref.seo_title),
    seoDescription: val(ref.seo_description),
    introHtml: richTextToHtml(val(ref.ut_intro)),
    nearbyCityName: val(ref.major_city_name),
    nearbyCityNote: val(ref.major_city_note),
    blocks,
    faqs,
    tables,
    isStatePage: true,
    isUtPage: true,
  };
}

const SILVER_HISTORY_QUERY = `
  query silverRateHistory {
    metaobjects(type: "silver_rate_history", first: 250) {
      nodes {
        rate_date: field(key: "rate_date") { value }
        rate_999: field(key: "rate_999") { value }
        rate_925: field(key: "rate_925") { value }
        market_note: field(key: "market_note") { value }
        is_current: field(key: "is_current_rate") { value }
      }
    }
  }
`;

/**
 * Fetch the global silver_rate_history entries (shared across all cities) for
 * the weekly / monthly trend tables. Rates are per gram. Returns [] on any error.
 */
export async function getSilverRateHistory(cacheOption = "no-store") {
  let data;
  try {
    data = await shopifyStorefrontFetch(SILVER_HISTORY_QUERY, {}, { ...toCacheInit(cacheOption), useRwToken: true });
  } catch (e) {
    if (isNextControlFlowError(e)) throw e;
    console.warn("Silver rate history fetch failed:", e?.message);
    return [];
  }
  const nodes = data?.metaobjects?.nodes || [];
  const val = (n) => (n && n.value != null ? n.value : null);
  return nodes
    .map((n) => ({
      date: val(n.rate_date),
      r999: parseFloat(val(n.rate_999)) || 0,
      r925: parseFloat(val(n.rate_925)) || 0,
      cur: val(n.is_current),
      note: val(n.market_note) || "",
    }))
    .filter((e) => e.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}
