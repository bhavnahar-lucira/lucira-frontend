import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8080/api/settings/gold-coin", {
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
