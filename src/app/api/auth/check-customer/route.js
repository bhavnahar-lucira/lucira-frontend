import { NextResponse } from "next/server";

const SHOP = "luciraonline";

function formatMobile(raw) {
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.length === 10) return "91" + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned;
  return "91" + cleaned.slice(-10);
}

export async function POST(req) {
  try {
    const { email, mobile } = await req.json();

    if (!email && !mobile) {
      return NextResponse.json(
        { error: "Email or mobile required" },
        { status: 400 }
      );
    }

    let searchQuery = "";
    if (mobile) {
      const formattedMobile = formatMobile(mobile);
      searchQuery += `phone:+${formattedMobile} `;
    }
    if (email) {
      searchQuery += `email:${email}`;
    }

    const searchRes = await fetch(
      `https://${SHOP}.myshopify.com/admin/api/2024-10/customers/search.json?query=${encodeURIComponent(searchQuery.trim())}`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.ADMIN_TOKEN,
        },
      }
    );

    if (!searchRes.ok) {
      return NextResponse.json(
        { error: "Failed to check customer" },
        { status: searchRes.status }
      );
    }

    const searchData = await searchRes.json();
    const exists = searchData.customers && searchData.customers.length > 0;

    return NextResponse.json({ exists });
  } catch (err) {
    console.error("CHECK CUSTOMER ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
