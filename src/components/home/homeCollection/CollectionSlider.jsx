"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
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

export default function CollectionSlider ({ products = [], loading = false, collectionHandle }) {
  const displayProducts = products;  const id = useId().replace(/:/g, "");
  const isDesktop = useMediaQuery("(min-width: 1025px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  
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
        <Swiper
          modules={[Navigation, Pagination, FreeMode, Autoplay]}
          spaceBetween={12}
          slidesPerView={2}
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
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 16 },
            1280: { slidesPerView: 4, spaceBetween: 16, freeMode: false },
          }}
          className="w-full overflow-visible! collection-swiper"
        >
          {displayProducts.map((product, idx) => (
            <SwiperSlide key={product.id}>
              <ProductCard 
                product={product} 
                index={idx + 1} 
                collectionHandle={collectionHandle}
              />
            </SwiperSlide>
          ))}
        </Swiper>

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
