import { notFound } from "next/navigation";
import {
  getArticleByBlogAndHandle,
  getArticlesByBlogHandle,
  getMostViewedArticles
} from "@/lib/blogs";
import BlogArticleClient from "@/components/blogs/BlogArticleClient";
import "./blog-article.css";
import { getArticleSchema, getBreadcrumbSchema } from "@/lib/seo";

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

  const toc = [];
  const usedIds = new Set();
  const preparedHtml = html.replace(/<h([2-3])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, content) => {
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

  return { html: preparedHtml, toc };
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

export default async function BlogArticlePage({ params }) {
  const { blogHandle, articleHandle } = await params;
  const [article, relatedArticles, mostViewed] = await Promise.all([
    getArticleByBlogAndHandle(blogHandle, articleHandle),
    getArticlesByBlogHandle(blogHandle),
    getMostViewedArticles(4)
  ]);

  if (!article) return notFound();

  const publishedDate = formatDate(article.publishedAt);
  const readTime = readingTime(article);
  const { html: bodyHtml, toc } = prepareArticleHtml(article.contentHtml || article.content);

  const related = relatedArticles
    .filter((item) => item.handle !== article.handle)
    .slice(0, 4);

  const jsonLd = getArticleSchema(article, blogHandle);
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: blogHandle.charAt(0).toUpperCase() + blogHandle.slice(1), url: `/blogs/${blogHandle}` },
    { name: article.title, url: `/blogs/${blogHandle}/${article.handle}` }
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
        article={article}
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
