import { NextResponse } from "next/server";

const ORN_TOKEN_URL = "https://lucira.live.ornaverse.in/connect/token";
const ORN_LIST_URL = "https://lucira.live.ornaverse.in/Services/POS/SchemeEnrollment/List";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "api_access",
    scope: "openid offline_access",
    username: process.env.ORN_USERNAME,
    password: process.env.ORN_PASSWORD,
  });

  const res = await fetch(ORN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ORN token error (${res.status}): ${txt}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export async function POST(req) {
  try {
    const { mobile } = await req.json();

    if (!mobile || mobile.length < 10) {
      return NextResponse.json({ error: "Invalid mobile number" }, { status: 400 });
    }

    const token = await getToken();

    const res = await fetch(ORN_LIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mobile }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`ORN list error (${res.status}): ${txt}`);
    }

    const data = await res.json();
    return NextResponse.json({ schemes: data.Entities || [] });
  } catch (err) {
    console.error("Schemes API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}