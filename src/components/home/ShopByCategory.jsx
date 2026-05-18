"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import FilterSkeleton from "./FilterSkeleton";
import LazyImage from "../common/LazyImage";

const CATEGORIES = [
  { label: "Rings", slug: "rings" },
  { label: "Earrings", slug: "earrings" },
  { label: "Bracelet", slug: "bracelets" },
  { label: "Necklaces", slug: "necklaces" },
  { label: "Mangalsutra", slug: "mangalsutra" }
];

const CATEGORIES_WITHOUT_SHAPES = ["bracelets", "necklaces", "mangalsutra"];

const CATEGORY_FILTERS = {
  "rings": {
    shapes: [
      { id: "oval", label: "OVAL", img: "/images/shapes/oval.png", href: "/collections/oval-rings" },
      { id: "round", label: "ROUND", img: "/images/shapes/round.png", href: "/collections/round-rings" },
      { id: "emerald", label: "EMERALD", img: "/images/shapes/emerald.png", href: "/collections/emerald-rings" },
      { id: "cushion", label: "CUSHION", img: "/images/shapes/cushion.png", href: "/collections/cushion-rings" },
      { id: "pear", label: "PEAR", img: "/images/shapes/pear.png", href: "/collections/pear-rings" },
      { id: "princess", label: "PRINCESS", img: "/images/shapes/princess.png", href: "/collections/princess-rings" },
      { id: "marquise", label: "MARQUISE", img: "/images/shapes/marquise.png", href: "/collections/marquise-rings" },
      { id: "heart", label: "HEART", img: "/images/shapes/heart.png", href: "/collections/heart-rings" },
    ],
    styles: [
      { id: "Engagement", label: "Engagement", img: "/images/styles/hoops.png", href: "/collections/engagement-rings" },
      { id: "Solitaire", label: "Solitaire", img: "/images/styles/solitaire.png", href: "/collections/solitaire-rings" },
      { id: "Eternity", label: "Eternity", img: "/images/styles/studs.png", href: "/collections/eternity-rings" },
      { id: "Stackable", label: "Stackable", img: "/images/styles/stackable.png", href: "/collections/stackable-rings" },
      { id: "Casual", label: "Casual", img: "/images/styles/Casual.png", href: "/collections/casual-rings" },
      { id: "Gemstone", label: "Gemstone", img: "/images/styles/gemstone.png", href: "/collections/gemstone-rings" },
      { id: "mens", label: "men's", img: "/images/styles/mens.png", href: "/collections/mens-rings" },
    ],
  },
  "earrings": {
    shapes: [
      { id: "Round", label: "Round", img: "/images/shapes/round.png", href: "/collections/earrings-round" },
      { id: "emerald", label: "EMERALD", img: "/images/shapes/emerald.png", href: "/collections/earrings-emerald" },
      { id: "marquise", label: "MARQUISE", img: "/images/shapes/marquise.png", href: "/collections/earrings-marquise" },
      { id: "cushion", label: "CUSHION", img: "/images/shapes/cushion.png", href: "/collections/earrings-cushion" },
      { id: "oval", label: "OVAL", img: "/images/shapes/oval.png", href: "/collections/earrings-oval" },
      { id: "pear", label: "PEAR", img: "/images/shapes/pear.png", href: "/collections/earrings-pear" },
      { id: "princess", label: "PRINCESS", img: "/images/shapes/princess.png", href: "/collections/earrings-princess" },
      { id: "heart", label: "HEART", img: "/images/shapes/heart.png", href: "/collections/earrings-heart" },
    ],
    styles: [
      { id: "Hoops", label: "Hoops", img: "/images/styles/hoops.png", href: "/collections/diamond-hoop-earrings" },
      { id: "Studs", label: "Studs", img: "/images/styles/studs.png", href: "/collections/stud-earrings" },
      { id: "Suidhagas", label: "Sui Dhagas", img: "/images/styles/suidhagas.png", href: "/collections/sui-dhagas" },
      { id: "Dangles", label: "Dangles", img: "/images/styles/dangles.png", href: "/collections/dangles" },
      { id: "Solitaire", label: "Solitaire", img: "/images/styles/solitaire.png", href: "/collections/solitaire-earrings" },
      { id: "Halo", label: "Halo", img: "/images/styles/halo.png", href: "/collections/earrings-halo" },
      { id: "Gemstone", label: "Gemstone", img: "/images/styles/gemstone.png", href: "/collections/earrings-gemstone" },
      { id: "mens", label: "men's", img: "/images/styles/mens.png", href: "/collections/mens-stud" },
    ],
  },
  "bracelets": {
    styles: [
      { id: "tennis", label: "Tennis", img: "/images/styles/solitaire.png", href: "/collections/tennis-bracelets" },
      { id: "cuff", label: "Cuffs", img: "/images/styles/hoops.png", href: "/collections/cuff-bracelets" },
      { id: "chain", label: "Chain", img: "/images/styles/stackable.png", href: "/collections/chain-bracelets" },
    ]
  },
  "necklaces": {
    styles: [
      { id: "pendants", label: "Pendants", img: "/images/styles/solitaire.png", href: "/collections/pendants" },
      { id: "chokers", label: "Chokers", img: "/images/styles/dangles.png", href: "/collections/chokers" },
    ]
  },
  "mangalsutra": {
    styles: [
      { id: "modern", label: "Modern", img: "/images/styles/Casual.png", href: "/collections/modern-mangalsutra" },
      { id: "traditional", label: "Traditional", img: "/images/styles/gemstone.png", href: "/collections/traditional-mangalsutra" },
    ]
  }
};

export default function ShopByCategory() {
  const [activeCategory, setActiveCategory] = useState("rings");
  const [activeTab, setActiveTab] = useState("shapes");
  const [isLoading, setIsLoading] = useState(false);

  const showShapeToggle = !CATEGORIES_WITHOUT_SHAPES.includes(activeCategory);
  const currentTab = showShapeToggle ? activeTab : "styles";
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeCategory, activeTab]);

  const filters = useMemo(() => {
    return CATEGORY_FILTERS[activeCategory]?.[currentTab] || [];
  }, [activeCategory, currentTab]);

  const handleCategoryChange = (slug) => {
    if (slug === activeCategory) return;
    setActiveCategory(slug);
    if (CATEGORIES_WITHOUT_SHAPES.includes(slug)) {
      setActiveTab("styles");
    }
  };

  return (
    <section className="w-full bg-[#FEF5F1] py-12 md:py-14 mt-12 md:mt-15 overflow-hidden">
      <div className="container-main">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center font-abhaya mb-6 md:mb-5 text-black">
          Shop By
        </h2>

        {/* Categories Tab Bar */}
        <div className="flex justify-start md:justify-center gap-6 md:gap-8 text-sm md:text-base mb-8 overflow-x-auto no-scrollbar border-b border-zinc-100/50 md:border-none px-4 md:px-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`relative pb-2 whitespace-nowrap capitalize font-medium cursor-pointer transition-all ${
                activeCategory === cat.slug ? "text-black" : "text-zinc-500 hover:text-black"
              }`}
            >
              {cat.label}
              {activeCategory === cat.slug && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900"></div>
              )}
            </button>
          ))}
        </div>
        
        {showShapeToggle && (
          <div className="flex justify-center mb-8 px-4">
            <div className="flex w-full md:w-auto border border-zinc-200 rounded-md overflow-hidden bg-white p-1">
              <button
                onClick={() => setActiveTab("shapes")}
                className={`flex-1 md:flex-none md:min-w-40 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider rounded transition-all ${
                  activeTab === "shapes" ? "bg-primary text-white" : "bg-white text-zinc-500"
                }`}
              >
                By Shape
              </button>
              <button
                onClick={() => setActiveTab("styles")}
                className={`flex-1 md:flex-none md:min-w-40 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider rounded transition-all ${
                  activeTab === "styles" ? "bg-primary text-white" : "bg-white text-zinc-500"
                }`}
              >
                By Style
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 md:gap-x-8 lg:gap-x-12 gap-y-8 md:gap-y-10 text-center px-4 md:px-10 min-h-40">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <FilterSkeleton key={i} />)
            : filters.map((item) => (
                <Link
                  key={item.id}
                  href={item.href || `/collections/${activeCategory}?${currentTab === "shapes" ? "shape" : "style"}=${item.id}`}
                  className="flex flex-col items-center gap-3 md:gap-4 group"
                >
                  <div className="relative w-14 h-14 md:w-20 md:h-20 transition-transform duration-300 group-hover:scale-110">
                    <LazyImage
                      src={item.img}
                      alt={item.label}
                      fill
                      sizes="(max-width: 768px) 56px, 80px"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs md:text-xs font-bold uppercase tracking-[0.05em] md:tracking-widest text-black group-hover:text-accent transition-colors leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}