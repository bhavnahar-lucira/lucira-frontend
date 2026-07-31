"use client";

import { Button } from "@/components/ui/button";
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
import { applyCoupon, removeCoupon, removePoints } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import CartContact from "./CartContact";
import CouponDrawer from "@/components/coupons/CouponDrawer";
import CouponCard from "@/components/coupons/CouponCard";
import { COUPONS, COUPON_DISCLAIMER, getApplicableCouponCode, getApplicableCouponCodes, calculateCouponDiscount } from "@/lib/coupons";
import { apiFetch } from "@/lib/api";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const SILVER_PENDANT_VARIANT_ID = "gid://shopify/ProductVariant/48052809498842";

export default function CartSummary({ onPlaceOrder, breakdownRef = null }) {
  const dispatch = useDispatch();
  // One drawer serves both breakpoints — it slides in from the right on desktop
  // and up from the bottom on mobile, so the old Dialog/Sheet pair is gone.
  const [isCouponDrawerOpen, setIsCouponDrawerOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applyingCode, setApplyingCode] = useState(null);
  // Which listed coupon is mid-apply, so only that card shows a spinner.
  
  const { items, totalAmount, totalQuantity, appliedCoupon, updateCartItem, removeFromCart, nectorPoints } = useCart();
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
            qty += Number(item.quantity || item.qty || 1);
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

  const ETERNA_COUPON = "EMBRACE3%";

  const hasEternaTag = (tags) => Array.isArray(tags) && tags.some(t => typeof t === 'string' && (t.trim().toLowerCase() === 'embrace' || t.trim().toLowerCase() === 'eterna'));

  const eternaEligible = (items || []).some(item => 
    hasEternaTag(item.tags) || 
    (item.properties && (item.properties['Collection'] === 'Eterna' || item.properties['collection'] === 'Eterna'))
  );

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
        // Clearing the timer is not enough: once the request is in flight, its
        // resolution would re-dispatch applyCoupon and resurrect a coupon the
        // user just removed — which is why removing used to take several taps.
        let cancelled = false;

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
            if (cancelled) return;
            // A product-restricted coupon with nothing eligible left in the cart
            // must be dropped, not allowed to discount the whole cart.
            if (data.restricted && !data.applicableItemIds?.length) {
              dispatch(removeCoupon());
              return;
            }
            dispatch(applyCoupon({
              code: data.code,
              summary: data.summary,
              value: data.value,
              valueType: data.valueType,
              restricted: data.restricted,
              applicableItemIds: data.applicableItemIds
            }));
          } catch (err) {
          if (cancelled) return;
          dispatch(removeCoupon());
          toast.error("Coupon removed: items in cart are no longer eligible.", {
            icon: <Check className="w-4 h-4" />
          });
        }
      };
      const timer = setTimeout(validateCurrentCoupon, 500);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
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

  const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotal);

  const discount = couponDiscountAmount;
  const shipping = 0; 
  const grandTotal = subtotal + insuranceAmount - discount + shipping;

  // codeOverride is passed when a listed coupon card is tapped; otherwise the
  // code typed into the drawer's input is used.
  const handleApplyCoupon = async (codeOverride) => {
    const code = (codeOverride ?? couponCode).trim();
    if (!code) return;
    setIsApplying(true);
    if (codeOverride) setApplyingCode(code);
    try {
      const data = await apiFetch("/api/cart/coupon/validate", {
        method: "POST",
        body: JSON.stringify({
          items,
          couponCode: code,
          customerEmail: user?.email
        }),
        suppressErrorLog: true
      });
      // A product-restricted coupon with nothing eligible in the cart must be
      // blocked, not allowed to discount the whole cart.
      if (data.restricted && !data.applicableItemIds?.length) {
        toast.error('This coupon is not applicable to the items in your cart.');
        return;
      }
      if (nectorPoints) {
        dispatch(removePoints());
        toast.info("Loyalty points removed as a coupon is applied.", {
          icon: <Check className="w-4 h-4" />
        });
      }

      dispatch(applyCoupon({
        code: data.code,
        summary: data.summary,
        value: data.value,
        valueType: data.valueType,
        restricted: data.restricted,
        applicableItemIds: data.applicableItemIds
      }));
      toast.success(`Coupon "${data.code}" applied!`);
      setIsCouponDrawerOpen(false);
      setCouponCode("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsApplying(false);
      setApplyingCode(null);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    toast.error("Coupon removed", {
      icon: <Check className="w-4 h-4" />
    });
  };

  // Shared by the "Proceed To Checkout" CTA, requiring login before proceeding.
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



  // Tiers run off diamondTotal, not subtotal: these coupons do not apply to
  // plain gold, so only the diamond-bearing lines count toward the band. An
  // all-gold cart yields 0 and therefore no applicable coupon at all.
  // The tiers are exclusive bands, so at most one code ever qualifies; the rest
  // render disabled in the drawer.
  const applicableCouponCode = getApplicableCouponCode(diamondTotal);
  const applicableCouponCodes = getApplicableCouponCodes(diamondTotal);

  // Lead with the coupon the customer can actually use — an applied one first,
  // otherwise the qualifying tier — so the drawer never opens on a disabled
  // card. The remaining coupons keep their original ladder order beneath it.
  const leadCouponCode = (appliedCoupon && couponDetails.code) || applicableCouponCode;
  const orderedCoupons = leadCouponCode
    ? [
        ...COUPONS.filter((c) => c.code.toUpperCase() === leadCouponCode.toUpperCase()),
        ...COUPONS.filter((c) => c.code.toUpperCase() !== leadCouponCode.toUpperCase()),
      ]
    : COUPONS;

  // Same tile in the mobile and desktop offer groups; both open the one drawer.
  const couponTrigger = (
    <button
      type="button"
      onClick={() => setIsCouponDrawerOpen(true)}
      className="flex items-center gap-4 w-full rounded-lg border border-[#EADFD8] bg-white p-3.5 shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] transition-colors hover:border-[#5A413F]/30 cursor-pointer"
    >
      <span className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF9F6] border border-[#EADFD8]">
        <Tag size={18} className="text-[#5A413F]" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-figtree font-medium text-sm lg:text-base leading-[1.3] text-[#3D2B28]" style={{
            fontFamily: "Figtree",
            fontSize: "1rem",
            lineHeight: "100%",
            letterSpacing: "0%",
            marginBottom: "4px",
            marginTop: "2px",
            color: "#000000",
            fontWeight: "600"
        }}>
          {appliedCoupon ? `Applied: ${couponDetails.code}` : "Apply Coupon"}
        </p>
        <p className="font-figtree font-normal text-xs lg:text-sm leading-[1.3] text-[#6B5B54]" style={{
            marginTop: "5px",
            fontFamily: "Figtree",
            fontWeight: "400",
            fontSize: "0.9rem",
            lineHeight: "140%",
            letterSpacing: "0%",
            color: "#000000"
        }}>
          Unlock exclusive savings on your order.
        </p>
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A413F] text-white shadow-sm">
        <ChevronRight size={16} />
      </span>
    </button>
  );

  return (
    <div className="space-y-4">


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
              <span className="font-semibold uppercase tracking-wide">{`Coupon (${couponDetails.code})`}</span>
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
      <div ref={breakdownRef} className="lg:hidden scroll-mt-20 space-y-4">
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
                  <span className="font-semibold uppercase tracking-wide">{`Coupon (${couponDetails.code})`}</span>
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
          
          {couponTrigger}

          <InsuranceOption />
        </div>
      </div>

      {/* Desktop Only Actions & Options */}
      <div className="hidden lg:block space-y-4">

        <Button
          onClick={handleProceedToCheckout}
          className="w-full flex shrink-0 items-center justify-center gap-1.5 lg:gap-2 rounded-[4px] bg-[#5A413F] h-14 lg:h-14 px-4 lg:px-6 font-figtree font-medium uppercase tracking-wide text-lg text-white cursor-pointer"
        >
          Proceed To Checkout
        </Button>
        
        <GoldCoinOption />

        <div className="space-y-3">


          {couponTrigger}
        </div>

        <InsuranceOption />
      </div>

      {/* Desktop Only Contact Section */}
      <CartContact productName={firstProductName} />

      {/* Saving Zone — one drawer for both breakpoints, rendered once at the
          root so the mobile/desktop trigger groups share a single instance. */}
      <CouponDrawer
        open={isCouponDrawerOpen}
        onClose={() => setIsCouponDrawerOpen(false)}
        title="Saving Zone"
      >
        {/* Manual code entry — locked while a coupon is live, since a cart can
            only carry one at a time. */}
        <div className="flex items-stretch gap-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && couponCode.trim() && !isApplying && !appliedCoupon) handleApplyCoupon();
            }}
            disabled={!!appliedCoupon}
            placeholder="Enter Coupon Code"
            className="h-12 flex-1 rounded-[8px] border-[#EADFD8] bg-white font-figtree text-sm font-semibold tracking-[0.1em] uppercase text-[#3D2B28] placeholder:text-[#B9A79E] placeholder:font-medium placeholder:tracking-normal placeholder:normal-case focus-visible:ring-2 focus-visible:ring-[#5A413F]/30 focus-visible:border-[#5A413F] disabled:opacity-55"
          />
          <Button
            onClick={() => handleApplyCoupon()}
            disabled={isApplying || !couponCode.trim() || !!appliedCoupon}
            className="h-12 shrink-0 rounded-[8px] bg-[#5A413F] hover:bg-[#4A3533] px-5 font-figtree uppercase font-semibold tracking-[0.1em] text-xs text-white transition-colors disabled:opacity-50"
          >
            {isApplying && !applyingCode ? <Loader2 className="animate-spin" /> : "Apply"}
          </Button>
        </div>

        {appliedCoupon && (
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5">
            <p className="font-figtree text-xs font-medium leading-[1.4] text-emerald-700">
              Only one coupon can be used at a time.
            </p>
            <button
              onClick={handleRemoveCoupon}
              className="shrink-0 font-figtree text-[11px] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {!user ? (
          <div className="rounded-[8px] border border-[#EADFD8] bg-[#FFF8F6] px-5 py-6 flex flex-col items-center justify-center text-center mt-2">
            <div className="w-12 h-12 rounded-full bg-[#5A413F]/10 flex items-center justify-center mb-3">
              <Gift className="w-6 h-6 text-[#5A413F]" />
            </div>
            <h4 className="font-figtree font-semibold text-[#3D2B28] text-sm md:text-base mb-1.5 uppercase tracking-wide">
              Login to Unlock Coupons
            </h4>
            <p className="font-figtree text-xs md:text-sm text-[#6B5B54] mb-4">
              Login or register to access members-only discounts and rewards.
            </p>
            <Button
              onClick={() => {
                setIsCouponDrawerOpen(false);
                openLogin();
              }}
              className="h-11 px-6 rounded-[8px] bg-[#5A413F] hover:bg-[#4A3533] font-figtree uppercase font-semibold tracking-wide text-xs text-white transition-colors cursor-pointer"
            >
              Login / Register
            </Button>
          </div>
        ) : (
          <>
            {/* Every card is disabled — say why rather than leaving a dead list */}
            {!appliedCoupon && applicableCouponCodes.length === 0 && items.length > 0 && (
              <div className="rounded-[8px] border border-[#EADFD8] bg-white px-3.5 py-2.5">
                <p className="font-figtree text-xs font-medium leading-[1.4] text-[#6B5B54]">
                  These coupons apply to diamond products only. Add a diamond product to unlock them.
                </p>
              </div>
            )}

            {/* The same coupon ladder the PDP shows, in the same card design */}
            {(() => {
              const baseCoupons = [...COUPONS];
              if (eternaEligible) {
                baseCoupons.unshift({
                  code: "EMBRACE3%",
                  title: "Additional 3% off*",
                  condition: "On Eterna Collection Products"
                });
              }
              const allApplicable = [...applicableCouponCodes];
              if (eternaEligible) allApplicable.push("EMBRACE3%");

              const referenceOrder = [...baseCoupons];

              return baseCoupons
                .sort((a, b) => {
                  // Always pin EMBRACE3% to the very top
                  if (a.code === "EMBRACE3%") return -1;
                  if (b.code === "EMBRACE3%") return 1;

                  const aApp = allApplicable.includes(a.code);
                  const bApp = allApplicable.includes(b.code);

                  if (aApp && !bApp) return -1;
                  if (!aApp && bApp) return 1;

                  if (aApp && bApp) {
                     return referenceOrder.findIndex(c => c.code === b.code) - referenceOrder.findIndex(c => c.code === a.code);
                  }
                  return referenceOrder.findIndex(c => c.code === a.code) - referenceOrder.findIndex(c => c.code === b.code);
                })
                .map((coupon) => (
                  <div key={coupon.code} className="w-full">
                    <CouponCard
                      coupon={coupon}
                      className="w-full"
                      mode="apply"
                      onApply={handleApplyCoupon}
                      onRemove={handleRemoveCoupon}
                      applyingCode={applyingCode}
                      appliedCode={appliedCoupon ? couponDetails.code : null}
                      isApplicable={allApplicable.includes(coupon.code)}
                    />
                  </div>
                ));
            })()}
          </>
        )}

        <p className="text-[11px] text-zinc-500 font-figtree font-medium text-center pt-2 leading-relaxed">
          {COUPON_DISCLAIMER}
        </p>
      </CouponDrawer>
    </div>
  );
}
