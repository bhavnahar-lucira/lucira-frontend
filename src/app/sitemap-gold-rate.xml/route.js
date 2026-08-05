import { getAllPages } from "@/lib/pages";
import { buildUrlset, xmlResponse } from "@/lib/sitemapXml";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export async function GET() {
  const pages = await getAllPages().catch((e) => {
    console.error("sitemap-gold-rate: pages fetch failed", e.message);
    return [];
  });

  const entries = pages
    .filter((page) => page.handle.includes("gold-rate-today"))
    .map((page) => ({
      url: `${BASE_URL}/pages/${page.handle}`,
      // Rates are refreshed via ISR (revalidate: 3600) — daily/high-priority
      // signals crawlers to revisit these city pages more often than static pages.
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    }));

  return xmlResponse(buildUrlset(entries));
}
