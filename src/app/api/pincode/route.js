import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode")?.trim();

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid PIN Code",
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        signal: controller.signal,
        next: {
          revalidate: 86400,
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        `India Post API responded with status ${response.status}`
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Pincode API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch pincode details",
      },
      { status: 500 }
    );
  }
}