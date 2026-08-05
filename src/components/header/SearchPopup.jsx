"use client";

import { useState, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fetchCollectionProducts, fetchAnalyticsSearch, fetchHomeComponent } from "@/lib/api";

const HighlightMatch = ({ text, query, reverse = false }) => {
  if (!query) return <span className="text-[#1A1A1A]">{text}</span>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <span className="text-[#1A1A1A]">
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        if (reverse) {
          return isMatch ? (
            part
          ) : (
            <strong key={i} className="font-bold text-black">
              {part}
            </strong>
          );
        } else {
          return isMatch ? (
            <strong key={i} className="font-semibold text-black">
              {part}
            </strong>
          ) : (
            part
          );
        }
      })}
    </span>
  );
};

export default function SearchPopup({
  onClose,
  searchQuery,
  searchResults,
  isSearching,
}) {
  const [bestsellers, setBestsellers] = useState([]);
  const [isLoadingBestsellers, setIsLoadingBestsellers] = useState(false);
  const handlePromoClick = ({ promo_id, promo_name, creative_name }) => {
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: "promoClick",
      promoClick: {
        promo_id: promo_id,
        promo_name: promo_name,
        creative_name: creative_name,
      },
    });
  };
  const productsOnly = searchResults.filter((item) => !item.isCollection);

  // Prioritize exact matches in collections
  const matchedCollections = searchResults
    .filter((item) => item.isCollection && !item.title.toLowerCase().includes('byj') && !item.url.toLowerCase().includes('byj'))
    .sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchQuery.toLowerCase();
      const bExact = b.title.toLowerCase() === searchQuery.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

  // Dynamic states
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Fetch Bestsellers & Analytics
  useEffect(() => {
    // 1. Load Recent Searches
    try {
      const stored = localStorage.getItem("@recent_searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load recent searches", e);
    }

    const fetchData = async () => {
      if (searchQuery.length > 0) return; // Only fetch when empty

      // Fetch Bestsellers
      if (bestsellers.length === 0) {
        setIsLoadingBestsellers(true);
        try {
          const data = await fetchCollectionProducts({ handle: "bestseller", limit: 3 });
          const formatPrice = (num) => {
            if (!num && num !== 0) return "";
            return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(Number(num)));
          };
          const mapped = (data.products || []).filter(p => !p.tags?.some(t => t?.toLowerCase() === 'hidden')).map((p) => ({
            id: p.shopifyId || p.id,
            title: p.title,
            url: `/products/${p.handle}`,
            image: p.image || p.variants?.[0]?.image || "",
            price: formatPrice(p.price_breakup?.total || p.price),
          }));
          setBestsellers(mapped.slice(0, 3));
        } catch (err) {
          console.error("Error fetching bestsellers:", err);
        } finally {
          setIsLoadingBestsellers(false);
        }
      }

      // Fetch Trending Searches if not loaded
      if (trendingSearches.length === 0) {
        setIsLoadingTrending(true);
        try {
          const ga4Data = await fetchHomeComponent("ga4-search-queries").catch(() => null);

          const actualGa4Data = ga4Data?.data ? ga4Data.data : ga4Data;
          if (Array.isArray(actualGa4Data)) {
            setTrendingSearches(actualGa4Data.slice(0, 10));
          }
        } catch (err) {
          console.error("Error fetching trending search data:", err);
        } finally {
          setIsLoadingTrending(false);
        }
      }
    };

    fetchData();
  }, [searchQuery, bestsellers.length, trendingSearches.length]);

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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8 md:gap-10">
            {/* Left Column: Products (Shows when typing) */}
            <div className="md:pr-10 lg:border-r border-gray-100 flex flex-col">
              <h3 className="text-sm md:text-base font-semibold mb-4 md:mb-6 text-[#1A1A1A] uppercase tracking-wider">
                {searchQuery.length === 0 ? "Bestseller Products" : "Products"}
              </h3>

              {searchQuery.length === 0 ? (
                isLoadingBestsellers ? (
                  <div className="space-y-4 md:space-y-5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-sm" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 bg-gray-100 rounded w-3/4" />
                          <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bestsellers.length > 0 ? (
                  <div className="space-y-4 md:space-y-5">
                    {bestsellers.map((item) => (
                      <Link
                        key={item.id}
                        href={item.url}
                        prefetch={false}
                        onClick={() => {
                          handlePromoClick({
                            promo_id: item.id,
                            promo_name: item.title,
                            creative_name: "Search Popup - Bestseller",
                          });

                          onClose();
                        }}
                        className="group flex gap-3 md:gap-4 items-center"
                      >
                        <div className="w-12 h-12 md:w-14 md:h-14 relative rounded-md overflow-hidden shrink-0 bg-transparent">
                          <Image
                            src={item.image || "/images/product/1.jpg"}
                            alt={item.title}
                            fill
                            unoptimized={
                              String(item.image).includes("cdn.shopify.com") ||
                              String(item.image).includes("myshopify.com")
                            }
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs md:text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs font-bold text-gray-900 mt-0.5">
                            {item.price}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-37.5 md:h-50 text-gray-400">
                    <Search
                      strokeWidth={1}
                      className="mb-3 opacity-20 w-7 h-7 md:w-8 md:h-8"
                    />
                    <p className="text-xs md:text-sm">
                      No bestsellers available
                    </p>
                  </div>
                )
              ) : isSearching ? (
                <div className="space-y-4 md:space-y-5">
                  {[1, 2, 3, 4].map((i) => (
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
                      prefetch={false}
                      onClick={onClose}
                      className="group flex gap-3 md:gap-4 items-center"
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 relative rounded-md overflow-hidden shrink-0 bg-transparent">
                        <Image
                          src={item.image || "/images/product/1.jpg"}
                          alt={item.title}
                          fill
                          unoptimized={
                            String(item.image).includes("cdn.shopify.com") ||
                            String(item.image).includes("myshopify.com")
                          }
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs md:text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">
                          <HighlightMatch
                            text={item.title}
                            query={searchQuery}
                          />
                        </h4>
                        {item.price && (
                          <p className="text-xs font-bold text-gray-900 mt-0.5">
                            {item.price}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}

                  {productsOnly.length > 0 && (
                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-center">
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery)}`}
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[#4A3B3B] text-white text-xs md:text-sm font-semibold rounded-full hover:bg-[#3D3131] transition-colors shadow-sm flex items-center gap-2 mt-4"
                      >
                        View All Results <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 md:py-10 text-center">
                  <p className="text-gray-400 text-xs md:text-sm italic">
                    No matching products found
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Initial Categories or Dynamic Collection Suggestions */}
            <div>
              {searchQuery.length === 0 ? (
                <>
                  {recentSearches.length > 0 && (
                    <div className="mb-6 md:mb-8">
                      <h3 className="text-xs md:text-sm font-semibold mb-3 text-[#1A1A1A] uppercase tracking-wider">
                        Recent Searches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, idx) => (
                          <Link
                            key={idx}
                            href={`/search?q=${encodeURIComponent(term)}`}
                            onClick={onClose}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                          >
                            <Search className="inline-block w-3 h-3 mr-1.5 opacity-50" />
                            {term}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {(isLoadingTrending || trendingSearches.length > 0) && (
                    <div className="mb-6 md:mb-8">
                      <h3 className="text-xs md:text-sm font-semibold mb-3 text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                        Trending Searches <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {isLoadingTrending ? (
                          <>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={i} className="h-7 bg-gray-100 rounded-full animate-pulse" style={{ width: Math.random() * 40 + 60 + 'px' }} />
                            ))}
                          </>
                        ) : (
                          trendingSearches.map((termObj, idx) => {
                            const termText = typeof termObj === 'string' ? termObj : termObj?.term || "";
                            if (!termText) return null;
                            return (
                            <Link
                              key={idx}
                              href={`/search?q=${encodeURIComponent(termText)}`}
                              onClick={onClose}
                              className="px-3 py-1.5 bg-red-50/50 border border-red-100 rounded-full text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <ArrowRight className="inline-block w-3 h-3 mr-1.5 opacity-50" />
                              {termText}
                            </Link>
                          )})
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-xs md:text-sm font-semibold mb-4 md:mb-6 text-[#1A1A1A] uppercase tracking-wider">
                    Collections
                  </h3>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-200">
                    {matchedCollections.length > 0 ? (
                      matchedCollections.map((col) => (
                        <Link
                          key={col.id}
                          href={col.url}
                          prefetch={false}
                          onClick={onClose}
                          className="group block p-3 bg-zinc-50 rounded-lg border border-zinc-100 hover:border-primary/20 hover:bg-white transition-all duration-300"
                        >
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                              <HighlightMatch
                                text={col.title}
                                query={searchQuery}
                                reverse={true}
                              />
                            </h4>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-gray-400 text-xs italic">
                          No matching collections found
                        </p>
                      </div>
                    )}
                  </div>

                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
