import { getAllCollectionHandles } from "@/lib/shopify";
import { buildUrlset, xmlResponse } from "@/lib/sitemapXml";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export async function GET() {
  const collections = await getAllCollectionHandles().catch((e) => {
    console.error("sitemap-collections: fetch failed", e.message);
    return [];
  });

  const entries = collections.map((handle) => ({
    url: `${BASE_URL}/collections/${handle}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return xmlResponse(buildUrlset(entries));
}
