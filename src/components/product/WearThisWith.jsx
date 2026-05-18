import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useId } from "react";
import ProductCard from "./ProductCard";

export default function WearThisWith({ products = [] }) {
  const [swiper, setSwiper] = useState(null);
  const id = useId().replace(/:/g, "");

  if (!products || products.length === 0) return null;

  return (
    <div className="pt-4 border-t border-gray-100 overflow-hidden">
      <h2 className="text-lg font-semibold text-black mb-4 capitalize tracking-wide font-abhaya">Wear This With:</h2>      
      <div className="relative">
        <Swiper
          modules={[Navigation]}
          spaceBetween={12}
          slidesPerView={2}
          onSwiper={setSwiper}
          onSlideChange={(swiper) => {
            const progress = (swiper.activeIndex / (swiper.slides.length - swiper.params.slidesPerView)) * 100;
            const bar = document.getElementById(`progress-bar-wear-${id}`);
            if (bar) bar.style.width = `${Math.min(100, Math.max(0, progress + (100 / swiper.slides.length)))}%`;
          }}
          navigation={{
            nextEl: `.next-wear-${id}`,
            prevEl: `.prev-wear-${id}`,
          }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 2.2, spaceBetween: 24 },
          }}
          className="w-full"
        >
          {products.map((product, idx) => (
            <SwiperSlide key={product.id || product.shopifyId}>
               <ProductCard product={product} index={idx + 1} singleStarRating={true} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation & Progress Controls */}
        <div className="flex justify-between items-center mt-8 px-1">
          {/* Progress Bar */}
          <div className="flex-1 max-w-[100px] md:max-w-[150px] h-[2px] bg-zinc-100 relative overflow-hidden">
            <div 
              id={`progress-bar-wear-${id}`}
              className="absolute top-0 left-0 h-full bg-[#5B4740] transition-all duration-300"
              style={{ width: `${100 / products.length}%` }}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className={`prev-wear-${id} w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-all text-zinc-400 hover:border-black hover:text-white`}>
              <ChevronLeft size={18} />
            </button>
            <button className={`next-wear-${id} w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-all text-zinc-400 hover:border-black hover:text-white`}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
