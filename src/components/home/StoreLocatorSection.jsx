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

function isStoreOpenIST(store) {
  const indiaNow = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const day = indiaNow.getDay();
  const isWeekend = day === 0 || day === 6;

  const hours = isWeekend
    ? store.storeHours.weekend
    : store.storeHours.weekday;

  const [openHour, openMinute] = hours.open.split(":").map(Number);
  const [closeHour, closeMinute] = hours.close.split(":").map(Number);

  const currentMinutes =
    indiaNow.getHours() * 60 + indiaNow.getMinutes();

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

  const same =
    weekday.open === weekend.open &&
    weekday.close === weekend.close;

  if (same) {
    return `Monday - Sunday | ${formatTime(weekday.open)} - ${formatTime(weekday.close)}`;
  }

  return `Mon-Fri | ${formatTime(weekday.open)} - ${formatTime(weekday.close)}  •  Sat-Sun | ${formatTime(weekend.open)} - ${formatTime(weekend.close)}`;
}

const stores = [
  {
    city: "Pune",
    name: "Pune Lucira Store",
    rating: 4.8,
    image: "/images/store/Pune.jpg",
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
    address:
      "Shop no. 3,4, Balgandharv Chowk, Sai Square, 5 & 6, Jangali Maharaj Rd, Pune, Maharashtra 411005",
  },
  {
    city: "Chembur",
    name: "Chembur Lucira Store",
    rating: 4.7,
    image: "/images/store/Chembur.jpg",
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
    address:
      "Shop No. 3 Ground Floor, 487, Geraldine CHS LTD, Central Ave Rd, Chembur, Mumbai, Maharashtra 400071",
  },
  {
    city: "Borivali",
    name: "Borivali Lucira Store",
    rating: 4.9,
    image: "/images/store/Borivali.jpg",
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
    address:
      "Sky City Mall, S-40, 2nd Floor, Western Express Hwy, Borivali East, Mumbai - 400066",
  },
  {
    city: "Noida",
    name: "Noida Lucira Store",
    rating: 4.9,
    image: "/images/store/Noida.jpg",
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
    address:
      "SCO-17, Wave One Courtyard, Sector 18, Gautam Buddha Nagar, Noida, Uttar Pradesh: 201301",
  },
];

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

export default function StoreLocatorSection() {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStore = stores[activeIndex];
  const storeIsOpen = isStoreOpenIST(activeStore);

  if (isMobile) {
    return (
      <section className="w-full bg-[#FEF5F1] py-6.5 mt-10 overflow-hidden">
        <div className="container-main">
          <div className="text-center mb-2 px-1 md:px-0">
            <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">Visit Lucira Store Near You</h2>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="flex gap-1.5">
              {stores.map((store, index) => (
                <button
                  key={store.city}
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
                <LazyImage src={activeStore.image} alt={activeStore.name} fill className="object-cover" />
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  style={{ background: "linear-gradient(180deg, #000000 -25.71%, rgba(0, 0, 0, 0.751968) 3.02%, rgba(0, 0, 0, 0) 18.55%)" }} 
                />
              </div>

              <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
                <h3 className="font-figtree text-xl italic font-black text-white">{activeStore.name}</h3>
                <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <Star size={12} className="fill-[#f5c518] text-[#f5c518]" />
                  <span className="text-sm font-black text-white">{activeStore.rating}</span>
                </div>
              </div>

              <div className="absolute right-4 bottom-18">
                <div className={`inline-flex items-center gap-2 rounded-full ${storeIsOpen ? "border-success bg-[#E8F5E9] text-[#28a745]" : "border-danger bg-[#f5e8e8] text-[#dc2626]"} border px-4 py-1.5 text-xs font-bold shadow-lg`}>
                  <Circle size={8} className={ storeIsOpen ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                  {storeIsOpen ? "Open Now" : "Closed"}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-3">
                <Clock3 size={18} className="text-[#5B4740]" />
                <div className="text-[11px] font-bold text-zinc-800 uppercase tracking-tighter leading-tight">
                  <span className="text-zinc-500 mr-1">Timings:</span> {formatTimings(activeStore)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-base font-semibold text-black">Facilities at Store:</h4>
              <div className="flex flex-wrap gap-2.5">
                {activeStore.facilities.map((item) => (
                  <span key={item} className="inline-block rounded-full bg-[#F7EEEA] py-1.25 px-[13.5px] text-black text-sm font-normal">{item}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-base font-semibold text-black">Services Offered at Store:</h4>
              <div className="grid grid-cols-2 gap-4">
                {activeStore.services.map((item) => (
                  <div key={item.title} className="flex flex-col items-center justify-center rounded-lg bg-white py-2.5 px-9 text-center">
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
              <p className="text-base font-normal text-black">{activeStore.address}</p>
            </div>

            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-3">
                 <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                   <a href={activeStore.mapLink} target="_blank" rel="noopener noreferrer"><MapPinned className="mr-2 h-4 w-4" /> DIRECT ME</a>
                 </Button>
                 <Button asChild variant="outline" className="h-12 rounded-sm border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                   <a href={activeStore.callLink}><Phone className="mr-2 h-4 w-4" /> CALL US</a>
                 </Button>
               </div>
               <Button asChild variant="outline" className="h-12 w-full rounded-sm border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                 <a href={activeStore.designLink}>VIEW AVAILABLE DESIGNS</a>
               </Button>
               <Button asChild className="h-12 w-full rounded-sm bg-[#5A413F] text-white font-medium text-sm sm:text-base uppercase shadow-lg">
                 <a href={activeStore.appointmentLink} target="_blank"><CalendarDays className="mr-2 h-4 w-4" />BOOK APPOINTMENT</a>
               </Button>
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
              key={store.city}
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
              <LazyImage src={activeStore.image} alt={activeStore.name} fill className="object-cover" />
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ background: "linear-gradient(180deg, #000000 -25.71%, rgba(0, 0, 0, 0.751968) 3.02%, rgba(0, 0, 0, 0) 18.55%)" }} 
              />
            </div>

            <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-4">
              <h3 className="font-figtree text-2xl italic leading-none font-semibold text-white drop-shadow-md">{activeStore.name}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-white">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-[#f5c518] text-[#f5c518]" />
                  ))}
                </div>
                <span className="text-sm font-medium">{activeStore.rating}</span>
              </div>
            </div>

            <div className="absolute bottom-6 left-3 right-3 flex flex-wrap items-center xl:justify-between gap-2 lg:justify-center rounded-full bg-[#f7efec] px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 xl:text-sm lg:text-xs uppercase">
                <Clock3 size={16} />
                <span className="font-medium">
                  <span className="font-semibold">Timings:</span> {formatTimings(activeStore)}
                </span>
              </div>

              <div  className={`inline-flex items-center gap-2 rounded-full border ${storeIsOpen ? "border-success bg-success/10 text-[#28a745]" : "border-danger bg-danger/10 text-[#dc2626]"} px-3 py-1 text-base font-bold`}>
                <Circle size={8} className={ storeIsOpen ? "fill-[#28a745]" : "fill-[#dc2626]"} />
                {storeIsOpen ? "Open Now" : "Closed"}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black">Facilities at Store:</h4>
              <div className="flex flex-wrap gap-3">
                {activeStore.facilities.map((item) => (
                  <span key={item} className="rounded-full bg-[#F7EEEA] px-4 py-2 text-base text-black">{item}</span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black">Services Offered at Store:</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {activeStore.services.map((item) => (
                  <ServiceCard key={item.title} item={item} />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-base font-semibold text-black">Address:</h4>
              <p className="max-w-120 text-base leading-7 text-black">{activeStore.address}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                <a href={activeStore.mapLink} target="_blank" rel="noopener noreferrer"><MapPinned className="mr-2 h-6 w-6" /> DIRECT ME</a>
              </Button>
              <Button asChild variant="outline" className="h-12 border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                <a href={activeStore.callLink}><Phone className="mr-2 h-6 w-6" /> CALL US</a>
              </Button>
            </div>

            <div className="mt-3">
              <Button asChild variant="outline" className="h-12 w-full border-primary bg-transparent text-black font-medium text-sm sm:text-base uppercase shadow-sm">
                <a href={activeStore.designLink}>VIEW AVAILABLE DESIGNS</a>
              </Button>
            </div>

            <div className="mt-3">
              <Button asChild className="h-12 w-full text-white font-medium text-sm sm:text-base uppercase">
                <a href={activeStore.appointmentLink} target="_blank"><CalendarDays className="mr-2 h-6 w-6" /> BOOK APPOINTMENT</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}