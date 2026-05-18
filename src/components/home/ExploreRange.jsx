"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LazyImage from "../common/LazyImage";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { useState } from "react";

import "swiper/css";
import "swiper/css/pagination";

const CATEGORIES = [
  { name: "Rings", image: "/images/range/Rings.jpg", href: "/collections/rings" },
  { name: "Earrings", image: "/images/range/Earrings.jpg", href: "/collections/earrings" },
  { name: "Bracelets", image: "/images/range/Bracelets.jpg", href: "/collections/bracelets" },
  { name: "Necklaces", image: "/images/range/Necklaces.jpg", href: "/collections/necklaces" },
  { name: "Nosepins", image: "/images/range/Nosepin.jpg", href: "/collections/nosepins" },
  { name: "Mangalsutra", image: "/images/range/Mangalsutra.jpg", href: "/collections/mangalsutra" },
  { name: "Men's Ring", image: "/images/range/MensRing.jpg", href: "/collections/mens-rings" },
  { name: "Men's Stud", image: "/images/range/MensStud.jpg", href: "/collections/mens-stud" },
];

export default function ExploreRange() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const groupedCategories = [];
  for (let i = 0; i < CATEGORIES.length; i += 4) {
    groupedCategories.push(CATEGORIES.slice(i, i + 4));
  }

  return (
    <section className="w-full pt-5 bg-white overflow-hidden">
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
  return (
    <Link 
      href={cat.href}
      className="group relative aspect-313/362 block overflow-hidden rounded-md bg-gray-50"
    >
      <LazyImage 
        src={cat.image} 
        alt={cat.name} 
        fill
        sizes="(max-width: 1024px) 50vw, 25vw"
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