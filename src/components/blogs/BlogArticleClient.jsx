"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Linkedin } from "lucide-react";

export default function BlogArticleClient({
  article,
  bodyHtml,
  toc,
  publishedDate,
  readTime,
  mostViewed = [],
  featuredProducts = []
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTocOpen, setIsTocOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleToc = () => setIsTocOpen(!isTocOpen);

  return (
    <div className="lucira-blogs">
      {/* Progress Bar */}
      <div className="blog-progress-wrapper">
        <div
          className="blog-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="py-12">
        <div className="blog-internal-container">
          {/* Main Content */}
          <main className="main-content">
            <h1 className="article-title">{article.title}</h1>

            <div className="article-meta-info">
              <div className="meta-item">
                <span className="meta-label">Publication Date</span>
                <span className="meta-value">{publishedDate}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Author</span>
                <span className="meta-value">
                  {article.author_name?.value || article.authorV2?.name || "Team Lucira"}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Read Time</span>
                <span className="meta-value">{article.read_time?.value || readTime || "N/A"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Views</span>
                <span className="meta-value">
                  {article.views?.value || `${Math.floor(Math.abs(parseInt(article.id ? article.id.split('/').pop() : "0") || 0) % 800) + 350}+`}
                </span>
              </div>
            </div>

            {article.image?.url && (
              <div className="hero-image-container">
                <img
                  src={article.image.url}
                  alt={article.image.altText || article.title}
                  className="hero-image"
                />
              </div>
            )}

            {/* Mobile TOC Accordion */}
            {toc.length > 0 && (
              <>
                <div className="toc-accordion-header" onClick={toggleToc}>
                  <span className="font-bold uppercase text-sm tracking-widest">Table of Content</span>
                  <span>{isTocOpen ? "−" : "+"}</span>
                </div>
                <div className={`toc-mobile-list ${isTocOpen ? "is-open" : ""}`}>
                  <ul className="toc-list">
                    {toc.map((item) => (
                      <li key={item.id} style={{ marginLeft: item.level === 3 ? "20px" : "0" }}>
                        <a href={`#${item.id}`} onClick={() => setIsTocOpen(false)}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <article
              className="article-content-block"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </main>

          {/* Sidebar */}
          <aside className="right-sidebar">
            <div className="sidebar-inner">
              {toc.length > 0 && (
                <section className="mb-10">
                  <h3 className="sidebar-heading">Table of Content</h3>
                  <ul className="toc-list">
                    {toc.map((item) => (
                      <li key={item.id} style={{ marginLeft: item.level === 3 ? "20px" : "0" }}>
                        <a href={`#${item.id}`}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mb-10">
                <h3 className="sidebar-heading">Follow Us</h3>
                <div className="flex items-center gap-4">
                  <a href="https://www.facebook.com/lucirajewelry" target="_blank" className="text-[#1877f2] hover:opacity-80 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.5-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2V8.6H15.2c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/lucirajewelry" target="_blank" className="text-[#e4405f] hover:opacity-80 transition-opacity">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/company/lucirajewelry" target="_blank" className="text-[#0a66c2] hover:opacity-80 transition-opacity">
                    <Linkedin size={24} fill="currentColor" />
                  </a>
                </div>
              </section>
              {featuredProducts.length > 0 && (
                <section className="mt-10">
                  <h3 className="sidebar-heading">Featured Products</h3>
                  <div className="featured-products-list">
                    {featuredProducts.map((product) => (
                      <Link prefetch={false}
                        key={product.id}
                        href={`/products/${product.handle}`}
                        className="product-card-sidebar"
                      >
                        <div className="product-image-container-sidebar">
                          <img
                            src={product.featuredImage?.url || product.image?.url}
                            alt={product.title}
                            className="product-image-sidebar"
                          />
                        </div>
                        <div className="product-info-sidebar">
                          <div className="product-title-sidebar">{product.title}</div>
                          <div className="product-price-sidebar">
                            {product.priceRange?.minVariantPrice?.amount
                              ? `₹${product.priceRange.minVariantPrice.amount}`
                              : "View Product"}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

          </aside>
        </div>

        {/* CTA Banner */}
        <div className="blog-internal-container !flex-col !gap-0">
          <section className="cta-banner" style={{ backgroundImage: "url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Req_from_Sanghani_20_black.png?v=1768481813')" }}>
            <h2 className="cta-title">Shop Your First Lab Grown Diamond</h2>
            <p className="cta-description">
              Step into a new era of sparkle — brilliant, ethical, yours. Shop your first lab grown diamond today.
            </p>
            <Link prefetch={false} href="/collections/jewelry" className="cta-button">
              Shop Now
            </Link>
          </section>
        </div>

        {/* Most Viewed Blogs */}
        {mostViewed.length > 0 && (
          <section className="popular-articles-section">
            <div className="blog-internal-container !flex-col">
              <h2 className="popular-articles-title">Most Popular Articles</h2>
              <div className="popular-articles-grid">
                {mostViewed.map((item) => (
                  <Link prefetch={false}
                    key={item.id}
                    href={`/blogs/${item.blogHandle}/${item.handle}`}
                    className="popular-article-card group"
                  >
                    <div className="popular-article-image-wrapper">
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.title}
                          className="popular-article-image"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="popular-article-content">
                      <span className="popular-article-date">
                        {new Date(item.publishedAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <h3 className="popular-article-title">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
