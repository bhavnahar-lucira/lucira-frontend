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

// Prefer productId — that's the field carts/wishlists/orders key on (backend normalizes to numeric).
const getItemProductId = (item) => item.productId || item.shopifyId || item.id || item.handle || "";

import { removeFromCart, removeMultipleFromCart } from "@/redux/features/cart/cartSlice";


const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 space-y-6 bg-white">
        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100 mb-2">
          <ShoppingBag size={40} className="text-zinc-300" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-zinc-800 font-abhaya">Your cart is empty</h1>
          <p className="text-zinc-500 max-w-xs mx-auto">Looks like you haven&apos;t added anything to your cart yet.</p>
        </div>
        <Link prefetch={false} href="/collections/jewelry">
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 uppercase tracking-widest rounded-sm flex items-center gap-2">
            Shop Now
            <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-clip">
      {/* Mobile Header (LG Hidden) */}

      <div className="max-w-7xl w-full mx-auto relative z-10 px-4">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          
          {/* Left Column: Cart Items (60%) */}
          <div className="grow lg:basis-[60%] lg:shrink-0 pt-[6px] pb-0 lg:py-10 lg:pr-12 bg-white">
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
                <h1 className="text-[18px] font-bold text-zinc-900 font-figtree tracking-tight">My Shopping Cart</h1>
                <span className="shrink-0 rounded-full border-0 bg-[#fdf1ec] px-[16px] py-[4px] text-[11px] font-bold uppercase tracking-wider text-[#5a413f] whitespace-nowrap">
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
            <div className="hidden lg:block absolute inset-y-0 left-0 w-screen bg-[#FAFAFA] border-l border-zinc-100 z-0" />
            
            <div className="relative z-10 pt-0 pb-8 lg:py-10 lg:pl-12 lg:bg-transparent min-h-full rounded-3xl lg:rounded-none">
              <div className="lg:sticky lg:top-6">
                <CartSummary onPlaceOrder={handlePlaceOrder} breakdownRef={summaryBreakdownRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EADFD8] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-[60]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col shrink-0">
            <span className="text-lg font-bold text-zinc-900 leading-none">₹ {finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <button
              onClick={scrollToSummary}
              className="text-[11px] font-bold text-accent uppercase tracking-tight mt-1 text-left whitespace-nowrap"
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
