"use client";

import { useState, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const HighlightMatch = ({ text, query }) => {
  if (!query) return <span className="text-[#1A1A1A]">{text}</span>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <span className="text-[#1A1A1A]">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="font-semibold text-black">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function SearchPopup({ onClose, searchQuery, searchResults, isSearching }) {
  // Extract matched collections and products
  const productsOnly = searchResults.filter(item => !item.isCollection);
  
  // Prioritize exact matches in collections
  const matchedCollections = searchResults
    .filter(item => item.isCollection)
    .sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchQuery.toLowerCase();
      const bExact = b.title.toLowerCase() === searchQuery.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

  // Static Categories for initial state
  const MOCK_CATEGORIES = [
    { title: "Solitaire Rings", image: "/images/shapes/round.png", href: "/collections/solitaire-rings" },
    { title: "Solitaire Earrings", image: "/images/styles/dangles.png", href: "/collections/solitaire-earrings" },
    { title: "Solitaire Pendant", image: "/images/menu/earring.jpg", href: "/collections/solitaire-pendants" },
    { title: "Solitaire Bracelets", image: "/images/menu/wedding-ring.jpg", href: "/collections/solitaire-bracelets" },
    { title: "Solitaire Nosering", image: "/images/menu/more-jewellery.jpg", href: "/collections/solitaire-noserings" },
    { title: "Solitaire Mangalsutra", image: "/images/menu/engagement-ring.jpg", href: "/collections/solitaire-mangalsutras" },
  ];

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-screen max-w-225 bg-white rounded-lg shadow-2xl z-999 border border-gray-100 overflow-hidden pointer-events-auto max-h-[85vh] md:max-h-none flex flex-col"
    >
      <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-white hover:scrollbar-thumb-gray-400">
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 md:gap-10">
            
            {/* Left Column: Initial Categories or Dynamic Collection Suggestions */}
            <div className="md:pr-10 lg:border-r border-gray-100 flex flex-col">
              {searchQuery.length === 0 ? (
                <>
                  <h3 className="text-xs md:text-sm font-semibold mb-4 md:mb-6 text-[#1A1A1A] uppercase tracking-wider">Categories</h3>
                  <div className="grid grid-cols-3 gap-3 md:gap-5">
                    {MOCK_CATEGORIES.map((cat, i) => (
                      <Link 
                        key={i} 
                        href={cat.href}
                        onClick={onClose}
                        className="group"
                      >
                        <div className="aspect-4/3 relative bg-[#F9F9F9] rounded-sm overflow-hidden mb-1.5 md:mb-2.5">
                          <Image 
                            src={cat.image} 
                            alt={cat.title} 
                            fill 
                            unoptimized={String(cat.image).includes("cdn.shopify.com") || String(cat.image).includes("myshopify.com")}
                            className="object-contain p-2 md:p-3 group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <p className="text-xs font-medium text-gray-700 text-center group-hover:text-primary transition-colors leading-tight">
                          {cat.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xs md:text-sm font-semibold mb-4 md:mb-6 text-[#1A1A1A] uppercase tracking-wider">Collection</h3>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-200">
                    {matchedCollections.length > 0 ? (
                      matchedCollections.map((col) => (
                        <Link 
                          key={col.id} 
                          href={col.url}
                          onClick={onClose}
                          className="group block p-3 bg-zinc-50 rounded-lg border border-zinc-100 hover:border-primary/20 hover:bg-white transition-all duration-300"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                              <HighlightMatch text={col.title} query={searchQuery} />
                            </h4>
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-1">
                              Collection
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-gray-400 text-xs italic">No matching collections found</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {searchQuery.length > 0 && (
                <div className="mt-auto pt-6 border-t border-gray-50">
                  <Link 
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={onClose}
                    className="text-primary font-bold text-xs md:text-sm underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all uppercase tracking-widest"
                  >
                    View All Results for "{searchQuery}"
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column: Products (Shows when typing) */}
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-4 md:mb-6 text-[#1A1A1A] uppercase tracking-wider">Products</h3>
              
              {searchQuery.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-37.5 md:h-50 text-gray-400">
                    <Search strokeWidth={1} className="mb-3 opacity-20 w-7 h-7 md:w-8 md:h-8" />
                    <p className="text-xs md:text-sm">Type to see product results</p>
                 </div>
              ) : isSearching ? (
                <div className="space-y-4 md:space-y-5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-sm" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : productsOnly.length > 0 ? (
                <div className="space-y-4 md:space-y-5">
                  {productsOnly.slice(0, 6).map((item) => (
                    <Link 
                      key={item.id} 
                      href={item.url}
                      onClick={onClose}
                      className="group flex gap-3 md:gap-4 items-center"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 relative bg-[#F9F9F9] rounded-sm overflow-hidden shrink-0">
                        <Image 
                          src={item.image || "/images/product/1.jpg"} 
                          alt={item.title} 
                          fill 
                          unoptimized={String(item.image).includes("cdn.shopify.com") || String(item.image).includes("myshopify.com")}
                          className="object-contain p-1.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs md:text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                          <HighlightMatch text={item.title} query={searchQuery} />
                        </h4>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">{item.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 md:py-10 text-center">
                  <p className="text-gray-400 text-xs md:text-sm italic">No matching products found</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
