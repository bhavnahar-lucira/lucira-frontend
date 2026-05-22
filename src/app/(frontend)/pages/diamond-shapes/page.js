"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

// ---------------------------------------------------------------------------
// Fade-in observer helper
// ---------------------------------------------------------------------------
const FadeInSection = ({ children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-[800ms] ease-in-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[40px]"
        } ${className}`}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FAQ Item
// ---------------------------------------------------------------------------
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#e8e2e0] py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <h3 className="font-figtree font-medium text-[15px] md:text-[17px] text-[#5A413F] tracking-wide pr-4">
          {question}
        </h3>
        <span className="text-xl text-[#B77767] shrink-0 font-light">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] mt-3 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div
          className="text-[#777] text-[14px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shape Navigation Grid
// ---------------------------------------------------------------------------
const ShapeGrid = ({ shapes }) => {
  const handleScroll = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <section className="py-8 md:py-12 max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="text-center mb-8">
        <span className="block w-10 h-[2px] bg-[#B77767] mx-auto mb-4" />
        <h2 className="font-abhaya text-[22px] md:text-[28px] uppercase tracking-wide text-[#5A413F] mb-2">
          Shop Diamonds by Shape
        </h2>
        <p className="text-[13px] md:text-[16px] text-[#777] max-w-[600px] mx-auto">
          Each diamond shape offers a distinct look, brilliance and character.
        </p>
      </div>

      <div className="grid grid-cols-4 md:flex md:flex-wrap md:justify-center gap-y-4 gap-x-2 md:gap-x-10 lg:gap-x-14">
        {shapes.map((shape, index) => (
          <FadeInSection key={index} className="flex flex-col items-center justify-center">
            <a
              href={`#${shape.id}`}
              onClick={(e) => handleScroll(e, shape.id)}
              className="flex flex-col items-center group touch-manipulation cursor-pointer"
              title={shape.title}
            >
              {/* padding creates space so scale(1.12) doesn't clip outside the element */}
              <div className="h-[68px] md:h-[110px] w-[68px] md:w-[110px] flex items-center justify-center p-2 mb-2 md:mb-3">
                <img
                  src={shape.img}
                  alt={`${shape.title} cut diamond`}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.12]"
                />
              </div>
              <p className="text-[11px] md:text-[13px] font-medium uppercase text-[#5A413F] tracking-wider text-center">
                {shape.title}
              </p>
            </a>
          </FadeInSection>
        ))}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Collection Products — 4 on desktop, 2 on mobile
// ---------------------------------------------------------------------------
const CollectionProducts = ({ collectionHandle }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const sectionRef = useRef(null);
  const fetched = useRef(false);

  const fetchProducts = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;
    try {
      const res = await fetch(
        `/api/collection?handle=${collectionHandle}&limit=4&sort=best_selling`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (isMounted.current) {
        setProducts((data.products || []).slice(0, 4));
      }
    } catch {
      // fail silently
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [collectionHandle]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchProducts();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div ref={sectionRef} className="mt-8 md:mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <div className="hidden md:block"><ProductCardSkeleton /></div>
          <div className="hidden md:block"><ProductCardSkeleton /></div>
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  // Pad with null placeholders so the grid always has exactly 4 cells on desktop
  const DESKTOP_COUNT = 4;
  const paddedProducts = [...products];
  while (paddedProducts.length < DESKTOP_COUNT) {
    paddedProducts.push(null); // null = filler "View All" card
  }

  return (
    <div ref={sectionRef} className="mt-8 md:mt-10">
      {/*
        Scoped mobile overrides — only affects cards inside .ds-shape-cards.
        ProductCard uses Tailwind's text-xl (1.25rem) for title & price which
        is too wide for a 2-col mobile grid, so we scale them down here.
      */}
      <style>{`
        @media (max-width: 767px) {
          /* Title */
          .ds-shape-cards h3 {
            font-size: 12px !important;
            line-height: 1.35 !important;
            min-height: unset !important;
          }
          /* Price */
          .ds-shape-cards .text-xl {
            font-size: 13px !important;
          }
          /* Compare-at price */
          .ds-shape-cards .text-base {
            font-size: 10px !important;
          }
          /* "X% OFF" badge */
          .ds-shape-cards .rounded-full.text-xs {
            font-size: 8px !important;
            padding: 1px 5px !important;
          }
          /* Offer shield badge */
          .ds-shape-cards .rounded-full.text-\\[10px\\] {
            font-size: 8px !important;
            padding: 2px 6px !important;
          }
          /* Color swatches */
          .ds-shape-cards button.w-7 {
            width: 18px !important;
            height: 18px !important;
          }
          /* Card inner spacing */
          .ds-shape-cards .space-y-4 {
            gap: 6px !important;
          }
          .ds-shape-cards .flex.flex-col.gap-2 {
            gap: 4px !important;
          }
          /* Rating stars */
          .ds-shape-cards .text-sm {
            font-size: 10px !important;
          }
          /* Price row gap */
          .ds-shape-cards .flex.items-center.gap-3 {
            gap: 4px !important;
            flex-wrap: wrap;
          }
          /* Image area — keep aspect square but reign in padding */
          .ds-shape-cards .p-6 {
            padding: 8px !important;
          }
        }
      `}</style>

      {/* 4 cols on md+, 2 cols on mobile; slots 3 & 4 hidden on mobile */}
      <div className="ds-shape-cards grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
        {paddedProducts.map((product, i) => {
          const isHiddenOnMobile = i >= 2;

          // Filler card — links to full collection
          if (product === null) {
            return (
              <div key={`filler-${i}`} className={isHiddenOnMobile ? "hidden md:block" : ""}>
                <Link
                  href={`/collections/${collectionHandle}`}
                  className="flex flex-col items-center justify-center h-full min-h-[260px] border border-dashed border-[#c9b9b7] bg-[#faf8f7] hover:bg-[#f3eeec] transition-colors duration-300 group"
                >
                  <span className="text-[#5A413F] font-abhaya text-[20px] md:text-[24px] mb-3 leading-snug text-center px-4 group-hover:underline underline-offset-4">
                    View Full Collection
                  </span>
                  <span className="text-[#B77767] text-[11px] md:text-[12px] font-figtree tracking-widest uppercase font-medium">
                    Shop All →
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <div
              key={product.id || product.handle || i}
              className={isHiddenOnMobile ? "hidden md:block" : ""}
            >
              <ProductCard product={product} index={i + 1} />
            </div>
          );
        })}
      </div>

      {/* View All CTA — brand primary colour */}
      <div className="mt-6 text-center">
        <Link
          href={`/collections/${collectionHandle}`}
          className="inline-block border border-[#5A413F] text-[#5A413F] px-10 py-3 text-[12px] md:text-[13px] font-figtree font-medium tracking-widest uppercase hover:bg-[#5A413F] hover:text-white transition-colors duration-300"
        >
          VIEW ALL
        </Link>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Collection Banner (image + text + product cards)
// ---------------------------------------------------------------------------
const CollectionBanner = ({ section }) => {
  return (
    <section
      id={section.id}
      className="max-w-[1400px] mx-auto my-10 md:my-14 px-6 md:px-10 border-b border-gray-100 pb-10 md:pb-14 last:border-0"
    >
      {/* Image + Text Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-12 lg:gap-20">
        <FadeInSection
          className={`w-full flex justify-center ${section.reverse ? "md:order-last" : ""}`}
        >
          <Link
            href={`/collections/${section.collection}`}
            className="block relative w-full group overflow-hidden rounded-sm"
          >
            <img
              src={section.img}
              alt={section.heading}
              loading="lazy"
              className="w-full h-auto max-w-[460px] mx-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </Link>
        </FadeInSection>

        <FadeInSection className="w-full flex flex-col justify-center text-center md:text-left items-center md:items-start font-figtree mx-auto md:mx-0">
          {/* Accent line */}
          <span className="block w-10 h-[2px] bg-[#B77767] mb-4 mx-auto md:mx-0" />
          <h2 className="font-abhaya text-[26px] md:text-[36px] tracking-wide text-[#5A413F] mb-3">
            {section.heading}
          </h2>
          <p className="text-[14px] md:text-[16px] leading-relaxed text-[#777] max-w-[460px] mb-6">
            {section.subheading}
          </p>
          <Link
            href={`/collections/${section.collection}`}
            className="inline-block px-9 py-3 bg-[#5A413F] text-white text-[12px] md:text-[13px] font-figtree font-medium tracking-widest uppercase hover:bg-[#B77767] transition-colors duration-300"
          >
            {section.buttonText}
          </Link>
        </FadeInSection>
      </div>

      {/* Product Cards Row — 4 desktop / 2 mobile */}
      <CollectionProducts collectionHandle={section.collection} />
    </section>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DiamondShapesPage() {
  const shapesData = [
    { title: "Emerald", id: "emerald", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Emerald_2_1.png" },
    { title: "Oval", id: "oval", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Oval_1_1.png" },
    { title: "Cushion", id: "cushion", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cushion_1_1_eca0cf7d-8aae-4002-8f37-629f5decdb24.png" },
    { title: "Round", id: "round", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Round_1.png" },
    { title: "Princess", id: "princess", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Princess_1.png" },
    { title: "Pear", id: "pear", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pear_1.png" },
    { title: "Marquise", id: "marquise", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Marquise_1.png" },
    { title: "Heart", id: "heart", img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart_1.png" },
  ];

  const collectionsData = [
    {
      id: "emerald",
      heading: "Emerald Cut",
      subheading: "A rectangular step-cut with 57–58 facets, reflecting light in a sleek hall-of-mirrors pattern.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Emerald_c98cb278-2d4c-4f9e-bcee-1a3ff4d37015.png",
      collection: "solitaires-emerald",
      buttonText: "SHOP NOW",
      reverse: false,
    },
    {
      id: "oval",
      heading: "Oval Cut",
      subheading: "An elongated ellipse with 56–58 facets, sparkling brilliantly along its graceful curves.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Oval_c065fa59-af20-4b9a-9b64-e91450102e81.png",
      collection: "solitaires-oval",
      buttonText: "SHOP NOW",
      reverse: true,
    },
    {
      id: "cushion",
      heading: "Cushion Cut",
      subheading: "A square with softly rounded corners, 58–64 facets, radiating a warm classic sparkle.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cushion_d2a0cd2a-f35a-4cb8-a1a6-4e0faede2f3c.png",
      collection: "solitaires-cushion",
      buttonText: "SHOP NOW",
      reverse: false,
    },
    {
      id: "round",
      heading: "Round Cut",
      subheading: "A timeless circle with 56–58 facets that catches light from every direction.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Round_508da8a8-977a-4fee-9054-d2a7248e0884.png",
      collection: "round-diamond",
      buttonText: "SHOP NOW",
      reverse: true,
    },
    {
      id: "princess",
      heading: "Princess Cut",
      subheading: "Sleek square design with pointed corners and 57–76 facets, reflecting a striking and fiery sparkle.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Princess_c0bdc38a-a28d-4f65-9ea5-e3ef6cb440c8.png",
      collection: "solitaires-princess",
      buttonText: "SHOP NOW",
      reverse: false,
    },
    {
      id: "pear",
      heading: "Pear Cut",
      subheading: "A graceful blend of round and marquise shapes, forming a teardrop with 56–58 facets.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pear.png",
      collection: "solitaires-pear",
      buttonText: "SHOP NOW",
      reverse: true,
    },
    {
      id: "marquise",
      heading: "Marquise Cut",
      subheading: "An elongated oval with pointed ends, 56–58 facets sparkling with elegant brilliance.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Marquise.png",
      collection: "solitaires-marquise",
      buttonText: "SHOP NOW",
      reverse: false,
    },
    {
      id: "heart",
      heading: "Heart Cut",
      subheading: "A symbol of love with 56–58 facets, heart-shaped diamonds make a meaningful and romantic statement.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Heart.png",
      collection: "solitaires-heart",
      buttonText: "SHOP NOW",
      reverse: true,
    },
  ];

  const faqsData = [
    {
      question: "Which diamond shape looks the largest?",
      answer: "<p>Elongated shapes like oval, marquise and pear often appear larger due to their stretched silhouettes.</p>"
    },
    {
      question: "Are certain diamond shapes more durable?",
      answer: "<p>Shapes with rounded edges, such as round and oval are generally more durable than pointed styles<br/><br/></p>"
    },
    {
      question: "How do I choose the right diamond shape",
      answer: "<p>Consider your personal style, hand shape, lifestyle and how bold or classic you want the look.</p>"
    },
    {
      question: "Are some diamond shapes better for everyday wear?",
      answer: "<p>Yes. Shapes without sharp corners such as round, oval and cushion, are better suited for daily wear.</p>"
    },
    {
      question: "Does diamond shape affect visibility of inclusions?",
      answer: "<p>Yes. Step-cut shapes like Emerald and Asscher show inclusions more easily than brilliant cuts.</p>"
    },
    {
      question: "Can the same carat weight look different across shapes?",
      answer: "<p>Yes. Different shapes distribute weight differently, which can change how large the diamond appears</p>"
    }
  ];

  return (
    <div className="w-full bg-white font-figtree">
      {/* ------------------------------------------------------------------ */}
      {/* BANNER */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative w-full h-[535px] md:h-[605px] flex items-end justify-center bg-cover bg-center bg-no-repeat
          bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Mobile_20Banner.png?v=1766751093')]
          md:bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Banner_jpg_3ff8f3ed-a047-46c0-b322-c7d4cf4d07f7.jpg?v=1778149414')]"
      >
        <div className="absolute inset-0 bg-black/0 z-10" />
        <div className="relative z-20 text-center text-white p-5 pb-[10px] md:pb-[20px] max-w-[800px] mb-[10px] md:mb-[20px]">
          <h1 className="font-abhaya text-[28px] md:text-[36px] font-medium leading-tight mb-3">
            Types of Diamond Shapes
          </h1>
          <p className="text-[18px] md:text-[20px]">
            Explore diamond shapes to find the one that reflects your style.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SHAPE NAVIGATION GRID */}
      {/* ------------------------------------------------------------------ */}
      <ShapeGrid shapes={shapesData} />

      {/* ------------------------------------------------------------------ */}
      {/* COLLECTION SECTIONS (banner + products) */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full overflow-hidden">
        {collectionsData.map((section, index) => (
          <CollectionBanner key={section.id} section={section} />
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-[800px] mx-auto my-12 md:my-16 px-6">
        <div className="text-center mb-8">
          <span className="block w-10 h-[2px] bg-[#B77767] mx-auto mb-4" />
          <h2 className="font-abhaya text-[28px] md:text-[36px] text-[#5A413F]">
            FAQ&apos;S
          </h2>
        </div>
        <div className="flex flex-col border-t border-[#e8e2e0]">
          {faqsData.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>
    </div>
  );
}