import { NextResponse } from "next/server";

export async function POST(req) {
  // simply clear the customerAccessToken cookie
  const res = NextResponse.json({ status: "LOGGED_OUT" });
  res.cookies.set("customerAccessToken", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
