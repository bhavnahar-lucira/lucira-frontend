import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customerAccessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber, customerEmail } = await request.json();

    if (!orderNumber || !customerEmail) {
      return NextResponse.json({ error: "Order number and email are required" }, { status: 400 });
    }

    // Proxy request to Return Prime v2 API
    const res = await fetch('https://api.returnprime.co/fetch_order', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-rp-token': process.env.RETURN_PRIME_TOKEN || "" // Added the official token header
      },
      body: JSON.stringify({
        order_number: orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`,
        email: customerEmail,
        store: 'luciraonline.myshopify.com'
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Return Prime API Error:", error);
    return NextResponse.json({ error: "Failed to connect to Return Prime" }, { status: 500 });
  }
}
