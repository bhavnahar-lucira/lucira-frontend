"use client";

import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { Phone, MessageSquare, Truck, MessageCircle, Coins, Loader2, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyPoints, removePoints, applyCoupon } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import CartContact from "./CartContact";
import { formatMetal } from "@/lib/metal";
import { apiFetch } from "@/lib/api";
import { getEstimatedDispatchDate } from "@/lib/utils";
import { calculateCouponDiscount, getAppliedOfferLabel } from "@/lib/coupons";
import { pushPromoClick } from "@/lib/gtm";
import { isFreeGiftVariant } from "@/lib/freeGifts";


const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";

export default function CheckoutSummary({
  showItems = true,
  showBreakdown = true,
  showPoints = true,
  showContact = true,
  className = "",
  breakdownRef = null,
  onApplyCoinsWarning = null,
  mobilePaymentCoinsTheme = false,
  compactBreakdown = false,
  children
}) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { items, totalAmount, appliedCoupon: rawAppliedCoupon, appliedCoupons, removeCoupon, nectorPoints, activeDiscounts, unclaimDiscount } = useCart();
  const user = useSelector((state) => state.user.user);

  const [pointsData, setPointsData] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  // Automatic Product Discounts rules (activeDiscounts, from the cart doc)
  // don't carry their own "Lucira Coins applicable" flag — only the
  // dashboard-driven coupon list does. Same live list CartSummary already
  // fetches for its own coinsApplicable/combineCoupons hydration, so the
  // payment-page nudge agrees with the cart page instead of assuming coins
  // always conflict with a claimed discount.
  const [dynamicCoupons, setDynamicCoupons] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/cart/coupons/active", { suppressErrorLog: true })
      .then((res) => {
        if (!cancelled && res?.coupons) setDynamicCoupons(res.coupons);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const rawClaimedProductDiscount = (activeDiscounts || []).find((d) => d.claimed);
  const claimedProductDiscount = rawClaimedProductDiscount
    ? {
        ...rawClaimedProductDiscount,
        coinsApplicable: !!dynamicCoupons?.find((c) => c.id === rawClaimedProductDiscount.id)?.coinsApplicable,
      }
    : null;

  // A persisted coupon can predate a dashboard toggle change — re-read
  // coinsApplicable from the live list before deciding anything (mirrors
  // CartSummary's hydratedAppliedCoupons for the same reason).
  const appliedCoupon = rawAppliedCoupon && typeof rawAppliedCoupon === "object"
    ? {
        ...rawAppliedCoupon,
        coinsApplicable: !!(dynamicCoupons?.find((c) => c.code.toUpperCase() === String(rawAppliedCoupon.code || "").toUpperCase())?.coinsApplicable ?? rawAppliedCoupon.coinsApplicable),
      }
    : rawAppliedCoupon;

  const firstProductName = (items || []).find(item =>
    item.variantId !== INSURANCE_VARIANT_ID &&
    !item.isFreeGift
  )?.title;

  const isPaymentPage = pathname && (pathname === "/checkout/payment" || pathname.includes("/checkout/payment"));

  const isCheckoutPage = pathname && pathname.startsWith("/checkout") && pathname !== "/checkout/cart";

  // Fetch Bracelet Price
  // Note: we can't easily know which one is active here initially, so we can fetch whichever is eligible or both.
  // Actually, we'll fetch the one we're eligible for after calculating diamondTotalForOffer.
  // Let's do it after we define eligibleBraceletId.
  // Dispatch Calculation
  const overallDispatchMessage = useMemo(() => {
    if (!items || items.length === 0) return "";
    const maxLeadTime = items.reduce((max, item) => Math.max(max, Number(item.leadTime || 12)), 0);
    const anyMadeToOrder = items.some(item => !item.inStock && item.variantId !== INSURANCE_VARIANT_ID && !item.isFreeGift);
    return getEstimatedDispatchDate(!anyMadeToOrder, maxLeadTime);
  }, [items]);

  // Calculate Diamond Total for Offers (Bracelet)
  const diamondTotalForOffer = useMemo(() => {
    return (items || []).reduce((acc, item) => {
      const type = (item.type || item.category || item.productType || item.product_type || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const tags = (item.tags || []).map(t => t.toLowerCase());
      const hasDiamondCharges = !!item.diamondCharges || (item.customAttributes?.some(attr => attr.key === "_Diamond Charges" && attr.value));

      const isDiamond = type.includes("diamond") || title.includes("diamond") ||
        type.includes("solitaire") || title.includes("solitaire") ||
        type.includes("gemstone") || title.includes("gemstone") ||
        tags.some(t => t.includes("diamond") || t.includes("solitaire")) ||
        hasDiamondCharges;

      // Exclude Gold Coins, Insurance, BYJ
      const isGoldCoin = item.isFreeGift;
      const isInsurance = item.variantId === INSURANCE_VARIANT_ID;
      const isBYJ = Boolean(
        item.properties?.['_byj_group_id'] ||
        item.properties?.['_byj_preview'] ||
        item.properties?.['_byj_parent'] ||
        item.properties?.[' _byj_parent'] ||
        tags.includes('byj') ||
        String(item.handle || "").toLowerCase().includes('byj') ||
        String(item.title || "").toLowerCase().includes('byj')
      );

      if (isDiamond && !isGoldCoin && !isInsurance && !isBYJ) {
        return acc + (Number(item.price || 0) * Number(item.quantity || 1));
      }
      return acc;
    }, 0);
  }, [items]);

  // Calculate if the cart has eligible diamond jewelry for COINS
  const hasDiamondJewellery = useMemo(() => {
    return (items || []).some(item => {
      const type = (item.type || item.category || item.productType || item.product_type || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const tags = (item.tags || []).map(t => t.toLowerCase());
      const hasDiamondCharges = !!item.diamondCharges || (item.customAttributes?.some(attr => attr.key === "_Diamond Charges" && attr.value));

      const isDiamond = type.includes("diamond") || title.includes("diamond") ||
        type.includes("solitaire") || title.includes("solitaire") ||
        type.includes("gemstone") || title.includes("gemstone") ||
        tags.some(t => t.includes("diamond") || t.includes("solitaire")) ||
        hasDiamondCharges;

      const isPlainGold = tags.some(t => t.includes("plain gold") || t === "plaingold");
      
      const isGoldCoin = item.isFreeGift;
      const isInsurance = item.variantId === INSURANCE_VARIANT_ID;
      const isBYJ = Boolean(
        item.properties?.['_byj_group_id'] ||
        item.properties?.['_byj_preview'] ||
        item.properties?.['_byj_parent'] ||
        item.properties?.[' _byj_parent'] ||
        tags.includes('byj') ||
        String(item.handle || "").toLowerCase().includes('byj') ||
        String(item.title || "").toLowerCase().includes('byj')
      );

      return isDiamond && !isPlainGold && !isGoldCoin && !isInsurance && !isBYJ;
    });
  }, [items]);
  


  const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
  const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;

  const subtotalValue = (totalAmount || 0) - insuranceValue;

  // Sum of original prices (comparePrice if comparePrice > price, else price)
  const originalSubtotalValue = (items || [])
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !item.isFreeGift &&
      !isFreeGiftVariant(item.variantId)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      const originalPrice = compare > price ? compare : price;
      return acc + (originalPrice * qty);
    }, 0);

  const totalSavings = (items || [])
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !item.isFreeGift &&
      !isFreeGiftVariant(item.variantId)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      return acc + (compare > price ? (compare - price) * qty : 0);
    }, 0);

  const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, summary: "Applied", value: 0, valueType: "FIXED_AMOUNT" };

  // Label for the applied-discount row — same helper CartSummary uses, so the
  // cart and the checkout never word this row differently.
  const appliedCouponLabel = getAppliedOfferLabel(
    (appliedCoupons?.length ? appliedCoupons : [appliedCoupon])
      .map((c) => String((typeof c === 'object' ? c?.code : c) || ""))
      .filter(Boolean),
    dynamicCoupons
  );
  const couponDiscountAmount = calculateCouponDiscount(appliedCoupons?.length ? appliedCoupons : appliedCoupon, items, subtotalValue);

  const discountValue = couponDiscountAmount;
  const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
  const grandTotalValue = subtotalValue + insuranceValue - discountValue - pointsDiscountAmount;

  useEffect(() => {
    if (isPaymentPage && user?.id) {
      fetchPoints();
    }
  }, [isPaymentPage, user?.id, items]);

  const fetchPoints = async () => {
    if (!user?.id) return;
    try {
      setLoadingPoints(true);

      const getNectorCustomerId = (gid) => {
        if (!gid) return "";
        const match = String(gid).match(/\d+$/);
        const numericId = match ? match[0] : gid;
        return `shopify-${numericId}`;
      };

      const data = await apiFetch('/api/nector/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: getNectorCustomerId(user.id),
          country: "ind",
          action: "list",
          amount: Math.max(totalAmount || 0, 1)
        })
      });

      const points = data?.data || data;
      const meta = data?.meta || {};
      const statusCode = meta.code || data?.status || 200;

      // Nector sometimes returns success directly or nested in data
      if (statusCode === 200 || points?.points_balance !== undefined || points?.available_points !== undefined) {
        setPointsData(points);
      } else if (statusCode !== 422 && Object.keys(data || {}).length > 0) {
        // Only log if it's NOT a 422 (No discount available) and not an empty object
        console.error("Nector API Error Details:", data);
      }
    } catch (error) {
      console.error("Error fetching points:", error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleApplyPoints = () => {
    if (!hasDiamondJewellery) {
      toast.warning("Loyalty points can only be applied to Diamond Jewellery.");
      return;
    }

    if (!pointsData?.promotions?.[0]) {
      toast.info("No available promotions to apply");
      return;
    }

    // Coins survive a coupon/discount only when it was configured to allow
    // them (dashboard: "Lucira Coins applicable") — mirrors cartSlice's own
    // gating so the payment-page nudge agrees with the cart-page behavior.
    const couponBlocksCoins = !!appliedCoupon && !appliedCoupon?.coinsApplicable;
    const discountBlocksCoins = !!claimedProductDiscount && !claimedProductDiscount?.coinsApplicable;

    if (couponBlocksCoins || discountBlocksCoins) {
      if (onApplyCoinsWarning) {
        onApplyCoinsWarning(() => executeApplyPoints());
        return;
      }
      if (couponBlocksCoins) {
        removeCoupon();
        toast.error("Coupon has been removed as loyalty points are applied.", {
          icon: <Check className="w-4 h-4" />
        });
      }
      if (discountBlocksCoins) {
        unclaimDiscount(claimedProductDiscount.id);
        toast.error(`${claimedProductDiscount.title} has been removed as loyalty points are applied.`, {
          icon: <Check className="w-4 h-4" />
        });
      }
    }

    executeApplyPoints();
  };

  const executeApplyPoints = () => {
    if (appliedCoupon && !appliedCoupon?.coinsApplicable) {
      removeCoupon();
      toast.error("Coupon has been removed as loyalty points are applied.", {
        icon: <Check className="w-4 h-4" />
      });
    }
    if (claimedProductDiscount && !claimedProductDiscount?.coinsApplicable) {
      unclaimDiscount(claimedProductDiscount.id);
      toast.error(`${claimedProductDiscount.title} has been removed as loyalty points are applied.`, {
        icon: <Check className="w-4 h-4" />
      });
    }
    const promotion = pointsData.promotions[0];
    dispatch(applyPoints({
      id: promotion.id || `nector_${Date.now()}`,
      coin_value: promotion.coin_value,
      fiat_value: promotion.fiat_value,
      points_label: pointsData.points_label || "Lucira Coins"
    }));
    toast.success(`Applied ${promotion.fiat_value} discount from points!`);
  };

  const handleRemovePoints = () => {
    dispatch(removePoints());
    toast.error("Points discount removed", {
      icon: <Check className="w-4 h-4" />
    });
  };

  const displayItems = (items || []).filter(
    (item) =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !item.isFreeGift &&
      !isFreeGiftVariant(item.variantId) &&
      !item.properties?.['_byj_parent'] &&
      !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
  );

  // Claiming requires a logged-in user, so a gift line without one is an
  // invalid leftover state (FreeGiftReward's own effect removes it), not a
  // legitimate claim — don't reflect it as applied here in the meantime.
  const appliedGiftItem = user ? (items || []).find((item) => item.isFreeGift || isFreeGiftVariant(item.variantId)) : null;

  const hasPointsBalance = pointsData && parseInt(pointsData.points_balance || 0) > 0;
  // A zero balance still shows the card (with a disabled button) — Nector
  // answers the checkout call with meta.code 422 and no points_balance when
  // there's nothing to redeem, so gating on the balance made the whole block
  // vanish on a 0-coin account and read as broken.
  const shouldShowPointsSection = showPoints && isPaymentPage && user;



  return (
    <div className={`space-y-6 ${className}`}>
      {showItems && (
        <div className="space-y-4">
          <h2 className="text-[0.8125rem] font-bold text-zinc-800 uppercase tracking-wide">ORDER SUMMARY</h2>
          <div className="bg-white rounded-lg p-4 space-y-4">
            {displayItems.map((item, index) => {
              const isInsurance = item.variantId === INSURANCE_VARIANT_ID;
              const isBYJ = item.properties?.['_byj_preview'];
              const byjCharms = (() => {
                if (!item.properties?.['_byj_charms_json']) return [];
                try { return JSON.parse(item.properties['_byj_charms_json']); } catch (e) { return []; }
              })();
              const byjStylePrice = isBYJ ? parseFloat(item.properties?.['_byj_style_price'] || 0) / 100 : 0;
              const byjCharmsPrice = isBYJ ? byjCharms.reduce((acc, c) => acc + (parseFloat(c.price || 0) * (c.qty || 1)), 0) / 100 : 0;
              const displayPrice = isBYJ ? (byjStylePrice + byjCharmsPrice) : (item.price || 0);
              const displayImage = isBYJ ? item.properties['_byj_preview'] : item.image;
              const effectiveComparePrice = Number(item.comparePrice || 0);

              return (
                <div key={index} className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-zinc-50 rounded-md border border-zinc-100 p-1 shrink-0 block">
                      <Image
                        loader={(!isBYJ && displayImage && (String(displayImage).includes("cdn.shopify.com") || String(displayImage).includes("myshopify.com"))) ? shopifyLoader : undefined}
                        src={displayImage || "/images/product/1.jpg"}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex-grow space-y-1">
                      <h3 className="text-sm font-medium text-zinc-800 leading-tight transition-colors">{item.title}</h3>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-tight">
                          Metal: <span className="text-zinc-800">{formatMetal(item.karat, item.color)}</span>
                        </p>
                        <p className="text-xs text-zinc-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-bold text-zinc-900">₹{(displayPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        {effectiveComparePrice > item.price && (
                          <span className="text-xs text-zinc-400 line-through">₹{(effectiveComparePrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isBYJ && (
                    <div className="bg-[#fef5f1] p-4 rounded-md space-y-4 border border-[#e0d0ba]/30 mt-2">
                      <div className="space-y-4">
                        <div className="border-b border-[#e0d0ba] pb-1.5">
                          <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[0.5625rem] font-bold uppercase tracking-widest text-[#5c4f3a]">Style</span>
                            <span className="text-[0.6875rem] font-bold text-[#1c1810]">₹ {parseFloat(item.properties['_byj_style_price'] / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="text-[0.6875rem] font-medium text-zinc-800">{item.properties['Style']}</div>
                        </div>

                        <div className="pb-1">
                          <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[0.5625rem] font-bold uppercase tracking-widest text-[#5c4f3a]">Charms</span>
                          </div>
                          <div className="space-y-2 mt-2">
                            {byjCharms.map((charm, idx) => (
                              <div key={idx} className="flex justify-between items-start gap-3">
                                <span className="text-[0.6875rem] font-medium text-zinc-800 leading-tight">{idx + 1}. {charm.title} {charm.qty > 1 ? `x ${charm.qty}` : ''}</span>
                                <span className="text-[0.6875rem] font-bold text-[#1c1810] whitespace-nowrap">₹ {parseFloat(charm.price * charm.qty / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-50 p-2 rounded-md flex items-center gap-2 mt-2">
                    <Truck size={14} className="text-black" />
                    <span className="text-[0.625rem] font-medium text-black tracking-tight">
                      {getEstimatedDispatchDate(item.inStock, item.leadTime)}
                    </span>
                  </div>

                  {index < displayItems.length - 1 && <div className="border-b border-zinc-50 pt-2" />}
                </div>
              );
            })}
          </div>
        </div>

      )}

      {shouldShowPointsSection && (
        <div className="p-4 rounded-[8px]" style={{ background: 'linear-gradient(89.31deg, #FEF5F1 0%, #F1E4D1 100%)' }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-figtree font-medium text-[14px] leading-[1.3] tracking-normal align-middle mb-[7px] text-black">
                {pointsData?.points_label || "Lucira Coins Balance"}
              </h3>
              <p className="font-figtree font-light text-[12px] leading-[1.3] tracking-normal align-middle text-black">1 Coin = 1 Rupee</p>
              {pointsData?.promotions?.[0] && hasDiamondJewellery && (
                <p 
                  className="font-figtree font-medium text-[12px] leading-[1.3] tracking-normal align-middle text-[#00A63E] mt-1.5" 
                  style={{ marginTop: '6px' }}
                >
                  Claimable on this order: {pointsData.promotions[0].coin_value} Coins
                </p>
              )}
            </div>
            <div className="bg-white px-3 py-1.5 rounded-[6px] flex items-center gap-2 border border-white shrink-0">
              <img src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/lucira-coin.png?v=1786602463" width="20" height="20" alt="Lucira Coin" className="w-5 h-5 shrink-0" />
              <span className="font-figtree font-medium text-[16px] text-[#5A413F]">
                {pointsData?.points_balance || 0}
              </span>
            </div>
          </div>
          {(() => {
            if (loadingPoints) {
              return (
                <div className="flex justify-center py-3">
                  <Loader2 className="animate-spin text-[#5A413F]" size={20} />
                </div>
              );
            }
            if (nectorPoints) {
              return (
                <button
                  onClick={handleRemovePoints}
                  className="w-full h-[46px] lg:h-[40px] flex items-center justify-center bg-white border border-[#EBE1D7] hover:bg-zinc-50 text-[#5A413F] rounded-[6px] font-figtree font-medium text-[15px] lg:text-[1rem] transition-colors disabled:opacity-50"
                >
                  Remove Coins
                </button>
              );
            }
            return (
              <button
                onClick={handleApplyPoints}
                disabled={!hasDiamondJewellery || !pointsData?.promotions?.[0]}
                className="w-full h-[46px] lg:h-[40px] flex items-center justify-center border border-transparent bg-[#5A413F] text-white rounded-[6px] font-figtree font-medium text-[15px] lg:text-[1rem] hover:bg-[#4A312F] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {!hasDiamondJewellery
                  ? "Valid on Diamond Jewelry"
                  : !hasPointsBalance
                    ? "No Coins to Redeem"
                    : "Apply Coins"}
              </button>
            );
          })()}
        </div>
      )}

      {showBreakdown && (
        <div ref={breakdownRef} className="scroll-mt-20 lg:scroll-mt-24 space-y-3.5 bg-transparent lg:pt-0 lg:pb-0 mb-0 lg:mb-[20px]">
          <h2 className="text-[0.9375rem] font-figtree font-medium text-black uppercase tracking-wide mb-4 lg:hidden">ORDER SUMMARY</h2>

          <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#3D2B28]">₹ {originalSubtotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          {isPaymentPage ? (
            <>
              {totalSavings > 0 && (
                <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
                  <span>Cart Discount</span>
                  <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              {Boolean(appliedCoupon) && (
                <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
                  <span>Coupon Discount</span>
                  <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {couponDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {totalSavings > 0 && !compactBreakdown && (
                <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
                  <span>Saving</span>
                  <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              {Boolean(appliedCoupon) && (
                <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
                  <span className="text-[#000000]">
                    {compactBreakdown ? "Cart Discount" : appliedCouponLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {couponDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    {!compactBreakdown && (
                      <button
                        onClick={removeCoupon}
                        className="text-[0.625rem] font-bold text-red-500 hover:underline uppercase tracking-tighter"
                      >
                        (Remove)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {appliedGiftItem && (
            <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
              <span>{appliedGiftItem.title || "Free Gift"} ({Number(appliedGiftItem.quantity || appliedGiftItem.qty || 1)})</span>
              <span className="font-semibold text-[#00A63E]">Free</span>
            </div>
          )}

          {insuranceValue > 0 && (
            <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
              <span>Insurance</span>
              <span className="font-semibold text-[#3D2B28]">₹ {insuranceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {nectorPoints && (
            <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
              <span className="font-semibold uppercase tracking-wider text-[#189351]">Redeemed {nectorPoints.coin_value} coins</span>
              <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {nectorPoints.fiat_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
            <span>Shipping</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#00A63E]">Free</span>
              <span className="text-sm text-gray-400 line-through font-normal">₹ 500</span>
            </div>
          </div>

          <div className="border-t border-zinc-200 mt-4 pt-4 flex justify-between items-center">
            <span className="font-figtree text-[0.9375rem] lg:text-base font-semibold text-black uppercase">Grand Total</span>
            <span className="font-figtree text-[1rem] lg:text-xl font-semibold text-black">₹ {grandTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>

          {!compactBreakdown && (totalSavings > 0 || couponDiscountAmount > 0) && (
            <div className="mt-4 rounded-[4px] bg-[#EAF7EE] p-2 text-center">
              <span className="font-figtree text-[0.9rem] lg:text-[1rem] font-medium text-[#00A63E] block">
                You will save <span className="font-semibold no-underline">₹{(totalSavings + couponDiscountAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> on this order
              </span>
            </div>
          )}
        </div>
      )}




      {children}
      {/* Contact Section removed */}
    </div>
  );
}
