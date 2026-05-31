import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getArticlesByBlogHandle, getBlogByHandle, getAllBlogHandles } from "@/lib/blogs";
import BlogListingClient from "@/components/blogs/BlogListingClient";

// ISR: Allow dynamic parameters for new blogs added in Shopify.
// We keep a long revalidation time to minimize Vercel function calls.
export const dynamicParams = true; 
export const revalidate = 86400; // 24 hours

export async function generateStaticParams() {
  return await getAllBlogHandles();
}

export async function generateMetadata({ params }) {
  const { blogHandle } = await params;
  const blog = await getBlogByHandle(blogHandle);

  return {
    title: blog?.title || "Blogs | Lucira",
    description: blog?.metafields?.custom?.subtitle || "Explore stories of elegance and craftsmanship.",
    alternates: {
      canonical: `/blogs/${blogHandle}`,
    },
  };
}

export default async function BlogListingPage({ params }) {
  const { blogHandle } = await params;

  const [blog, articles] = await Promise.all([
    getBlogByHandle(blogHandle),
    getArticlesByBlogHandle(blogHandle),
  ]);

  if (!blog && articles.length === 0) return notFound();

  // Extract unique tags from all articles
  const allTags = Array.from(
    new Set(articles.flatMap((article) => article.tags || []))
  ).sort();

  return (
    <main className="bg-white min-h-screen pb-24">
      {/* Hero Section - Reduced Size */}
      <section className="py-2 lg:py-8 bg-[#FCFBFA] border-b border-zinc-100">
        <div className="container-main text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#a68380] mb-4">
            The Lucira Journal
          </p>
          <h1 className="font-abhaya text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight">
            {blog?.title || "Stories"}
          </h1>
        </div>
      </section>

      <Suspense fallback={
        <div className="py-24 text-center text-zinc-500 font-light">Loading stories...</div>
      }>
        <BlogListingClient 
          articles={articles} 
          allTags={allTags} 
          blogHandle={blogHandle} 
        />
      </Suspense>
    </main>
  );
}
