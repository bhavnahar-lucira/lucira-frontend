import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "All";

    const client = await clientPromise;
    const db = client.db("shopify-app");
    const productsCollection = db.collection("products");

    // 1. Build Base Gemstone Query - MUST be a gemstone product and NOT a diamond product
    const baseGemstoneQuery = {
      $and: [
        {
          $or: [
            { "variants.metafields.gemstones": { $exists: true, $not: { $size: 0 } } },
            { type: { $regex: /^gemstone$/i } },
            { tags: { $regex: /^gemstone$/i } }
          ]
        },
        {
          "variants.metafields.diamond_1_shape": { $exists: false }
        }
      ]
    };

    let query = {};

    if (tab === "All") {
      query = baseGemstoneQuery;
    } else {
      const categoryTerm = tab.toLowerCase().replace(/s$/, ""); // Rings -> ring

      let categoryMatch;
      if (categoryTerm === "pendant") {
        categoryMatch = { $or: [
          { type: { $regex: /pendant|charm/i } },
          { tags: { $regex: /pendant|charm/i } }
        ]};
      } else {
        const regex = new RegExp("^" + categoryTerm + "s?$", "i");
        categoryMatch = { $or: [
          { type: { $regex: regex } },
          { tags: { $regex: regex } }
        ]};
      }

      // MUST be a gemstone AND match the category
      query = {
        $and: [
          baseGemstoneQuery,
          categoryMatch
        ]
      };
    }


    // 2. Fetch from MongoDB
    let products = await productsCollection
      .find(query)
      .limit(10) // User requested max 10
      .toArray();

    return NextResponse.json({ 
      products: products.map(p => ({
        ...p,
        reviews: p.reviews || (p.reviewStats?.usedFallback ? null : p.reviewStats) || null
      }))
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });

  } catch (error) {
    console.error("Gemstones API Error:", error);
    return NextResponse.json({ error: "Failed to fetch gemstone products", message: error.message }, { status: 500 });
  }
}
