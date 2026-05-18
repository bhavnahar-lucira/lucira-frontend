import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const NECTOR_ENDPOINT = "https://refer-earn-385594025448.asia-south1.run.app";

export async function GET() {
  try {
    // Verify the user is authenticated
    const cookieStore = await cookies();
    const token = cookieStore.get("customerAccessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer ID via Shopify Storefront
    const { shopifyStorefrontFetch } = await import("@/lib/shopify");
    const data = await shopifyStorefrontFetch(
      `query($t: String!) { customer(customerAccessToken: $t) { id } }`,
      { t: token }
    );
    const gid = data?.customer?.id;
    if (!gid) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const simpleId = gid.split("/").pop();
    const res = await fetch(
      `${NECTOR_ENDPOINT}?customer_id=shopify-${simpleId}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ coins_balance: 0, status: false });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e) {
    console.error("Nector proxy error:", e);
    return NextResponse.json({ coins_balance: 0, status: false });
  }
}
