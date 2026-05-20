import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";
import { calculatePriceBreakup } from "@/lib/priceEngine";
import { getServerCache, stableCacheKey } from "@/lib/serverCache";

const SORT_MAP = {
  featured: { sortKey: "RELEVANCE", reverse: false },
  relevance: { sortKey: "RELEVANCE", reverse: false },
  best_selling: { sortKey: "BEST_SELLING", reverse: false },
  az: { sortKey: "TITLE", reverse: false },
  za: { sortKey: "TITLE", reverse: true },
  price_low_high: { sortKey: "PRICE", reverse: false },
  price_high_low: { sortKey: "PRICE", reverse: true },
  date_new_old: { sortKey: "CREATED_AT", reverse: true },
  date_old_new: { sortKey: "CREATED_AT", reverse: false },
};

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
    const handle = searchParams.get("handle") || "all";
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "25");
    const cursor = searchParams.get("cursor");
    const sort = searchParams.get("sort") || "featured";
    const filtersRaw = searchParams.get("filters");

    const activeFilters = parseFilters(filtersRaw);
    const sortConfig = SORT_MAP[sort] || SORT_MAP.featured;

    // Extract dynamic filters from searchParams for Shopify
    const shopifyFilters = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter.")) {
        try {
          if (key === "filter.v.price.gte" || key === "filter.v.price.lte") {
            const existingPrice = shopifyFilters.find(f => f.price);
            if (existingPrice) {
              if (key === "filter.v.price.gte") existingPrice.price.min = parseFloat(value);
              else existingPrice.price.max = parseFloat(value);
            } else {
              shopifyFilters.push({ price: { 
                min: key === "filter.v.price.gte" ? parseFloat(value) : 0,
                max: key === "filter.v.price.lte" ? parseFloat(value) : 1000000 
              }});
            }
          } else if (key === "filter.p.product_type") {
              shopifyFilters.push({ productType: value });
          } else {
            try {
                shopifyFilters.push(JSON.parse(value));
            } catch(e) {
                shopifyFilters.push({ [key.replace("filter.", "")]: value });
            }
          }
        } catch (e) {}
      }
    });

    const finalFilters = shopifyFilters.length > 0 ? shopifyFilters : activeFilters;

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
      query SearchProducts(
        $handle: String!
        $first: Int!
        $after: String
        $sortKey: ProductCollectionSortKeys
        $reverse: Boolean
        $filters: [ProductFilter!]
      ) {
        collectionByHandle(handle: $handle) {
          products(
            first: $first
            after: $after
            sortKey: $sortKey
            reverse: $reverse
            filters: $filters
          ) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id title handle description descriptionHtml createdAt tags
                featuredImage { url }
                productMetafields: metafields(identifiers: [
                  {namespace: "ornaverse", key: "weight"},
                  {namespace: "ornaverse", key: "quality"},
                  {namespace: "ornaverse", key: "carat_range"},
                  {namespace: "ornaverse", key: "lead_time"},
                  {namespace: "ornaverse", key: "components"}
                ]) {
                  key
                  value
                }
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
                      metal_weight: metafield(namespace: "ornaverse", key: "metal_weight") { value }
                      gross_weight: metafield(namespace: "ornaverse", key: "gross_weight") { value }
                      top_width: metafield(namespace: "ornaverse", key: "top_width") { value }
                      top_height: metafield(namespace: "ornaverse", key: "top_height") { value }
                      diamonds_meta: metafield(namespace: "ornaverse", key: "diamonds") { value }
                      gemstones_meta: metafield(namespace: "ornaverse", key: "gemstones") { value }
                      components: metafield(namespace: "ornaverse", key: "components") { value }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const SEARCH_QUERY = `
      query KeywordSearch($query: String!, $first: Int!, $after: String, $filters: [ProductFilter!]) {
        search(query: $query, first: $first, after: $after, productFilters: $filters, types: [PRODUCT]) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              ... on Product {
                id title handle description descriptionHtml createdAt tags
                collectionHandles: collections(first: 10) { edges { node { handle } } }
                featuredImage { url }
                productMetafields: metafields(identifiers: [
                  {namespace: "ornaverse", key: "weight"},
                  {namespace: "ornaverse", key: "quality"},
                  {namespace: "ornaverse", key: "carat_range"},
                  {namespace: "ornaverse", key: "lead_time"},
                  {namespace: "ornaverse", key: "components"}
                ]) {
                  key
                  value
                }
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
                      metal_weight: metafield(namespace: "ornaverse", key: "metal_weight") { value }
                      gross_weight: metafield(namespace: "ornaverse", key: "gross_weight") { value }
                      top_width: metafield(namespace: "ornaverse", key: "top_width") { value }
                      top_height: metafield(namespace: "ornaverse", key: "top_height") { value }
                      diamonds_meta: metafield(namespace: "ornaverse", key: "diamonds") { value }
                      gemstones_meta: metafield(namespace: "ornaverse", key: "gemstones") { value }
                      components: metafield(namespace: "ornaverse", key: "components") { value }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    let productsData;
    if (query && (handle === "all" || !handle)) {
      const storefrontData = await shopifyStorefrontFetch(SEARCH_QUERY, {
        query,
        first: limit,
        after: cursor || null,
        filters: finalFilters
      }, { next: { revalidate: PRODUCT_DATA_CACHE_TTL } });
      productsData = storefrontData?.search;
    } else {
      const storefrontData = await shopifyStorefrontFetch(COLLECTION_QUERY, {
        handle: handle,
        first: limit,
        after: cursor || null,
        sortKey: sortConfig.sortKey === "RELEVANCE" ? "BEST_SELLING" : sortConfig.sortKey,
        reverse: sortConfig.reverse,
        filters: finalFilters,
      }, { next: { revalidate: PRODUCT_DATA_CACHE_TTL } });
      productsData = storefrontData?.collectionByHandle?.products;
    }

    if (!productsData) {
      return NextResponse.json({ products: [], pagination: { total: 0, hasNextPage: false } });
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
                variant_config: metafield(namespace: "DI-GoldPrice", key: "variant_config") { value }
                metal_weight: metafield(namespace: "ornaverse", key: "metal_weight") { value }
                gross_weight: metafield(namespace: "ornaverse", key: "gross_weight") { value }
                top_width: metafield(namespace: "ornaverse", key: "top_width") { value }
                top_height: metafield(namespace: "ornaverse", key: "top_height") { value }
                diamonds_meta: metafield(namespace: "ornaverse", key: "diamonds") { value }
                gemstones_meta: metafield(namespace: "ornaverse", key: "gemstones") { value }
                components: metafield(namespace: "ornaverse", key: "components") { value }
              }
            }
          }
        `;
        const uniqueGids = [...new Set(variantGids)];
        const CHUNK_SIZE = 100;
        for (let i = 0; i < uniqueGids.length; i += CHUNK_SIZE) {
          const chunk = uniqueGids.slice(i, i + CHUNK_SIZE);
          const adminData = await getServerCache(
            stableCacheKey(["search-variant-configs", chunk]),
            () => shopifyStorefrontFetch(variantQuery, { ids: chunk }, { next: { revalidate: 3600 } }),
            { ttlMs: VARIANT_CONFIG_CACHE_TTL, maxEntries: 2000 }
          );
          adminData?.nodes?.forEach(node => {
            if (node) {
              variantConfigs[node.id] = node;
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
        const productMetafields = {};
        node.productMetafields?.forEach(m => {
          if (m) productMetafields[m.key] = m.value;
        });

        const variants = node.variants.edges.map(({ node: v }) => {
          const options = {};
          v.selectedOptions.forEach((o) => {
            options[o.name.toLowerCase()] = o.value;
          });

          let dynamic = {};
          let diamondDiscount = 0;
          let makingDiscount = 0;
          let fallbackDiamonds = [];

          const variantData = variantConfigs[v.id];
          const configValue = variantData?.variant_config?.value;

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

              if (config.advanced_stone_config) {
                fallbackDiamonds = config.advanced_stone_config.filter(s => s.stone_type === 'diamond').map(s => ({
                   quality: s.pricing_id,
                   pieces: s.stone_quantity,
                   weight: s.stone_weight
                }));
              }
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
                metal_purity: getOpt(["metal purity", "purity"]),
                metal_weight: dynamic.weight || v.metal_weight?.value || variantData?.metal_weight?.value,
                gross_weight: v.gross_weight?.value || variantData?.gross_weight?.value,
                top_width: v.top_width?.value || variantData?.top_width?.value,
                top_height: v.top_height?.value || variantData?.top_height?.value,
                diamonds: v.diamonds_meta?.value ? JSON.parse(v.diamonds_meta.value) : (variantData?.diamonds_meta?.value ? JSON.parse(variantData.diamonds_meta.value) : (fallbackDiamonds.length > 0 ? fallbackDiamonds : [])),
                gemstones: v.gemstones_meta?.value ? JSON.parse(v.gemstones_meta.value) : (variantData?.gemstones_meta?.value ? JSON.parse(variantData.gemstones_meta.value) : []),
                components: v.components?.value || variantData?.components?.value || dynamic.components,
                variant_config: configValue
            },
            diamondDiscount,
            makingDiscount
          };
        });

        // 9KT Collection Filtering
        if (handle === "9kt-collection") {
            const has9kt = variants.some(v => String(v.color || v.metafields?.metal_purity || "").includes("9KT"));
            if (!has9kt) return null;
        }

        let selectedVariant = variants.find((v) => v.inStock) || variants[0];

        if (finalFilters && finalFilters.length > 0) {
          const priceFilter = finalFilters.find(f => f.price);
          if (priceFilter && priceFilter.price) {
            const min = priceFilter.price.min ?? 0;
            const max = priceFilter.price.max ?? 1000000;
            const matchingVariant = variants.find(v => v.inStock && v.price >= min && v.price <= max);
            if (matchingVariant) {
              selectedVariant = matchingVariant;
            }
          }
        }

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
          collectionHandles: node.collectionHandles?.edges?.map(e => e.node.handle) || [],
          description: node.description,
          descriptionHtml: node.descriptionHtml,
          productMetafields,
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

    return NextResponse.json({
      products,
      pagination: {
        hasNextPage: productsData.pageInfo.hasNextPage,
        endCursor: productsData.pageInfo.endCursor,
        total: 0
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });

  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
