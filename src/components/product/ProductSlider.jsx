"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { useId } from "react";

export function ProductSlider({ title, subtitle, products = [], preservePriceOnColorChange = false, collectionHandle, disableLastViewed = false }) {
  const id = useId().replace(/:/g, "");

  if (!Array.isArray(products) || products.length === 0) return null;

  const prevElClass = `prev-${id}`;
  const nextElClass = `next-${id}`;
  const paginationElClass = `pagination-${id}`;

  return (
    <section className="w-full bg-white overflow-hidden mt-10 md:mt-15">
      <div className="max-w-480 mx-auto px-5 md:px-17">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>}
            {subtitle && <p className="text-sm md:text-base text-gray-600">{subtitle}</p>}
          </div>
        )}

        <div className="relative">
          <Swiper
            key={products.map(p => p.id || p.shopifyId || p.handle).join('-')}
            modules={[Navigation, Pagination, FreeMode, Autoplay]}
            spaceBetween={12}
            slidesPerView={2}
            grabCursor={true}
            speed={500}
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
              640: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 3, spaceBetween: 16 },
              1280: { slidesPerView: 4, spaceBetween: 16 },
            }}
            className="w-full collection-swiper"
          >
            {products.map((product, idx) => (
              <SwiperSlide key={product.shopifyId || product.id || product.handle || idx}>
                <ProductCard
                  product={product}
                  index={idx + 1}
                  collectionHandle={collectionHandle}
                  fixedPrice={preservePriceOnColorChange ? product.price : undefined}
                  fixedComparePrice={preservePriceOnColorChange ? (product.compare_price || product.compareAtPrice) : undefined}
                  disableLastViewed={disableLastViewed}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation & Progress Controls */}
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
    </section>
  );
}
