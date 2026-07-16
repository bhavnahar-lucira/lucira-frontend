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

import { Trash2, Heart, Loader2, X, ChevronDown, Store, ChevronRight, Check, Video } from "lucide-react";
import { formatSocialCount, buildSocialMetrics, SOCIAL_BADGE_STYLES } from "@/lib/socialProof";
import SocialBadgeIcon from "@/components/common/SocialBadgeIcon";

// Builds the WhatsApp "schedule video call" link, including the product name for context.
function buildVideoCallUrl(productName, sku) {
  let message = "Hi, I'm on the cart page and want to schedule a video call";
  if (productName) {
    message += ` for : ${productName}`;
  }
  return `https://api.whatsapp.com/send/?phone=919004435760&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
}

// FOMO strip shown below in-stock cart items — lets the shopper book a live video call.
function ViewLiveStrip({ productName, sku }) {
  const handleViewLiveClick = () => {
    try {
      pushPromoClick({
        creative_name: "view_live_cta_checkout",
        location_id: "checkout page",
        promo_id: productName || sku || "",
        promo_name: "View Live",
      });
    } catch (e) {
      console.error("promoClick push failed", e);
    }
  };

  return (
    <a
      href={buildVideoCallUrl(productName, sku)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleViewLiveClick}
      className="flex items-center gap-2.5 lg:gap-3 border-t border-black/5 px-3.5 py-2.5 lg:px-4 lg:py-3 transition-opacity hover:opacity-95"
      style={{ background: "linear-gradient(89.31deg, #FEF5F1 0%, #F1E4D1 100%)" }}
    >
      <span className="relative h-9 w-9 lg:h-10 lg:w-10 shrink-0 overflow-hidden rounded-full bg-white shadow-sm">
        <Image
          src="/images/explore/VirtualTryOn.jpg"
          alt="Lucira consultant"
          fill
          sizes="40px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-figtree font-medium text-[13px] lg:text-[15px] leading-[1.3] text-[#3D2B28] truncate">
          Shop with Complete Confidence
        </p>
        <p className="font-figtree font-normal text-[11px] lg:text-[13px] leading-[1.3] text-[#6B5B54] truncate">
          See every detail before you buy.
        </p>
      </div>
      <span className="flex shrink-0 items-center justify-center gap-1.5 lg:gap-2 rounded-[4px] bg-[#5A413F] h-9 lg:h-10 px-4 lg:px-6 font-figtree font-medium uppercase tracking-wide text-[11px] lg:text-[13px] text-white">
        <Video size={16} />
        View Live
      </span>
    </a>
  );
}

// Social-proof amplify/format/build logic lives in "@/lib/socialProof" so the cart
// and the product page stay in sync. The cart uses the default labels.

// FOMO band that rotates one-at-a-time through the available metrics.
// Icons, colours and labels are shared with the product page (SocialBadgeIcon + "@/lib/socialProof").
function SocialProofBand({ socialProof, compact = false, className = "" }) {
  const metrics = useMemo(() => buildSocialMetrics(socialProof), [socialProof]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    if (metrics.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % metrics.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [metrics.length]);

  if (metrics.length === 0) return null;

  const m = metrics[Math.min(idx, metrics.length - 1)];

  return (
    <div
      className={`w-fit max-w-[calc(100%-16px)] overflow-hidden rounded-full backdrop-blur-sm ${compact ? "px-2.5 py-1" : "px-3 py-1.5"} ${className}`}
      style={SOCIAL_BADGE_STYLES[m.key]}
    >
      <div key={m.key} className="flex items-center gap-1.5 min-w-0 animate-in fade-in slide-in-from-bottom-1 duration-500">
        <SocialBadgeIcon type={m.key} className={compact ? "[&_svg]:h-[13px] [&_svg]:w-auto" : "[&_svg]:h-[15px] [&_svg]:w-auto"} />
        <span className={`font-semibold truncate ${compact ? "text-[11px]" : "text-[13px]"}`}>
          {formatSocialCount(m.value)} {m.label}
        </span>
      </div>
    </div>
  );
}

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
  const lineCompareAmount = (item.comparePrice || 0) * (item.quantity || 1);
  const hasDiscount = lineCompareAmount > lineAmount;

  const statusLabel = (isInStock && !isBYJ) ? "In Stock" : "Made to Order";
  const statusClass = (isInStock && !isBYJ) ? "text-green-500" : "text-primary";

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

      await dispatch(removeFromCart({ userId: user?.id, lineId: item.lineId || item.variantId })).unwrap();
      toast.error("Moved to wishlist", {
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

  const lowerTitle = (item.title || "").toLowerCase();
  const sizeLabel = lowerTitle.includes("ring") ? "Ring Size" :
    (lowerTitle.includes("bracelet") || lowerTitle.includes("bangle")) ? "Wrist Size" :
      lowerTitle.includes("necklace") ? "Length" : "Size";

  const variantIdForUrl = item.variantId ? String(item.variantId).split('/').pop() : "";
  const productLink = item.handle ? `/products/${item.handle}${variantIdForUrl ? `?variant=${variantIdForUrl}` : ""}` : "#";

  return (
    <>
      {/* DESKTOP DESIGN */}
      <div className="hidden lg:block mb-6 overflow-hidden rounded-lg border border-zinc-100 bg-white shadow-sm">
        <div className="relative flex flex-col gap-6 p-4 md:flex-row md:p-6">
          {updating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          <Link prefetch={false}
            href={productLink}
            className="relative aspect-square w-full shrink-0 overflow-hidden rounded-sm border border-zinc-100/50 bg-zinc-50 md:w-48 block transition-opacity"
          >
            <Image
              loader={isShopifyImage ? shopifyLoader : undefined}
              src={displayImage || "/images/product/1.jpg"}
              alt={item.title}
              width={200}
              height={200}
              className="h-auto w-full object-contain mix-blend-multiply"
              style={{ color: 'transparent' }}
            />
            <SocialProofBand socialProof={socialProof} className="absolute left-1/2 -translate-x-1/2 bottom-2 z-10 shadow-sm" />
          </Link>

          <div className="grow space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Link prefetch={false} href={productLink}>
                  <h3 className="font-abhaya text-lg font-bold text-black hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  SKU: {currentVariant?.sku || item.sku || "N/A"}
                </p>
                {item.engraving && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Engraving: &quot;{item.engraving}&quot;
                  </p>
                )}
                {isBYJ && (
                  <button 
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors mt-1"
                  >
                    {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
                    <ChevronDown size={14} className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              <div className="flex flex-col items-end whitespace-nowrap">
                <div className="text-xl font-bold text-zinc-900">
                  ₹ {lineAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                {hasDiscount && (
                  <div className="text-sm text-zinc-400 line-through">
                    ₹ {lineCompareAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            </div>

            {isBYJ && showBreakdown && (
              <div className="mt-4 bg-[#fef5f1] p-6 rounded-md space-y-6 border border-[#e0d0ba]/30">
                <div className="space-y-6">
                  <div className="border-b border-[#e0d0ba] pb-2">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a]">Product Type</span>
                    </div>
                    <div className="text-sm font-medium">{item.properties['Product Type']}</div>
                  </div>

                  <div className="border-b border-[#e0d0ba] pb-2">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a]">Style</span>
                      <span className="text-sm font-bold text-[#1c1810]">₹ {parseFloat(item.properties['_byj_style_price'] / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="text-sm font-medium text-zinc-800">{item.properties['Style']}</div>
                  </div>

                  <div className="border-b border-[#e0d0ba] pb-2">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a]">Length</span>
                    </div>
                    <div className="text-sm font-medium">{item.properties['Length']}</div>
                  </div>

                  <div className="pb-2">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c4f3a]">Charms</span>
                    </div>
                    <div className="space-y-3 mt-3">
                      {byjCharms.map((charm, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4">
                          <div className="flex gap-3 items-center flex-1">
                            <div className="w-10 h-10 bg-white border border-[#e0d0ba]/50 rounded-sm overflow-hidden shrink-0 p-1">
                              <img src={charm.img} alt={charm.title} className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-zinc-800 leading-tight">{idx + 1}. {charm.title} {charm.qty > 1 ? `x ${charm.qty}` : ''}</span>
                              {charm.sku && <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">SKU: {charm.sku}</span>}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#1c1810] whitespace-nowrap">₹ {((parseFloat(charm.price) * (charm.qty || 1)) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#e0d0ba] flex justify-between items-center">
                  <span className="text-sm font-medium text-[#5c4f3a]">Subtotal</span>
                  <span className="text-lg font-bold text-[#1c1810]">₹ {lineAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col border border-zinc-100 rounded-sm overflow-hidden text-[13px] font-medium text-zinc-800">

              {/* Row 1: Size & Quantity */}
              <div className="flex border-b border-zinc-100 min-h-[44px]">
                {item.size ? (
                  <div className="w-[120px] bg-[#f9f9f9] px-4 py-2 text-zinc-500 font-normal flex items-center border-r border-zinc-100 shrink-0">
                    {sizeLabel}
                  </div>
                ) : (
                  <div className="w-[120px] bg-[#f9f9f9] px-4 py-2 text-zinc-500 font-normal flex items-center border-r border-zinc-100 shrink-0">
                    Quantity
                  </div>
                )}

                <div className="flex-1 bg-white px-4 py-2 flex items-center flex-wrap gap-x-6 gap-y-2">
                  {item.size && (
                    <div className="flex items-center min-w-[60px]">
                      {canEditSize ? (
                        <Select
                          value={String(item.size)}
                          onValueChange={(val) => handleUpdate("size", val)}
                          disabled={updating}
                        >
                          <SelectTrigger className="h-6 w-auto border-none bg-transparent p-0 font-medium text-zinc-800 shadow-none focus:ring-0 gap-2">
                            <SelectValue placeholder={item.size} />
                          </SelectTrigger>
                          <SelectContent>
                            {sizeOptions.map((variant) => (
                              <SelectItem key={variant.variantId || variant.size} value={String(variant.size)}>
                                {variant.size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium">{item.size}</span>
                      )}
                    </div>
                  )}

                  {item.size && <div className="h-4 w-px bg-zinc-200 hidden sm:block" />}

                  <div className="flex items-center gap-2">
                    {item.size && <span className="text-zinc-500 font-normal">Quantity</span>}
                    {canEditQuantity ? (
                      <Select
                        value={String(item.quantity)}
                        onValueChange={(val) => handleUpdate("quantity", val)}
                        disabled={updating}
                      >
                        <SelectTrigger className="h-6 w-auto border-none bg-transparent p-0 font-medium text-zinc-800 shadow-none focus:ring-0 gap-2">
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
                      <span className="font-medium">{item.quantity}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Metal */}
              <div className="flex border-b border-zinc-100 min-h-[44px]">
                <div className="w-[120px] bg-[#f9f9f9] px-4 py-2 text-zinc-500 font-normal flex items-center border-r border-zinc-100 shrink-0">
                  Metal
                </div>
                <div className="flex-1 bg-white px-4 py-2 flex items-center">
                  {(() => {
                    const k = String(item.karat || "").trim();
                    const c = String(item.color || "").trim();
                    if (!k) return c;
                    if (c.toLowerCase().includes(k.toLowerCase())) return c;
                    return `${k} ${c}`;
                  })()}
                  {item.goldWeight ? `, ${item.goldWeight} gram` : ''}
                </div>
              </div>

              {/* Row 3: Stone (If diamondTotalPcs > 0) */}
              {/* {item.diamondTotalPcs > 0 && (
                <div className="flex border-b border-zinc-100 min-h-[44px]">
                  <div className="w-[120px] bg-[#f9f9f9] px-4 py-2 text-zinc-500 font-normal flex items-center border-r border-zinc-100 shrink-0">
                    Stone
                  </div>
                  <div className="flex-1 bg-white px-4 py-2 flex items-center">
                    {item.diamondTotalPcs} Diamond{item.diamondCarat ? `, ${item.diamondCarat} Carat` : ''}{item.diamondQuality ? `, ${item.diamondQuality}` : ''}
                  </div>
                </div>
              )} */}

              {/* Row 4: Status */}
              <div className="flex min-h-[44px]">
                <div className="w-[120px] bg-[#f9f9f9] px-4 py-2 text-zinc-500 font-normal flex items-center border-r border-zinc-100 shrink-0">
                  Status
                </div>
                <div className="flex-1 bg-white px-4 py-2 flex items-center">
                  <span className={`font-medium uppercase ${statusClass}`}>{statusLabel}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="flex divide-x divide-zinc-100 border-t border-zinc-100 bg-white">
          <button
            onClick={() => setShowRemoveModal(true)}
            disabled={removing}
            className="flex flex-1 items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:bg-zinc-50 hover:text-red-500 disabled:opacity-50"
          >
            {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Remove
          </button>
          {!isBYJ && (
            <button
              onClick={handleMoveToWishlist}
              disabled={movingToWishlist}
              className="flex flex-1 items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:bg-zinc-50 hover:text-primary disabled:opacity-50"
            >
              {movingToWishlist ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} />}
              Move to Wishlist
            </button>
          )}
        </div>

        {/* View Live strip (in-stock only) */}
        {isInStock && <ViewLiveStrip productName={item.title} sku={currentVariant?.sku || item.sku} />}
      </div>

      {/* MOBILE DESIGN (< 1024px) */}
      <div className="lg:hidden mb-4 overflow-hidden rounded-lg border border-zinc-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="relative p-4">
          {updating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          <div className="flex gap-4">
            {/* Image Container */}
            <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-sm border border-zinc-100 bg-[#F9F9F9]">
              <Link prefetch={false} href={productLink} className="block h-full w-full p-2">
                <Image
                  loader={isShopifyImage ? shopifyLoader : undefined}
                  src={displayImage || "/images/product/1.jpg"}
                  alt={item.title}
                  width={150}
                  height={150}
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              </Link>
              <span className={`absolute top-1.5 left-1.5 z-10 rounded bg-white/90 border border-zinc-100 px-1.5 py-0.5 text-[8px] font-bold uppercase ${statusClass}`}>
                {statusLabel}
              </span>
              <SocialProofBand socialProof={socialProof} compact className="absolute left-1/2 -translate-x-1/2 bottom-1.5 z-10 shadow-sm" />
            </div>

            {/* Info Content */}
            <div className="flex-1 space-y-1 min-w-0 pt-1">
              <h3 className="text-base font-medium text-black truncate leading-snug font-abhaya">
                {item.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[15px] font-bold text-zinc-900">
                  ₹ {lineAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-[12px] text-zinc-400 line-through">
                      ₹ {lineCompareAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">
                SKU: {currentVariant?.sku || item.sku || "N/A"}
              </p>
              {item.engraving && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Engraving: &quot;{item.engraving}&quot;
                </p>
              )}
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-tight">
                Metal: <span className="text-zinc-900">
                  {(() => {
                    const k = String(item.karat || "").trim();
                    const c = String(item.color || "").trim();
                    if (!k) return c;
                    if (c.toLowerCase().includes(k.toLowerCase())) return c;
                    return `${k} ${c}`;
                  })()}
                </span>
              </p>

              {/* Selectors */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                {item.size && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[13px] text-zinc-800 font-medium">
                      {sizeLabel.replace(" Size", "")}:
                    </span>
                    {canEditSize ? (
                      <Select
                        value={String(item.size)}
                        onValueChange={(val) => handleUpdate("size", val)}
                        disabled={updating}
                      >
                        <SelectTrigger className="h-auto border-none bg-transparent p-0 text-[13px] font-bold text-zinc-800 shadow-none focus:ring-0 gap-0.5 min-w-0 w-auto">
                          <SelectValue placeholder={item.size} />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((variant) => (
                            <SelectItem key={variant.variantId || variant.size} value={String(variant.size)}>
                              {variant.size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-[13px] font-bold text-zinc-800">{item.size}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-0.5">
                  <span className="text-[13px] text-zinc-800 font-medium">Quantity:</span>
                  {canEditQuantity ? (
                    <Select
                      value={String(item.quantity)}
                      onValueChange={(val) => handleUpdate("quantity", val)}
                      disabled={updating}
                    >
                      <SelectTrigger className="h-auto border-none bg-transparent p-0 text-[13px] font-bold text-zinc-800 shadow-none focus:ring-0 gap-0.5 min-w-0 w-auto">
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
                    <span className="text-[13px] font-bold text-zinc-800">{item.quantity}</span>
                  )}
                </div>
              </div>

              {isBYJ && (
                <button 
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors mt-2"
                >
                  {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
                  <ChevronDown size={14} className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Actions - JUSTIFY BETWEEN */}
          <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between px-2">
            <button
              onClick={() => setShowRemoveModal(true)}
              disabled={removing}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition-all active:scale-95 disabled:opacity-50"
            >
              {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Remove
            </button>

            {!isBYJ && (
              <>
                <div className="w-px h-4 bg-zinc-100" />

                <button
                  onClick={handleMoveToWishlist}
                  disabled={movingToWishlist}
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#443360] transition-all active:scale-95 disabled:opacity-50"
                >
                  {movingToWishlist ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} className={isWishlisted ? "fill-primary text-primary" : ""} />}
                  Move to Wishlist
                </button>
              </>
            )}
          </div>
        </div>

        {/* View Live strip (in-stock only) */}
        {isInStock && <ViewLiveStrip productName={item.title} sku={currentVariant?.sku || item.sku} />}
      </div>

      {/* Remove / Move to Wishlist Modal */}
      {showRemoveModal && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-2xl w-[95%] sm:w-[90%] max-w-[380px] md:max-w-[420px] overflow-hidden flex flex-col items-center p-5 sm:p-6 md:p-8 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowRemoveModal(false)}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 text-zinc-400 hover:text-zinc-800 transition-colors p-1"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Product Image */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-36 lg:w-36 lg:h-36 rounded-2xl border border-zinc-100 p-1.5 sm:p-2 mb-4 sm:mb-6 bg-gradient-to-br from-zinc-50 to-white shadow-sm flex items-center justify-center">
              <Image
                loader={isShopifyImage ? shopifyLoader : undefined}
                src={displayImage || "/images/product/1.jpg"}
                alt={item.title}
                width={120}
                height={120}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            {/* Text Content */}
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[28px] font-abhaya font-bold text-zinc-900 mb-1.5 sm:mb-2 text-center tracking-tight leading-tight">
              {isBYJ ? "Remove Design from Cart" : "Move Design from Cart"}
            </h3>
            <p className="text-zinc-500 text-[13px] sm:text-[14px] md:text-[15px] text-center mb-5 sm:mb-6 md:mb-8 font-figtree leading-relaxed px-1">
              {isBYJ ? "Are you sure you want to remove this design from the cart?" : "Are you sure you want to move this design from the cart?"}
            </p>

            {/* Actions */}
            <div className="flex w-full gap-2 sm:gap-3 md:gap-4 font-figtree">
              {isBYJ ? (
                <>
                  <button
                    onClick={() => setShowRemoveModal(false)}
                    className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 border border-[#5A413F] text-[#5A413F] font-bold text-[11px] sm:text-[12px] md:text-xs uppercase tracking-widest rounded-full hover:bg-[#5A413F]/5 transition-all flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleRemove();
                      setShowRemoveModal(false);
                    }}
                    disabled={removing}
                    className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 bg-gradient-to-r from-[#8C5A4C] to-[#5A413F] text-white font-bold text-[11px] sm:text-[12px] md:text-xs uppercase tracking-widest rounded-full hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50"
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
                    className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 border border-[#5A413F] text-[#5A413F] font-bold text-[11px] sm:text-[12px] md:text-xs uppercase tracking-widest rounded-full hover:bg-[#5A413F]/5 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {removing ? <Loader2 size={16} className="animate-spin" /> : "Remove"}
                  </button>
                  <button
                    onClick={() => {
                      handleMoveToWishlist();
                      setShowRemoveModal(false);
                    }}
                    disabled={removing || movingToWishlist}
                    className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 bg-gradient-to-r from-[#8C5A4C] to-[#5A413F] text-white font-bold text-[11px] sm:text-[12px] md:text-xs uppercase tracking-widest rounded-full hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50"
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
