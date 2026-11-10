"use client";

import { useId } from "react";
import Link from "next/link";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { pushPromoClick } from "@/lib/gtm";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const DEFAULT_STORY_BANNERS = [
  {
    id: "story_toi_et_moi",
    title: "Toi et Moi",
    alt: "Toi et Moi Collection",
    url: "/collections/toi-et-moi",
    desktopImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Toi-et-moi_1089cd29-732d-419f-bfd3-99cf290db7a2.jpg?v=1793254010",
    mobileImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Toi-et-moi-Mobile.jpg?v=1793254010",
    active: true,
  },
];

export default function StoryBannerSection({ initialData = null }) {
  const id = useId().replace(/:/g, "");

  if (initialData && initialData.enabled === false) {
    return null;
  }

  const rawBanners = Array.isArray(initialData?.banners) && initialData.banners.length > 0
    ? initialData.banners
    : DEFAULT_STORY_BANNERS;

  const banners = rawBanners.filter((b) => b.active !== false && (b.desktopImage || b.mobileImage));

  if (!banners || banners.length === 0) {
    return null;
  }

  const handleBannerClick = (banner, index) => {
    try {
      pushPromoClick({
        creative_name: "Homepage Story Banner",
        promo_id: String(banner.id || banner.url || ""),
        promo_name: banner.title || banner.alt || "Story Banner",
        promo_position: `Position ${index + 1}`,
        location_id: "homepage_after_bestsellers",
        source: "desktop_or_mobile_web",
      });
    } catch (_) {}
  };

  const renderBannerContent = (banner) => (
    <div className="relative w-full overflow-hidden">
      {/* Desktop view (1920x823 aspect ratio) */}
      <div className="hidden md:block w-full aspect-[1920/823] relative overflow-hidden bg-black/5">
        <Image
          loader={shopifyLoader}
          src={banner.desktopImage || banner.mobileImage}
          alt={banner.alt || banner.title || "Story Banner"}
          width={1920}
          height={823}
          loading="lazy"
          className="w-full h-full object-cover object-center block group-hover:scale-[1.01] transition-transform duration-500"
          sizes="100vw"
          draggable={false}
        />
      </div>

      {/* Mobile view (1080x1350 aspect ratio / 4:5) */}
      <div className="block md:hidden w-full aspect-[1080/1350] relative overflow-hidden bg-black/5">
        <Image
          loader={shopifyLoader}
          src={banner.mobileImage || banner.desktopImage}
          alt={banner.alt || banner.title || "Story Banner Mobile"}
          width={1080}
          height={1350}
          loading="lazy"
          className="w-full h-full object-cover object-center block"
          sizes="100vw"
          draggable={false}
        />
      </div>
    </div>
  );

  // If single banner, render directly without swiper overhead
  if (banners.length === 1) {
    const banner = banners[0];
    const hasLink = Boolean(banner.url && banner.url.trim() !== "" && banner.url !== "#");

    return (
      <section className="w-full overflow-hidden" style={{ marginTop: "50px", marginBottom: 0 }} aria-label="Story Banner">
        {hasLink ? (
          <Link
            prefetch={false}
            href={banner.url}
            className="block w-full cursor-pointer group"
            onClick={() => handleBannerClick(banner, 0)}
          >
            {renderBannerContent(banner)}
          </Link>
        ) : (
          <div className="block w-full">{renderBannerContent(banner)}</div>
        )}
      </section>
    );
  }

  // Multiple banners: Swiper slider
  return (
    <section className="w-full relative overflow-hidden group/slider" style={{ marginTop: "50px", marginBottom: 0 }} aria-label="Story Banners">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        loop={banners.length > 1}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation={{
          prevEl: `.story-prev-${id}`,
          nextEl: `.story-next-${id}`,
        }}
        pagination={{
          el: `.story-pagination-${id}`,
          clickable: true,
          renderBullet: (index, className) => (
            `<span class="${className} !w-2 !h-2 sm:!w-2.5 sm:!h-2.5 !bg-black/30 !opacity-100 [&.swiper-pagination-bullet-active]:!bg-[#5A413F] [&.swiper-pagination-bullet-active]:!w-6 sm:[&.swiper-pagination-bullet-active]:!w-8 !rounded-full !transition-all !duration-300"></span>`
          ),
        }}
        className="w-full h-auto"
      >
        {banners.map((banner, index) => {
          const hasLink = Boolean(banner.url && banner.url.trim() !== "" && banner.url !== "#");

          return (
            <SwiperSlide key={banner.id || index}>
              {hasLink ? (
                <Link
                  prefetch={false}
                  href={banner.url}
                  className="block w-full cursor-pointer group"
                  onClick={() => handleBannerClick(banner, index)}
                >
                  {renderBannerContent(banner)}
                </Link>
              ) : (
                <div className="block w-full">{renderBannerContent(banner)}</div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Navigation Arrows for desktop */}
      <button
        className={`story-prev-${id} absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-11 h-11 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white text-ink transition-all duration-300 opacity-0 group-hover/slider:opacity-100 cursor-pointer`}
        aria-label="Previous story banner"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        className={`story-next-${id} absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-11 h-11 rounded-full bg-white/80 items-center justify-center shadow-md hover:bg-white text-ink transition-all duration-300 opacity-0 group-hover/slider:opacity-100 cursor-pointer`}
        aria-label="Next story banner"
      >
        <ChevronRight size={22} />
      </button>

      {/* Pagination bullets */}
      <div className={`story-pagination-${id} flex justify-center items-center gap-1.5 mt-3 z-10`} />
    </section>
  );
}
