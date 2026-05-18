import { NextResponse } from "next/server";
import { shopifyStorefrontFetch } from "@/lib/shopify";

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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle") || "all";
    const query = searchParams.get("q") || "";
    const filtersRaw = searchParams.get("filters");

    const activeFilters = parseFilters(filtersRaw);

    const COLLECTION_QUERY = `
      query GetCollectionFilters($handle: String!, $filters: [ProductFilter!]) {
        collectionByHandle(handle: $handle) {
          products(first: 250, filters: $filters) {
            filters {
              label
              type
              values {
                label
                count
                input
              }
            }
          }
        }
      }
    `;

    const SEARCH_FILTERS_QUERY = `
      query GetSearchFilters($query: String!, $filters: [ProductFilter!]) {
        search(first: 250, query: $query, productFilters: $filters, types: [PRODUCT]) {
          productFilters {
            label
            type
            values {
              label
              count
              input
            }
          }
        }
      }
    `;

    // Extract dynamic filters from searchParams
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

    let storefrontData;
    let filtersData;

    if (query) {
        storefrontData = await shopifyStorefrontFetch(SEARCH_FILTERS_QUERY, { query, filters: finalFilters });
        filtersData = storefrontData?.search?.productFilters;
    } else if (handle !== "all") {
        storefrontData = await shopifyStorefrontFetch(COLLECTION_QUERY, { handle, filters: finalFilters });
        filtersData = storefrontData?.collectionByHandle?.products?.filters;
    } else {
        // Fallback for "all" products: try search with empty query or specific collection
        storefrontData = await shopifyStorefrontFetch(SEARCH_FILTERS_QUERY, { query: "", filters: finalFilters });
        filtersData = storefrontData?.search?.productFilters;
        
        if (!filtersData) {
            storefrontData = await shopifyStorefrontFetch(COLLECTION_QUERY, { handle: "all", filters: finalFilters });
            filtersData = storefrontData?.collectionByHandle?.products?.filters;
        }
    }

    if (!filtersData) {
      return NextResponse.json({});
    }

    const results = {};
    filtersData.forEach((f) => {
      if (f.type === "PRICE_RANGE") {
        results["Price"] = { 
            min: 0, 
            max: Math.max(...f.values.map(v => {
                try { return JSON.parse(v.input).price.max || 1000000; } catch(e) { return 1000000; }
            }))
        }; 
        return;
      }
      results[f.label] = f.values.map((v) => ({
        label: v.label,
        value: v.label,
        count: v.count,
        input: v.input,
        urlKey: f.label 
      }));
    });

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("❌ Filters API error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
