import { NextResponse } from "next/server";
import { fetchNectorReviews } from "@/lib/nector";

export async function GET() {
  try {
    const nectorData = await fetchNectorReviews();
    
    // fetchNectorReviews returns a 'reviews' object with 'list' or 'items'
    // Actually looking at nector.js, it returns 'reviews' which has 'items' mapped to 'list'
    const reviews = nectorData.items || nectorData.list || [];

    const mappedReviews = reviews.map((r) => ({
      id: r.id,
      personName: r.name || "Verified Buyer",
      verified: r.is_verified || true,
      personImage: r.images?.[0] || "/images/review/1.jpg",
      review: r.text || "",
      productTitle: r.reference_product_name || "",
      productImage: r.reference_product_image || "/images/product/1.jpg",
      productHandle: r.reference_product_handle || "",
      rating: r.rating || 5,
      date: r.date,
      title: r.title || ""
    }));

    // Filter to prioritize reviews with images, then shuffle
    const withImages = mappedReviews.filter(r => r.personImage && !r.personImage.includes("images/review/1.jpg"));
    const withoutImages = mappedReviews.filter(r => !r.personImage || r.personImage.includes("images/review/1.jpg"));
    
    const final = [...withImages, ...withoutImages].slice(0, 15);

    return NextResponse.json({ reviews: final }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Home Reviews API Error:", error);
    return NextResponse.json({ reviews: [] });
  }
}
