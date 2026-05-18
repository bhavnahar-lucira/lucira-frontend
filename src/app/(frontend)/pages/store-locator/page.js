"use client";

import { useState, useEffect, useId } from "react";
import LazyImage from "@/components/common/LazyImage";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { 
  MapPinned, 
  Phone, 
  CalendarDays, 
  Search, 
  Navigation as NavIcon,
  Star,
  Clock3,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── DATA ────────────────────────────────────────────────────────────────────

const allStores = [
  {
    city: "Pune",
    name: "Pune Lucira Store",
    rating: 4.8,
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Store-PLP-2_900x.jpg?v=1765807125",
    timings: "Monday - Sunday | 10:30 am - 10:00 pm",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+JM+Road+Pune/@18.5233058,73.8452878,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc2c1929b1639f7:0x7d0f5ff74de52a8d!8m2!3d18.5233007!4d73.8478627",
    whatsappLink: "https://api.whatsapp.com/send/?phone=%2B8433667236&text=Hi%2C+I%E2%80%99d+like+to+visit+the+Pune+Lucira+store+and+explore+the+designs.&type=phone_number&app_absent=0",
    designLink: "/collections/pune-store",
    directionsLink: "https://www.lucirajewelry.com/collections/pune-store",
    lat: 18.5233,
    lng: 73.8478,
    address: "Shop no. 3,4, Balgandharv Chowk, Sai Square, 5 & 6, Jangali Maharaj Rd, Pune, Maharashtra 411005",
  },
  {
    city: "Noida",
    name: "Noida Lucira Store",
    rating: 4.9,
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Noida_Store_1920_823_jpg_1920x823_crop_center.jpg?v=1776422892",
    timings: "Monday - Sunday | 10:30 am - 10:00 pm",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+Wave+One+Mall,+Noida/data=!4m2!3m1!1s0x0:0xbdc183588be81689?sa=X&ved=1t:2428&ictx=111",
    whatsappLink: "https://api.whatsapp.com/send?phone=918657392887&text=Hi%2C%20I%E2%80%99d%20like%20to%20visit%20the%20Noida%20Store%20and%20explore%20the%20designs.",
    designLink: "/collections/noida-store",
    directionsLink: "https://www.lucirajewelry.com/collections/noida-store",
    lat: 28.5708,
    lng: 77.3261,
    address: "SCO-17, Wave One Courtyard, Sector 18, Gautam Buddha Nagar, Noida, Uttar Pradesh 201301",
  },
  {
    city: "Chembur",
    name: "Chembur Lucira Store",
    rating: 4.7,
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Store-Collection-Banner-2_900x.jpg?v=1760699342",
    timings: "Monday - Sunday | 10:30 am - 10:00 pm",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+Chembur+Mumbai/@19.0576005,72.898121,17z/data=!3m1!4b1!4m6!3m5!1s0x3be7c782f7511b79:0xaa877f3bbd754bfc!8m2!3d19.0575954!4d72.9006959!16s%2Fg%2F11xtgz09vw",
    whatsappLink: "https://api.whatsapp.com/send/?phone=%2B+919004402038&text=Hi%2C+I%E2%80%99d+like+to+visit+the+Chembur+Lucira+store+and+explore+the+designs.&type=phone_number&app_absent=0",
    designLink: "/collections/chembur-store",
    directionsLink: "/collections/chembur-store",
    lat: 19.0576,
    lng: 72.9007,
    address: "Shop No. 3 Ground Floor, 487, Geraldine CHS LTD, Central Ave Rd, Chembur, Mumbai, Maharashtra 400071",
  },
  {
    city: "Borivali",
    name: "Borivali Lucira Store",
    rating: 4.9,
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Store-Collection-Banner3_jpg_900x.jpg?v=1769237134",
    timings: "Monday - Sunday | 10:30 am - 10:00 pm",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+Borivali+Mumbai/data=!4m2!3m1!1s0x0:0x8e0b915ac78ac1?sa=X&ved=1t:2428&ictx=111",
    whatsappLink: "https://api.whatsapp.com/send/?phone=%2B8433667238&text=Hi%2C+I%E2%80%99d+like+to+visit+the+Borivali+Lucira+store+and+explore+the+designs.&type=phone_number&app_absent=0",
    designLink: "/collections/sky-city-borivali-store",
    directionsLink: "/collections/sky-city-borivali-store",
    lat: 19.2307,
    lng: 72.8567,
    address: "Sky City Mall, S-40, 2nd Floor, Western Express Hwy, Borivali East, Mumbai - 400066",
  },
  {
    city: "Malad",
    name: "Malad Head Office",
    rating: 5.0,
    image: "https://luciraonline.myshopify.com/cdn/shop/files/Lucira_contact_us_grid_900x.png?v=1757660196",
    timings: "Monday - Sunday | 10:30 am - 10:00 pm",
    mapLink: "https://www.google.com/maps/place/Lucira+Jewelry+%7C+Jewellery+Store+in+Mumbai/data=!4m2!3m1!1s0x0:0x268fe0bb8a89f9bb?sa=X&ved=1t:2428&ictx=111",
    whatsappLink: "https://api.whatsapp.com/send?phone=919004435760&text=Hi%2C%20I%E2%80%99d%20like%20to%20visit%20the%20Head%20Office%20and%20explore%20the%20designs.",
    designLink: "/collections/malad",
    directionsLink: "/collections/malad",
    lat: 19.1743,
    lng: 72.8445,
    address: "Office 1402-2, DLH Park, 14th Floor, SV Rd, Mumbai, Maharashtra 400062",
  },
];

const services = [
  {
    title: "Gold Exchange",
    subtitle: "Upgrade your old gold with our transparent exchange process.",
    icon: "/images/store/gold-exchange.svg",
  },
  {
    title: "Vault of Dreams",
    subtitle: "Explore our exclusive collection of high-end diamond jewelry.",
    icon: "/images/store/vault.svg",
  },
  {
    title: "Carat Tester",
    subtitle: "Verify the purity of your gold with our precision technology.",
    icon: "/images/store/carat-tester.svg",
  },
  {
    title: "Jewelry Cleaning",
    subtitle: "Complimentary professional cleaning to keep your pieces sparkling.",
    icon: "/images/store/jewelry-cleaning.svg",
  },
];

const faqs = [
  {
    question: "Why visit a store in person?",
    answer: "Seeing diamonds in person lets you truly understand their brilliance, sparkle, and craftsmanship. Our stores allow you to compare pieces, feel the finish, and make confident choices with expert guidance.",
  },
  {
    question: "What is the in store diamond experience like?",
    answer: "You can view diamonds under proper lighting, examine clarity and cut up close, and understand how each piece looks when worn. Our team walks you through every detail at your pace.",
  },
  {
    question: "Will I get any discounts at the store?",
    answer: "Yes. Depending on timing, our stores may offer discounts on diamond prices, making charges, or sometimes both.",
  },
  {
    question: "Are there fun activities to do at the experience centre?",
    answer: "Absolutely. Our centres host interactive and engaging activities that make your visit enjoyable beyond shopping.",
  },
  {
    question: "How many jewellery designs can I see in one visit?",
    answer: "Each experience centre displays over 700 unique designs, so you can explore a wide variety in person.",
  },
];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

function checkIfOpen(timingsStr) {
  try {
    if (!timingsStr || !timingsStr.includes("|")) return false;
    const timePart = timingsStr.split("|")[1].trim();
    const [startStr, endStr] = timePart.split("-").map((s) => s.trim());

    const parseTime = (s) => {
      const match = s.match(/(\d+):(\d+)\s*(am|pm)/i);
      if (!match) return 0;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toLowerCase();
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startTime = parseTime(startStr);
    const endTime = parseTime(endStr);

    const now = new Date();
    const day = now.getDay();
    if (timingsStr.toLowerCase().includes("monday - saturday") && day === 0) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= startTime && currentMinutes < endTime;
  } catch (e) {
    return false;
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function StoreLocatorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStores, setFilteredStores] = useState(allStores);
  const [userLocation, setUserLocation] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const isMobile = useMediaQuery("(max-width: 767px)");

  const id = useId().replace(/:/g, "");
  const paginationElClass = `pagination-${id}`;

  const heroSlides = [
    {
      image: "/images/store/store.jpg",
      title: "Find a Store",
      desc: "Experience the brilliance of Lucira in person. Visit our experience centers to explore over 700+ unique designs."
    },
    {
      image: "/images/store/Noida.jpg",
      title: "Visit Lucira",
      desc: "Get expert guidance for your perfect piece at our nearest experience center."
    },
    {
      image: "/images/store/Pune.jpg",
      title: "Store Locator",
      desc: "Find us in your city and explore our latest collections with personalized assistance."
    }
  ];

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();

    if (/^\d{6}$/.test(query)) {
      setStatusMsg("Searching by pincode...");
      fetch(`https://nominatim.openstreetmap.org/search?postalcode=${query}&country=India&format=json`)
        .then(r => r.json())
        .then(d => {
          if (d[0]) {
            const location = {
              lat: parseFloat(d[0].lat),
              lng: parseFloat(d[0].lon)
            };
            setUserLocation(location);
            calculateDistancesAndFilter(location);
            setStatusMsg(`Showing stores near ${query}`);
          } else {
            setStatusMsg("Pincode not found.");
          }
        })
        .catch(() => setStatusMsg("Error searching pincode."));
      return;
    }

    const filtered = allStores.filter(store =>
      store.name.toLowerCase().includes(query) ||
      store.city.toLowerCase().includes(query) ||
      store.address.toLowerCase().includes(query)
    );
    setFilteredStores(filtered);
    setStatusMsg("");
  };

  const calculateDistancesAndFilter = (location) => {
    const withDistance = allStores.map(store => ({
      ...store,
      distance: getDistance(location.lat, location.lng, store.lat, store.lng)
    }));
    withDistance.sort((a, b) => a.distance - b.distance);
    setFilteredStores(withDistance);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setStatusMsg("Geolocation is not supported by your browser.");
      return;
    }

    setStatusMsg("Locating you...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(location);
        calculateDistancesAndFilter(location);

        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`)
          .then(r => r.json())
          .then(d => {
            if (d?.address?.postcode) {
              const pin = d.address.postcode.replace(/\s+/g, '');
              setSearchQuery(pin);
              setStatusMsg(`Detected location: ${pin}`);
            } else {
              setStatusMsg("Showing nearby stores.");
            }
          })
          .catch(() => setStatusMsg("Showing nearby stores."));
      },
      () => {
        setStatusMsg("Unable to retrieve your location.");
      }
    );
  };

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredStores(allStores);
      setStatusMsg("");
    }
  }, [searchQuery]);

  return (
    <div className="font-figtree text-[#333]">
      {/* ═══════════════════════════════════════════
          1. HERO SECTION (BANNER SLIDER)
      ═══════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          slidesPerView={1}
          loop
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation={{
            nextEl: ".hero-next",
            prevEl: ".hero-prev",
          }}
          pagination={{
            el: `.${paginationElClass}`,
            clickable: true,
            renderBullet: (index, className) => {
              return `<span class="${className} w-2! h-2! rounded-full! bg-gray-700! transition-all duration-300 [&.swiper-pagination-bullet-active]:bg-primary! [&.swiper-pagination-bullet-active]:w-6!"></span>`;
            },
          }}
          className={`w-full ${isMobile ? "h-auto" : "h-145"}`}
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              {isMobile ? (
                <div className="flex flex-col bg-white">
                  <div className="relative aspect-[4/3] w-full">
                    <LazyImage
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start px-6 py-8 bg-[#FDF7F4]">
                    <h2 className="text-3xl font-bold mb-3 font-abhaya text-zinc-900 leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
                      {slide.desc}
                    </p>
                    <Button
                      onClick={() => document.getElementById('locator-section').scrollIntoView({ behavior: 'smooth' })}
                      className="h-12 px-8 py-3 w-full sm:w-fit text-sm font-bold tracking-widest bg-[#5B4740] hover:bg-[#4A3934] text-white uppercase rounded-sm transition-colors"
                    >
                      LOCATE NOW
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 h-full bg-secondary">
                  <div className="flex flex-col justify-center pl-24 pr-16">
                    <h1 className="text-[42px] font-semibold mb-4 font-abhaya text-zinc-900 leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-black max-w-105 mb-8 leading-relaxed">
                      {slide.desc}
                    </p>
                    <Button
                      onClick={() => document.getElementById('locator-section').scrollIntoView({ behavior: 'smooth' })}
                      className="h-11 px-8 py-3 w-fit text-sm font-bold tracking-widest bg-primary hover:bg-primary/90 text-white uppercase rounded-sm transition-all"
                    >
                      LOCATE NOW
                    </Button>
                  </div>
                  <div className="relative h-full">
                    <LazyImage
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>

        {!isMobile && (
          <>
            <button className="hero-prev absolute left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:cursor-pointer transition-all hover:bg-black/80">
              <ChevronLeft size={18} className="text-white" />
            </button>
            <button className="hero-next absolute right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:cursor-pointer transition-all hover:bg-black/80">
              <ChevronRight size={18} className="text-white" />
            </button>
          </>
        )}

        <div className={`${paginationElClass} flex items-center justify-center gap-2 mt-4 absolute bottom-6 left-0 right-0 z-20`}></div>
      </section>

      {/* ═══════════════════════════════════════════
          2. STORE LOCATOR SECTION
      ═══════════════════════════════════════════ */}
      <section id="locator-section" className="w-full py-12 md:py-15 bg-white overflow-hidden">
        <div className="container-main">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl font-black font-abhaya mb-3 text-zinc-900 tracking-tight uppercase">
              Store Locator
            </h2>
            <p className="text-zinc-600 max-w-[600px] mx-auto text-sm md:text-base leading-relaxed">
              Search by city, pincode or use your current location to find the nearest Lucira store.
            </p>
          </div>

          <div className="max-w-[750px] mx-auto mb-12 md:mb-15">
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="Search City, Pincode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 h-14 bg-gray-50 border border-zinc-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm"
                />
              </div>
              <Button onClick={handleSearch} className="h-14 px-10 bg-primary text-white hover:bg-primary/90 rounded-sm font-bold tracking-widest text-xs uppercase">
                SEARCH
              </Button>
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] flex-1 bg-zinc-100"></div>
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">OR</span>
              <div className="h-[1px] flex-1 bg-zinc-100"></div>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="outline"
                onClick={handleLocateMe}
                className="h-14 px-8 border-zinc-200 hover:border-zinc-800 text-zinc-800 hover:text-zinc-800  hover:bg-zinc-50 rounded-sm font-bold tracking-widest text-xs uppercase transition-all"
              >
                <NavIcon className="mr-2 h-4 w-4" /> FIND NEAREST STORES
              </Button>
              {statusMsg && <p className="mt-3 text-xs text-zinc-400 italic font-medium">{statusMsg}</p>}
            </div>
          </div>

          {/* ── STORE CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredStores.length > 0 ? (
              filteredStores.map((store, i) => (
                <div key={i} className="group flex flex-col bg-white border border-[#e6e1de] rounded-sm overflow-hidden transition-all hover:border-black/10">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <LazyImage
                      src={store.image}
                      alt={store.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-all duration-700"
                    />
                    {store.distance && (
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black text-green-700 shadow-sm border border-green-100 uppercase tracking-widest">
                        {store.distance.toFixed(1)} km away
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{store.city}</span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-[#f5c518] text-[#f5c518]" />
                        <span className="text-xs font-bold text-zinc-600">{store.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-black font-abhaya text-zinc-900 mb-3 tracking-tight group-hover:text-primary transition-colors leading-none">{store.name}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed mb-6 min-h-[40px] font-medium">
                      {store.address}
                    </p>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-sm border border-zinc-100/50">
                        <Clock3 size={16} className="text-zinc-400" />
                        <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">
                          {store.timings}
                          {checkIfOpen(store.timings) ? (
                            <span className="ml-2 text-green-600"> — OPEN NOW</span>
                          ) : (
                            <span className="ml-2 text-red-500"> — CLOSED</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Connect with Us — WhatsApp */}
                        <Button asChild variant="outline" className="h-11 rounded-sm border-zinc-200 text-zinc-600 hover:border-[#25D366] hover:text-[#25D366] hover:bg-white font-figtree font-semibold text-sm transition-all">
                          <a href={store.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                            <span className="hidden xl:block">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </span>
                            Connect with Us
                          </a>
                        </Button>

                        {/* Get Directions */}
                        <Button asChild className="h-11 rounded-sm bg-[#5B4740] hover:bg-[#4A3934] text-white font-figtree font-semibold text-sm transition-all">
                          <a href={store.designLink} target="_blank" rel="noopener noreferrer">See Designs</a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-100 rounded-lg">
                <p className="text-zinc-400 font-bold tracking-widest text-sm uppercase">No stores found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. OUR SERVICES SECTION
      ═══════════════════════════════════════════ */}
      <section className="w-full py-14 md:py-20 bg-[#FAF9F6] overflow-hidden">
        <div className="container-main">
          <div className="text-center mb-12 md:mb-15">
            <h2 className="text-3xl md:text-4xl font-black font-abhaya mb-4 text-zinc-900 tracking-tight uppercase">
              Our Services
            </h2>
            <p className="text-zinc-500 max-w-[650px] mx-auto text-sm md:text-base leading-relaxed">
              We offer a range of specialized services at our centers to ensure a premium experience for every visitor.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {services.map((service, i) => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-[#e6e1de] hover:border-primary/30 transition-all group text-center flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#FEF5F1] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <LazyImage src={service.icon} alt={service.title} width={32} height={32} className="object-contain" />
                </div>
                <h3 className="text-lg font-black font-abhaya text-zinc-900 mb-3 leading-none">{service.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  {service.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. FAQ SECTION
      ═══════════════════════════════════════════ */}
      <section className="w-full py-14 md:py-20 bg-white overflow-hidden">
        <div className="container-main max-w-[900px]">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-black font-abhaya mb-4 text-zinc-900 tracking-tight uppercase">
              Store Related Questions
            </h2>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
              Find answers to common questions about visiting our stores and available services.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
            {faqs.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white border border-[#e6e1de] rounded-sm overflow-hidden px-5 md:px-8"
              >
                <AccordionTrigger className="hover:no-underline py-5 md:py-6 text-left group">
                  <span className="text-base md:text-lg font-black text-zinc-900 font-abhaya pr-4 group-hover:text-primary transition-colors">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 md:pb-8 pt-0">
                  <div className="text-sm md:text-[15px] leading-relaxed text-zinc-600 font-figtree font-medium">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}