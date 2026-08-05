import { getAllPages } from "@/lib/pages";
import { buildUrlset, xmlResponse, dedupeByUrl } from "@/lib/sitemapXml";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

// Rate pages get their own dedicated sitemaps (sitemap-gold-rate.xml etc.) —
// exclude them here so they aren't listed twice.
const RATE_MARKERS = ["gold-rate-today", "silver-rate-today", "platinum-rate-today"];
const isRatePage = (handle) => RATE_MARKERS.some((marker) => handle.includes(marker));

export async function GET() {
  const staticRoutes = [
    "",
    "/login",
    "/register",
    "/collections",
    "/blogs/stories",
    "/pages/sitemap",
    "/pages/store-locator",
    "/llms.txt",
    "/llms-full.txt",
    "/agents.md",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));

  const pages = await getAllPages().catch((e) => {
    console.error("sitemap-pages: pages fetch failed", e.message);
    return [];
  });

  const pageEntries = pages
    .filter((page) => !isRatePage(page.handle))
    .map((page) => ({
      url: `${BASE_URL}/pages/${page.handle}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const entries = dedupeByUrl([...staticRoutes, ...pageEntries]);

  return xmlResponse(buildUrlset(entries));
}
