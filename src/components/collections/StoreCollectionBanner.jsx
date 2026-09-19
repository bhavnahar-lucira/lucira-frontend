"use client";

import React from "react";
import LazyImage from "@/components/common/LazyImage";
import {
  MapPinned,
  Phone,
  CalendarDays,
  Clock3,
  Star,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import OpeningSoonOverlay from "@/components/common/OpeningSoonOverlay";
import { isStoreActive } from "@/data/stores";
import { storeByHandle, formatTimings, storeStatus } from "@/lib/storeContent";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

// ─── Sub-Components ──────────────────────────────────────────────────────────
function ServiceCard({ item }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-white px-3 py-4 text-center shadow-sm border border-gray-50 h-full">
      {item.icon ? (
        <div className="relative mb-3 h-15 w-15">
          <LazyImage src={item.icon} alt={item.title} fill className="object-contain" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-primary leading-tight">{item.title}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
/**
 * The store hero at the top of /collections/<handle>.
 *
 * Content comes from `storePages` (Dashboard → Stores, served by
 * /api/settings/store-pages and threaded down from the collection page's server
 * component). `bannerImages` still wins when the caller passes one, so a
 * campaign can override the carousel for a single render.
 */
export default function StoreCollectionBanner({ collectionHandle, bannerImages = [], storePages = null }) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const store = storeByHandle(storePages, collectionHandle);

  // `isStoreActive` is the older site-wide kill switch in src/data/stores.js and
  // still applies; `published` and the per-surface toggle are the dashboard's.
  if (!store || store.published === false || store.surfaces?.collectionBanner === false) return null;
  if (!isStoreActive(collectionHandle)) return null;

  const status = storeStatus(store);
  const isOpenTone = status.tone === "open";
  const timings = formatTimings(store);
  const facilities = store.facilities || [];
  const services = store.services || [];
  const links = store.links || {};
  const displayImages = bannerImages.length > 0 ? bannerImages : (store.images?.collection || []);

  if (isMobile) {
    return (
      <section className="w-full bg-[#FEF5F1] py-6.5 mt-0 overflow-hidden">
        <div className="container-main">
          <div className="flex flex-col gap-8">
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <div className="relative aspect-[4/3.5] w-full">
                <Swiper
                  modules={[Autoplay, Pagination, EffectFade]}
                  effect="fade"
                  loop={true}
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  className="h-full w-full"
                >
                  {displayImages.map((src, index) => (
                    <SwiperSlide key={index}>
                      <div className="relative w-full h-full">
                        <LazyImage src={src} alt={store.name} fill className="object-cover" />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div
                  className="absolute inset-0 pointer-events-none z-[1]"
                  style={{ background: "linear-gradient(180deg, #000000 -25.71%, rgba(0, 0, 0, 0.751968) 3.02%, rgba(0, 0, 0, 0) 18.55%)" }}
                />
                {status.openingSoon && <OpeningSoonOverlay label={null} />}
              </div>

              <div className="absolute left-5 right-5 top-5 flex items-start justify-between z-[4]">
                <h1 className="font-figtree text-xl italic font-bold text-white drop-shadow-md">{store.name}</h1>
                {status.openingSoon ? (
                  <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-[10px] font-extrabold uppercase leading-none tracking-[0.7px] text-[#5A413F] shadow-sm backdrop-blur-sm">
                    Opening Soon
                  </span>
                ) : store.rating ? (
                  <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Star size={12} className="fill-[#f5c518] text-[#f5c518]" />
                    <span className="text-sm font-black text-white">{store.rating}</span>
                  </div>
                ) : null}
              </div>

              <div className="absolute right-4 bottom-18 z-[2]">
                <div className={`inline-flex items-center gap-2 rounded-full ${isOpenTone ? "border-success bg-[#E8F5E9] text-[#28a745]" : "border-danger bg-[#f5e8e8] text-[#dc2626]"} border px-4 py-1.5 text-xs font-bold shadow-lg`}>
                  <Circle size={8} className={isOpenTone ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                  {status.label}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-3 z-[2]">
                <Clock3 size={18} className="text-[#5B4740]" />
                <div className="text-[11px] font-bold text-zinc-800 uppercase tracking-tighter leading-tight">
                  <span className="text-zinc-500 mr-1">Timings:</span> {timings}
                </div>
              </div>
            </div>

            {facilities.length > 0 && (
              <div>
                <h4 className="mb-3 text-base font-semibold text-black">Facilities at Store:</h4>
                <div className="flex flex-wrap gap-2.5">
                  {facilities.map((item) => (
                    <span key={item} className="inline-block rounded-full bg-white py-1.25 px-[13.5px] text-black text-sm font-normal border border-gray-100 shadow-sm">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div>
                <h4 className="mb-3 text-base font-semibold text-black">Services Offered at Store:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {services.map((item) => (
                    <div key={item.title} className="flex flex-col items-center justify-center rounded-lg bg-white py-2.5 px-9 text-center border border-gray-50 shadow-sm">
                      <div className="relative mb-3 h-10 w-10">
                        <LazyImage src={item.icon} alt={item.title} fill className="object-contain" />
                      </div>
                      <p className="text-sm text-primary">{item.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-3 text-base font-semibold text-black">Address:</h4>
              <p className="text-base font-normal text-black leading-relaxed">{store.address}</p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {links.map && (
                  <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm">
                    <a href={links.map} target="_blank" rel="noopener noreferrer"><MapPinned className="mr-2 h-4 w-4" /> DIRECT ME</a>
                  </Button>
                )}
                {links.call && (
                  <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm">
                    <a href={links.call}><Phone className="mr-2 h-4 w-4" /> CALL US</a>
                  </Button>
                )}
              </div>
              {links.appointment && (
                <Button asChild className="h-12 w-full rounded-sm bg-primary text-white font-medium text-sm uppercase shadow-lg">
                  <a href={links.appointment} target="_blank"><CalendarDays className="mr-2 h-4 w-4" />BOOK APPOINTMENT</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // DESKTOP VIEW
  return (
    <section className="w-full bg-[#FEF5F1] py-14">
      <div className="container-main max-w-360">
        <div className="grid grid-cols-1 xl:gap-10 lg:gap-8 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
          {/* LEFT: Banner Carousel */}
          <div className="relative overflow-hidden rounded-sm group">
            <div className="relative aspect-[4/4.3] w-full h-full">
              <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                effect="fade"
                loop={true}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                navigation={{
                  nextEl: ".store-banner-next",
                  prevEl: ".store-banner-prev",
                }}
                pagination={{ clickable: true }}
                className="h-full w-full"
              >
                {displayImages.map((src, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative w-full h-full">
                      <LazyImage src={src} alt={store.name} fill className="object-cover" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <div
                className="absolute inset-0 pointer-events-none z-[1]"
                style={{ background: "linear-gradient(180deg, #000000 -25.71%, rgba(0, 0, 0, 0.751968) 3.02%, rgba(0, 0, 0, 0) 18.55%)" }}
              />

              {/* Banner Controls */}
              {displayImages.length > 1 && (
                <>
                  <button className="store-banner-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40">
                    <ChevronLeft size={24} />
                  </button>
                  <button className="store-banner-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40">
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              {status.openingSoon && <OpeningSoonOverlay label={null} />}
            </div>

            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-4 z-[4]">
              <h2 className="font-figtree text-2xl italic leading-none font-semibold text-white drop-shadow-md">{store.name}</h2>
              {status.openingSoon ? (
                <span className="shrink-0 rounded-full border border-white/60 bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase leading-none tracking-[0.7px] text-[#5A413F] shadow-sm backdrop-blur-sm">
                  Opening Soon
                </span>
              ) : store.rating ? (
                <div className="mt-0.5 flex items-center gap-1 text-white">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.floor(store.rating) ? "fill-[#f5c518] text-[#f5c518]" : "text-white/50"} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{store.rating}</span>
                </div>
              ) : null}
            </div>

            <div className="absolute bottom-6 left-3 right-3 flex flex-wrap items-center xl:justify-between gap-2 lg:justify-center rounded-full bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg z-[2]">
              <div className="flex items-center gap-2 xl:text-sm lg:text-xs uppercase">
                <Clock3 size={16} className="text-primary" />
                <span className="font-medium text-zinc-800">
                  <span className="font-bold text-zinc-500">Timings:</span> {timings}
                </span>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-full border ${isOpenTone ? "border-success bg-success/10 text-[#28a745]" : "border-danger bg-danger/10 text-[#dc2626]"} px-3 py-1 text-sm font-bold`}>
                <Circle size={8} className={isOpenTone ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                {status.label}
              </div>
            </div>
          </div>

          {/* RIGHT: Store Details */}
          <div className="min-w-0 flex flex-col justify-center">
            {facilities.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 text-base font-semibold text-black tracking-tight">Facilities at Store:</h4>
                <div className="flex flex-wrap gap-3">
                  {facilities.map((item) => (
                    <span key={item} className="rounded-full bg-white px-4 py-2 text-sm text-black border border-gray-100 shadow-sm transition-all hover:bg-primary hover:text-white cursor-default">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 text-base font-semibold text-black tracking-tight">Services Offered at Store:</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {services.map((item) => (
                    <ServiceCard key={item.title} item={item} />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black tracking-tight">Address:</h4>
              <p className="max-w-120 text-base leading-7 text-zinc-700 font-figtree">{store.address}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {links.map && (
                <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm hover:bg-primary hover:text-white transition-all">
                  <a href={links.map} target="_blank" rel="noopener noreferrer"><MapPinned className="mr-2 h-5 w-5" /> DIRECT ME</a>
                </Button>
              )}
              {links.call && (
                <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm hover:bg-primary hover:text-white transition-all">
                  <a href={links.call}><Phone className="mr-2 h-5 w-5" /> CALL US</a>
                </Button>
              )}
            </div>

            {links.appointment && (
              <div className="mt-4">
                <Button asChild className="h-14 w-full text-white font-bold text-base uppercase tracking-wider shadow-lg bg-primary hover:opacity-90 transition-all active:scale-95">
                  <a href={links.appointment} target="_blank"><CalendarDays className="mr-3 h-6 w-6" /> BOOK APPOINTMENT</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
