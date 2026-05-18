import Link from "next/link";
import LazyImage from "../common/LazyImage";

export default function BlogCard({ article, blogHandle }) {
  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Helper to strip HTML and get excerpt
  const getExcerpt = (article) => {
    if (article.excerpt) return article.excerpt;
    const body = article.contentHtml || article.content || "";
    return body.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim().substring(0, 160) + "...";
  };

  const readTime = article.read_time?.value || "5 min read";
  const date = formatDate(article.publishedAt);
  const excerpt = getExcerpt(article);
  const href = `/blogs/${blogHandle}/${article.handle}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-sm border border-[#ddd6d2] bg-white h-full"
    >
      <div className="relative aspect-[313/362] w-full overflow-hidden bg-zinc-50">
        {article.image?.url ? (
          <LazyImage
            src={article.image.url}
            alt={article.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400 uppercase tracking-widest">
            Lucira Stories
          </div>
        )}
      </div>

      <div className="px-3 py-4 lg:px-4 lg:py-6">
        <div className="mb-2 lg:mb-3.5 flex flex-wrap items-center gap-2 text-[10px] lg:text-xs text-zinc-500">
          <span>{readTime}</span>
          <span className="h-3 w-px bg-zinc-300" />
          <span>{date}</span>
        </div>

        <h3 className="line-clamp-2 min-h-[3rem] text-sm lg:text-lg leading-tight lg:leading-6 font-bold text-black group-hover:text-[#a68380] transition-colors">
          {article.title}
        </h3>

        <p className="mt-2 lg:mt-3 line-clamp-3 text-xs lg:text-sm leading-relaxed text-[#767676]">
          {excerpt}
        </p>
      </div>
    </Link>
  );
}
