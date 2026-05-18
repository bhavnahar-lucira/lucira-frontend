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
import { Star, ChevronLeft, ChevronRight, ArrowRight, Copy, X, Loader2, Play, ShieldCheck, Heart, Check } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import {
  addWishlistItem,
  removeWishlistItem,
  addGuestWishlistItem,
  removeGuestWishlistItem,
} from "@/redux/features/wishlist/wishlistSlice";
import { setCollectionContext } from "@/redux/features/user/userSlice";
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
import { pushProductClick, pushAddToWishlist, pushRemoveFromWishlist, formatGtmPrice, getNumericId, getStandardWishlistPayload } from "@/lib/gtm";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
    (v) => (v.inStock === true || v.inStock === "true") && getBaseColor(v.color || v.title) === selectedBase
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
  
  let primaryImages = [];
  if (selectedBase) {
    primaryImages = product.images?.filter((image) => 
      String(image.alt || "").toLowerCase().includes(selectedBase)
    ) || [];
  }

  if (primaryImages.length === 0 && variantColor) {
     primaryImages = product.images?.filter((image) => 
      String(image.alt || "").toLowerCase().includes(variantColor)
    ) || [];
  }

  if (primaryImages.length === 0 && variant?.image) {
      primaryImages = product.images?.filter((image) => image.url === variant.image) || [];
  }

  // If we still have nothing, or even if we have some, let's make sure we have enough for a slider
  const allImages = product.images || [];
  const finalImages = [...primaryImages];
  
  // Add other images that are not already in primaryImages
  allImages.forEach(img => {
      if (!finalImages.some(p => p.url === img.url)) {
          finalImages.push(img);
      }
  });

  if (finalImages.length > 0) return finalImages;
  
  const fallbackImage = product?.image || null;
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
    const handles = product.collectionHandles || [];
    const isStrict9kt = handles.includes("9kt-collection") &&
                       !handles.some(h => h !== "9kt-collection" && h !== "all" && h !== product.type?.toLowerCase() &&
                       ["sports-collection", "cotton-candy", "hexa-collection", "solitaire-collection"].includes(h));

    if (isStrict9kt) {
      const nineKT = variants.filter(v => String(v.color || v.title).includes("9KT"));
      if (nineKT.length > 0) {
        const inStock9KT = nineKT.find(v => v.inStock === true || v.inStock === "true");
        if (inStock9KT) return inStock9KT;
        return nineKT[0];
      }
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

const ProductCard = ({ product, fixedPrice, fixedComparePrice, collectionHandle, index, singleStarRating = false }) => {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const wishlist = useSelector((state) => state.wishlist.items);
  const guestWishlist = useSelector((state) => state.wishlist.guestItems);

  const productId = String(product.shopifyId || product.id);
  const productHandle = product.handle;

  const isWishlisted = useMemo(() => {
    if (user?.id) {
      return wishlist.some((item) => String(item.productId) === productId);
    }
    return guestWishlist.some((item) => String(item.productId) === productId);
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

  const videoMedia = useMemo(() => {
    if (product.video) return product.video;
    return product.media?.find(m => m.mediaContentType === "VIDEO" || m.mimeType?.includes("video")) || null;
  }, [product.video, product.media]);

  const currentVariant = useMemo(() => {
    return product.variants?.find((v) => getBaseColor(v.color || v.title) === activeBase) || product.variants?.[0] || null;
  }, [product.variants, activeBase]);

  const displayPrice = fixedPrice || currentVariant?.price || product.price;
  const displayComparePrice = fixedComparePrice || currentVariant?.compare_price || currentVariant?.compareAtPrice || product.compare_price || product.compareAtPrice;
  const discountPercent = useMemo(() => {
    if (!displayComparePrice || displayComparePrice <= displayPrice) return 0;
    return Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100);
  }, [displayPrice, displayComparePrice]);

  const displayLabels = useMemo(() => {
    const labels = [];
    if (product.label) labels.push(product.label);
    const tags = Array.isArray(product.tags) ? product.tags : [];
    const lowerTags = tags.map(t => String(t).toLowerCase());
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
      const interval = setInterval(() => { setCurrentLabelIndex((prev) => (prev + 1) % 2); }, 4000); 
      return () => clearInterval(interval);
    } else { setCurrentLabelIndex(0); }
  }, [displayLabels.length]);

  const galleryImages = getImagesForBase(product, activeBase);
  const swiperId = `card-swiper-${String(product.id || product.shopifyId || product.handle).replace(/[^a-zA-Z0-9]/g, "")}`;
  const swiperRef = useRef(null);
  const prevImageBtnRef = useRef(null);
  const nextImageBtnRef = useRef(null);
  const hasSimilar = (product.matchingProductIds && product.matchingProductIds.length > 0) || product.hasSimilar;

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
      const res = await fetch(`/api/products/similar?handle=${product.handle}`);
      const data = await res.json();
      setSimilarProducts(data.products || []);
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
  }, [product, currentVariant, galleryImages, displayPrice, displayComparePrice, index, collectionHandle, dispatch]);

  return (
    <>
      <div className="space-y-4">
        <div className="group/card block space-y-4">
          <div className="relative aspect-square w-full bg-[#fafafa] overflow-hidden">
            <Link href={`/products/${product.handle}`} className="block w-full h-full mix-blend-multiply" onClick={handleProductClick}>
              {galleryImages.length > 0 ? (
                <Swiper
                  spaceBetween={0}
                  loop={galleryImages.length > 1}
                  slidesPerView={1}
                  modules={[Navigation, Pagination]}
                  pagination={galleryImages.length > 1 ? { type: 'progressbar', el: `.pagination-${swiperId}` } : false}
                  navigation={{
                    prevEl: `.custom-prev-${swiperId}`,
                    nextEl: `.custom-next-${swiperId}`,
                  }}
                  onSwiper={(swiper) => { swiperRef.current = swiper; }}
                  className="w-full h-full custom-product-swiper"
                >
                  {galleryImages.map((image, idx) => (
                    <SwiperSlide key={`${image.url}-${idx}`}>
                      <div className="relative w-full h-full">
                        <LazyImage src={image.url} alt={image.alt || product.title} fill priority={idx === 0} className="object-contain grayscale-[0.2] group-hover/card:grayscale-0 transition-all duration-300" />
                      </div>
                    </SwiperSlide>
                  ))}
                  {galleryImages.length > 1 && <div className={`pagination-${swiperId} swiper-pagination bottom-0!`} />}
                </Swiper>
              ) : <div className="w-full h-full flex items-center justify-center text-zinc-400">No Image</div>}
            </Link>

            {/* Labels - Top Left */}
            {displayLabels.length > 0 && (
              <div className={`absolute top-0 lg:top-3 left-0 z-10 w-28 lg:w-28 h-6 lg:h-7 overflow-hidden bg-[#F1E4D1]`}>
                <AnimatePresence initial={false}>
                  <motion.div
                    key={displayLabels[currentLabelIndex]}
                    initial={{ y: 28 }} animate={{ y: 0 }} exit={{ y: -28 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0 text-black text-[10px] lg:text-xs font-bold px-2 lg:px-2 font-figtree uppercase tracking-wider flex items-center justify-center whitespace-nowrap"
                  >
                    {displayLabels[currentLabelIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* View Similar - Bottom Right */}
            {hasSimilar && (
              <div className="absolute bottom-4 right-2 lg:right-4 z-10">
                <Drawer open={showSimilar} onOpenChange={setShowSimilar}>
                  <DrawerTrigger asChild>
                    <button onClick={(e) => { e.preventDefault(); fetchSimilar(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300">
                      <svg width="24" height="24" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                        <path d="M11.4322 10.4118C11.4293 10.2235 11.5012 10.0417 11.6321 9.90627C11.763 9.77087 11.9422 9.69288 12.1305 9.6894L21.4657 9.52505C21.6544 9.5214 21.8368 9.59284 21.9728 9.72366C22.1088 9.85448 22.1872 10.034 22.1909 10.2226L22.4232 23.5881C22.4262 23.7767 22.3542 23.9588 22.223 24.0943C22.0917 24.2299 21.9121 24.3078 21.7234 24.3109L12.3883 24.4752C12.1998 24.4785 12.0177 24.4068 11.882 24.2759C11.7463 24.1451 11.668 23.9657 11.6645 23.7772L11.4322 10.4118Z" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11.5349 11.5293L6.05123 12.9986C5.89057 13.0417 5.75356 13.1468 5.67029 13.2908C5.58702 13.4348 5.56428 13.606 5.60707 13.7667L8.65801 25.1594C8.70135 25.3201 8.80674 25.457 8.95101 25.5401C9.09527 25.6231 9.26661 25.6455 9.42735 25.6022L13.8263 24.4235" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22.4632 11.5293L27.9468 12.9986C28.1075 13.0417 28.2445 13.1468 28.3278 13.2908C28.411 13.4348 28.4338 13.606 28.391 13.7667L25.34 25.1594C25.2967 25.3201 25.1913 25.457 25.047 25.5401C24.9028 25.6231 24.7314 25.6455 24.5707 25.6022L19.8192 24.3291" stroke="currentColor" strokeWidth="1.17241" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[90vh] h-[90vh] bg-white rounded-t-[20px] flex flex-col">
                    <div className="mx-auto w-full flex flex-col h-full overflow-hidden">
                      <DrawerHeader className="px-10 py-6 flex flex-row items-center justify-between border-b border-zinc-100 shrink-0">
                        <DrawerTitle className="text-xl font-medium text-black uppercase">VIEW SIMILAR</DrawerTitle>
                        <DrawerClose asChild><button className="text-zinc-400 hover:text-black p-1"><X size={22} /></button></DrawerClose>
                      </DrawerHeader>
                      <div className="sm:px-10 sm:py-10 px-5 py-5 overflow-y-auto flex-1">
                        {loadingSimilar ? <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-zinc-400" size={40} /><p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Searching matching designs...</p></div> :
                          similarProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12 pb-10">
                              {similarProducts.slice(0, 10).map((item) => (
                                <div key={item.id} className="space-y-4">
                                  <Link href={`/products/${item.handle}`} onClick={() => setShowSimilar(false)} className="block space-y-4 group">
                                    <div className="aspect-square relative rounded-md bg-[#F9F9F9] overflow-hidden group-hover:bg-[#f3f3f3]"><LazyImage src={item.image} alt={item.title} fill className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" /></div>
                                    <div className="space-y-2">
                                      <h4 className="text-[13px] font-normal text-zinc-900 line-clamp-1">{item.title}</h4>
                                      <div className="flex items-center gap-2"><p className="text-[14px] font-bold text-black">₹{formatPrice(item.price)}</p>{item.compare_price > item.price && <p className="text-[12px] text-zinc-400 line-through">₹{formatPrice(item.compare_price)}</p>}</div>
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
              <button onClick={(e) => { e.preventDefault(); setShowVideoPopup(true); }} className="absolute bottom-4 left-2 lg:left-4 z-10 w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-900 shadow-sm hover:bg-black hover:text-white transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M11.084 18.1814V9.81869C11.0842 9.71406 11.1125 9.6114 11.166 9.52147C11.2194 9.43155 11.2961 9.35766 11.388 9.30756C11.4798 9.25745 11.5835 9.23298 11.688 9.2367C11.7926 9.24042 11.8943 9.27219 11.9823 9.32869L18.4877 13.5089C18.57 13.5616 18.6378 13.6343 18.6847 13.7201C18.7317 13.8059 18.7563 13.9022 18.7563 14C18.7563 14.0979 18.7317 14.1941 18.6847 14.2799C18.6378 14.3658 18.57 14.4384 18.4877 14.4912L11.9823 18.6725C11.8943 18.729 11.7926 18.7608 11.688 18.7645C11.5835 18.7682 11.4798 18.7438 11.388 18.6937C11.2961 18.6436 11.2194 18.5697 11.166 18.4797C11.1125 18.3898 11.0842 18.2872 11.084 18.1825V18.1814Z" fill="currentColor"/>
                  <path d="M1.16602 14.0001C1.16602 6.91258 6.91185 1.16675 13.9993 1.16675C21.0868 1.16675 26.8327 6.91258 26.8327 14.0001C26.8327 21.0876 21.0868 26.8334 13.9993 26.8334C6.91185 26.8334 1.16602 21.0876 1.16602 14.0001ZM13.9993 2.91675C11.0599 2.91675 8.24078 4.08445 6.16225 6.16298C4.08372 8.24151 2.91602 11.0606 2.91602 14.0001C2.91602 16.9396 4.08372 19.7587 6.16225 21.8372C8.24078 23.9157 11.0599 25.0834 13.9993 25.0834C16.9388 25.0834 19.7579 23.9157 21.8364 21.8372C23.915 19.7587 25.0827 16.9396 25.0827 14.0001C25.0827 11.0606 23.915 8.24151 21.8364 6.16298C19.7579 4.08445 16.9388 2.91675 13.9993 2.91675Z" fill="currentColor"/>
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
                      const payload = { productId, productHandle, title: product.title, image: thumbnailImage, price: displayPrice, comparePrice: displayComparePrice || "", reviews: product.reviews || null, hasVideo: Boolean(videoMedia), hasSimilar: Boolean(product.handle) };
                      if (user?.id) await dispatch(addWishlistItem(payload)).unwrap();
                      else dispatch(addGuestWishlistItem(payload));
                      pushAddToWishlist(commonTrackingData); toast.success("Saved to wishlist");
                    }
                  } catch (err) { toast.error(err.message || "Wishlist update failed"); } finally { setTimeout(() => setIsWishlistAnimating(false), 250); }
                };
                handleWishlistToggle();
              }}
              className={`absolute top-0 right-1 lg:top-2 lg:right-4 z-10 px-1.5 py-1 lg:p-1.5 transition-transform duration-200 ${isWishlistAnimating ? "scale-110" : ""}`}
            >
              <Heart fill={isWishlisted ? "currentColor" : "none"} className={`${isWishlisted ? "text-rose-500 w-5 lg:w-6" : "text-black"} stroke-[1.5px] w-5 lg:w-6`} />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button 
                    ref={prevImageBtnRef} 
                    type="button" 
                    className={`custom-prev-${swiperId} absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/85 text-black shadow-md opacity-0 group-hover/card:opacity-100 transition-opacity`}
                >
                    <ChevronLeft size={18} />
                </button>
                <button 
                    ref={nextImageBtnRef} 
                    type="button" 
                    className={`custom-next-${swiperId} absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/85 text-black shadow-md opacity-0 group-hover/card:opacity-100 transition-opacity`}
                >
                    <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex flex-row items-center justify-between gap-2">
              {baseColors.length > 0 && (
                  <div className="flex gap-3">
                    {baseColors.map((base) => {
                      const isActive = base === activeBase;
                      return (
                        <button key={`${product.shopifyId}-${base}`} type="button" title={base} onClick={() => setActiveBase(base)} className={`w-5 h-5 lg:w-7 lg:h-7 rounded-full border transition-all flex items-center justify-center hover:scale-110 ${isActive ? "border-black" : "border-transparent"}`}>
                          <span className="w-full h-full rounded-full" style={{ background: colorMap[base] }} />
                        </button>
                      );
                    })}
                  </div>
              )}

              {/* Rating Section */}
              {(() => {
                const reviews = product.reviews || product.reviewStats;
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
                      <span className="text-sm font-semibold text-black mt-0.5">({count})</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 font-figtree">
              <p className="text-base lg:text-xl font-bold">₹{formatPrice(displayPrice)}</p>
              {displayComparePrice > displayPrice && <p className="text-[14px] lg:text-base text-gray-400 line-through">₹{formatPrice(displayComparePrice)}</p>}
              {displayComparePrice > displayPrice && discountPercent > 0 && <span className="hidden lg:inline-block bg-[#F2F2F2] text-black px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{discountPercent}% OFF</span>}
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <Link href={`/products/${product.handle}`} onClick={handleProductClick}>
                <h3 className="text-sm font-figtree font-semibold hover:underline underline-offset-4 leading-snug hover:text-gray-900 transition-colors line-clamp-1 min-h-5">{product.title}</h3>
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
                    const carat = variantDiamonds[0]?.weight ? `${variantDiamonds[0].weight}ct` : (firstDiamond?.weight ? `${firstDiamond.weight}ct` : prodMeta?.carat_range);
                    if (quality && quality !== "NA") parts.push(quality);
                    if (carat && carat !== "NA" && !String(carat).startsWith("0ct")) parts.push(carat);
                  }
                  if (parts.length === 0) { const metalPurity = variantMeta?.metal_purity; if (metalPurity) parts.push(metalPurity); }
                  const weightVal = variantMeta?.metal_weight || prodMeta?.weight;
                  const weight = weightVal ? `${weightVal}${String(weightVal).toLowerCase().includes('g') ? '' : 'g'}` : null;
                  if (weight) parts.push(weight);
                  if (parts.length === 0) return null;
                  return <p className="font-figtree text-[10px] lg:text-xs font-medium text-gray-500 uppercase tracking-tight">{parts.join(" · ")}</p>;
                })()}
              </div>
            </div>

            {(() => {
              const offers = [];
              if (product.diamondDiscount > 0) offers.push(`${product.diamondDiscount}% OFF on Diamonds`);
              if (product.makingDiscount > 0) offers.push(`${product.makingDiscount}% OFF on Making Charges`);
              if (offers.length === 0) return null;
              return (
                <div className="inline-flex items-center gap-1.5 text-[#108548] bg-[#F0F9F4] rounded-full px-1.5 lg:px-3 py-1 mt-1 w-fit">
                  <ShieldCheck size={12} />
                  <div className="overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={currentLabelIndex % offers.length} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="text-[8px] lg:text-[10px] font-bold uppercase tracking-tight whitespace-nowrap block">{offers[currentLabelIndex % offers.length]}</motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-product-swiper .swiper-button-prev, .custom-product-swiper .swiper-button-next { display: none !important; }
        .custom-product-swiper .swiper-pagination-progressbar { background: rgba(0,0,0,0.05) !important; height: 2px !important; bottom: 0 !important; top: auto !important; }
        .custom-product-swiper .swiper-pagination-progressbar-fill { background: #5A413F !important; }
        @media (min-width: 1024px) { .custom-product-swiper .swiper-pagination { display: none !important; } }
      ` }} />

      <Dialog open={showVideoPopup} onOpenChange={setShowVideoPopup}>
        <DialogContent className="max-w-2xl aspect-square bg-black border-none p-0 overflow-hidden shadow-2xl rounded-3xl w-4/5" showCloseButton={false}>
          <DialogTitle className="sr-only">Product Video: {product.title}</DialogTitle>
          <DialogDescription className="sr-only">Video preview of the product</DialogDescription>
          <button onClick={() => setShowVideoPopup(false)} className="absolute top-4 right-4 z-[210] p-2 bg-black/50 hover:bg-black text-white rounded-full transition-all shadow-lg border border-white/10"><X size={24} /></button>
          <video autoPlay muted loop playsInline controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} disablePictureInPicture className="w-full h-full object-contain" poster={videoMedia?.preview}>
            {videoMedia?.sources?.length > 0 ? (
              <>
                {videoMedia.sources.filter(s => s.format === 'mp4').map((source, sIdx) => <source key={sIdx} src={source.url} type={source.mimeType} />)}
                {videoMedia.sources.filter(s => s.format !== 'mp4').map((source, sIdx) => <source key={sIdx} src={source.url} type={source.mimeType} />)}
              </>
            ) : <source src={videoMedia?.url} type={videoMedia?.mimeType || "video/mp4"} />}
            Your browser does not support the video tag.
          </video>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default React.memo(ProductCard);
