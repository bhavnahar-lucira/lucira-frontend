"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LazyImage from "../common/LazyImage";

const OCCASIONS = [
  { name: "For Her", image: "/images/love/ForHer.jpg", href: "/collections/gifts-for-her" },
  { name: "For Him", image: "/images/love/ForHim.jpg", href: "/collections/gifts-for-him" },
  { name: "For Mothers", image: "/images/love/ForMother.jpg", href: "/collections/gift-for-mother" },
  { name: "For Kids", image: "/images/love/ForKid.jpg", href: "/collections/kids-collection" },
];

export default function EveryoneYouLove() {
  return (
    <section className="w-full mt-10 md:mt-15 bg-[#FEF5F1] py-10 md:py-12">
      <div className="container-main">

        <div className="text-center mb-6 px-1 md:px-0">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">For Everyone You Love</h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">Crafted with care, for everyone you hold close.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {OCCASIONS.map((occ, index) => (
            <Link 
              key={index} 
              href={occ.href}
              className="relative aspect-[3/4.2] overflow-hidden group bg-gray-100 rounded-xl shadow-sm"
            >
              <LazyImage 
                src={occ.image} 
                alt={occ.name} 
                fill 
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/5 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 md:bottom-4 md:left-6 md:right-6 flex justify-between items-center text-white">
                <div className="flex flex-col">
                  <span className="text-[14px] md:text-2xl font-semibold">{occ.name}</span>
                  {occ.label && (
                    <span className="text-[14px] md:text-2xl lg:text-lg font-medium opacity-90 mt-1 uppercase tracking-wider italic">
                      {occ.label}
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-white/40 flex items-center justify-center transition-all group-hover:bg-white group-hover:text-black">
                  <ArrowRight size={16}  className="md:w-5 md:h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

