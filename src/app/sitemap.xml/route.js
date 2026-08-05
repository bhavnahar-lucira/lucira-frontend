import { buildSitemapIndex, xmlResponse } from "@/lib/sitemapXml";

// Statically prerendered at build time — zero function invocations after build,
// same intent as the child sitemaps and robots.js.
export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

const CHILD_SITEMAPS = [
  "sitemap-pages.xml",
  "sitemap-products.xml",
  "sitemap-collections.xml",
  "sitemap-blogs.xml",
  "sitemap-articles.xml",
  "sitemap-gold-rate.xml",
  "sitemap-silver-rate.xml",
  "sitemap-platinum-rate.xml",
];

export async function GET() {
  const lastModified = new Date();
  const sitemaps = CHILD_SITEMAPS.map((name) => ({
    url: `${BASE_URL}/${name}`,
    lastModified,
  }));

  return xmlResponse(buildSitemapIndex(sitemaps));
}
