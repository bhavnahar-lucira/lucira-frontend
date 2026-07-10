"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ETERNA_CARDS = [
  {
    title: "Half Eternity Bands",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Half_Eternity_jpg.jpg?v=1783673567",
    link: "/collections/half-eternity-rings"
  },
  {
    title: "Full Eternity Bands",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Full_Eternity_jpg.jpg?v=1783673567",
    link: "/collections/full-eternity-rings"
  },
  {
    title: "Eternity Hoops",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Eternity_Hoops_jpg.jpg?v=1783673567",
    link: "/collections/eternity-earrings"
  },
  {
    title: "Tennis Bracelets",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Tennis_Bracelet_jpg.jpg?v=1783673567",
    link: "/collections/tennis-bracelets"
  },
  {
    title: "Tennis Necklaces",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Tennis_Necklace_jpg.jpg?v=1783673567",
    link: "/collections/tennis-necklaces"
  }
];

export default function EternaBandsSection() {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const cardWidth = window.innerWidth >= 768 ? 304 : 256; // Card width + gap
      const targetScroll = direction === "left" ? scrollLeft - cardWidth : scrollLeft + cardWidth;
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth"
      });
    }
  };

  return (
    <section className="w-full pt-6 md:pt-15 pb-6 md:pb-15 bg-[#FEF5F1]/30 overflow-hidden border-b border-gray-50">
      <div className="container-main">
        {/* Header (Centered on all screens) */}
        <div className="text-center mb-8 px-4 lg:px-8">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1.5 text-black">
            Eterna Bands
          </h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.5] tracking-normal align-middle max-w-[600px] mx-auto mt-3 mb-3">
            Eterna is not just jewelry you put on. It’s a keepsake that stays across seasons, cities, losses, and celebrations. Each band is an unbroken line of light that says: this moment mattered. This love is real. This woman is eternal.
          </p>
        </div>

        {/* Slider Container Wrapper */}
        <div className="relative group/slider">
          {/* Scroll Buttons (Tablet/Mobile Only, hidden on Desktop since all 5 fit) */}
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[4] w-12 h-12 bg-white/90 hover:bg-white text-black shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 opacity-0 group-hover/slider:opacity-100 hidden md:flex lg:hidden cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[4] w-12 h-12 bg-white/90 hover:bg-white text-black shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 opacity-0 group-hover/slider:opacity-100 hidden md:flex lg:hidden cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth py-4 scrollbar-none snap-x snap-mandatory lg:overflow-x-visible lg:py-0"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}
          >
            {ETERNA_CARDS.map((card, idx) => (
              <a
                href={card.link}
                key={idx}
                className="relative aspect-[3/4] w-[240px] md:w-[280px] lg:w-[calc((100%-4*1.5rem)/5)] shrink-0 rounded-[4px] overflow-hidden group flex flex-col justify-end snap-start shadow-md border border-gray-100/50 cursor-pointer bg-white"
              >
                {/* Image with center origin zoom */}
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 origin-center"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
