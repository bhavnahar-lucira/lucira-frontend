import { NextResponse } from "next/server";
import crypto from "crypto";

const SHOP = "luciraonline";

function formatMobile(raw) {
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.length === 10) return "91" + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91"))
    return cleaned;
  return "91" + cleaned.slice(-10);
}

export async function POST(req) {
  try {
    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Missing data" },
        { status: 400 }
      );
    }

    const formattedMobile = formatMobile(mobile);

    /* ===== VERIFY OTP (MSG91) ===== */

    const verifyRes = await fetch(
      `https://control.msg91.com/api/v5/otp/verify?mobile=${formattedMobile}&otp=${otp}`,
      {
        method: "GET",
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );

    const otpData = await verifyRes.json();   

    if (!verifyRes.ok || otpData.type !== "success") {
      return NextResponse.json(
        { error: otpData.message || "Invalid OTP" },
        { status: 400 }
      );
    }

    /* ===== SEARCH CUSTOMER ===== */

    const searchQuery = encodeURIComponent(`phone:+${formattedMobile}`);
  

    const searchRes = await fetch(
      `https://${SHOP}.myshopify.com/admin/api/2024-10/customers/search.json?query=${searchQuery}`,
      {
        headers: {
          "X-Shopify-Access-Token":
            process.env.ADMIN_TOKEN,
        },
      }
    );

    const searchData = await searchRes.json();
    const customer = searchData.customers?.[0];
    console.log(searchData)
    console.log(customer)

    if (!customer) {
      return NextResponse.json({
        status: "REGISTER_REQUIRED",
      });
    }

    /* ===== UPDATE PASSWORD ===== */

    const newPassword = crypto.randomBytes(16).toString("hex");

    await fetch(
      `https://${SHOP}.myshopify.com/admin/api/2024-10/customers/${customer.id}.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token":
            process.env.ADMIN_TOKEN,
        },
        body: JSON.stringify({
          customer: {
            id: customer.id,
            password: newPassword,
            password_confirmation: newPassword,
          },
        }),
      }
    );

    /* ===== STOREFRONT LOGIN ===== */

    const loginRes = await fetch(
      `https://${SHOP}.myshopify.com/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token":
            process.env.STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: `
            mutation {
              customerAccessTokenCreate(input: {
                email: "${customer.email}",
                password: "${newPassword}"
              }) {
                customerAccessToken {
                  accessToken
                  expiresAt
                }
              }
            }
          `,
        }),
      }
    );

    const loginData = await loginRes.json();
    const token =
      loginData?.data?.customerAccessTokenCreate
        ?.customerAccessToken;

    // set httpOnly cookie so browser will send it automatically
    if (token?.accessToken) {
      const THIRTY_DAYS = 30 * 24 * 60 * 60;
      const res = NextResponse.json({
        status: "LOGIN",
        user: customer,
        expiresAt: token?.expiresAt, // return for client info only
      });
      res.cookies.set("customerAccessToken", token.accessToken, {
        httpOnly: true,
        path: "/",
        maxAge: THIRTY_DAYS,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return res;
    }

    // fallback if token is missing for some reason
    return NextResponse.json({
      status: "LOGIN",
      user: customer,
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}