import { NextResponse } from "next/server";
import { fetchNectorReviews } from "@/lib/nector";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 200;

    // Fetch all reviews from Nector (passing null productId)
    const result = await fetchNectorReviews(null, { limit });

    return NextResponse.json({
      success: true,
      items: result.items || [],
      count: result.count || 0,
      average: result.average || 0,
      stats: result.stats || []
    });
  } catch (error) {
    console.error("Fetch global reviews error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
