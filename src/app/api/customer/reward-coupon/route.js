import { NextResponse } from "next/server";
import { shopifyAdminFetch } from "@/lib/shopify";
import { resolveCustomerGid } from "@/lib/customerResolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METAFIELD_NAMESPACE = "custom";
const METAFIELD_KEY = "win_prize_spin_the_sheel";

// The metafield only stores the human-readable label written by
// /api/customer/spin-prize (mirrors that route's PRIZE_LABELS). Map it back to
// the actual coupon code, which also has to match a code in src/lib/coupons.js
// so the frontend can show the right price-range condition.
const LABEL_TO_COUPON_CODE = {
  "₹750 OFF": "GRAND750",
  "₹1,000 OFF": "GRAND1000",
  "₹1,500 OFF": "GRAND1500",
};

const CUSTOMER_METAFIELD_QUERY = `
  query CustomerRewardCoupon($id: ID!) {
    customer(id: $id) {
      metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
        value
      }
    }
  }
`;

const noCache = { next: { revalidate: 0 } };

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customerId, email, mobile } = body;

    const ownerId = await resolveCustomerGid({ customerId, email, mobile });
    if (!ownerId) {
      return NextResponse.json({ ok: true, hasCoupon: false });
    }

    const data = await shopifyAdminFetch(CUSTOMER_METAFIELD_QUERY, { id: ownerId }, noCache);
    const label = data?.customer?.metafield?.value || null;
    const code = label ? LABEL_TO_COUPON_CODE[label] : null;

    if (!code) {
      return NextResponse.json({ ok: true, hasCoupon: false });
    }

    return NextResponse.json({ ok: true, hasCoupon: true, code, label });
  } catch (err) {
    console.error("[reward-coupon] Failed to fetch reward coupon:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch reward coupon" }, { status: 500 });
  }
}
