import { getAllBlogHandles } from "@/lib/blogs";
import { buildUrlset, xmlResponse } from "@/lib/sitemapXml";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export async function GET() {
  const blogs = await getAllBlogHandles().catch((e) => {
    console.error("sitemap-blogs: fetch failed", e.message);
    return [];
  });

  const entries = blogs.map(({ blogHandle }) => ({
    url: `${BASE_URL}/blogs/${blogHandle}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return xmlResponse(buildUrlset(entries));
}
