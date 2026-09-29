"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import Image from "next/image";
import { useId } from "react";
import { useMediaQuery } from '@/hooks/useMediaQuery';

const SkeletonCard = () => (
  <div className="space-y-4 animate-pulse">
    <div className="aspect-square w-full bg-gray-100 rounded-lg" />
    <div className="space-y-3 px-1">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="h-6 bg-gray-100 rounded w-1/3 mt-6" />
    </div>
  </div>
);

// `leadImage` ({ src, alt }) pins an editorial image in a fixed first column,
// the full height of the product cards that slide beside it. Sections that omit it are unchanged.
export default function CollectionSlider ({ products = [], loading = false, collectionHandle, priorityCount = 0, promoClickMeta = null, leadImage = null }) {
  const displayProducts = products;  const id = useId().replace(/:/g, "");
  const isDesktop = useMediaQuery("(min-width: 1025px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const hasLead = Boolean(leadImage?.src);

  // Shared by the loaded and loading layouts so the image never jumps. Widths
  // and gaps mirror the Swiper breakpoints below: the column is one card wide.
  const leadColumn = hasLead && (
    <div className="relative shrink-0 overflow-hidden rounded-lg bg-gray-100 w-[calc((100%-12px)/2)] sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-32px)/3)] xl:w-[calc((100%-48px)/4)]">
      <Image
        src={leadImage.src}
        alt={leadImage.alt || ""}
        fill
        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
        className="object-cover"
        priority={priorityCount > 0}
      />
    </div>
  );

  if (loading && hasLead) {
    // One card per visible slider column; extras hidden by CSS so the count
    // is right on first paint, before any media-query hook has run.
    const visibility = ["", "hidden lg:block", "hidden xl:block"];
    return (
      <div className="flex items-stretch gap-3 sm:gap-5 lg:gap-4 w-full py-4">
        {leadColumn}
        <div className="min-w-0 flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 lg:gap-4">
          {visibility.map((cls, i) => (
            <div key={i} className={cls}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    const cols = isDesktop ? 4 : isTablet ? 3 : 2;
    const skeletonCount = cols;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full py-4">
        {[...Array(skeletonCount)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!displayProducts || displayProducts.length === 0) return null;
  
  const prevElClass = `prev-${id}`;
  const nextElClass = `next-${id}`;
  const paginationElClass = `pagination-${id}`;

  return (
    <>
      <div className="relative">
        {/* With a lead image the image holds the first column and never moves;
            only the product cards slide, one fewer per view so they keep the
            same width. Gaps and column widths mirror the Swiper breakpoints. */}
        <div className={hasLead ? "flex items-stretch gap-3 sm:gap-5 lg:gap-4" : ""}>
        {leadColumn}
        {/* Clip only the left edge so sliding cards pass under the image
            column, while the right edge still peeks past the container. */}
        <div className={hasLead ? "min-w-0 flex-1 [clip-path:inset(0_-100vw_0_0)]" : ""}>
        <Swiper
          key={products.map(p => p.id || p.shopifyId || p.handle).join('-')}
          modules={[Navigation, Pagination, FreeMode, Autoplay]}
          spaceBetween={12}
          slidesPerView={hasLead ? 1 : 2}
          grabCursor={true}
          speed={500}
          touchRatio={1.5}
          resistanceRatio={0.7}
          freeMode={{
            enabled: true,
            sticky: true,
          }}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            el: `.${paginationElClass}`,
            type: 'progressbar',
          }}
          navigation={{
            nextEl: `.${nextElClass}`,
            prevEl: `.${prevElClass}`,
          }}
          breakpoints={{
            640: { slidesPerView: hasLead ? 1 : 2, spaceBetween: 20 },
            1024: { slidesPerView: hasLead ? 2 : 3, spaceBetween: 16 },
            1280: { slidesPerView: hasLead ? 3 : 4, spaceBetween: 16, freeMode: false },
          }}
          className="w-full overflow-visible! collection-swiper"
        >
          {displayProducts.map((product, idx) => (
            <SwiperSlide key={product.id}>
              <ProductCard
                product={product}
                index={idx + 1}
                collectionHandle={collectionHandle}
                priority={idx < priorityCount}
                promoClickMeta={promoClickMeta}
                /* No Try At Home / Virtual Try-On / Chat here. This slider is the
                   homepage's product sections, where the job is to move the
                   shopper into a collection, not to start a booking off a tile
                   they have only just scrolled past. */
                disableCtas
              />
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
        </div>

        {/* Navigation & Progress Controls (Updated for tracker design) */}
        <div className="flex justify-between items-center mt-8 md:mt-10 px-1">
          {/* Custom Tracker Pagination */}
          <div className="flex-grow max-w-[120px] md:max-w-[200px] relative">
            <div className={`${paginationElClass} swiper-pagination-tracker`} />
          </div>
          
          <div className="flex items-center gap-3">
            <button className={`${prevElClass} w-10 h-10 md:w-12 md:h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black transition-all text-zinc-400 hover:border-black hover:text-white`}>
              <ChevronLeft size={20} className="md:w-6 md:h-6" />
            </button>
            <button className={`${nextElClass} w-10 h-10 md:w-12 md:h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black transition-all text-zinc-400 hover:border-black hover:text-white`}>
              <ChevronRight size={20} className="md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>  
      <style jsx global>{`
        .swiper-pagination-tracker {
            position: relative !important;
            width: 100% !important;
            height: 2px !important;
            background: #E5E7EB !important;
            border-radius: 1px !important;
        }

        .swiper-pagination-tracker .swiper-pagination-progressbar-fill {
            background: #5B4740 !important;
        }
      `}</style>
    </>
  );
}
