"use client";

import { useState, useEffect, useCallback, useMemo, use, useRef, Fragment } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Sheet } from "react-modal-sheet";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, XIcon, ChevronsDown, Hammer, Filter as FilterIcon, LayoutDashboard, ShoppingBag, Loader2, ListFilter, ArrowUpDown, LayoutGrid, X, SlidersHorizontal, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pushProductImpression, getStandardImpressionProducts, pushPromoClick } from "@/lib/gtm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import StoreCollectionBanner from "@/components/collections/StoreCollectionBanner";
import { apiFetch } from "@/lib/api";

const STORE_HANDLES = ["pune-store", "chembur-store", "noida-store", "sky-city-borivali-store", "malad", "paschim-vihar"];

const STORE_IMAGES = {
  "pune-store": ["https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pune.jpg"],
  "chembur-store": ["https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Chembur_73ce3ac6-7515-473d-a2dd-2385fd065eaa.jpg"],
  "noida-store": ["https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Noida.jpg"],
  "sky-city-borivali-store": ["/images/store/Borivali.jpg"],
  "malad": ["https://cdn.shopify.com/s/files/1/0739/8516/3482/files/store_4ee3a4f7-ce43-4373-9830-67ab62a8a2e6.jpg"],
  "paschim-vihar": ["https://cdn.shopify.com/s/files/1/0739/8516/3482/files/1800_x_1350_Noida_Store_Image_jpg.jpg?v=1776425633"],
};

const SORT_OPTIONS = [
  { value: "manual", label: "Featured" },
  { value: "best_selling", label: "Best selling" },
  { value: "discount_desc", label: "Discount: High to Low" },
  { value: "created_at_desc", label: "Date: New to Old" },
  { value: "created_at_asc", label: "Date: Old to New" },
  { value: "price_low_high", label: "Price: low to high" },
  { value: "price_high_low", label: "Price: high to low" },
  { value: "az", label: "Alphabetically: A-Z" },
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

// Simple rich text renderer for SEO content
const renderShopifyRichText = (content) => {
  if (!content) return null;

  // If it's a JSON string (Shopify Rich Text format)
  if (typeof content === "string" && content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === "root") {
        return <div className="rich-text-content">{renderRichTextNodes(parsed.children)}</div>;
      }
    } catch (e) {
      // Fallback to HTML if JSON parse fails
    }
  }

  // If it's already an object (already parsed)
  if (typeof content === "object" && content.type === "root") {
    return <div className="rich-text-content">{renderRichTextNodes(content.children)}</div>;
  }

  // If it's HTML, we'll try to dangerously set it.
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

const renderRichTextNodes = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return null;

  return nodes.map((node, index) => {
    switch (node.type) {
      case "root":
        return <div key={index}>{renderRichTextNodes(node.children)}</div>;
      case "heading":
        const HeadingTag = `h${node.level || 1}`;
        return (
          <HeadingTag key={index} className={`font-bold mt-6 mb-4 ${node.level === 1 ? 'text-2xl' : node.level === 2 ? 'text-xl' : 'text-lg'}`}>
            {renderRichTextNodes(node.children)}
          </HeadingTag>
        );
      case "paragraph":
        return <p key={index} className="mb-4 leading-relaxed">{renderRichTextNodes(node.children)}</p>;
      case "text":
        let text = node.value;
        if (node.bold) text = <strong key={index}>{text}</strong>;
        if (node.italic) text = <em key={index}>{text}</em>;
        return <Fragment key={index}>{text}</Fragment>;
      case "list":
        const ListTag = node.listType === "ordered" ? "ol" : "ul";
        return (
          <ListTag key={index} className={`mb-4 ml-6 ${node.listType === "ordered" ? "list-decimal" : "list-disc"}`}>
            {renderRichTextNodes(node.children)}
          </ListTag>
        );
      case "list-item":
        return <li key={index} className="mb-1">{renderRichTextNodes(node.children)}</li>;
      case "link":
        return (
          <a key={index} href={node.url} target={node.target} className="text-primary hover:underline">
            {renderRichTextNodes(node.children)}
          </a>
        );
      default:
        return null;
    }
  });
};

export default function CollectionPage({ params: paramsPromise, initialData }) {
  const params = use(paramsPromise);
  const handle = params?.handle || "all";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const limit = 25;

  const [expandedFilters, setExpandedFilters] = useState({ "In Store Available": true });
  const loadMoreRef = useRef(null);

  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [activeMobileGroup, setActiveMobileGroup] = useState(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Helper to process filters
  const processFilters = useCallback((filtersData) => {
    const mergedData = {};
    Object.entries(filtersData || {}).forEach(([groupKey, options]) => {
      if (groupKey === "Price") {
        mergedData[groupKey] = options;
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
            const existing = mergedOptionsMap.get(label);
            existing.count += opt.count;
          } else {
            mergedOptionsMap.set(label, { ...opt, label });
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
          const aLabel = a.label?.toString() || "";
          const bLabel = b.label?.toString() || "";
          const aNum = parseFloat(aLabel);
          const bNum = parseFloat(bLabel);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return aLabel.localeCompare(bLabel, undefined, { numeric: true, sensitivity: 'base' });
        });
      }
    });
    return sortedData;
  }, []);

  // Data State
  const [availableFilters, setAvailableFilters] = useState(() => {
    if (initialData && initialData.filterData) {
      return processFilters(initialData.filterData);
    }
    return {};
  });
  const [filtersLoading, setFiltersLoading] = useState(!initialData);
  const [collection, setCollection] = useState(() => {
    if (initialData && initialData.collData && initialData.collData.collection) {
      return {
        title: initialData.collData.collection.title || handle.replace(/-/g, " "),
        description: initialData.collData.collection.description || "",
        descriptionHtml: initialData.collData.collection.descriptionHtml || "",
        metafields: initialData.collData.collection.metafields || {}
      };
    }
    return { title: "", description: "", descriptionHtml:"" };
  });
  const [dbCollection, setDbCollection] = useState(null);
  const [products, setProducts] = useState(() => (initialData?.collData?.products || []).filter(p => !p.tags?.some(t => t?.toLowerCase() === 'hidden')));
  const [pagination, setPagination] = useState(() => initialData?.collData?.pageInfo || { hasNextPage: false, endCursor: null });
  const [productsLoading, setProductsLoading] = useState(!initialData);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(() => initialData?.collData?.totalProducts || 0);

  // Set initial active mobile group if needed
  useEffect(() => {
    if (initialData && Object.keys(availableFilters).length > 0 && !activeMobileGroup) {
      setActiveMobileGroup(Object.keys(availableFilters)[0]);
    }
  }, []);

  const isFirstRender = useRef(true);

  // Price Filter State
  const [trueMinPrice, setTrueMinPrice] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchTrueMin() {
      try {
        const data = await apiFetch(`/api/collection?handle=${handle}&sort=price_low_high&limit=1`);
        if (isMounted && data.products && data.products.length > 0) {
          const minP = Number(data.products[0].price) || 0;
          if (minP > 0) setTrueMinPrice(minP);
        }
      } catch (e) {
        console.error("Failed to fetch true min price:", e);
      }
    }
    fetchTrueMin();
    return () => { isMounted = false; };
  }, [handle]);

  const [absolutePrice, setAbsolutePrice] = useState({ min: null, max: null });

  useEffect(() => {
    if (availableFilters?.Price) {
      setAbsolutePrice(prev => {
        let newMin = prev.min;
        if (availableFilters.Price.min !== undefined && availableFilters.Price.min > 0) {
          newMin = prev.min === null ? availableFilters.Price.min : Math.min(prev.min, availableFilters.Price.min);
        } else if (prev.min === null || prev.min === 0) {
          newMin = trueMinPrice !== null ? trueMinPrice : prev.min;
        }
        return {
          min: newMin,
          max: prev.max === null ? (availableFilters.Price.max || 500000) : Math.max(prev.max, availableFilters.Price.max || 500000)
        };
      });
    }
  }, [availableFilters, trueMinPrice]);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(availableFilters).forEach(([groupKey, options]) => {
      if (groupKey === "Price") {
        if (searchParams.get("filter.v.price.gte") || searchParams.get("filter.v.price.lte")) count++;
      } else if (Array.isArray(options)) {
        options.forEach((opt) => {
          if (searchParams.getAll(opt.urlKey || groupKey).includes(opt.value)) count++;
        });
      }
    });
    return count;
  }, [availableFilters, searchParams]);

  const applyPriceFilter = useCallback((committedValues) => {
    const params = new URLSearchParams(searchParams.toString());
    const minVal = committedValues && Array.isArray(committedValues) ? String(committedValues[0]) : localPriceRange.min;
    const maxVal = committedValues && Array.isArray(committedValues) ? String(committedValues[1]) : localPriceRange.max;

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

  const toggleFilter = (urlKey, value, groupKey, optLabel) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(urlKey);
    const isRemoving = currentValues.includes(value);
    if (isRemoving) {
      const remaining = currentValues.filter((v) => v !== value);
      params.delete(urlKey);
      remaining.forEach((v) => params.append(urlKey, v));
    } else {
      params.append(urlKey, value);
      // Fire promoClick datalayer when a filter is applied (not removed)
      pushPromoClick({
        creative_name: "Plp Filters",
        location_id: pathname,
        promo_id: urlKey,
        promo_name: `${groupKey || urlKey}: ${optLabel || value}`,
      });
    }
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    scrollToTop();
  };

  const getActiveFiltersForShopify = useCallback((currentSearchParams, currentAvailableFilters) => {
    const filters = [];
    currentSearchParams.forEach((value, key) => {
      if (key.startsWith("filter.")) {
        try {
          if (key === "filter.v.price.gte" || key === "filter.v.price.lte") {
            let existingPrice = filters.find(f => f.price);
            if (existingPrice) {
              if (key === "filter.v.price.gte") existingPrice.price.min = parseFloat(value);
              else existingPrice.price.max = parseFloat(value);
            } else {
              filters.push({
                price: {
                  min: key === "filter.v.price.gte" ? parseFloat(value) : 0,
                  max: key === "filter.v.price.lte" ? parseFloat(value) : 5000000
                }
              });
            }
          } else {
            filters.push({ [key.replace("filter.", "")]: value });
          }
        } catch (e) { }
      } else if (!["sort", "cursor", "limit", "q", "page"].includes(key)) {
        // Find matching option in currentAvailableFilters
        let found = false;
        Object.entries(currentAvailableFilters || {}).forEach(([groupName, group]) => {
          if (Array.isArray(group)) {
            // Check if groupName matches the key (case-insensitive)
            const groupMatchesKey = groupName.toLowerCase() === key.toLowerCase();
            
            group.forEach(opt => {
              if (
                (opt.urlKey === key || opt.label === key || groupMatchesKey) && 
                (opt.value === value || opt.label === value)
              ) {
                filters.push(typeof opt.input === 'string' ? JSON.parse(opt.input) : opt.input);
                found = true;
              }
            });
          }
        });
        
        // Fallback for productType which is common
        if (!found && key.toLowerCase() === "producttype") {
            filters.push({ productType: value });
        }
      }
    });
    return filters;
  }, []);

  // Initial Fetch & Filter Changes
  useEffect(() => {
    async function fetchData() {
      // Check if we can skip the fetch completely because it's the first render AND we have SSG data
      if (isFirstRender.current && initialData) {
        isFirstRender.current = false;
        
        // Ensure we are on the default path (no params or only sort=manual)
        const paramsString = searchParams.toString();
        if (paramsString === "" || paramsString === "sort=manual") {
          return; // Skip API fetch, initialData holds exactly what we need!
        }
      }
      isFirstRender.current = false;

      setProductsLoading(true);
      setFiltersLoading(true);

      try {
        const sort = searchParams.get("sort") || "manual";
        
        // 1. Fetch filters first to ensure we have mappings for products fetch
        const filtersData = await apiFetch(`/api/products/filters?handle=${handle}&${searchParams.toString()}`);

        const sortedData = processFilters(filtersData);

        setAvailableFilters(sortedData);
        if (Object.keys(sortedData).length > 0 && !activeMobileGroup) {
          setActiveMobileGroup(Object.keys(sortedData)[0]);
        }
        setFiltersLoading(false);

        // 2. Now fetch products using the mappings we just got
        const activeFilters = getActiveFiltersForShopify(searchParams, sortedData);
        const filterParams = activeFilters.length > 0 ? `filters=${encodeURIComponent(JSON.stringify(activeFilters))}` : "";
        
        const apiUrl = `/api/collection?handle=${handle}&${filterParams}&sort=${sort}&limit=${limit}`;
        console.log("Fetching products from API:", apiUrl);

        const collData = await apiFetch(apiUrl);
        setCollection({
          title: collData.collection?.title || handle.replace(/-/g, " "),
          description: collData.collection?.description || "",
          descriptionHtml: collData.collection.descriptionHtml || "",
          metafields: collData.collection?.metafields || {}
        });
        setProducts((collData.products || []).filter(p => !p.tags?.some(t => t?.toLowerCase() === 'hidden')));
        setPagination(collData.pageInfo || { hasNextPage: false, endCursor: null });
        setTotalCount(collData.totalProducts || 0);

        try {
          const dbData = await apiFetch(`/api/collection/metadata?handle=${handle}`);
          if (dbData.success) setDbCollection(dbData.collection);
        } catch(e) {}
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchData();
  }, [handle, searchParams, limit, getActiveFiltersForShopify, processFilters, initialData]);

  // Fetch Next Page
  const fetchNextPage = useCallback(async () => {
    if (isFetchingNextPage || !pagination.hasNextPage) return;
    setIsFetchingNextPage(true);
    try {
      const sort = searchParams.get("sort") || "manual";
      const activeFilters = getActiveFiltersForShopify(searchParams, availableFilters);
      const filterParams = activeFilters.length > 0 ? `filters=${encodeURIComponent(JSON.stringify(activeFilters))}` : "";
      const data = await apiFetch(`/api/collection?handle=${handle}&${filterParams}&sort=${sort}&limit=${limit}&cursor=${pagination.endCursor}`);
      setProducts(prev => {
        const nextProducts = data.products || [];
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = nextProducts.filter(p => !existingIds.has(p.id) && !p.tags?.some(t => t?.toLowerCase() === 'hidden'));
        return [...prev, ...filteredNew];
      });
      setPagination(data.pageInfo || { hasNextPage: false, endCursor: null });
      if (data.totalProducts) setTotalCount(data.totalProducts);
    } catch (err) {
      console.error("Failed to fetch next page:", err);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [handle, searchParams, pagination, isFetchingNextPage, limit, availableFilters, getActiveFiltersForShopify]);

  // Infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { 
        rootMargin: "0px 0px 800px 0px", // Increased margin for earlier pre-fetching
        threshold: 0 
      }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [pagination.hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
    scrollToTop();
  };

  const toggleFilterExpand = (groupKey) => {
    setExpandedFilters((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleSort = (value) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value === "manual") p.delete("sort");
    else p.set("sort", value);
    p.delete("cursor");
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
    scrollToTop();
    // Fire promoClick datalayer for sort-by
    const sortLabel = SORT_OPTIONS.find((o) => o.value === value)?.label || value;
    pushPromoClick({
      creative_name: "Plp Sort-by",
      location_id: pathname,
      promo_id: value,
      promo_name: sortLabel,
    });
  };

  const activeSort = searchParams.get("sort") || "manual";

  // Extract selected color from filters to pass to ProductCard
  const selectedColor = useMemo(() => {
    // 1. Check direct Shopify filter key
    const filterColor = searchParams.get("filter.v.option.metal_color");
    if (filterColor) return filterColor;

    // 2. Check for any key containing 'color'
    let foundColor = "";
    searchParams.forEach((value, key) => {
      if (key.toLowerCase().includes("color")) {
        foundColor = value;
      }
    });
    return foundColor;
  }, [searchParams]);

  const renderGridItems = () => {
    const items = [];
    let renderedCount = 0;
    products.forEach((prod, idx) => {
      if (!prod) return;
      if (renderedCount === 3 || renderedCount === 10) {
        items.push(
          <div key={`inpage-${idx}`} className="overflow-hidden rounded-lg">
            <Link prefetch={false} className="cursor-default" href="/collections/bestsellers" onClick={(e) => e.preventDefault()}>
              <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Desktop-Inpage_17abf418-603b-4714-860d-d08e90b6aca9.jpg" alt="Promo" width={800} height={400} className="w-full h-full object-cover rounded-lg" />
            </Link>
          </div>
        );
      }
      
      // Trigger pagination when 10 products are scrolled
      // For a batch of 25, this is the 11th product (index 10, or length - 15)
      const isTrigger = pagination.hasNextPage && idx === products.length - 15;
      
      items.push(
        <div key={`${prod.id || idx}-${idx}`} ref={isTrigger ? loadMoreRef : null}>
          <ProductCard 
            product={selectedColor ? { ...prod, selectedColor } : prod} 
            collectionHandle={handle} 
            index={idx + 1} 
            disableLivePricing={false}
          />
        </div>
      );
      renderedCount++;
    });
    if (isFetchingNextPage) {
      items.push(<ProductCardSkeleton key="next-1" />, <ProductCardSkeleton key="next-2" />, <ProductCardSkeleton key="next-3" />);
    }
    return items;
  };

  const displayTitle = isMobile
    ? (handle === "all" ? "All Products" : handle.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "))
    : (collection.title || (handle === "all" ? "All Products" : handle.replace(/-/g, " ")));

  const countDisplay = useMemo(() => {
    const loaded = products.length;
    // Fallback if API returns 0 total but we have products (common with filters)
    const total = totalCount > 0 ? totalCount : (pagination.hasNextPage ? `${loaded}+` : loaded);
    return `${loaded}/${total} Products`;
  }, [products.length, totalCount, pagination.hasNextPage]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      {STORE_HANDLES.includes(handle) ? (
        <StoreCollectionBanner collectionHandle={handle} bannerImages={STORE_IMAGES[handle] || []} />
      ) : isMobile ? (
        <div className="w-full">
          <div className="container-main mx-auto pt-2 px-4 py-3">
            <Breadcrumb>
              <BreadcrumbList className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-gray-400">
                <BreadcrumbItem><BreadcrumbLink href="/" className="hover:text-[#5a413f] transition-colors">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator className="scale-75" />
                <BreadcrumbItem><BreadcrumbLink href="/collections/jewelry" className="hover:text-[#5a413f] transition-colors">Collections</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator className="scale-75" />
                <BreadcrumbItem className="truncate line-clamp-1 whitespace-nowrap"><BreadcrumbPage className="text-[#5a413f]">{displayTitle}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="w-full relative h-34 md:h-54">
            <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Offer-Mobile_1_e098831b-f04d-4b6c-ba2c-d1209cdec211.jpg?v=1783671698" alt={displayTitle} fill className="object-cover" priority />
          </div>
        </div>
      ) : (
        <div className="bg-[#FFF5F1] overflow-hidden">
          <div className="container-main flex flex-col md:flex-row items-center">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4 capitalize">{displayTitle}</h1>
              {/* <p className="text-gray-900 text-sm md:text-base mb-8 max-w-xl">{collection.description || "Find the perfect piece for your special moment."}</p> */}
              <div className="flex flex-wrap gap-6 text-xs md:text-sm font-medium">
                <div className="flex items-center gap-2"><Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Group_f573cba5-716e-47c9-baeb-8303cf3ba2e8.png" alt="Shipping" width={20} height={20} className="md:w-6" /><span>Free & secure shipping</span></div>
                <div className="flex items-center gap-2"><Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/streamline_star-badge_1.png" alt="Certified" width={20} height={20} className="md:w-6" /><span>100% value guarantee</span></div>
                <div className="flex items-center gap-2"><Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/hugeicons_delivery-return-01.png" alt="Return" width={20} height={20} className="md:w-6" /><span>15-day Money Back Guarantee</span></div>
              </div>
            </div>
            <div className="flex-1 w-full h-auto">
              <Image 
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Offer-Mobile_1_e098831b-f04d-4b6c-ba2c-d1209cdec211.jpg?v=1783671698" 
                alt={displayTitle} 
                width={640} 
                height={223} 
                className="w-full h-auto object-contain" 
              />
            </div>
          </div>
        </div>
      )}

      <div className={isMobile ? "" : "flex xl:gap-12 lg:gap-6 py-6 container-main mx-auto"}>
        {/* ================= FILTERS SIDEBAR ================= */}
        <div className="hidden lg:block xl:w-78 lg:w-60 shrink-0">
          <div className="sticky top-19 self-start h-fit">
            <ScrollArea className="w-full h-[calc(100dvh-5rem)]">
              {filtersLoading && Object.keys(availableFilters).length === 0 ? <FilterSidebarSkeleton /> : (
                <div className={`space-y-3 px-4 ${filtersLoading ? "opacity-50 pointer-events-none" : ""}`}>
                  <div className="flex justify-between items-center border-b"><h3 className="font-semibold mb-3 uppercase tracking-widest text-sm">Filters</h3><button onClick={clearAllFilters} className="text-[0.625rem] font-bold uppercase text-zinc-400 hover:text-black mb-3">Clear All</button></div>
                  {Object.entries(availableFilters).map(([groupKey, options]) => {
                    const isExpanded = expandedFilters[groupKey] ?? false;
                    if (groupKey === "Price") {
                      return (
                        <div key={groupKey} className="border-b mb-0 border-gray-200">
                          <button onClick={() => toggleFilterExpand(groupKey)} className="w-full flex items-center justify-between py-5 hover:opacity-70 transition-opacity"><h4 className="font-medium text-sm capitalize">{groupKey}</h4><ChevronUp size={18} className={`transition-transform duration-300 ${isExpanded ? "rotate-0" : "rotate-180"}`} /></button>
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
                        <button onClick={() => toggleFilterExpand(groupKey)} className="w-full flex items-center justify-between py-5 hover:opacity-70 transition-opacity"><h4 className="font-medium text-sm capitalize">{groupKey}</h4><ChevronUp size={18} className={`transition-transform duration-300 ${isExpanded ? "rotate-0" : "rotate-180"}`} /></button>
                        {isExpanded && (
                          <div className="space-y-4 my-2 pb-5">
                            {Array.isArray(options) && options.map((opt) => (
                              <div key={opt.label} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors" onClick={() => toggleFilter(opt.urlKey || groupKey, opt.value, groupKey, opt.label)}>
                                <input type="checkbox" checked={searchParams.getAll(opt.urlKey || groupKey).includes(opt.value)} onChange={() => {}} className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                                <label className="flex-1 cursor-pointer flex justify-between items-center"><span>{opt.label}</span><span className="text-gray-400 text-xs">({opt.count})</span></label>
                              </div>
                            ))}
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

        {/* ================= PRODUCTS SECTION ================= */}
        <div className="flex-1">
          <div className={`flex gap-4 items-center justify-between sticky top-0 bg-white z-20 ${isMobile ? "py-5 border-b border-gray-50 px-4" : "py-4"}`}>
            <div className={isMobile ? "flex items-baseline gap-2.5" : "flex gap-3 items-center"}>
              {isMobile ? (<><h2 className="text-lg font-bold text-black capitalize leading-none">{displayTitle}</h2><span className="text-xs text-gray-400 font-medium whitespace-nowrap">{countDisplay}</span></>) : (<span className="text-sm text-gray-500">{countDisplay}</span>)}
            </div>
            {!isMobile && (
              <div className="flex items-center gap-4"><div className="flex items-center gap-2"><span className="text-sm text-gray-600">Sort:</span><select value={activeSort} onChange={(e) => handleSort(e.target.value)} className="text-sm border rounded-md px-3 py-2 bg-white">{SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div></div>
            )}
          </div>

          {!isMobile && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {Object.entries(availableFilters).map(([groupKey, options]) => (
                <Fragment key={groupKey}>
                  {groupKey === "Price" ? (
                    (searchParams.get("filter.v.price.gte") || searchParams.get("filter.v.price.lte")) && (
                      <Badge variant="secondary" className="bg-[#FFF5F1] text-black hover:bg-[#FFE4D9] border-none px-3 py-1 rounded-full flex items-center gap-2 cursor-pointer" onClick={resetPriceFilter}>
                        <span className="text-xs font-medium">Price: {searchParams.get("filter.v.price.gte") ? `₹${searchParams.get("filter.v.price.gte")}` : "0"} - {searchParams.get("filter.v.price.lte") ? `₹${searchParams.get("filter.v.price.lte")}` : "Max"}</span>
                        <XIcon className="size-3" />
                      </Badge>
                    )
                  ) : (
                    Array.isArray(options) && options.filter(opt => searchParams.getAll(opt.urlKey || groupKey).includes(opt.value)).map((opt) => (
                      <Badge key={`${groupKey}-${opt.label}`} variant="secondary" className="bg-[#FFF5F1] text-black hover:bg-[#FFE4D9] border-none px-3 py-1 rounded-full flex items-center gap-2 cursor-pointer" onClick={() => toggleFilter(opt.urlKey || groupKey, opt.value, groupKey, opt.label)}>
                        <span className="text-xs font-medium">{opt.label.split(" (")[0]}</span>
                        <XIcon className="size-3" />
                      </Badge>
                    ))
                  )}
                </Fragment>
              ))}
              {(activeFilterCount > 0) && <button onClick={clearAllFilters} className="text-sm text-gray-400 hover:text-black font-medium ml-2">Remove all</button>}
            </div>
          )}

          <div className={`grid mt-4 transition-opacity duration-300 ${productsLoading ? "opacity-50 pointer-events-none" : ""} ${isMobile ? "grid-cols-2 gap-4 px-2" : "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 lg:grid-cols-3 gap-6"}`}>
            {productsLoading && products.length === 0 ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />) : renderGridItems()}
          </div>
          <div ref={loadMoreRef} className="w-full flex justify-center items-center py-10">
            {!pagination.hasNextPage && totalCount > 0 && <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">You've reached the end</p>}
          </div>
        </div>
      </div>

      {/* SEO & FAQ Content */}
      {(() => {
        const faqSection = collection?.metafields?.["custom.seo_content_data"];
        const isFaqSectionValid = faqSection && !faqSection.includes("gid://shopify/Metaobject");

        let questions = [];
        let answers = [];
        try {
          const rawQ = collection?.metafields?.["custom.faqquestion"];
          const rawA = collection?.metafields?.["custom.faqanswers"];
          
          if (Array.isArray(rawQ)) {
            questions = rawQ;
          } else if (rawQ?.startsWith("[")) {
            questions = JSON.parse(rawQ);
          } else {
            questions = (rawQ || "").split("•").filter(Boolean);
          }
          
          if (Array.isArray(rawA)) {
            answers = rawA;
          } else if (rawA?.startsWith("[")) {
            answers = JSON.parse(rawA);
          } else {
            answers = (rawA || "").split("•").filter(Boolean);
          }
        } catch (e) {
          console.error("Error parsing FAQ:", e);
        }

        const hasFaq = questions.length > 0 || isFaqSectionValid;
        const hasBestsellers = (collection?.bestsellerProducts && collection.bestsellerProducts.length > 0) || collection?.metafields?.["custom.bestsellers_html"];
        const seoContent = collection?.metafields?.["custom.seocontent"];
        const hasSeo = seoContent && !seoContent.toString().startsWith("gid://shopify/Page/") && !seoContent.toString().startsWith("gid://shopify/OnlineStorePage/");

        // if (!hasFaq && !hasBestsellers && !hasSeo) return null;

        return (
          <div className="seo-content container-main py-10 md:py-16 border-t border-gray-100">
            <div className="w-full px-2 lg:px-6">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                {/* Bestseller Products (SEO Links) */}
                {hasBestsellers && (
                  <div className={`${hasFaq ? "lg:w-1/2" : "w-full"} order-1`}>
                    <div className="plp-seo-links-section">
                      <h2 className="text-lg lg:text-xl font-semibold mb-5 text-left text-gray-900 uppercase tracking-wider">
                        Bestsellers
                      </h2>
                      {collection?.metafields?.["custom.bestsellers_html"] ? (
                        <div className="prose prose-sm max-w-none border border-gray-200 rounded-xl p-6 bg-white overflow-x-auto shadow-sm" dangerouslySetInnerHTML={{ __html: collection.metafields["custom.bestsellers_html"] }} />
                      ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          {!hasFaq && (
                            <div className="grid lg:grid-cols-2 bg-gray-50 border-b border-gray-200 divide-x divide-gray-200 hidden lg:grid">
                              <div className="grid grid-cols-[auto_1fr_auto] px-6 py-4 gap-4">
                                <div className="w-12 h-6" />
                                <h3 className="text-[0.625rem] font-bold uppercase tracking-widest text-zinc-400">PRODUCT NAME</h3>
                                <h3 className="text-[0.625rem] font-bold uppercase tracking-widest text-zinc-400 text-right">PRICE</h3>
                              </div>
                              <div className="grid grid-cols-[auto_1fr_auto] px-6 py-4 gap-4">
                                <div className="w-12 h-6" />
                                <h3 className="text-[0.625rem] font-bold uppercase tracking-widest text-zinc-400">PRODUCT NAME</h3>
                                <h3 className="text-[0.625rem] font-bold uppercase tracking-widest text-zinc-400 text-right">PRICE</h3>
                              </div>
                            </div>
                          )}
                          {hasFaq && (
                            <div className="grid grid-cols-[auto_1fr_auto] bg-gray-50 border-b border-gray-200 px-6 py-4 gap-4 justify-content: center;">
                              <div className="w-12 h-6" />
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black-400">PRODUCT NAME</h3>
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black-400 text-right">PRICE</h3>
                            </div>
                          )}
                          <div className={`divide-y divide-gray-100 ${!hasFaq ? "lg:grid lg:grid-cols-2 lg:divide-y-0" : ""}`}>
                            {(collection.bestsellerProducts || []).slice(0, 10).map((item, idx) => (
                              <div key={idx} className={`grid grid-cols-[auto_1fr_auto] px-6 py-4 hover:bg-gray-50/50 transition-colors items-center gap-4 ${!hasFaq ? "lg:border-t lg:border-gray-100 first:border-t-0 [&:nth-child(2)]:lg:border-t-0 lg:border-l lg:first:border-l-0 lg:[&:nth-child(odd)]:border-l-0" : ""}`}>
                                <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden relative shrink-0 border border-gray-100">
                                  {item.image ? (
                                    <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-200">
                                      <ShoppingBag size={20} />
                                    </div>
                                  )}
                                </div>
                                <Link prefetch={false} href={`/products/${item.handle}`} className="text-sm  text-gray-900 hover:text-primary transition-colors truncate pr-4">
                                  {item.title}
                                </Link>
                                <span className="text-sm  text-black-800 text-right">
                                  ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(item.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-[0.625rem] font-bold text-gray-400 uppercase tracking-widest mt-4">
                        Last Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}

                {/* FAQ Section */}
                {hasFaq && (
                  <div className={`${hasBestsellers ? "lg:w-1/2" : "w-full"} order-2 mb-16`}>
                    <h2 className="
                    text-lg lg:text-xl font-semibold mb-5 text-left text-gray-900 uppercase tracking-wider
                    ">
                      FAQ
                    </h2>
                    <div className="w-full">
                      {questions.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {questions.map((q, idx) => (
                            <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-gray-200">
                              <AccordionTrigger className="text-base lg:text-lg font-medium text-gray-900 hover:no-underline py-4">
                                {q.trim()}
                              </AccordionTrigger>
                              {answers[idx] && (
                                <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                                  {answers[idx].trim()}
                                </AccordionContent>
                              )}
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : isFaqSectionValid ? (
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                          <div className="text-gray-600 text-sm leading-relaxed">
                            {faqSection}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* SEO Section */}
                {collection?.descriptionHtml && (
  <div className="mt-8 border-t border-gray-100 pt-10">
    <div
      className="
        max-w-4xl

        [&_h1]:text-2xl
        [&_h1]:font-bold
        [&_h1]:text-gray-900
        [&_h1]:mt-12
        [&_h1]:mb-4
        [&_h1]:uppercase
        [&_h1]:tracking-wide
        [&_h1]:border-b
        [&_h1]:border-gray-100
        [&_h1]:pb-3

        [&_h2]:text-xl
        [&_h2]:font-semibold
        [&_h2]:text-gray-900
        [&_h2]:mt-10
        [&_h2]:mb-3
        [&_h2]:uppercase
        [&_h2]:tracking-wide

        [&_h3]:text-base
        [&_h3]:font-semibold
        [&_h3]:text-gray-800
        [&_h3]:mt-6
        [&_h3]:mb-2
        [&_h3]:tracking-wide

        [&_h4]:text-sm
        [&_h4]:font-semibold
        [&_h4]:text-gray-800
        [&_h4]:mt-5
        [&_h4]:mb-2
        [&_h4]:uppercase
        [&_h4]:tracking-wider

        [&_h5]:text-xs
        [&_h5]:font-bold
        [&_h5]:text-gray-700
        [&_h5]:mt-4
        [&_h5]:mb-1
        [&_h5]:uppercase
        [&_h5]:tracking-widest

        [&_h6]:text-xs
        [&_h6]:font-bold
        [&_h6]:text-gray-400
        [&_h6]:mt-4
        [&_h6]:mb-1
        [&_h6]:uppercase
        [&_h6]:tracking-widest

        [&_h1:first-child]:mt-0
        [&_h2:first-child]:mt-0
        [&_h3:first-child]:mt-0

        [&_p]:text-sm
        [&_p]:text-gray-500
        [&_p]:leading-relaxed
        [&_p]:mb-3

        [&_ul]:my-3
        [&_ul]:space-y-1.5
        [&_ul]:pl-5
        [&_ul]:list-disc

        [&_ol]:my-3
        [&_ol]:pl-5
        [&_ol]:space-y-1.5
        [&_ol]:list-decimal

        [&_li]:text-sm
        [&_li]:text-gray-500
        [&_li]:pl-1

        [&_ul>li]:marker:text-[#5a413f]
        [&_ol>li]:marker:text-[#5a413f]

        [&_strong]:text-gray-800
        [&_strong]:font-semibold
        [&_em]:text-gray-600
        [&_em]:italic

        [&_a]:text-[#5a413f]
        [&_a]:underline
        [&_a]:underline-offset-2
        [&_a:hover]:text-black
        [&_a]:transition-colors
        [&_a]:duration-150

        [&_blockquote]:border-l-2
        [&_blockquote]:border-[#5a413f]
        [&_blockquote]:pl-4
        [&_blockquote]:my-6
        [&_blockquote]:italic
        [&_blockquote]:text-gray-500
        [&_blockquote]:text-sm

        [&_hr]:my-8
        [&_hr]:border-gray-100

        [&_table]:w-full
        [&_table]:my-6
        [&_table]:text-sm
        [&_table]:border-collapse
        [&_table]:rounded-lg
        [&_table]:overflow-hidden
        [&_table]:shadow-sm
        [&_table]:border
        [&_table]:border-gray-200

        [&_thead]:bg-[#FFF5F1]
        [&_thead_th]:text-xs
        [&_thead_th]:font-bold
        [&_thead_th]:uppercase
        [&_thead_th]:tracking-wider
        [&_thead_th]:text-[#5a413f]
        [&_thead_th]:px-4
        [&_thead_th]:py-3
        [&_thead_th]:text-left
        [&_thead_th]:border-b
        [&_thead_th]:border-gray-200

        [&_tbody_tr]:border-b
        [&_tbody_tr]:border-gray-100
        [&_tbody_tr]:transition-colors
        [&_tbody_tr:hover]:bg-gray-50
        [&_tbody_tr:last-child]:border-0

        [&_tbody_td]:px-4
        [&_tbody_td]:py-3
        [&_tbody_td]:text-gray-600
        [&_tbody_td]:text-sm
        [&_tbody_td]:align-top

        [&_tfoot_td]:px-4
        [&_tfoot_td]:py-3
        [&_tfoot_td]:text-xs
        [&_tfoot_td]:text-gray-400
        [&_tfoot_td]:bg-gray-50
        [&_tfoot_td]:border-t
        [&_tfoot_td]:border-gray-200

        [&_img]:rounded-lg
        [&_img]:my-6
        [&_img]:w-full
        [&_img]:object-cover
        [&_img]:max-h-[480px]
        [&_img]:shadow-sm
        [&_img]:border
        [&_img]:border-gray-100

        [&_figure]:my-6
        [&_figure]:text-center
        [&_figcaption]:text-xs
        [&_figcaption]:text-gray-400
        [&_figcaption]:mt-2
        [&_figcaption]:italic

        [&_video]:w-full
        [&_video]:rounded-lg
        [&_video]:my-6
        [&_video]:shadow-sm
        [&_video]:max-h-[480px]
        [&_video]:object-cover
        [&_video]:border
        [&_video]:border-gray-100

        [&_iframe]:w-full
        [&_iframe]:rounded-lg
        [&_iframe]:my-6
        [&_iframe]:aspect-video
        [&_iframe]:border-0
        [&_iframe]:shadow-sm

        [&_code]:text-xs
        [&_code]:bg-gray-100
        [&_code]:text-gray-700
        [&_code]:px-1.5
        [&_code]:py-0.5
        [&_code]:rounded

        [&_pre]:bg-gray-100
        [&_pre]:rounded-lg
        [&_pre]:p-4
        [&_pre]:my-4
        [&_pre]:overflow-x-auto
        [&_pre]:text-xs
        [&_pre]:text-gray-700
      "
      dangerouslySetInnerHTML={{ __html: collection.descriptionHtml }}
    />
  </div>
)}
            </div>
          </div>
        );
      })()}

      {/* Sticky Mobile Filter Bar & Sheets */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-[#5a413f] text-white flex justify-around items-center py-4 border-t border-white/10 px-4 gap-2">
          <button onClick={() => setIsSortSheetOpen(true)} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border-r border-white/20"><ArrowUpDown size={16} /> Sort</button>
          <button onClick={() => setIsFilterSheetOpen(true)} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"><SlidersHorizontal size={16} /> Filter {activeFilterCount > 0 && <span className="bg-white text-[#5a413f] text-[0.625rem] min-w-4 h-4 rounded-full flex items-center justify-center px-1 font-bold">{activeFilterCount}</span>}</button>
        </div>
      )}

      {/* Sort Sheet */}
      <Sheet isOpen={isSortSheetOpen} onClose={() => setIsSortSheetOpen(false)} snapPoints={[0, 1]} initialSnap={1}>
        <Sheet.Container className="!rounded-t-[24px] !h-auto max-h-[60vh] bottom-0">
          <Sheet.Content className="bg-white">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 p-4 border-b border-gray-100"><button onClick={() => setIsSortSheetOpen(false)} className="p-1"><X size={20} className="text-black" /></button><h3 className="text-sm font-bold uppercase tracking-widest">Sort By</h3></div>
              <div className="p-4 space-y-2 overflow-y-auto pb-10">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { handleSort(opt.value); setIsSortSheetOpen(false); }} className={`w-full text-left py-4 px-4 rounded-lg transition-colors flex justify-between items-center ${activeSort === opt.value ? "bg-[#FFF5F1] text-[#5a413f] font-bold" : "hover:bg-gray-50 text-gray-900"}`}>
                    {opt.label} {activeSort === opt.value && <div className="w-2 h-2 rounded-full bg-[#5a413f]" />}
                  </button>
                ))}
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
              <div className="flex items-center gap-4 p-4 border-b border-gray-100"><button onClick={() => setIsFilterSheetOpen(false)} className="p-1"><X size={20} className="text-black" /></button><h3 className="text-sm font-bold uppercase tracking-widest">Filters</h3></div>
              <div className="flex-1 flex overflow-hidden">
                <div className="w-[45%] bg-[#FEF5F1] border-r border-gray-100 overflow-y-auto">
                  {Object.entries(availableFilters).map(([groupKey]) => {
                    let count = 0;
                    if (groupKey === "Price") { if (localPriceRange.min || localPriceRange.max) count = 1; }
                    else { count = availableFilters[groupKey].filter(opt => searchParams.getAll(opt.urlKey || groupKey).includes(opt.value)).length; }
                    return (
                      <button key={groupKey} onClick={() => setActiveMobileGroup(groupKey)} className={`w-full text-left px-4 py-5 text-[0.6875rem] font-bold uppercase tracking-tight border-b border-gray-100 relative leading-tight ${activeMobileGroup === groupKey ? "bg-white text-[#5a413f]" : "text-gray-500"}`}>
                        {groupKey} {count > 0 && <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#5a413f] text-white text-[0.5625rem] w-5 h-5 rounded-md flex items-center justify-center font-bold">{count}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="w-[55%] bg-white overflow-y-auto p-4">
                  {activeMobileGroup && availableFilters[activeMobileGroup] && (
                    <div className="space-y-6 pb-20">
                      {activeMobileGroup === "Price" ? (
                        <div className="space-y-5 py-4 px-2">
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
                      ) : (
                        availableFilters[activeMobileGroup].map((option) => {
                          const isSelected = searchParams.getAll(option.urlKey || activeMobileGroup).includes(option.value);
                          return (
                            <div key={option.label} className="flex items-center justify-between py-1 cursor-pointer group" onClick={() => toggleFilter(option.urlKey || activeMobileGroup, option.value, activeMobileGroup, option.label)}>
                              <div className="flex items-center gap-3">
                                {isSelected ? <div className="w-4 h-4 bg-[#5a413f] rounded flex items-center justify-center"><svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div> : <div className="w-4 h-4 border border-gray-300 rounded group-hover:border-[#5a413f]" />}
                                <span className={`text-[0.8125rem] ${isSelected ? "text-black font-semibold" : "text-gray-600"}`}>{option.label}</span>
                              </div>
                              <span className="text-[0.6875rem] text-gray-400">({option.count})</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-gray-300 bg-white">
                <button onClick={clearAllFilters} className="py-4 px-2 text-[0.6875rem] font-black bg-[#FFE4D9] text-[#5a413f] uppercase tracking-[0.1em]">Clear All</button>
                <button onClick={() => setIsFilterSheetOpen(false)} className="py-4 px-2 text-[0.6875rem] font-black bg-[#5a413f] text-white uppercase tracking-[0.1em]">APPLY FILTERS</button>    
              </div>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => setIsFilterSheetOpen(false)} />
      </Sheet>
    </div>
  );
}
