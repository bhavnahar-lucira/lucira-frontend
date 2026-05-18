"use client";

import Link from "next/link";
import BlogCard from "../blogs/BlogCard";

export default function JewelryBlog({ articles = [] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="w-full mt-15 overflow-hidden">
      <div className="container-main">
        <div className="text-center mb-6 lg:mb-10">
          <h2 className="main-title font-extrabold font-abhaya mb-1.5 text-3xl lg:text-4xl">
            Jewelry Blog By Lucira
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:gap-6 lg:grid-cols-4">
          {articles.slice(0, 4).map((article) => (
            <BlogCard 
              key={article.id} 
              article={article} 
              blogHandle="stories" 
            />
          ))}
        </div>

        <div className="mt-8 lg:mt-12 flex justify-center pb-10 lg:pb-16">
          <Link
            href="/blogs/stories"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-primary px-10 text-xs lg:text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 shadow-sm"
          >
            Read All Blogs
          </Link>
        </div>
      </div>
    </section>
  );
}
