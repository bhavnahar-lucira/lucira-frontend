// The site's canonical origin, for absolute URLs that end up in server-rendered
// markup (WhatsApp share links on product cards, PDP and ATC bar).
//
// This must NOT come from `window.location.origin` during render: the server
// has no window and falls back to production, so on localhost, Vercel previews
// and the non-www host the client renders a different href and React reports
// a hydration mismatch (seen on hard reloads of /collections/* after the
// 26 Oct 2026 ISR fix made the grids render server-side). NEXT_PUBLIC_BASE_URL
// is inlined at build time on both sides, so it is always identical. Same
// resolution as the sitemaps, robots and root layout.
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com").replace(/\/+$/, "");

export const productPageUrl = (handle) => (handle ? `${SITE_ORIGIN}/products/${handle}` : "");
