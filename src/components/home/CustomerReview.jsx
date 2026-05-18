"use client";

import Link from "next/link";
import { useId, useState, useEffect, useRef } from "react";
import LazyImage from "../common/LazyImage";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight, Star, BadgeCheck, X } from "lucide-react";
import ReviewDetailedPopup from "@/components/review/ReviewDetailedPopup";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Sheet } from "react-modal-sheet";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function ReviewCard({ item, onClick, isMobile }) {
  return (
    <div 
        onClick={onClick}
        className={`overflow-hidden ${isMobile ? "rounded-2xl shadow-md" : "rounded-sm"} border border-[#e6e1de] bg-white transition-all hover:border-black/10 h-full flex flex-col cursor-pointer group`}
    >
      <div className="block">
        <div className={`relative ${isMobile ? "aspect-4/4.5" : "aspect-[0.92/1]"} w-full bg-gray-50 overflow-hidden`}>
          <LazyImage
            src={item.personImage || "/images/review/1.jpg"}
            alt={item.personName}
            fill
            className={`object-cover group-hover:scale-105 transition-all duration-700`}
          />
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="truncate text-base font-bold text-zinc-900">
              {item.personName}
            </h3>

            {item.verified && (
              <div className="flex items-center gap-1 text-[10px] text-[#B77767] font-bold uppercase">
                <BadgeCheck size={14} className="fill-[#B77767] text-white" />
                <span>Verified</span>
              </div>
            )}
          </div>

          <p className="mb-4 line-clamp-3 text-[13px] leading-relaxed text-zinc-600 min-h-15">
            “{item.review}”
            {isMobile && item.review.length > 100 && <span className="text-zinc-900 font-bold ml-1 underline">Read more</span>}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 mt-auto">
        <div className="block border-t border-zinc-100 pt-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-100 bg-white">
              <LazyImage
                src={item.productImage || "/images/product/1.jpg"}
                alt={item.productTitle}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-zinc-800 underline decoration-zinc-200">
                {item.productTitle}
              </p>

              <div className="mt-0.5 flex items-center gap-1">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      fill={i < Math.round(item.rating) ? "currentColor" : "none"}
                      className={i < Math.round(item.rating) ? "" : "text-zinc-200"}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-zinc-400">{item.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerReview({
  title = "Why Our Customers Love Us",
  subtitle,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const id = useId().replace(/:/g, "");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Popup State
  const [popupState, setPopupState] = useState({ isOpen: false, index: 0 });

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/home-reviews`);
        const data = await response.json();
        // The API returns { reviews: [...] }
        setReviews(data?.reviews || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const prevElClass = `prev-${id}`;
  const nextElClass = `next-${id}`;
  const paginationElClass = `pagination-${id}`;

  if (loading) {
    return (
        <section className="w-full pt-10 overflow-hidden">
            <div className="container-main">
                <div className="mb-6 animate-pulse">
                    <div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-96 bg-gray-200 rounded"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-3/4 bg-gray-100 rounded-sm"></div>
                    ))}
                </div>
            </div>
        </section>
    );
  }

  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  return (
    <section className="w-full my-8 md:my-12 bg-white overflow-hidden">
      <div className="container-main">
        <div className={`mb-8 ${isMobile ? "text-left" : "text-center md:text-left"}`}>
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            {title}
          </h2>
          {subtitle && <p className="text-sm md:text-base text-zinc-600">{subtitle}</p>}
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={isMobile ? 12 : 20}
            slidesPerView={isMobile ? 1.5 : 4.2}
            loop={false}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            navigation={{
              nextEl: `.${nextElClass}`,
              prevEl: `.${prevElClass}`,
            }}
            pagination={{
              el: `.${paginationElClass}`,
              clickable: true,
            }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4.2 },
            }}
            className="w-full overflow-visible!"
          >
            {reviews.map((item, idx) => (
              <SwiperSlide key={item.id} className="h-auto">
                <ReviewCard 
                    item={item} 
                    isMobile={isMobile}
                    onClick={() => setPopupState({ isOpen: true, index: idx })} 
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Controls */}
          <div className="mt-8 md:mt-6 px-1 flex items-center justify-between">
            {isMobile ? (
              <Link 
                href="/reviews"
                className="font-black text-[10px] tracking-[0.2em] uppercase border-b border-zinc-900 pb-0.5 text-zinc-900"
              >
                View All Reviews
              </Link>
            ) : (
              <div className={`${paginationElClass} flex gap-2`}></div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 text-zinc-900 transition bg-white shadow-sm hover:bg-zinc-900 hover:text-white cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 text-zinc-900 transition bg-white shadow-sm hover:bg-zinc-900 hover:text-white cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="mt-12 text-center">
              <Link 
                  href="/reviews"
                  className="inline-flex items-center justify-center px-7 py-3 h-auto text-sm md:text-base font-bold uppercase rounded-sm bg-primary hover:bg-[#4A3934] text-white transition-colors"
              >
                  View All Reviews
              </Link>
          </div>
        )}
      </div>

      {isMobile ? (
        <ReviewBottomSheet 
          isOpen={popupState.isOpen}
          onClose={() => setPopupState({ ...popupState, isOpen: false })}
          review={reviews[popupState.index]}
        />
      ) : (
        <ReviewDetailedPopup 
          isOpen={popupState.isOpen}
          onClose={() => setPopupState({ ...popupState, isOpen: false })}
          reviews={reviews}
          activeIndex={popupState.index}
          onIndexChange={(index) => setPopupState({ ...popupState, index })}
        />
      )}

      <style jsx global>{`
        .${paginationElClass} .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #D1D1D1;
          opacity: 1;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        .${paginationElClass} .swiper-pagination-bullet-active {
          width: 24px;
          background: #000;
        }
        @media (min-width: 768px) {
          .${paginationElClass} .swiper-pagination-bullet-active {
            width: 24px;
          }
        }
      `}</style>
    </section>
  );
}

function ReviewBottomSheet({ isOpen, onClose, review }) {
  if (!review) return null;

  return (
    <Sheet 
      isOpen={isOpen} 
      onClose={onClose}
      snapPoints={[0, 0.9, 1]}
      initialSnap={1}
    >
      <Sheet.Container className="rounded-t-[32px]! overflow-hidden">
        <Sheet.Header />
        <Sheet.Content className="px-6 pb-12 overflow-y-auto no-scrollbar">
          <div className="flex flex-col lg:pb-0 pb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black font-abhaya text-zinc-900 tracking-tight">
                Why Our Customers Love Us
              </h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative aspect-4/4.5 w-full rounded-2xl overflow-hidden mb-6 shadow-lg">
               <LazyImage src={review.personImage || "/images/review/1.jpg"} alt={review.personName} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
            </div>

            <div className="mb-6">
               <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-lg font-black text-zinc-900">{review.personName}</h3>
                  {review.verified && (
                    <div className="flex items-center gap-1.5 text-xs text-[#B77767] font-bold uppercase">
                      <BadgeCheck size={16} className="fill-[#B77767] text-white" />
                      <span>Verified</span>
                    </div>
                  )}
               </div>
               <p className="text-[15px] leading-relaxed text-zinc-600 italic">
                  “{review.review}”
               </p>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 flex items-center gap-4">
               <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-sm">
                  <LazyImage src={review.productImage || "/images/product/1.jpg"} alt={review.productTitle} fill sizes="60px" className="object-cover" />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 underline underline-offset-4 decoration-zinc-200 truncate mb-1">
                    {review.productTitle}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < Math.round(review.rating) ? "currentColor" : "none"} className={i < Math.round(review.rating) ? "" : "text-zinc-200"} />
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-zinc-400">{review.rating}.0</span>
                  </div>
               </div>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}