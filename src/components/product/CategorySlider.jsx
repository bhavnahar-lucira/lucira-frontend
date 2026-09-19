"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useId } from "react";
import Link from "next/link";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";

const CATEGORIES = [
  { id: 1, name: "Rings", handle: "rings", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rings_cdcd476d-83ad-4bc8-9463-0a13217a051c.jpg?v=1788436552" },
  { id: 2, name: "Earrings", handle: "earrings", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Earrings_15f534ee-2965-489d-bb83-f5293775d792.jpg?v=1788436551" },
  { id: 3, name: "Bracelets", handle: "bracelets", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Tennis-Bracelet.jpg?v=1788436552" },
  { id: 4, name: "Necklaces", handle: "necklaces", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Necklaces_c3067ae6-14cc-45c4-9d7b-6a66ae6d5f69.jpg?v=1788436552" },
  { id: 5, name: "Nosepins", handle: "nosepins", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Nosepins.jpg?v=1788436551" },
  { id: 6, name: "Mangalsutra", handle: "mangalsutra", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Mangalsutras.jpg?v=1788436552" },
  { id: 7, name: "Men's Ring", handle: "mens-rings", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Men_27s-Ring.jpg?v=1788436552" },
  { id: 8, name: "Men's Stud", handle: "mens-stud", image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Men_27s-Stud.jpg?v=1788436552" },
];

export default function CategorySlider() {
  const id = useId().replace(/:/g, "");
  
  const prevElClass = `prev-${id}`;
  const nextElClass = `next-${id}`;
  const paginationElClass = `pagination-${id}`;

  return (
    <section className="w-full pt-16 pb-2 bg-white overflow-hidden">
      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17">
        <div className="text-center mb-6">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Explore Our Range
          </h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">
            Find diamond jewelry pieces that match your style.
          </p>
        </div>

        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1.2}
            navigation={{
              nextEl: `.${nextElClass}`,
              prevEl: `.${prevElClass}`,
            }}
            pagination={{
              el: `.${paginationElClass}`,
              clickable: true,
              renderBullet: (index, className) => {
                return `<span class="${className} w-2! h-2! rounded-full! bg-gray-300! transition-all duration-300 [&.swiper-pagination-bullet-active]:bg-black! [&.swiper-pagination-bullet-active]:w-6! md:[&.swiper-pagination-bullet-active]:w-6! cursor-pointer"></span>`;
              },
            }}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 },
              1280: { slidesPerView: 4 },
            }}
            className="w-full overflow-visible!"
          >
            {CATEGORIES.map((category) => (
              <SwiperSlide key={category.id}>
                <Link
                  href={`/collections/${category.handle}`}
                  prefetch={false}
                  className="group block relative aspect-4/5 bg-gray-50 overflow-hidden rounded-md"
                >
                  {/* Category Image */}
                  <div className="w-full h-full transition-transform duration-700 group-hover:scale-110">
                    <Image loader={shopifyLoader}
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                  {/* Category Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 flex justify-between items-center text-white">
                    <span className="text-[22px] font-semibold text-white">
                      {category.name}
                    </span>

                    <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:text-black">
                      <ArrowRight
                        size={18}
                        className="transition-colors duration-300"
                      />
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation & Pagination Controls */}
          <div className="flex justify-between items-center mt-11">
            {/* Pagination on the left */}
            <div className={`${paginationElClass} flex items-center gap-2 !static !w-auto`}></div>
            
            {/* Arrows on the right */}
            <div className="flex items-center gap-4">
              <button className={`${prevElClass} w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer`}>
                <ChevronLeft size={24} />
              </button>
              <button className={`${nextElClass} w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer`}>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .${paginationElClass} .swiper-pagination-bullet {
          margin: 0 !important;
          cursor: pointer;
        }
      `}} />
    </section>
  );
}
