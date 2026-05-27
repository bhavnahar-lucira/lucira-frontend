import { notFound } from "next/navigation";
import ProductPageClient from "@/components/product/ProductPageClient";
import { getProductSchema, getBreadcrumbSchema } from "@/lib/seo";
import { shopifyStorefrontFetch, getAllProductHandles } from "@/lib/shopify";

export const revalidate = 86400; // 6 hours

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
  const handles = await getAllProductHandles();
  return handles.map((handle) => ({
    handle,
  }));
}

async function getProduct(handle) {
  const data = await shopifyStorefrontFetch(PRODUCT_QUERY, { handle }, { next: { revalidate: 86400 } });
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

    let metal_purity = metalComp?.karat_code ? `${metalComp.karat_code}K` : (v.custom_metal_purity?.value || variantConfig?.purity || getOpt(options, ["metal purity", "purity"]));
    let metal_color = metalComp?.stone_color_code && metalComp.stone_color_code !== "NA" ? metalComp.stone_color_code : (v.custom_metal_color?.value || getOpt(options, ["metal color", "material color"]));
    
    if (!metal_color) {
      if (v.title.toLowerCase().includes('rose')) metal_color = 'Rose Gold';
      else if (v.title.toLowerCase().includes('white')) metal_color = 'White Gold';
      else if (v.title.toLowerCase().includes('yellow')) metal_color = 'Yellow Gold';
      else if (v.title.toLowerCase().includes('platinum')) metal_color = 'Platinum';
    }

    let diamonds = diamondComps.map(d => ({
      quality: d.quality_code && d.quality_code !== "NA" ? d.quality_code : (d.purity || "VVS-VS, EF"),
      shape: d.shape_code,
      pieces: d.pieces,
      weight: d.weight
    }));

    // Fallback B: Individual custom diamond fields
    if (diamonds.length === 0) {
      [1, 2].forEach(i => {
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

    // Fallback D: variant_config.advanced_stone_config
    if (diamonds.length === 0 && variantConfig?.advanced_stone_config) {
        diamonds = variantConfig.advanced_stone_config.filter(s => s.stone_type === 'diamond').map(s => ({
            quality: s.pricing_id,
            shape: s.shape_code || "RD",
            pieces: s.stone_quantity,
            weight: s.stone_weight
        }));
    }

    let gemstones = gemstoneComps.map(g => ({
      color: g.stone_color_code,
      shape: g.shape_code,
      pieces: g.pieces,
      weight: g.weight
    }));

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
        variant_config: v.variant_config?.value
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
