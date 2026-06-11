"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";
import Link from "next/link";
import { pushPromoClick } from "@/lib/gtm";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function HeroBanner({ initialData = [] }) {
  const id = useId().replace(/:/g, "");
  const paginationElClass = `pagination-${id}`;

  const bannerHeightClasses =
    "h-auto aspect-4/5 md:aspect-auto md:h-[calc(100dvh-14rem)] md:min-h-[450px]";

  const handleBannerClick = (slide) => {
    pushPromoClick({
      creative_name: "homepage banner images clicked",
      location_id: "homepage",
      promo_id: slide.alt || slide.name,
      promo_name: slide.name,
    });
  };

  if (!initialData || initialData.length === 0) return null;

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
          {initialData.map((slide, index) => (
            <SwiperSlide key={slide.id || index}>
              <Link 
                prefetch={false} 
                href={slide.url || '/'} 
                className="block w-full h-full"
                onClick={() => handleBannerClick(slide)}
              >
                <div className="relative w-full h-full">
                  {slide.type === 'video' ? (
                    <>
                      {/* Desktop Video */}
                      <video
                        src={slide.desktopImage}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="hidden lg:block w-full h-full object-cover object-center"
                      />
                      {/* Mobile Video */}
                      <video
                        src={slide.mobileImage || slide.desktopImage}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="block lg:hidden w-full h-full object-cover object-center"
                      />
                    </>
                  ) : (
                    <picture>
                      {/* Desktop Image */}
                      <source
                        media="(min-width: 1024px)"
                        srcSet={slide.desktopImage}
                      />

                      {/* Mobile Image */}
                      <img
                        src={slide.mobileImage || slide.desktopImage}
                        alt={slide.alt || slide.name}
                        className="w-full h-full object-cover object-center"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        draggable={false}
                      />
                    </picture>
                  )}
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
