"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import LazyImage from "../common/LazyImage";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, ArrowRight, Copy, X, Loader2, Play, Heart, Check } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import {
  addWishlistItem,
  removeWishlistItem,
  addGuestWishlistItem,
  removeGuestWishlistItem,
} from "@/redux/features/wishlist/wishlistSlice";
import { setCollectionContext, openAuthModal } from "@/redux/features/user/userSlice";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { pushProductClick, pushPromoClick, pushAddToWishlist, pushRemoveFromWishlist, formatGtmPrice, getNumericId, getStandardWishlistPayload } from "@/lib/gtm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { loadNectorReviews } from "@/lib/nector";
import { apiFetch, fetchVariantPricing } from "@/lib/api";

const clientReviewStatsCache = new Map();
const clientPriceCache = new Map();

const colorMap = {
  yellow: "linear-gradient(147.45deg, #c59922 17.98%, #ead59e 48.14%, #c59922 83.84%)",
  rose: "linear-gradient(154.36deg, #f2b5b5 10.36%, #f8dbdb 68.09%)",
  white: "linear-gradient(143.06deg, #dfdfdf 29.61%, #f3f3f3 48.83%, #dfdfdf 66.43%)",
};

const parseOrnaverseComponent = (val) => {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
};

const formatPrice = (num) => {
  if (num === null || num === undefined) return "0";
  const val = Math.round(Number(num));
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(val);
};

function formatCdnUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace("https://www.lucirajewelry.com", "https://luciraonline.myshopify.com").replace("http://www.lucirajewelry.com", "https://luciraonline.myshopify.com");
}

function getBaseColor(color = "") {
  const normalized = String(color).toLowerCase();
  if (normalized.includes("rose")) return "rose";
  if (normalized.includes("white") || normalized.includes("silver") || normalized.includes("platinum")) return "white";
  if (normalized.includes("yellow") || normalized.includes("gold")) return "yellow";
  return "white";
}

function getUniqueBaseColors(colors = []) {
  const order = ["white", "yellow", "rose"];
  const availableBaseColors = new Set();
  colors.forEach((color) => {
    const base = getBaseColor(color);
    if (base) availableBaseColors.add(base);
  });
  return order.filter((color) => availableBaseColors.has(color));
}

function getVariantForBase(product, selectedBase) {
  const inStockVariant = product?.variants?.find(
    (v) => (v.inStock === true || v.inStock === "true" || (v.inventoryQuantity !== undefined && v.inventoryQuantity > 0)) && getBaseColor(v.color || v.title) === selectedBase
  );
  if (inStockVariant) return inStockVariant;
  return (
    product?.variants?.find((variant) => getBaseColor(variant.color || variant.title) === selectedBase) ||
    product?.variants?.[0] ||
    null
  );
}

function getImagesForBase(product, selectedBase) {
  const variant = getVariantForBase(product, selectedBase);
  const variantColor = String(variant?.color || variant?.title || "").toLowerCase();

  const allImages = product.images || [];
  let colorSpecificImages = [];

  // 1. Find images strictly belonging to this specific variant (by exact URL)
  if (variant?.image) {
    const variantImg = allImages.find(img => img.url === variant.image);
    if (variantImg) colorSpecificImages.push(variantImg);
  }

  // 2. Find images whose alt text matches the selected base color (e.g., "yellow")
  if (selectedBase) {
    const baseImages = allImages.filter(img =>
      String(img.alt || "").toLowerCase().includes(selectedBase.toLowerCase()) &&
      !colorSpecificImages.some(p => p.url === img.url)
    );
    colorSpecificImages = [...colorSpecificImages, ...baseImages];
  }

  // 3. Find images whose alt text matches the specific variant color string
  if (variantColor) {
    const colorImages = allImages.filter(img =>
      String(img.alt || "").toLowerCase().includes(variantColor) &&
      !colorSpecificImages.some(p => p.url === img.url)
    );
    colorSpecificImages = [...colorSpecificImages, ...colorImages];
  }

  // If we found color-specific images, ONLY show those
  if (colorSpecificImages.length > 0) return colorSpecificImages;

  // Fallback to variant image or main image if no color-specific images are found
  const fallbackImage = variant?.image || product?.image || null;
  return fallbackImage ? [{ url: fallbackImage, alt: product?.title || "Product image" }] : [];
}

function getPrioritizedVariant(product, collectionHandle) {
  if (!product?.variants || product.variants.length === 0) return null;
  const variants = product.variants;
  const inStockVariants = variants.filter(v =>
    v.inStock === true ||
    v.inStock === "true" ||
    (v.inventoryQuantity !== undefined && v.inventoryQuantity > 0)
  );

  if (collectionHandle === "9kt-collection") {
    const nineKT = variants.filter(v => String(v.color || v.title).includes("9KT"));
    if (nineKT.length > 0) {
      const inStock9KT = nineKT.find(v => v.inStock === true || v.inStock === "true");
      if (inStock9KT) return inStock9KT;
      return nineKT[0];
    }
  }

  if (inStockVariants.length > 0) {
    const type = String(product.type || "").toLowerCase();
    if (type.includes("ring")) {
      const ygInStock = inStockVariants.find(v => String(v.color || v.title).includes("Yellow Gold"));
      if (ygInStock) return ygInStock;
    }
    return inStockVariants[0];
  }
  return variants[0];
}

const ProductCard = ({ product, fixedPrice, fixedComparePrice, collectionHandle, index, singleStarRating = false, disableLivePricing = false, priority = false, disableLastViewed = false, promoClickMeta = null }) => {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const wishlist = useSelector((state) => state.wishlist.items);
  const guestWishlist = useSelector((state) => state.wishlist.guestItems);
  const recentlyViewed = useSelector((state) => state.recentlyViewed?.products || []);

  const productId = String(product.shopifyId || product.id);

  const isRecentlyViewed = useMemo(() => {
    if (!product) return false;
    const currentId = String(product.shopifyId || product.id);
    const normCurrentId = String(getNumericId(currentId));

    return recentlyViewed.slice(0, 5).some((item) => {
      const itemId = String(item.shopifyId || item.id || item.handle);
      return String(getNumericId(itemId)) === normCurrentId || item.handle === product.handle;
    });
  }, [recentlyViewed, product]);
  const productHandle = product.handle;

  const isWishlisted = useMemo(() => {
    const normProductId = String(getNumericId(productId));
    const findFn = (item) => String(getNumericId(item.productId)) === normProductId;

    if (user?.id) {
      return wishlist.some(findFn);
    }
    return guestWishlist.some(findFn);
  }, [user, wishlist, guestWishlist, productId]);

  const [isWishlistAnimating, setIsWishlistAnimating] = useState(false);
  const baseColors = getUniqueBaseColors(product.colors || product.variants?.map((v) => v.color) || []);
  const prioritizedVariant = useMemo(() => getPrioritizedVariant(product, collectionHandle), [product, collectionHandle]);

  const initialBase = useMemo(() => {
    if (product.selectedColor) return getBaseColor(product.selectedColor);
    if (prioritizedVariant) return getBaseColor(prioritizedVariant.color || prioritizedVariant.title);
    return getBaseColor(baseColors[0] || "white");
  }, [product.selectedColor, prioritizedVariant, baseColors]);

  const [activeBase, setActiveBase] = useState(initialBase);
  useEffect(() => { setActiveBase(initialBase); }, [initialBase]);

  const [showSimilar, setShowSimilar] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [reviewStats, setReviewStats] = useState(product.reviews || product.reviewStats || { count: 0, average: 0 });
  const [livePrice, setLivePrice] = useState(null);
  const [liveComparePrice, setLiveComparePrice] = useState(null);

  useEffect(() => {
    setReviewStats(product.reviews || product.reviewStats || { count: 0, average: 0 });
  }, [product.reviews, product.reviewStats]);

  const currentVariant = useMemo(() => {
    return getVariantForBase(product, activeBase);
  }, [product, activeBase]);

  const pricingVariant = prioritizedVariant || currentVariant;

  // Live Pricing Fetch
  useEffect(() => {
    if (disableLivePricing || fixedPrice || !pricingVariant?.id) return;

    const variantId = String(pricingVariant.id);
    const productId = String(product.shopifyId || product.id);
    const cacheKey = `${productId}-${variantId}`;

    if (clientPriceCache.has(cacheKey)) {
      const cached = clientPriceCache.get(cacheKey);
      setLivePrice(cached.price);
      setLiveComparePrice(cached.comparePrice);
      return;
    }

    let ignore = false;
    const vid = getNumericId(variantId);
    const pid = getNumericId(productId);

    fetchVariantPricing(vid, pid)
      .then((data) => {
        if (ignore) return;
        if (data?.raw_breakup?.total) {
          const p = data.raw_breakup.total;
          const cp = data.raw_breakup.original_total > p ? data.raw_breakup.original_total : null;
          clientPriceCache.set(cacheKey, { price: p, comparePrice: cp });
          setLivePrice(p);
          setLiveComparePrice(cp);
        } else {
          // If response is valid but no breakup, cache as null to prevent re-fetch
          clientPriceCache.set(cacheKey, { price: null, comparePrice: null });
        }
      })
      .catch((err) => {
        // Silently handle "Variant config not found" or other 404s
        // These are expected for items not yet configured in the backend
        if (err.message?.includes("not found")) {
          clientPriceCache.set(cacheKey, { price: null, comparePrice: null });
        } else {
          console.warn("[ProductCard] Pricing fetch failed:", err.message);
        }
      });

    return () => { ignore = true; };
  }, [pricingVariant?.id, product.shopifyId, product.id, fixedPrice]);

  useEffect(() => {
    const productReviewId = product.shopifyId || product.id;
    if (!productReviewId || (reviewStats?.count || 0) > 0) return;

    let ignore = false;
    const cacheKey = String(productReviewId);
    const cached = clientReviewStatsCache.get(cacheKey);

    if (cached) {
      setReviewStats(cached);
      return;
    }

    loadNectorReviews(productReviewId)
      .then((reviews) => {
        if (ignore) return;
        const nextStats = {
          count: reviews?.count || 0,
          average: reviews?.average || 0,
        };
        clientReviewStatsCache.set(cacheKey, nextStats);
        setReviewStats(nextStats);
      })
      .catch((error) => {
        console.error("Failed to fetch product review stats:", error);
      });

    return () => {
      ignore = true;
    };
  }, [product.shopifyId, product.id, reviewStats?.count]);

  const hasSimilar = true; // Always allow viewing similar products as we can fetch them by handle
  const videoMedia = useMemo(() => {
    // 1. Check if product.video is an object or a direct string URL
    if (product.video) {
      if (typeof product.video === "string") return { url: product.video, mimeType: "video/mp4" };
      return product.video;
    }

    // 2. Search in media array for VIDEO or EXTERNAL_VIDEO
    const mediaVideo = product.media?.find(m =>
      m.mediaContentType === "VIDEO" ||
      m.mediaContentType === "EXTERNAL_VIDEO" ||
      m.type === "VIDEO" ||
      m.type === "EXTERNAL_VIDEO" ||
      m.mimeType?.includes("video") ||
      m.url?.includes(".mp4")
    );
    if (mediaVideo) return mediaVideo;

    // 3. Check if any image is actually a video URL or if direct URL fields exist
    const videoUrl = (product.images || product.media)?.find(img =>
      img.url?.includes(".mp4") ||
      img.url?.includes("video") ||
      img.mediaContentType === "VIDEO"
    )?.url || product.videoUrl || product.video_url || product.productMetafields?.video_url;

    if (videoUrl) return { url: videoUrl, mimeType: "video/mp4" };

    // 4. Fallback to boolean flags from Shopify/Backend
    const hasVideoFlag = product.hasVideo === true || product.hasVideo === "true" ||
      product.productMetafields?.has_video === true || product.productMetafields?.has_video === "true";

    if (hasVideoFlag) {
      const sku = currentVariant?.sku || product.variants?.[0]?.sku;
      if (sku) {
        // Standard Lucira CDN pattern
        return { url: `https://luciraonline.myshopify.com/cdn/shop/files/${sku}.mp4`, isPlaceholder: true };
      }
      return { url: null, isPlaceholder: true };
    }

    return null;
  }, [product.video, product.media, product.images, product.videoUrl, product.video_url, product.hasVideo, product.productMetafields, currentVariant?.sku, product.variants]);

  const showVideoIcon = Boolean(videoMedia);

  const displayPrice = fixedPrice || livePrice || pricingVariant?.price_breakup?.total || pricingVariant?.price || product.price_breakup?.total || product.price;
  const displayComparePrice = fixedComparePrice || liveComparePrice || pricingVariant?.compare_price || pricingVariant?.compareAtPrice || product.compare_price || product.compareAtPrice;
  const discountPercent = useMemo(() => {
    if (!displayComparePrice || displayComparePrice <= displayPrice) return 0;
    return Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100);
  }, [displayPrice, displayComparePrice]);

  const displayLabels = useMemo(() => {
    const tags = Array.isArray(product.tags) ? product.tags : [];
    const lowerTags = tags.map(t => String(t).toLowerCase());

    // Any product tagged "embrace" shows two badges ("Extra 3% OFF" and "Eterna",
    // styled like Best Seller) — all other badges are suppressed for these products.
    if (lowerTags.some(t => t.includes("embrace"))) {
      return ["Extra 3% OFF", "Eterna"];
    }

    const labels = [];
    if (product.label) labels.push(product.label);
    const bestsellerMeta = String(product.productMetafields?.bestsellers || "").toLowerCase();

    if (lowerTags.some(t => t.includes("fast shipping") || t.includes("fastshipping"))) labels.push("Fast Shipping");
    if (lowerTags.some(t => t.includes("best seller") || t.includes("bestseller")) || bestsellerMeta === "bestseller") labels.push("Best Seller");
    if (lowerTags.some(t => t.includes("new arrival") || t === "new")) labels.push("New Arrival");
    if (lowerTags.some(t => t.includes("trending"))) labels.push("Trending");

    return [...new Set(labels)].slice(0, 2);
  }, [product.label, product.tags, product.productMetafields?.bestsellers]);

  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  useEffect(() => {
    if (displayLabels.length > 1) {
      const interval = setInterval(() => { setCurrentLabelIndex((prev) => (prev + 1) % 2); }, 4500);
      return () => clearInterval(interval);
    } else { setCurrentLabelIndex(0); }
  }, [displayLabels.length]);

  const galleryImages = getImagesForBase(product, activeBase);
  const swiperId = `card-swiper-${String(product.id || product.shopifyId || product.handle).replace(/[^a-zA-Z0-9]/g, "")}`;
  const swiperRef = useRef(null);

  // Reset swiper to first slide when gallery images change
  useEffect(() => {
    if (swiperRef.current && !swiperRef.current.destroyed) {
      swiperRef.current.slideTo(0, 0);
    }
  }, [galleryImages]);

  const prevImageBtnRef = useRef(null);
  const nextImageBtnRef = useRef(null);

  const handleBeforeInit = (swiper) => {
    if (galleryImages.length <= 1 || !swiper.params.navigation) return;
    if (prevImageBtnRef.current) swiper.params.navigation.prevEl = prevImageBtnRef.current;
    if (nextImageBtnRef.current) swiper.params.navigation.nextEl = nextImageBtnRef.current;
  };

  const fetchSimilar = async () => {
    if (similarProducts.length > 0) { setShowSimilar(true); return; }
    setLoadingSimilar(true);
    setShowSimilar(true);
    try {
      const data = await apiFetch(`/api/products/related?handle=${product.handle}`);
      // Priority: complementaryProducts > matchingProducts > products
      let products = data.complementaryProducts || data.matchingProducts || data.products || [];

      // Fallback: If no related products found, use search API based on product type
      if (products.length === 0 && (product.type || product.category)) {
        const query = product.type || product.category;
        const searchData = await apiFetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=11`);
        products = searchData.products || [];
      }

      setSimilarProducts(products.filter(p => p.handle !== product.handle));
    } catch (e) { console.error("Failed to fetch similar products", e); } finally { setLoadingSimilar(false); }
  };

  useEffect(() => {
    if (showSimilar || showVideoPopup) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showSimilar, showVideoPopup]);

  const handleProductClick = useCallback(() => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : "";
    if (collectionHandle) dispatch(setCollectionContext(collectionHandle));
    const clickData = {
      productId: String(getNumericId(product.shopifyId || product.id)),
      variantId: String(getNumericId(currentVariant?.id || currentVariant?.shopifyId)),
      sku: currentVariant?.sku || "",
      productName: product.title,
      productType: product.type || "",
      category: product.category || product.type || "",
      productUrl: `${currentOrigin}/products/${product.handle}`,
      thumbnailImage: galleryImages?.[0]?.url || product.image?.url || "",
      purity: currentVariant?.metafields?.metal_purity || "",
      price: String(Number(displayPrice || 0)),
      offerPrice: String(Number(displayComparePrice || displayPrice || 0)),
    };
    if (index !== undefined && index !== null && index !== "") clickData.indexPosition = String(index);
    pushProductClick(clickData);

    if (promoClickMeta) {
      pushPromoClick({
        creative_name: promoClickMeta.creative_name,
        location_id: promoClickMeta.location_id,
        promo_id: promoClickMeta.promo_id,
        promo_name: product.title,
      });
    }
  }, [product, currentVariant, galleryImages, displayPrice, displayComparePrice, index, collectionHandle, dispatch, promoClickMeta]);

  const productOffers = useMemo(() => {
    const offers = [];

    // 1. Direct fields
    if (product.diamondDiscount > 0) offers.push(`${product.diamondDiscount}% OFF on Diamonds`);
    if (product.makingDiscount > 0) offers.push(`${product.makingDiscount}% OFF on Making Charges`);

    // 2. Variants (common in collection API)
    if (product.variants?.length > 0) {
      const v = product.variants[0];
      if (v.diamondDiscount > 0) offers.push(`${v.diamondDiscount}% OFF on Diamonds`);
      if (v.makingDiscount > 0) offers.push(`${v.makingDiscount}% OFF on Making Charges`);
    }

    // 3. Price breakup
    const breakup = currentVariant?.price_breakup || product.price_breakup;
    if (breakup) {
      if (breakup.diamond?.discount_percent > 0) offers.push(`${breakup.diamond.discount_percent}% OFF on Diamonds`);
      if (breakup.making_charges?.discount_percent > 0) offers.push(`${breakup.making_charges.discount_percent}% OFF on Making Charges`);
    }

    // 4. Tags
    const tags = Array.isArray(product.tags) ? product.tags : [];
    tags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      if (lowerTag.includes("off on making charges") || lowerTag.includes("off on diamonds")) {
        offers.push(tag);
      }
    });

    return [...new Set(offers)];
  }, [product, currentVariant]);

  return (
    <>
      <div className="space-y-4">
        <div className="group/card block space-y-4">
          <div className="relative aspect-square w-full bg-[#fafafa] overflow-hidden">
            <Link href={`/products/${product.handle}`} prefetch={false} className="block w-full h-full mix-blend-multiply cursor-pointer" onClick={handleProductClick}>
              {galleryImages.length > 0 ? (
                <Swiper
                  spaceBetween={0}
                  loop={galleryImages.length > 1}
                  slidesPerView={1}
                  nested={true}
                  touchStartPreventDefault={false}
                  modules={[Navigation, Pagination]}
                  pagination={galleryImages.length > 1 ? { type: 'progressbar', el: `.pagination-${swiperId}` } : false}
                  navigation={{
                    prevEl: `.custom-prev-${swiperId}`,
                    nextEl: `.custom-next-${swiperId}`,
                  }}
                  onSwiper={(swiper) => { swiperRef.current = swiper; }}
                  className="w-full h-full custom-product-swiper"
                >
                  {galleryImages.map((image, idx) => {
                    const handleWords = product?.handle?.toLowerCase().split("-") || [];
                    const targetKeywords = ['rings', 'ring', 'earrings', 'earring', 'nosepin', 'nose', 'band', 'bali', 'stud'];
                    const hasMatchingWord = handleWords.some(word => targetKeywords.includes(word));
                    const shouldZoom = isMobile && hasMatchingWord;

                    return (
                      <SwiperSlide key={`${image.url}-${idx}`}>
                        {/* overflow-hidden keeps the 130% zoomed image contained inside the slide */}
                        <div className="relative w-full h-full overflow-hidden rounded-sm">
                          <LazyImage
                            src={formatCdnUrl(image.url)}
                            alt={image.alt || product.title}
                            fill
                            priority={idx === 0 && priority}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className={`object-contain transition-all duration-300 ${shouldZoom ? 'scale-[1.30]' : 'lg:scale-100'
                              }`}
                          />
                        </div>
                      </SwiperSlide>
                    );
                  })}
                  {galleryImages.length > 1 && <div className={`pagination-${swiperId} swiper-pagination bottom-0!`} />}
                </Swiper>
              ) : <div className="w-full h-full flex items-center justify-center text-zinc-400">No Image</div>}
            </Link>

            {/* Recently Viewed Hover Overlay */}
            {!disableLastViewed && isRecentlyViewed && (
              <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center pointer-events-none rounded-sm opacity-100 group-hover/card:opacity-0 transition-opacity duration-300">
                <span className="text-white font-figtree font-semibold text-xs sm:text-sm tracking-widest uppercase">
                  LAST VIEWED
                </span>
              </div>
            )}

            {/* Labels - Top Left. Auto-fits its width and morphs smoothly between labels.
                Best Seller uses the #B77767 brand tone; others stay beige. */}
            {displayLabels.length > 0 && (() => {
              const label = displayLabels[currentLabelIndex];
              const isBestSeller = label === "Best Seller" || label === "Extra 3% OFF" || label === "Eterna";
              return (
                <motion.div
                  layout
                  transition={{ layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
                  className={`absolute top-0 lg:top-3 left-0 z-10 h-6 lg:h-7 overflow-hidden rounded-none flex items-center ${isBestSeller ? "bg-[#B77767]" : "bg-[#F1E4D1]"}`}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={label}
                      initial={{ y: "110%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-110%", opacity: 0 }}
                      transition={{
                        y: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                      }}
                      className={`block font-figtree font-semibold text-xs lg:text-sm leading-[1.6] tracking-normal px-3 capitalize whitespace-nowrap ${isBestSeller ? "text-white" : "text-black"}`}
                    >
                      {label}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              );
            })()}

            {/* View Similar - Bottom Right */}
            {hasSimilar && (
              <div className="absolute bottom-4 right-2 lg:right-4 z-10">
                <Drawer open={showSimilar} onOpenChange={setShowSimilar}>
                  <DrawerTrigger asChild>
                    <button onClick={(e) => { e.preventDefault(); fetchSimilar(); }} className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300 cursor-pointer">
                      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path d="M11.4326 10.4118C11.4298 10.2235 11.5017 10.0417 11.6326 9.90627C11.7635 9.77087 11.9427 9.69288 12.131 9.6894L21.4662 9.52505C21.6549 9.5214 21.8372 9.59284 21.9732 9.72366C22.1093 9.85448 22.1877 10.034 22.1914 10.2226L22.4237 23.5881C22.4267 23.7767 22.3547 23.9588 22.2235 24.0943C22.0922 24.2299 21.9126 24.3078 21.7239 24.3109L12.3888 24.4752C12.2003 24.4785 12.0182 24.4068 11.8825 24.2759C11.7468 24.1451 11.6685 23.9657 11.6649 23.7772L11.4326 10.4118Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11.5359 11.5298L6.05221 12.9991C5.89154 13.0422 5.75454 13.1473 5.67127 13.2913C5.58799 13.4353 5.56526 13.6064 5.60805 13.7672L8.65898 25.1599C8.70233 25.3206 8.80772 25.4575 8.95198 25.5406C9.09625 25.6236 9.26758 25.646 9.42833 25.6027L13.8273 24.424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22.4641 11.5298L27.9478 12.9991C28.1085 13.0422 28.2455 13.1473 28.3287 13.2913C28.412 13.4353 28.4347 13.6064 28.3919 13.7672L25.341 25.1599C25.2977 25.3206 25.1923 25.4575 25.048 25.5406C24.9038 25.6236 24.7324 25.646 24.5717 25.6027L19.8202 24.3296" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[90vh] h-[90vh] bg-white rounded-t-[20px] flex flex-col">
                    <div className="mx-auto w-full flex flex-col h-full overflow-hidden">
                      <DrawerHeader className="px-10 py-6 flex flex-row items-center justify-between border-b border-zinc-100 shrink-0">
                        <DrawerTitle className="text-xl font-medium text-black uppercase">VIEW SIMILAR</DrawerTitle>
                        <DrawerClose asChild><button className="text-zinc-400 hover:text-black p-1 cursor-pointer"><X size={22} /></button></DrawerClose>
                      </DrawerHeader>
                      <div className="sm:px-10 sm:py-10 px-5 py-5 overflow-y-auto flex-1">
                        {loadingSimilar ? <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-zinc-400" size={40} /><p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Searching matching designs...</p></div> :
                          similarProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12 pb-10">
                              {similarProducts.slice(0, 10).map((item) => (
                                <div key={item.id} className="space-y-4">
                                  <Link href={`/products/${item.handle}`} prefetch={false} onClick={() => setShowSimilar(false)} className="block space-y-4 group cursor-pointer">
                                    <div className="aspect-square relative rounded-md bg-[#F9F9F9] overflow-hidden">
                                      <LazyImage src={item.image} alt={item.title} fill className="object-contain transition-transform duration-500 group-hover:scale-105 mix-blend-multiply" />
                                      {item.media?.some(m => m.type === "VIDEO" || m.type === "EXTERNAL_VIDEO") && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            const vMedia = item.media.find(m => m.type === "VIDEO" || m.type === "EXTERNAL_VIDEO");
                                            if (vMedia) onVideoPlay?.(vMedia, item.title);
                                          }}
                                          className="absolute bottom-2 left-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300 cursor-pointer"
                                        >
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 ml-0.5">
                                            <path d="M7 6V18L19 12L7 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="text-[13px] font-normal text-zinc-900 line-clamp-1">{item.title}</h4>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[14px] font-bold text-black">₹{formatPrice(item.price)}</p>
                                        {(Number(item.compare_price || item.compareAtPrice || 0) > Number(item.price || 0)) && (
                                          <p className="text-[12px] text-zinc-400 line-through">₹{formatPrice(item.compare_price || item.compareAtPrice)}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 group/link"><span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 group-hover/link:border-black transition-colors">VIEW DETAILS</span><ChevronRight size={10} /></div>
                                    </div>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          ) : <div className="flex flex-col items-center justify-center py-20 text-center gap-4"><div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center"><Copy className="text-zinc-300" size={30} /></div><p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">No similar items found.</p></div>
                        }
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            )}

            {/* Video - Bottom Left */}
            {videoMedia && (
              <button onClick={(e) => { e.preventDefault(); setShowVideoPopup(true); }} className="absolute bottom-4 left-2 lg:left-4 z-10 w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300 cursor-pointer">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M11.084 18.1814V9.81869C11.0842 9.71406 11.1125 9.6114 11.166 9.52147C11.2194 9.43155 11.2961 9.35766 11.388 9.30756C11.4798 9.25745 11.5835 9.23298 11.688 9.2367C11.7926 9.24042 11.8943 9.27219 11.9823 9.32869L18.4877 13.5089C18.57 13.5616 18.6378 13.6343 18.6847 13.7201C18.7317 13.8059 18.7563 13.9022 18.7563 14C18.7563 14.0979 18.7317 14.1941 18.6847 14.2799C18.6378 14.3658 18.57 14.4384 18.4877 14.4912L11.9823 18.6725C11.8943 18.729 11.7926 18.7608 11.688 18.7645C11.5835 18.7682 11.4798 18.7438 11.388 18.6937C11.2961 18.6436 11.2194 18.5697 11.166 18.4797C11.1125 18.3898 11.0842 18.2872 11.084 18.1825V18.1814Z" fill="currentColor" />
                  <path d="M1.16602 14.0001C1.16602 6.91258 6.91185 1.16675 13.9993 1.16675C21.0868 1.16675 26.8327 6.91258 26.8327 14.0001C26.8327 21.0876 21.0868 26.8334 13.9993 26.8334C6.91185 26.8334 1.16602 21.0876 1.16602 14.0001ZM13.9993 2.91675C11.0599 2.91675 8.24078 4.08445 6.16225 6.16298C4.08372 8.24151 2.91602 11.0606 2.91602 14.0001C2.91602 16.9396 4.08372 19.7587 6.16225 21.8372C8.24078 23.9157 11.0599 25.0834 13.9993 25.0834C16.9388 25.0834 19.7579 23.9157 21.8364 21.8372C23.915 19.7587 25.0827 16.9396 25.0827 14.0001C25.0827 11.0606 23.915 8.24151 21.8364 6.16298C19.7579 4.08445 16.9388 2.91675 13.9993 2.91675Z" fill="currentColor" />
                </svg>
              </button>
            )}

            {/* Wishlist - Top Right */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const handleWishlistToggle = async () => {
                  setIsWishlistAnimating(true);
                  try {
                    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : "";
                    const thumbnailImage = galleryImages?.[0]?.url || product.image?.url || "";
                    const commonTrackingData = getStandardWishlistPayload(product, currentVariant, currentOrigin, thumbnailImage);
                    if (isWishlisted) {
                      if (user?.id) await dispatch(removeWishlistItem(productId)).unwrap();
                      else dispatch(removeGuestWishlistItem(productId));
                      pushRemoveFromWishlist(commonTrackingData); toast.error("Removed from wishlist", { icon: <Check className="w-4 h-4" /> });
                    } else {
                      const payload = { productId, productHandle, title: product.title, image: thumbnailImage, price: displayPrice, comparePrice: displayComparePrice || "", reviews: product.reviews || null, hasVideo: Boolean(videoMedia), hasSimilar: Boolean(product.handle), variantId: String(getNumericId(currentVariant?.id || currentVariant?.shopifyId)), size: currentVariant?.size || "", color: currentVariant?.color || currentVariant?.title || "" };
                      if (user?.id) await dispatch(addWishlistItem(payload)).unwrap();
                      else {
                        dispatch(addGuestWishlistItem(payload));
                        dispatch(openAuthModal());
                      }
                      pushAddToWishlist(commonTrackingData); toast.success("Saved to wishlist");
                    }
                  } catch (err) { toast.error(err.message || "Wishlist update failed"); } finally { setTimeout(() => setIsWishlistAnimating(false), 250); }
                };
                handleWishlistToggle();
              }}
              className={`absolute top-0 right-1 lg:top-2 lg:right-4 z-10 px-1.5 py-1 lg:p-1.5 transition-transform duration-200 cursor-pointer ${isWishlistAnimating ? "scale-110" : ""}`}
            >
              <Heart fill={isWishlisted ? "currentColor" : "none"} className={`${isWishlisted ? "text-rose-500" : "text-black"} stroke-[1.5px] w-5 h-5 lg:w-6 lg:h-6`} />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  ref={prevImageBtnRef}
                  type="button"
                  className={`custom-prev-${swiperId} absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/85 text-black shadow-md opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  ref={nextImageBtnRef}
                  type="button"
                  className={`custom-next-${swiperId} absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/85 text-black shadow-md opacity-0 group-hover/card:opacity-100 transition-opacity cursor-pointer`}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex flex-row items-center justify-between gap-2">
              {baseColors.length > 0 && (
                <div className="flex gap-3 lg:gap-4 items-center">
                  {baseColors.map((base) => {
                    const isActive = base === activeBase;
                    return (
                      <button key={`${product.shopifyId}-${base}`} type="button" title={base} onClick={() => setActiveBase(base)} className={`rounded-full transition-all hover:scale-110 cursor-pointer ${isActive ? "ring-1 ring-black ring-offset-[1.5px] lg:ring-offset-2 ring-offset-white w-[18px] h-[18px] lg:w-[20px] lg:h-[20px]" : "w-[22px] h-[22px] lg:w-[24px] lg:h-[24px]"}`} style={{ background: colorMap[base] }} />
                    );
                  })}
                </div>
              )}

              {/* Rating Section */}
              {(() => {
                const reviews = reviewStats;
                const count = reviews?.count || 0;
                if (count > 0) {
                  const average = reviews.average || 0;
                  return (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {singleStarRating || isMobile ? <Star size={12} fill="currentColor" /> :
                          [...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < Math.floor(average) ? "currentColor" : "none"} className={i < Math.floor(average) ? "" : "text-zinc-200"} />)
                        }
                      </div>
                      <span className="text-sm font-semibold text-black mt-0.5">{Number(average).toFixed(1)}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 font-figtree">
              <p className="text-base lg:text-xl font-bold">₹{formatPrice(displayPrice)}</p>
              {displayComparePrice > displayPrice && <p className="text-[14px] lg:text-base text-[#909090] line-through">₹{formatPrice(displayComparePrice)}</p>}
              {displayComparePrice > displayPrice && discountPercent > 0 && <span className="hidden lg:inline-block bg-[#EFE5DE] text-black px-2 py-0.5 rounded-full text-sm font-semibold font-figtree leading-[1.6] tracking-normal uppercase">{discountPercent}% OFF</span>}
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <Link href={`/products/${product.handle}`} prefetch={false} onClick={handleProductClick} className="cursor-pointer">
                <h3 className="text-[14px] lg:text-base font-figtree font-[450] leading-[1.6] tracking-normal hover:underline underline-offset-4 hover:text-gray-900 transition-colors line-clamp-1 min-h-5">{product.title}</h3>
              </Link>
              <div className="flex flex-col justify-center items-start gap-2">
                {(() => {
                  const variantMeta = currentVariant?.metafields;
                  const prodMeta = product.productMetafields;
                  const ornaverseComp = parseOrnaverseComponent(variantMeta?.components || prodMeta?.components);
                  const firstDiamond = ornaverseComp?.components?.find(c => (c.item_group_name === "Diamond" || (c.quality_code && c.quality_code !== "NA")) && (parseFloat(c.weight) > 0 || parseInt(c.pieces) > 0));
                  const variantDiamonds = variantMeta?.diamonds?.filter(d => parseFloat(d.weight) > 0 || parseInt(d.pieces) > 0) || [];
                  const parts = [];
                  if (!!firstDiamond || variantDiamonds.length > 0) {
                    const quality = (firstDiamond?.quality_code && firstDiamond?.stone_color_code && firstDiamond.quality_code !== "NA" && firstDiamond.stone_color_code !== "NA") ? `${firstDiamond.quality_code}, ${firstDiamond.stone_color_code}` : (firstDiamond?.purity || variantDiamonds[0]?.quality || prodMeta?.quality);
                    const totalWeight = variantDiamonds.length > 0 ? variantDiamonds.reduce((sum, d) => sum + parseFloat(d.weight || 0), 0) : 0;
                    const carat = totalWeight > 0 ? `${Number(totalWeight.toFixed(3))}ct` : (firstDiamond?.weight ? `${firstDiamond.weight}ct` : prodMeta?.carat_range);
                    if (quality && quality !== "NA") parts.push(quality);
                    if (carat && carat !== "NA" && !String(carat).startsWith("0ct")) parts.push(carat);
                  }
                  if (parts.length === 0) { const metalPurity = variantMeta?.metal_purity; if (metalPurity) parts.push(metalPurity); }
                  const weightVal = variantMeta?.metal_weight || prodMeta?.weight;
                  const weight = weightVal ? `${weightVal}${String(weightVal).toLowerCase().includes('g') ? '' : 'g'}` : null;
                  if (weight) parts.push(weight);
                  if (parts.length === 0) return null;
                  return <p className="font-figtree text-[12px] lg:text-sm font-light lg:font-medium text-black lg:text-gray-500 leading-[1.4] tracking-normal mt-0.5">{parts.join(" · ")}</p>;
                })()}
              </div>
            </div>

            {productOffers.length > 0 && (
              <div className="inline-flex items-center gap-1.5 text-[#108548] bg-[#F0F9F4] rounded-full px-1.5 lg:px-3 py-1 mt-1 w-fit">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 lg:w-5 lg:h-5 shrink-0">
                  <path d="M8.7583 3.05392C8.91463 2.87933 9.10601 2.73967 9.31996 2.64406C9.53391 2.54844 9.76563 2.49902 9.99997 2.49902C10.2343 2.49902 10.466 2.54844 10.68 2.64406C10.8939 2.73967 11.0853 2.87933 11.2416 3.05392L11.825 3.70558C11.9917 3.89183 12.1982 4.03819 12.4291 4.13383C12.6601 4.22947 12.9096 4.27193 13.1591 4.25808L14.0341 4.20975C14.2682 4.19685 14.5023 4.23346 14.7212 4.31718C14.9402 4.40091 15.139 4.52988 15.3047 4.69566C15.4704 4.86144 15.5992 5.0603 15.6829 5.27927C15.7665 5.49824 15.803 5.73238 15.79 5.96642L15.7416 6.84058C15.7279 7.09003 15.7704 7.33936 15.8661 7.57016C15.9617 7.80095 16.108 8.00729 16.2941 8.17392L16.9458 8.75725C17.1205 8.91358 17.2603 9.10501 17.356 9.31904C17.4517 9.53307 17.5012 9.76488 17.5012 9.99933C17.5012 10.2338 17.4517 10.4656 17.356 10.6796C17.2603 10.8937 17.1205 11.0851 16.9458 11.2414L16.2941 11.8247C16.1079 11.9915 15.9615 12.1979 15.8659 12.4289C15.7703 12.6598 15.7278 12.9093 15.7416 13.1589L15.79 14.0339C15.8029 14.268 15.7663 14.5021 15.6825 14.721C15.5988 14.9399 15.4698 15.1387 15.3041 15.3044C15.1383 15.4701 14.9394 15.599 14.7204 15.6826C14.5015 15.7663 14.2673 15.8028 14.0333 15.7898L13.1591 15.7414C12.9097 15.7277 12.6604 15.7702 12.4296 15.8659C12.1988 15.9615 11.9924 16.1078 11.8258 16.2939L11.2425 16.9456C11.0861 17.1203 10.8947 17.2601 10.6807 17.3558C10.4666 17.4515 10.2348 17.5009 10.0004 17.5009C9.76594 17.5009 9.53412 17.4515 9.32009 17.3558C9.10606 17.2601 8.91463 17.1203 8.7583 16.9456L8.17497 16.2939C8.00825 16.1077 7.80178 15.9613 7.57083 15.8657C7.33989 15.77 7.09038 15.7276 6.8408 15.7414L5.9658 15.7898C5.73177 15.8027 5.49764 15.766 5.27871 15.6823C5.05978 15.5986 4.86098 15.4696 4.69528 15.3038C4.52957 15.1381 4.4007 14.9392 4.31708 14.7202C4.23346 14.5013 4.19696 14.2671 4.20997 14.0331L4.2583 13.1589C4.27203 12.9095 4.2295 12.6601 4.13387 12.4293C4.03823 12.1986 3.89194 11.9922 3.7058 11.8256L3.05414 11.2422C2.87941 11.0859 2.73964 10.8945 2.64394 10.6805C2.54824 10.4664 2.49878 10.2346 2.49878 10.0002C2.49878 9.76572 2.54824 9.5339 2.64394 9.31987C2.73964 9.10584 2.87941 8.91441 3.05414 8.75808L3.7058 8.17475C3.89205 8.00803 4.03841 7.80156 4.13405 7.57061C4.22969 7.33966 4.27215 7.09016 4.2583 6.84058L4.20997 5.96558C4.19719 5.73161 4.23389 5.49758 4.31767 5.27875C4.40145 5.05992 4.53044 4.86122 4.6962 4.69561C4.86197 4.53 5.0608 4.40121 5.2797 4.31763C5.49861 4.23406 5.73268 4.19758 5.96664 4.21058L6.8408 4.25892C7.09025 4.27264 7.33959 4.23011 7.57038 4.13448C7.80117 4.03884 8.00751 3.89255 8.17414 3.70642L8.7583 3.05392Z" stroke="#189351" strokeWidth="1.5" />
                  <path d="M7.91675 7.91602H7.92508V7.92435H7.91675V7.91602ZM12.0834 12.0827H12.0917V12.091H12.0834V12.0827Z" stroke="#189351" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M12.5 7.5L7.5 12.5" stroke="#189351" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={currentLabelIndex % productOffers.length} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="font-figtree font-semibold text-[10px] lg:text-sm leading-[1.4] tracking-normal capitalize whitespace-nowrap block">{productOffers[currentLabelIndex % productOffers.length]}</motion.span>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-product-swiper .swiper-button-prev, .custom-product-swiper .swiper-button-next { display: none !important; }
        .custom-product-swiper .swiper-pagination-progressbar { background: rgba(0,0,0,0.05) !important; height: 2px !important; bottom: 0 !important; top: auto !important; }
        .custom-product-swiper .swiper-pagination-progressbar-fill { background: #5A413F !important; }
        @media (min-width: 1024px) { .custom-product-swiper .swiper-pagination { display: none !important; } }
      ` }} />

      <Dialog open={showVideoPopup} onOpenChange={setShowVideoPopup}>
        <DialogContent className="max-w-2xl aspect-square bg-transparent border-none p-0 overflow-hidden shadow-2xl rounded-3xl w-4/5" showCloseButton={false}>
          <DialogTitle className="sr-only">Product Video: {product.title}</DialogTitle>
          <DialogDescription className="sr-only">Video preview of the product</DialogDescription>
          <button onClick={() => setShowVideoPopup(false)} className="absolute top-4 right-4 z-[210] p-2 bg-black/50 hover:bg-black text-white rounded-full transition-all shadow-lg border border-white/10 cursor-pointer"><X size={24} /></button>
          
          <video autoPlay muted loop playsInline controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} disablePictureInPicture className="w-full h-full object-contain bg-transparent rounded-3xl" poster={formatCdnUrl(videoMedia?.preview)}>
            {videoMedia?.sources?.length > 0 ? (
              <>
                {videoMedia.sources.filter(s => s.format === 'mp4').map((source, sIdx) => <source key={sIdx} src={formatCdnUrl(source.url)} type={source.mimeType} />)}
                {videoMedia.sources.filter(s => s.format !== 'mp4').map((source, sIdx) => <source key={sIdx} src={formatCdnUrl(source.url)} type={source.mimeType} />)}
              </>
            ) : <source src={formatCdnUrl(videoMedia?.url)} type={videoMedia?.mimeType || "video/mp4"} />}
            Your browser does not support the video tag.
          </video>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-[210]">
            <Link 
              href={`/products/${product.handle}`} 
              onClick={() => setShowVideoPopup(false)}
              className="bg-white/95 backdrop-blur-sm text-black border border-gray-100 px-8 py-3.5 rounded-full font-bold text-sm tracking-wide flex items-center gap-2 hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            >
              View Details <ArrowRight size={16} />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default React.memo(ProductCard);
