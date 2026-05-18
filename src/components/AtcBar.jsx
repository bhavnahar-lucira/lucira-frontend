"use client";
import React from "react";
import { Heart, Loader2, MessageCircle, Home, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AtcBar({
  isTopVisible,
  isBottomVisible,
  product,
  activeVariant,
  onAddToCart,
  addingToCart,
  onToggleWishlist,
  isWishlisted,
  schemeData,
}) {
  const formatPrice = (num) => {
    if (num === null || num === undefined) return "0";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(num);
  };

  const currentPrice = activeVariant?.price || product?.price || 0;
  const comparePrice = activeVariant?.compare_price || product?.compare_price || 0;
  const discount = comparePrice > currentPrice ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0;

  // Use schemeData if available, otherwise fallback to 0
  const schemeSavings = schemeData?.saveAmount || 0;

  const getValidSrc = (src, fallback = "/images/product/1.jpg") => {
    if (typeof src === 'string' && src.trim() !== '') return src;
    if (src && typeof src === 'object' && src.url) return src.url;
    return fallback;
  };

  return (
    <>
      {/* Sticky Top Bar (atcBar) */}
      <div
        className={cn(
          "atcBar fixed top-0 left-0 w-full bg-white z-200 border-b border-gray-100 transition-all duration-500 transform shadow-sm px-4 lg:px-17 py-3",
          isTopVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        <div className="max-w-480 mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-gray-50 shrink-0">
              <Image
                src={getValidSrc(activeVariant?.image || product?.featuredImage || product?.images?.[0])}
                alt={product?.title || "Product"}
                fill
                unoptimized={String(getValidSrc(activeVariant?.image || product?.featuredImage || product?.images?.[0])).includes("cdn.shopify.com") || String(getValidSrc(activeVariant?.image || product?.featuredImage || product?.images?.[0])).includes("myshopify.com")}
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-black truncate leading-tight">
                {product?.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-black">
                  ₹{formatPrice(currentPrice)}
                </span>
                {comparePrice > currentPrice && (
                  <span className="text-xs text-gray-400 line-through font-medium">
                    ₹{formatPrice(comparePrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-bold text-[#2DB36F] flex items-center ml-1">
                    <span className="mr-0.5">↓</span>{discount}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {schemeData && (
              <div className="hidden lg:flex items-center gap-2 mr-2">
                <a
                  href={schemeData.schemeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 px-6 border border-primary text-primary font-bold text-[13px] rounded-sm uppercase tracking-wider whitespace-nowrap hover:bg-primary/5 transition-colors flex items-center justify-center"
                >
                  YOU SAVE <span className="mx-1 font-extrabold">₹{formatPrice(schemeData.saveAmount)}</span> WITH SCHEME
                </a>
              </div>
            )}

            <Button
              onClick={onAddToCart}
              disabled={addingToCart}
              className="h-14 px-10 text-sm font-bold bg-primary hover:bg-accent text-white rounded-sm transition-colors uppercase tracking-wider min-w-40"
            >
              {addingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : "ADD TO CART"}
            </Button>

            <div className="hidden xl:flex items-center gap-2">
              <Button asChild className="h-14 w-14 border border-accent text-accent rounded-sm flex items-center justify-center bg-white hover:bg-[#FFF5F5] transition-colors">
                <a href="https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20home%20trial%20" target="_blank">
                  <Home size={20} />
                </a>
              </Button>
              <Button asChild className="h-14 w-14 border border-[#A193E8] text-[#A193E8] rounded-sm flex items-center justify-center bg-white hover:bg-[#F5F5FF] transition-colors">
                <a href="https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20an%20appointment%20" target="_blank">
                  <StoreIcon size={20} />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (atc-2) */}
      <div
        className={cn(
          "atc-2 fixed bottom-0 left-0 w-full z-200 transition-all duration-300 transform pointer-events-none",
          isBottomVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="max-w-480 mx-auto px-4 lg:px-17">
          {/* Desktop Layout: Aligned to Right Column */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_530px] gap-10">
            <div className="hidden lg:block"></div> {/* Spacer for Left Column */}
            <div className="pointer-events-auto bg-white border border-gray-100 rounded-sm p-3 flex items-center gap-2 w-full">
              {schemeData && (
                <a
                  href={schemeData.schemeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 flex-1 border border-primary text-primary font-bold text-[13px] rounded-sm flex items-center justify-center whitespace-nowrap px-2 hover:bg-accent/5 transition-colors uppercase tracking-tight"
                >
                  YOU SAVE <span className="mx-1 font-extrabold">₹{formatPrice(schemeData.saveAmount)}</span> WITH SCHEME
                </a>
              )}
              <button
                onClick={onAddToCart}
                disabled={addingToCart}
                className="h-14 flex-[1.5] bg-primary text-white font-bold text-[14px] rounded-sm flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-[#8F5D5D] transition-colors"
              >
                {addingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "ADD TO CART"
                )}
              </button>
            </div>
          </div>

          {/* Mobile Layout: Full Width Style */}
          <div className="lg:hidden pointer-events-auto bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] -mx-4 px-4 py-3 flex items-center gap-2 w-screen">
            {/* WhatsApp Button */}
            <a
              href="https://wa.me/919172499912"
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 aspect-square bg-white shadow-md border border-zinc-100 rounded-sm flex items-center justify-center shrink-0"
            >
              <div className="relative w-7 h-7">
                <Image src="/images/icons/whatsapp.png" alt="WhatsApp" fill className="object-contain" />
              </div>
            </a>

            {/* Scheme Saving Button */}
            {schemeData && (
              <a
                href={schemeData.schemeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 flex-1 border border-primary text-primary font-bold text-[12px] rounded-sm flex items-center justify-center whitespace-nowrap px-2 tracking-tight"
              >
                9 = 10 SAVING
              </a>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={onAddToCart}
              disabled={addingToCart}
              className="h-14 flex-[1.5] bg-primary text-white font-bold text-[13px] rounded-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {addingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ADD TO CART"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}