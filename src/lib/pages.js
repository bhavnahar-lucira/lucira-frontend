import { shopifyStorefrontFetch, shopifyAdminRestFetch } from "./shopify";
import { fetchWithRetry } from "@/utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function serialize(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null;
}

function stripHtml(value) {
  return value?.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim() || "";
}

function parseNextPageInfo(linkHeader) {
  if (!linkHeader) return null;
  const nextLink = linkHeader
    .split(",")
    .find((part) => part.includes('rel="next"'));
  if (!nextLink) return null;
  const url = nextLink.match(/<([^>]+)>/)?.[1];
  if (!url) return null;
  return new URL(url).searchParams.get("page_info");
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllPages — used only at build time for generateStaticParams; always force-cache
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllPages() {
  const query = `
      query {
        pages(first: 250) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `;
  const data = await shopifyStorefrontFetch(query, {}, {
    cache: 'force-cache',
    useRwToken: true
  });
  return data?.pages?.edges.map(e => e.node) || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1: Shopify Storefront API
// ─────────────────────────────────────────────────────────────────────────────

export async function getPageByHandleStorefront(handle, cacheOption = 'force-cache') {
  const query = `
      query getPage($handle: String!) {
        page(handle: $handle) {
          id
          title
          handle
          body
          bodySummary
          seo { title description }
        }
      }
    `;
  const data = await shopifyStorefrontFetch(query, { handle }, {
    cache: cacheOption,
    useRwToken: true
  });
  return data?.page || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2: Shopify Admin REST API
// Fetches raw body_html — bypasses Shopify 2.0 section restrictions.
// Mirrors the same approach used in blogs.js for article content.
// ─────────────────────────────────────────────────────────────────────────────

export async function getPageByHandleAdminRest(handle) {
  try {
    let pageInfo = null;

    do {
      const params = pageInfo
        ? { limit: 250, page_info: pageInfo }
        : { limit: 250 };

      const { data, linkHeader } = await shopifyAdminRestFetch(
        "pages.json",
        params
      );

      const page = data.pages?.find((p) => p.handle === handle);

      if (page) {
        return {
          id: `gid://shopify/Page/${page.id}`,
          title: page.title,
          handle: page.handle,
          body: page.body_html || "",
          bodySummary: stripHtml(page.body_html || "").slice(0, 160),
          seo: {
            title: page.title,
            description: stripHtml(page.body_html || "").slice(0, 160),
          },
        };
      }

      pageInfo = parseNextPageInfo(linkHeader);
    } while (pageInfo);

    return null;
  } catch (e) {
    console.warn("Admin REST page fetch failed:", e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3: Live Shopify store scraping (last resort)
// Mirrors getArticleRenderedFromLiveSite() in blogs.js
// ─────────────────────────────────────────────────────────────────────────────

export async function getPageFromLiveSite(handle) {
  let res;
  try {
    res = await fetchWithRetry(
      `https://luciraonline.myshopify.com/pages/${handle}?_fd=0`,
      {
        cache: 'no-store',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );
  } catch (error) {
    console.error(`Live site scraping failed for page ${handle}:`, error.message);
    return null;
  }

  if (!res || !res.ok) return null;

  const pageHtml = await res.text();

  // Extract main content — Shopify stores page content inside main or article tags
  let contentHtml = "";
  const mainMatch = pageHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    contentHtml = mainMatch[1]
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/href="https:\/\/luciraonline\.myshopify\.com\//g, 'href="/')
      .replace(/href="https:\/\/www\.lucirajewelry\.com\//g, 'href="/')
      .replace(/src="\/\//g, 'src="https://');
  }

  const title =
    pageHtml.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>?/gm, "").trim() ||
    pageHtml.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.split("|")[0]?.trim() ||
    handle;

  if (!contentHtml && !title) return null;

  return {
    id: null,
    title,
    handle,
    body: contentHtml,
    bodySummary: stripHtml(contentHtml).slice(0, 160),
    seo: { title, description: stripHtml(contentHtml).slice(0, 160) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: getPageByHandle — 3-tier fetch, same strategy as blogs.js
//
//  Tier 1: Shopify Storefront API   (fastest, CDN-cached)
//  Tier 2: Shopify Admin REST API   (bypasses Shopify 2.0 section hiding)
//  Tier 3: Live site HTML scraping  (last resort)
//
// cacheOption: 'force-cache' for static pages, 'no-store' for rate pages
// ─────────────────────────────────────────────────────────────────────────────

export async function getPageByHandle(handle, cacheOption = 'force-cache') {
  // Tier 1: Storefront API
  const storefrontPage = await getPageByHandleStorefront(handle, cacheOption);

  // If Storefront returned a page with content, use it directly
  if (storefrontPage?.body) {
    return serialize(storefrontPage);
  }

  // Tier 2: Admin REST API — bypasses Shopify 2.0 section restrictions
  // (same reason blogs.js uses it: Shopify 2.0 pages can hide body from Storefront API)
  let adminPage = null;
  try {
    adminPage = await getPageByHandleAdminRest(handle);
  } catch (e) {
    console.warn("Admin REST page fallback failed:", e.message);
  }

  if (adminPage?.body) {
    // Merge: prefer Storefront metadata (id, seo) but use Admin body content
    return serialize({
      ...storefrontPage,
      ...adminPage,
      body: adminPage.body || storefrontPage?.body || "",
    });
  }

  // Tier 3: Live site scraping — last resort
  let livePage = null;
  try {
    livePage = await getPageFromLiveSite(handle);
  } catch (e) {
    console.warn("Live site scraping fallback failed:", e.message);
  }

  if (livePage) {
    return serialize({
      ...storefrontPage,
      ...livePage,
      body: livePage.body || storefrontPage?.body || "",
    });
  }

  // Return the storefront page even if body is empty (page exists but has no body)
  if (storefrontPage) {
    return serialize(storefrontPage);
  }

  return null;
}
