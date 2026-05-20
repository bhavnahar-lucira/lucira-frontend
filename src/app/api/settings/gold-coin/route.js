import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://webuat.lucirajewelry.com";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/settings/gold-coin`, {
      next: { revalidate: 3600 }
    });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Error fetching gold coin setting from Fastify:", error);
    return NextResponse.json({ enabled: false, threshold: 20000 });
  }
}
