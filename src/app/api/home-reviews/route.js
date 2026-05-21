import { NextResponse } from "next/server";
import { fetchNectorReviews } from "@/lib/nector";

export const revalidate = 86400;

// Shared memory cache
let cachedReviews = null;
let lastFetchTime = 0;

const CACHE_DURATION = 1000 * 60 * 60 * 24;

export async function GET() {
  try {
    // Memory cache first
    const now = Date.now();

    if (
      cachedReviews &&
      now - lastFetchTime < CACHE_DURATION
    ) {
      return NextResponse.json(
        { reviews: cachedReviews },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=14400, stale-while-revalidate=86400",
          },
        }
      );
    }

    // Fetch from Nector
    const nectorData = await fetchNectorReviews();

    const reviews =
      nectorData.items ||
      nectorData.list ||
      [];

    const mappedReviews = reviews.map((r) => ({
      // IMPORTANT
      // Preserve original fields for popup compatibility
      ...r,
      id: r.id,
      personName: r.name || "Verified Buyer",
      verified: r.is_verified === true || r.verified === true,
      personImage: r.images?.[0] || r.reference_product_image || "/images/review/1.jpg",
      review: r.text || r.description || r.body || "",
      productTitle: r.reference_product_name || "",
      productImage: r.reference_product_image || "/images/product/1.jpg",
      productHandle: r.reference_product_handle || "",
      rating: Number(r.rating || 5),
      date: r.date || r.posted_at || r.created_at,
      title: r.title || "",
    }));

    // Prioritize reviews with images
    const withImages = mappedReviews.filter(
      (r) =>
        r.personImage &&
        !r.personImage.includes(
          "images/review/1.jpg"
        )
    );

    const withoutImages = mappedReviews.filter(
      (r) =>
        !r.personImage ||
        r.personImage.includes(
          "images/review/1.jpg"
        )
    );

    const final = [
      ...withImages,
      ...withoutImages,
    ].slice(0, 10);

    // Update memory cache
    cachedReviews = final;
    lastFetchTime = now;

    return NextResponse.json(
      { reviews: final },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=14400, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error(
      "Home Reviews API Error:",
      error
    );

    return NextResponse.json(
      { reviews: cachedReviews || [] },
      {
        status: 200,
      }
    );
  }
}