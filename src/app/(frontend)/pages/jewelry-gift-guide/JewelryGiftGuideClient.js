"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCollectionProducts } from "@/lib/api";
import { giftGuideData } from "@/data/giftGuide";
import { resolveShopifyImage, resolveShopifyLink } from "@/utils/helpers";
import ProductCard from "@/components/product/ProductCard";
import LazyImage from "@/components/common/LazyImage";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { motion } from "framer-motion";

/* ================= COMPONENT LOGIC CONSOLIDATED ================= */

const BannerSection = ({ settings, isMobile }) => {
  const desktopImage = resolveShopifyImage(settings.background_image_desktop);
  const mobileImage = resolveShopifyImage(settings.background_image_mobile);
  const backgroundImage = isMobile && mobileImage ? mobileImage : desktopImage;
  const overlayColor = settings.overlay_color || "#000000";

  return (
    <section className="relative w-full overflow-hidden flex flex-col">
      <div className="relative w-full h-auto">
        {/* Background Image that dictates height */}
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt={settings.heading || "Banner"}
            className="w-full h-auto block object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-[60vh] bg-zinc-100" />
        )}

        {/* Overlay - 20% opacity */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(to top, ${overlayColor}33 0%, ${overlayColor}00 100%)`,
            backgroundColor: `${overlayColor}33`
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-x-0 bottom-0 z-20 text-center px-6 pb-8 md:pb-20 max-w-5xl mx-auto w-full"
        >
          {settings.heading && (
            <h1 className="text-[18px] md:text-[28px] font-black text-white mb-3 md:mb-4 font-abhaya tracking-tight drop-shadow-2xl uppercase">
              {settings.heading}
            </h1>
          )}
          {settings.subheading && (
            <p className="text-12px md:text-[18px] text-white/90 font-figtree font-medium tracking-widest max-w-3xl mx-auto drop-shadow-lg uppercase">
              {settings.subheading}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

const RichTextSection = ({ settings, blocks, blockOrder }) => {
  const paddingTop = settings.padding_top || 80;
  const paddingBottom = settings.padding_bottom || 80;

  return (
    <section
      className="w-full bg-white relative overflow-hidden border-b border-zinc-50"
      style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px` }}
    >
      <div className="max-w-360 w-[94%] md:w-[91%] mx-auto relative z-10">
        <div className="flex flex-col items-center text-center gap-6 md:gap-10">
          {blockOrder.map((blockId) => {
            const block = blocks[blockId];
            if (!block) return null;
            switch (block.type) {
              case "heading":
                return (
                  <h2 key={blockId} className="text-3xl md:text-6xl font-black font-abhaya text-zinc-900 leading-tight tracking-tight">
                    {block.settings.heading}
                  </h2>
                );
              case "caption":
                return (
                  <p key={blockId} className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-zinc-400 font-figtree">
                    {block.settings.caption}
                  </p>
                );
              case "text":
                return (
                  <div
                    key={blockId}
                    className="text-sm md:text-xl leading-relaxed text-zinc-600 font-figtree max-w-4xl font-light"
                    dangerouslySetInnerHTML={{ __html: block.settings.text }}
                  />
                );
              case "button":
                return (
                  <div key={blockId} className="flex gap-4 mt-4">
                    {block.settings.button_label && (
                      <Link
                        href={resolveShopifyLink(block.settings.button_link)}
                        className="px-10 py-4 bg-[#5B4740] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-[#4A3934] transition-all rounded-sm shadow-xl"
                      >
                        {block.settings.button_label}
                      </Link>
                    )}
                  </div>
                );
              default: return null;
            }
          })}
        </div>
      </div>
    </section>
  );
};

const CollectionSection = ({ settings, products = [], index }) => {
  const imageUrl = resolveShopifyImage(settings.image);
  const productsLimit = settings.products_limit || 4;
  const displayProducts = products.slice(0, productsLimit);
  const isReversed = index % 2 !== 0;
  const bgColor = index % 2 === 0 ? "bg-[#FAF7F5]" : "bg-white";

  return (
    <section className={`w-full ${bgColor} py-12 md:py-24 border-b border-zinc-50 overflow-hidden`}>
      <div className="max-w-360 w-[94%] md:w-[91%] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center mb-16">

          {/* Content Column - Larger area for text (7 columns) */}
          <div className={`lg:col-span-7 flex flex-col items-start gap-6 md:gap-8 ${isReversed ? "lg:order-2" : "lg:order-1"}`}>
            <div className="space-y-3">
              {/* <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#B77767] block font-figtree">
                Personality Edit {index + 1}
              </span> */}
              {settings.heading && (
                <h2 className="text-3xl md:text-5xl font-black font-abhaya text-zinc-900 leading-tight tracking-tight uppercase">
                  {settings.heading}
                </h2>
              )}
            </div>

            {settings.description && (
              <p className="text-sm md:text-lg text-zinc-600 leading-relaxed font-figtree font-light max-w-2xl">
                {settings.description}
              </p>
            )}

            {settings.button_text && (
              <Link
                href={resolveShopifyLink(settings.button_link)}
                className="group flex items-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-zinc-900 border-b-2 border-zinc-200 pb-2 hover:border-[#5B4740] transition-all duration-300"
              >
                {settings.button_text}
                <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            )}
          </div>

          {/* Image Column - Smaller image as requested (5 columns) */}
          <div className={`lg:col-span-5 relative aspect-[4/5] md:aspect-[4/3] lg:aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl ${isReversed ? "lg:order-1" : "lg:order-2"}`}>
            {imageUrl ? (
              <LazyImage
                src={imageUrl}
                alt={settings.heading || "Gift Guide Collection"}
                fill
                className="object-cover transition-transform duration-1000 hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            ) : (
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-300 font-abhaya text-xl italic">{settings.heading}</div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {displayProducts.length > 0 && (
          <div className="mt-12 md:mt-16">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
              {displayProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  collectionHandle={settings.collection}
                  index={idx + 1}
                />
              ))}
            </div>

            {settings.show_view_all && (
              <div className="mt-10 md:mt-16 flex justify-center">
                <Link
                  href={`/collections/${settings.collection}`}
                  className="px-10 py-4 bg-[#5B4740] text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#4A3934] transition-all rounded-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Explore More
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

/* ================= MAIN CLIENT COMPONENT ================= */

export default function JewelryGiftGuideClient() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sectionsWithProducts, setSectionsWithProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const sections = giftGuideData.order.map(key => giftGuideData.sections[key]);
        const collectionSections = sections.filter(s => s.type === "jewelry-gift-guide-section");

        const productResults = await Promise.all(
          collectionSections.map(s =>
            fetchCollectionProducts({ handle: s.settings.collection, limit: s.settings.products_limit || 4 })
              .catch(() => ({ products: [] }))
          )
        );

        let productIdx = 0;
        const updatedSections = sections.map(s => {
          if (s.type === "jewelry-gift-guide-section") {
            return { ...s, products: productResults[productIdx++].products };
          }
          return s;
        });

        setSectionsWithProducts(updatedSections);
      } catch (err) {
        console.error("Error loading gift guide data:", err);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
        <Loader2 className="animate-spin text-[#5B4740]" size={48} strokeWidth={1.5} />
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-[#5B4740]">Curating Gift Guides</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white">
      {sectionsWithProducts.map((section, idx) => {
        if (section.disabled) return null;

        const collectionIdx = sectionsWithProducts
          .filter(s => s.type === "jewelry-gift-guide-section" && !s.disabled)
          .indexOf(section);

        switch (section.type) {
          case "Store-main-banner":
            return <BannerSection key={idx} settings={section.settings} isMobile={isMobile} />;
          case "rich-text":
            return <RichTextSection key={idx} settings={section.settings} blocks={section.blocks} blockOrder={section.block_order} />;
          case "jewelry-gift-guide-section":
            return <CollectionSection key={idx} settings={section.settings} products={section.products} index={collectionIdx} />;
          default: return null;
        }
      })}

      {/* Footer CTA */}
      <section className="bg-[#5B4740] py-16 md:py-24 px-6 text-center text-white">
        <div className="max-w-360 w-[91%] mx-auto space-y-6 md:space-y-10">
          <h2 className="text-3xl md:text-6xl font-black font-abhaya tracking-tight uppercase leading-tight">Need Expert Advice?</h2>
          <p className="text-sm md:text-xl font-figtree font-light opacity-90 max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
            Let our diamond experts help you choose a piece that resonates with her unique spirit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/pages/contact-us" className="px-10 py-4 bg-white text-[#5B4740] text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-[#FAF7F5] transition-all rounded-sm shadow-2xl">
              Book a Consultation
            </Link>
            <Link href="/collections/all" className="px-10 py-4 bg-transparent border border-white/30 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all rounded-sm">
              Explore All Jewelry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}