"use client";
import React from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, MessageCircle, Home, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

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
  const [hasTopAnimated, setHasTopAnimated] = React.useState(false);
  const [hasBottomAnimated, setHasBottomAnimated] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isTopVisible && !hasTopAnimated) {
      setHasTopAnimated(true);
    }
  }, [isTopVisible, hasTopAnimated]);

  React.useEffect(() => {
    if (isBottomVisible && !hasBottomAnimated) {
      setHasBottomAnimated(true);
    }
  }, [isBottomVisible, hasBottomAnimated]);

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

  const isBYJ = product?.tags?.includes("BYJ");

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
            {isBYJ ? (
              <Button
                asChild
                className="h-14 px-10 text-sm font-bold bg-primary hover:bg-accent text-white rounded-sm transition-colors uppercase tracking-wider min-w-40 flex items-center justify-center"
              >
                <Link href="/build-your-jewelry">BUILD YOUR JEWELRY</Link>
              </Button>
            ) : (
              <>
                {schemeData && (
                  <div className="hidden lg:flex items-center gap-2">
                    <a
                      href={schemeData.schemeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-14 px-6 border border-primary text-primary font-bold text-sm rounded-sm uppercase tracking-wider whitespace-nowrap hover:bg-primary/5 transition-colors flex items-center justify-center"
                    >
                      YOU SAVE <span className="mx-1 font-bold">₹{formatPrice(schemeData.saveAmount)}</span> WITH SCHEME
                    </a>
                  </div>
                )}

                <Button
                  onClick={onAddToCart}
                  disabled={addingToCart}
                  className="h-14 px-10 text-sm font-bold bg-primary hover:bg-accent text-white rounded-sm transition-colors uppercase tracking-wider min-w-40 relative overflow-hidden gold-shimmer"
                >
                  {addingToCart ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        initial={{ opacity: 0, x: -120 }}
                        animate={isTopVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -120 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center justify-center shrink-0"
                      >
                        <svg width={28} height={18} viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "28px", height: "18px" }}>
                          <path d="M1 1H3L4.07085 6M4.07085 6L5.66 13.42C5.75758 13.8749 6.01067 14.2815 6.37571 14.5699C6.74075 14.8582 7.19491 15.0103 7.66 15H17.44C17.8952 14.9993 18.3365 14.8433 18.691 14.5578C19.0456 14.2724 19.2921 13.8745 19.39 13.43L21.04 6H4.07085ZM7.95 19.95C7.95 20.5023 7.50228 20.95 6.95 20.95C6.39772 20.95 5.95 20.5023 5.95 19.95C5.95 19.3977 6.39772 18.95 6.95 18.95C7.50228 18.95 7.95 19.3977 7.95 19.95ZM18.95 19.95C18.95 20.5023 18.5023 20.95 17.95 20.95C17.3977 20.95 16.95 20.5023 16.95 19.95C16.95 19.3977 17.3977 18.95 17.95 18.95C18.5023 18.95 18.95 19.3977 18.95 19.95Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.span>
                      <span>ADD TO CART</span>
                    </span>
                  )}
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
              </>
            )}

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
              {!isBYJ && schemeData && (
                <a
                  href={schemeData.schemeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-14 flex-1 border border-primary text-primary font-semibold text-base rounded-sm flex items-center justify-center whitespace-nowrap px-2 hover:bg-accent/5 transition-colors uppercase"
                >
                  YOU SAVE <span className="mx-1 font-semibold">₹{formatPrice(schemeData.saveAmount)}</span> WITH SCHEME
                </a>
              )}
              <button
                onClick={onAddToCart}
                disabled={addingToCart}
                className="h-14 flex-[1.5] bg-primary text-white font-semibold text-base rounded-sm flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-[#8F5D5D] transition-colors relative overflow-hidden shimmer-btn"
              >
                {addingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center">
                    {isMounted && (
                      <motion.span
                        initial={{ width: 0, marginRight: 0, x: -350 }}
                        animate={hasBottomAnimated ? {
                          width: [0, 0, 28],
                          marginRight: [0, 0, 8],
                          x: [-350, 0]
                        } : {
                          width: 0,
                          marginRight: 0,
                          x: -350
                        }}
                        transition={{
                          ease: [0.16, 1, 0.3, 1],
                          x: { duration: 2.2, delay: 2 },
                          width: { duration: 2.2, times: [0, 0.6, 1], delay: 2 },
                          marginRight: { duration: 2.2, times: [0, 0.6, 1], delay: 2 }
                        }}
                        className="flex items-center justify-center shrink-0 overflow-hidden"
                      >
                        <svg width={28} height={18} viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "28px", height: "18px" }}>
                          <path d="M1 1H3L4.07085 6M4.07085 6L5.66 13.42C5.75758 13.8749 6.01067 14.2815 6.37571 14.5699C6.74075 14.8582 7.19491 15.0103 7.66 15H17.44C17.8952 14.9993 18.3365 14.8433 18.691 14.5578C19.0456 14.2724 19.2921 13.8745 19.39 13.43L21.04 6H4.07085ZM7.95 19.95C7.95 20.5023 7.50228 20.95 6.95 20.95C6.39772 20.95 5.95 20.5023 5.95 19.95C5.95 19.3977 6.39772 18.95 6.95 18.95C7.50228 18.95 7.95 19.3977 7.95 19.95ZM18.95 19.95C18.95 20.5023 18.5023 20.95 17.95 20.95C17.3977 20.95 16.95 20.5023 16.95 19.95C16.95 19.3977 17.3977 18.95 17.95 18.95C18.5023 18.95 18.95 19.3977 18.95 19.95Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.span>
                    )}
                    <span>ADD TO CART</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Layout: Full Width Style */}
          <div className="lg:hidden pointer-events-auto bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] -mx-4 px-4 py-3 flex items-center gap-2 w-screen">
            {/* WhatsApp Button */}
            <a
              href={`https://api.whatsapp.com/send/?phone=919004435760&text=Hi%2C+I+want+to+get+more+information+about+this+product%3A+${encodeURIComponent(product?.title || '')}&type=phone_number&app_absent=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 aspect-square bg-white shadow-md border border-zinc-100 rounded-sm flex items-center justify-center shrink-0"
            >
              <div className="relative w-7 h-7">
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_2eb7b2b4-f6af-4848-893e-8de612c3e6cb.png?v=1782542639" alt="WhatsApp" fill className="object-contain" />
              </div>
            </a>

            {/* Scheme Saving Button */}
            {!isBYJ && schemeData && (
              <a
                href={schemeData.schemeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-14 flex-1 border border-primary text-primary font-bold text-[13px] rounded-sm flex items-center justify-center whitespace-nowrap px-2"
              >
                9 = 10 SAVING
              </a>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={onAddToCart}
              disabled={addingToCart}
              className="h-14 flex-[1.5] bg-primary text-white font-semibold text-sm rounded-sm flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-[#8F5D5D] transition-colors relative overflow-hidden shimmer-btn"
            >
              {addingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center justify-center">
                  {isMounted && (
                    <motion.span
                      initial={{ width: 0, marginRight: 0, x: -350 }}
                      animate={hasBottomAnimated ? {
                        width: [0, 0, 28],
                        marginRight: [0, 0, 8],
                        x: [-350, 0]
                      } : {
                        width: 0,
                        marginRight: 0,
                        x: -350
                      }}
                      transition={{
                        ease: [0.16, 1, 0.3, 1],
                        x: { duration: 2.2, delay: 2 },
                        width: { duration: 2.2, times: [0, 0.6, 1], delay: 2 },
                        marginRight: { duration: 2.2, times: [0, 0.6, 1], delay: 2 }
                      }}
                      className="flex items-center justify-center shrink-0 overflow-hidden"
                    >
                      <svg width={28} height={18} viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "28px", height: "18px" }}>
                        <path d="M1 1H3L4.07085 6M4.07085 6L5.66 13.42C5.75758 13.8749 6.01067 14.2815 6.37571 14.5699C6.74075 14.8582 7.19491 15.0103 7.66 15H17.44C17.8952 14.9993 18.3365 14.8433 18.691 14.5578C19.0456 14.2724 19.2921 13.8745 19.39 13.43L21.04 6H4.07085ZM7.95 19.95C7.95 20.5023 7.50228 20.95 6.95 20.95C6.39772 20.95 5.95 20.5023 5.95 19.95C5.95 19.3977 6.39772 18.95 6.95 18.95C7.50228 18.95 7.95 19.3977 7.95 19.95ZM18.95 19.95C18.95 20.5023 18.5023 20.95 17.95 20.95C17.3977 20.95 16.95 20.5023 16.95 19.95C16.95 19.3977 17.3977 18.95 17.95 18.95C18.5023 18.95 18.95 19.3977 18.95 19.95Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.span>
                  )}
                  <span>ADD TO CART</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
