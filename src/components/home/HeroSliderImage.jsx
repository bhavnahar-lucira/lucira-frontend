"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";
import Link from "next/link";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slideData = [
  {
    name: "Baarish",
    alt: "Baarish",
    url: "/collections/jewelry",
  },
  {
    name: "9KT",
    alt: "9KT Collection",
    url: "/collections/9kt-collection",
  },
  {
    name: "Solitaire",
    alt: "Solitaire Twist Ring",
    url: "/products/modern-round-solitaire-ring",
  },
];

export default function HeroBanner() {
  const id = useId().replace(/:/g, "");
  const paginationElClass = `pagination-${id}`;

  const bannerHeightClasses =
    "h-auto aspect-4/5 md:aspect-auto md:h-[calc(100dvh-14rem)] md:min-h-[450px]";

  return (
    <div className="w-full bg-white">
      <div
        className={`relative w-full overflow-hidden group ${bannerHeightClasses}`}
      >
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          navigation={{
            nextEl: ".hero-next",
            prevEl: ".hero-prev",
          }}
          pagination={{
            el: `.${paginationElClass}`,
            clickable: true,
            renderBullet: (index, className) => {
              return `
                <span class="${className} w-2! h-2! rounded-full! bg-gray-700! transition-all duration-300 [&.swiper-pagination-bullet-active]:bg-primary! [&.swiper-pagination-bullet-active]:w-6! md:[&.swiper-pagination-bullet-active]:w-6!"></span>
              `;
            },
          }}
          className="h-full w-full"
        >
          {slideData.map((slide, index) => (
            <SwiperSlide key={slide.name}>
              <Link prefetch={false} href={slide.url} className="block w-full h-full">
                <div className="relative w-full h-full">
                  <picture>
                    {/* Desktop Image */}
                    <source
                      media="(min-width: 1024px)"
                      srcSet={`https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_homeSlider-${slide.name}-Desktop.jpg`}
                    />

                    {/* Mobile Image */}
                    <img
                      src={`https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_homeSlider-${slide.name}-Mobile.jpg`}
                      alt={slide.alt}
                      className="w-full h-full object-cover object-center"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      draggable={false}
                    />
                  </picture>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
        <button className="hero-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white transition-all duration-300">
          <ChevronLeft size={24} className="text-black" />
        </button>

        <button className="hero-next absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white transition-all duration-300">
          <ChevronRight size={24} className="text-black" />
        </button>

        {/* Pagination */}
        <div className="absolute bottom-4 left-0 right-0 z-20 md:bottom-8">
          <div
            className={`${paginationElClass} flex items-center justify-center gap-2`}
          />
        </div>
      </div>
    </div>
  );
}
