"use client";

import Image from "next/image";
import Link from "next/link";
import shopifyLoader from "@/utils/shopifyLoader";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateCartItem, removeMultipleFromCart } from "@/redux/features/cart/cartSlice";
import {
  addWishlistItem,
  removeWishlistItem,
} from "@/redux/features/wishlist/wishlistSlice";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { pushRemoveFromCart, pushAddToWishlist, pushPromoClick, getNumericId, getStandardWishlistPayload } from "@/lib/gtm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2, X, ChevronDown, Store, ChevronRight, Check, Video, Truck } from "lucide-react";
import SocialProofBand from "@/components/common/SocialProofBand";
import { formatMetal, realSize, sizeLabelFor, formatSizeLabel } from "@/lib/metal";
import { apiFetch } from "@/lib/api";
import { getEstimatedDispatchDate } from "@/lib/utils";

const SILVER_PENDANT_VARIANT_ID = "gid://shopify/ProductVariant/48052809498842";
const PENDANT_5K_VARIANT_ID = "gid://shopify/ProductVariant/48335367602394";
const isPendantVariant = (id) => id === SILVER_PENDANT_VARIANT_ID || id === PENDANT_5K_VARIANT_ID;

// The payment page rebuilds the free pendant from this flag rather than from the cart line,
// so removing the line here has to clear it too or the gift reappears at checkout.
function clearSilverPendantClaim() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isSilverPendantClaimed");
  }
}

// Rotation, icons, colours and labels live in the shared band
// ("@/components/common/SocialProofBand") so the cart and the product page stay in sync.

export default function CartItem({ item, onAuthRequired, socialProof }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { items: allCartItems } = useSelector((state) => state.cart);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [movingToWishlist, setMovingToWishlist] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const truncateWords = (str, limit = 6) => {
    if (!str) return '';
    const words = str.split(' ');
    if (words.length > limit) return words.slice(0, limit).join(' ') + '...';
    return str;
  };

  const displayTitle = truncateWords(item?.title || "", 6);

  if (!item) return null;

  const isBYJ = item.properties?.['_byj_preview'];
  const byjCharms = useMemo(() => {
    if (!item.properties?.['_byj_charms_json']) return [];
    try {
      return JSON.parse(item.properties['_byj_charms_json']);
    } catch (e) {
      return [];
    }
  }, [item.properties]);

  const productId = item.id || item.productId || item.handle || item.shopifyId;
  const isWishlisted = useMemo(() => {
    if (!productId) return false;
    const normProductId = String(getNumericId(productId));
    const findFn = (item) => String(getNumericId(item.productId)) === normProductId;

    if (user?.id) {
      return wishlistItems.some(findFn);
    }
    const guestItems = JSON.parse(localStorage.getItem("lucira_guest_wishlist") || "[]");
    return guestItems.some(findFn);
  }, [user?.id, wishlistItems, productId]);

  const variantOptions = Array.isArray(item.variantOptions) ? item.variantOptions : [];
  const currentVariant = useMemo(() => {
    if (variantOptions.length === 0) return null;

    // 1. Try finding by exact variantId
    const byId = variantOptions.find((v) => v.variantId === item.variantId);
    if (byId) return byId;

    // 2. Fallback to size + color matching with normalization
    const normalize = (s) => String(s || "").toLowerCase().replace(/kt/g, "k").trim();
    const itemSize = String(item.size || "");
    const itemKarat = normalize(item.karat || "");
    const itemColor = normalize(item.color || "");
    const itemColorFull = normalize(`${item.karat} ${item.color}`);

    return variantOptions.find((v) => {
      const vSize = String(v.size || "");
      const vColor = normalize(v.color || v.variantTitle || "");

      const sizeMatch = vSize === itemSize;
      const colorMatch = vColor === itemColor || vColor === itemColorFull;

      return sizeMatch && colorMatch;
    });
  }, [variantOptions, item.variantId, item.size, item.color, item.karat]);

  const isInStock = currentVariant?.inStock ?? item.inStock ?? true;

  const sizeOptions = useMemo(() => {
    if (variantOptions.length > 0) return variantOptions;

    const sizes = item.availableSizes || [];
    if (sizes.length > 0) {
      return sizes.map(s => ({ size: String(s), variantId: null }));
    }

    if (item.size) {
      return [{ size: String(item.size), variantId: item.variantId }];
    }

    return [];
  }, [variantOptions, item.availableSizes, item.size, item.variantId]);

  const canEditSize = !isInStock && sizeOptions.length > 1;
  const canEditQuantity = !isInStock && !item.isFreeGift;

  const byjStylePrice = isBYJ ? parseFloat(item.properties?.['_byj_style_price'] || 0) / 100 : 0;
  const byjCharmsPrice = isBYJ ? byjCharms.reduce((acc, c) => acc + (parseFloat(c.price || 0) * (c.qty || 1)), 0) / 100 : 0;
  
  // For BYJ items, the unit price displayed should be the total of style + all charms
  const baseUnitPrice = isBYJ ? (byjStylePrice + byjCharmsPrice) : (item.price || 0);
  const lineAmount = baseUnitPrice * (item.quantity || 1);
  const isSilverPendant = isPendantVariant(item.variantId) || item.variantId === "48052809498842" || String(item.title).toLowerCase().includes("silver pendant") || String(item.title).toLowerCase().includes("diamond pendant");
  // Narrower than the display check above — only the gift variant should touch the claim flag.
  const isFreeSilverPendant = isPendantVariant(item.variantId) || item.variantId === "48052809498842";
  const [fetchedPendantPrice, setFetchedPendantPrice] = useState(0);

  useEffect(() => {
    if (isSilverPendant && (!Number(item.comparePrice) && !Number(item.originalPrice))) {
      apiFetch(`/api/products/pricing?variantId=${item.variantId.split('/').pop()}`, { suppressErrorLog: true })
        .then(data => {
          if (data?.price || data?.compare_price) {
            setFetchedPendantPrice(Number(data.price || data.compare_price));
          }
        })
        .catch(() => {});
    }
  }, [isSilverPendant, item.comparePrice, item.originalPrice]);

  const effectiveComparePrice = isSilverPendant ? (Number(item.comparePrice) || Number(item.originalPrice) || fetchedPendantPrice || 0) : (Number(item.comparePrice) || 0);
  const lineCompareAmount = effectiveComparePrice * (item.quantity || 1);
  const hasDiscount = lineCompareAmount > lineAmount;

  const statusLabel = (isInStock && !isBYJ) ? "In Stock" : "Made to Order";
  const statusClass = (isInStock && !isBYJ) ? "text-[#189351]" : "text-[#AF7C3E]";
  // Same shared calculator the PDP and shipping-page summary use, so the date here never drifts from either.
  const dispatchMessage = getEstimatedDispatchDate(isInStock && !isBYJ, item.leadTime);
  const dispatchBgClass = (isInStock && !isBYJ) ? "bg-[#189351]/10" : "bg-[#AF7C3E]/10";

  const displayImage = isBYJ ? item.properties['_byj_preview'] : (currentVariant?.image || item.image);
  const isShopifyImage = !isBYJ && displayImage && (String(displayImage).includes("cdn.shopify.com") || String(displayImage).includes("myshopify.com"));

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const getNumericId = (gid) => {
        if (!gid) return 0;
        if (typeof gid === 'number') return gid;
        const match = String(gid).match(/\d+$/);
        return match ? Number(match[0]) : 0;
      };

      const lowerTitle = (item.title || "").toLowerCase();
      let categoryFallback = item.type || (
        lowerTitle.includes("ring") ? "Rings" :
          (lowerTitle.includes("earring") || lowerTitle.includes("bali")) ? "Earrings" :
            lowerTitle.includes("pendant") ? "Pendants" :
              lowerTitle.includes("bracelet") ? "Bracelets" : ""
      );

      const resolvedSku = item.sku || currentVariant?.sku || item.variantSku || item.item_sku || (variantOptions && variantOptions[0]?.sku) || "";

      pushRemoveFromCart({
        productId: String(getNumericId(item.productId || item.shopifyId || item.id)),
        sku: resolvedSku,
        variantId: String(getNumericId(item.variantId)),
        productName: item.title,
        productType: categoryFallback,
        category: categoryFallback,
        sub_category: item.variantTitle || "",
        price: String(item.price || 0),
        offerPrice: String(item.comparePrice || item.price || 0),
        quantity: String(item.quantity || 1),
        thumbnail_image: item.image
      });

      // If it's a BYJ item, we should remove all linked items too
      if (isBYJ) {
        const groupId = item.properties?.['_byj_group_id'];
        if (groupId) {
          const linkedItems = allCartItems.filter(i => 
            i.properties?.['_byj_group_id'] === groupId && i.lineId !== item.lineId
          );
          
          if (linkedItems.length > 0) {
            const lineIds = [item.lineId, ...linkedItems.map(i => i.lineId)].filter(Boolean);
            const variantIds = [item.variantId, ...linkedItems.map(i => i.variantId)].filter(Boolean);
            
            await dispatch(removeMultipleFromCart({ 
              userId: user?.id, 
              lineIds, 
              variantIds 
            })).unwrap();
            
            toast.error("Removed from cart", {
              icon: <Check className="w-4 h-4" />
            });
            return;
          }
        }
      }

      if (isFreeSilverPendant) clearSilverPendantClaim();

      await dispatch(removeFromCart({ userId: user?.id, lineId: item.lineId || item.variantId })).unwrap();
      toast.error("Removed from cart", {
        icon: <Check className="w-4 h-4" />
      });
    } catch (err) {
      console.error("Remove failed:", err);
      toast.error("Failed to remove item");
    } finally {
      setRemoving(false);
    }
  };

  const handleMoveToWishlist = async () => {
    if (!isAuthenticated) {
      localStorage.setItem("pending_wishlist_move", item.variantId);
      toast.info("Please login to move items to wishlist");
      onAuthRequired?.();
      return;
    }

    setMovingToWishlist(true);
    try {
      if (!isWishlisted) {
        const payload = {
          productId: productId,
          variantId: item.variantId || "",
          variantTitle: item.variantTitle || "",
          size: item.size || "",
          color: item.color || "",
          karat: item.karat || "",
          productHandle: item.handle || "",
          title: item.title,
          sku: item.sku || "",
          image: displayImage || item.image || "",
          price: item.price,
          comparePrice: item.comparePrice || "",
          reviews: item.reviews || null,
          hasVideo: Boolean(item.hasVideo),
          hasSimilar: Boolean(item.handle),
        };
        await dispatch(addWishlistItem(payload)).unwrap();
      }

      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : "";

      const lowerTitle = (item.title || "").toLowerCase();
      const productTypeFallback = item.type || (
        lowerTitle.includes("ring") ? "Rings" :
          (lowerTitle.includes("earring") || lowerTitle.includes("bali")) ? "Earrings" :
            lowerTitle.includes("pendant") ? "Pendants" :
              lowerTitle.includes("bracelet") ? "Bracelets" : ""
      );

      const resolvedSku = item.sku || currentVariant?.sku || item.variantSku || item.item_sku || (variantOptions && variantOptions[0]?.sku) || "";

      const mockProduct = {
        shopifyId: item.productId || item.shopifyId || item.id,
        title: item.title,
        handle: item.handle,
        category: item.category || productTypeFallback,
        type: item.type || productTypeFallback,
        price: item.price,
        sku: resolvedSku
      };
      const mockVariant = {
        sku: resolvedSku,
        id: item.variantId,
        price: item.price
      };

      const commonTrackingData = getStandardWishlistPayload(mockProduct, mockVariant, currentOrigin, item.image);
      pushAddToWishlist(commonTrackingData);

      if (isFreeSilverPendant) clearSilverPendantClaim();

      await dispatch(removeFromCart({ userId: user?.id, lineId: item.lineId || item.variantId })).unwrap();
      toast.success("Moved to wishlist", {
        icon: <Check className="w-4 h-4" />
      });
    } catch (err) {
      console.error("Move to wishlist failed:", err);
      toast.error(err.message || "Failed to move to wishlist");
    } finally {
      setMovingToWishlist(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const pendingMoveId = localStorage.getItem("pending_wishlist_move");
      if (pendingMoveId === item.variantId) {
        localStorage.removeItem("pending_wishlist_move");
        handleMoveToWishlist();
      }
    }
  }, [isAuthenticated, item.variantId]);

  const handleUpdate = async (type, value) => {
    setUpdating(true);
    try {
      const payload = {
        userId: user?.id,
        currentVariantId: item.variantId,
      };

      if (type === "size") {
        const selectedVariant = variantOptions.find(
          (variant) => String(variant.size) === String(value)
        );

        if (selectedVariant) {
          payload.nextVariantId = selectedVariant.variantId;
          payload.size = selectedVariant.size;
          payload.price = selectedVariant.price;
          payload.finalPrice = selectedVariant.price;
          payload.variantTitle = selectedVariant.variantTitle;
          payload.inStock = selectedVariant.inStock;
          payload.sku = selectedVariant.sku || "";

          if (selectedVariant.goldWeight) payload.goldWeight = selectedVariant.goldWeight;
          if (selectedVariant.diamondTotalPcs) payload.diamondTotalPcs = selectedVariant.diamondTotalPcs;
          if (selectedVariant.diamondCarat) payload.diamondCarat = selectedVariant.diamondCarat;
        } else {
          // Fallback if variantOptions is incomplete
          payload.size = String(value);
          // If we don't have the variantId, we'll let the backend try to find it or keep the current one
          // This prevents the "Selected size is unavailable" crash
        }
      } else {
        payload.quantity = parseInt(value, 10);
      }
      await dispatch(updateCartItem(payload)).unwrap();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update cart");
    } finally {
      setUpdating(false);
    }
  };

  const sizeLabel = sizeLabelFor(item.title);
  // Pendants/studs have no size option — their variant option is the metal itself
  // ("9KT Yellow Gold"), which belongs in the Metal row, not a Size row.
  const displaySize = formatSizeLabel(realSize(item.size));

  const variantIdForUrl = item.variantId ? String(item.variantId).split('/').pop() : "";
  const productLink = item.handle ? `/products/${item.handle}${variantIdForUrl ? `?variant=${variantIdForUrl}` : ""}` : "#";

  // Subtitle for the remove/move-to-wishlist modal — mirrors the category fallback used for GTM events.
  const modalCategory = useMemo(() => {
    const lowerTitle = (item.title || "").toLowerCase();
    return item.type || (
      (lowerTitle.includes("earring") || lowerTitle.includes("bali")) ? "Earrings" :
        lowerTitle.includes("ring") ? "Rings" :
          lowerTitle.includes("pendant") ? "Pendants" :
            lowerTitle.includes("bracelet") ? "Bracelets" : formatMetal(item.karat, item.color)
    );
  }, [item.title, item.type, item.karat, item.color]);

  return (
    <>
      {/* SINGLE RESPONSIVE DESIGN */}
      <div className="mb-4 lg:mb-6 overflow-hidden rounded-card bg-white">
        <div className="relative">
          {updating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          <button 
            onClick={() => setShowRemoveModal(true)}
            className="absolute top-0 right-0 z-10 shrink-0 flex items-center justify-center w-[22px] h-[22px] lg:w-[28px] lg:h-[28px] rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>

          <div className="flex gap-4 lg:gap-6 items-center">
            {/* Image Container */}
            <div className="relative aspect-square w-32 lg:w-[140px] shrink-0 overflow-hidden rounded-card bg-[#FAFAFA] border-0">
              <Link prefetch={false} href={productLink} className="block h-full w-full p-2">
                <Image
                  loader={isShopifyImage ? shopifyLoader : undefined}
                  src={displayImage || "/images/product/1.jpg"}
                  alt={item.title}
                  width={200}
                  height={200}
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              </Link>
              <span className={`absolute top-1.5 left-1.5 lg:top-2 lg:left-2 z-10 rounded bg-white border-0 lg:border-0 px-1.5 py-0.5 lg:px-2 lg:py-1 font-figtree font-bold text-[0.5rem] lg:text-[0.7rem] leading-none tracking-[0px] lg:tracking-[0.4px] uppercase ${statusClass}`}>
                {statusLabel}
              </span>
              {!isFreeSilverPendant && !isBYJ && <SocialProofBand socialProof={socialProof} variant="cartCompact" className="absolute inset-x-0 mx-auto bottom-[9px] z-10" />}
            </div>

            {/* Info Content */}
            <div className="flex-1 space-y-1 lg:space-y-1.5 min-w-0 lg:pt-1">
              <div className="flex items-center gap-2 lg:gap-4 mb-[8px] lg:mb-[6px]">
                <Link prefetch={false} href={productLink} className="block flex-1 min-w-0 pr-8 lg:pr-10" title={item.title}>
                  <h3 className="font-figtree font-medium text-[0.875rem] lg:text-[1rem] leading-none tracking-[0px] text-black truncate hover:text-primary transition-colors lg:mb-2">
                    {displayTitle}
                  </h3>
                </Link>
              </div>
              <div className="flex items-center gap-1.5 lg:gap-2.5 flex-wrap mb-2.5 lg:mb-3.5">
                <span className="font-figtree font-semibold text-[0.875rem] lg:text-[1.2rem] leading-none tracking-[0px] text-zinc-900">
                  ₹ {lineAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
                {hasDiscount && (
                  <span className="font-figtree font-normal text-[0.875rem] lg:text-[0.9375rem] leading-none tracking-[0px] text-zinc-400 line-through">
                    ₹ {lineCompareAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
              <p className="font-figtree font-medium text-[0.625rem] lg:text-[0.8125rem] leading-none tracking-[0px] text-[#909090] uppercase my-3 lg:my-3.5">
                SKU: {currentVariant?.sku || item.sku || "N/A"}
              </p>
              {item.engraving && (
                <p className="font-figtree font-medium text-[0.625rem] lg:text-[0.8125rem] uppercase tracking-wider lg:tracking-[0px] leading-none text-primary mt-1 lg:mb-2">
                  Engraving: &quot;{item.engraving}&quot;
                </p>
              )}
              <p className="font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-black capitalize mb-1.5 lg:mb-2.5">
                Metal: <span className="font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-black">
                  {formatMetal(item.karat, item.color)}
                  {item.goldWeight ? <span className="hidden lg:inline">, {item.goldWeight} gram</span> : ''}
                </span>
              </p>

              {/* Selectors */}
              <div className="flex items-center gap-3 lg:gap-5 pt-1 lg:pt-2 flex-wrap">
                {displaySize && (
                  <div className="flex items-center gap-0.5 lg:gap-1.5">
                    <span className="font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-zinc-800">
                      Size:
                    </span>
                    {canEditSize ? (
                      <Select
                        value={String(item.size)}
                        onValueChange={(val) => handleUpdate("size", val)}
                        disabled={updating}
                      >
                        <SelectTrigger className="!h-auto border-none bg-transparent p-0 font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-zinc-800 shadow-none focus:ring-0 gap-0.5 lg:gap-1 min-w-0 w-auto">
                          <SelectValue placeholder={formatSizeLabel(item.size)} />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((variant) => (
                            <SelectItem key={variant.variantId || variant.size} value={String(variant.size)}>
                              {formatSizeLabel(variant.size)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-zinc-800">{displaySize}</span>
                    )}
                  </div>
                )}

                {displaySize && <div className="h-3 lg:h-3.5 w-px bg-zinc-200 lg:bg-zinc-300" />}

                <div className="flex items-center gap-0.5 lg:gap-1.5">
                  <span className="font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-zinc-800">Quantity:</span>
                  {canEditQuantity ? (
                    <Select
                      value={String(item.quantity)}
                      onValueChange={(val) => handleUpdate("quantity", val)}
                      disabled={updating}
                    >
                      <SelectTrigger className="!h-auto border-none bg-transparent p-0 font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-zinc-800 shadow-none focus:ring-0 gap-0.5 lg:gap-1 min-w-0 w-auto">
                        <SelectValue placeholder={item.quantity} />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-figtree font-medium text-[0.75rem] lg:text-[0.875rem] leading-none tracking-[0px] text-zinc-800">{item.quantity}</span>
                  )}
                </div>
              </div>

              {isBYJ && (
                <button 
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center gap-1 text-[0.6875rem] lg:text-[0.75rem] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors mt-2 lg:mt-4"
                >
                  {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
                  <ChevronDown size={14} className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>

          <div className={`mt-3 lg:mt-5 flex items-center gap-2 lg:gap-2.5 rounded-[4px] px-3 py-2 lg:px-3.5 lg:py-2.5 ${dispatchBgClass}`}>
            <Truck className={`shrink-0 w-[13px] h-[13px] lg:w-[16px] lg:h-[16px] ${statusClass}`} />
            <span className={`font-figtree font-medium text-[0.75rem] lg:text-[1rem] leading-none tracking-[0px] ${statusClass}`}>
              {dispatchMessage}
            </span>
          </div>

          {isBYJ && showBreakdown && (
            <div className="mt-4 bg-[#fef5f1] p-4 sm:p-5 rounded-md space-y-5 border border-[#e0d0ba]/30">
              <div className="space-y-5">
                <div className="border-b border-[#e0d0ba] pb-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-widest text-[#5c4f3a]">Product Type</span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium">{item.properties['Product Type']}</div>
                </div>

                <div className="border-b border-[#e0d0ba] pb-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-widest text-[#5c4f3a]">Style</span>
                    <span className="text-xs sm:text-sm font-bold text-[#1c1810]">₹ {parseFloat(item.properties['_byj_style_price'] / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-zinc-800">{item.properties['Style']}</div>
                </div>

                <div className="border-b border-[#e0d0ba] pb-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-widest text-[#5c4f3a]">Length</span>
                  </div>
                  <div className="text-xs sm:text-sm font-medium">{item.properties['Length']}</div>
                </div>

                <div className="pb-2">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[0.5625rem] sm:text-[0.625rem] font-bold uppercase tracking-widest text-[#5c4f3a]">Charms</span>
                  </div>
                  <div className="space-y-3 mt-3">
                    {byjCharms.map((charm, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-3 sm:gap-4">
                        <div className="flex gap-2 sm:gap-3 items-center flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white border border-[#e0d0ba]/50 rounded-sm overflow-hidden shrink-0 p-1">
                            <img src={charm.img} alt={charm.title} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs sm:text-sm font-medium text-zinc-800 leading-tight">{idx + 1}. {charm.title} {charm.qty > 1 ? `x ${charm.qty}` : ''}</span>
                            {charm.sku && <span className="text-[0.5rem] sm:text-[0.5625rem] font-bold text-zinc-400 uppercase tracking-tighter">SKU: {charm.sku}</span>}
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#1c1810] whitespace-nowrap">₹ {((parseFloat(charm.price) * (charm.qty || 1)) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#e0d0ba] flex justify-between items-center">
                <span className="text-xs sm:text-sm font-medium text-[#5c4f3a]">Subtotal</span>
                <span className="text-base sm:text-lg font-bold text-[#1c1810]">₹ {lineAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Remove / Move to Wishlist Modal */}
      {showRemoveModal && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 lg:items-center">
          <div className="bg-white rounded-t-[16px] lg:rounded-[10px] w-full lg:w-[420px] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-full lg:slide-in-from-bottom-0 lg:zoom-in-95 duration-300 font-figtree">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h3 className="font-figtree text-[1rem] lg:text-[1.2rem] font-semibold text-primary tracking-tight leading-tight">
                {isBYJ ? "Remove from Bag" : "Move from Bag"}
              </h3>
              <button
                onClick={() => setShowRemoveModal(false)}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-[#969696] bg-[#f7f7f7] transition-colors hover:bg-zinc-200 hover:text-zinc-700"
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>

            {/* Product Row */}
            <div className="flex items-center gap-4 px-5 pb-3">
              <div className="relative w-16 h-16 shrink-0 rounded-[10px] overflow-hidden border border-zinc-100 bg-[#F9F9F9]">
                <Image
                  loader={isShopifyImage ? shopifyLoader : undefined}
                  src={displayImage || "/images/product/1.jpg"}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain p-1.5 mix-blend-multiply"
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h4 className="truncate font-figtree text-[0.875rem] lg:text-[1rem] font-semibold text-zinc-900 leading-snug">
                  {item.title}
                </h4>
                <p className="truncate font-figtree text-[0.75rem] text-zinc-500 mt-1">
                  {modalCategory}
                </p>
              </div>
            </div>

            {/* Confirmation Text */}
            <p className="px-5 pb-[18px] lg:pb-4 font-figtree text-[0.8125rem] lg:text-[1rem] text-zinc-600 text-left">
              {isBYJ ? "Are you sure you want to remove this item from bag?" : "Are you sure you want to move this item from bag?"}
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 px-5 pb-5">
              {isBYJ ? (
                <>
                  <button
                    onClick={() => setShowRemoveModal(false)}
                    className="w-full h-12 text-zinc-700 font-figtree font-semibold text-[0.7rem] lg:text-[0.85rem] uppercase tracking-[0.4px] bg-white border border-zinc-200 hover:bg-zinc-50 rounded-[4px] transition-colors flex items-center justify-center text-center leading-none px-2 align-middle disabled:opacity-50"
                  >
                    Keep it
                  </button>
                  <button
                    onClick={() => {
                      handleRemove();
                      setShowRemoveModal(false);
                    }}
                    disabled={removing}
                    className="w-full h-12 bg-primary text-white font-figtree font-semibold text-[0.7rem] lg:text-[0.85rem] uppercase tracking-[0.4px] rounded-[4px] hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center text-center leading-none px-2 align-middle disabled:opacity-50"
                  >
                    {removing ? <Loader2 size={16} className="animate-spin" /> : "Remove"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      handleRemove();
                      setShowRemoveModal(false);
                    }}
                    disabled={removing || movingToWishlist}
                    className="w-full h-12 text-zinc-700 font-figtree font-semibold text-[0.7rem] lg:text-[0.85rem] uppercase tracking-[0.4px] bg-white border border-zinc-200 hover:bg-zinc-50 rounded-[4px] transition-colors flex items-center justify-center text-center leading-none px-2 align-middle disabled:opacity-50"
                  >
                    {removing ? <Loader2 size={16} className="animate-spin" /> : "Remove"}
                  </button>
                  <button
                    onClick={() => {
                      handleMoveToWishlist();
                      setShowRemoveModal(false);
                    }}
                    disabled={removing || movingToWishlist}
                    className="w-full h-12 bg-primary text-white font-figtree font-semibold text-[0.7rem] lg:text-[0.85rem] uppercase tracking-[0.4px] rounded-[4px] hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center text-center leading-none px-2 align-middle disabled:opacity-50"
                  >
                    {movingToWishlist ? <Loader2 size={16} className="animate-spin" /> : "Move to Wishlist"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
