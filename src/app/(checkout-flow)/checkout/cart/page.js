"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, RotateCcw, BadgeCheck, ShieldCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { pushViewCart } from "@/lib/gtm";
import { calculateCouponDiscount } from "@/lib/coupons";
import { useAuth } from "@/hooks/useAuth";

import { apiFetch } from "@/lib/api";

// Prefer productId — that's the field carts/wishlists/orders key on (backend normalizes to numeric).
const getItemProductId = (item) => item.productId || item.shopifyId || item.id || item.handle || "";

import { removeFromCart, removeMultipleFromCart } from "@/redux/features/cart/cartSlice";


const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

// Empty-cart art: a line-drawn jewelry pouch holding a brilliant-cut solitaire.
// Monochrome (inherits `currentColor`) so it sits on the brand brown, with the
// sparkles pulled toward the lighter accent.
const SPARKLE_PATH = "M6 0C6 3.3 3.3 6 0 6c3.3 0 6 2.7 6 6 0-3.3 2.7-6 6-6-3.3 0-6-2.7-6-6Z";

function EmptyCartArt({ className = "" }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      {/* bag handle */}
      <path
        d="M46 46v-8c0-7.7 6.3-14 14-14s14 6.3 14 14v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* bag body */}
      <path
        d="M33 45h54l5 53a6 6 0 0 1-6 6.5H34a6 6 0 0 1-6-6.5l5-53Z"
        fill="currentColor"
        fillOpacity="0.03"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* solitaire */}
      <path
        d="M48 66h24l4 7-16 17-16-17 4-7Z"
        fill="currentColor"
        fillOpacity="0.07"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.45" strokeLinecap="round">
        <path d="M44 73h32" />
        <path d="M48 66l5 7M72 66l-5 7" />
        <path d="M53 73l7 17M67 73l-7 17" />
      </g>
      {/* sparkles */}
      <g className="fill-accent">
        <path d={SPARKLE_PATH} transform="translate(94 14) scale(1.25)" opacity="0.55" />
        <path d={SPARKLE_PATH} transform="translate(13 42) scale(0.85)" opacity="0.4" />
        <path d={SPARKLE_PATH} transform="translate(99 78) scale(0.7)" opacity="0.35" />
      </g>
    </svg>
  );
}


export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, totalQuantity, totalAmount, appliedCoupon } = useSelector((state) => state.cart);  
  const { user, isAuthenticated, openLogin } = useAuth();
  const summaryRef = useRef(null);
  const summaryBreakdownRef = useRef(null);

  const [socialProof, setSocialProof] = useState({});

  const cleanupInProgress = useRef(false);

  // Fallback: If user logs in while on cart page, and was trying to checkout, redirect them
  useEffect(() => {
    if (isAuthenticated) {
      const storedRedirect = localStorage.getItem("auth_redirect_path");
      if (storedRedirect === "/checkout/shipping") {
        localStorage.removeItem("auth_redirect_path");
        router.push("/checkout/shipping");
      }
    }
  }, [isAuthenticated, router]);

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
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
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
    if (isAuthenticated) {
      router.push("/checkout/shipping");
    } else {
      localStorage.setItem("auth_redirect_path", "/checkout/shipping");
      openLogin("/checkout/shipping");
    }
  };

  // Effect to cleanup orphaned BYJ charms
  useEffect(() => {
    if (items.length > 0 && !cleanupInProgress.current) {
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
  }, [items, user?.id, dispatch]);

  if (items.length === 0 || displayQuantity === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-5 py-6 lg:px-0 lg:pt-[60px] lg:pb-[80px] bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,#FAF5F3_0%,#FFFFFF_70%)]">
        <div className="w-full max-w-full text-center">
          {/* Illustration */}
          <div className="relative mx-auto mb-7 flex size-48 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary/[0.04]" />
            <span className="absolute inset-[14px] rounded-full border border-primary/10" />
            <span className="absolute inset-[30px] rounded-full border border-dashed border-accent/25" />
            <EmptyCartArt className="relative w-[116px] text-primary" />
          </div>

          <h1 className="font-abhaya text-[28px] lg:text-[32px] leading-tight font-bold text-primary">
            Your Cart is Empty
          </h1>

          {/* Ornament */}
          <div className="flex items-center justify-center gap-2 my-3.5" aria-hidden="true">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent/40" />
            <span className="size-1.5 rotate-45 bg-accent/50" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent/40" />
          </div>

          <p className="text-base leading-relaxed text-zinc-500 max-w-full mx-auto" style={{ maxWidth: "390px" }}>
            Nothing added yet. Explore our certified diamond &amp; gold jewelry and find a piece worth keeping.
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link prefetch={false} href="/collections/jewelry" className="sm:w-auto">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 px-8 uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 shadow-sm shadow-primary/20 cursor-pointer"
                style={{ padding: "12px 24px", letterSpacing: "0.7px", cursor: "pointer" }}
              >
                Shop Now
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link prefetch={false} href="/collections/bestsellers" className="sm:w-auto">
              <Button
                variant="outline"
                className="w-full border-primary/25 text-primary hover:bg-primary/5 hover:text-primary font-semibold h-12 px-8 uppercase tracking-widest rounded-sm bg-white cursor-pointer"
                style={{ padding: "12px 24px", letterSpacing: "0.7px", border: "1px solid #5a413f", cursor: "pointer" }}
              >
                Best Sellers
              </Button>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      {/* Mobile Header (LG Hidden) */}
      <div className="lg:hidden pt-6 px-4 bg-white">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-bold text-zinc-800 font-abhaya">My Shopping Cart</h1>
          <span className="text-sm text-zinc-500 font-medium">({displayQuantity} Item{displayQuantity !== 1 ? 's' : ''})</span>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto relative z-10 px-4">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          
          {/* Left Column: Cart Items (60%) */}
          <div className="grow lg:basis-[60%] lg:shrink-0 pt-6 pb-3 lg:py-10 lg:pr-12 bg-white">
            <div className="lg:sticky lg:top-10">
              <div className="hidden lg:flex items-baseline gap-2 mb-5">
                <h1 className="text-xl font-bold text-zinc-800 font-abhaya">My Shopping Cart</h1>
                <span className="text-sm text-zinc-500 font-medium">({displayQuantity} Item{displayQuantity !== 1 ? 's' : ''})</span>
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
            </div>
          </div>

          {/* Right Column: Order Summary (40%) */}
          <div className="w-full lg:basis-[40%] lg:shrink-0 lg:self-start relative" ref={summaryRef}>
            <div className="hidden lg:block absolute inset-y-0 left-0 w-screen bg-[#FAFAFA] border-l border-zinc-100 z-0" />
            
            <div className="relative z-10 pt-0 pb-8 lg:py-10 lg:pl-12 bg-[#FAFAFA] lg:bg-transparent min-h-full rounded-3xl lg:rounded-none">
              <div className="lg:sticky lg:top-6">
                <CartSummary onPlaceOrder={handlePlaceOrder} breakdownRef={summaryBreakdownRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EADFD8] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_15px_rgba(0,0,0,0.08)] z-[60]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col shrink-0">
            <span className="text-lg font-bold text-zinc-900 leading-none">₹ {finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <button
              onClick={scrollToSummary}
              className="text-[11px] font-bold text-accent uppercase tracking-tight mt-1 text-left whitespace-nowrap cursor-pointer"
            >
              View Order Summary
            </button>
          </div>
          <Button
            onClick={handlePlaceOrder}
            className="flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-[4px] bg-[#5A413F] h-[45px] px-3 font-figtree font-medium uppercase tracking-wide text-sm text-white whitespace-nowrap cursor-pointer"
          >
            Proceed To Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
