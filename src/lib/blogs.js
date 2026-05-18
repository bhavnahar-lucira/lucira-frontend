import { fetchWithRetry } from "@/utils/helpers";
import clientPromise from "./mongodb";
import { shopifyAdminRestFetch, shopifyStorefrontFetch } from "./shopify";

function serialize(value) {
  return value ? JSON.parse(JSON.stringify(value)) : null;
}

function stripHtml(value) {
  return value?.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim() || "";
}

export async function getArticleByBlogAndHandle(blogHandle, articleHandle) {
  const client = await clientPromise;
  const db = client.db();

  const article = await db.collection("articles").findOne({
    handle: articleHandle,
    blogHandle,
  });

  // Only return immediately if we have content AND the new metafields AND SEO description AND tags
  if ((article?.contentHtml || article?.content) && article?.author_name && article?.seo?.description && article?.tags?.length > 0) return serialize(article);

  const storefrontArticle = await getArticleByBlogAndHandleStorefront(blogHandle, articleHandle);
  const adminArticle =
    storefrontArticle?.contentHtml || storefrontArticle?.content
      ? null
      : await getArticleByBlogAndHandleAdminRest(blogHandle, articleHandle, article?.blogId);
  const liveArticle =
    adminArticle?.contentHtml || adminArticle?.content || storefrontArticle?.contentHtml || storefrontArticle?.content
      ? null
      : await getArticleRenderedFromLiveSite(blogHandle, articleHandle);
  const fallbackArticle = liveArticle || adminArticle || storefrontArticle;

  if (article && fallbackArticle) {
    return serialize({
      ...article,
      ...fallbackArticle,
      image: fallbackArticle.image || article.image,
      authorV2: fallbackArticle.authorV2 || article.authorV2,
      publishedAt: fallbackArticle.publishedAt || article.publishedAt,
    });
  }

  if (article) return serialize(article);

  return fallbackArticle;
}

export async function getBlogByHandle(blogHandle) {
  const client = await clientPromise;
  const db = client.db();

  const blog = await db.collection("blogs").findOne({ handle: blogHandle });

  return serialize(blog);
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
    next: { revalidate: 21600 } // ✅ 6 hours cache
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
  const res = await fetchWithRetry(
    `https://luciraonline.myshopify.com/blogs/${blogHandle}/${articleHandle}`,
    {
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return null;

  const pageHtml = await res.text();
  const liveContentHtml = extractLiveMainContent(pageHtml);

  if (!liveContentHtml) return null;

  const contentHtml = liveContentHtml
    .replace(/src="\/\//g, 'src="https://')
    .replace(/href="\//g, 'href="https://luciraonline.myshopify.com/');

  return {
    content: stripHtml(contentHtml),
    contentHtml,
    blogHandle,
  };
}

function extractLiveMainContent(html) {
  const mainContent = extractFirstDivByClass(html, "main-content");
  if (!mainContent) return "";

  return mainContent
    .replace(/<div[^>]*class=["'][^"']*banner[^"']*["'][\s\S]*?<\/div>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/\sloading="lazy"/g, "");
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
  // Try Storefront API first to get tags and latest data
  try {
    const storefrontArticles = await getArticlesByBlogHandleStorefront(blogHandle);
    if (storefrontArticles && storefrontArticles.length > 0) {
      return serialize(storefrontArticles);
    }
  } catch (error) {
    console.error("Error fetching articles from Storefront:", error);
  }

  // Fallback to MongoDB
  const client = await clientPromise;
  const db = client.db();

  const articles = await db
    .collection("articles")
    .find({ blogHandle })
    .sort({ publishedAt: -1 })
    .toArray();

  return serialize(articles) || [];
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

  const data = await shopifyStorefrontFetch(query, { blogHandle }, {
    next: { revalidate: 21600 } // ✅ 6 hours cache
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
  const client = await clientPromise;
  const db = client.db();

  const articles = await db
    .collection("articles")
    .aggregate([
      // Only include articles that have an image (avoids blank cards)
      { $match: { "image.url": { $exists: true, $ne: null } } },
      {
        $addFields: {
          // Support both nested { views: { value: "123" } } and flat { views: "123" }
          viewsInt: {
            $toInt: {
              $ifNull: [
                "$views.value",
                { $ifNull: ["$views", "0"] }
              ]
            }
          }
        }
      },
      { $sort: { viewsInt: -1, publishedAt: -1 } },
      // Deduplicate by handle — keeps first occurrence (highest views)
      {
        $group: {
          _id: "$handle",
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { viewsInt: -1, publishedAt: -1 } },
      { $limit: limit }
    ])
    .toArray();

  return serialize(articles) || [];
}
