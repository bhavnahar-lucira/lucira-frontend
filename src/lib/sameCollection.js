"use client";

import { shopifyStorefrontFetch, toShopifyGid } from "@/lib/shopify-client";
import { getNumericId } from "@/lib/gtm";

/* ================= "FROM THE SAME COLLECTION" PRODUCTS =================
   The PDP's "From the Same Collection" grid reads the product metafield
   `custom.from_the_same_collection_headless` (backend-computed references),
   falling back to the legacy `custom.matching_product(s)` metafield, through
   the Storefront API. This module is that exact read, extracted so the
   ProductCard "View Similar" drawer can show the same products as the PDP.

   The query, fragment, mapping and precedence below are copied from
   ProductPageClient.fetchComplementary (which is left untouched); keep them
   in step if that ever changes. Results are cached per product for the page
   lifetime, like the PDP's own in-memory state. */

const PRODUCT_FIELDS = `
  fragment ProductFields on Product {
    id
    title
    handle
    productType
    tags
    featuredImage { url altText }
    images(first: 5) { edges { node { url altText } } }
    variants(first: 20) {
      edges {
        node {
          id
          title
          sku
          availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          selectedOptions { name value }
          image { url altText }
          metal_purity: metafield(namespace: "ornaverse", key: "metal_purity") { value }
          metal_color: metafield(namespace: "ornaverse", key: "metal_color") { value }
        }
      }
    }
    productMetafields: metafields(identifiers: [
      {namespace: "ornaverse", key: "bestsellers"}
    ]) {
      key
      value
    }
  }
`;

// Only the identifiers that feed the PDP grid; the complementary ones in the
// PDP query serve a different section and are not needed here.
const SAME_COLLECTION_QUERY = `
  query getSameCollectionProducts($id: ID!) {
    product(id: $id) {
      metafields(identifiers: [
        {namespace: "custom", key: "from_the_same_collection_headless"},
        {namespace: "custom", key: "matching_product"},
        {namespace: "custom", key: "matching_products"}
      ]) {
        namespace
        key
        references(first: 20) {
          edges {
            node {
              ... on Product {
                ...ProductFields
              }
            }
          }
        }
      }
    }
  }
  ${PRODUCT_FIELDS}
`;

// Same shape ProductPageClient.mapProduct produces, plus top-level price /
// compare_price for list surfaces (the drawer) that don't pick a variant
// themselves: the first in-stock variant, else the first variant.
function mapProduct(p) {
  if (!p || !p.id) return null;

  const variants = (p.variants?.edges || []).map(({ node: v }) => {
    const options = {};
    v.selectedOptions?.forEach((o) => { options[o.name.toLowerCase()] = o.value; });

    return {
      id: v.id.split("/").pop(),
      shopifyId: v.id,
      title: v.title,
      sku: v.sku,
      price: Number(v.price.amount),
      compare_price: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
      inStock: v.availableForSale === true,
      image: v.image?.url,
      tags: v.selectedOptions.map((o) => o.value).join(" "),
      size: options.size || null,
      color: options.color || options.metal || options["metal color"] || null,
      metafields: {
        metal_purity: v.metal_purity?.value,
        metal_color: v.metal_color?.value,
      },
    };
  });

  const images = (p.images?.edges || []).map(({ node: img }) => ({
    url: img.url,
    alt: img.altText || "",
  }));

  const productMetafields = {};
  p.productMetafields?.forEach((m) => { if (m) productMetafields[m.key] = m.value; });

  const displayVariant = variants.find((v) => v.inStock) || variants[0] || null;

  return {
    ...p,
    id: p.id.split("/").pop(),
    shopifyId: p.id,
    type: p.productType,
    image: p.featuredImage?.url,
    images,
    variants,
    productMetafields,
    price: displayVariant ? displayVariant.price : 0,
    compare_price: displayVariant ? displayVariant.compare_price : null,
  };
}

const cache = new Map(); // numeric product id -> Promise<Product[]>

/**
 * The products the PDP shows under "From the Same Collection" for `productId`
 * (numeric id, GID, or anything getNumericId understands). Resolves to [] when
 * the product has neither metafield or the request fails; never throws.
 */
export function fetchSameCollectionProducts(productId) {
  const numeric = String(getNumericId(productId) || "");
  if (!numeric || numeric === "0") return Promise.resolve([]);
  if (cache.has(numeric)) return cache.get(numeric);

  const promise = shopifyStorefrontFetch(SAME_COLLECTION_QUERY, { id: toShopifyGid(numeric, "Product") })
    .then((data) => {
      const sameCollection = [];
      const matching = [];
      (data?.product?.metafields || []).forEach((m) => {
        if (!m?.references?.edges) return;
        const refs = m.references.edges.map((e) => e.node).filter(Boolean).map(mapProduct).filter(Boolean);
        if (m.key === "from_the_same_collection_headless") sameCollection.push(...refs);
        else if (m.key.includes("matching")) matching.push(...refs);
      });
      // Same precedence as the PDP: backend-computed list first, legacy metafield second.
      const source = sameCollection.length > 0 ? sameCollection : matching;
      return Array.from(new Map(source.map((p) => [p.id, p])).values());
    })
    .catch((err) => {
      console.warn("[sameCollection] fetch failed:", err?.message || err);
      cache.delete(numeric);
      return [];
    });

  cache.set(numeric, promise);
  return promise;
}
