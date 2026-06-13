"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BlogCard from "./BlogCard";

export default function BlogListingClient({ articles, allTags, blogHandle }) {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag");

  // Filter articles by tag if selected
  const filteredArticles = tag
    ? articles.filter(article => article.tags?.includes(tag))
    : articles;

  return (
    <>
      {/* Filter Navigation */}
      <section className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-100">
        <div className="container-main">
          <div className="flex items-center lg:justify-center overflow-x-auto no-scrollbar py-4 lg:py-6 gap-6 lg:gap-12 px-4 lg:px-0">
            <Link prefetch={false}
              href={`/blogs/${blogHandle}`}
              className={`whitespace-nowrap text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative pb-1 ${
                !tag ? "text-[#a68380]" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              All
              {!tag && (
                <span className="absolute bottom-0 left-0 w-full h-px bg-[#a68380]"></span>
              )}
            </Link>
            {allTags.map((t) => (
              <Link prefetch={false}
                key={t}
                href={`/blogs/${blogHandle}?tag=${encodeURIComponent(t)}`}
                className={`whitespace-nowrap text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative pb-1 ${
                  tag === t ? "text-[#a68380]" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {t}
                {tag === t && (
                  <span className="absolute bottom-0 left-0 w-full h-px bg-[#a68380]"></span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="container-main py-10 lg:py-16">
        {filteredArticles.length > 0 ? (
          <div className="grid gap-x-4 gap-y-10 grid-cols-2 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
            {filteredArticles.map((article) => (
              <BlogCard 
                key={article.id} 
                article={article} 
                blogHandle={blogHandle} 
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <h3 className="font-abhaya text-3xl font-bold text-zinc-900 mb-4">No stories found</h3>
            <p className="text-zinc-500 mb-8 font-light">We haven't shared any stories under "{tag}" yet.</p>
            <Link prefetch={false}
              href={`/blogs/${blogHandle}`}
              className="inline-block px-8 py-3 border border-[#a68380] text-[#a68380] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#a68380] hover:text-white transition-all duration-300"
            >
              Back to All Stories
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
