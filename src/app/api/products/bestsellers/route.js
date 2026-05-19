import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";
import { calculatePriceBreakup } from "@/lib/priceEngine";
import { getServerCache, stableCacheKey } from "@/lib/serverCache";

const parseFilters = (rawFilters) => {
  if (!rawFilters) return [];
  try {
    const parsed = typeof rawFilters === "string" ? JSON.parse(rawFilters) : rawFilters;
    if (Array.isArray(parsed)) return parsed;
    const shopifyFilters = [];
    Object.values(parsed).forEach((group) => {
      if (!Array.isArray(group)) return;
      group.forEach((opt) => {
        if (!opt?.input) return;
        shopifyFilters.push(typeof opt.input === "string" ? JSON.parse(opt.input) : opt.input);
      });
    });
    return shopifyFilters;
  } catch {
    return [];
  }
};

const SHOP_PRICING_CACHE_TTL = 60 * 60 * 1000;
const PRODUCT_DATA_CACHE_TTL = 5 * 60;
const VARIANT_CONFIG_CACHE_TTL = 60 * 60 * 1000;

const getShopPricingData = () =>
  getServerCache(
    "shop-pricing-data",
    async () => {
      const shopPricingQuery = `
        query {
          shop {
            metalPrices: metafield(namespace: "DI-GoldPrice", key: "metal_prices") { value }
            stonePricing: metafield(namespace: "DI-GoldPrice", key: "stone_pricing") { value }
          }
        }
      `;
      const shopData = await shopifyStorefrontFetch(shopPricingQuery, {}, { next: { revalidate: 3600 } });

      return {
        metalRates: shopData?.shop?.metalPrices?.value ? JSON.parse(shopData.shop.metalPrices.value) : {},
        stonePricingDB: shopData?.shop?.stonePricing?.value ? JSON.parse(shopData.shop.stonePricing.value) : [],
      };
    },
    { ttlMs: SHOP_PRICING_CACHE_TTL, maxEntries: 20 }
  );

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "All";

    const shopifyFilters = [
        { tag: "bestsellers" }
    ];

    if (tab !== "All") {
        if (tab === "Pendants") {
            shopifyFilters.push({ productType: "Charms & Pendants" });
        } else if (tab === "Mangalsutra") {
            shopifyFilters.push({ productType: "Mangalsutra Necklaces" });
        } else {
            shopifyFilters.push({ productType: tab });
        }
    }

    // 1. Fetch Shop-wide pricing data (Storefront API)
    let metalRates = {};
    let stonePricingDB = [];
    try {
      const pricingData = await getShopPricingData();
      metalRates = pricingData.metalRates;
      stonePricingDB = pricingData.stonePricingDB;
    } catch (e) {
      console.warn("⚠️ Shop pricing metadata fetch failed:", e.message);
    }

    const COLLECTION_QUERY = `
      query GetCollectionProducts($handle: String!, $filters: [ProductFilter!]) {
        collectionByHandle(handle: $handle) {
          products(first: 20, filters: $filters, sortKey: BEST_SELLING) {
            edges {
              node {
                id title handle description descriptionHtml createdAt tags
                featuredImage { url }
                media(first: 20) {
                  edges {
                    node {
                      mediaContentType
                      ... on MediaImage { image { url altText } }
                      ... on Video { sources { url mimeType } }
                    }
                  }
                }
                variants(first: 50) {
                  edges {
                    node {
                      id sku price { amount } compareAtPrice { amount }
                      availableForSale quantityAvailable selectedOptions { name value }
                      image { url altText }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const storefrontData = await shopifyStorefrontFetch(COLLECTION_QUERY, { 
        handle: "bestsellers", 
        filters: shopifyFilters 
    }, { next: { revalidate: PRODUCT_DATA_CACHE_TTL } });

    const productsData = storefrontData?.collectionByHandle?.products;

    if (!productsData) {
      return NextResponse.json({ products: [] });
    }

    // 2. Fetch Variant Metafields in Bulk (Storefront API)
    const variantGids = [];
    productsData.edges.forEach(({ node }) => {
      node.variants.edges.forEach(({ node: v }) => variantGids.push(v.id));
    });

    const variantConfigs = {};
    if (variantGids.length > 0) {
      try {
        const variantQuery = `
          query getVariants($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on ProductVariant {
                id
                metafield(namespace: "DI-GoldPrice", key: "variant_config") { value }
              }
            }
          }
        `;
        const uniqueGids = [...new Set(variantGids)];
        const CHUNK_SIZE = 100;
        for (let i = 0; i < uniqueGids.length; i += CHUNK_SIZE) {
          const chunk = uniqueGids.slice(i, i + CHUNK_SIZE);
          const adminData = await getServerCache(
            stableCacheKey(["bestseller-variant-configs", chunk]),
            () => shopifyStorefrontFetch(variantQuery, { ids: chunk }, { next: { revalidate: 3600 } }),
            { ttlMs: VARIANT_CONFIG_CACHE_TTL, maxEntries: 2000 }
          );
          adminData?.nodes?.forEach(node => {
            if (node?.metafield?.value) {
              variantConfigs[node.id] = node.metafield.value;
            }
          });
        }
      } catch (e) {
        console.warn("⚠️ Bulk variant metadata fetch failed:", e.message);
      }
    }

    // 3. Process Products & Calculate Metadata
    let products = (await Promise.all(
      productsData.edges.map(async ({ node }) => {
        const variants = node.variants.edges.map(({ node: v }) => {
          const options = {};
          v.selectedOptions.forEach((o) => {
            options[o.name.toLowerCase()] = o.value;
          });

          let dynamic = {};
          let diamondDiscount = 0;
          let makingDiscount = 0;

          const configValue = variantConfigs[v.id];
          if (configValue) {
            try {
              const config = JSON.parse(configValue);
              const breakup = calculatePriceBreakup(config, metalRates, stonePricingDB);
              dynamic = {
                carat: breakup.diamond.carat,
                clarity: breakup.diamond.clarity,
                color: breakup.diamond.color,
                weight: breakup.metal.weight,
                diamondCharges: breakup.diamond.final,
                components: configValue
              };
              diamondDiscount = breakup.diamond.discount_percent || 0;
              makingDiscount = breakup.making_charges.discount_percent || 0;
            } catch (e) {}
          }

          const getOpt = (keys) => {
            for (const key of keys) {
              const lowerKey = key.toLowerCase();
              if (options[lowerKey] !== undefined && options[lowerKey] !== null) return options[lowerKey];
            }
            return null;
          };

          return {
            id: v.id.split("/").pop(),
            shopifyId: v.id,
            sku: v.sku,
            size: options.size || null,
            color: getOpt(["color", "metal", "metal color", "material color"]),
            carat: dynamic.carat ?? getOpt(["carat", "carat weight"]),
            clarity: dynamic.clarity ?? getOpt(["clarity"]),
            diamond_color: dynamic.color ?? getOpt(["diamond color"]),
            weight: dynamic.weight ?? getOpt(["weight"]),
            price: Number(v.price.amount),
            compare_price: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
            inStock: v.availableForSale === true && Number(v.quantityAvailable || 0) > 0,
            image: v.image?.url || null,
            altText: v.image?.altText || "",
            metafields: {
                components: dynamic.components,
                metal_weight: dynamic.weight,
                metal_purity: getOpt(["metal purity", "purity"])
            },
            diamondDiscount,
            makingDiscount
          };
        });

        let selectedVariant = variants.find((v) => v.inStock) || variants[0];

        const images = [];
        let video = null;

        node.media?.edges?.forEach(({ node: m }) => {
          if (m.mediaContentType === "IMAGE") {
            images.push({
              url: m.image.url,
              alt: m.image.altText || "",
            });
          } else if (m.mediaContentType === "VIDEO") {
            video = {
                url: m.sources?.[0]?.url,
                mimeType: m.sources?.[0]?.mimeType,
                preview: node.featuredImage?.url,
                sources: m.sources
            };
          }
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isNew = new Date(node.createdAt) > thirtyDaysAgo;

        const labelTag = node.tags?.find(tag =>
          ["best seller", "hot", "trending", "limited"].includes(tag.toLowerCase())
        );

        return {
          id: node.id.split("/").pop(),
          shopifyId: node.id,
          title: node.title,
          handle: node.handle,
          description: node.description,
          descriptionHtml: node.descriptionHtml,
          video,
          isNew: isNew,
          label: labelTag || (isNew ? "New" : null),
          images,
          price: selectedVariant.price,
          compare_price: selectedVariant.compare_price,
          selectedColor: selectedVariant.color,
          carat: selectedVariant.carat,
          clarity: selectedVariant.clarity,
          diamond_color: selectedVariant.diamond_color,
          weight: selectedVariant.weight,
          colors: [...new Set(variants.map((v) => v.color).filter(Boolean))],
          image: selectedVariant.image || node.featuredImage?.url,
          altText: selectedVariant.altText || "",
          variants,
          diamondDiscount: selectedVariant.diamondDiscount,
          makingDiscount: selectedVariant.makingDiscount,
          hasSimilar: true,
          reviewStats: { count: 0, average: 0 }
        };
      })
    )).filter(Boolean);

    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Bestsellers API Error:", error);
    return NextResponse.json({ products: [] });
  }
}
