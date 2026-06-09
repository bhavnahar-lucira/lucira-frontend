"use client";

import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateCartItem } from "@/redux/features/cart/cartSlice";
import { 
  addWishlistItem, 
  removeWishlistItem,
} from "@/redux/features/wishlist/wishlistSlice";
import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import { pushRemoveFromCart, pushAddToWishlist, getNumericId, getStandardWishlistPayload } from "@/lib/gtm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Trash2, Heart, Loader2, X, ChevronDown, Store, ChevronRight, Check } from "lucide-react";

export default function CartItem({ item, onAuthRequired }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [movingToWishlist, setMovingToWishlist] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

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

  const lineAmount = (item.price || 0) * (item.quantity || 1);
  const lineCompareAmount = (item.comparePrice || 0) * (item.quantity || 1);
  const hasDiscount = lineCompareAmount > lineAmount;

  const statusLabel = isInStock ? "In Stock" : "Made to Order";
  const statusClass = isInStock ? "text-green-500" : "text-primary";

  const displayImage = isBYJ ? item.properties['_byj_preview'] : (currentVariant?.image || item.image);

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
          image: item.image || "",
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
            className="aspect-square w-full shrink-0 overflow-hidden rounded-sm border border-zinc-100/50 bg-zinc-50 md:w-48 block transition-opacity hover:opacity-90"
          >
            <Image
              src={displayImage || "/images/product/1.jpg"}
              alt={item.title}
              width={200}
              height={200}
              className="h-full w-full object-contain mix-blend-multiply"
            />
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
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-[#e0d0ba] bg-zinc-50/50 p-4 rounded-sm">
                {/* Base Style */}
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-white border border-zinc-100 rounded-sm overflow-hidden shrink-0 p-1">
                    <img src={item.properties['_byj_style_img']} alt="Style" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-800 truncate">{item.properties['Style']}</p>
                    <p className="text-[11px] text-zinc-500 uppercase font-medium">Finish: {item.properties['Material']}, Length: {item.properties['Length']}</p>
                    <p className="text-sm font-bold mt-0.5 text-zinc-900">₹ {parseFloat(item.properties['_byj_style_price']).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
                {/* Charms */}
                {byjCharms.map((charm, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-white border border-zinc-100 rounded-sm overflow-hidden shrink-0 p-1">
                      <img src={charm.img} alt={charm.title} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-800 truncate">{charm.title}</p>
                      {charm.qty > 1 && <p className="text-[11px] text-zinc-500 uppercase font-medium">Quantity: {charm.qty}</p>}
                      <p className="text-sm font-bold mt-0.5 text-zinc-900">₹ {parseFloat(charm.price * charm.qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                ))}
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
              {item.diamondTotalPcs > 0 && (
                <div className="flex border-b border-zinc-100 min-h-[44px]">
                  <div className="w-[120px] bg-[#f9f9f9] px-4 py-2 text-zinc-500 font-normal flex items-center border-r border-zinc-100 shrink-0">
                    Stone
                  </div>
                  <div className="flex-1 bg-white px-4 py-2 flex items-center">
                    {item.diamondTotalPcs} Diamond{item.diamondCarat ? `, ${item.diamondCarat} Carat` : ''}{item.diamondQuality ? `, ${item.diamondQuality}` : ''}
                  </div>
                </div>
              )}
              
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
            onClick={handleRemove}
            disabled={removing}
            className="flex flex-1 items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:bg-zinc-50 hover:text-red-500 disabled:opacity-50"
          >
            {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Remove
          </button>
          <button
            onClick={handleMoveToWishlist}
            disabled={movingToWishlist}
            className="flex flex-1 items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:bg-zinc-50 hover:text-primary disabled:opacity-50"
          >
            {movingToWishlist ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} />}
            Move to Wishlist
          </button>
        </div>
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
                  src={displayImage || "/images/product/1.jpg"}
                  alt={item.title}
                  width={150}
                  height={150}
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              </Link>
              <div className="w-full absolute bottom-0 flex items-center justify-center px-1 py-0.5 bg-white/90 border border-zinc-100 whitespace-nowrap">
                <span className={`text-[8px] font-bold uppercase ${statusClass}`}>{statusLabel}</span>
              </div>
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
                {currentVariant?.sku || item.sku || "N/A"}
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

          {isBYJ && showBreakdown && (
            <div className="mt-4 space-y-4 px-2 py-4 border-t border-zinc-50 bg-zinc-50/30 rounded-sm">
              {/* Base Style */}
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-white border border-zinc-100 rounded-sm overflow-hidden shrink-0 p-1">
                  <img src={item.properties['_byj_style_img']} alt="Style" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-zinc-800 truncate">{item.properties['Style']}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-medium">Finish: {item.properties['Material']}, Size: {item.properties['Length']}</p>
                  <p className="text-[13px] font-bold mt-0.5 text-zinc-900">₹ {parseFloat(item.properties['_byj_style_price']).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
              {/* Charms */}
              {byjCharms.map((charm, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-white border border-zinc-100 rounded-sm overflow-hidden shrink-0 p-1">
                    <img src={charm.img} alt={charm.title} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-zinc-800 truncate">{charm.title}</p>
                    {charm.qty > 1 && <p className="text-[10px] text-zinc-500 uppercase font-medium">Quantity: {charm.qty}</p>}
                    <p className="text-[13px] font-bold mt-0.5 text-zinc-900">₹ {parseFloat(charm.price * charm.qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Mobile Actions - JUSTIFY BETWEEN */}
          <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between px-2">
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition-all active:scale-95 disabled:opacity-50"
            >
              {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Remove
            </button>
            
            <div className="w-px h-4 bg-zinc-100" />

            <button
              onClick={handleMoveToWishlist}
              disabled={movingToWishlist}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#443360] transition-all active:scale-95 disabled:opacity-50"
            >
              {movingToWishlist ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} className={isWishlisted ? "fill-primary text-primary" : ""} />}
              Move to Wishlist
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
