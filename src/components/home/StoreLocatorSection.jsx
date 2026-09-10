"use client";

import { useState } from "react";
import LazyImage from "../common/LazyImage";
import {
  MapPinned,
  Phone,
  CalendarDays,
  Clock3,
  Star,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { pushPromoClick } from "@/lib/gtm";
import OpeningSoonOverlay from "@/components/common/OpeningSoonOverlay";
import { isStoreActive } from "@/data/stores";
import { storesForSurface, formatTimings, storeStatus, designsLink } from "@/lib/storeContent";

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
 * "Visit Lucira Store Near You" — the tabbed store section on the homepage and
 * the product page.
 *
 * Stores, their order, and everything inside a tab come from Dashboard → Stores
 * via `storePages` (fetched server-side and passed down). `surface` picks which
 * per-store toggle applies, so a store can appear on the homepage but not the
 * PDP, or the other way round.
 */
export default function StoreLocatorSection({ locationId = "homepage", storePages = null, surface = "homepage" }) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [activeIndex, setActiveIndex] = useState(0);

  // `isStoreActive` is the older site-wide kill switch in src/data/stores.js;
  // the dashboard's own `published` flag is applied by `storesForSurface`.
  const stores = storesForSurface(storePages, surface).filter((s) => isStoreActive(s.handle));

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

  const handleStoreCtaClick = (action) => {
    pushPromoClick({
      creative_name: `visit store section ${locationId}`,
      location_id: locationId,
      promo_id: activeStore.city,
      promo_name: action,
    });
  };

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
