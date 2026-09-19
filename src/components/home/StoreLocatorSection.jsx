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
import { isStoreActive } from "@/data/stores";
import { storesForSurface, formatTimings, storeStatus, designsLink } from "@/lib/storeContent";
import StoreFootfallModal from "@/components/common/StoreFootfallModal";
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
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
  const set1Ref = useRef(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const hasCapturedRef = useRef(false);
  const isTouchRef = useRef(false);

  const pointerDownXRef = useRef(0);
  const pointerDownYRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const lastPointerTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const momentumVelocityRef = useRef(0);
  const singleWidthRef = useRef(0);
  const pauseUntilRef = useRef(0);

  // Ensure each set has at least 5 stores so that 1 set is always > viewport width
  const baseStores = stores.length > 0 && stores.length < 5 ? [...stores, ...stores] : stores;

  // Initialize scroll position & measure widths on mount and resize
  useEffect(() => {
    if (surface !== "homepage") return;
    const el = scrollRef.current;
    const set1 = set1Ref.current;
    if (!el || !set1) return;

    const measureAndInit = () => {
      if (!set1 || !el) return;
      const w = set1.offsetWidth;
      if (w > 0) {
        singleWidthRef.current = w;
        // Start in the center set (Set 2) if not already initialized
        if (el.scrollLeft === 0 || el.scrollLeft < w * 0.4 || el.scrollLeft >= w * 2.6) {
          el.scrollLeft = w;
        }
      }
    };

    measureAndInit();
    const timer = setTimeout(measureAndInit, 120);

    const ro = new ResizeObserver(() => {
      measureAndInit();
    });
    ro.observe(set1);
    window.addEventListener("resize", measureAndInit);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", measureAndInit);
    };
  }, [surface, stores.length]);

  // Unified 60fps/120fps continuous marquee + momentum decay + wrap engine
  useEffect(() => {
    if (surface !== "homepage") return;
    const el = scrollRef.current;
    if (!el) return;

    let animId;
    let lastTime = performance.now();
    const speed = 0.6; // elegant luxury pace (~36px/sec)

    const tick = (now) => {
      const deltaMs = Math.min(now - lastTime, 50);
      const deltaFactor = deltaMs / 16.67;
      lastTime = now;

      const singleWidth = singleWidthRef.current || set1Ref.current?.offsetWidth || 0;

      if (singleWidth > 0 && el) {
        // Seamless circular wrap across buffer sets
        const wrap = () => {
          while (el.scrollLeft >= singleWidth * 2) {
            el.scrollLeft -= singleWidth;
          }
          while (el.scrollLeft < singleWidth) {
            el.scrollLeft += singleWidth;
          }
        };

        if (isDraggingRef.current) {
          wrap();
        } else {
          // Momentum physics after swipe/drag flick
          if (Math.abs(momentumVelocityRef.current) > 0.05) {
            el.scrollLeft += momentumVelocityRef.current * deltaFactor;
            wrap();
            momentumVelocityRef.current *= Math.pow(0.93, deltaFactor);
          } else {
            momentumVelocityRef.current = 0;
            const isPaused = isHoveredRef.current || performance.now() < pauseUntilRef.current;
            if (!isPaused) {
              el.scrollLeft += speed * deltaFactor;
              wrap();
            }
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [surface, stores.length]);

  // Unified Pointer Handlers for Mouse (cursor) and Touch (hand)
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const el = scrollRef.current;
    if (!el) return;

    if (set1Ref.current) {
      singleWidthRef.current = set1Ref.current.offsetWidth;
    }

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    hasCapturedRef.current = false;
    isTouchRef.current = e.pointerType === "touch";
    pointerDownXRef.current = e.clientX;
    pointerDownYRef.current = e.clientY;
    lastPointerXRef.current = e.clientX;
    lastPointerTimeRef.current = performance.now();
    velocityRef.current = 0;
    momentumVelocityRef.current = 0; // stop any previous momentum instantly on contact
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const distX = Math.abs(e.clientX - pointerDownXRef.current);
    const distY = Math.abs(e.clientY - pointerDownYRef.current);

    // On touch devices, detect vertical page scroll vs horizontal carousel swipe
    if (isTouchRef.current && !hasCapturedRef.current) {
      if (distY > distX && distY > 8) {
        // User is scrolling the page vertically: release drag to allow native page scroll
        isDraggingRef.current = false;
        return;
      }
      if (distX > 8 && distX >= distY) {
        // User is swiping horizontally: capture pointer
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
          hasCapturedRef.current = true;
        } catch (_) {}
      } else {
        return;
      }
    }

    // For mouse on desktop, only capture pointer after real drag threshold (>8px)
    if (!isTouchRef.current && !hasCapturedRef.current && distX > 8) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        hasCapturedRef.current = true;
      } catch (_) {}
    }

    if (distX > 8) {
      hasDraggedRef.current = true;
      if (!isDragging) {
        setIsDragging(true);
      }
    }

    if (!hasDraggedRef.current) return;

    const deltaX = e.clientX - lastPointerXRef.current;
    el.scrollLeft -= deltaX;

    // Instant wrap during drag
    const singleWidth = singleWidthRef.current || set1Ref.current?.offsetWidth || 0;
    if (singleWidth > 0) {
      while (el.scrollLeft >= singleWidth * 2) {
        el.scrollLeft -= singleWidth;
      }
      while (el.scrollLeft < singleWidth) {
        el.scrollLeft += singleWidth;
      }
    }

    // Measure velocity for momentum
    const now = performance.now();
    const dt = Math.max(now - lastPointerTimeRef.current, 8);
    const instantVelocity = (deltaX / dt) * 16.67;
    velocityRef.current = velocityRef.current * 0.3 + instantVelocity * 0.7;
    lastPointerXRef.current = e.clientX;
    lastPointerTimeRef.current = now;
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (hasCapturedRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      hasCapturedRef.current = false;
    }

    const timeSinceLastMove = performance.now() - lastPointerTimeRef.current;
    if (hasDraggedRef.current && timeSinceLastMove < 100 && Math.abs(velocityRef.current) > 0.8) {
      // Natural momentum flick in the swipe direction
      const clampedV = Math.max(Math.min(-velocityRef.current, 24), -24);
      momentumVelocityRef.current = clampedV;
    } else {
      momentumVelocityRef.current = 0;
      pauseUntilRef.current = performance.now() + 800;
    }

    // Keep hasDraggedRef true briefly to suppress synthetic click on <Link>
    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 150);
    }
  };

  const handlePointerCancel = (e) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    momentumVelocityRef.current = 0;
    if (hasCapturedRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      hasCapturedRef.current = false;
    }
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 150);
  };

  const handlePointerEnter = (e) => {
    if (e.pointerType === "mouse") {
      isHoveredRef.current = true;
    }
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType === "mouse" && !isDraggingRef.current) {
      isHoveredRef.current = false;
    }
  };

  const renderStoreCard = (store, key) => {
    const storeStatusObj = storeStatus(store);
    const storeImage = store.images?.homepage || store.images?.locator || store.images?.collection?.[0] || "";
    const storeLabel = store.experienceLabel || (store.city ? `${store.city} Store` : store.name);
    const targetHref = designsLink(store);

    return (
      <div
        key={key}
        className="flex-shrink-0 w-[82vw] sm:w-[45vw] lg:w-[31vw] xl:w-[29vw] pr-3.5 sm:pr-4 lg:pr-5 select-none"
      >
        <Link
          href={targetHref}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onClick={(e) => {
            if (hasDraggedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            handleStoreCtaClick("Store Card", store.city);
          }}
          className="group block relative w-full aspect-[16/10] select-none cursor-pointer"
        >
          {/* Masked Card Visual (Image + Gradient + Store Name) */}
          <div className="store-card-inverted-mask absolute inset-0 w-full h-full overflow-hidden bg-neutral-100">
            {/* Store Photo */}
            {storeImage ? (
              <LazyImage
                src={storeImage}
                alt={storeLabel}
                fill
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none"
                draggable={false}
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
            <div className="absolute top-5 left-[18px] z-10 pr-4 pointer-events-none select-none">
              <h3 className="font-figtree font-semibold text-white text-[16px] leading-[100%] tracking-normal drop-shadow-sm">
                {storeLabel}
              </h3>
            </div>
          </div>

          {/* Bottom-Right Circular Action Button synced edge-to-edge */}
          <div className="arrow-parent absolute right-[2px] bottom-[2px] z-20 pointer-events-auto">
            <div className="w-[44px] h-[44px] rounded-full border border-primary flex items-center justify-center bg-white text-primary transition-colors duration-300 group-hover:bg-primary group-hover:border-primary group-hover:text-white shadow-sm box-border cursor-pointer">
              <ArrowUpRight className="w-[18px] h-[18px] stroke-[1.8]" style={{ width: "18px", height: "18px" }} />
            </div>
          </div>
        </Link>
      </div>
    );
  };

  // HOMEPAGE: Modern visual slider view matching Figma mockup & continuous marquee
  if (surface === "homepage") {
    if (!stores.length) return null;

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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className={`flex overflow-x-hidden select-none no-scrollbar w-full ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              touchAction: "pan-y",
              userSelect: "none",
              WebkitUserSelect: "none",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* Set 1 (Left Buffer) */}
            <div ref={set1Ref} className="flex flex-shrink-0">
              {baseStores.map((store, idx) => renderStoreCard(store, `s1-${store.handle || store.id}-${idx}`))}
            </div>

            {/* Set 2 (Active Center Set) */}
            <div className="flex flex-shrink-0">
              {baseStores.map((store, idx) => renderStoreCard(store, `s2-${store.handle || store.id}-${idx}`))}
            </div>

            {/* Set 3 (Right Buffer) */}
            <div className="flex flex-shrink-0">
              {baseStores.map((store, idx) => renderStoreCard(store, `s3-${store.handle || store.id}-${idx}`))}
            </div>
          </div>
        </div>

        {/* Centered CTA - opens StoreFootfallModal with appointment mode for homepage */}
        <div className="container-main relative z-10">
          <div className="mt-8 sm:mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => {
                handleStoreCtaClick("Book An Appointment");
                setIsStoreModalOpen(true);
              }}
              className="inline-flex items-center justify-center w-fit md:w-auto px-7 py-3 h-auto text-sm md:text-base font-bold uppercase rounded-sm bg-primary hover:bg-[#4A3934] text-white transition-colors cursor-pointer shadow-sm"
            >
              BOOK AN APPOINTMENT
            </button>
          </div>
        </div>

        {/* Store Appointment Modal for Homepage */}
        <StoreFootfallModal
          open={isStoreModalOpen}
          onClose={() => setIsStoreModalOpen(false)}
          locationId={locationId}
          isAppointment={true}
          title="Book an Appointment"
          subtitle="Select your preferred store to schedule a visit"
          buttonLabel="Book an Appointment"
        />

        {/* Scoped and global styles for store section */}
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }

          /* Inverted Radius Cutout Mask */
          .store-card-inverted-mask {
            --r: 20px;
            --s: 30px;
            --x: 4px;
            --y: 4px;

            border-radius: var(--r);
            --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
            --_g: conic-gradient(from 90deg at calc(100% - var(--r)) calc(100% - var(--r)), #0000 25%, #000 0);
            --_d: (var(--s) + var(--r));
            mask:
              calc(100% - var(--_d) - var(--x)) 100% var(--_m),
              100% calc(100% - var(--_d) - var(--y)) var(--_m),
              radial-gradient(var(--s) at 100% 100%, #0000 99%, #000 calc(100% + 1px))
                calc(-1 * var(--r) - var(--x)) calc(-1 * var(--r) - var(--y)),
              var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
              var(--_g) 0 calc(-1 * var(--_d) - var(--y));
            mask-repeat: no-repeat;
            -webkit-mask:
              calc(100% - var(--_d) - var(--x)) 100% var(--_m),
              100% calc(100% - var(--_d) - var(--y)) var(--_m),
              radial-gradient(var(--s) at 100% 100%, #0000 99%, #000 calc(100% + 1px))
                calc(-1 * var(--r) - var(--x)) calc(-1 * var(--r) - var(--y)),
              var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
              var(--_g) 0 calc(-1 * var(--_d) - var(--y));
            -webkit-mask-repeat: no-repeat;
          }
        `}</style>
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
