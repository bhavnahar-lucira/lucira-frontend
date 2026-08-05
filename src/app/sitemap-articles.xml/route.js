import { getAllArticleHandles } from "@/lib/blogs";
import { buildUrlset, xmlResponse } from "@/lib/sitemapXml";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export async function GET() {
  const articles = await getAllArticleHandles().catch((e) => {
    console.error("sitemap-articles: fetch failed", e.message);
    return [];
  });

  const entries = articles.map(({ blogHandle, articleHandle }) => ({
    url: `${BASE_URL}/blogs/${blogHandle}/${articleHandle}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return xmlResponse(buildUrlset(entries));
}
