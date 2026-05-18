import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const query = searchParams.get("q") || "";

    const client = await clientPromise;
    const db = client.db();

    const filter = query
      ? {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { handle: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const total = await db.collection("collections").countDocuments(filter);
    const collections = await db
      .collection("collections")
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      collections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch collection list:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
