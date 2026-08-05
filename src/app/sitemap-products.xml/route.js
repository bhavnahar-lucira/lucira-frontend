import { getAllProductHandles } from "@/lib/shopify";
import { buildUrlset, xmlResponse } from "@/lib/sitemapXml";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export async function GET() {
  const products = await getAllProductHandles().catch((e) => {
    console.error("sitemap-products: fetch failed", e.message);
    return [];
  });

  const entries = products.map((handle) => ({
    url: `${BASE_URL}/products/${handle}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return xmlResponse(buildUrlset(entries));
}
