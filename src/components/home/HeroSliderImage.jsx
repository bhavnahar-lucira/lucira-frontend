"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";
import Link from "next/link";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
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

  // Check if there is any video in the data
  const videoSlide = initialData.find(slide => slide.type === 'video');

  // If a video is present, show ONLY the first video and remove Swiper
  if (videoSlide) {
    return (
      <div className="w-full bg-white">
        <div className={`relative w-full overflow-hidden ${bannerHeightClasses}`}>
          <Link 
            prefetch={false} 
            href={videoSlide.url || '/'} 
            className="block w-full h-full"
            onClick={() => handleBannerClick(videoSlide)}
          >
            <div className="relative w-full h-full">
              {/* Desktop Video */}
              <video
                src={videoSlide.desktopImage}
                autoPlay
                loop
                muted
                playsInline
                className="hidden lg:block w-full h-full object-cover object-center"
              />
              {/* Mobile Video */}
              <video
                src={videoSlide.mobileImage || videoSlide.desktopImage}
                autoPlay
                loop
                muted
                playsInline
                className="block lg:hidden w-full h-full object-cover object-center"
              />

              {/* Text Overlay */}
              {(videoSlide.title || videoSlide.subtitle) && (
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-12 bg-black/5">
                  <div className="text-center text-white px-4">
                    {videoSlide.title && (
                      <h2 className="text-3xl md:text-5xl font-semibold uppercase tracking-[1px] mb-4 drop-shadow-2xl font-abhaya">
                        {videoSlide.title}
                      </h2>
                    )}
                    {videoSlide.subtitle && (
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] underline underline-offset-[12px] decoration-white/60 hover:decoration-white transition-all drop-shadow-xl cursor-pointer">
                        {videoSlide.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
    );
  }

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
                  {/* Desktop Image */}
                  <div className="hidden lg:block relative w-full h-full">
                    <Image
                      loader={shopifyLoader}
                      src={slide.desktopImage}
                      alt={slide.alt || slide.name || "Hero Banner"}
                      fill
                      priority={index === 0}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="object-cover object-center"
                      sizes="(max-width: 480px) 450px, (max-width: 576px) 560px, (max-width: 768px) 600px, (max-width: 992px) 800px, (max-width: 1200px) 1000px, (max-width: 1440px) 1400px, (max-width: 1600px) 1600px, 2000px"
                      draggable={false}
                    />
                  </div>

                  {/* Mobile Image */}
                  <div className="block lg:hidden relative w-full h-full">
                    <Image
                      loader={shopifyLoader}
                      src={slide.mobileImage || slide.desktopImage}
                      alt={slide.alt || slide.name || "Hero Banner Mobile"}
                      fill
                      priority={index === 0}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="object-cover object-center"
                      sizes="(max-width: 480px) 450px, (max-width: 576px) 560px, (max-width: 768px) 600px, (max-width: 992px) 800px, (max-width: 1200px) 1000px, (max-width: 1440px) 1400px, (max-width: 1600px) 1600px, 2000px"
                      draggable={false}
                    />
                  </div>

                  {/* Text Overlay for Image Slides */}
                  {(slide.title || slide.subtitle) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-24 bg-black/5 z-10">
                      <div className="text-center text-white px-4">
                        {slide.title && (
                          <h2 className="text-3xl md:text-5xl font-semibold uppercase tracking-[0.1em] mb-4 drop-shadow-2xl font-abhaya">
                            {slide.title}
                          </h2>
                        )}
                        {slide.subtitle && (
                          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] underline underline-offset-[12px] decoration-white/60 hover:decoration-white transition-all drop-shadow-xl cursor-pointer">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
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
