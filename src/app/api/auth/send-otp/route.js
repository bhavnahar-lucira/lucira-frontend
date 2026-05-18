import { NextResponse } from "next/server";

function formatMobile(raw) {
  const cleaned = raw.replace(/\D/g, "");

  if (cleaned.length === 10) return "91" + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91"))
    return cleaned;

  return "91" + cleaned.slice(-10);
}

export async function POST(req) {
  try {
    const { mobile } = await req.json();

    if (!mobile) {
      return NextResponse.json(
        { error: "Mobile required" },
        { status: 400 }
      );
    }

    const formattedMobile = formatMobile(mobile);

    const response = await fetch(
      "https://control.msg91.com/api/v5/otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: process.env.MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          mobile: formattedMobile,
          template_id: process.env.MSG91_TEMPLATE_ID,
          otp_expiry: 5,
          realTimeResponse: 1,
        }),
      }
    );

    const result = await response.json();

    console.log("MSG91 Response:", result);

    if (result.type === "success") {
      return NextResponse.json({ type: "success" });
    }

    return NextResponse.json(result, { status: 400 });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return NextResponse.json(
      { error: "OTP send failed" },
      { status: 500 }
    );
  }
}