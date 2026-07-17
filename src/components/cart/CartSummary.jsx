"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetDescription } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Tag, Phone, MessageSquare, Gift, Truck, MessageCircle, ChevronRight, X, Loader2, CircleChevronRight, BadgePercent, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { pushPromoClick } from "@/lib/gtm";
import { useAuth } from "@/hooks/useAuth";
import InsuranceOption from "./InsuranceOption";
import GoldCoinOption, { GOLDCOIN_VARIANT_ID } from "./GoldCoinOption";
import { useCart } from "@/hooks/useCart";
import { applyCoupon, removeCoupon } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import CartContact from "./CartContact";
import { apiFetch } from "@/lib/api";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const SILVER_PENDANT_VARIANT_ID = "gid://shopify/ProductVariant/48052809498842";

export default function CartSummary({ onPlaceOrder }) {
  const dispatch = useDispatch();
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [isCouponSheetOpen, setIsCouponSheetOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  
  const { items, totalAmount, totalQuantity, appliedCoupon, updateCartItem, removeFromCart } = useCart();
  const user = useSelector((state) => state.user.user);
  const { openLogin } = useAuth();
  const [goldCoinConfig, setGoldCoinConfig] = useState({ enabled: true, threshold: 20000 });

  useEffect(() => {
    apiFetch("/api/settings/gold-coin")
      .then(data => {
        setGoldCoinConfig({
          enabled: data.enabled ?? false,
          threshold: Number(data.threshold) || 20000
        });
      })
      .catch(err => console.error("Error fetching gold coin threshold:", err));
  }, []);

  const otherItemsQuantity = (() => {
    let qty = 0;
    const byjGroups = new Set();
    items
      .filter(item => 
        item.variantId !== INSURANCE_VARIANT_ID && 
        !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
        item.variantId !== SILVER_PENDANT_VARIANT_ID
      )
      .forEach(item => {
        const byjGroupId = item.properties?.['_byj_group_id'];
        if (byjGroupId) {
          if (!byjGroups.has(byjGroupId)) {
            byjGroups.add(byjGroupId);
            qty += 1;
          }
        } else {
          qty += Number(item.quantity || item.qty || 1);
        }
      });
    return qty;
  })();

  const diamondTotal = items
    .filter(item => 
      item.variantId !== INSURANCE_VARIANT_ID && 
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      item.variantId !== SILVER_PENDANT_VARIANT_ID
    )
    .reduce((acc, item) => {
        const itemQty = Number(item.quantity || item.qty || 1);
        let charges = Number(item.diamondCharges || 0);
        
        // Robust Fallback: Try parsing variant_config if diamondCharges is 0
        if (charges === 0 && item.metafields?.variant_config) {
            try {
                const config = JSON.parse(item.metafields.variant_config);
                if (config.advanced_stone_config) {
                    charges = config.advanced_stone_config.reduce((sAcc, s) => sAcc + (s.stone_weight * 50000), 0);
                } else if (config.diamond_charges) {
                    charges = config.diamond_charges;
                }
            } catch(e) {}
        }

        // Final fallback: If it's a diamond ring but charges still 0, use price
        if (charges === 0 && (item.title?.toLowerCase().includes("diamond") || item.handle?.toLowerCase().includes("diamond"))) {
           charges = item.price;
        }

        if (charges > 0) {
            return acc + (Number(item.price) * itemQty);
        }
        return acc;
    }, 0);

  const eligibleGoldCoins = Math.max(0, Math.floor(diamondTotal / goldCoinConfig.threshold));

  const insuranceItem = items.find(item => item.variantId === INSURANCE_VARIANT_ID);
  const insuranceAmount = insuranceItem ? insuranceItem.price * (Number(insuranceItem.quantity || insuranceItem.qty || 1)) : 0;

  const goldCoinItem = items.find(item => item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift);

  const firstProductName = items.find(item =>
    item.variantId !== INSURANCE_VARIANT_ID &&
    !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
    item.variantId !== SILVER_PENDANT_VARIANT_ID
  )?.title;

  // Auto-sync insurance and gold coin quantities
  useEffect(() => {
    // Sync Insurance
    if (insuranceItem) {
      const currentInsQty = Number(insuranceItem.quantity || insuranceItem.qty || 0);
      if (otherItemsQuantity <= 0) {
        removeFromCart(INSURANCE_VARIANT_ID);
      } else if (currentInsQty !== otherItemsQuantity) {
        updateCartItem({
          currentVariantId: INSURANCE_VARIANT_ID,
          quantity: otherItemsQuantity
        });
      }
    }

    // Sync Gold Coin
    if (goldCoinItem && goldCoinItem.isFreeGift) {
      const currentCoinQty = Number(goldCoinItem.quantity || goldCoinItem.qty || 0);
      
      // Remove if promotion is disabled OR if eligibility threshold not met
      if (!goldCoinConfig.enabled || eligibleGoldCoins <= 0) {
        removeFromCart(goldCoinItem.lineId || GOLDCOIN_VARIANT_ID);
      } else if (currentCoinQty !== eligibleGoldCoins) {
        updateCartItem({
          lineId: goldCoinItem.lineId,
          currentVariantId: GOLDCOIN_VARIANT_ID,
          quantity: eligibleGoldCoins
        });
      }
    }
  }, [otherItemsQuantity, insuranceItem?.quantity, insuranceItem?.qty, eligibleGoldCoins, goldCoinItem?.quantity, goldCoinItem?.qty, updateCartItem, removeFromCart, goldCoinConfig.enabled]);

  const couponDetails = (appliedCoupon && typeof appliedCoupon === 'object') 
    ? appliedCoupon 
    : { code: appliedCoupon || "", summary: "Applied", value: 0, valueType: "FIXED_AMOUNT" };

  // Re-validate coupon when items change
  useEffect(() => {
    if (appliedCoupon && items.length === 0) {
      dispatch(removeCoupon());
      return;
    }

    if (appliedCoupon && items.length > 0 && couponDetails?.code) {
        const validateCurrentCoupon = async () => {
          try {
            const data = await apiFetch("/api/cart/coupon/validate", {
              method: "POST",
              body: JSON.stringify({ 
                items, 
                couponCode: couponDetails.code,
                customerEmail: user?.email 
              }),
              suppressErrorLog: true
            });
            // EMBRACE3% only applies to Eterna products; if none remain eligible,
            // drop the coupon instead of letting it discount the whole cart.
            if (data.code?.toUpperCase() === 'EMBRACE3%' && (!data.applicableItemIds || data.applicableItemIds.length === 0)) {
              dispatch(removeCoupon());
              return;
            }
            dispatch(applyCoupon({
              code: data.code,
              summary: data.summary,
              value: data.value,
              valueType: data.valueType,
              applicableItemIds: data.applicableItemIds
            }));
          } catch (err) {
          dispatch(removeCoupon());
          toast.error("Coupon removed: items in cart are no longer eligible.", {
            icon: <Check className="w-4 h-4" />
          });
        }
      };
      const timer = setTimeout(validateCurrentCoupon, 500);
      return () => clearTimeout(timer);
    }
  }, [items, appliedCoupon, couponDetails?.code, user?.email, dispatch]);

  // Sum of original prices (comparePrice if it is greater than price, otherwise price)
  const originalSubtotal = items
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      const originalPrice = compare > price ? compare : price;
      return acc + (originalPrice * qty);
    }, 0);

  // Total savings = sum of (original price - selling price) across all real cart products
  const totalSavings = items
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      return acc + (compare > price ? (compare - price) * qty : 0);
    }, 0);


  const subtotal = otherItemsQuantity > 0 ? (totalAmount - insuranceAmount) : 0;

  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (couponDetails.valueType === "FIXED_AMOUNT") {
      couponDiscountAmount = couponDetails.value;
    } else if (couponDetails.valueType === "PERCENTAGE") {
      if (couponDetails.applicableItemIds && couponDetails.applicableItemIds.length > 0) {
        const applicableSubtotal = items.filter(item => {
           if (item.variantId === INSURANCE_VARIANT_ID || (item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift)) return false;
           const rawId = item.shopifyId || item.productId || item.id;
           const gid = (rawId && rawId.toString().includes("gid://")) ? rawId : `gid://shopify/Product/${rawId}`;
           return couponDetails.applicableItemIds.includes(gid);
        }).reduce((acc, item) => {
          return acc + (Number(item.price || 0) * Number(item.quantity || 1));
        }, 0);
        couponDiscountAmount = (applicableSubtotal * couponDetails.value) / 100;
      } else if (String(couponDetails.code || "").toUpperCase() === "EMBRACE3%") {
        // EMBRACE3% is restricted to Eterna products. With no eligible items in
        // the cart the backend returns no applicableItemIds, so it must NOT fall
        // back to discounting the whole cart.
        couponDiscountAmount = 0;
      } else {
        couponDiscountAmount = (subtotal * couponDetails.value) / 100;
      }
    }
  }

  const discount = couponDiscountAmount; 
  const shipping = 0; 
  const grandTotal = subtotal + insuranceAmount - discount + shipping;

  const handleApplyCoupon = async (isMobile = false) => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    try {
      const data = await apiFetch("/api/cart/coupon/validate", {
        method: "POST",
        body: JSON.stringify({ 
          items, 
          couponCode: couponCode.trim(),
          customerEmail: user?.email 
        }),
        suppressErrorLog: true
      });
      // EMBRACE3% only applies to Eterna products. Block it when no eligible
      // item is present instead of discounting the whole cart.
      if (data.code?.toUpperCase() === 'EMBRACE3%' && (!data.applicableItemIds || data.applicableItemIds.length === 0)) {
        toast.error('This coupon is valid only on Eterna Collection products.');
        return;
      }
      dispatch(applyCoupon({
        code: data.code,
        summary: data.summary,
        value: data.value,
        valueType: data.valueType,
        applicableItemIds: data.applicableItemIds
      }));
      toast.success(data.code?.toUpperCase() === 'EMBRACE3%' ? 'Coupon applied!' : `Coupon "${data.code}" applied!`);
      if (isMobile) {
        setIsCouponSheetOpen(false);
      } else {
        setIsCouponDialogOpen(false);
      }
      setCouponCode("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    toast.error("Coupon removed", {
      icon: <Check className="w-4 h-4" />
    });
  };

  // Shared by the "Proceed To Checkout" CTA and the Eterna offer banner, which is a
  // shortcut to the same action ("Proceed to payment to unlock"), so the two can't drift.
  const handleProceedToCheckout = () => {
    // If user not logged in, fire promoClick and open login modal
    if (!user) {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const variantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
      const promoData = {
        creative_name: "cart page login popup",
        promo_id: firstItem?.sku || variantId || "",
        item_id: variantId || "",
        promo_position: "Cart Page",
      };
      try {
        pushPromoClick(promoData);
      } catch (e) {
        // swallow errors from analytics
        console.error('promo push failed', e);
      }
      openLogin();
      return;
    }
    onPlaceOrder();
  };

  // The Eterna offer banner is only relevant when the cart contains at least one
  // product tagged "embrace" (the Eterna Collection / EMBRACE3% eligible items).
  const hasEmbraceItem = items.some(item =>
    (item.tags || []).some(tag => String(tag).toLowerCase() === "embrace")
  );

  return (
    <div className="space-y-4">
      {/* Mobile Eterna Offer Banner - ON TOP so it's visible first */}
      {hasEmbraceItem && (
        <button
          type="button"
          onClick={handleProceedToCheckout}
          aria-label="Proceed to checkout to unlock the Eterna Collection bank discount"
          className="lg:hidden block w-full relative rounded-lg overflow-hidden shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] cursor-pointer transition-opacity active:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A413F]"
        >
          <Image unoptimized src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Eterna-Band.jpg" alt="Cart Offer Banner" width={600} height={200} className="w-full object-cover" />
        </button>
      )}

      {/* Desktop Pricing Breakdown (LG) */}
      <div className="hidden lg:block bg-white rounded-2xl p-6 space-y-3.5 border border-[#EADFD8] shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)]">
        <div className="flex justify-between items-center font-figtree text-base text-[#6B5B54]">
          <span>Subtotal</span>
          <span className="font-semibold text-[#3D2B28]">₹ {originalSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between items-center font-figtree text-base text-[#6B5B54]">
            <span>Savings</span>
            <span className="font-semibold text-[#189351] whitespace-nowrap">- ₹ {totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        {appliedCoupon && (
          <div className="flex justify-between items-center font-figtree text-base text-[#189351]">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wide">{couponDetails.code?.toUpperCase() === 'EMBRACE3%' ? 'Coupon Applied' : `Coupon (${couponDetails.code})`}</span>
              <button
                onClick={handleRemoveCoupon}
                className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter"
              >
                (Remove)
              </button>
            </div>
            <span className="font-semibold whitespace-nowrap">- ₹ {couponDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        {goldCoinItem && (
          <div className="flex justify-between items-center font-figtree text-base text-[#6B5B54]">
            <span>Free Gold Coin ({Number(goldCoinItem.quantity || goldCoinItem.qty || 1)})</span>
            <span className="font-semibold text-[#189351]">₹ 0</span>
          </div>
        )}
        {insuranceItem && (
          <div className="flex justify-between items-center font-figtree text-base text-[#6B5B54]">
            <span>Insurance</span>
            <span className="font-semibold text-[#3D2B28]">₹ {insuranceAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        <div className="flex justify-between items-center font-figtree text-base text-[#6B5B54]">
          <span>Shipping (Standard)</span>
          <span className="font-semibold text-[#189351]">Free</span>
        </div>

        <div className="border-t border-[#EADFD8] mt-4 pt-4 flex justify-between items-center">
          <span className="font-figtree text-base font-semibold text-[#3D2B28] uppercase tracking-[0.4px]">Grand Total</span>
          <span className="font-figtree text-2xl font-bold text-[#3D2B28]">₹ {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Mobile Order Summary (LG Hidden) */}
      <div className="lg:hidden space-y-4">
        <h3 className="font-figtree text-base font-semibold text-[#3D2B28] uppercase tracking-[0.4px] ml-1">Order Summary</h3>
        <div className="bg-white rounded-2xl p-6 space-y-4 border border-[#EADFD8] shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)]">
          <div className="space-y-3">
            <div className="flex justify-between font-figtree text-base text-[#6B5B54]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#3D2B28]">₹ {originalSubtotal.toLocaleString('en-IN')}</span>
            </div>

            {totalSavings > 0 && (
              <div className="flex justify-between font-figtree text-base text-[#6B5B54]">
                <span>Savings</span>
                <span className="font-semibold text-[#189351]">- ₹ {totalSavings.toLocaleString('en-IN')}</span>
              </div>
            )}

            {appliedCoupon && (
              <div className="flex justify-between font-figtree text-base items-center text-[#189351]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wide">{couponDetails.code?.toUpperCase() === 'EMBRACE3%' ? 'Coupon Applied' : `Coupon (${couponDetails.code})`}</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                  >
                    (Remove)
                  </button>
                </div>
                <span className="font-semibold">- ₹ {couponDiscountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {goldCoinItem && (
              <div className="flex justify-between font-figtree text-base text-[#6B5B54]">
                <span>Free Gold Coin ({Number(goldCoinItem.quantity || goldCoinItem.qty || 1)})</span>
                <span className="font-semibold text-[#189351]">₹ 0</span>
              </div>
            )}

            {insuranceItem && (
              <div className="flex justify-between font-figtree text-base text-[#6B5B54]">
                <span>Insurance</span>
                <span className="font-semibold text-[#3D2B28]">₹ {insuranceAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between font-figtree text-base text-[#6B5B54]">
              <span>Shipping (Standard)</span>
              <span className="font-semibold text-[#189351]">Free</span>
            </div>
          </div>

          <div className="border-t border-[#EADFD8] pt-4 flex justify-between items-center">
            <span className="font-figtree text-base font-semibold text-[#3D2B28] uppercase tracking-[0.4px]">Grand Total</span>
            <span className="font-figtree text-xl font-bold text-[#3D2B28]">₹ {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Mobile Offers Group (Coupon, Gold Coin, Insurance) - ALL BELOW SUMMARY */}
      <div className="lg:hidden space-y-6">
        <div className="space-y-4">
          <h3 className="text-[14px] font-bold text-[#443360] uppercase tracking-wider ml-1">Lucira Offers</h3>
          


          <GoldCoinOption />
          
          <Sheet open={isCouponSheetOpen} onOpenChange={setIsCouponSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="flex items-center gap-3 w-full rounded-lg border border-[#EADFD8] bg-white p-3.5 shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] transition-colors hover:border-[#5A413F]/30"
              >
                <span className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF9F6] border border-[#EADFD8]">
                  <Tag size={18} className="text-[#5A413F]" />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-figtree font-medium text-sm lg:text-base leading-[1.3] text-[#3D2B28]">
                    {appliedCoupon ? (couponDetails.code?.toUpperCase() === 'EMBRACE3%' ? 'Coupon Applied' : `Applied: ${couponDetails.code}`) : "Apply Coupon"}
                  </p>
                  <p className="font-figtree font-normal text-xs lg:text-sm leading-[1.3] text-[#6B5B54]">
                    Unlock exclusive savings on your order.
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A413F] text-white shadow-sm">
                  <ChevronRight size={16} />
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" onOpenAutoFocus={(e) => e.preventDefault()} className="rounded-t-2xl px-6 pb-8 pt-4 max-h-[85vh] overflow-y-auto [&>button]:hidden transition-all duration-300 ease-in-out focus-within:mb-0">
              <div className="absolute top-4 right-4">
                <SheetClose asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    aria-label="Close coupon panel"
                  >
                    <X size={16} />
                  </Button>
                </SheetClose>
              </div>
              <SheetHeader className="space-y-3">
                <div className="size-14 rounded-full bg-[#FEF9F6] border border-[#EADFD8] flex items-center justify-center text-[#5A413F] mx-auto mb-1 shadow-[0_2px_12px_-4px_rgba(90,65,63,0.15)]">
                  <Tag size={24} />
                </div>
                <SheetTitle className="text-[26px] font-normal text-center text-[#3D2B28] font-abhaya leading-tight">Apply Coupon</SheetTitle>
                <SheetDescription className="font-figtree text-base text-center text-[#6B5B54]">
                  Enter your coupon code below to unlock special discounts.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3.5 py-4">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter Coupon Code"
                  className="h-14 rounded-[8px] border-[#EADFD8] bg-[#FEF9F6] text-center font-figtree text-base font-semibold tracking-[0.15em] uppercase text-[#3D2B28] placeholder:text-[#B9A79E] placeholder:font-medium focus-visible:ring-2 focus-visible:ring-[#5A413F]/30 focus-visible:border-[#5A413F]"
                />
                <Button
                  onClick={() => handleApplyCoupon(true)}
                  disabled={isApplying || !couponCode.trim()}
                  className="w-full h-14 rounded-[8px] bg-[#5A413F] hover:bg-[#4A3533] font-figtree uppercase font-medium tracking-[0.15em] text-sm text-white transition-colors shadow-[0_4px_16px_-4px_rgba(90,65,63,0.35)] disabled:opacity-50 disabled:shadow-none"
                >
                  {isApplying ? <Loader2 className="animate-spin" /> : "Apply Coupon"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <InsuranceOption />
        </div>
      </div>

      {/* Desktop Only Actions & Options */}
      <div className="hidden lg:block space-y-4">
        {hasEmbraceItem && (
          <button
            type="button"
            onClick={handleProceedToCheckout}
            aria-label="Proceed to checkout to unlock the Eterna Collection bank discount"
            className="block w-full relative rounded-lg overflow-hidden shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] cursor-pointer transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5A413F]"
          >
            <Image unoptimized src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Eterna-Band.jpg" alt="Cart Offer Banner" width={600} height={200} className="w-full object-cover" />
          </button>
        )}
        <Button
          onClick={handleProceedToCheckout}
          className="w-full flex shrink-0 items-center justify-center gap-1.5 lg:gap-2 rounded-[4px] bg-[#5A413F] h-14 lg:h-14 px-4 lg:px-6 font-figtree font-medium uppercase tracking-wide text-lg text-white cursor-pointer"
        >
          Proceed To Checkout
        </Button>
        
        <GoldCoinOption />

        <div className="space-y-3">


          <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-3 w-full rounded-lg border border-[#EADFD8] bg-white p-3.5 shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] transition-colors hover:border-[#5A413F]/30 cursor-pointer"
              >
                <span className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF9F6] border border-[#EADFD8]">
                  <Tag size={18} className="text-[#5A413F]" />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-figtree font-medium text-sm lg:text-base leading-[1.3] text-[#3D2B28]">
                    {appliedCoupon ? (couponDetails.code?.toUpperCase() === 'EMBRACE3%' ? 'Coupon Applied' : `Applied: ${couponDetails.code}`) : "Apply Coupon"}
                  </p>
                  <p className="font-figtree font-normal text-xs lg:text-sm leading-[1.3] text-[#6B5B54]">
                    Unlock exclusive savings on your order.
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A413F] text-white shadow-sm">
                  <ChevronRight size={16} />
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl p-8">
              <DialogHeader className="space-y-3">
                <div className="size-14 rounded-full bg-[#FEF9F6] border border-[#EADFD8] flex items-center justify-center text-[#5A413F] mx-auto mb-1 shadow-[0_2px_12px_-4px_rgba(90,65,63,0.15)]">
                  <Tag size={24} />
                </div>
                <DialogTitle className="text-[26px] font-normal text-center text-[#3D2B28] font-abhaya leading-tight">Apply Coupon</DialogTitle>
                <DialogDescription className="font-figtree text-base text-center text-[#6B5B54]">
                  Enter your coupon code below to unlock special discounts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3.5 py-4">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter Coupon Code"
                  className="h-14 rounded-[8px] border-[#EADFD8] bg-[#FEF9F6] text-center font-figtree text-base font-semibold tracking-[0.15em] uppercase text-[#3D2B28] placeholder:text-[#B9A79E] placeholder:font-medium focus-visible:ring-2 focus-visible:ring-[#5A413F]/30 focus-visible:border-[#5A413F]"
                />
                <Button
                  onClick={() => handleApplyCoupon(false)}
                  disabled={isApplying || !couponCode.trim()}
                  className="w-full h-14 rounded-[8px] bg-[#5A413F] hover:bg-[#4A3533] font-figtree uppercase font-medium tracking-[0.15em] text-sm text-white transition-colors shadow-[0_4px_16px_-4px_rgba(90,65,63,0.35)] disabled:opacity-50 disabled:shadow-none"
                >
                  {isApplying ? <Loader2 className="animate-spin" /> : "Apply Coupon"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <InsuranceOption />
      </div>

      {/* Desktop Only Contact Section */}
      <CartContact productName={firstProductName} />
    </div>
  );
}