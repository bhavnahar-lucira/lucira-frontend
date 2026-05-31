import { getAllProductHandles, getAllCollectionHandles } from "@/lib/shopify";
import { getAllBlogHandles, getAllArticleHandles } from "@/lib/blogs";
import { getAllPages } from "@/lib/pages";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";

export const revalidate = false; // Force SSG - Zero function invocations after build

export default async function sitemap() {
  // 1. Static Routes
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

  // 2. Fetch Dynamic Data
  let products = [], collections = [], blogs = [], articles = [], pages = [];
  
  try {
    [products, collections, blogs, articles, pages] = await Promise.all([
      getAllProductHandles().catch(e => { console.error("Sitemap: Products fetch failed", e.message); return []; }),
      getAllCollectionHandles().catch(e => { console.error("Sitemap: Collections fetch failed", e.message); return []; }),
      getAllBlogHandles().catch(e => { console.error("Sitemap: Blogs fetch failed", e.message); return []; }),
      getAllArticleHandles().catch(e => { console.error("Sitemap: Articles fetch failed", e.message); return []; }),
      getAllPages().catch(e => { console.error("Sitemap: Pages fetch failed", e.message); return []; }),
    ]);
  } catch (error) {
    console.error("Sitemap: Data fetching error", error.message);
  }

  // 3. Map to Sitemap Objects
  const productEntries = products.map((handle) => ({
    url: `${BASE_URL}/products/${handle}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const collectionEntries = collections.map((handle) => ({
    url: `${BASE_URL}/collections/${handle}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const blogEntries = blogs.map(({ blogHandle }) => ({
    url: `${BASE_URL}/blogs/${blogHandle}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const articleEntries = articles.map(({ blogHandle, articleHandle }) => ({
    url: `${BASE_URL}/blogs/${blogHandle}/${articleHandle}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const pageEntries = pages.map((page) => ({
    url: `${BASE_URL}/pages/${page.handle}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...productEntries,
    ...collectionEntries,
    ...blogEntries,
    ...articleEntries,
    ...pageEntries,
  ];
}
