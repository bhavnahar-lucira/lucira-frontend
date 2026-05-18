import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customer_id");

    if (!customerId) {
      return NextResponse.json({ error: "Missing customer_id" }, { status: 400 });
    }

    const endpoint = `https://refer-earn-385594025448.asia-south1.run.app?customer_id=${encodeURIComponent(customerId)}`;
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Nector API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Nector Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral history" },
      { status: 500 }
    );
  }
}
