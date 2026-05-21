import { shopifyStorefrontFetch } from "@/lib/shopify";
import { calculatePriceBreakup } from "@/lib/priceEngine";
import { getServerCache, stableCacheKey } from "@/lib/serverCache";

const SHOP_PRICING_CACHE_TTL = 60 * 60 * 1000;
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

async function processProducts(productsData, metalRates, stonePricingDB) {
  if (!productsData) return [];

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
          stableCacheKey(["homepage-variant-configs", chunk]),
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

  return (await Promise.all(
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
}

export async function getHomepageSectionsData() {
  try {
    const { metalRates, stonePricingDB } = await getShopPricingData();

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

    // Fetch Bestsellers (All)
    const bestsellersPromise = shopifyStorefrontFetch(COLLECTION_QUERY, { 
      handle: "bestsellers", 
      filters: [{ tag: "bestsellers" }] 
    }, { next: { revalidate: 3600 } });

    // Fetch Gemstones (All)
    const gemstonesPromise = shopifyStorefrontFetch(COLLECTION_QUERY, { 
      handle: "gemstone-jewellery", 
      filters: [] 
    }, { next: { revalidate: 3600 } });

    // Fetch Explore Collection (Initial: On The Move)
    const explorePromise = shopifyStorefrontFetch(COLLECTION_QUERY, { 
      handle: "sports-collection", 
      filters: [] 
    }, { next: { revalidate: 3600 } });

    const [bestsellersData, gemstonesData, exploreData] = await Promise.all([
      bestsellersPromise,
      gemstonesPromise,
      explorePromise
    ]);

    const [bestsellers, gemstones, explore] = await Promise.all([
      processProducts(bestsellersData?.collectionByHandle?.products, metalRates, stonePricingDB),
      processProducts(gemstonesData?.collectionByHandle?.products, metalRates, stonePricingDB),
      processProducts(exploreData?.collectionByHandle?.products, metalRates, stonePricingDB)
    ]);

    return {
      bestsellers,
      gemstones,
      explore
    };
  } catch (error) {
    console.error("Error fetching homepage sections data:", error);
    return { bestsellers: [], gemstones: [], explore: [] };
  }
}
