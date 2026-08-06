import { NextResponse } from "next/server";
import { shopifyAdminFetch } from "@/lib/shopify";
import { resolveCustomerGid } from "@/lib/customerResolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-side source of truth for the reward. The client only sends the prize
// key it landed on, never the string that gets written to the customer record.
// Mirrors the wheel labels in OtpSpinAuth's SPIN_PRIZES.
const PRIZE_LABELS = {
  "750_off": "₹750 OFF",
  "1000_off": "₹1,000 OFF",
  "1500_off": "₹1,500 OFF",
};

const METAFIELD_NAMESPACE = "custom";
const METAFIELD_KEY = "win_prize_spin_the_sheel";

const METAFIELDS_SET_MUTATION = `
  mutation SetSpinPrize($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const noCache = { next: { revalidate: 0 } };

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customerId, email, mobile, prize } = body;

    if (!prize) {
      return NextResponse.json({ ok: false, error: "prize is required" }, { status: 400 });
    }

    const prizeLabel = PRIZE_LABELS[prize];
    if (!prizeLabel) {
      console.warn("[spin-prize] No label mapped for prize:", prize);
      return NextResponse.json({ ok: false, error: "Unknown prize" }, { status: 400 });
    }

    const ownerId = await resolveCustomerGid({ customerId, email, mobile });
    if (!ownerId) {
      console.warn("[spin-prize] Could not resolve a Shopify customer", { customerId, email, mobile });
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    const data = await shopifyAdminFetch(
      METAFIELDS_SET_MUTATION,
      {
        metafields: [
          {
            ownerId,
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY,
            type: "single_line_text_field",
            value: prizeLabel,
          },
        ],
      },
      noCache
    );

    const userErrors = data?.metafieldsSet?.userErrors || [];
    if (userErrors.length > 0) {
      console.error("[spin-prize] metafieldsSet errors:", userErrors);
      return NextResponse.json(
        { ok: false, error: userErrors[0].message },
        { status: 422 }
      );
    }

    return NextResponse.json({ ok: true, prizeLabel, customerId: ownerId });
  } catch (err) {
    console.error("[spin-prize] Failed to store prize metafield:", err);
    return NextResponse.json({ ok: false, error: "Failed to store prize" }, { status: 500 });
  }
}
