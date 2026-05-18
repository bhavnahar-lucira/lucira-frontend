"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { useState, useId } from "react";

export function ProductSlider({ title, subtitle, products = [], preservePriceOnColorChange = false }) {
  const [swiper, setSwiper] = useState(null);
  const id = useId().replace(/:/g, "");

  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <section className="w-full bg-white overflow-hidden mt-15">
      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h2 className="text-28px font-bold mb-2">{title}</h2>}
            {subtitle && <p className="text-base text-gray-600">{subtitle}</p>}
          </div>
        )}

        <div className="relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={12}
            slidesPerView={2}
            onSwiper={setSwiper}
            onSlideChange={(swiper) => {
                const progress = (swiper.activeIndex / (swiper.slides.length - swiper.params.slidesPerView)) * 100;
                const bar = document.getElementById(`progress-bar-slider-${id}`);
                if (bar) bar.style.width = `${Math.min(100, Math.max(0, progress + (100 / swiper.slides.length)))}%`;
            }}
            navigation={{
                nextEl: `.next-${id}`,
                prevEl: `.prev-${id}`,
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 24 },
              1024: { slidesPerView: 3, spaceBetween: 16 },
              1280: { slidesPerView: 4, spaceBetween: 16 },
            }}
            className="w-full"
          >
            {products.map((product, idx) => (
              <SwiperSlide key={product.shopifyId || product.id || product.handle || idx}>
                <ProductCard
                  product={product}
                  index={idx + 1}
                  fixedPrice={preservePriceOnColorChange ? product.price : undefined}
                  fixedComparePrice={preservePriceOnColorChange ? (product.compare_price || product.compareAtPrice) : undefined}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation & Progress Controls */}
          <div className="flex justify-between items-center mt-8 md:mt-12 px-1">
            {/* Progress Bar */}
            <div className="flex-1 max-w-[120px] md:max-w-[200px] h-[2px] bg-zinc-100 relative overflow-hidden">
                <div 
                id={`progress-bar-slider-${id}`}
                className="absolute top-0 left-0 h-full bg-[#5B4740] transition-all duration-300"
                style={{ width: `${100 / products.length}%` }}
                />
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                className={`prev-${id} w-9 h-9 md:w-12 md:h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-all text-zinc-400 hover:border-black hover:text-white disabled:opacity-30`}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                className={`next-${id} w-9 h-9 md:w-12 md:h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-all text-zinc-400 hover:border-black hover:text-white disabled:opacity-30`}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
