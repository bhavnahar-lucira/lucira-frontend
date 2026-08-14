import { NextResponse } from "next/server";

// ─── Lowercase URL normalization ─────────────────────────────────────────────
// Every handle we generate is lowercase (Shopify page/product/collection handles,
// the sitemaps, and every internal <Link>). A visitor typing a URL with Caps Lock
// on — /pages/MYSORE-gold-rate-today — used to render a second, fully crawlable
// copy of the page with the city echoed back in caps ("Gold Rate in MYSORE"),
// and the STATE_CITY_MAP lookup missed so the state fell back to Maharashtra.
//
// Redirect once, permanently, to the lowercase path so there is exactly one
// indexable URL per page.
//
// Skipped: API routes, Next internals, and anything with a file extension —
// files in /public keep the case they were authored with
// (e.g. /images/certificate/SampleCertificate.jpg).
const SKIP_PREFIX = /^\/(?:api|_next)\//;

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (SKIP_PREFIX.test(pathname)) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next();

  const lowercased = pathname.toLowerCase();
  if (lowercased === pathname) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = lowercased;
  // 308 = permanent + preserves the request method (301 can downgrade POST→GET).
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
