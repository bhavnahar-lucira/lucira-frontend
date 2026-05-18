import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";

const CACHE_TTL = 10 * 60 * 1000;
const cache = new Map();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return NextResponse.json({ filters: {} });
    }

    const cacheKey = `filters:${handle}`;
    const cached = cache.get(cacheKey);
    if (
      cached &&
      Date.now() < cached.expiry
    ) {
      return NextResponse.json(cached.data);
    }

    const query = `
      query CollectionFilters($handle: String!) {
        collectionByHandle(handle: $handle) {
          products(first: 1) {
            filters {
              id
              label
              type
              values {
                id
                label
                count
                input
              }
            }
          }
        }
      }
    `;

    const data = await shopifyStorefrontFetch(query, { handle });
    const rawFilters = data?.collectionByHandle?.products?.filters || [];

    const filters = {};

    rawFilters.forEach((f) => {
      if (f.type === "PRICE_RANGE") return;

      const values = f.values
        .filter((v) => v.count > 0)
        .map((v) => ({
          label: v.label,
          count: v.count,
          input: v.input,
        }));

      if (values.length) {
        const key = f.label || f.id;
        filters[key] = values;
      }
    });

    const result = { filters };
    cache.set(cacheKey, {
      data: result,
      expiry: Date.now() + CACHE_TTL,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Collection Filters Error:", err);
    return NextResponse.json({ filters: {} });
  }
}
