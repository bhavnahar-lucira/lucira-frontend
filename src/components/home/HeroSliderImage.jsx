"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";
import Link from "next/link";
import { getImageProps } from "next/image";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slideData = [
  { name: "Birthday", alt: "Birthday", url: "/collections/birthday-gifts" },
  { name: "Eterna-Band", alt: "Eterna Band Collection", url: "/collections/eterna" },
  { name: "NineKT", alt: "9KT Collection", url: "/collections/9kt-collection" },
];

export default function HeroBanner() {
  const id = useId().replace(/:/g, "");
  const paginationElClass = `pagination-${id}`;
  
  const bannerHeightClasses = "h-auto aspect-4/5 md:aspect-auto md:h-[calc(100dvh-14rem)] md:min-h-[450px]";

  return (
    <div className="w-full bg-white">
      <div className={`relative w-full overflow-hidden group ${bannerHeightClasses}`}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation={{ nextEl: ".hero-next", prevEl: ".hero-prev" }}
          pagination={{
            el: `.${paginationElClass}`,
            clickable: true,
            renderBullet: (index, className) => {
              return `<span class="${className} w-2! h-2! rounded-full! bg-gray-700! transition-all duration-300 [&.swiper-pagination-bullet-active]:bg-primary! [&.swiper-pagination-bullet-active]:w-6! md:[&.swiper-pagination-bullet-active]:w-6!"></span>`;
            },
          }}
          className="h-full w-full"
        >
          {slideData.map((slide, index) => {
            const common = { 
              alt: slide.alt, 
              fill: true, 
              priority: index === 0,
              sizes: "100vw",
              className: "object-cover object-center" 
            };

            const { props: { srcSet: desktop } } = getImageProps({
              ...common,
              src: `/images/heroslider/${slide.name}-Desktop.jpg`,
            });

            const { props: { srcSet: mobile, ...rest } } = getImageProps({
              ...common,
              src: `/images/heroslider/${slide.name}-Mobile.jpg`,
            });

            return (
              <SwiperSlide key={slide.name}>
                <Link href={slide.url} className="block w-full h-full">
                  <div className="relative w-full h-full">
                    <picture>
                      <source media="(min-width: 1025px)" srcSet={desktop} />
                      <source media="(max-width: 1024px)" srcSet={mobile} />
                      <img 
                        {...rest}
                        className="w-full h-full object-cover object-center"
                      />
                    </picture>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
        
        <button className="hero-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white transition-all">
          <ChevronLeft size={24} className="text-black" />
        </button>
        <button className="hero-next absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white transition-all">
          <ChevronRight size={24} className="text-black" />
        </button>

        <div className="absolute bottom-4 left-0 right-0 z-20 md:bottom-8">
          <div className={`${paginationElClass} flex items-center justify-center gap-2`}></div>
        </div>
      </div>
    </div>
  );
}