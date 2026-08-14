"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sheet } from "react-modal-sheet";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, Search, ArrowUpDown, SlidersHorizontal, X, XIcon, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"
import ExploreRange from "@/components/home/ExploreRange";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { pushProductImpression, getStandardImpressionProducts, pushPromoClick } from "@/lib/gtm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { apiFetch, trackProductSearchClick } from "@/lib/api";
import { startSearch, trackSearchResultsView } from "@/lib/searchAnalytics";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "best_selling", label: "Best selling" },
  { value: "discount_desc", label: "Discount: High to Low" },
  { value: "created_at_desc", label: "Date: New to Old" },
  { value: "created_at_asc", label: "Date: Old to New" },
  { value: "price_low_high", label: "Price: low to high" },
  { value: "price_high_low", label: "Price: high to low" },
  { value: "az", label: "Alphabetically: A-Z" },
];

// Same caret the collection filters use — points up, rotated 180° when collapsed.
const FilterChevron = ({ className = "" }) => (
  <svg
    width="10"
    height="5.4"
    viewBox="0 0 13 7"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.2219 6.01562L6.32839 0.87798L0.434863 6.01562" stroke="currentColor" strokeWidth="1.32364" />
  </svg>
);

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
  const allSeenFilters = useRef({});
  // Scroll to top on mount or query change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  // Auto-apply product type filter based on query intent (like Caratlane)
  const [autoFilteredQuery, setAutoFilteredQuery] = useState("");
  useEffect(() => {
    if (!query || query === autoFilteredQuery) return;
    
    let detectedType = null;
    const lowerQ = query.toLowerCase();
    
    if (/\bring(s)?\b/i.test(lowerQ)) detectedType = "Rings";
    else if (/\bearring(s)?\b/i.test(lowerQ)) detectedType = "Earrings";
    else if (/\bnecklace(s)?\b/i.test(lowerQ)) detectedType = "Necklaces";
    else if (/\bbracelet(s)?\b/i.test(lowerQ)) detectedType = "Bracelets";
    else if (/\bpendant(s)?\b/i.test(lowerQ)) detectedType = "Pendants";
    else if (/\bbangle(s)?\b/i.test(lowerQ)) detectedType = "Bangles";
    else if (/\bmangal\s*sutra(s)?\b/i.test(lowerQ)) detectedType = "Mangalsutra";
    else if (/\bnosering(s)?|nose pin(s)?|nose-pin(s)?\b/i.test(lowerQ)) detectedType = "Nosepins";

    if (detectedType) {
       const currentTypes = searchParams.getAll("filter.p.product_type");
       if (!currentTypes.includes(detectedType)) {
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.append("filter.p.product_type", detectedType);
          router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
       }
    }
    
    setAutoFilteredQuery(query);
  }, [query, searchParams, pathname, router, autoFilteredQuery]);

  const [localPriceRange, setLocalPriceRange] = useState({
    min: searchParams.get("filter.v.price.gte") || "",
    max: searchParams.get("filter.v.price.lte") || ""
  });

  const [trueMinPrice, setTrueMinPrice] = useState(null);
  const [trueMaxPrice, setTrueMaxPrice] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchTrueBounds() {
      if (!query) return;
      try {
        const [minData, maxData] = await Promise.all([
          apiFetch(`/api/products/search?q=${encodeURIComponent(query)}&sort=price_low_high&limit=1`),
          apiFetch(`/api/products/search?q=${encodeURIComponent(query)}&sort=price_high_low&limit=1`)
        ]);

        if (isMounted) {
          if (minData?.products && minData.products.length > 0) {
            const minP = Number(minData.products[0].price) || 0;
            if (minP > 0) setTrueMinPrice(minP);
          }
          if (maxData?.products && maxData.products.length > 0) {
            const maxP = Number(maxData.products[0].price) || 0;
            if (maxP > 0) setTrueMaxPrice(maxP);
          }
        }
      } catch (e) {
        console.error("Failed to fetch true price bounds for search:", e);
      }
    }
    fetchTrueBounds();
    return () => { isMounted = false; };
  }, [query]);

  const [absolutePrice, setAbsolutePrice] = useState({ min: null, max: null });

  useEffect(() => {
    setLocalPriceRange({
      min: searchParams.get("filter.v.price.gte") || "",
      max: searchParams.get("filter.v.price.lte") || ""
    });
  }, [searchParams]);

  // Widest price bounds seen so far, so the slider range does not collapse as the
  // facet counts narrow with each applied filter.
  useEffect(() => {
    if (availableFilters?.Price) {
      const priceData = Array.isArray(availableFilters.Price) ? availableFilters.Price[0] : availableFilters.Price;
      
      setAbsolutePrice(prev => {
        let newMin = prev.min;
        if (priceData?.min !== undefined && priceData.min > 0) {
          newMin = prev.min === null ? priceData.min : Math.min(prev.min, priceData.min);
        } else if (prev.min === null || prev.min === 0) {
          newMin = trueMinPrice !== null ? trueMinPrice : prev.min;
        }

        let newMax = prev.max;
        if (priceData?.max !== undefined && priceData.max > 0) {
          newMax = prev.max === null ? priceData.max : Math.max(prev.max, priceData.max);
        } else if (prev.max === null || prev.max === 500000) {
          newMax = trueMaxPrice !== null ? trueMaxPrice : (prev.max || 500000);
        }
        
        return {
          min: newMin,
          max: newMax
        };
      });
    }
  }, [availableFilters, trueMinPrice, trueMaxPrice]);

  // Merge/normalise + sort facet options exactly like the collection page does.
  // NOTE: the Price facet is dropped here because /api/products/search returns
  // (near) zero results for any price range — the same payload works on
  // /api/collection, so this is a backend gap. Delete the `Price` skip below to
  // re-enable it once the search endpoint honours price; the slider UI is already
  // wired up.
  const processFilters = useCallback((filtersData) => {
    const mergedData = {};
    Object.entries(filtersData || {}).forEach(([groupKey, options]) => {
      if (groupKey === "Price") {
        if (Array.isArray(options) && options.length > 0) {
          mergedData[groupKey] = options[0]; // {min, max}
        } else {
          mergedData[groupKey] = options;
        }
      } else if (Array.isArray(options)) {
        const mergedOptionsMap = new Map();
        options.forEach(opt => {
          let label = (opt.label || "").trim();
          if (groupKey === "Metal Purity") {
            if (label === "14K") label = "14KT";
            else if (label === "18K") label = "18KT";
            else if (label === "9K") label = "9KT";
          }
          if (mergedOptionsMap.has(label)) {
            mergedOptionsMap.get(label).count += opt.count;
          } else {
            mergedOptionsMap.set(label, { ...opt, label, value: opt.value ?? label });
          }
          if (opt.input) {
            if (!allSeenFilters.current[groupKey]) allSeenFilters.current[groupKey] = {};
            allSeenFilters.current[groupKey][label] = opt.input;
          }
        });
        mergedData[groupKey] = Array.from(mergedOptionsMap.values());
      }
    });

    const sortedData = {};
    Object.entries(mergedData).forEach(([groupKey, options]) => {
      if (groupKey === "Price") {
        sortedData[groupKey] = options;
      } else if (Array.isArray(options)) {
        sortedData[groupKey] = [...options].sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          const aLabel = a.label?.toString() || "";
          const bLabel = b.label?.toString() || "";
          const aNum = parseFloat(aLabel);
          const bNum = parseFloat(bLabel);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return aLabel.localeCompare(bLabel, undefined, { numeric: true, sensitivity: 'base' });
        });
      }
    });

    // Ensure Price is exactly at the 4th index (index 3)
    const finalSortedData = {};
    const keys = Object.keys(sortedData).filter(k => k !== "Price");
    keys.splice(3, 0, "Price");
    
    keys.forEach(k => {
      if (k === "Price") {
        finalSortedData[k] = sortedData[k] || { min: 0, max: 0 };
      } else if (sortedData[k]) {
        finalSortedData[k] = sortedData[k];
      }
    });
    
    return finalSortedData;
  }, []);

  /* The search API only understands Shopify filter inputs passed as
     `filters=<json>` — forwarding the raw URL params did nothing, which is why
     picking a filter never changed the results. This converts the URL state into
     that payload, same as the collection page. */
  const getActiveFiltersForShopify = useCallback((currentSearchParams, currentAvailableFilters) => {
    const filters = {};
    currentSearchParams.forEach((value, key) => {
      if (key.startsWith("filter.")) {
        if (key === "filter.v.price.gte" || key === "filter.v.price.lte") {
          if (!filters["Price"]) filters["Price"] = [{ min: 0, max: 5000000 }];
          if (key === "filter.v.price.gte") filters["Price"][0].min = parseFloat(value);
          else filters["Price"][0].max = parseFloat(value);
        } else if (key === "filter.p.product_type") {
          if (!filters["Product Type"]) filters["Product Type"] = [];
          filters["Product Type"].push({ label: value });
        }
      } else if (!["sort", "cursor", "limit", "q", "page"].includes(key)) {
        let actualGroupKey = null;
        Object.keys(currentAvailableFilters || {}).forEach((groupName) => {
          if (groupName.toLowerCase() === key.toLowerCase()) {
            actualGroupKey = groupName;
          }
        });
        
        if (actualGroupKey) {
          if (!filters[actualGroupKey]) filters[actualGroupKey] = [];
          
          let optInput = null;
          if (allSeenFilters.current[actualGroupKey] && allSeenFilters.current[actualGroupKey][value]) {
            optInput = allSeenFilters.current[actualGroupKey][value];
          } else if (currentAvailableFilters && currentAvailableFilters[actualGroupKey]) {
            const foundOpt = currentAvailableFilters[actualGroupKey].find(o => (o.value === value || o.label === value));
            if (foundOpt && foundOpt.input) {
              optInput = foundOpt.input;
            }
          }

          if (optInput) {
            filters[actualGroupKey].push({ label: value, input: optInput });
          } else {
            filters[actualGroupKey].push({ label: value });
          }
        } else if (key.toLowerCase() === "producttype") {
          if (!filters["Product Type"]) filters["Product Type"] = [];
          filters["Product Type"].push({ label: value });
        }
      }
    });
    return filters;
  }, []);

  // Everything except the term itself — used to re-run the search on filter/sort change.
  const filterParamsString = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    p.delete("cursor");
    p.delete("q");
    return p.toString();
  }, [searchParams]);

  useEffect(() => {
    if (!query) {
      setProductsLoading(false);
      setFiltersLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchData() {
      setProductsLoading(true);
      setFiltersLoading(true);
      
      try {
        const sort = searchParams.get("sort") || "relevance";

        // 1. Build the filter payload using the current state
        const activeFiltersForAPI = getActiveFiltersForShopify(searchParams, availableFilters);
        const filterParams = Object.keys(activeFiltersForAPI).length > 0
          ? `&filters=${encodeURIComponent(JSON.stringify(activeFiltersForAPI))}`
          : "";

        // 2. Facets first — their `input` payloads are what the products call needs.
        const filtersData = await apiFetch(
          `/api/products/filters?q=${encodeURIComponent(query)}${filterParams}`
        );
        const sortedData = processFilters(filtersData);
        if (cancelled) return;
        setAvailableFilters(sortedData);
        setActiveMobileGroup(prev => prev || Object.keys(sortedData)[0] || null);
        setFiltersLoading(false);

        // 3. Rebuild active filters with the fresh sortedData (in case it was a hard refresh and we needed the input payloads)
        const finalActiveFilters = getActiveFiltersForShopify(searchParams, sortedData);
        const finalFilterParams = Object.keys(finalActiveFilters).length > 0
          ? `&filters=${encodeURIComponent(JSON.stringify(finalActiveFilters))}`
          : "";

        // 4. Products, with the selected facets translated for the API.
        const prodData = await apiFetch(
          `/api/products/search?q=${encodeURIComponent(query)}${finalFilterParams}&sort=${sort}&limit=${limit}`
        );
        if (cancelled) return;
        setProducts((prodData.products || []).filter(p => !p.tags?.some(t => t?.toLowerCase() === 'hidden')));
        setPagination({
          hasNextPage: prodData.pagination ? prodData.pagination.page < prodData.pagination.totalPages : false,
          page: prodData.pagination ? prodData.pagination.page : 1,
          totalPages: prodData.pagination ? prodData.pagination.totalPages : 1
        });
        const total = prodData.pagination?.total || 0;
        setTotalCount(total);
        
        // Track Search Analytics
        await startSearch(query, total);
        await trackSearchResultsView(total);
        
      } catch (err) {
        console.error("Failed to fetch search data:", err);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [query, filterParamsString, searchParams, processFilters, getActiveFiltersForShopify]);

  const fetchNextPage = useCallback(async () => {
    if (isFetchingNextPage || !pagination.hasNextPage) return;
    setIsFetchingNextPage(true);
    try {
      const sort = searchParams.get("sort") || "best_selling";
      const activeFilters = getActiveFiltersForShopify(searchParams, availableFilters);
      const filterParams = Object.keys(activeFilters).length > 0
        ? `&filters=${encodeURIComponent(JSON.stringify(activeFilters))}`
        : "";
      const nextPage = (pagination.page || 1) + 1;
      const data = await apiFetch(
        `/api/products/search?q=${encodeURIComponent(query)}${filterParams}&sort=${sort}&limit=${limit}&page=${nextPage}`
      );
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const fresh = (data.products || []).filter(
          p => !existingIds.has(p.id) && !p.tags?.some(t => t?.toLowerCase() === 'hidden')
        );
        return [...prev, ...fresh];
      });
      setPagination({
        hasNextPage: data.pagination ? data.pagination.page < data.pagination.totalPages : false,
        page: data.pagination ? data.pagination.page : nextPage,
        totalPages: data.pagination ? data.pagination.totalPages : 1
      });
    } catch (err) {
      console.error("Failed to fetch next search page:", err);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [query, searchParams, pagination, isFetchingNextPage, availableFilters, getActiveFiltersForShopify]);

  // Track product impressions when products are loaded
  const impressionSentRef = useRef(false);
  useEffect(() => {
    if (products.length > 0 && !impressionSentRef.current) {
      impressionSentRef.current = true;
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const impressionProducts = getStandardImpressionProducts(products, currentOrigin);
      pushProductImpression(impressionProducts);
    }
  }, [products]);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(availableFilters).forEach(([groupKey, options]) => {
      if (groupKey === "Price") {
        if (searchParams.get("filter.v.price.gte") || searchParams.get("filter.v.price.lte")) count++;
      } else if (Array.isArray(options)) {
        options.forEach((opt) => {
          if (searchParams.getAll(opt.urlKey || groupKey).includes(String(opt.value))) count++;
        });
      }
    });
    return count;
  }, [availableFilters, searchParams]);

  const toggleFilter = (urlKey, value, groupKey, optLabel) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(urlKey);
    if (currentValues.includes(value)) {
      const remaining = currentValues.filter((v) => v !== value);
      params.delete(urlKey);
      remaining.forEach((v) => params.append(urlKey, v));
    } else {
      params.append(urlKey, value);
      pushPromoClick({
        creative_name: "Search Filters",
        location_id: pathname,
        promo_id: urlKey,
        promo_name: `${groupKey || urlKey}: ${optLabel || value}`,
      });
    }
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    scrollToTop();
  };

  const clearAllFilters = () => {
    router.push(`${pathname}?q=${encodeURIComponent(query)}`, { scroll: false });
    scrollToTop();
  };

  const toggleFilterExpand = (groupKey) => {
    setExpandedFilters((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Extract selected color from filters to pass to ProductCard
  const selectedColor = useMemo(() => {
    const filterColor = searchParams.get("filter.v.option.metal_color");
    if (filterColor) return filterColor;

    let foundColor = "";
    searchParams.forEach((value, key) => {
      if (key.toLowerCase().includes("color")) {
        foundColor = value;
      }
    });
    return foundColor;
  }, [searchParams]);

  const applyPriceFilter = useCallback((committedValues) => {
    const params = new URLSearchParams(searchParams.toString());
    const minVal = Array.isArray(committedValues) ? String(committedValues[0]) : localPriceRange.min;
    const maxVal = Array.isArray(committedValues) ? String(committedValues[1]) : localPriceRange.max;

    if (minVal && minVal !== "0") params.set("filter.v.price.gte", minVal);
    else params.delete("filter.v.price.gte");
    if (maxVal && maxVal !== "0") params.set("filter.v.price.lte", maxVal);
    else params.delete("filter.v.price.lte");

    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    scrollToTop();
  }, [localPriceRange, searchParams, pathname, router]);

  const resetPriceFilter = useCallback(() => {
    setLocalPriceRange({ min: "", max: "" });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter.v.price.gte");
    params.delete("filter.v.price.lte");
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    scrollToTop();
  }, [searchParams, pathname, router]);

  const handleSort = (value) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value === "relevance") p.delete("sort");
    else p.set("sort", value);
    p.delete("cursor");
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
    scrollToTop();
    const sortLabel = SORT_OPTIONS.find((o) => o.value === value)?.label || value;
    pushPromoClick({
      creative_name: "Search Sort-by",
      location_id: pathname,
      promo_id: value,
      promo_name: sortLabel,
    });
  };

  const activeSort = searchParams.get("sort") || "relevance";
  const hasFilters = Object.keys(availableFilters).length > 0;
  const renderGridItems = () =>
    products.map((prod, idx) => (
      <div 
        key={`${prod.id || idx}-${idx}`}
        onClick={() => {
          if (prod.shopifyId || prod.id) {
            trackProductSearchClick(prod.shopifyId || prod.id);
          }
        }}
      >
        <ProductCard
          product={selectedColor ? { ...prod, selectedColor } : prod}
          index={idx + 1}
          disableLivePricing={true}
          disableReviews={true}
        />
      </div>
    ));
  const countDisplay = `${totalCount} Results`;

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
        {!isMobile && (productsLoading || products.length > 0) && (
          <div className="bg-[#F9F9F9] py-12"><div className="container-main mx-auto px-6"><h1 className="text-4xl font-abhaya font-extrabold leading-[1.3] tracking-normal align-middle mb-[10px]">Results for &quot;{query}&quot;</h1><p className="text-gray-600">{productsLoading ? "Searching..." : `Showing ${totalCount} results found for your request.`}</p></div></div>
        )}
      </div>

      <div className={isMobile ? "" : "flex xl:gap-12 lg:gap-6 py-6 container-main mx-auto"}>
        {/* ================= FILTERS SIDEBAR ================= */}
        <div className="hidden lg:block xl:w-78 lg:w-60 shrink-0">
          <div className="sticky top-19 self-start h-fit">
            <ScrollArea className="w-full h-[calc(100dvh-5rem)]">
              {filtersLoading && Object.keys(availableFilters).length === 0 ? <FilterSidebarSkeleton /> : (
                <div className={`space-y-3 pr-4 transition-opacity duration-300 ${filtersLoading ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex justify-between items-center border-b border-[#CECACA] pb-3"><h3 className="font-figtree font-bold text-black text-xl leading-none tracking-normal">Filters</h3><button onClick={clearAllFilters} className="font-figtree text-xs font-semibold uppercase tracking-wide text-[#696969] hover:text-black transition-colors">Clear All</button></div>
                  {Object.entries(availableFilters).map(([groupKey, options]) => {
                    const isExpanded = expandedFilters[groupKey] ?? false;
                    if (groupKey === "Price") {
                      return (
                        <div key={groupKey} className="border-b mb-0 border-gray-200">
                          <button onClick={() => toggleFilterExpand(groupKey)} className="w-full flex items-center justify-between py-5 hover:opacity-70 transition-opacity"><h4 className="font-figtree font-semibold text-base leading-none tracking-normal capitalize">{groupKey}</h4><FilterChevron className={`transition-transform duration-300 ${isExpanded ? "rotate-0" : "rotate-180"}`} /></button>
                          {isExpanded && (
                            <div className="space-y-5 my-4 pb-5 px-2">
                              <Slider
                                min={absolutePrice.min || 0}
                                max={absolutePrice.max || 500000}
                                step={100}
                                value={[
                                  localPriceRange.min !== "" ? Number(localPriceRange.min) : (absolutePrice.min || 0),
                                  localPriceRange.max !== "" ? Number(localPriceRange.max) : (absolutePrice.max || 500000)
                                ]}
                                onValueChange={([min, max]) => setLocalPriceRange({ min: String(min), max: String(max) })}
                                onValueCommit={applyPriceFilter}
                              />
                              <div className="text-sm font-semibold text-gray-900 text-center">
                                ₹{new Intl.NumberFormat("en-IN").format(localPriceRange.min !== "" ? Number(localPriceRange.min) : (absolutePrice.min || 0))} - ₹{new Intl.NumberFormat("en-IN").format(localPriceRange.max !== "" ? Number(localPriceRange.max) : (absolutePrice.max || 500000))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={groupKey} className="border-b mb-0 border-gray-200">
                        <button onClick={() => toggleFilterExpand(groupKey)} className="w-full flex items-center justify-between py-5 hover:opacity-70 transition-opacity"><h4 className="font-figtree font-semibold text-base leading-none tracking-normal capitalize">{groupKey}</h4><FilterChevron className={`transition-transform duration-300 ${isExpanded ? "rotate-0" : "rotate-180"}`} /></button>
                        {isExpanded && (
                          <div className="space-y-4 mt-2 mb-4 pb-5">
                            {Array.isArray(options) && options.map((opt) => {
                              const isChecked = searchParams.getAll(opt.urlKey || groupKey).includes(String(opt.value));
                              return (
                                <div key={opt.label} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleFilter(opt.urlKey || groupKey, opt.value, groupKey, opt.label)}>
                                  <span className={`flex items-center justify-center h-5 w-5 shrink-0 rounded-[4px] border transition-colors ${isChecked ? "bg-primary border-primary" : "border-gray-300 bg-white group-hover:border-gray-400"}`}>
                                    {isChecked && <Check size={13} strokeWidth={3} className="text-white" />}
                                  </span>
                                  <span className={`font-figtree text-base leading-[1.4] ${isChecked ? "text-black font-medium" : "text-[#696969] font-normal"}`}>
                                    {opt.label} ({opt.count})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* ================= RESULTS SECTION ================= */}
        <div className="flex-1">
          <div className={`flex items-center justify-between sticky top-0 z-20 ${isMobile ? "gap-3 p-4 bg-white/95 backdrop-blur-sm border-b border-[#F0E7E2]" : "gap-4 py-4 bg-white"}`}>
            <div className={isMobile ? "flex items-center gap-2.5" : "flex gap-3 items-center"}>
              {isMobile ? (
                <>
                  <h2 className="font-abhaya text-[1.5rem] font-extrabold text-[#2B1F1E] capitalize leading-none tracking-[-0.01em]">&quot;{query}&quot;</h2>
                  <span className="inline-flex items-center rounded-full bg-[#F4E9E3] px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#5a413f] whitespace-nowrap">{countDisplay}</span>
                </>
              ) : (<span className="font-figtree text-sm text-[#696969]">{products.length}/{totalCount} results</span>)}
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <span className="font-figtree text-sm text-[#696969] whitespace-nowrap">Sort by:</span>
                <div className="relative flex items-center">
                  <select value={activeSort} onChange={(e) => handleSort(e.target.value)} className="font-figtree appearance-none bg-transparent border-none pr-6 pl-1 text-sm font-semibold text-black cursor-pointer focus:outline-none capitalize">
                    {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 size-4 text-black" />
                </div>
              </div>
            )}
          </div>

          {/* Applied filter chips */}
          {!isMobile && activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              {Object.entries(availableFilters).map(([groupKey, options]) => (
                <Fragment key={groupKey}>
                  {groupKey === "Price" ? (
                    (searchParams.get("filter.v.price.gte") || searchParams.get("filter.v.price.lte")) && (
                      <Badge variant="secondary" className="bg-[#F4E9E3] text-black hover:bg-[#EADBD3] border border-[#5a413f] pl-3.5 pr-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer font-normal" onClick={resetPriceFilter}>
                        <span className="font-figtree text-sm font-normal leading-[1.2]">Price: {searchParams.get("filter.v.price.gte") ? `₹${searchParams.get("filter.v.price.gte")}` : "0"} - {searchParams.get("filter.v.price.lte") ? `₹${searchParams.get("filter.v.price.lte")}` : "Max"}</span>
                        <XIcon className="size-3.5 text-[#696969]" />
                      </Badge>
                    )
                  ) : (
                    Array.isArray(options) && options.filter(opt => searchParams.getAll(opt.urlKey || groupKey).includes(String(opt.value))).map((opt) => (
                      <Badge key={`${groupKey}-${opt.label}`} variant="secondary" className="bg-[#F4E9E3] text-black hover:bg-[#EADBD3] border border-[#5a413f] pl-3.5 pr-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer font-normal" onClick={() => toggleFilter(opt.urlKey || groupKey, opt.value, groupKey, opt.label)}>
                        <span className="font-figtree text-sm font-normal leading-[1.2]">{opt.label.split(" (")[0]}</span>
                        <XIcon className="size-3.5 text-[#696969]" />
                      </Badge>
                    ))
                  )}
                </Fragment>
              ))}
              <button onClick={clearAllFilters} className="font-figtree text-sm text-black underline underline-offset-2 hover:text-[#5a413f] ml-1 whitespace-nowrap">Remove All</button>
            </div>
          )}

          {!productsLoading && products.length === 0 ? (
            <div className="text-center py-12">
              {activeFilterCount > 0 ? (
                <>
                  <Search strokeWidth={1} className="mx-auto mb-4 w-10 h-10 text-gray-300" />
                  <h2 className="mb-2 text-[20px] md:text-[28px] font-abhaya font-extrabold">NO PRODUCTS MATCH THESE FILTERS</h2>
                  <p className="text-[#666] mb-6 text-[14px] md:text-[16px]">Try removing a filter to see more results.</p>
                  <button onClick={clearAllFilters} className="px-6 py-3.5 rounded-full bg-[#5a413f] text-white text-xs font-figtree font-bold uppercase tracking-[0.12em]">
                    Clear All Filters
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-center items-center gap-2.5 w-[50%] mx-auto">
                    <img
                      src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/7c770e5800dc9629cd5493df5a3f21822d0ba5a6_1.png?v=1750417853"
                      alt="No Results Found"
                      title="No Results Found"
                      loading="lazy"
                      className="md:w-[70%] w-full h-auto"
                    />
                  </div>
                  <h2 className="mt-5 mb-2 text-[20px] md:text-[40px]">
                    NO RESULTS FOUND
                  </h2>
                  <p className="text-[#666] mb-7.5 text-[14px] md:text-[20px]">
                    Results for &quot;{query}&quot;
                  </p>
                  <div className="flex justify-center gap-3.75 flex-wrap">
                    <Link
                      href="/collections/jewelry"
                      prefetch={false}
                      className="px-5 py-4 border border-primary bg-primary text-white rounded text-base w-[90%] md:w-[25%] text-center"
                    >
                      BROWSE OUR COLLECTIONS
                    </Link>
                    <Link
                      href="/"
                      prefetch={false}
                      className="px-5 py-4 border border-primary text-primary rounded text-base w-[90%] md:w-[25%] text-center"
                    >
                      GO TO HOMEPAGE
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={`grid mt-4 transition-opacity duration-300 ${productsLoading ? "opacity-50 pointer-events-none" : ""} ${isMobile ? "grid-cols-2 gap-4 px-2" : "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 lg:grid-cols-3 gap-6"}`}>
              {productsLoading && products.length === 0
                ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : renderGridItems()}
              {isFetchingNextPage && <><ProductCardSkeleton /><ProductCardSkeleton /></>}
            </div>
          )}

          <div ref={loadMoreRef} className="w-full flex justify-center items-center py-10">
            {!pagination.hasNextPage && totalCount > 0 && products.length > 0 && (
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">You&apos;ve reached the end</p>
            )}
          </div>
        </div>
      </div>

      {!productsLoading && products.length === 0 && activeFilterCount === 0 && (
        <div className="w-full">
          <ExploreRange bgClass="bg-[#FEF5F1]" paddingClass="py-12" />
        </div>
      )}

      {/* Sticky Mobile Filter Bar & Sheets */}
      {isMobile && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-60 z-[500] flex items-stretch rounded-full bg-[#5a413f] text-white shadow-[0_10px_30px_-8px_rgba(90,65,63,0.55)] ring-1 ring-white/10 overflow-hidden backdrop-blur-sm">
          <button onClick={() => setIsSortSheetOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[0.8125rem] font-figtree font-semibold tracking-[0.08em] active:bg-white/10 transition-colors">
            <ArrowUpDown size={15} strokeWidth={2} className="opacity-90" /> Sort
          </button>
          <span className="w-px my-3 bg-white/20" />
          <button onClick={() => setIsFilterSheetOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[0.8125rem] font-figtree font-semibold tracking-[0.08em] active:bg-white/10 transition-colors">
            <SlidersHorizontal size={15} strokeWidth={2} className="opacity-90" /> Filter
            {activeFilterCount > 0 && <span className="bg-[#FFE4D9] text-[#5a413f] text-[0.6875rem] min-w-[1.15rem] h-[1.15rem] rounded-full flex items-center justify-center px-1 font-bold leading-none">{activeFilterCount}</span>}
          </button>
        </div>
      )}

      {/* Sort Sheet */}
      <Sheet isOpen={isSortSheetOpen} onClose={() => setIsSortSheetOpen(false)} snapPoints={[0, 1]} initialSnap={1}>
        <Sheet.Container className="!rounded-t-[28px] !h-auto max-h-[68vh] bottom-0 !shadow-[0_-12px_40px_-12px_rgba(90,65,63,0.35)]">
          <Sheet.Content className="bg-white !rounded-t-[28px]">
            <div className="flex flex-col">
              <div className="pt-3 pb-1 flex justify-center"><span className="h-1 w-10 rounded-full bg-gray-200" /></div>
              <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[#F0E7E2]">
                <h3 className="font-abhaya text-xl font-bold text-[#5a413f] leading-none">Sort By</h3>
                <button onClick={() => setIsSortSheetOpen(false)} className="p-1.5 -mr-1.5 rounded-full active:bg-gray-100 transition-colors"><X size={19} className="text-gray-500" /></button>
              </div>
              <div className="px-3 py-2.5 space-y-0.5 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                {SORT_OPTIONS.map((opt) => {
                  const isActive = activeSort === opt.value;
                  return (
                    <button key={opt.value} onClick={() => { handleSort(opt.value); setIsSortSheetOpen(false); }} className={`w-full text-left py-3.5 px-4 rounded-xl transition-colors flex justify-between items-center font-figtree text-[0.9375rem] ${isActive ? "bg-[#FFF5F1] text-[#5a413f] font-semibold" : "text-gray-700 active:bg-gray-50 font-normal"}`}>
                      <span>{opt.label}</span>
                      {isActive && <Check size={17} strokeWidth={2.5} className="text-[#5a413f] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => setIsSortSheetOpen(false)} />
      </Sheet>

      {/* Filter Sheet */}
      <Sheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} snapPoints={[0, 1]} initialSnap={1}>
        <Sheet.Container className="!rounded-t-none">
          <Sheet.Content className="bg-white">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0E7E2]">
                <h3 className="font-abhaya text-xl font-bold text-[#5a413f] leading-none">Filters</h3>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && <button onClick={clearAllFilters} className="font-figtree text-xs font-semibold text-[#5a413f] underline underline-offset-2 active:opacity-70">Clear All</button>}
                  <button onClick={() => setIsFilterSheetOpen(false)} className="p-1.5 -mr-1.5 rounded-full active:bg-gray-100 transition-colors"><X size={19} className="text-gray-500" /></button>
                </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                <div className="w-[42%] bg-[#FBF3EF] border-r border-[#F0E7E2] overflow-y-auto">
                  {Object.entries(availableFilters).map(([groupKey]) => {
                    let count = 0;
                    if (groupKey === "Price") { if (localPriceRange.min || localPriceRange.max) count = 1; }
                    else { count = (availableFilters[groupKey] || []).filter(opt => searchParams.getAll(opt.urlKey || groupKey).includes(String(opt.value))).length; }
                    const isActive = activeMobileGroup === groupKey;
                    return (
                      <button key={groupKey} onClick={() => setActiveMobileGroup(groupKey)} className={`w-full text-left pl-5 pr-9 py-4 font-figtree text-[0.8125rem] tracking-normal relative leading-snug transition-colors ${isActive ? "bg-white text-[#5a413f] font-semibold" : "text-gray-500 font-medium active:bg-white/60"}`}>
                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[#5a413f]" />}
                        {groupKey}
                        {count > 0 && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#5a413f] text-white text-[0.625rem] min-w-[1.15rem] h-[1.15rem] px-1 rounded-full flex items-center justify-center font-bold leading-none">{count}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="w-[58%] bg-white overflow-y-auto px-4 py-3">
                  {activeMobileGroup && availableFilters[activeMobileGroup] && (
                    <div className="space-y-1 pb-24">
                      {activeMobileGroup === "Price" ? (
                        <div className="space-y-6 py-5 px-1.5">
                          <Slider
                            min={absolutePrice.min || 0}
                            max={absolutePrice.max || 500000}
                            step={100}
                            value={[
                              localPriceRange.min !== "" ? Number(localPriceRange.min) : (absolutePrice.min || 0),
                              localPriceRange.max !== "" ? Number(localPriceRange.max) : (absolutePrice.max || 500000)
                            ]}
                            onValueChange={([min, max]) => setLocalPriceRange({ min: String(min), max: String(max) })}
                            onValueCommit={applyPriceFilter}
                          />
                          <div className="rounded-xl bg-[#FBF3EF] py-3 px-4 text-center">
                            <span className="font-figtree text-[0.9375rem] font-semibold text-[#5a413f]">
                              ₹{new Intl.NumberFormat("en-IN").format(localPriceRange.min !== "" ? Number(localPriceRange.min) : (absolutePrice.min || 0))} – ₹{new Intl.NumberFormat("en-IN").format(localPriceRange.max !== "" ? Number(localPriceRange.max) : (absolutePrice.max || 500000))}
                            </span>
                          </div>
                        </div>
                      ) : (
                        availableFilters[activeMobileGroup].map((option) => {
                          const isSelected = searchParams.getAll(option.urlKey || activeMobileGroup).includes(String(option.value));
                          return (
                            <div key={option.label} className={`flex items-center justify-between gap-2 py-2.5 px-1 rounded-lg cursor-pointer group transition-colors ${isSelected ? "" : "active:bg-gray-50"}`} onClick={() => toggleFilter(option.urlKey || activeMobileGroup, option.value, activeMobileGroup, option.label)}>
                              <div className="flex items-center gap-3 min-w-0">
                                {isSelected ? <div className="w-[19px] h-[19px] shrink-0 bg-[#5a413f] rounded-[5px] flex items-center justify-center"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div> : <div className="w-[19px] h-[19px] shrink-0 border border-gray-300 rounded-[5px] group-hover:border-[#5a413f] transition-colors" />}
                                <span className={`font-figtree text-sm leading-snug truncate ${isSelected ? "text-[#5a413f] font-semibold" : "text-gray-600"}`}>{option.label}</span>
                              </div>
                              <span className={`font-figtree text-xs shrink-0 ${isSelected ? "text-[#5a413f]/60" : "text-gray-400"}`}>({option.count})</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-[#F0E7E2] bg-white px-4 py-3.5 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]">
                <button onClick={clearAllFilters} className="py-3.5 rounded-full text-xs font-figtree font-bold bg-[#FBF3EF] text-[#5a413f] uppercase tracking-[0.12em] active:bg-[#F4E9E3] transition-colors">Clear All</button>
                <button onClick={() => setIsFilterSheetOpen(false)} className="py-3.5 rounded-full text-xs font-figtree font-bold bg-[#5a413f] text-white uppercase tracking-[0.12em] shadow-[0_6px_18px_-6px_rgba(90,65,63,0.6)] active:bg-[#4a3432] transition-colors">Apply Filters</button>
              </div>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => setIsFilterSheetOpen(false)} />
      </Sheet>
    </div>
  );
}
