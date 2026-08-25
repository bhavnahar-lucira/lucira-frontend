"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import CartItem from "@/components/cart/CartItem";
import CartViewLiveBanner from "@/components/cart/CartViewLiveBanner";
import CartSummary from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { pushViewCart } from "@/lib/gtm";
import { calculateCouponDiscount } from "@/lib/coupons";
import { useAuth } from "@/hooks/useAuth";

import { apiFetch } from "@/lib/api";
import { isFreeGiftVariant } from "@/lib/freeGifts";

// Prefer productId — that's the field carts/wishlists/orders key on (backend normalizes to numeric).
const getItemProductId = (item) => item.productId || item.shopifyId || item.id || item.handle || "";

import { removeFromCart, removeMultipleFromCart } from "@/redux/features/cart/cartSlice";


const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, totalQuantity, totalAmount, appliedCoupon, loading } = useSelector((state) => state.cart);
  const { user, isAuthenticated, openLogin } = useAuth();
  const summaryRef = useRef(null);
  const summaryBreakdownRef = useRef(null);

  const [socialProof, setSocialProof] = useState({});

  const cleanupInProgress = useRef(false);

  // Purge any legacy auth_redirect_path from localStorage to prevent unwanted redirects
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_redirect_path");
    }
  }, []);

  const finalAmount = useMemo(() => {
    const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
    const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
    const subtotalValue = (totalAmount || 0) - insuranceValue;

    const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotalValue);

    return subtotalValue + insuranceValue - couponDiscountAmount;
  }, [items, totalAmount, appliedCoupon]);

  const scrollToSummary = () => {
    // Land on the order summary rather than the top of the column, which sits above
    // the offer banner. Falls back to the column if the summary isn't rendered.
    const target = summaryBreakdownRef.current || summaryRef.current;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

const filteredItems = items.filter(
    (item) =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !item.isFreeGift &&
      !isFreeGiftVariant(item.variantId) &&
      !item.properties?.['_byj_parent'] &&
      !item.properties?.[' _byj_parent'] && // Handle potential space in key
      !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
  );

  const displayQuantity = filteredItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Fetch real social-proof counts (orders / add-to-cart / wishlist) for the cart's products.
  const proofKey = filteredItems.map(getItemProductId).filter(Boolean).join(",");
  useEffect(() => {
    if (!proofKey) return;
    let active = true;
    apiFetch("/api/products/social-proof", {
      method: "POST",
      body: JSON.stringify({ productIds: proofKey.split(",") }),
      suppressErrorLog: true,
    })
      .then((data) => { if (active) setSocialProof(data?.counts || {}); })
      .catch(() => { /* graceful: no band shown */ });
    return () => { active = false; };
  }, [proofKey]);

  const handlePlaceOrder = () => {
    router.push("/checkout/shipping");
  };

  // Effect to cleanup orphaned BYJ charms and empty cart state
  useEffect(() => {
    if (items.length > 0 && !cleanupInProgress.current) {
      // If there are no real products left in the cart, clean up all accessories (gifts, insurance, coins)
      if (displayQuantity === 0) {
        cleanupInProgress.current = true;
        const lineIds = items.map(c => c.lineId).filter(Boolean);
        const variantIds = items.map(c => c.variantId).filter(Boolean);

        dispatch(removeMultipleFromCart({ 
          userId: user?.id, 
          lineIds, 
          variantIds 
        }))
        .unwrap()
        .catch((e) => {
          console.error("Failed to cleanup empty cart:", e);
        })
        .finally(() => {
          cleanupInProgress.current = false;
        });
        return;
      }

      const parentGroupIds = new Set(
        items
          .filter(item => item.properties?.['_byj_preview'])
          .map(item => item.properties?.['_byj_group_id'])
          .filter(Boolean)
      );

      const orphanedCharms = items.filter(item => {
        const groupId = item.properties?.['_byj_group_id'];
        const isCharm = item.properties?.['_byj_parent'] || item.properties?.[' _byj_parent'] || (groupId && !item.properties?.['_byj_preview']);
        return isCharm && groupId && !parentGroupIds.has(groupId);
      });

      if (orphanedCharms.length > 0) {
        cleanupInProgress.current = true;
        const lineIds = orphanedCharms.map(c => c.lineId).filter(Boolean);
        const variantIds = orphanedCharms.map(c => c.variantId).filter(Boolean);

        dispatch(removeMultipleFromCart({ 
          userId: user?.id, 
          lineIds, 
          variantIds 
        }))
        .unwrap()
        .catch((e) => {
          console.error("Failed to cleanup orphaned charms:", e);
        })
        .finally(() => {
          cleanupInProgress.current = false;
        });
      }
    }
  }, [items, displayQuantity, user?.id, dispatch]);

  // Track if cart has been fetched at least once
  const cartFetched = useRef(false);
  useEffect(() => {
    if (!loading) {
      cartFetched.current = true;
    }
  }, [loading]);

  // We only want to show the full page skeleton on the initial load, not on every quantity update.
  if (loading && !cartFetched.current) {
    return (
      <div className="bg-white min-h-screen overflow-x-clip">
        <div className="container-main relative z-10 lg:!max-w-[2100px] lg:!w-[94%]">
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
            <div className="grow lg:basis-[60%] lg:shrink-0 pt-[6px] pb-0 lg:py-10 lg:pl-0 lg:pr-[20px] bg-white">
              <div className="space-y-10 animate-pulse mt-4">
                <div className="hidden lg:flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
                  <div className="h-6 w-40 bg-zinc-200 rounded-md" />
                  <div className="h-6 w-20 bg-zinc-100 rounded-full" />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="size-24 lg:size-32 bg-zinc-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-5 w-3/4 bg-zinc-200 rounded" />
                      <div className="h-4 w-1/2 bg-zinc-100 rounded" />
                      <div className="h-6 w-1/4 bg-zinc-200 rounded mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full lg:basis-[40%] lg:shrink-0 py-10 px-4 lg:pl-12 lg:bg-transparent bg-[#FAFAFA]">
              <div className="space-y-8 animate-pulse lg:pt-4">
                <div className="space-y-6">
                  <div className="h-6 w-32 bg-zinc-200 rounded-md lg:hidden" />
                  <div className="space-y-4 pt-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-4 w-24 bg-zinc-100 rounded" />
                        <div className="h-4 w-16 bg-zinc-100 rounded" />
                      </div>
                    ))}
                    <div className="border-t border-zinc-100 pt-4 flex justify-between items-center">
                      <div className="h-5 w-32 bg-zinc-200 rounded" />
                      <div className="h-6 w-24 bg-zinc-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && (items.length === 0 || displayQuantity === 0)) {
    return (
      <div className="bg-white min-h-screen overflow-x-clip">
        <div className="container-main relative z-10 lg:!max-w-[2100px] lg:!w-[94%]">
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-14 px-4">
            <div className="w-full max-w-md">
              <div className="bg-[#F5F5F5] lg:bg-[#F9F9F9] border border-zinc-100 rounded-[10px] px-6 py-12 md:px-10 md:py-14 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#FDF1EC] flex items-center justify-center mb-6">
                  <ShoppingBag size={32} className="text-[#5A413F]" strokeWidth={1.5} />
                </div>
                <h1 className="text-[1.5rem] md:text-[1.75rem] font-bold text-zinc-900 font-abhaya mb-2">Your Cart is Empty</h1>
                <p className="text-zinc-500 font-figtree text-[0.9375rem] max-w-xs mx-auto mb-8">
                  Looks like you haven&apos;t added anything to your cart yet. Explore our collections to find something you&apos;ll love.
                </p>
                <Link prefetch={false} href="/collections/jewelry" className="w-full">
                  <Button className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] transition-colors h-[50px] font-figtree font-medium uppercase tracking-wider text-[1rem] text-white cursor-pointer">
                    Shop Now
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-10 mt-8">
                <div className="flex items-center gap-3">
                  <Image
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/igi-certified.png?v=1786168166"
                    alt="IGI Certified"
                    width={64}
                    height={64}
                    className="w-9 h-9 shrink-0 object-contain"
                  />
                  <span className="font-figtree text-[13px] font-semibold text-black leading-tight">IGI Certified</span>
                </div>
                <div className="flex items-center gap-3">
                  <Image
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/bsi-hallmarked.png?v=1786168167"
                    alt="BSI Hallmarked"
                    width={64}
                    height={64}
                    className="w-9 h-9 shrink-0 object-contain"
                  />
                  <span className="font-figtree text-[13px] font-semibold text-black leading-tight">BSI Hallmarked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-clip">
      {/* Mobile Header (LG Hidden) */}

      <div className="container-main relative z-10 lg:!max-w-[2100px] lg:!w-[94%]">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          
          {/* Left Column: Cart Items (60%) */}
          <div className="grow lg:basis-[60%] lg:shrink-0 pt-[6px] pb-0 lg:py-10 lg:pl-0 lg:pr-[20px] bg-white">
            {/* Trust Badges (Mobile) */}
            <div className="lg:hidden flex items-center justify-center gap-10 pt-0 pb-[6px] border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-3">
                <Image
                  src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/igi-certified.png?v=1786168166"
                  alt="IGI Certified"
                  width={64}
                  height={64}
                  className="w-10 h-10 shrink-0 object-contain"
                />
                <span className="font-figtree text-[14px] font-semibold text-black leading-tight">IGI Certified</span>
              </div>
              <div className="flex items-center gap-3">
                <Image
                  src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/bsi-hallmarked.png?v=1786168167"
                  alt="BSI Hallmarked"
                  width={64}
                  height={64}
                  className="w-10 h-10 shrink-0 object-contain"
                />
                <span className="font-figtree text-[14px] font-semibold text-black leading-tight">BSI Hallmarked</span>
              </div>
            </div>

            <div className="lg:sticky lg:top-10">
              <div className="hidden lg:flex items-center justify-start gap-[12px] mb-6 pb-4 border-b border-[#ebebeb]">
                <h1 className="text-[18px] lg:text-[1.2rem] font-semibold text-zinc-900 font-figtree tracking-tight">My Shopping Cart</h1>
                <span className="shrink-0 rounded-full border-0 bg-[#fdf1ec] px-[16px] py-[4px] lg:px-[12px] lg:py-[2px] text-[11px] lg:text-[0.8rem] font-bold uppercase tracking-wider text-[#5a413f] whitespace-nowrap">
                  {displayQuantity} Item{displayQuantity !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="hidden lg:block">
                <CartViewLiveBanner items={filteredItems} />
              </div>

              <div className="space-y-4">
               {filteredItems.map((item, index) => (
                  <CartItem 
                    key={item.id || `${item.variantId}-${index}`} 
                    item={item} 
                    onAuthRequired={openLogin}
                    socialProof={socialProof[getItemProductId(item)]}
                  />
                ))}
              </div>

              <div className="lg:hidden mt-4">
                <CartViewLiveBanner items={filteredItems} />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (40%) */}
          <div className="w-full lg:basis-[40%] lg:shrink-0 relative" ref={summaryRef}>
            <div className="hidden lg:block absolute inset-y-0 left-0 w-screen border-l border-zinc-100 z-0" />
            
            <div className="relative z-10 pt-0 pb-0 lg:py-10 lg:pl-12 lg:bg-transparent min-h-full rounded-3xl lg:rounded-none">
              <div className="lg:sticky lg:top-6">
                <CartSummary onPlaceOrder={handlePlaceOrder} breakdownRef={summaryBreakdownRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-semibold text-black leading-none font-figtree tracking-normal">
              ₹{finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <button
              onClick={scrollToSummary}
              className="text-[14px] font-medium text-black cursor-pointer font-figtree"
            >
              View Order Summary
            </button>
          </div>
          <Button
            onClick={handlePlaceOrder}
            className="w-full flex items-center justify-center rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] transition-colors h-[50px] font-figtree font-medium uppercase tracking-wider text-[1rem] lg:text-[1.0625rem] text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            Proceed To Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
