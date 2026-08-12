"use client";

import Image from "next/image";
import Link from "next/link";
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
import { calculateCouponDiscount } from "@/lib/coupons";
import { pushPromoClick } from "@/lib/gtm";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47753346973914";
const SILVER_PENDANT_VARIANT_ID = "gid://shopify/ProductVariant/48052809498842";

export default function CheckoutSummary({
  showItems = true,
  showBreakdown = true,
  showPoints = true,
  showContact = true,
  className = "",
  isSilverPendantClaimed = false,
  onToggleSilverPendant = () => { },
  showSilverPendantOffer = false,
  breakdownRef = null,
  onApplyCoinsWarning = null,
  mobilePaymentCoinsTheme = false,
  compactBreakdown = false,
  children
}) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { items, totalAmount, appliedCoupon, removeCoupon, nectorPoints } = useCart();
  const user = useSelector((state) => state.user.user);

  const [pointsData, setPointsData] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [pendantPrice, setPendantPrice] = useState(0);

  const firstProductName = (items || []).find(item =>
    item.variantId !== INSURANCE_VARIANT_ID &&
    !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
    item.variantId !== SILVER_PENDANT_VARIANT_ID
  )?.title;

  const isPaymentPage = pathname && (pathname === "/checkout/payment" || pathname.includes("/checkout/payment"));

  const isCheckoutPage = pathname && pathname.startsWith("/checkout") && pathname !== "/checkout/cart";

  // Fetch Pendant Price
  useEffect(() => {
    apiFetch(`/api/products/pricing?variantId=${SILVER_PENDANT_VARIANT_ID.split('/').pop()}`, { suppressErrorLog: true })
      .then(data => {
        const p = Number(data?.price || data?.compare_price || 0);
        if (p > 0) setPendantPrice(p);
      })
      .catch(err => console.error("Error fetching pendant price:", err));
  }, []);

  // Dispatch Calculation
  const overallDispatchMessage = useMemo(() => {
    if (!items || items.length === 0) return "";
    const maxLeadTime = items.reduce((max, item) => Math.max(max, Number(item.leadTime || 12)), 0);
    const anyMadeToOrder = items.some(item => !item.inStock && item.variantId !== INSURANCE_VARIANT_ID && !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift));
    return getEstimatedDispatchDate(!anyMadeToOrder, maxLeadTime);
  }, [items]);

  // Calculate Diamond Total for Offers
  const diamondTotalForOffer = useMemo(() => {
    return (items || []).reduce((acc, item) => {
      const type = (item.type || item.productType || item.product_type || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const hasDiamondCharges = !!item.diamondCharges || (item.customAttributes?.some(attr => attr.key === "_Diamond Charges" && attr.value));

      const isDiamond = type.includes("diamond") || title.includes("diamond") ||
        type.includes("solitaire") || title.includes("solitaire") ||
        type.includes("gemstone") || title.includes("gemstone") ||
        hasDiamondCharges;

      // Exclude Gold Coins, Silver Pendants (paid), Insurance, BYJ
      const isGoldCoin = item.variantId === GOLDCOIN_VARIANT_ID || item.variantId === "gid://shopify/ProductVariant/47661824082138";
      const isSilverPendant = item.variantId === SILVER_PENDANT_VARIANT_ID;
      const isInsurance = item.variantId === INSURANCE_VARIANT_ID;
      const isBYJ = Boolean(
        item.properties?.['_byj_group_id'] ||
        item.properties?.['_byj_preview'] ||
        item.properties?.['_byj_parent'] ||
        item.properties?.[' _byj_parent'] ||
        item.tags?.includes('BYJ') ||
        String(item.handle || "").toLowerCase().includes('byj') ||
        String(item.title || "").toLowerCase().includes('byj')
      );

      if (isDiamond && !isGoldCoin && !isSilverPendant && !isInsurance && !isBYJ) {
        return acc + (Number(item.price || 0) * Number(item.quantity || 1));
      }
      return acc;
    }, 0);
  }, [items]);

  const hasDiamondJewellery = diamondTotalForOffer > 0;

  const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
  const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;

  const goldCoinItem = (items || []).find(item => item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift);
  const subtotalValue = (totalAmount || 0) - insuranceValue;

  // Sum of original prices (comparePrice if comparePrice > price, else price)
  const originalSubtotalValue = (items || [])
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      !(item.variantId === SILVER_PENDANT_VARIANT_ID && item.isFreeGift)
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
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      !(item.variantId === SILVER_PENDANT_VARIANT_ID && item.isFreeGift)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      return acc + (compare > price ? (compare - price) * qty : 0);
    }, 0);

  const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, summary: "Applied", value: 0, valueType: "FIXED_AMOUNT" };
  const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotalValue);

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

    if (appliedCoupon) {
      if (onApplyCoinsWarning) {
        onApplyCoinsWarning(() => executeApplyPoints());
        return;
      }
      removeCoupon();
      toast.error("Coupon has been removed as loyalty points are applied.", {
        icon: <Check className="w-4 h-4" />
      });
    }

    executeApplyPoints();
  };

  const executeApplyPoints = () => {
    if (appliedCoupon) {
      removeCoupon();
      toast.error("Coupon has been removed as loyalty points are applied.", {
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

  const isEligibleForPendant = diamondTotalForOffer >= 30000 && !appliedCoupon;

  const hasPendantLine = (items || []).some(item => item.variantId === SILVER_PENDANT_VARIANT_ID);

  // The cart line is the source of truth. The localStorage flag can be set from the PDP
  // offer popup without anything being added to the cart, so clear it once checkout sees
  // that the gift isn't actually there (or the order no longer qualifies).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((!isEligibleForPendant || !hasPendantLine) && localStorage.getItem("isSilverPendantClaimed") === "true") {
      localStorage.removeItem("isSilverPendantClaimed");
    }
  }, [isEligibleForPendant, hasPendantLine]);

  const isPendantActive = isEligibleForPendant && hasPendantLine;

  const displayItems = (items || []).filter(
    (item) =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      !item.properties?.['_byj_parent'] &&
      !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
  );

  if (isPendantActive && !displayItems.some(item => item.variantId === SILVER_PENDANT_VARIANT_ID)) {
    displayItems.push({
      variantId: SILVER_PENDANT_VARIANT_ID,
      quantity: 1,
      price: 0,
      comparePrice: pendantPrice,
      title: "Free Silver Pendant",
      isFreeGift: true,
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/ChatGPT_Image_Aug_3_2026_01_42_46_PM.png?v=1785745617"
    });
  }

  const hasPointsBalance = pointsData && parseInt(pointsData.points_balance || 0) > 0;
  const shouldShowPointsSection = showPoints && isPaymentPage && user && (loadingPoints || nectorPoints || hasPointsBalance);



  return (
    <div className={`space-y-6 px-4 ${className}`}>
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
              const isSilverPendant = item.variantId === SILVER_PENDANT_VARIANT_ID || String(item.title).toLowerCase().includes("silver pendant");
              const effectiveComparePrice = isSilverPendant ? (Number(item.comparePrice) || Number(item.originalPrice) || pendantPrice || 0) : Number(item.comparePrice || 0);

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

      {showBreakdown && (
        <div ref={breakdownRef} className="scroll-mt-20 lg:scroll-mt-24 space-y-3.5 bg-transparent lg:pt-6 lg:pb-0 mb-0 lg:mb-[20px]">
          <h2 className="text-[0.9375rem] font-figtree font-medium text-black uppercase tracking-wide mb-4 lg:hidden">ORDER SUMMARY</h2>

          <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#3D2B28]">₹ {originalSubtotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          {totalSavings > 0 && !compactBreakdown && (
            <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
              <span>Saving</span>
              <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {appliedCoupon ? (
            <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
              <span className="text-[#000000]">
                {compactBreakdown ? "Cart Discount" : "Coupon Applied"}
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
          ) : (
            !compactBreakdown && (
              <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
                <span>Coupon Discount</span>
                <Link href="/checkout/cart" className="font-semibold text-[#5A413F] hover:underline">
                  Apply Coupon
                </Link>
              </div>
            )
          )}
          {goldCoinItem && (
            <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
              <span>Free Gold Coin ({Number(goldCoinItem.quantity || goldCoinItem.qty || 1)})</span>
              <span className="font-semibold text-[#00A63E]">₹ 0</span>
            </div>
          )}
          {isPendantActive && (
            <div className="flex justify-between items-center font-figtree text-[0.875rem] lg:text-base text-[#000000]">
              <span>Free Silver Pendant</span>
              <div className="flex items-center gap-2">
                {pendantPrice > 0 && (
                  <span className="text-sm text-gray-400 line-through font-normal">
                    ₹ {pendantPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                )}
                <span className="font-semibold text-[#00A63E]">₹ 0</span>
              </div>
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
            <span className="font-figtree text-[0.9375rem] lg:text-base font-bold text-black uppercase">Grand Total</span>
            <span className="font-figtree text-[1rem] lg:text-xl font-bold text-black">₹ {grandTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>

          {!compactBreakdown && (totalSavings > 0 || couponDiscountAmount > 0) && (
            <div className="mt-4 rounded-[4px] bg-[#EAF7EE] p-2 text-center">
              <span className="font-figtree text-[0.9rem] lg:text-[1.1rem] font-medium text-[#00A63E] block">
                You will save <span className="font-semibold no-underline">₹{(totalSavings + couponDiscountAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> on this order
              </span>
            </div>
          )}
        </div>
      )}

      {showSilverPendantOffer && isPaymentPage && diamondTotalForOffer >= 30000 && (
        <div className="bg-[#FDF2F5] rounded-2xl border border-[#F1D1D9] p-4 flex gap-4 transition-all">
          {/* Left Side: Image - Matching Order Summary Style */}
          <div className="w-20 h-20 bg-white rounded-md border border-[#F1D1D9]/50 p-1 shrink-0 flex items-center justify-center overflow-hidden">
            <Image
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/ChatGPT_Image_Aug_3_2026_01_42_46_PM.png?v=1785745617"
              width={80}
              height={80}
              alt="Free Silver Pendant"
              className="w-full h-full object-contain mix-blend-multiply"
              unoptimized
            />
          </div>

          {/* Right Side: Content & Action */}
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div className="space-y-1">
              <h3 className="text-[0.8125rem] font-bold text-[#443360] uppercase tracking-tight">Free Silver Pendant</h3>
              <p className="text-[0.6875rem] text-zinc-500 leading-snug">Gift unlocked for your Diamond order! Claim your free silver pendant now.</p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {pendantPrice > 0 && (
                  <span className="text-xs text-zinc-400 line-through font-figtree">
                    ₹{pendantPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                )}
                <span className="text-sm font-bold text-[#189351] font-figtree">FREE</span>
              </div>

              {isPendantActive ? (
                <button
                  onClick={() => {
                    const firstItem = items && items.length > 0 ? items[0] : null;
                    const variantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
                    try {
                      pushPromoClick({
                        creative_name: "remove free silver pendant - checkout",
                        promo_id: SILVER_PENDANT_VARIANT_ID,
                        item_id: variantId || SILVER_PENDANT_VARIANT_ID,
                        promo_position: "Checkout Summary",
                      });
                    } catch (e) {
                      console.error("promoClick push failed", e);
                    }
                    if (typeof window !== "undefined") localStorage.removeItem("isSilverPendantClaimed");
                    onToggleSilverPendant();
                    toast.info("Free Silver Pendant removed from your order.");
                  }}
                  className="px-5 py-2 bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-500 rounded-full text-[0.625rem] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  REMOVE
                </button>
              ) : (
                <button
                  onClick={() => {
                    const firstItem = items && items.length > 0 ? items[0] : null;
                    const variantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
                    try {
                      pushPromoClick({
                        creative_name: "claim free silver pendant - checkout",
                        promo_id: SILVER_PENDANT_VARIANT_ID,
                        item_id: variantId || SILVER_PENDANT_VARIANT_ID,
                        promo_position: "Checkout Summary",
                      });
                    } catch (e) {
                      console.error("promoClick push failed", e);
                    }
                    if (appliedCoupon) {
                      removeCoupon();
                      toast.info("Coupon removed as Free Pendant offer cannot be combined with coupons.");
                    }
                    if (typeof window !== "undefined") localStorage.setItem("isSilverPendantClaimed", "true");
                    onToggleSilverPendant();
                    toast.success("Free Silver Pendant added to your order!", {
                      icon: <Check className="w-4 h-4" />
                    });
                  }}
                  className="group relative px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-[0.625rem] font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98] overflow-hidden cursor-pointer"
                >
                  <span className="relative z-10">CLAIM</span>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 -left-[100%] h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-button-shine" />
                  </div>

                  <style jsx>{`
                    @keyframes button-shine {
                      0% { left: -100%; }
                      20% { left: 100%; }
                      100% { left: 100%; }
                    }
                    .animate-button-shine {
                      animation: button-shine 3s infinite linear;
                    }
                  `}</style>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {shouldShowPointsSection && (
        mobilePaymentCoinsTheme ? (
          <div className="bg-[#F4E9DF] p-4 rounded-[8px]">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-black font-figtree font-medium text-[15px]">
                  {pointsData?.points_label || "Claimable Lucira Loyalty Coins"}
                </h3>
                <p className="text-black/70 font-figtree text-[13px] mt-0.5">1 Coin = 1 Rupee</p>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-[6px] flex items-center gap-2 border border-white shrink-0">
                <div className="w-5 h-5 rounded-full bg-[#EBC850] flex items-center justify-center border border-[#D5A720]">
                  <span className="text-[#3D2B28] font-serif text-[10px] italic">L</span>
                </div>
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
                    className="w-full py-3.5 bg-white border border-[#EBE1D7] hover:bg-zinc-50 text-[#5A413F] rounded-[6px] font-figtree font-medium text-[15px] transition-colors disabled:opacity-50"
                  >
                    Remove Coins
                  </button>
                );
              }
              return (
                <button
                  onClick={handleApplyPoints}
                  disabled={pointsData?.points_balance === 0}
                  className="w-full bg-[#5A413F] text-white py-3 rounded-[6px] font-figtree font-medium text-[0.9375rem] hover:bg-[#4A312F] transition-colors disabled:opacity-50"
                >
                  Apply Coins
                </button>
              );
            })()}
          </div>
        ) : (
          <div className="bg-[#FAF6F3] p-4 rounded-xl border border-[#E8DCCF] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-[#B4936B]" />
                <span className="text-sm font-bold text-[#443360]">
                  {loadingPoints ? "Checking balance..." : (pointsData?.points_label || "Lucira Coins Balance")}
                </span>
              </div>
              {!loadingPoints && pointsData && (
                <span className="text-sm font-bold text-[#B4936B]">{pointsData.points_balance}</span>
              )}
            </div>
            {(() => {
              if (loadingPoints) {
                return (
                  <div className="flex justify-center py-2">
                    <Loader2 className="animate-spin text-[#B4936B]" size={20} />
                  </div>
                );
              }
              if (nectorPoints) {
                return (
                  <div className="flex items-center justify-between bg-white/80 p-3 rounded-lg border border-[#B4936B]/20">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-[#189351]">Applied: -₹{nectorPoints.fiat_value.toLocaleString('en-IN')}</span>
                      <p className="text-[0.6875rem] text-zinc-500 font-medium">Redeemed {nectorPoints.coin_value} coins</p>
                    </div>
                    <button
                      onClick={handleRemovePoints}
                      className="text-[0.6875rem] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider transition-colors"
                    >
                      REMOVE
                    </button>
                  </div>
                );
              }
              if (hasDiamondJewellery && pointsData?.promotions?.[0]) {
                return (
                  <div className="space-y-3">
                    <p className="text-[0.6875rem] text-zinc-500 leading-tight italic">Apply {pointsData.promotions[0].title} for {pointsData.promotions[0].coin_value} coins?</p>
                    <button onClick={handleApplyPoints} className="w-full bg-[#B4936B] hover:bg-[#A3825A] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">Apply Points</button>
                  </div>
                );
              }
              if (!hasDiamondJewellery && pointsData) {
                return (
                  <p className="text-[0.625rem] text-zinc-400 text-center italic leading-tight">Loyalty points can only be applied to Diamond Jewellery.</p>
                );
              }
              if (pointsData && (!pointsData.promotions || pointsData.promotions.length === 0)) {
                return (
                  <p className="text-[0.625rem] text-zinc-400 text-center italic">Not enough coins to redeem for this order.</p>
                );
              }
              return null;
            })()}
          </div>
        )
      )}

      {children}
      {showContact && <CartContact productName={firstProductName} />}
    </div>
  );
}
