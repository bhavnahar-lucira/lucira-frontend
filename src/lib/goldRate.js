import { shopifyStorefrontFetch } from "./shopify";

// ─────────────────────────────────────────────────────────────────────────────
// Gold Rate City metaobject fetch (Shopify Storefront API)
//
// The Shopify Liquid theme renders city gold-rate pages from a `gold_rate_city`
// metaobject (linked via the page's custom.gold_rate_city metafield) plus its
// referenced content blocks, tables and FAQs. This module fetches that same data
// so the headless Next.js site can render identical, city-specific content —
// making Shopify the single source of truth.
//
// All six gold metaobject definitions are PUBLIC_READ on the Storefront API, so
// the existing Storefront token can read them. If anything is missing the
// function returns null and the caller falls back to the hardcoded template.
// ─────────────────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(node) {
  if (!node) return "";
  if (node.type === "text") {
    let t = esc(node.value || "");
    if (node.bold) t = `<strong>${t}</strong>`;
    if (node.italic) t = `<em>${t}</em>`;
    return t;
  }
  if (node.type === "link") {
    const inner = (node.children || []).map(renderInline).join("");
    const url = esc(node.url || "#");
    return `<a href="${url}" target="${node.target || "_self"}">${inner}</a>`;
  }
  return (node.children || []).map(renderInline).join("");
}

function renderBlock(node) {
  if (!node) return "";
  switch (node.type) {
    case "paragraph":
      return `<p>${(node.children || []).map(renderInline).join("")}</p>`;
    case "heading": {
      const level = Math.min(Math.max(parseInt(node.level, 10) || 2, 1), 6);
      return `<h${level}>${(node.children || []).map(renderInline).join("")}</h${level}>`;
    }
    case "list": {
      const tag = node.listType === "ordered" ? "ol" : "ul";
      const items = (node.children || [])
        .map((li) => `<li>${(li.children || []).map(renderInline).join("")}</li>`)
        .join("");
      return `<${tag}>${items}</${tag}>`;
    }
    case "list-item":
      return `<li>${(node.children || []).map(renderInline).join("")}</li>`;
    default:
      return (node.children || []).map(renderBlock).join("");
  }
}

// Convert a Shopify rich_text_field JSON string into HTML.
export function richTextToHtml(value) {
  if (!value) return "";
  let root;
  try {
    root = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return `<p>${esc(value)}</p>`;
  }
  if (!root || !Array.isArray(root.children)) return "";
  return root.children.map(renderBlock).join("");
}

const GOLD_CITY_META_QUERY = `
  query goldRateCityMeta($handle: String!) {
    page(handle: $handle) {
      metafield(namespace: "custom", key: "gold_rate_city") {
        reference {
          ... on Metaobject {
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
              references(first: 25) {
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
          }
        }
      }
    }
  }
`;

/**
 * Fetch normalized Gold Rate City metaobject content for a page handle.
 * Returns null when the page has no linked metaobject (→ caller uses template fallback).
 */
export async function getGoldRateCityMeta(handle, cacheOption = "no-store") {
  let data;
  try {
    data = await shopifyStorefrontFetch(
      GOLD_CITY_META_QUERY,
      { handle },
      { cache: cacheOption, useRwToken: true }
    );
  } catch (e) {
    console.warn("Gold city metaobject fetch failed:", e?.message);
    return null;
  }

  const ref = data?.page?.metafield?.reference;
  if (!ref) return null;

  const val = (node) => (node && node.value != null ? node.value : null);

  const blocks = (ref.content_blocks?.references?.nodes || [])
    .map((n) => ({
      slug: val(n.slug) || "",
      heading: val(n.heading) || "",
      html: richTextToHtml(val(n.content)),
      sort: parseInt(val(n.sort_order) || "0", 10),
      active: val(n.active) !== "false",
    }))
    .filter((b) => b.active && (b.heading || b.html))
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

const GOLD_HISTORY_QUERY = `
  query goldRateHistory {
    metaobjects(type: "gold_rate_history", first: 250) {
      nodes {
        rate_date: field(key: "rate_date") { value }
        rate_24k: field(key: "rate_24k") { value }
        rate_22k: field(key: "rate_22k") { value }
        rate_18k: field(key: "rate_18k") { value }
        rate_14k: field(key: "rate_14k") { value }
        market_note: field(key: "market_note") { value }
        is_current: field(key: "is_current_rate") { value }
      }
    }
  }
`;

/**
 * Fetch the global gold_rate_history entries (shared across all cities) for the
 * weekly / monthly trend tables. Returns [] on any error.
 */
export async function getGoldRateHistory(cacheOption = "no-store") {
  let data;
  try {
    data = await shopifyStorefrontFetch(GOLD_HISTORY_QUERY, {}, { cache: cacheOption, useRwToken: true });
  } catch (e) {
    console.warn("Gold rate history fetch failed:", e?.message);
    return [];
  }
  const nodes = data?.metaobjects?.nodes || [];
  const val = (n) => (n && n.value != null ? n.value : null);
  return nodes
    .map((n) => ({
      date: val(n.rate_date),
      r24: parseFloat(val(n.rate_24k)) || 0,
      r22: parseFloat(val(n.rate_22k)) || 0,
      r18: parseFloat(val(n.rate_18k)) || 0,
      r14: parseFloat(val(n.rate_14k)) || 0,
      cur: val(n.is_current),
      note: val(n.market_note) || "",
    }))
    .filter((e) => e.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
}
