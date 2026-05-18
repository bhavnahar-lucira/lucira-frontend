"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LazyImage from "../common/LazyImage";

const OCCASIONS = [
  { name: "Engagement", image: "/images/occasion/1.jpg", href: "/collections/engagement-rings" },
  { name: "Wedding", image: "/images/occasion/2.jpg", href: "/collections/wedding-rings" },
  { name: "Anniversary", image: "/images/occasion/3.jpg", href: "/collections/anniversary-gifts" },
  { name: "Valentine's", image: "/images/occasion/4.jpg", href: "/collections/valentines-gift" },
];

export default function ShopByOccasion() {
  return (
    <section className="w-full my-8 md:my-12 bg-white">
      <div className="container-main">

        <div className="text-center mb-6 px-1 md:px-0">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">Shop By Occasion</h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">Jewelry for life's most meaningful moments</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {OCCASIONS.map((occ, index) => (
            <Link 
              key={index} 
              href={occ.href}
              className="relative aspect-[3/4.2] overflow-hidden group bg-gray-100 rounded-lg shadow-sm"
            >
              <LazyImage 
                src={occ.image} 
                alt={occ.name} 
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                priority={index < 2}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
              <div className="absolute bottom-4 left-4 right-4 md:bottom-4 md:left-6 md:right-6 flex justify-between items-center text-white">
                <span className="text-base md:text-2xl font-semibold">{occ.name}</span>
                <div className="shrink-0 w-6 h-6 md:w-10 md:h-10 rounded-full border border-white/40 flex items-center justify-center transition-all group-hover:bg-white group-hover:text-black">
                  <ArrowRight size={16} className="md:w-5 md:h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

