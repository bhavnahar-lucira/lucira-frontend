import { notFound } from "next/navigation";
import ProductPageClient from "@/components/product/ProductPageClient";
import { getProductSchema, getBreadcrumbSchema } from "@/lib/seo";
import { shopifyStorefrontFetch, getAllProductHandles } from "@/lib/shopify";

export const revalidate = 86400; // 24 hours

const PRODUCT_QUERY = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      vendor
      productType
      tags
      createdAt
      publishedAt
      collectionHandles: collections(first: 10) { edges { node { handle } } }
      featuredImage { url }
      images(first: 20) {
        edges {
          node {
            url
            altText
          }
        }
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
              alt
              sources {
                url
                mimeType
                format
              }
            }
            ... on ExternalVideo {
              alt
              embedUrl
              host
            }
          }
        }
      }
      variants(first: 250) {
        edges {
          node {
            id
            title
            sku
            availableForSale
            currentlyNotInStock
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            selectedOptions { name value }
            image { url altText }
            metal_weight: metafield(namespace: "ornaverse", key: "metal_weight") { value }
            gross_weight: metafield(namespace: "ornaverse", key: "gross_weight") { value }
            top_width: metafield(namespace: "ornaverse", key: "top_width") { value }
            top_height: metafield(namespace: "ornaverse", key: "top_height") { value }
            in_store_available: metafield(namespace: "ornaverse", key: "in_store_available") { value }
            custom_in_store_available: metafield(namespace: "custom", key: "in_store_available") { value }
            diamonds_meta: metafield(namespace: "ornaverse", key: "diamonds") { value }
            gemstones_meta: metafield(namespace: "ornaverse", key: "gemstones") { value }
            components: metafield(namespace: "ornaverse", key: "components") { value }
            variant_config: metafield(namespace: "DI-GoldPrice", key: "variant_config") { value }
            # Fallbacks from custom namespace
            custom_metal_purity: metafield(namespace: "custom", key: "metal_purity") { value }
            custom_metal_weight: metafield(namespace: "custom", key: "metal_weight") { value }
            custom_metal_color: metafield(namespace: "custom", key: "metal_color") { value }
            custom_gross_weight: metafield(namespace: "custom", key: "gross_weight") { value }
            custom_top_width: metafield(namespace: "custom", key: "top_width") { value }
            custom_top_height: metafield(namespace: "custom", key: "top_height") { value }
            # Diamond individual fallbacks
            d1_clarity: metafield(namespace: "custom", key: "diamond_1_clarity") { value }
            d1_color: metafield(namespace: "custom", key: "diamond_1_color") { value }
            d1_shape: metafield(namespace: "custom", key: "diamond_1_shape") { value }
            d1_pcs: metafield(namespace: "custom", key: "diamond_1_numbers") { value }
            d1_wt: metafield(namespace: "custom", key: "diamond_1_weight") { value }
            d2_clarity: metafield(namespace: "custom", key: "diamond_2_clarity") { value }
            d2_color: metafield(namespace: "custom", key: "diamond_2_color") { value }
            d2_shape: metafield(namespace: "custom", key: "diamond_2_shape") { value }
            d2_pcs: metafield(namespace: "custom", key: "diamond_2_numbers") { value }
            d2_wt: metafield(namespace: "custom", key: "diamond_2_weight") { value }
            d3_clarity: metafield(namespace: "custom", key: "diamond_3_clarity") { value }
            d3_color: metafield(namespace: "custom", key: "diamond_3_color") { value }
            d3_shape: metafield(namespace: "custom", key: "diamond_3_shape") { value }
            d3_pcs: metafield(namespace: "custom", key: "diamond_3_numbers") { value }
            d3_wt: metafield(namespace: "custom", key: "diamond_3_weight") { value }
            d4_clarity: metafield(namespace: "custom", key: "diamond_4_clarity") { value }
            d4_color: metafield(namespace: "custom", key: "diamond_4_color") { value }
            d4_shape: metafield(namespace: "custom", key: "diamond_4_shape") { value }
            d4_pcs: metafield(namespace: "custom", key: "diamond_4_numbers") { value }
            d4_wt: metafield(namespace: "custom", key: "diamond_4_weight") { value }
            # Gemstone individual fallbacks
            g1_type: metafield(namespace: "custom", key: "gemstone_1_type") { value }
            g1_clarity: metafield(namespace: "custom", key: "gemstone_1_clarity") { value }
            g1_color: metafield(namespace: "custom", key: "gemstone_1_color") { value }
            g1_shape: metafield(namespace: "custom", key: "gemstone_1_shape") { value }
            g1_wt: metafield(namespace: "custom", key: "gemstone_1_weight") { value }
            g1_pcs: metafield(namespace: "custom", key: "gemstone_1_numbers") { value }
            g1_setting: metafield(namespace: "custom", key: "gemstone_1_setting") { value }
            g2_type: metafield(namespace: "custom", key: "gemstone_2_type") { value }
            g2_clarity: metafield(namespace: "custom", key: "gemstone_2_clarity") { value }
            g2_color: metafield(namespace: "custom", key: "gemstone_2_color") { value }
            g2_shape: metafield(namespace: "custom", key: "gemstone_2_shape") { value }
            g2_wt: metafield(namespace: "custom", key: "gemstone_2_weight") { value }
            g2_pcs: metafield(namespace: "custom", key: "gemstone_2_numbers") { value }
            g2_setting: metafield(namespace: "custom", key: "gemstone_2_setting") { value }
            g3_type: metafield(namespace: "custom", key: "gemstone_3_type") { value }
            g3_clarity: metafield(namespace: "custom", key: "gemstone_3_clarity") { value }
            g3_color: metafield(namespace: "custom", key: "gemstone_3_color") { value }
            g3_shape: metafield(namespace: "custom", key: "gemstone_3_shape") { value }
            g3_wt: metafield(namespace: "custom", key: "gemstone_3_weight") { value }
            g3_pcs: metafield(namespace: "custom", key: "gemstone_3_numbers") { value }
            g3_setting: metafield(namespace: "custom", key: "gemstone_3_setting") { value }
            g4_type: metafield(namespace: "custom", key: "gemstone_4_type") { value }
            g4_clarity: metafield(namespace: "custom", key: "gemstone_4_clarity") { value }
            g4_color: metafield(namespace: "custom", key: "gemstone_4_color") { value }
            g4_shape: metafield(namespace: "custom", key: "gemstone_4_shape") { value }
            g4_wt: metafield(namespace: "custom", key: "gemstone_4_weight") { value }
            g4_pcs: metafield(namespace: "custom", key: "gemstone_4_numbers") { value }
            g4_setting: metafield(namespace: "custom", key: "gemstone_4_setting") { value }
          }
        }
      }
      seo { title description }
      productMetafields: metafields(identifiers: [
        {namespace: "ornaverse", key: "weight"},
        {namespace: "ornaverse", key: "quality"},
        {namespace: "ornaverse", key: "carat_range"},
        {namespace: "ornaverse", key: "lead_time"},
        {namespace: "ornaverse", key: "components"},
        {namespace: "ornaverse", key: "bestsellers"}
      ]) {
        key
        value
      }
      category: metafield(namespace: "ornaverse", key: "category") { value }
    }
  }
`;

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) return {};

  const cleanDescription = product.description?.replace(/<[^>]*>?/gm, '').slice(0, 160) || "";

  return {
    title: product.seo?.title || `${product.title} | Lucira Jewelry`,
    description: product.seo?.description || cleanDescription,
    openGraph: {
      title: product.seo?.title || product.title,
      description: product.seo?.description || cleanDescription,
      images: [product.image],
    },
    alternates: {
      canonical: `/products/${handle}`,
    },
  };
}

export async function generateStaticParams() {
  // Pre-render the top 250 bestseller product pages at build time.
  // These are served from Vercel CDN (FREE — no function invocations on first visit).
  // All 2600+ other product pages still work — rendered on-demand when first visited, then cached.
  // ISR (revalidate=86400) + webhook revalidation still applies to pre-rendered pages.
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
      ? process.env.NEXT_PUBLIC_BACKEND_URL
      : "http://127.0.0.1:8080";
    const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

    const res = await fetch(
      `${base}/api/collection?handle=bestsellers&limit=250&sort=best_selling`,
      { cache: 'force-cache' }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const handles = (data.products || [])
      .filter(p => p?.handle)
      .map(p => ({ handle: p.handle }));

    console.log(`[generateStaticParams/products] Pre-rendering ${handles.length} bestseller pages at build time.`);
    return handles;
  } catch (err) {
    // Safe fallback — if backend is unreachable at build time, skip pre-rendering.
    // All product pages still work via on-demand rendering. Build continues normally.
    console.warn("[generateStaticParams/products] Could not fetch bestsellers, skipping pre-render:", err.message);
    return [];
  }
}

async function getProduct(handle) {
  // Use force-cache so the fetch is cached and inherits the page-level revalidate=86400
  const data = await shopifyStorefrontFetch(PRODUCT_QUERY, { handle }, { cache: 'force-cache' });
  const product = data?.product;


  if (!product) return null;

  const getOpt = (options, keys) => {
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (options[lowerKey] !== undefined && options[lowerKey] !== null) return options[lowerKey];
    }
    return null;
  };

  // Map product metafields
  const productMetafields = {};
  product.productMetafields?.forEach(m => {
    if (m) productMetafields[m.key] = m.value;
  });

  // Map to the internal format expected by the frontend
  const mappedVariants = product.variants.edges.map(({ node: v }) => {
    const options = {};
    v.selectedOptions.forEach(o => { options[o.name.toLowerCase()] = o.value; });
    
    // Parse components for technical details
    const comps = v.components?.value ? JSON.parse(v.components.value) : null;
    const variantConfig = v.variant_config?.value ? JSON.parse(v.variant_config.value) : null;

    const metalComp = comps?.components?.find(c => c.item_group_name === "Gold");
    const diamondComps = comps?.components?.filter(c => c.item_group_name === "Diamond") || [];
    const gemstoneComps = comps?.components?.filter(c => c.item_group_name === "Gemstone" || c.item_group_name === "Color Stone") || [];
    const rawStoreData = v.in_store_available?.value || v.custom_in_store_available?.value;
    const in_store_available = rawStoreData ? JSON.parse(rawStoreData) : [];

    let metal_purity = metalComp?.karat_code ? `${metalComp.karat_code}K` : (v.custom_metal_purity?.value || variantConfig?.purity || getOpt(options, ["metal purity", "purity"]));
    let metal_color = metalComp?.stone_color_code && metalComp.stone_color_code !== "NA" ? metalComp.stone_color_code : (v.custom_metal_color?.value || getOpt(options, ["metal color", "material color"]));
    
    if (!metal_color) {
      const lowerTitle = v.title.toLowerCase();
      if (lowerTitle.includes('yellow') && lowerTitle.includes('white')) metal_color = 'Yellow-White Gold';
      else if (lowerTitle.includes('rose') && lowerTitle.includes('white')) metal_color = 'Rose-White Gold';
      else if (lowerTitle.includes('rose')) metal_color = 'Rose Gold';
      else if (lowerTitle.includes('white')) metal_color = 'White Gold';
      else if (lowerTitle.includes('yellow')) metal_color = 'Yellow Gold';
      else if (lowerTitle.includes('platinum')) metal_color = 'Platinum';
    }

    let diamonds = [];
    if (variantConfig?.advanced_stone_config) {
      // Prioritize advanced_stone_config for diamonds
      diamonds = variantConfig.advanced_stone_config
        .filter(s => s.stone_type === 'diamond')
        .map((s, index) => {
          const i = index + 1;
          const clarity = v[`d${i}_clarity`]?.value;
          const color = v[`d${i}_color`]?.value;
          
          // Prioritize Diamond X Clarity and Diamond X Color metafields over pricing_id
          let quality = "";
          if (clarity || color) {
            quality = `${clarity || ""}${color ? `, ${color}` : ""}`.trim().replace(/^,/, "").trim();
          }
          
          // Only fallback to pricing_id if metafields are missing
          if (!quality || quality === "NA") {
            quality = s.pricing_id;
          }

          return {
            quality: quality || "",
            shape: v[`d${i}_shape`]?.value || s.shape_code || "RD",
            pieces: s.stone_quantity || v[`d${i}_pcs`]?.value || "1",
            weight: s.stone_weight || v[`d${i}_wt`]?.value || "0"
          };
        });
    }

    if (diamonds.length === 0) {
      diamonds = diamondComps.map((d, index) => {
        const i = index + 1;
        return {
          quality: d.quality_code && d.quality_code !== "NA" ? d.quality_code : (d.purity || v[`d${i}_clarity`]?.value || ""),
          shape: d.shape_code || v[`d${i}_shape`]?.value,
          pieces: d.pieces || v[`d${i}_pcs`]?.value,
          weight: d.weight || v[`d${i}_wt`]?.value
        };
      });
    }

    // Fallback B: Individual custom diamond fields (if still empty)
    if (diamonds.length === 0) {
      [1, 2, 3, 4].forEach(i => {
        if (v[`d${i}_clarity`]?.value || v[`d${i}_wt`]?.value) {
          diamonds.push({
            quality: `${v[`d${i}_clarity`]?.value || ""}${v[`d${i}_color`]?.value ? `, ${v[`d${i}_color`]?.value}` : ""}`.trim().replace(/^,/, ""),
            shape: v[`d${i}_shape`]?.value || "Round",
            pieces: v[`d${i}_pcs`]?.value || "1",
            weight: v[`d${i}_wt`]?.value || "0"
          });
        }
      });
    }

    // Fallback C: ornaverse.diamonds metafield
    if (diamonds.length === 0 && v.diamonds_meta?.value) {
      try {
        diamonds = JSON.parse(v.diamonds_meta.value);
      } catch(e) {}
    }

    let gemstones = [];
    // Gemstone logic: prioritize individual metafields as requested
    [1, 2, 3, 4].forEach(i => {
      if (v[`g${i}_color`]?.value || v[`g${i}_wt`]?.value || v[`g${i}_type`]?.value) {
        gemstones.push({
          color: v[`g${i}_color`]?.value || "Other",
          shape: v[`g${i}_shape`]?.value || "Round",
          pieces: v[`g${i}_pcs`]?.value || "1",
          weight: v[`g${i}_wt`]?.value || "0",
          quality: v[`g${i}_clarity`]?.value || "Na",
          type: v[`g${i}_type`]?.value || "Other",
          setting: v[`g${i}_setting`]?.value || "Prong"
        });
      }
    });

    if (gemstones.length === 0 && variantConfig?.advanced_stone_config) {
        gemstones = variantConfig.advanced_stone_config
          .filter(s => s.stone_type === 'gemstone')
          .map((s, index) => {
            const i = index + 1;
            return {
              color: v[`g${i}_color`]?.value || "Other",
              shape: v[`g${i}_shape`]?.value || s.shape_code || "RD",
              pieces: s.stone_quantity || v[`g${i}_pcs`]?.value || "1",
              weight: s.stone_weight || v[`g${i}_wt`]?.value || "0",
              quality: v[`g${i}_clarity`]?.value || "Na",
              type: v[`g${i}_type`]?.value || "Other",
              setting: v[`g${i}_setting`]?.value || "Prong"
            };
          });
    }

    if (gemstones.length === 0) {
      gemstones = gemstoneComps.map(g => ({
        color: g.stone_color_code,
        shape: g.shape_code,
        pieces: g.pieces,
        weight: g.weight
      }));
    }

    if (gemstones.length === 0 && v.gemstones_meta?.value) {
      try {
        gemstones = JSON.parse(v.gemstones_meta.value);
      } catch(e) {}
    }

    return {
      id: v.id.split("/").pop(),
      shopifyId: v.id,
      title: v.title,
      sku: v.sku,
      price: Number(v.price.amount),
      compare_price: v.compareAtPrice ? Number(v.compareAtPrice.amount) : null,
      inStock: v.availableForSale === true && v.currentlyNotInStock === false,
      inventoryQuantity: (v.availableForSale === true && v.currentlyNotInStock === false) ? 10 : 0,
      image: v.image?.url,
      size: options.size || null,
      color: getOpt(options, ["color", "metal", "metal color", "material color"]),
      options,
      metafields: {
        metal_purity,
        metal_color,
        metal_weight: v.metal_weight?.value || v.custom_metal_weight?.value || metalComp?.weight || variantConfig?.metal_weight,
        gross_weight: v.gross_weight?.value || v.custom_gross_weight?.value,
        top_width: v.top_width?.value || v.custom_top_width?.value,
        top_height: v.top_height?.value || v.custom_top_height?.value,
        diamonds,
        gemstones,
        components: v.components?.value,
        variant_config: v.variant_config?.value,
        in_store_available: in_store_available
      }
    };
  });

  const media = product.media.edges.map(({ node: m }) => {
    if (m.mediaContentType === "IMAGE") {
      return {
        type: "IMAGE",
        url: m.image.url,
        alt: m.image.altText || ""
      };
    } else if (m.mediaContentType === "VIDEO") {
      return {
        type: "VIDEO",
        url: m.sources?.[0]?.url,
        mimeType: m.sources?.[0]?.mimeType,
        preview: product.featuredImage?.url,
        sources: m.sources,
        alt: m.alt || product.title
      };
    } else if (m.mediaContentType === "EXTERNAL_VIDEO") {
        return {
          type: "EXTERNAL_VIDEO",
          url: m.embedUrl,
          host: m.host,
          preview: product.featuredImage?.url,
          alt: m.alt || product.title
        };
    }
    return null;
  }).filter(Boolean);

  const images = product.images.edges.map(({ node: img }) => ({
    url: img.url,
    alt: img.altText || ""
  }));

  // Strip heavy unused fields to save Vercel bandwidth
  delete product.descriptionHtml;
  delete product.seo;

  return {
    ...product,
    id: product.id.split("/").pop(),
    shopifyId: product.id,
    type: product.productType, // Alias for component compatibility
    description: product.descriptionHtml || product.description,
    image: product.featuredImage?.url,
    images,
    media,
    variants: mappedVariants,
    collectionHandles: product.collectionHandles?.edges?.map(e => e.node.handle) || [],
    productMetafields,
    category: product.category?.value || product.productType,
    complementaryProductIds: [],
    matchingProductIds: [],
    hasSimilar: true
  };
}

export default async function ProductPage({ params }) {
  const { handle } = await params;
  const rawProduct = await getProduct(handle);

  if (!rawProduct) {
    notFound();
  }

  const jsonLd = getProductSchema(rawProduct);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    ...(rawProduct.category ? [{ name: rawProduct.category, url: `/collections/${rawProduct.category.toLowerCase().replace(/\s+/g, '-')}` }] : []),
    { name: rawProduct.title, url: `/products/${rawProduct.handle}` }
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProductPageClient 
        product={rawProduct} 
      />
    </>
  );
}
