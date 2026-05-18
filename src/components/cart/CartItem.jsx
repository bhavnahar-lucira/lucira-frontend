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

  const wishlistKeys = useMemo(
    () => wishlistItems.map((i) => `${i.productId}-${i.variantId || ""}`),
    [wishlistItems]
  );

  if (!item) return null;

  const productId = item.id || item.productId || item.handle;
  const currentKey = `${productId}-${item.variantId || ""}`;
  const isWishlisted = productId ? wishlistKeys.includes(currentKey) : false;

  const variantOptions = Array.isArray(item.variantOptions) ? item.variantOptions : [];
  const currentVariant =
    variantOptions.find((variant) => variant.variantId === item.variantId) ||
    variantOptions.find((variant) => String(variant.size) === String(item.size));
  const isInStock = currentVariant?.inStock ?? item.inStock ?? true;
  const canEditSelection = !isInStock;
  const lineAmount = (item.price || 0) * (item.quantity || 1);
  const lineCompareAmount = (item.comparePrice || 0) * (item.quantity || 1);
  const hasDiscount = lineCompareAmount > lineAmount;

  const statusLabel = isInStock ? "In Stock" : "Made to Order";
  const statusClass = isInStock ? "text-green-500" : "text-primary";
  const sizeOptions =
    variantOptions.length > 0
      ? variantOptions
      : (item.availableSizes || [item.size]).map((size) => ({ size }));

  const displayImage = currentVariant?.image || item.image;

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

      // Robust SKU resolution for cart items
      const resolvedSku = item.sku || currentVariant?.sku || item.variantSku || item.item_sku || (variantOptions && variantOptions[0]?.sku) || "";

      pushRemoveFromCart({
        productId: String(getNumericId(item.productId || item.shopifyId || item.id)),
        sku: resolvedSku,
        variantId: String(getNumericId(item.variantId)),
        productName: item.title,
        productType: categoryFallback,
        category: categoryFallback,
        sub_category: item.variantTitle || "",
        price: Number(item.price || 0),
        offerPrice: Number(item.comparePrice || item.price || 0),
        quantity: item.quantity,
        thumbnail_image: item.image
      });

      await dispatch(removeFromCart({ userId: user?.id, variantId: item.variantId })).unwrap();
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

      // Robust SKU resolution for cart items
      const resolvedSku = item.sku || currentVariant?.sku || item.variantSku || item.item_sku || (variantOptions && variantOptions[0]?.sku) || "";

      // Adapt cart item to standard product/variant structure for the helper
      const mockProduct = {
        shopifyId: item.productId || item.shopifyId || item.id,
        title: item.title,
        handle: item.handle,
        category: item.category || productTypeFallback,
        type: item.type || productTypeFallback,
        price: item.price,
        sku: resolvedSku // Pass SKU at product level too for fallback
      };
      const mockVariant = {
        sku: resolvedSku,
        id: item.variantId,
        price: item.price
      };

      const commonTrackingData = getStandardWishlistPayload(mockProduct, mockVariant, currentOrigin, item.image);
      pushAddToWishlist(commonTrackingData);

      await dispatch(removeFromCart({ userId: user?.id, variantId: item.variantId })).unwrap();
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
        if (!selectedVariant) throw new Error("Selected size is unavailable");
        payload.nextVariantId = selectedVariant.variantId;
        payload.size = selectedVariant.size;
        payload.price = selectedVariant.price;
        payload.variantTitle = selectedVariant.variantTitle;
        payload.inStock = selectedVariant.inStock;
        payload.sku = selectedVariant.sku || "";
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

  const productLink = item.handle ? `/products/${item.handle}${item.variantId ? `?variant=${item.variantId}` : ""}` : "#";

  return (
    <>
      {/* DESKTOP DESIGN (Original) */}
      <div className="hidden lg:block mb-6 overflow-hidden rounded-lg border border-zinc-100 bg-white shadow-sm">
        <div className="relative flex flex-col gap-6 p-4 md:flex-row md:p-6">
          {updating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          <Link 
            href={productLink}
            className="aspect-square w-full shrink-0 overflow-hidden rounded-sm border border-zinc-100/50 bg-zinc-50 md:w-48 block transition-opacity hover:opacity-90"
          >
            <Image
              src={displayImage || "/images/product/1.jpg"}
              alt={item.title}
              width={200}
              height={200}
              unoptimized={String(displayImage).includes("cdn.shopify.com") || String(displayImage).includes("myshopify.com")}
              className="h-full w-full object-contain mix-blend-multiply"
            />
          </Link>

          <div className="grow space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Link href={productLink}>
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

            <div className="grid grid-cols-1 divide-y rounded-sm border border-zinc-100 md:grid-cols-[1.2fr_2fr] md:divide-x md:divide-y-0 divide-zinc-100">
              <div className={`grid ${item.size ? "grid-cols-2" : "grid-cols-1"} divide-x divide-zinc-100 bg-zinc-50/30`}>
                {item.size && (
                  <div className="flex flex-col justify-center p-2">
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
                      {sizeLabel}
                    </span>
                    {canEditSelection ? (
                      <Select
                        value={String(item.size)}
                        onValueChange={(val) => handleUpdate("size", val)}
                        disabled={updating}
                      >
                        <SelectTrigger className="h-6 border-none bg-transparent p-0 text-xs font-bold text-zinc-800 shadow-none focus:ring-0">
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
                      <span className="text-xs font-bold text-zinc-800">{item.size}</span>
                    )}
                  </div>
                )}

                <div className="flex flex-col justify-center p-2">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
                    Quantity
                  </span>
                  {canEditSelection ? (
                    <Select
                      value={String(item.quantity)}
                      onValueChange={(val) => handleUpdate("quantity", val)}
                      disabled={updating}
                    >
                      <SelectTrigger className="h-6 border-none bg-transparent p-0 text-xs font-bold text-zinc-800 shadow-none focus:ring-0">
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
                    <span className="text-xs font-bold text-zinc-800">{item.quantity}</span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-zinc-100">
                <div className="grid grid-cols-[80px_1fr] items-center p-2">
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
                    Metal
                  </span>
                  <span className="text-xs font-medium text-zinc-800">
                    {item.karat} {item.color}
                  </span>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center p-2">
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400">
                    Status
                  </span>
                  <span className={`text-xs font-bold uppercase ${statusClass}`}>{statusLabel}</span>
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
              <Link href={productLink} className="block h-full w-full p-2">
                <Image
                  src={displayImage || "/images/product/1.jpg"}
                  alt={item.title}
                  width={150}
                  height={150}
                  unoptimized={String(displayImage).includes("cdn.shopify.com") || String(displayImage).includes("myshopify.com")}
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              </Link>
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
              
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-tight">
                Metal: <span className="text-zinc-900">{item.karat} {item.color}</span>
              </p>

              {/* Selectors */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                {item.size && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[13px] text-zinc-800 font-medium">
                      {sizeLabel.replace(" Size", "")}:
                    </span>
                    {canEditSelection ? (
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
                  {canEditSelection ? (
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
            </div>
          </div>
          
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
