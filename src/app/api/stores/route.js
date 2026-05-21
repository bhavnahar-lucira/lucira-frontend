import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://webuat.lucirajewelry.com";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/stores`, {
        next: { revalidate: 3600 } // Cache for 1 hour
    });
    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("❌ Stores proxy error:", error);
    return NextResponse.json({ stores: [] });
  }
}
