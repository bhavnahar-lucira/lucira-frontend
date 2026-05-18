import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.redirect(
      new URL(`/product/${handle}`, req.url),
      307
    );
  } catch (err) {
    console.error(err);
    return new NextResponse(null, { status: 500 });
  }
}