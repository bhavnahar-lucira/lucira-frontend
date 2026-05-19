import { NextResponse } from "next/server";
import { shopifyAdminFetch } from "@/lib/shopify";
import { calculatePriceBreakup } from "@/lib/priceEngine";
import { getServerCache } from "@/lib/serverCache";

const formatPrice = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("en-IN").format(Math.round(num));
};

const VARIANT_PRICING_CACHE_TTL = 60 * 60 * 1000;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const variantId = searchParams.get("variantId");
  const productId = searchParams.get("productId");

  if (!variantId) {
    return NextResponse.json({ error: "variantId required" }, { status: 400 });
  }

  try {
    const gid = variantId.includes("ProductVariant") 
      ? variantId 
      : `gid://shopify/ProductVariant/${variantId}`;

    const query = `
      query ($id: ID!) {
        node(id: $id) {
          ... on ProductVariant {
            id
            title
            sku
            metafield(namespace: "DI-GoldPrice", key: "variant_config") {
              value
            }
          }
        }
        shop {
          metalPrices: metafield(namespace: "DI-GoldPrice", key: "metal_prices") {
            value
          }
          stonePricing: metafield(namespace: "DI-GoldPrice", key: "stone_pricing") {
            value
          }
        }
      }
    `;
    
    const data = await getServerCache(
      `variant-pricing:${gid}`,
      () => shopifyAdminFetch(query, { id: gid }, { next: { revalidate: 3600 } }),
      { ttlMs: VARIANT_PRICING_CACHE_TTL, maxEntries: 5000 }
    );

    if (!data.node?.metafield?.value) {
      return NextResponse.json({ error: "Variant config not found" }, { status: 404 });
    }

    const config = JSON.parse(data.node.metafield.value);
    const metalRates = JSON.parse(data.shop.metalPrices.value);
    const stonePricingDB = JSON.parse(data.shop.stonePricing.value);

    const breakup = calculatePriceBreakup(
      config,
      metalRates,
      stonePricingDB
    );

    // Determine metal color from variant title
    let metalColor = 'Yellow';
    const title = (data.node.title || "").toLowerCase();
    if (title.includes('rose')) metalColor = 'Rose';
    else if (title.includes('white')) metalColor = 'White';
    else if (title.includes('platinum')) metalColor = 'Platinum';

    // --- Dynamic Mined Diamond Comparison Logic ---
    let minedDiamondTotal = 0;
    if (config.advanced_stone_config && Array.isArray(config.advanced_stone_config)) {
      config.advanced_stone_config.forEach(stone => {
        if (stone.stone_type === 'diamond' && stone.stone_quantity > 0) {
          const avgWeight = stone.stone_weight / stone.stone_quantity;
          let minedRate = 0;
          if (avgWeight <= 0.109) minedRate = 86800;
          else if (avgWeight <= 0.249) minedRate = 97020;
          else if (avgWeight <= 0.499) minedRate = 114917;
          else if (avgWeight <= 0.749) minedRate = 74266;
          else if (avgWeight <= 0.999) minedRate = 89373;
          else if (avgWeight <= 1.499) minedRate = 126906;
          else if (avgWeight <= 1.999) minedRate = 179840;
          else if (avgWeight <= 2.999) minedRate = 301515;
          else minedRate = 395589;
          minedDiamondTotal += (minedRate * stone.stone_weight);
        }
      });
    }

    // --- Original Totals for Savings Calculation (Match Live) ---
    const originalSubtotal = (breakup.metal.cost || 0) + 
                             (breakup.diamond.original || 0) + 
                             (breakup.gemstone.original || 0) + 
                             (breakup.making_charges.original || 0);
    
    const taxPercent = metalRates.default_tax || 3;
    const originalGst = Math.round((originalSubtotal * taxPercent) / 100);
    const originalGrandTotal = originalSubtotal + originalGst;
    
    const finalGrandTotal = breakup.total || 0;
    const totalSavingsAmt = originalGrandTotal - finalGrandTotal;

    const luciraDiamondPrice = breakup.diamond.final || 0;
    const hasDiamonds = (breakup.diamond.pcs || 0) > 0 || (breakup.diamond.carat || 0) > 0;
    const comparisonSavings = minedDiamondTotal - luciraDiamondPrice;

    // --- Construct UI Data ---
    const priceRows = [
      { 
        label: `${breakup.metal.purity || ''} ${metalColor} ${breakup.metal.metal_type || 'Gold'} (₹${formatPrice(breakup.metal.rate_per_gram)}/g)`, 
        value: `₹${formatPrice(breakup.metal.cost || 0)}` 
      }
    ];

    if (hasDiamonds) {
      priceRows.push({ 
        label: `${breakup.diamond.color || 'E-F'}, ${breakup.diamond.clarity || 'VVS/VS'} (${breakup.diamond.pcs || 0} Pcs.)`, 
        value: `₹${formatPrice(breakup.diamond.final || 0)}`,
        oldValue: breakup.diamond.original > breakup.diamond.final ? `₹${formatPrice(breakup.diamond.original)}` : null,
        discount: breakup.diamond.discount_percent > 0 ? `${breakup.diamond.discount_percent}% OFF` : null
      });
    }

    if (breakup.gemstone.final > 0) {
      priceRows.push({
        label: `Gemstone Charges (${breakup.gemstone.pcs || 0} Pcs)`, 
        value: `₹${formatPrice(breakup.gemstone.final || 0)}`,
        oldValue: breakup.gemstone.original > breakup.gemstone.final ? `₹${formatPrice(breakup.gemstone.original)}` : null,
        discount: breakup.gemstone.discount_percent > 0 ? `${breakup.gemstone.discount_percent}% OFF` : null
      });
    }

    priceRows.push(
      { 
        label: `Making Charges`, 
        value: `₹${formatPrice(breakup.making_charges.final || 0)}`,
        oldValue: breakup.making_charges.original > breakup.making_charges.final ? `₹${formatPrice(breakup.making_charges.original)}` : null,
        discount: breakup.making_charges.discount_percent > 0 ? `${breakup.making_charges.discount_percent}% OFF` : null
      },
      { 
        label: `GST (${taxPercent}%)`, 
        value: `₹${formatPrice(breakup.gst.amount || 0)}`,
        oldValue: originalGst > (breakup.gst.amount || 0) ? `₹${formatPrice(originalGst)}` : null
      }
    );

    const uiPriceBreakup = {
      price: priceRows,
      savings: [
        { label: "Diamond Discount", value: `₹${formatPrice(breakup.diamond.original - breakup.diamond.final)}` },
        { label: "Making Charge Discount", value: `₹${formatPrice(breakup.making_charges.original - breakup.making_charges.final)}` },
        { label: "Tax Savings", value: `₹${formatPrice(originalGst - (breakup.gst.amount || 0))}` }
      ],
      // Hide savings if total is less than 10 (handles rounding issues/gold jewelry small diffs)
      total_savings: totalSavingsAmt >= 10 ? `₹${formatPrice(totalSavingsAmt)}` : null,
      grand_total: `₹${formatPrice(finalGrandTotal)}`,
      comparison: hasDiamonds ? {
        carat: `${breakup.diamond.carat || 0} CT`,
        clarity: { lucira: breakup.diamond.clarity?.split(',')[0] || "VVS", mined: "SI" },
        color: { lucira: breakup.diamond.color?.split(',')[0] || "EF", mined: "IJ" },
        price: { 
          lucira: `₹${formatPrice(luciraDiamondPrice)}`, 
          mined: `₹${formatPrice(minedDiamondTotal)}` 
        },
        savings: `₹${formatPrice(comparisonSavings)}`
      } : null
    };

    return NextResponse.json({
      variantId,
      sku: data.node.sku,
      selectedVariant: data.node.title,
      price: finalGrandTotal,
      price_breakup: uiPriceBreakup,
      diamond_info: breakup.diamond,
      raw_breakup: {
        ...breakup,
        original_total: originalGrandTotal,
        total_savings: totalSavingsAmt
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });

  } catch (err) {
    console.error("❌ Pricing API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
