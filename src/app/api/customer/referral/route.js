import { NextResponse } from "next/server";
import { shopifyAdminFetch } from "@/lib/shopify";

export async function POST(req) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Missing customerId" },
        { status: 400 }
      );
    }

    const shopifyCustomerId = customerId.toString().startsWith("gid://")
      ? customerId
      : `gid://shopify/Customer/${customerId}`;

    const query = `
      query getCustomerReferral($id: ID!) {
        customer(id: $id) {
          metafield(
            namespace: "nector"
            key: "custom_properties"
          ) {
            value
          }
        }
      }
    `;

    const data = await shopifyAdminFetch(query, { id: shopifyCustomerId });

    const rawJson = data?.customer?.metafield?.value;

    if (!rawJson) {
      return NextResponse.json({ referralLink: "" });
    }

    const parsed = JSON.parse(rawJson);
    const referralLink = parsed.nector_user_referral_link || "";

    return NextResponse.json({ referralLink });

  } catch(error) {
    console.error("Referral API Error:", error);
    return NextResponse.json(
      { error: "Failed fetching referral link" },
      { status: 500 }
    );
  }
}
