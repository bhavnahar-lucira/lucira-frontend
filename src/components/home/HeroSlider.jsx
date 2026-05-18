"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight} from "lucide-react";
import { useId } from "react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Button } from "../ui/button";
import LazyImage from "../common/LazyImage";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const slides = [
  {
    desktop: "/images/heroslider/Eterna-Band-Desktop.jpg",
    mobile: "/images/heroslider/Eterna-Band-Mobile.jpg",
  },
  {
    desktop: "/images/heroslider/Birthday-Desktop.jpg",
    mobile: "/images/heroslider/Birthday-Mobile.jpg",
  },
  {
    desktop: "/images/heroslider/NineKT-Desktop.jpg",
    mobile: "/images/heroslider/NineKT-Mobile.jpg",
  },
];

export default function HeroBanner() {
  const id = useId().replace(/:/g, "");
  const paginationElClass = `pagination-${id}`;
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="w-full">
      {/* HERO */}
      <div className={`hero-slider relative w-full ${isMobile ? "h-auto" : "h-145"} pb-5`}>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          loop
          navigation={{
            nextEl: ".hero-next",
            prevEl: ".hero-prev",
          }}
          pagination={{
            el: `.${paginationElClass}`,
            clickable: true,
            renderBullet: (index, className) => {
              return `<span class="${className} w-2! h-2! rounded-full! bg-gray-700! transition-all duration-300 [&.swiper-pagination-bullet-active]:bg-primary! [&.swiper-pagination-bullet-active]:w-6! md:[&.swiper-pagination-bullet-active]:w-6!"></span>`;
            },
          }}
          className="h-full"
        >
          {slides.map((slide, index) => {
            const img = isMobile ? slide.mobile : slide.desktop;
            return (
              <SwiperSlide key={index}>
                {isMobile ? (
                  <div className="flex flex-col bg-white">
                    {/* TOP IMAGE ON MOBILE */}
                    <div className="relative aspect-[4/3] w-full">
                      {index === 0 ? (
                        <Image
                          src={img}
                          alt="Hero Banner"
                          fill
                          priority
                          className="object-cover"
                        />
                      ) : (
                        <LazyImage
                          src={img}
                          alt="Hero Banner"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    {/* BOTTOM TEXT ON MOBILE */}
                    <div className="flex flex-col items-start px-6 py-8 bg-[#FDF7F4]">
                      <h2 className="text-3xl font-bold mb-3 font-abhaya text-zinc-900 leading-tight">
                        For Moments that Matter
                      </h2>
                      <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
                        Expertly crafted lab-grown diamonds with exceptional clarity & sparkle, designed to shine in every moment.
                      </p>
                      <Button className="h-12 px-8 py-3 w-full sm:w-fit text-sm font-bold tracking-widest bg-[#5B4740] hover:bg-[#4A3934] text-white uppercase rounded-sm transition-colors">
                        SHOP BESTSELLERS
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 h-full bg-secondary">
                    {/* LEFT TEXT */}
                    <div className="flex flex-col justify-center pl-24 pr-16">
                      <h1 className="text-[42px] font-semibold mb-4 font-abhaya">
                        For Moments that Matter
                      </h1>
                      <p className="text-black max-w-105 mb-6">
                        Expertly crafted with exceptional clarity & sparkle,
                        designed to shine in every moment with effortless elegance.
                      </p>
                      <Button className="h-11 px-6 py-3 w-fit text-sm tracking-wide hover:cursor-pointer">
                        SHOP BESTSELLERS
                      </Button>
                    </div>

                    {/* RIGHT IMAGE */}
                    <div className="relative h-full">
                      {index === 0 ? (
                        <Image
                          src={img}
                          alt="Hero Banner"
                          fill
                          priority
                          className="object-cover"
                        />
                      ) : (
                        <LazyImage
                          src={img}
                          alt="Hero Banner"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* NAVIGATION ARROWS - ONLY ON DESKTOP */}
        {!isMobile && (
          <>
            <button className="hero-prev absolute left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:cursor-pointer">
              <ChevronLeft size={18} className="text-white" />
            </button>
            <button className="hero-next absolute right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:cursor-pointer">
              <ChevronRight size={18} className="text-white" />
            </button>
          </>
        )}

        {/* PAGINATION DOTS */}
        <div className={`${paginationElClass} flex items-center justify-center gap-2 mt-4`}></div>
      </div>
    </div>
  );
}
