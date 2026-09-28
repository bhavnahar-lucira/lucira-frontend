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

export default function HeroBanner({ initialData = [], surface = "homepage" }) {
  const id = useId().replace(/:/g, "");
  const paginationElClass = `pagination-${id}`;
  const bannerHeightClasses = "w-full h-auto";

  const banners = initialData;

  const handleBannerClick = (slide) => {
    pushPromoClick({
      creative_name: `${surface} banner ${slide.type === 'video' ? 'videos' : 'images'} clicked`,
      location_id: surface,
      promo_id: slide.alt || slide.name,
      promo_name: slide.name,
    });
  };

  const handleSlideChange = (swiper) => {
    if (!swiper || !swiper.slides) return;
    const activeSlide = swiper.slides[swiper.activeIndex];
    if (activeSlide) {
      const videos = activeSlide.querySelectorAll("video");
      videos.forEach((vid) => {
        if (vid.paused) {
          vid.play().catch(() => {});
        }
      });
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-full bg-white">
      <div className={`relative w-full overflow-hidden group ${bannerHeightClasses}`}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          loop={banners.length > 1}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
          }}
          navigation={{
            nextEl: `.hero-next-${id}`,
            prevEl: `.hero-prev-${id}`,
          }}
          pagination={{
            el: `.${paginationElClass}`,
            clickable: true,
            renderBullet: (index, className) => {
              return `<span class="${className} lucira-dot"></span>`;
            },
          }}
          onSlideChange={handleSlideChange}
          className="w-full"
        >
          {banners.map((slide, index) => {
            const isVideo =
              slide.type === "video" ||
              Boolean(slide.desktopVideo && !slide.desktopImage) ||
              (typeof slide.desktopImage === "string" &&
                (slide.desktopImage.endsWith(".mp4") ||
                  slide.desktopImage.endsWith(".webm") ||
                  slide.desktopImage.includes("/video/")));

            const desktopVideoSrc =
              slide.desktopVideo || (isVideo ? slide.desktopImage : "");
            const mobileVideoSrc =
              slide.mobileVideo ||
              (isVideo ? slide.mobileImage : "") ||
              desktopVideoSrc;

            const desktopPoster =
              slide.desktopPoster ||
              slide.desktopPosterImage ||
              slide.posterImage ||
              "";
            const mobilePoster =
              slide.mobilePoster ||
              slide.mobilePosterImage ||
              desktopPoster ||
              "";

            const hasLink = Boolean(
              slide.url &&
                typeof slide.url === "string" &&
                slide.url.trim() !== "" &&
                slide.url !== "#"
            );

            const SlideContent = (
              <div className="relative w-full overflow-hidden">
                {/* Desktop view (1920x823 aspect ratio matches all desktop banners) */}
                <div className="hidden lg:block w-full aspect-[1920/823] relative overflow-hidden bg-black/5">
                  {isVideo ? (
                    <video
                      src={desktopVideoSrc}
                      poster={desktopPoster || undefined}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover object-top block"
                    />
                  ) : (
                    <Image
                      loader={shopifyLoader}
                      src={slide.desktopImage}
                      alt={slide.alt || slide.name || "Hero Banner"}
                      width={1920}
                      height={823}
                      priority={index === 0}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover object-center block"
                      sizes="100vw"
                      draggable={false}
                    />
                  )}
                </div>

                {/* Mobile view (1080x1350 aspect ratio matches all mobile banners) */}
                <div className="block lg:hidden w-full aspect-[1080/1350] relative overflow-hidden bg-black/5">
                  {isVideo ? (
                    <video
                      src={mobileVideoSrc}
                      poster={mobilePoster || undefined}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover object-top block"
                    />
                  ) : (
                    <Image
                      loader={shopifyLoader}
                      src={slide.mobileImage || slide.desktopImage}
                      alt={slide.alt || slide.name || "Hero Banner Mobile"}
                      width={1080}
                      height={1350}
                      priority={index === 0}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover object-center block"
                      sizes="100vw"
                      draggable={false}
                    />
                  )}
                </div>

                {/* Text Overlay in Bottom Center - ONLY for Video Banners */}
                {isVideo && (slide.title || slide.subtitle) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 sm:pb-16 md:pb-20 pointer-events-none z-10 px-4">
                    {/* Soft gradient scrim at the bottom so text is always readable */}
                    <div className="absolute inset-x-0 bottom-0 h-44 md:h-64 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                    <div className="relative text-center text-white max-w-3xl mx-auto pointer-events-auto">
                      {slide.title && (
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-abhaya text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] mb-1.5 sm:mb-2 leading-tight tracking-tight uppercase">
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="font-figtree font-normal text-xs sm:text-sm md:text-base text-white/95 leading-[1.4] tracking-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] underline underline-offset-8 decoration-white/70 hover:decoration-white transition-all cursor-pointer inline-block">
                          {slide.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <SwiperSlide key={slide.id || index}>
                {hasLink ? (
                  <Link
                    prefetch={false}
                    href={slide.url}
                    className="block w-full cursor-pointer group"
                    onClick={() => handleBannerClick(slide)}
                  >
                    {SlideContent}
                  </Link>
                ) : (
                  <div className="block w-full">{SlideContent}</div>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Navigation Buttons */}
        {banners.length > 1 && (
          <>
            <button
              className={`hero-prev-${id} absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white transition-all duration-300 cursor-pointer`}
              aria-label="Previous banner"
            >
              <ChevronLeft size={24} className="text-black" />
            </button>

            <button
              className={`hero-next-${id} absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white transition-all duration-300 cursor-pointer`}
              aria-label="Next banner"
            >
              <ChevronRight size={24} className="text-black" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-20 md:bottom-8 flex justify-center pointer-events-none">
            <div
              className={`${paginationElClass} flex items-center justify-center gap-2 pointer-events-auto`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
