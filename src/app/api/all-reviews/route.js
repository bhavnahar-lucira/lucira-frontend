import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("shopify-app");

    const [reviews, total, stats] = await Promise.all([
      db.collection("all_reviews")
        .find({ isVisible: true })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("all_reviews").countDocuments({ isVisible: true }),
      db.collection("all_reviews").aggregate([
        { $match: { isVisible: true } },
        { $group: { _id: "$rating", count: { $sum: 1 } } }
      ]).toArray()
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stats.forEach(s => { breakdown[s._id] = s.count; });

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        average: total > 0 ? (stats.reduce((a, b) => a + (b._id * b.count), 0) / total).toFixed(1) : 0,
        count: total,
        breakdown
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("All Reviews API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
