"use client";

import { shopifyStorefrontFetch, toShopifyGid } from "@/lib/shopify-client";

/* ================= LIVE VARIANT PRICE (batched) =================
   Every ProductCard on a page cross-checks its price against Shopify so a stale
   listing price is never the one the shopper acts on. Previously each card sent
   its own `node(id)` query, so a slider of 12 cards meant 12 requests. Cards now
   call `getLiveVariantPrice(variantId)`; ids that arrive in the same tick are
   coalesced into a single `nodes(ids: [...])` Storefront query. Same source,
   same freshness, same per-variant promise cache semantics as before. */

const VARIANT_PRICES_QUERY = `
  query getVariantPrices($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        price { amount }
        compareAtPrice { amount }
      }
    }
  }
`;

// Shopify caps `nodes` lookups per query; stay well under it.
const MAX_IDS_PER_QUERY = 50;

// variantId (numeric string) -> Promise<{ price, comparePrice } | null>
const cache = new Map();
// variantId -> { resolve }
const pending = new Map();
let flushScheduled = false;

function numericId(id) {
  const match = String(id ?? "").match(/\d+$/);
  return match ? match[0] : "";
}

function toResult(node) {
  if (!node) return null;
  return {
    price: node.price?.amount != null ? Number(node.price.amount) : null,
    comparePrice: node.compareAtPrice?.amount != null ? Number(node.compareAtPrice.amount) : null,
  };
}

async function flush() {
  flushScheduled = false;
  const batch = Array.from(pending.entries());
  pending.clear();

  for (let i = 0; i < batch.length; i += MAX_IDS_PER_QUERY) {
    const chunk = batch.slice(i, i + MAX_IDS_PER_QUERY);
    const ids = chunk.map(([vid]) => toShopifyGid(vid, "ProductVariant"));
    try {
      const data = await shopifyStorefrontFetch(VARIANT_PRICES_QUERY, { ids });
      const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
      const byId = new Map();
      nodes.forEach((node) => {
        if (node?.id) byId.set(numericId(node.id), node);
      });
      chunk.forEach(([vid, { resolve }]) => {
        const result = toResult(byId.get(vid));
        // A missing node means Shopify no longer knows this variant; drop the
        // cache entry so a later mount can retry, exactly like a failed fetch.
        if (!result) cache.delete(vid);
        resolve(result);
      });
    } catch (err) {
      console.warn("[livePriceBatch] Live Shopify price fetch failed:", err?.message || err);
      chunk.forEach(([vid, { resolve }]) => {
        cache.delete(vid);
        resolve(null);
      });
    }
  }
}

/**
 * Resolve to `{ price, comparePrice }` for the variant, or `null` when the
 * lookup failed (callers keep whatever price they already had, as before).
 */
export function getLiveVariantPrice(variantId) {
  const vid = numericId(variantId);
  if (!vid) return Promise.resolve(null);

  const cached = cache.get(vid);
  if (cached) return cached;

  const promise = new Promise((resolve) => {
    pending.set(vid, { resolve });
  });
  cache.set(vid, promise);

  if (!flushScheduled) {
    flushScheduled = true;
    // Sibling cards mount in the same commit, so their effects land in the
    // same tick; a macrotask lets all of them enqueue before one query goes out.
    setTimeout(flush, 0);
  }

  return promise;
}
