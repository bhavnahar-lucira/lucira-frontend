import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { shopifyStorefrontFetch, shopifyAdminFetch } from "@/lib/shopify";
import clientPromise from "@/lib/mongodb";

async function getCustomerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("customerAccessToken")?.value || "";
}

async function getCustomerId(customerAccessToken) {
  const data = await shopifyStorefrontFetch(
    `query($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) { id }
    }`,
    { customerAccessToken }
  );
  return data?.customer?.id;
}

const NECTOR_ENDPOINT = "https://refer-earn-385594025448.asia-south1.run.app";

async function fetchNectorCoins(simpleId) {
  try {
    const res = await fetch(
      `${NECTOR_ENDPOINT}?customer_id=shopify-${simpleId}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status) {
      return {
        points        : (data.coins_balance ?? 0).toString(),
        tier          : data.tier_name || "Member",
        nextTierPoints: (data.next_tier_points ?? 0).toString(),
        progress      : data.tier_progress ?? 0,
      };
    }
  } catch (e) {
    console.warn("Nector live fetch failed:", e.message);
  }
  return null;
}

export async function GET() {
  try {
    const customerAccessToken = await getCustomerAccessToken();
    if (!customerAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = await getCustomerId(customerAccessToken);
    if (!customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    const simpleId = customerId.split("/").pop();

    // Shopify metafield query (fallback)
    const metafieldQuery = `
      query getCustomerMetafields($id: ID!) {
        customer(id: $id) {
          metafield(namespace: "nector", key: "custom_properties") { value }
        }
      }
    `;

    // Run all three in parallel
    const [nectorLive, metafieldData, wishlistClient] = await Promise.all([
      fetchNectorCoins(simpleId),
      shopifyAdminFetch(metafieldQuery, { id: customerId }),
      clientPromise,
    ]);

    // Defaults (Shopify metafield)
    let points         = "0";
    let tier           = "Member";
    let nextTierPoints = "0";
    let progress       = 0;

    try {
      const rawJson = metafieldData?.customer?.metafield?.value;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        points         = parsed.nector_user_points?.toString() || "0";
        tier           = parsed.nector_user_tier_name || "Member";
        nextTierPoints = parsed.nector_user_next_tier_remaining_points?.toString() || "0";
        progress       = 75;
      }
    } catch (_) {}

    // Live Nector data takes priority over metafield snapshot
    if (nectorLive) {
      points         = nectorLive.points;
      tier           = nectorLive.tier;
      nextTierPoints = nectorLive.nextTierPoints;
      progress       = nectorLive.progress;
    }

    // Wishlist count from MongoDB
    const db           = wishlistClient.db();
    const wishlistCount = await db.collection("wishlist").countDocuments({ customerId });

    return NextResponse.json({ points, tier, nextTierPoints, progress, wishlistCount });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
