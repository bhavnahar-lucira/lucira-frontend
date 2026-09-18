"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import LazyImage from "../common/LazyImage";
import {
  MapPinned,
  Phone,
  CalendarDays,
  Clock3,
  Star,
  Circle,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { pushPromoClick } from "@/lib/gtm";
import OpeningSoonOverlay from "@/components/common/OpeningSoonOverlay";
import BookAppointmentPopup from "./BookAppointmentPopup";
import { isStoreActive } from "@/data/stores";
import { storesForSurface, formatTimings, storeStatus, designsLink } from "@/lib/storeContent";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

function ServiceCard({ item }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-white px-3 py-4 text-center">
      {item.icon ? (
        <div className="relative mb-3 h-15 w-15">
          <LazyImage src={item.icon} alt={item.title} fill className="object-contain" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-primary">{item.title}</p>
    </div>
  );
}

/**
 * "Visit Lucira Stores Near You"
 *
 * Stores, their order, and images come directly from Dashboard → Stores via `storePages`.
 * On the homepage (`surface === "homepage"`), it displays a modern carousel of experience stores
 * with direct design links and a "BOOK A STORE VISIT" action.
 * On other surfaces (like PDP), it retains the tabbed details view.
 */
export default function StoreLocatorSection({ locationId = "homepage", storePages = null, surface = "homepage" }) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);

  // `isStoreActive` is the site-wide kill switch in src/data/stores.js;
  // the dashboard's own `published` flag is applied by `storesForSurface`.
  const stores = storesForSurface(storePages, surface).filter((s) => isStoreActive(s.handle));

  const handleStoreCtaClick = (action, storeCity) => {
    pushPromoClick({
      creative_name: `visit store section ${locationId}`,
      location_id: locationId,
      promo_id: storeCity || "all",
      promo_name: action,
    });
  };

  const scrollRef = useRef(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Marquee animation: continuous smooth gliding with instant pause on hover
  useEffect(() => {
    if (surface !== "homepage") return;
    const el = scrollRef.current;
    if (!el) return;

    let animId;
    let lastTime = performance.now();
    const speed = 0.6; // smooth elegant luxury pace (~36px/sec)

    const tick = (now) => {
      const delta = Math.min(now - lastTime, 50);
      lastTime = now;

      if (!isHoveredRef.current && !isDraggingRef.current && el) {
        el.scrollLeft += speed * (delta / 16.67);

        // Infinite seamless loop wrap:
        // Render 2 sets of items. When scroll reaches halfway, wrap back seamlessly
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) {
          el.scrollLeft -= half;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += half;
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [surface, stores.length]);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // HOMEPAGE: Modern visual slider view matching Figma mockup & continuous marquee
  if (surface === "homepage") {
    if (!stores.length) return null;

    // Render 2 sets of stores so infinite loop is seamless
    const displayStores = [...stores, ...stores];

    return (
      <section className="w-full bg-white pt-10 md:pt-16 pb-[30px] md:pb-[30px] overflow-hidden">
        {/* Section Heading inside container-main */}
        <div className="container-main">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-abhaya text-black tracking-tight">
              Visit Lucira Stores Near You
            </h2>
          </div>
        </div>

        {/* Stores Marquee Carousel: Full-width edge-to-edge */}
        <div className="w-full relative overflow-hidden">
          <div
            ref={scrollRef}
            onMouseEnter={() => {
              isHoveredRef.current = true;
            }}
            onMouseLeave={() => {
              isHoveredRef.current = false;
              isDraggingRef.current = false;
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={() => {
              isHoveredRef.current = true;
            }}
            onTouchEnd={() => {
              setTimeout(() => {
                isHoveredRef.current = false;
              }, 1200);
            }}
            className="flex overflow-x-auto select-none no-scrollbar cursor-grab active:cursor-grabbing w-full pl-3.5 sm:pl-4 lg:pl-5"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
              {displayStores.map((store, idx) => {
                const storeStatusObj = storeStatus(store);
                const storeImage = store.images?.homepage || store.images?.locator || store.images?.collection?.[0] || "";
                const storeLabel = store.experienceLabel || (store.city ? `${store.city} Store` : store.name);
                const targetHref = designsLink(store);

                return (
                  <div
                    key={`${store.handle || store.id}-${idx}`}
                    className="flex-shrink-0 w-[82vw] sm:w-[45vw] lg:w-[31vw] xl:w-[29vw] pr-3.5 sm:pr-4 lg:pr-5"
                  >
                    <Link
                      href={targetHref}
                      onClick={(e) => {
                        if (hasDraggedRef.current) {
                          e.preventDefault();
                          return;
                        }
                        handleStoreCtaClick("Store Card", store.city);
                      }}
                      style={{
                        borderRadius: "12px",
                        boxShadow: "none",
                        WebkitBoxShadow: "none",
                        border: "0",
                        outline: "none",
                        transform: "translateZ(0)",
                        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                      }}
                      className="group block relative w-full aspect-[16/10] overflow-hidden bg-white select-none cursor-pointer"
                    >
                      {/* Store Photo */}
                      {storeImage ? (
                        <LazyImage
                          src={storeImage}
                          alt={storeLabel}
                          fill
                          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200" />
                      )}

                      {/* Top dark gradient overlay for text readability */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(145.07deg, rgba(0, 0, 0, 0.72) 15.93%, rgba(0, 0, 0, 0) 50%)",
                        }}
                      />

                      {/* Opening Soon Overlay */}
                      {storeStatusObj.openingSoon && <OpeningSoonOverlay />}

                      {/* Top-Left: Store Name */}
                      <div className="absolute top-5 left-[18px] z-10 pr-4">
                        <h3 className="font-figtree font-semibold text-white text-[16px] leading-[100%] tracking-normal drop-shadow-sm">
                          {storeLabel}
                        </h3>
                      </div>

                      {/* Bottom-Right: Single-piece unified concave cutout (no seams, zero lines/shadows) */}
                      <div
                        className="absolute -bottom-[1px] -right-[1px] z-10 w-[78px] sm:w-[86px] h-[78px] sm:h-[86px] pointer-events-none select-none"
                        style={{ boxShadow: "none", border: "none", outline: "none" }}
                      >
                        <svg
                          className="w-full h-full fill-white"
                          viewBox="0 0 88 88"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                          style={{ filter: "none", boxShadow: "none", border: "none" }}
                        >
                          <path d="M 88,0 C 88,12 80,20 68,20 C 41,20 20,41 20,68 C 20,80 12,88 0,88 L 90,90 L 90,0 Z" />
                        </svg>

                        {/* Circular Action Button */}
                        <div
                          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center text-black transition-all duration-300 group-hover:bg-[#5A413F] group-hover:border-[#5A413F] group-hover:text-white pointer-events-auto"
                          style={{ boxShadow: "none", outline: "none" }}
                        >
                          <ArrowUpRight className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Centered CTA - button style same as others */}
        <div className="container-main">
          <div className="mt-8 sm:mt-10 flex justify-center">
            <Button
              type="button"
              onClick={() => {
                handleStoreCtaClick("Book A Store Visit");
                setIsBookAppointmentOpen(true);
              }}
              className="w-fit md:w-auto px-7 py-3 h-auto text-sm md:text-base font-bold uppercase rounded-sm bg-primary hover:bg-[#4A3934] text-white transition-colors cursor-pointer"
            >
              BOOK A STORE VISIT
            </Button>
          </div>
        </div>

        {/* Global style to hide scrollbar */}
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `}</style>

        {/* Book Appointment Modal */}
        <BookAppointmentPopup
          isOpen={isBookAppointmentOpen}
          onClose={() => setIsBookAppointmentOpen(false)}
        />
      </section>
    );
  }

  // OTHER SURFACES (e.g. PDP): Detailed tabbed view remains intact
  const activeStore = stores[Math.min(activeIndex, stores.length - 1)];
  if (!activeStore) return null;

  const status = storeStatus(activeStore);
  const isOpenTone = status.tone === "open";
  const timings = formatTimings(activeStore);
  const facilities = activeStore.facilities || [];
  const services = activeStore.services || [];
  const links = activeStore.links || {};
  const image = activeStore.images?.homepage || "";
  const designs = designsLink(activeStore);

  if (isMobile) {
    return (
      <section className="w-full bg-[#FEF5F1] py-6.5 mt-10 overflow-hidden">
        <div className="container-main">
          <div className="text-center mb-2 px-1 md:px-0">
            <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">Visit Lucira Store Near You</h2>
          </div>

          <div className="mb-8 w-full overflow-x-auto pb-3">
            <div className="flex gap-1.5 min-w-max px-1">
              {stores.map((store, index) => (
                <button
                  key={store.handle}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative py-2.25 px-3.5 text-base text-black transition-all ${
                    activeIndex === index ? "font-semibold" : "font-normal"
                  }`}
                >
                  {store.city}
                  {activeIndex === index && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <div className="relative aspect-[4/3.5] w-full">
                <LazyImage src={image} alt={activeStore.name} fill className="object-cover" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, #000000 -25.71%, rgba(0, 0, 0, 0.751968) 3.02%, rgba(0, 0, 0, 0) 18.55%)" }}
                />
                {status.openingSoon && <OpeningSoonOverlay />}
              </div>

              <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
                <h3 className="font-figtree text-xl italic font-black text-white">{activeStore.name}</h3>
                {activeStore.rating && (
                  <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Star size={12} className="fill-[#f5c518] text-[#f5c518]" />
                    <span className="text-sm font-black text-white">{activeStore.rating}</span>
                  </div>
                )}
              </div>

              <div className="absolute right-4 bottom-18">
                <div className={`inline-flex items-center gap-2 rounded-full ${isOpenTone ? "border-success bg-[#E8F5E9] text-[#28a745]" : "border-danger bg-[#f5e8e8] text-[#dc2626]"} border px-4 py-1.5 text-xs font-bold shadow-lg`}>
                  <Circle size={8} className={isOpenTone ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                  {status.label}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-3">
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
                    <span key={item} className="inline-block rounded-full bg-[#F7EEEA] py-1.25 px-[13.5px] text-black text-sm font-normal">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div>
                <h4 className="mb-3 text-base font-semibold text-black">Services Offered at Store:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {services.map((item) => (
                    <div key={item.title} className="flex flex-col items-center justify-center rounded-lg bg-white py-2.5 px-9 text-center">
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
              <p className="text-base font-normal text-black">{activeStore.address}</p>
            </div>

            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-3">
                 {links.map && (
                   <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                     <a href={links.map} target="_blank" rel="noopener noreferrer" onClick={() => handleStoreCtaClick("Direct Me")}><MapPinned className="mr-2 h-4 w-4" /> DIRECT ME</a>
                   </Button>
                 )}
                 {links.call && (
                   <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                     <a href={links.call} onClick={() => handleStoreCtaClick("Call Us")}><Phone className="mr-2 h-4 w-4" /> CALL US</a>
                   </Button>
                 )}
               </div>
               <Button asChild variant="outline" className="h-12 w-full rounded-sm border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                 <a href={designs} onClick={() => handleStoreCtaClick("View Available Designs")}>VIEW AVAILABLE DESIGNS</a>
               </Button>
               {links.appointment && (
                 <Button asChild className="h-12 w-full rounded-sm bg-[#5A413F] text-white font-medium text-sm sm:text-base uppercase shadow-lg">
                   <a href={links.appointment} target="_blank" onClick={() => handleStoreCtaClick("Book Appointment")}><CalendarDays className="mr-2 h-4 w-4" />BOOK APPOINTMENT</a>
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
    <section className="w-full bg-[#FEF5F1] py-14 mt-15">
      <div className="container-main max-w-360">
        <div className="text-left mb-4">
          <h2 className="text-3xl md:text-4xl font-extrabold font-abhaya mb-4">Visit Lucira Store Near You</h2>
        </div>

        <div className="mb-6 flex flex-wrap gap-8">
          {stores.map((store, index) => (
            <button
              key={store.handle}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative py-2.25 px-3.5 text-base text-black transition ${
                activeIndex === index ? "font-semibold" : "font-normal"
              }`}
            >
              {store.city}
              {activeIndex === index && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-black" />}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:gap-6 lg:gap-4 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
          <div className="relative overflow-hidden rounded-sm">
            <div className="relative aspect-[4/4.3] w-full h-full">
              <LazyImage src={image} alt={activeStore.name} fill className="object-cover" />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(180deg, #000000 -25.71%, rgba(0, 0, 0, 0.751968) 3.02%, rgba(0, 0, 0, 0) 18.55%)" }}
              />
              {status.openingSoon && <OpeningSoonOverlay />}
            </div>

            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-4">
              <h3 className="font-figtree text-2xl italic leading-none font-semibold text-white drop-shadow-md">{activeStore.name}</h3>
              {activeStore.rating && (
                <div className="mt-0.5 flex items-center gap-1 text-white">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.floor(activeStore.rating) ? "fill-[#f5c518] text-[#f5c518]" : "text-white/50"} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{activeStore.rating}</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-6 left-3 right-3 flex flex-wrap items-center xl:justify-between gap-2 lg:justify-center rounded-full bg-[#f7efec] px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 xl:text-sm lg:text-xs uppercase">
                <Clock3 size={16} />
                <span className="font-medium">
                  <span className="font-semibold">Timings:</span> {timings}
                </span>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-full border ${isOpenTone ? "border-success bg-success/10 text-[#28a745]" : "border-danger bg-danger/10 text-[#dc2626]"} px-3 py-1 text-base font-bold`}>
                <Circle size={8} className={isOpenTone ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                {status.label}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            {facilities.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 text-base font-semibold text-black">Facilities at Store:</h4>
                <div className="flex flex-wrap gap-3">
                  {facilities.map((item) => (
                    <span key={item} className="rounded-full bg-[#F7EEEA] px-4 py-2 text-base text-black">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 text-base font-semibold text-black">Services Offered at Store:</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {services.map((item) => (
                    <ServiceCard key={item.title} item={item} />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black">Address:</h4>
              <p className="max-w-120 text-base leading-7 text-black">{activeStore.address}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {links.map && (
                <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                  <a href={links.map} target="_blank" rel="noopener noreferrer" onClick={() => handleStoreCtaClick("Direct Me")}><MapPinned className="mr-2 h-6 w-6" /> DIRECT ME</a>
                </Button>
              )}
              {links.call && (
                <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                  <a href={links.call} onClick={() => handleStoreCtaClick("Call Us")}><Phone className="mr-2 h-6 w-6" /> CALL US</a>
                </Button>
              )}
            </div>

            <div className="mt-3">
              <Button asChild variant="outline" className="h-12 w-full border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                <a href={designs} onClick={() => handleStoreCtaClick("View Available Designs")}>VIEW AVAILABLE DESIGNS</a>
              </Button>
            </div>

            {links.appointment && (
              <div className="mt-3">
                <Button asChild className="h-12 w-full text-white font-medium text-sm sm:text-base uppercase">
                  <a href={links.appointment} target="_blank" onClick={() => handleStoreCtaClick("Book Appointment")}><CalendarDays className="mr-2 h-6 w-6" /> BOOK APPOINTMENT</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
