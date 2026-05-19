import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminFetch } from "@/lib/shopify";
import { calculatePriceBreakup } from "@/lib/priceEngine";
import { getServerCache, stableCacheKey } from "@/lib/serverCache";

const SORT_MAP = {
  best_selling: { sortKey: "BEST_SELLING", reverse: false },
  price_low_high: { sortKey: "PRICE", reverse: false },
  price_high_low: { sortKey: "PRICE", reverse: true },
  az: { sortKey: "TITLE", reverse: false },
};

const parseFilters = (rawFilters) => {
  if (!rawFilters) return [];
  try {
    const parsed =
      typeof rawFilters === "string" ? JSON.parse(rawFilters) : rawFilters;

    if (Array.isArray(parsed)) {
      return parsed;
    }

    const shopifyFilters = [];
    Object.values(parsed).forEach((group) => {
      if (!Array.isArray(group)) return;
      group.forEach((opt) => {
        if (!opt?.input) return;
        shopifyFilters.push(
          typeof opt.input === "string" ? JSON.parse(opt.input) : opt.input
        );
      });
    });

    return shopifyFilters;
  } catch {
    return [];
  }
};

const collectionCountCache = new Map();
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
      const shopData = await shopifyAdminFetch(shopPricingQuery, {}, { next: { revalidate: 3600 } });

      return {
        metalRates: shopData?.shop?.metalPrices?.value ? JSON.parse(shopData.shop.metalPrices.value) : {},
        stonePricingDB: shopData?.shop?.stonePricing?.value ? JSON.parse(shopData.shop.stonePricing.value) : [],
      };
    },
    { ttlMs: SHOP_PRICING_CACHE_TTL, maxEntries: 20 }
  );

const getCollectionTotalCount = async (handle) => {
  const cacheKey = `collection-count:${handle}`;
  if (collectionCountCache.has(cacheKey)) {
    return collectionCountCache.get(cacheKey);
  }

  const query = `
    query CollectionProductCount($query: String!) {
      collections(first: 1, query: $query) {
        edges {
          node {
            productsCount { count }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminFetch(query, {
      query: `handle:${handle}`,
    });

    const count =
      data?.collections?.edges?.[0]?.node?.productsCount?.count ?? 0;

    collectionCountCache.set(cacheKey, count);
    setTimeout(() => collectionCountCache.delete(cacheKey), 10 * 60 * 1000);

    return count;
  } catch (e) {
    return 0;
  }
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");
    const sort = searchParams.get("sort") || "best_selling";
    const cursor = searchParams.get("cursor");
    const limit = Number(searchParams.get("limit")) || 20;
    const filters = searchParams.get("filters");

    if (!handle) {
      return NextResponse.json({
        products: [],
        filters: {},
        pageInfo: {},
        totalProducts: 0,
      });
    }

    const activeFilters = parseFilters(filters);
    const sortConfig = SORT_MAP[sort] || SORT_MAP.best_selling;

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

    // 1. Fetch Shop-wide pricing data (Admin API)
    let metalRates = {};
    let stonePricingDB = [];
    try {
      const pricingData = await getShopPricingData();
      metalRates = pricingData.metalRates;
      stonePricingDB = pricingData.stonePricingDB;
    } catch (e) {
      console.warn("⚠️ Shop pricing metadata fetch failed:", e.message);
    }
    // 2. Fetch Collection (Storefront API)
    const COLLECTION_QUERY = `
      query CollectionProducts(
        $handle: String!
        $first: Int!
        $after: String
        $sortKey: ProductCollectionSortKeys
        $reverse: Boolean
        $filters: [ProductFilter!]
      ) {
        collectionByHandle(handle: $handle) {
          title
          description
          seo { title description }
          image {
            url
            altText
          }
          products(
            first: $first
            after: $after
            sortKey: $sortKey
            reverse: $reverse
            filters: $filters
          ) {
            pageInfo { hasNextPage endCursor }
            filters {
              label
              type
              values { label count input }
            }
            edges {
              node {
                id
                title
                handle
                description
                descriptionHtml
                createdAt
                tags
                featuredImage { url }
                productMetafields: metafields(identifiers: [
                  {namespace: "ornaverse", key: "weight"},
                  {namespace: "ornaverse", key: "quality"},
                  {namespace: "ornaverse", key: "carat_range"},
                  {namespace: "ornaverse", key: "lead_time"},
                  {namespace: "ornaverse", key: "components"},
                  {namespace: "custom", key: "matching_product"}
                ]) {
                  key
                  value
                }
                media(first: 20) {
                  edges {
                    node {
                      mediaContentType
                      ... on MediaImage {
                        image {
                          url
                          altText
                        }
                      }
                      ... on Video {
                        sources {
                          url
                          mimeType
                        }
                      }
                    }
                  }
                }
                variants(first: 50) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price { amount }
                      compareAtPrice { amount }
                      availableForSale
                      quantityAvailable
                      selectedOptions { name value }
                      image {
                        url
                        altText
                      }
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

    const ALL_PRODUCTS_QUERY = `
      query AllProducts($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
          pageInfo { hasNextPage endCursor }
          filters { label type values { label count input } }
          edges {
            node {
              id title handle description descriptionHtml createdAt tags featuredImage { url }
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
                    id title sku price { amount } compareAtPrice { amount }
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
    `;

    let storefrontData;
    if (handle === "all") {
      let filterQuery = "";
      if (finalFilters.length > 0) {
          finalFilters.forEach(f => {
              if (f.productType) filterQuery += ` product_type:${f.productType}`;
              if (f.tag) filterQuery += ` tag:${f.tag}`;
              if (f.variantOption) filterQuery += ` variant_option:${f.variantOption.name}:${f.variantOption.value}`;
          });
      }

      storefrontData = await shopifyStorefrontFetch(ALL_PRODUCTS_QUERY, {
        first: limit,
        after: cursor || null,
        sortKey: sortConfig.sortKey === "BEST_SELLING" ? "BEST_SELLING" : sortConfig.sortKey === "PRICE" ? "PRICE" : "TITLE",
        reverse: sortConfig.reverse,
        query: filterQuery.trim() || null,
      }, { next: { revalidate: PRODUCT_DATA_CACHE_TTL } });
    } else {
      storefrontData = await shopifyStorefrontFetch(COLLECTION_QUERY, {
        handle,
        first: limit,
        after: cursor || null,
        sortKey: sortConfig.sortKey,
        reverse: sortConfig.reverse,
        filters: finalFilters,
      }, { next: { revalidate: PRODUCT_DATA_CACHE_TTL } });
    }

    const collectionData = storefrontData?.collectionByHandle;
    const productsData = handle === "all" ? storefrontData?.products : collectionData?.products;

    if (!productsData) {
      return NextResponse.json({
        collection: handle === "all" ? { title: "All Products", description: "All of our products" } : (collectionData || {}),
        products: [], filters: {}, pageInfo: {}, totalProducts: 0
      }, { headers: { "Cache-Control": "no-store" } });
    }

    // 3. Fetch Variant Metafields in Bulk (Admin API)
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
            stableCacheKey(["collection-variant-configs", chunk]),
            () => shopifyAdminFetch(variantQuery, { ids: chunk }, { next: { revalidate: 3600 } }),
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

    // 4. Process Products & Calculate Metadata
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
          let configMetalPurity = null;

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
              configMetalPurity = config.purity;

              if (config.advanced_stone_config) {
                fallbackDiamonds = config.advanced_stone_config.map(s => ({
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

          // Technical specifications mapping
          let comps = null;
          try {
            comps = v.components?.value ? JSON.parse(v.components.value) : null;
          } catch(e) {}
          
          const metalComp = comps?.components?.find(c => c.item_group_name === "Gold");
          const diamondComps = comps?.components?.filter(c => c.item_group_name === "Diamond") || [];
          const gemstoneComps = comps?.components?.filter(c => c.item_group_name === "Gemstone" || c.item_group_name === "Color Stone") || [];

          let metal_purity = metalComp?.karat_code ? `${metalComp.karat_code}K` : null;
          let metal_color = metalComp?.stone_color_code && metalComp.stone_color_code !== "NA" ? metalComp.stone_color_code : null;
          
          if (!metal_color) {
            const t = v.title || "";
            if (t.toLowerCase().includes('rose')) metal_color = 'Rose Gold';
            else if (t.toLowerCase().includes('white')) metal_color = 'White Gold';
            else if (t.toLowerCase().includes('yellow')) metal_color = 'Yellow Gold';
            else if (t.toLowerCase().includes('platinum')) metal_color = 'Platinum';
          }

          const diamonds = diamondComps.map(d => ({
            quality: d.quality_code && d.quality_code !== "NA" ? d.quality_code : (d.purity || "VVS-VS, EF"),
            shape: d.shape_code,
            pieces: d.pieces,
            weight: d.weight
          }));

          const gemstones = gemstoneComps.map(g => ({
            color: g.stone_color_code,
            shape: g.shape_code,
            pieces: g.pieces,
            weight: g.weight
          }));

          const inStock = v.availableForSale === true && (v.quantityAvailable === null || Number(v.quantityAvailable) > 0);

          return {
            id: (v.id || "").split("/").pop() || Math.random().toString(),
            shopifyId: v.id,
            sku: v.sku,
            size: options.size || null,
            color: getOpt(["color", "metal", "metal color", "material color"]),
            carat: dynamic.carat ?? getOpt(["carat", "carat weight"]),
            clarity: dynamic.clarity ?? getOpt(["clarity"]),
            diamond_color: dynamic.color ?? getOpt(["diamond color"]),
            weight: dynamic.weight ?? getOpt(["weight"]),
            diamondCharges: dynamic.diamondCharges || 0,
            price: Number(v.price?.amount || 0),
            compare_price: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
            inStock: inStock,
            image: v.image?.url || null,
            altText: v.image?.altText || "",
            metafields: {
                metal_purity: metal_purity || configMetalPurity || getOpt(["metal purity", "purity"]),
                metal_color: metal_color,
                metal_weight: dynamic.weight || v.metal_weight?.value || metalComp?.weight,
                gross_weight: v.gross_weight?.value,
                top_width: v.top_width?.value,
                top_height: v.top_height?.value,
                diamonds: diamonds.length > 0 ? diamonds : (fallbackDiamonds.length > 0 ? fallbackDiamonds : (v.diamonds_meta?.value ? JSON.parse(v.diamonds_meta.value) : [])),
                gemstones: gemstones.length > 0 ? gemstones : (v.gemstones_meta?.value ? JSON.parse(v.gemstones_meta.value) : []),
                components: v.components?.value,
                variant_config: configValue
            },
            hasSimilar: true,
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
          id: (node.id || "").split("/").pop() || Math.random().toString(),
          shopifyId: node.id,
          title: node.title,
          handle: node.handle,
          description: node.description,
          descriptionHtml: node.descriptionHtml,
          tags: node.tags,
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
          productMetafields,
          diamondDiscount: selectedVariant.diamondDiscount,
          makingDiscount: selectedVariant.makingDiscount,
          hasSimilar: true,
          reviewStats: { count: 0, average: 0 }
        };
      })
    )).filter(Boolean);

    const processedFilters = {};
    productsData.filters.forEach((f) => {
      if (f.type === "PRICE_RANGE") {
          processedFilters["Price"] = {
              min: 0,
              max: Math.max(...f.values.map(v => {
                  try { return JSON.parse(v.input).price.max || 1000000; } catch(e) { return 1000000; }
              }))
          };
          return;
      }
      processedFilters[f.label] = f.values.map((v) => ({
        label: v.label,
        count: v.count,
        input: v.input,
      }));
    });

    let totalProducts = await getCollectionTotalCount(handle);

    return NextResponse.json(
      {
        collection: {
          title: collectionData?.title,
          description: collectionData?.description,
          seo: collectionData?.seo,
          image: collectionData?.image,
        },
        products,
        filters: processedFilters,
        pageInfo: productsData.pageInfo,
        totalProducts,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
        }
      }
    );
  } catch (err) {
    console.error("❌ Collection API error:", err);
    return NextResponse.json(
      { error: "Server error", message: err.message },
      { status: 500 }
    );
  }
}
