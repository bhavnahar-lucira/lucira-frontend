import { shopifyAdminFetch } from "@/lib/shopify";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const query = `
      {
        shop {
          metal_prices: metafield(namespace: "DI-GoldPrice", key: "metal_prices") {
            value
          }
        }
      }
    `;

    const data = await shopifyAdminFetch(query);

    if (!data?.shop?.metal_prices?.value) {
      return NextResponse.json({ error: "Metal prices not found in Shopify" }, { status: 404 });
    }

    const rates = JSON.parse(data.shop.metal_prices.value);

    return NextResponse.json(rates, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Failed to fetch gold rates:", error);
    return NextResponse.json({ error: "Failed to fetch gold rates" }, { status: 500 });
  }
}
