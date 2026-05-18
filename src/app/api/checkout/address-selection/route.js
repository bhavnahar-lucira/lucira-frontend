import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BILLING_MODE_COOKIE = "checkoutBillingMode";
const BILLING_ADDRESS_ID_COOKIE = "checkoutBillingAddressId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function normalizeMode(value) {
  return value === "different" ? "different" : "same";
}

function getSelectionFromCookies(cookieStore) {
  const billingAddressMode = normalizeMode(
    cookieStore.get(BILLING_MODE_COOKIE)?.value || "same"
  );
  const billingAddressId = cookieStore.get(BILLING_ADDRESS_ID_COOKIE)?.value || "";

  return { billingAddressMode, billingAddressId };
}

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json(getSelectionFromCookies(cookieStore), {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate'
    }
  });
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const billingAddressMode = normalizeMode(body?.billingAddressMode);
    const billingAddressId =
      billingAddressMode === "different"
        ? String(body?.billingAddressId || "").trim()
        : "";

    const res = NextResponse.json({
      billingAddressMode,
      billingAddressId,
    });

    res.cookies.set(BILLING_MODE_COOKIE, billingAddressMode, {
      httpOnly: true,
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });

    if (billingAddressId) {
      res.cookies.set(BILLING_ADDRESS_ID_COOKIE, billingAddressId, {
        httpOnly: true,
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
      });
    } else {
      res.cookies.set(BILLING_ADDRESS_ID_COOKIE, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
    }

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to save billing selection" },
      { status: 500 }
    );
  }
}
