import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 });
    }

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
          images(first: 20) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                availableForSale
                price { amount }
                compareAtPrice { amount }
                selectedOptions { name value }
                image { url }
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
        }
      }
    `;

    const data = await shopifyStorefrontFetch(PRODUCT_QUERY, { handle }, { next: { revalidate: 3600 } });
    const productData = data?.product;

    if (!productData) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clean up product metafields into a flat object
    const productMetafields = {};
    productData.productMetafields?.forEach(m => {
      if (m) productMetafields[m.key] = m.value;
    });

    // Clean up variants and their metafields
    const variants = productData.variants?.edges?.map(edge => {
      const v = edge.node;
      const comps = v.components?.value ? JSON.parse(v.components.value) : null;
      const variantConfig = v.variant_config?.value ? JSON.parse(v.variant_config.value) : null;
      
      const metalComp = comps?.components?.find(c => c.item_group_name === "Gold");
      const diamondComps = comps?.components?.filter(c => c.item_group_name === "Diamond") || [];
      const gemstoneComps = comps?.components?.filter(c => c.item_group_name === "Gemstone" || c.item_group_name === "Color Stone") || [];

      // Map color and karat from components if possible
      let metal_purity = metalComp?.karat_code ? `${metalComp.karat_code}K` : (v.custom_metal_purity?.value || variantConfig?.purity || v.selectedOptions?.find(o => o.name.toLowerCase() === 'purity' || o.name.toLowerCase() === 'metal purity')?.value || null);
      let metal_color = metalComp?.stone_color_code && metalComp.stone_color_code !== "NA" ? metalComp.stone_color_code : (v.custom_metal_color?.value || v.selectedOptions?.find(o => o.name.toLowerCase() === 'metal' || o.name.toLowerCase() === 'color' || o.name.toLowerCase() === 'metal color')?.value || null);
      
      // Fallback for metal color from variant title
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
        id: v.id,
        shopifyId: v.id,
        title: v.title,
        sku: v.sku,
        inStock: v.availableForSale,
        price: parseFloat(v.price?.amount || 0),
        compare_price: parseFloat(v.compareAtPrice?.amount || 0),
        image: v.image?.url,
        size: v.selectedOptions?.find(o => o.name.toLowerCase() === 'size')?.value,
        color: v.selectedOptions?.find(o => o.name.toLowerCase() === 'color' || o.name.toLowerCase() === 'metal')?.value || v.title,
        metafields: {
          metal_purity: metal_purity,
          metal_color: metal_color,
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
    }) || [];

    const product = {
      ...productData,
      shopifyId: productData.id,
      productMetafields,
      variants,
      images: productData.images?.edges?.map(e => ({ url: e.node.url, altText: e.node.altText })) || []
    };

    return NextResponse.json({ product }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Product Details Error:", error);
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
  }
}
