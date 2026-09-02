"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LazyImage from "../common/LazyImage";
import shopifyLoader from "@/utils/shopifyLoader";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { apiFetch } from "@/lib/api";

import "swiper/css";
import "swiper/css/pagination";

const HOTSPOT_ICON =
  "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/curatedLooks-icon.svg";

/**
 * The look image is square — the design calls for an 860x860 asset, and both
 * columns are capped there so the whole section fits one screen. The dashboard's
 * placement canvas is square for the same reason: hotspot x/y are percentages of
 * the rendered box, so the two must agree or every pin drifts once object-cover
 * crops.
 */
const LOOK_ASPECT = "aspect-square";
const COLUMN_MAX = "max-w-[860px]";

/**
 * Side gutters that hold the prev/next arrows. The image and the text below it
 * both use this padding, so the title, spec and price line up under the image
 * rather than running out to the edge of the card beneath the arrows.
 */
const GUTTER = "px-9 sm:px-12";

/*
 * No zoom here on purpose. Product shots are framed inconsistently — measured
 * across one look's six products the subject filled anywhere from 21% to 87% of
 * a 1600x1600 frame:
 *
 *   ring            43% x 50%   margin 22.9%   safe up to 1.84x
 *   earrings        30% x 37%   margin 27.7%   safe up to 2.24x
 *   bracelet        66% x 21%   margin 17.2%   safe up to 1.52x
 *   pendant         47% x 63%   margin  0.0%   safe up to 1.00x
 *   necklace        87% x 87%   margin  5.0%   safe up to 1.11x
 *   men's bracelet  70% x 26%   margin 15.0%   safe up to 1.43x
 *
 * The pendant already touches its frame edge, so any uniform scale clips
 * something. Tightening the framing has to happen per product — either in the
 * source assets or as a stored per-product value — not as one CSS factor.
 */

function OfferBadge({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[#108548] bg-[#F0F9F4] rounded-full px-2 lg:px-3 py-1 w-fit">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 lg:w-5 lg:h-5 shrink-0">
        <path d="M8.7583 3.05392C8.91463 2.87933 9.10601 2.73967 9.31996 2.64406C9.53391 2.54844 9.76563 2.49902 9.99997 2.49902C10.2343 2.49902 10.466 2.54844 10.68 2.64406C10.8939 2.73967 11.0853 2.87933 11.2416 3.05392L11.825 3.70558C11.9917 3.89183 12.1982 4.03819 12.4291 4.13383C12.6601 4.22947 12.9096 4.27193 13.1591 4.25808L14.0341 4.20975C14.2682 4.19685 14.5023 4.23346 14.7212 4.31718C14.9402 4.40091 15.139 4.52988 15.3047 4.69566C15.4704 4.86144 15.5992 5.0603 15.6829 5.27927C15.7665 5.49824 15.803 5.73238 15.79 5.96642L15.7416 6.84058C15.7279 7.09003 15.7704 7.33936 15.8661 7.57016C15.9617 7.80095 16.108 8.00729 16.2941 8.17392L16.9458 8.75725C17.1205 8.91358 17.2603 9.10501 17.356 9.31904C17.4517 9.53307 17.5012 9.76488 17.5012 9.99933C17.5012 10.2338 17.4517 10.4656 17.356 10.6796C17.2603 10.8937 17.1205 11.0851 16.9458 11.2414L16.2941 11.8247C16.1079 11.9915 15.9615 12.1979 15.8659 12.4289C15.7703 12.6598 15.7278 12.9093 15.7416 13.1589L15.79 14.0339C15.8029 14.268 15.7663 14.5021 15.6825 14.721C15.5988 14.9399 15.4698 15.1387 15.3041 15.3044C15.1383 15.4701 14.9394 15.599 14.7204 15.6826C14.5015 15.7663 14.2673 15.8028 14.0333 15.7898L13.1591 15.7414C12.9097 15.7277 12.6604 15.7702 12.4296 15.8659C12.1988 15.9615 11.9924 16.1078 11.8258 16.2939L11.2425 16.9456C11.0861 17.1203 10.8947 17.2601 10.6807 17.3558C10.4666 17.4515 10.2348 17.5009 10.0004 17.5009C9.76594 17.5009 9.53412 17.4515 9.32009 17.3558C9.10606 17.2601 8.91463 17.1203 8.7583 16.9456L8.17497 16.2939C8.00825 16.1077 7.80178 15.9613 7.57083 15.8657C7.33989 15.77 7.09038 15.7276 6.8408 15.7414L5.9658 15.7898C5.73177 15.8027 5.49764 15.766 5.27871 15.6823C5.05978 15.5986 4.86098 15.4696 4.69528 15.3038C4.52957 15.1381 4.4007 14.9392 4.31708 14.7202C4.23346 14.5013 4.19696 14.2671 4.20997 14.0331L4.2583 13.1589C4.27203 12.9095 4.2295 12.6601 4.13387 12.4293C4.03823 12.1986 3.89194 11.9922 3.7058 11.8256L3.05414 11.2422C2.87941 11.0859 2.73964 10.8945 2.64394 10.6805C2.54824 10.4664 2.49878 10.2346 2.49878 10.0002C2.49878 9.76572 2.54824 9.5339 2.64394 9.31987C2.73964 9.10584 2.87941 8.91441 3.05414 8.75808L3.7058 8.17475C3.89205 8.00803 4.03841 7.80156 4.13405 7.57061C4.22969 7.33966 4.27215 7.09016 4.2583 6.84058L4.20997 5.96558C4.19719 5.73161 4.23389 5.49758 4.31767 5.27875C4.40145 5.05992 4.53044 4.86122 4.6962 4.69561C4.86197 4.53 5.0608 4.40121 5.2797 4.31763C5.49861 4.23406 5.73268 4.19758 5.96664 4.21058L6.8408 4.25892C7.09025 4.27264 7.33959 4.23011 7.57038 4.13448C7.80117 4.03884 8.00751 3.89255 8.17414 3.70642L8.7583 3.05392Z" stroke="#189351" strokeWidth="1.5" />
        <path d="M7.91675 7.91602H7.92508V7.92435H7.91675V7.91602ZM12.0834 12.0827H12.0917V12.091H12.0834V12.0827Z" stroke="#189351" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12.5 7.5L7.5 12.5" stroke="#189351" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-figtree font-semibold text-[10px] lg:text-sm leading-[1.4] tracking-normal capitalize whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}

/** Title, price and offer — the text block under the product image. */
function ProductDetails({ product }) {
  if (!product) return null;

  return (
    <div className="flex flex-col items-center gap-1.5 text-center font-figtree">
      <Link
        prefetch={false}
        href={product.href || "#"}
        className="max-w-full text-[14px] lg:text-base font-[450] leading-[1.6] hover:underline underline-offset-4 line-clamp-1"
      >
        {product.name}
      </Link>

      {/* Price, was-price and the offer badge share one row, per the design. */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {product.price && <p className="text-base lg:text-xl font-bold">{product.price}</p>}
        {product.oldPrice && (
          <p className="text-[14px] lg:text-base text-[#909090] line-through">{product.oldPrice}</p>
        )}
        {product.offers?.length > 0 && <OfferBadge label={product.offers[0]} />}
      </div>
    </div>
  );
}

/** The look photo, with optional pins that drive the product carousel. */
function LookImage({ look, activeIndex, onHotspotClick, priority }) {
  const pinned = look.showHotspots
    ? look.products.map((p, i) => ({ ...p, index: i })).filter((p) => p.x && p.y)
    : [];

  const photo = (
    <LazyImage
      src={look.image}
      alt={look.name || "Curated look"}
      fill
      priority={priority}
      className="object-cover"
    />
  );

  return (
    <div className={`relative w-full ${LOOK_ASPECT} overflow-hidden rounded-xl bg-gray-100`}>
      {/* Without pins the whole photo can be a link; with pins the clicks belong to them. */}
      {!look.showHotspots && look.href ? (
        <Link prefetch={false} href={look.href} className="block h-full w-full">
          {photo}
        </Link>
      ) : (
        photo
      )}

      {pinned.map((spot) => {
        const isActive = spot.index === activeIndex;
        return (
          <button
            key={spot.id ?? spot.index}
            type="button"
            aria-label={spot.name}
            onClick={() => onHotspotClick(spot.index)}
            className={[
              "absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300",
              isActive
                ? "border-white bg-white/60 scale-125"
                : "border-white/80 bg-white/20 hover:bg-white/40",
            ].join(" ")}
            style={{ left: spot.x, top: spot.y }}
          >
            {!isActive && <span className="absolute h-7 w-7 animate-ping rounded-full bg-white/30" />}
            <Image loader={shopifyLoader} src={HOTSPOT_ICON} alt="" width={20} height={20} />
          </button>
        );
      })}
    </div>
  );
}

export default function CuratedLooks() {
  const swiperRef = useRef(null);
  const [look, setLook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function fetchLook() {
      try {
        const data = await apiFetch("/api/curated-looks", { cache: "no-store" });
        if (data.success) setLook(data.look || null);
      } catch (err) {
        console.error("Error fetching curated looks:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLook();
  }, []);

  const goToProduct = useCallback((index) => {
    const swiper = swiperRef.current;
    if (!swiper || swiper.destroyed) return;
    swiper.slideTo(index);
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    );
  }

  if (!look?.image || !look.products?.length) return null;

  const products = look.products;
  const multiple = products.length > 1;
  const autoplay =
    look.autoSwitchSeconds > 0 && multiple
      ? { delay: look.autoSwitchSeconds * 1000, disableOnInteraction: false, pauseOnMouseEnter: true }
      : false;

  const heading = (
    <div className="mb-6 text-center">
      <h2 className="mb-1 font-abhaya text-2xl font-extrabold text-black lg:text-4xl">
        Curated Looks For You
      </h2>
      <p className="text-sm font-normal leading-[1.4] text-black md:text-base">
        Explore the jewelry pieces that defines the look
      </p>
    </div>
  );

  // Pinned to the gutters and centred on the image, so they don't take part in
  // the column's vertical flow.
  const arrow = (dir) => (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous product" : "Next product"}
      onClick={() => (dir === "prev" ? swiperRef.current?.slidePrev() : swiperRef.current?.slideNext())}
      className={[
        "absolute top-1/2 z-10 -translate-y-1/2 cursor-pointer p-1 text-zinc-800",
        "transition-opacity hover:opacity-60 active:scale-90 disabled:opacity-30",
        dir === "prev" ? "left-0" : "right-0",
      ].join(" ")}
      disabled={!multiple}
    >
      {dir === "prev" ? <ChevronLeft size={28} strokeWidth={1.5} /> : <ChevronRight size={28} strokeWidth={1.5} />}
    </button>
  );

  /*
   * The product carousel: arrows sit in the side gutters, details and dots below.
   * On desktop the whole column is the same square as the look photo, and the
   * image area takes whatever height the details leave — that keeps the two
   * columns exactly level and the section inside one screen.
   */
  const productSlider = (
    <div className={`flex w-full flex-col lg:aspect-square ${COLUMN_MAX}`}>
      <div className="relative flex flex-col lg:min-h-0 lg:flex-1">
        <div className={`min-h-0 flex-1 ${GUTTER}`}>
          <Swiper
            modules={[Pagination, Autoplay]}
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            slidesPerView={1}
            spaceBetween={16}
            // rewind rather than loop: loop reorders slides, which makes
            // slideTo(productIndex) unreliable — and the hotspots depend on an
            // exact index-to-slide mapping. rewind still wraps past either end.
            rewind={multiple}
            autoplay={autoplay}
            speed={500}
            pagination={{ clickable: true, el: ".curated-pagination" }}
            className="curated-swiper w-full lg:h-full"
          >
            {products.map((product, i) => (
              <SwiperSlide key={product.id ?? i}>
                <Link
                  prefetch={false}
                  href={product.href || "#"}
                  className="relative block aspect-square w-full overflow-hidden rounded-lg bg-white lg:aspect-auto lg:h-full"
                >
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {arrow("prev")}
        {arrow("next")}
      </div>

      <div className={`mt-4 shrink-0 ${GUTTER}`}>
        <ProductDetails product={products[activeIndex]} />
      </div>

      <div className="curated-pagination mt-4 flex shrink-0 justify-center gap-2" />
    </div>
  );

  return (
    /*
     * Spacing is deliberately asymmetric, because this section is white on a
     * white page while both neighbours are pink. On a pink section a margin
     * reads as a separator and the padding sits inside the colour; here the two
     * are the same white and simply stack into one oversized gap.
     *
     *   above = this padding-top          -> 48px / 49px
     *   below = the next section's margin -> 48px / 52.5px  (DiamondCuts mt-12 md:mt-15)
     *
     * So: no top margin, and no bottom padding — the gap underneath is already
     * supplied by DiamondCuts. Adding padding-bottom here would double it.
     */
    <section className="w-full overflow-hidden bg-white pt-12 md:pt-14">
      <div className="container-main">
        {heading}

        {/* Mobile: photo above, products below. Desktop: products left, photo right. */}
        <div className="flex flex-col items-center gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className={`w-full lg:order-2 lg:justify-self-start ${COLUMN_MAX}`}>
            <LookImage
              look={look}
              activeIndex={activeIndex}
              onHotspotClick={goToProduct}
              priority={false}
            />
          </div>

          <div className="flex w-full justify-center lg:order-1 lg:justify-self-end">
            {productSlider}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .curated-swiper .swiper-pagination { display: none; }
        /* Desktop only: let a slide fill the square column the flex row leaves. */
        @media (min-width: 1024px) {
          .curated-swiper .swiper-wrapper,
          .curated-swiper .swiper-slide { height: 100%; }
        }
        .curated-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #d1d1d1;
          opacity: 1;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        .curated-pagination .swiper-pagination-bullet-active {
          width: 24px;
          background: #5a413f;
        }
      `}</style>
    </section>
  );
}
