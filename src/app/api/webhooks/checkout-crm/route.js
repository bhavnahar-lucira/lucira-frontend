import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    let targetUrl = "";
    if (type === "begin_checkout") {
      targetUrl = "https://checkout-crm-webhook-385594025448.us-central1.run.app/webhookb6n1p8s2z3";
    } else if (type === "add_payment_info") {
      targetUrl = "https://payment-info-webhook-385594025448.asia-south1.run.app/webhookb7n1p132p4";
    } else {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`External CRM webhook [${type}] failed: ${response.status} ${response.statusText}`, errorText);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in checkout-crm webhook proxy:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
