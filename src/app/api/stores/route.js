import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8080";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/stores`, {
        next: { revalidate: 3600 } // Cache for 1 hour
    });
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Stores proxy error:", error);
    return NextResponse.json({ stores: [] });
  }
}
