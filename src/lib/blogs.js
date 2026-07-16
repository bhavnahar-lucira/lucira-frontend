import { fetchWithRetry } from "@/utils/helpers";
import { shopifyAdminRestFetch, shopifyStorefrontFetch } from "./shopify";

function serialize(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null;
}

function stripHtml(value) {
  return value?.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim() || "";
}

export async function getArticleByBlogAndHandle(blogHandle, articleHandle) {
  // 1. Try Storefront API first (most reliable, supports caching)
  const storefrontArticle = await getArticleByBlogAndHandleStorefront(blogHandle, articleHandle);

  // 2. Try Admin API if Storefront article or content is missing (Shopify 2.0 sections hide content from Storefront API)
  let adminArticle = null;
  if (!storefrontArticle || !storefrontArticle.contentHtml) {
    try {
      adminArticle = await getArticleByBlogAndHandleAdminRest(blogHandle, articleHandle, storefrontArticle?.blogId);
    } catch (e) {
      console.warn("Admin API fallback failed:", e.message);
    }
  }

  // 3. Last resort: Live site scraping
  let liveArticle = null;
  if (!storefrontArticle?.contentHtml && !adminArticle?.contentHtml) {
    try {
      liveArticle = await getArticleRenderedFromLiveSite(blogHandle, articleHandle);
    } catch (e) {
      console.warn("Live site scraping fallback failed:", e.message);
    }
  }

  // Merge sources
  const baseArticle = storefrontArticle || adminArticle || liveArticle;
  if (!baseArticle) return null;

  const merged = {
    ...baseArticle,
    title: baseArticle.title || storefrontArticle?.title || adminArticle?.title || liveArticle?.title,
    contentHtml: baseArticle.contentHtml || adminArticle?.contentHtml || liveArticle?.contentHtml || baseArticle.content,
    content: baseArticle.content || adminArticle?.content || stripHtml(baseArticle.contentHtml || adminArticle?.contentHtml || liveArticle?.contentHtml),
    image: baseArticle.image || adminArticle?.image || storefrontArticle?.image || liveArticle?.image,
    // Real hero banner scraped from the live theme (section-based articles hide
    // this from the API). Falls back to the featured image in the component.
    bannerImage: baseArticle.bannerImage || liveArticle?.bannerImage || null,
    authorV2: baseArticle.authorV2 || adminArticle?.authorV2 || storefrontArticle?.authorV2,
    publishedAt: baseArticle.publishedAt || adminArticle?.publishedAt || storefrontArticle?.publishedAt || liveArticle?.publishedAt,
  };

  // Try to find image in content if still missing
  if (!merged.image?.url && merged.contentHtml) {
    const imgMatch = merged.contentHtml.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch) {
      merged.image = { url: imgMatch[1], altText: merged.title };
    }
  }

  return serialize(merged);
}

export async function getBlogByHandle(blogHandle) {
  const query = `
    query GetBlog($blogHandle: String!) {
      blog(handle: $blogHandle) {
        id
        title
        handle
      }
    }
  `;

  const data = await shopifyStorefrontFetch(query, { blogHandle }, { 
    cache: 'force-cache',
    useRwToken: true 
  });
  return serialize(data?.blog || null);
}

export async function getArticleByBlogAndHandleStorefront(blogHandle, articleHandle) {
  const query = `
    query GetArticle($blogHandle: String!, $articleHandle: String!) {
      blog(handle: $blogHandle) {
        id
        title
        handle
        articleByHandle(handle: $articleHandle) {
          id
          title
          handle
          content
          contentHtml
          excerpt
          excerptHtml
          publishedAt
          authorV2 {
            name
          }
          tags
          image {
            url
            altText
          }
          author_name: metafield(namespace: "custom", key: "author_name") { value }
          authors_image: metafield(namespace: "custom", key: "authors_image") { 
            value 
            reference {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
          authors_description: metafield(namespace: "custom", key: "authors_description") { value }
          authors_linkedin: metafield(namespace: "custom", key: "authors_linkedin") { value }
          views: metafield(namespace: "custom", key: "views") { value }
          read_time: metafield(namespace: "custom", key: "read_time") { value }
          seo {
            title
            description
          }
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch(query, { blogHandle, articleHandle }, {
    cache: 'force-cache',
    useRwToken: true
  });
  const article = data?.blog?.articleByHandle;

  if (!article) return null;

  return {
    ...article,
    blogId: data.blog.id,
    blogTitle: data.blog.title,
    blogHandle: data.blog.handle,
  };
}

function shopifyNumericId(id) {
  if (!id) return null;
  return String(id).split("/").pop();
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

async function getAdminBlogId(blogHandle, blogId) {
  const numericId = shopifyNumericId(blogId);
  if (numericId && numericId !== blogId) return numericId;

  const { data } = await shopifyAdminRestFetch("blogs.json", { limit: 250 });
  return data.blogs?.find((blog) => blog.handle === blogHandle)?.id || numericId;
}

export async function getArticleByBlogAndHandleAdminRest(blogHandle, articleHandle, blogId) {
  const adminBlogId = await getAdminBlogId(blogHandle, blogId);
  if (!adminBlogId) return null;

  let pageInfo = null;

  do {
    const params = pageInfo ? { limit: 250, page_info: pageInfo } : { limit: 250 };
    const { data, linkHeader } = await shopifyAdminRestFetch(
      `blogs/${adminBlogId}/articles.json`,
      params
    );
    const article = data.articles?.find((item) => item.handle === articleHandle);

    if (article) {
      return {
        id: `gid://shopify/Article/${article.id}`,
        title: article.title,
        handle: article.handle,
        content: stripHtml(article.body_html),
        contentHtml: article.body_html,
        excerpt: stripHtml(article.summary_html),
        excerptHtml: article.summary_html,
        publishedAt: article.published_at,
        authorV2: article.author ? { name: article.author } : null,
        image: article.image?.src
          ? {
            url: article.image.src,
            altText: article.image.alt || article.title,
          }
          : null,
        blogId: `gid://shopify/Blog/${adminBlogId}`,
        blogHandle,
      };
    }

    pageInfo = parseNextPageInfo(linkHeader);
  } while (pageInfo);

  return null;
}

export async function getArticleRenderedFromLiveSite(blogHandle, articleHandle) {
  // No per-fetch revalidate — blog article pages are SSG (force-static).
  // Cache: force-cache ensures the fetch result is reused within the same render pass.
  let res;
  try {
    res = await fetchWithRetry(
      `https://luciraonline.myshopify.com/blogs/${blogHandle}/${articleHandle}?_fd=0`,
      {
        cache: 'force-cache',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );
  } catch (error) {
    console.error(`Live site scraping failed for ${articleHandle}:`, error.message);
    return null;
  }

  if (!res || !res.ok) return null;

  const pageHtml = await res.text();
  const { contentHtml: liveContentHtml, bannerImage } = extractLiveMainContent(pageHtml);

  // Extract title from HTML
  let title = pageHtml.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>?/gm, '').trim();
  if (!title) {
    title = pageHtml.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.split('|')[0]?.split('-')[0]?.trim();
  }

  if (!liveContentHtml && !title) return null;

  const contentHtml = (liveContentHtml || "")
    .replace(/src="\/\//g, 'src="https://')
    .replace(/href="https:\/\/luciraonline\.myshopify\.com\//g, 'href="/')
    .replace(/href="https:\/\/www\.lucirajewelry\.com\//g, 'href="/')
    .replace(/href="\/(products|collections|blogs)\//g, 'href="/$1/');

  return {
    title,
    content: stripHtml(contentHtml),
    contentHtml,
    bannerImage,
    blogHandle,
  };
}

function extractLiveMainContent(html) {
  const mainContent = extractFirstDivByClass(html, "main-content");
  if (!mainContent) return { contentHtml: "", bannerImage: null };

  // The article's real hero banner lives inside a "banner" div at the top of
  // the content. Capture its image URL BEFORE we strip banner divs, so it can
  // be used as the article hero instead of the featured/card image.
  const bannerImage = extractBannerImage(mainContent);

  const contentHtml = mainContent
    .replace(/<div[^>]*class=["'][^"']*banner[^"']*["'][\s\S]*?<\/div>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/\sloading="lazy"/g, "");

  return { contentHtml, bannerImage };
}

// Pull the best image URL out of the first "banner" block. Prefers the desktop
// <img src>, falling back to a <source srcset>. Normalizes protocol-relative URLs.
function extractBannerImage(mainContentHtml) {
  const bannerDiv = extractDivsByClass(mainContentHtml, "banner")[0]?.html;
  if (!bannerDiv) return null;

  let url =
    bannerDiv.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
    bannerDiv.match(/<source[^>]+srcset=["']([^"'\s,]+)/i)?.[1];

  if (!url) return null;

  url = url.trim();
  if (url.startsWith("//")) url = `https:${url}`;
  return url;
}

function extractFirstDivByClass(html, className) {
  return extractDivsByClass(html, className)[0]?.html || "";
}

function extractDivsByClass(html, className) {
  const blocks = [];
  const classPattern = new RegExp(
    `<div\\b[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>`,
    "gi"
  );
  let match;

  while ((match = classPattern.exec(html))) {
    const start = match.index;
    let cursor = classPattern.lastIndex;
    let depth = 1;

    while (depth > 0) {
      const nextOpen = html.indexOf("<div", cursor);
      const nextClose = html.indexOf("</div>", cursor);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        cursor = nextOpen + 4;
      } else {
        depth -= 1;
        cursor = nextClose + 6;
      }
    }

    if (depth === 0) {
      blocks.push({
        index: start,
        html: html.slice(start, cursor),
      });
    }
  }

  return blocks;
}

export async function getArticlesByBlogHandle(blogHandle) {
  // 1. Try Storefront API first to get tags and latest data
  let storefrontArticles = [];
  try {
    storefrontArticles = await getArticlesByBlogHandleStorefront(blogHandle);
  } catch (error) {
    console.error("Error fetching articles from Storefront:", error);
  }

  // 2. Try Admin API fallback if Storefront returns nothing or partial data
  // (Shopify 2.0 sections can sometimes hide articles from Storefront listing)
  if (!storefrontArticles || storefrontArticles.length === 0) {
    try {
      const adminArticles = await getArticlesByBlogHandleAdminRest(blogHandle);
      if (adminArticles && adminArticles.length > 0) {
        return serialize(adminArticles);
      }
    } catch (error) {
      console.warn("Admin API listing fallback failed:", error.message);
    }
  }

  return serialize(storefrontArticles || []);
}

export async function getArticlesByBlogHandleAdminRest(blogHandle, blogId) {
  const adminBlogId = await getAdminBlogId(blogHandle, blogId);
  if (!adminBlogId) return [];

  let allArticles = [];
  let pageInfo = null;

  do {
    const params = pageInfo ? { limit: 250, page_info: pageInfo } : { limit: 250 };
    const { data, linkHeader } = await shopifyAdminRestFetch(
      `blogs/${adminBlogId}/articles.json`,
      params
    );
    
    if (data.articles) {
      const formatted = data.articles.map(article => ({
        id: `gid://shopify/Article/${article.id}`,
        title: article.title,
        handle: article.handle,
        content: stripHtml(article.body_html),
        contentHtml: article.body_html,
        publishedAt: article.published_at,
        excerpt: stripHtml(article.summary_html),
        excerptHtml: article.summary_html,
        authorV2: article.author ? { name: article.author } : null,
        image: article.image?.src ? { url: article.image.src, altText: article.image.alt || article.title } : null,
        tags: article.tags ? article.tags.split(",").map(t => t.trim()) : [],
        blogId: `gid://shopify/Blog/${adminBlogId}`,
        blogHandle
      }));
      allArticles = [...allArticles, ...formatted];
    }

    pageInfo = parseNextPageInfo(linkHeader);
  } while (pageInfo);

  return allArticles;
}

export async function getArticlesByBlogHandleStorefront(blogHandle) {
  const query = `
    query GetBlogArticles($blogHandle: String!) {
      blog(handle: $blogHandle) {
        id
        title
        handle
        articles(first: 100, sortKey: PUBLISHED_AT, reverse: true) {
          edges {
            node {
              id
              title
              handle
              publishedAt
              excerpt
              excerptHtml
              content
              contentHtml
              tags
              image {
                url
                altText
              }
              authorV2 {
                name
              }
            }
          }
        }
      }
    }
  `;

  // force-cache to respect SSG
  const data = await shopifyStorefrontFetch(query, { blogHandle }, {
    cache: 'force-cache',
    useRwToken: true
  });
  const articles = data?.blog?.articles?.edges?.map(edge => ({
    ...edge.node,
    blogId: data.blog.id,
    blogTitle: data.blog.title,
    blogHandle: data.blog.handle
  }));

  return articles || [];
}

export async function getMostViewedArticles(limit = 4) {
  const query = `
    query GetRecentArticles($limit: Int!) {
      articles(first: $limit, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            publishedAt
            excerpt
            excerptHtml
            image {
              url
              altText
            }
            authorV2 {
              name
            }
            blog {
              id
              handle
              title
            }
            views: metafield(namespace: "custom", key: "views") { value }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyStorefrontFetch(query, { limit }, { 
      cache: 'force-cache',
      useRwToken: true 
    });
    const articles = data?.articles?.edges?.map(edge => ({
      ...edge.node,
      blogId: edge.node.blog?.id,
      blogTitle: edge.node.blog?.title,
      blogHandle: edge.node.blog?.handle
    }));
    return serialize(articles) || [];
  } catch (error) {
    console.error("Error fetching recent articles:", error);
    return [];
  }
}

export async function getAllBlogHandles() {
  const query = `
    query GetAllBlogs {
      blogs(first: 250) {
        edges {
          node {
            handle
          }
        }
      }
    }
  `;
  try {
    const data = await shopifyStorefrontFetch(query, {}, { 
      cache: 'force-cache',
      useRwToken: true 
    });
    return data?.blogs?.edges?.map(edge => ({ blogHandle: edge.node.handle })) || [];
  } catch (e) {
    console.error("Error fetching all blogs:", e);
    return [];
  }
}

export async function getAllArticleHandles() {
  const query = `
    query GetAllArticles {
      blogs(first: 250) {
        edges {
          node {
            handle
            articles(first: 250) {
              edges {
                node {
                  handle
                }
              }
            }
          }
        }
      }
    }
  `;
  try {
    const data = await shopifyStorefrontFetch(query, {}, { 
      cache: 'force-cache',
      useRwToken: true 
    });
    const paths = [];
    data?.blogs?.edges?.forEach(blogEdge => {
      const blogHandle = blogEdge.node.handle;
      blogEdge.node.articles?.edges?.forEach(articleEdge => {
        paths.push({
          blogHandle,
          articleHandle: articleEdge.node.handle
        });
      });
    });
    return paths;
  } catch (e) {
    console.error("Error fetching all articles:", e);
    return [];
  }
}

/**
 * Fetches all articles (title + full path) for the sitemap page.
 * The returned `handle` is an absolute path so the sitemap UI links to the
 * correct blog for each article rather than assuming a single blog handle.
 */
export async function getAllArticlesForSitemap() {
  const query = `
    query GetAllArticles {
      blogs(first: 250) {
        edges {
          node {
            handle
            articles(first: 250) {
              edges {
                node {
                  title
                  handle
                }
              }
            }
          }
        }
      }
    }
  `;
  try {
    const data = await shopifyStorefrontFetch(query, {}, {
      cache: 'force-cache',
      useRwToken: true
    });
    const items = [];
    data?.blogs?.edges?.forEach(blogEdge => {
      const blogHandle = blogEdge.node.handle;
      blogEdge.node.articles?.edges?.forEach(articleEdge => {
        items.push({
          title: articleEdge.node.title,
          handle: `/blogs/${blogHandle}/${articleEdge.node.handle}`,
        });
      });
    });
    return items;
  } catch (e) {
    console.error("Error fetching all articles for sitemap:", e);
    return [];
  }
}
