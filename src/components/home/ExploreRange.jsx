"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { useState } from "react";
import { pushPromoClick } from "@/lib/gtm";

import "swiper/css";
import "swiper/css/pagination";

const CATEGORIES = [
  { name: "Rings", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Range_Rings.jpg", href: "/collections/rings" },
  { name: "Earrings", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Range_Earrings.jpg", href: "/collections/earrings" },
  { name: "Bracelets", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Range_Bracelets.jpg", href: "/collections/bracelets" },
  { name: "Necklaces", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Range_Necklaces.jpg", href: "/collections/necklaces" },
  { name: "Nosepins", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/homepage_nosepin.jpg?v=1780380197", href: "/collections/nosepins" },
  { name: "Mangalsutra", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Range_Mangalsutra.jpg", href: "/collections/mangalsutra" },
  { name: "Men's Ring", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Range_MensRing.jpg", href: "/collections/mens-rings" },
  { name: "Men's Stud", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Range_MensStud.jpg", href: "/collections/mens-stud" },
];

export default function ExploreRange({ bgClass = "bg-white", paddingClass = "pt-5 pb-5 lg:pb-10" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const groupedCategories = [];
  for (let i = 0; i < CATEGORIES.length; i += 4) {
    groupedCategories.push(CATEGORIES.slice(i, i + 4));
  }

  return (
    <section className={`w-full ${paddingClass} ${bgClass} overflow-hidden`}>
      <div className="container-main">
        <div className="text-left lg:text-center mb-6 px-1 lg:px-0">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Explore Our Range
          </h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">
            Find diamond jewelry pieces that match your style.
          </p>
        </div>
        <div className="block lg:hidden relative pb-10">
          <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            className="w-full"
          >
            {groupedCategories.map((group, groupIdx) => (
              <SwiperSlide key={groupIdx}>
                <div className="grid grid-cols-2 gap-3 px-0">
                  {group.map((cat, index) => (
                    <CategoryCard key={index} cat={cat} />
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <div className="absolute bottom-2 left-1 right-1 flex items-center justify-between gap-4 mt-4">
             <div className="flex-1 h-1 bg-zinc-100 relative overflow-hidden rounded-[3rem]">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#5B4740] transition-all duration-300"
                  style={{ 
                    width: `${(100 / groupedCategories.length)}%`,
                    transform: `translateX(${activeIndex * 100}%)`
                  }}
                />
             </div>
             <div className="text-sm text-zinc-800 tracking-tighter font-medium text-sm leading-[130%] tracking-normal">
                {activeIndex + 1}/{groupedCategories.length}
             </div>
          </div>
        </div>
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, index) => (
            <CategoryCard key={index} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ cat }) {
  const handleCategoryClick = () => {
    pushPromoClick({
      creative_name: "Explore Our Range",
      location_id: "homepage",
      promo_id: cat.name,
      promo_name: cat.name,
    });
  };

  return (
    <Link prefetch={false}
      href={cat.href}
      onClick={handleCategoryClick}
      className="group relative aspect-313/362 block overflow-hidden rounded-md bg-gray-50"
    >
      <Image 
        loader={shopifyLoader}
        src={cat.image} 
        alt={cat.name} 
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 lg:bottom-4 left-3 lg:left-4 right-3 flex justify-between items-center text-white">
        <span className="text-sm lg:text-2xl font-semibold text-base leading-none tracking-normal align-middle">{cat.name}</span>
        <div className="w-6 h-6 lg:w-10 lg:h-10 rounded-full border border-white/40 flex items-center justify-center transition-all group-hover:bg-white group-hover:text-black">
          <ArrowRight size={16} className="lg:w-5 lg:h-5" />
        </div>
      </div>
    </Link>
  );
}
