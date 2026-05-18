import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8080";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode");

    if (!pincode) {
      return NextResponse.json({ error: "Pincode required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/pincodes/check?pincode=${pincode}`);
    const data = await res.json();

    // The backend returns { success: true/false, data: { ... } }
    // We transform it for the frontend
    return NextResponse.json({
      success: data.success,
      deliverable: data.success, // If found in DB, it's deliverable
      data: data.data
    });

  } catch (error) {
    console.error("❌ Pincode check error:", error);
    return NextResponse.json({ success: false, deliverable: false }, { status: 500 });
  }
}
