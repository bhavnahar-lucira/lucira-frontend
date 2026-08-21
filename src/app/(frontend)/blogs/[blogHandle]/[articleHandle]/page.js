import { notFound } from "next/navigation";
import {
  getArticleByBlogAndHandle,
  getArticlesByBlogHandle,
  getMostViewedArticles,
  getAllArticleHandles
} from "@/lib/blogs";
import BlogArticleClient from "@/components/blogs/BlogArticleClient";
import "./blog-article.css";
import { getArticleSchema, getBreadcrumbSchema } from "@/lib/seo";

// SSG: static blog articles, pre-rendered at build time and served from the
// cache like `revalidate: false` would. Unlike `false`, a page that fails to
// fetch content during build (e.g. Shopify rate-limiting the live-scrape
// fallback) isn't broken forever — Next revalidates it in the background at
// most once a day, so it can self-heal on a later visit instead of staying
// empty until the next full redeploy.
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  return await getAllArticleHandles();
}

function stripHtml(value) {
  return value?.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim() || "";
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function readingTime(article) {
  const text = article.content || stripHtml(article.contentHtml);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  return `${Math.max(1, Math.ceil(words / 220))} Mins`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function prepareArticleHtml(html) {
  if (!html) return { html: "", toc: [] };

  // Clean absolute links to Shopify/Lucira domain
  let processedHtml = html
    .replace(/href="https:\/\/luciraonline\.myshopify\.com\//g, 'href="/')
    .replace(/href="https:\/\/www\.lucirajewelry\.com\//g, 'href="/')
    .replace(/href="\/(products|collections|blogs)\//g, 'href="/$1/');

  const toc = [];
  const usedIds = new Set();
  const finalHtml = processedHtml.replace(/<h([2-3])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, content) => {
    const label = stripHtml(content);
    if (!label) return match;

    const existingId = attrs.match(/\sid=["']([^"']+)["']/i)?.[1];
    let id = existingId || slugify(label);
    let count = 2;

    while (usedIds.has(id)) {
      id = `${existingId || slugify(label)}-${count}`;
      count += 1;
    }

    usedIds.add(id);
    toc.push({ id, label, level: Number(level) });

    const nextAttrs = existingId ? attrs : `${attrs} id="${id}"`;
    return `<h${level}${nextAttrs}>${content}</h${level}>`;
  });

  return { html: finalHtml, toc };
}

export async function generateMetadata({ params }) {
  const { blogHandle, articleHandle } = await params;
  const article = await getArticleByBlogAndHandle(blogHandle, articleHandle);

  if (!article) {
    return {
      title: "Blog not found",
    };
  }

  const title = article.seo?.title || article.title;
  let description = article.seo?.description || article.excerpt || stripHtml(article.excerptHtml);
  
  // Robust fallback for description
  if (!description || description.length < 10) {
    const contentText = stripHtml(article.contentHtml || article.content || "");
    description = contentText.slice(0, 160);
  }

  const authorName = article.author_name?.value || article.authorV2?.name || "Lucira Jewelry";

  return {
    title,
    description,
    keywords: article.tags?.join(", ") || "",
    authors: [{ name: authorName }],
    publisher: "Lucira Jewelry",
    robots: {
      index: true,
      follow: true,
    },
    other: {
      language: "English",
    },
    openGraph: {
      title,
      description,
      images: article.image?.url ? [article.image.url] : [],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [authorName],
    },
    alternates: {
      canonical: `/blogs/${blogHandle}/${articleHandle}`,
    },
  };
}

export default async function ArticlePage({ params }) {
  const { blogHandle, articleHandle } = await params;
  const [article, relatedArticles, mostViewed] = await Promise.all([
    getArticleByBlogAndHandle(blogHandle, articleHandle),
    getArticlesByBlogHandle(blogHandle),
    getMostViewedArticles(4)
  ]);

  if (!article) return notFound();

  // Robust field extraction with fallbacks
  // Try to find a better title from SEO or content if the main one is generic
  const contentTitle = article.contentHtml?.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>?/gm, '');
  const displayTitle = article.seo?.title || article.title || contentTitle || article.blogTitle || blogHandle.charAt(0).toUpperCase() + blogHandle.slice(1);
  
  const publishedDate = formatDate(article.publishedAt || article.created_at || new Date().toISOString());
  const readTime = readingTime(article);
  const { html: bodyHtml, toc } = prepareArticleHtml(article.contentHtml || article.content);

  // If the body is empty, Shopify 2.0 sections scraping likely failed (e.g. rate
  // limiting during a big build). Throwing here would be worse than the bug it's
  // trying to prevent: generateStaticParams pre-renders every article in ONE
  // `next build`, so an uncaught error for a single article fails the entire
  // build and blocks every other page from deploying. notFound() keeps the same
  // guarantee (this broken, empty render is never cached) without taking the
  // whole site down — dynamicParams + the 24h revalidate above mean this path
  // just retries on a later visit instead of being pre-rendered now.
  if (!bodyHtml) {
    console.error(`Article content is empty for ${articleHandle}. Scraping likely failed.`);
    return notFound();
  }

  const related = relatedArticles
    .filter((item) => item.handle !== article.handle)
    .slice(0, 4);

  const jsonLd = getArticleSchema({ ...article, title: displayTitle }, blogHandle);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: blogHandle.charAt(0).toUpperCase() + blogHandle.slice(1), url: `/blogs/${blogHandle}` },
    { name: displayTitle, url: `/blogs/${blogHandle}/${article.handle}` }
  ];
  const breadcrumbLd = getBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BlogArticleClient
        article={{ ...article, title: displayTitle }}
        bodyHtml={bodyHtml}
        toc={toc}
        publishedDate={publishedDate}
        readTime={readTime}
        mostViewed={mostViewed}
        featuredProducts={[]} // You can fetch products here if needed
      />
    </>
  );
}
