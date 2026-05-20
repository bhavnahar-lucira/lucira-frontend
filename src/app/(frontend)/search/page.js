"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Sheet } from "react-modal-sheet";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, XIcon, Search, ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { pushProductImpression } from "@/lib/gtm";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const SORT_OPTIONS = [
  { value: "best_selling", label: "Best selling" },
  { value: "discount_desc", label: "Discount: High to Low" },
  { value: "created_at_desc", label: "Date: New to Old" },
  { value: "created_at_asc", label: "Date: Old to New" },
  { value: "price_low_high", label: "Price, low to high" },
  { value: "price_high_low", label: "Price, high to low" },
  { value: "az", label: "Alphabetically, A-Z" },
];

const FilterSidebarSkeleton = () => (
  <div className="space-y-6 px-4 animate-pulse">
    <div className="flex justify-between items-center border-b pb-3">
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-12 bg-gray-100 rounded" />
    </div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="border-b pb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-4 bg-gray-100 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center gap-3">
              <div className="h-4 w-4 bg-gray-100 rounded" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const query = searchParams.get("q") || "";
  const limit = 25;

  const [expandedFilters, setExpandedFilters] = useState({ "In Store Available": true });
  const loadMoreRef = useRef(null);

  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [activeMobileGroup, setActiveMobileGroup] = useState(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Data State
  const [availableFilters, setAvailableFilters] = useState({});
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ hasNextPage: false, endCursor: null });
  const [productsLoading, setProductsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Scroll to top on mount or query change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  const [localPriceRange, setLocalPriceRange] = useState({
    min: searchParams.get("filter.v.price.gte") || "",
    max: searchParams.get("filter.v.price.lte") || ""
  });

  useEffect(() => {
    setLocalPriceRange({
      min: searchParams.get("filter.v.price.gte") || "",
      max: searchParams.get("filter.v.price.lte") || ""
    });
  }, [searchParams]);

  const filterParamsString = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    p.delete("cursor");
    return p.toString();
  }, [searchParams]);

  useEffect(() => {
    if (!query) return;
    async function fetchData() {
      setProductsLoading(true);
      setFiltersLoading(true);
      try {
        const filtersRes = await fetch(`/api/products/filters?q=${encodeURIComponent(query)}&${filterParamsString}`);
        const filtersData = await filtersRes.json();
        setAvailableFilters(filtersData);
        setFiltersLoading(false);

        const prodRes = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&${filterParamsString}&limit=${limit}`);
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
        setPagination(prodData.pagination || { hasNextPage: false, endCursor: null });
        setTotalCount(prodData.pagination?.total || 0);
      } catch (err) {
        console.error("Failed to fetch search data:", err);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchData();
  }, [query, filterParamsString]);

  const fetchNextPage = useCallback(async () => {
    if (isFetchingNextPage || !pagination.hasNextPage) return;
    setIsFetchingNextPage(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&${filterParamsString}&limit=${limit}&cursor=${pagination.endCursor}`);
      const data = await res.json();
      setProducts(prev => [...prev, ...(data.products || [])]);
      setPagination(data.pagination || { hasNextPage: false, endCursor: null });
    } catch (err) {
      console.error("Failed to fetch next search page:", err);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [query, filterParamsString, pagination, isFetchingNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && pagination.hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, { 
      rootMargin: "0px 0px 800px 0px",
      threshold: 0 
    });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [pagination.hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleFilter = (urlKey, value) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(urlKey);
    if (currentValues.includes(value)) {
      const remaining = currentValues.filter((v) => v !== value);
      params.delete(urlKey);
      remaining.forEach((v) => params.append(urlKey, v));
    } else {
      params.append(urlKey, value);
    }
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    scrollToTop();
  };

  const clearAllFilters = () => {
    router.push(`${pathname}?q=${encodeURIComponent(query)}`, { scroll: false });
    scrollToTop();
  };

  const handleSort = (value) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value === "best_selling") p.delete("sort");
    else p.set("sort", value);
    p.delete("cursor");
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
    scrollToTop();
  };

  const activeSort = searchParams.get("sort") || "best_selling";

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        <div className="container-main mx-auto px-6 py-4">
          <Breadcrumb>
            <BreadcrumbList className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              <BreadcrumbItem><BreadcrumbLink href="/" className="hover:text-[#5a413f] transition-colors">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="scale-75" />
              <BreadcrumbItem><BreadcrumbPage className="text-[#5a413f]">Search Results</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {!isMobile && (
          <div className="bg-[#F9F9F9] py-12"><div className="container-main mx-auto px-6"><h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">Results for "{query}"</h1><p className="text-gray-600">{productsLoading ? "Searching..." : `Showing ${totalCount} products found for your request.`}</p></div></div>
        )}
      </div>

      <div className={isMobile ? "" : "flex gap-12 py-6 container-main mx-auto"}>
        {/* Sidebar */}
        {!isMobile && products.length > 0 && (
          <div className="hidden lg:block w-78 shrink-0">
            <div className="sticky top-5 self-start h-fit">
              <ScrollArea className="w-full h-[calc(100vh-5rem)]">
                {filtersLoading ? <FilterSidebarSkeleton /> : (
                  <div className="space-y-3 px-4">
                    <div className="flex justify-between items-center border-b"><h3 className="font-semibold mb-3 font-black uppercase tracking-widest text-sm">Filters</h3><button onClick={clearAllFilters} className="text-[10px] font-bold uppercase text-zinc-400 hover:text-black mb-3">Clear All</button></div>
                    {Object.entries(availableFilters).map(([groupKey, options]) => (
                      <div key={groupKey} className="border-b mb-0">
                        <button onClick={() => setExpandedFilters(prev => ({...prev, [groupKey]: !prev[groupKey]}))} className="w-full flex items-center justify-between py-5 hover:opacity-70 transition-opacity"><h4 className="font-medium text-sm capitalize">{groupKey}</h4><ChevronDown size={18} className={`transition-transform duration-300 ${expandedFilters[groupKey] ? "rotate-0" : "rotate-180"}`} /></button>
                        {expandedFilters[groupKey] && Array.isArray(options) && (
                          <div className="space-y-4 my-2 pb-5">{options.map(opt => (
                            <div key={opt.value} className="flex items-start gap-3 text-sm">
                              <input type="checkbox" checked={searchParams.getAll(opt.urlKey || groupKey).includes(opt.value)} onChange={() => toggleFilter(opt.urlKey || groupKey, opt.value)} className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                              <label className="flex-1 cursor-pointer flex justify-between"><span>{opt.label}</span><span className="text-gray-400 text-xs">({opt.count})</span></label>
                            </div>
                          ))}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex-1">
          {products.length > 0 && (
            <div className={`flex gap-4 items-center justify-between sticky top-0 bg-white z-20 ${isMobile ? "py-5 border-b border-gray-50 px-4" : "py-4"}`}>
              <div className={isMobile ? "flex items-baseline gap-2.5" : "flex gap-3 items-center"}>
                {isMobile ? (<><h2 className="text-lg font-bold text-black capitalize leading-none">"{query}"</h2><span className="text-xs text-gray-400 font-medium whitespace-nowrap">{totalCount} Results</span></>) : (<span className="text-sm text-gray-500">{products.length}/{totalCount} products</span>)}
              </div>
              {!isMobile && (
                <div className="flex items-center gap-4"><div className="flex items-center gap-2"><span className="text-sm text-gray-600">Sort:</span><select value={activeSort} onChange={(e) => handleSort(e.target.value)} className="text-sm border rounded-md px-3 py-2 bg-white">{SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div></div>
              )}
            </div>
          )}
          <div className={`grid mt-4 ${isMobile ? "grid-cols-2 gap-4 px-2" : "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 lg:grid-cols-3 gap-6"}`}>
            {productsLoading && products.length === 0 ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />) : products.map((prod, idx) => {
               // Trigger pagination when 10 products are scrolled
               // For a batch of 25, this is the 11th product (index 10, or length - 15)
               const isTrigger = pagination.hasNextPage && idx === products.length - 15;
               return (
                 <div key={`${prod.id || idx}-${idx}`} ref={isTrigger ? loadMoreRef : null}>
                   <ProductCard product={prod} index={idx + 1} />
                 </div>
               );
            })}
            {isFetchingNextPage && <><ProductCardSkeleton /><ProductCardSkeleton /></>}
          </div>
          <div ref={loadMoreRef} className="h-20" />
        </div>
      </div>
    </div>
  );
}
