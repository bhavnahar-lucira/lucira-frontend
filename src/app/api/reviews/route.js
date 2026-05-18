import { fetchNectorReviews } from "@/lib/nector";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    const reviews = await fetchNectorReviews(productId);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const apiKey = process.env.NECTOR_API_KEY;
    const workspaceId = process.env.NECTOR_WORKSPACE_ID;

    if (!apiKey || !workspaceId) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Case 1: Image Upload
    if (action === "upload") {
      const formData = await request.formData();
      const nectorRes = await fetch(`https://api.nector.io/v1/merchant/uploads`, {
        method: "POST",
        headers: { "x-apikey": apiKey, "x-workspaceid": workspaceId },
        body: formData,
      });
      const json = await nectorRes.json();
      return NextResponse.json(json, { status: nectorRes.status });
    }

    // Case 2: Review Submission
    const body = await request.json();
    
    // Safety: If ID is "all", Nector will reject. Use a fallback if needed or let it fail gracefully with a better error
    console.log(`[NectorProxy] Submitting review for: ${body.reference_product_id}`);

    const nectorRes = await fetch(`https://api.nector.io/v1/merchant/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-apikey": apiKey,
        "x-workspaceid": workspaceId,
      },
      body: JSON.stringify(body),
    });
    
    // Check if the body was empty or response was not JSON
    const text = await nectorRes.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        console.error("Nector sent non-JSON response:", text);
        return NextResponse.json({ error: "Invalid response from Nector", details: text }, { status: nectorRes.status });
    }

    if (!nectorRes.ok) {
      console.error("Nector Submission Rejected:", json);
      return NextResponse.json(json, { status: nectorRes.status });
    }

    return NextResponse.json(json);

  } catch (error) {
    console.error("Reviews POST Proxy Error:", error.message);
    // If it's a "fetch failed", it might be a temporary network issue on the VPS
    return NextResponse.json({ error: "Network Error", message: "The server could not reach Nector. Please try again." }, { status: 502 });
  }
}
