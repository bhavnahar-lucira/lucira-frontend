// Quick test: does the Storefront API return the Gold Rate City metaobject content?
// Run from the lucira-frontend folder:  node test-gold-meta.mjs
// It reads .env.local for the Storefront token and prints what comes back for a few cities.

import fs from "node:fs";

const env = fs
  .readFileSync(".env.local", "utf8")
  .split("\n")
  .reduce((a, l) => {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) a[m[1]] = m[2].replace(/^"|"$/g, "").trim();
    return a;
  }, {});

const storeRaw = env.SHOPIFY_STORE || "luciraonline";
const store = storeRaw.includes(".") ? storeRaw : storeRaw + ".myshopify.com";
const token = env.SHOPIFY_RW_STOREFRONT_TOKEN || env.STOREFRONT_TOKEN;

const query = `
  query goldRateCityMeta($handle: String!) {
    page(handle: $handle) {
      metafield(namespace: "custom", key: "gold_rate_city") {
        reference {
          ... on Metaobject {
            city_name: field(key: "city_name") { value }
            seo_title: field(key: "seo_title") { value }
            content_blocks: field(key: "content_blocks") {
              references(first: 25) { nodes { ... on Metaobject {
                slug: field(key: "slug") { value }
                heading: field(key: "heading") { value }
              } } }
            }
            faq: field(key: "faq") {
              references(first: 50) { nodes { ... on Metaobject {
                question: field(key: "question") { value }
              } } }
            }
          }
        }
      }
    }
  }
`;

const cities = [
  "mumbai-gold-rate-today",
  "delhi-gold-rate-today",
  "agra-gold-rate-today",
];

console.log("Store:", store, "| token present:", !!token, "\n");

for (const handle of cities) {
  const res = await fetch(`https://${store}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables: { handle } }),
  });
  const j = await res.json();
  if (j.errors) {
    console.log(handle, "-> ERRORS:", JSON.stringify(j.errors).slice(0, 400));
    continue;
  }
  const ref = j.data?.page?.metafield?.reference;
  if (!ref) {
    console.log(handle, "-> no metaobject reference returned (would fall back to page.body)");
    continue;
  }
  const blocks = ref.content_blocks?.references?.nodes || [];
  const faqs = ref.faq?.references?.nodes || [];
  console.log(
    handle,
    "-> city:",
    ref.city_name?.value,
    "| blocks:",
    blocks.length,
    "| faqs:",
    faqs.length
  );
  console.log("   block slugs:", blocks.map((b) => b.slug?.value).join(", "));
}
