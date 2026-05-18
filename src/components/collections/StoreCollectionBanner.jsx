"use client";

import React, { useState, useEffect } from "react";
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
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

// ─── Data ────────────────────────────────────────────────────────────────────
const STORES_DATA = {
  "pune-store": {
    city: "Pune",
    name: "Pune Lucira Store",
    rating: 4.8,
    images: ["/images/store/Pune.jpg"],
    storeHours: {
      weekday: { open: "10:30", close: "22:00" },
      weekend: { open: "10:30", close: "22:00" },
    },
    mapLink: "https://maps.google.com/?q=Pune+Lucira+Store",
    callLink: "tel:+918433667236",
    designLink: "/collections/pune-store",
    appointmentLink: "https://wa.me/919004435760?text=Hi,%20I%20would%20like%20to%20book%20an%20appointment%20at%20the%20Pune%20Store",
    facilities: [
      "Kids Area",
      "Design Your Ring",
      "Open Weekends",
      "Banks Nearby",
      "Parking Available",
      "Exclusive Offers",
    ],
    services: [
      { title: "Gold Exchange", icon: "/images/store/gold-exchange.svg" },
      { title: "Vault of Dreams", icon: "/images/store/vault.svg" },
      { title: "Carat Tester", icon: "/images/store/carat-tester.svg" },
      { title: "Jewelry Cleaning", icon: "/images/store/jewelry-cleaning.svg" },
    ],
    address: "Shop no. 3,4, Balgandharv Chowk, Sai Square, 5 & 6, Jangali Maharaj Rd, Pune, Maharashtra 411005",
  },
  "chembur-store": {
    city: "Chembur",
    name: "Chembur Lucira Store",
    rating: 4.7,
    images: ["/images/store/Chembur.jpg"],
    storeHours: {
      weekday: { open: "10:30", close: "22:00" },
      weekend: { open: "10:30", close: "22:00" },
    },
    mapLink: "https://maps.google.com/?q=Chembur+Lucira+Store",
    callLink: "tel:+919004402038",
    designLink: "/collections/chembur-store",
    appointmentLink: "https://wa.me/919004435760?text=Hi,%20I%20would%20like%20to%20book%20an%20appointment%20at%20the%20Chembur%20Store",
    facilities: [
      "Open on Weekends",
      "Banks Nearby",
      "Parking Availability",
      "Daily Offers",
    ],
    services: [
      { title: "Gold Exchange", icon: "/images/store/gold-exchange.svg" },
      { title: "Vault of Dreams", icon: "/images/store/vault.svg" },
      { title: "Carat Tester", icon: "/images/store/carat-tester.svg" },
      { title: "Jewelry Cleaning", icon: "/images/store/jewelry-cleaning.svg" },
    ],
    address: "Shop No. 3 Ground Floor, 487, Geraldine CHS LTD, Central Ave Rd, Chembur, Mumbai, Maharashtra 400071",
  },
  "sky-city-borivali-store": {
    city: "Borivali",
    name: "Borivali Lucira Store",
    rating: 4.9,
    images: ["/images/store/Borivali.jpg"],
    storeHours: {
      weekday: { open: "10:30", close: "21:30" },
      weekend: { open: "10:30", close: "21:30" },
    },
    mapLink: "https://maps.google.com/?q=Borivali+Lucira+Store",
    callLink: "tel:+918433667238",
    designLink: "/collections/sky-city-borivali-store",
    appointmentLink: "https://wa.me/919004435760?text=Hi,%20I%20would%20like%20to%20book%20an%20appointment%20at%20the%20Borivali%20Store",
    facilities: [
      "Design Your Ring",
      "Open Weekends",
      "Parking Available",
      "Exclusive Offers",
    ],
    services: [
      { title: "Gold Exchange", icon: "/images/store/gold-exchange.svg" },
      { title: "Vault of Dreams", icon: "/images/store/vault.svg" },
      { title: "Carat Tester", icon: "/images/store/carat-tester.svg" },
      { title: "Jewelry Cleaning", icon: "/images/store/jewelry-cleaning.svg" },
    ],
    address: "Sky City Mall, S-40, 2nd Floor, Western Express Hwy, Borivali East, Mumbai - 400066",
  },
  "noida-store": {
    city: "Noida",
    name: "Noida Lucira Store",
    rating: 4.9,
    images: ["/images/store/Noida.jpg"],
    storeHours: {
      weekday: { open: "10:30", close: "22:00" },
      weekend: { open: "10:30", close: "22:00" },
    },
    mapLink: "https://maps.google.com/?q=Noida+Lucira+Store",
    callLink: "tel:+918657392887",
    designLink: "/collections/noida-store",
    appointmentLink: "https://wa.me/919004435760?text=Hi,%20I%20would%20like%20to%20book%20an%20appointment%20at%20the%20Noida%20Store",
    facilities: [
      "Kids Area",
      "Design Your Ring",
      "Open Weekends",
      "Banks Nearby",
      "Parking Available",
      "Exclusive Offers",
    ],
    services: [
      { title: "Gold Exchange", icon: "/images/store/gold-exchange.svg" },
      { title: "Vault of Dreams", icon: "/images/store/vault.svg" },
      { title: "Carat Tester", icon: "/images/store/carat-tester.svg" },
      { title: "Jewelry Cleaning", icon: "/images/store/jewelry-cleaning.svg" },
    ],
    address: "SCO-17, Wave One Courtyard, Sector 18, Gautam Buddha Nagar, Noida, Uttar Pradesh: 201301",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isStoreOpenIST(store) {
  const indiaNow = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const day = indiaNow.getDay();
  const isWeekend = day === 0 || day === 6;
  const hours = isWeekend ? store.storeHours.weekend : store.storeHours.weekday;

  const [openHour, openMinute] = hours.open.split(":").map(Number);
  const [closeHour, closeMinute] = hours.close.split(":").map(Number);

  const currentMinutes = indiaNow.getHours() * 60 + indiaNow.getMinutes();
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

function formatTimings(store) {
  const { weekday, weekend } = store.storeHours;
  const formatTime = (time) => {
    let [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const same = weekday.open === weekend.open && weekday.close === weekend.close;
  if (same) {
    return `Monday - Sunday | ${formatTime(weekday.open)} - ${formatTime(weekday.close)}`;
  }
  return `Mon-Fri | ${formatTime(weekday.open)} - ${formatTime(weekday.close)}  •  Sat-Sun | ${formatTime(weekend.open)} - ${formatTime(weekend.close)}`;
}

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
export default function StoreCollectionBanner({ collectionHandle, bannerImages = [] }) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const store = STORES_DATA[collectionHandle];

  if (!store) return null;

  const storeIsOpen = isStoreOpenIST(store);
  const displayImages = bannerImages.length > 0 ? bannerImages : store.images;

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
              </div>

              <div className="absolute left-5 right-5 top-5 flex items-start justify-between z-[2]">
                <h1 className="font-figtree text-xl italic font-bold text-white drop-shadow-md">{store.name}</h1>
                <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <Star size={12} className="fill-[#f5c518] text-[#f5c518]" />
                  <span className="text-sm font-black text-white">{store.rating}</span>
                </div>
              </div>

              <div className="absolute right-4 bottom-18 z-[2]">
                <div className={`inline-flex items-center gap-2 rounded-full ${storeIsOpen ? "border-success bg-[#E8F5E9] text-[#28a745]" : "border-danger bg-[#f5e8e8] text-[#dc2626]"} border px-4 py-1.5 text-xs font-bold shadow-lg`}>
                  <Circle size={8} className={ storeIsOpen ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                  {storeIsOpen ? "Open Now" : "Closed"}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-3 z-[2]">
                <Clock3 size={18} className="text-[#5B4740]" />
                <div className="text-[11px] font-bold text-zinc-800 uppercase tracking-tighter leading-tight">
                  <span className="text-zinc-500 mr-1">Timings:</span> {formatTimings(store)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-base font-semibold text-black">Facilities at Store:</h4>
              <div className="flex flex-wrap gap-2.5">
                {store.facilities.map((item) => (
                  <span key={item} className="inline-block rounded-full bg-white py-1.25 px-[13.5px] text-black text-sm font-normal border border-gray-100 shadow-sm">{item}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-base font-semibold text-black">Services Offered at Store:</h4>
              <div className="grid grid-cols-2 gap-4">
                {store.services.map((item) => (
                  <div key={item.title} className="flex flex-col items-center justify-center rounded-lg bg-white py-2.5 px-9 text-center border border-gray-50 shadow-sm">
                     <div className="relative mb-3 h-10 w-10">
                        <LazyImage src={item.icon} alt={item.title} fill className="object-contain" />
                     </div>
                     <p className="text-sm text-primary">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-base font-semibold text-black">Address:</h4>
              <p className="text-base font-normal text-black leading-relaxed">{store.address}</p>
            </div>

            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-3">
                 <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm">
                   <a href={store.mapLink} target="_blank" rel="noopener noreferrer"><MapPinned className="mr-2 h-4 w-4" /> DIRECT ME</a>
                 </Button>
                 <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm">
                   <a href={store.callLink}><Phone className="mr-2 h-4 w-4" /> CALL US</a>
                 </Button>
               </div>
               <Button asChild className="h-12 w-full rounded-sm bg-primary text-white font-medium text-sm uppercase shadow-lg">
                 <a href={store.appointmentLink} target="_blank"><CalendarDays className="mr-2 h-4 w-4" />BOOK APPOINTMENT</a>
               </Button>
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
            </div>

            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-4 z-[2]">
              <h2 className="font-figtree text-2xl italic leading-none font-semibold text-white drop-shadow-md">{store.name}</h2>
              <div className="mt-0.5 flex items-center gap-1 text-white">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(store.rating) ? "fill-[#f5c518] text-[#f5c518]" : "text-white/50"} />
                  ))}
                </div>
                <span className="text-sm font-medium">{store.rating}</span>
              </div>
            </div>

            <div className="absolute bottom-6 left-3 right-3 flex flex-wrap items-center xl:justify-between gap-2 lg:justify-center rounded-full bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg z-[2]">
              <div className="flex items-center gap-2 xl:text-sm lg:text-xs uppercase">
                <Clock3 size={16} className="text-primary" />
                <span className="font-medium text-zinc-800">
                  <span className="font-bold text-zinc-500">Timings:</span> {formatTimings(store)}
                </span>
              </div>

              <div  className={`inline-flex items-center gap-2 rounded-full border ${storeIsOpen ? "border-success bg-success/10 text-[#28a745]" : "border-danger bg-danger/10 text-[#dc2626]"} px-3 py-1 text-sm font-bold`}>
                <Circle size={8} className={ storeIsOpen ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                {storeIsOpen ? "Open Now" : "Closed"}
              </div>
            </div>
          </div>

          {/* RIGHT: Store Details */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black tracking-tight">Facilities at Store:</h4>
              <div className="flex flex-wrap gap-3">
                {store.facilities.map((item) => (
                  <span key={item} className="rounded-full bg-white px-4 py-2 text-sm text-black border border-gray-100 shadow-sm transition-all hover:bg-primary hover:text-white cursor-default">{item}</span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black tracking-tight">Services Offered at Store:</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {store.services.map((item) => (
                  <ServiceCard key={item.title} item={item} />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black tracking-tight">Address:</h4>
              <p className="max-w-120 text-base leading-7 text-zinc-700 font-figtree">{store.address}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm hover:bg-primary hover:text-white transition-all">
                <a href={store.mapLink} target="_blank" rel="noopener noreferrer"><MapPinned className="mr-2 h-5 w-5" /> DIRECT ME</a>
              </Button>
              <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm uppercase shadow-sm hover:bg-primary hover:text-white transition-all">
                <a href={store.callLink}><Phone className="mr-2 h-5 w-5" /> CALL US</a>
              </Button>
            </div>

            <div className="mt-4">
              <Button asChild className="h-14 w-full text-white font-bold text-base uppercase tracking-wider shadow-lg bg-primary hover:opacity-90 transition-all active:scale-95">
                <a href={store.appointmentLink} target="_blank"><CalendarDays className="mr-3 h-6 w-6" /> BOOK APPOINTMENT</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
