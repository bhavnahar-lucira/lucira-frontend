"use client";

import Image from "next/image";
import Link from "next/link";
import shopifyLoader from "@/utils/shopifyLoader";
import { Phone, MessageSquare, Truck, MessageCircle, Coins, Loader2, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyPoints, removePoints } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import CartContact from "./CartContact";
import { apiFetch } from "@/lib/api";
import { getEstimatedDispatchDate } from "@/lib/utils";

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
  onToggleSilverPendant = () => {},
  showSilverPendantOffer = true
}) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { items, totalAmount, appliedCoupon, removeCoupon, nectorPoints } = useCart();
  const user = useSelector((state) => state.user.user);
  
  const [pointsData, setPointsData] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [pendantPrice, setPendantPrice] = useState(10547);

  const isPaymentPage = pathname && (pathname === "/checkout/payment" || pathname.includes("/checkout/payment"));

  const isCheckoutPage = pathname && pathname.startsWith("/checkout") && pathname !== "/checkout/cart";

  // Fetch Pendant Price
  useEffect(() => {
    if (isPaymentPage) {
      apiFetch(`/api/products/pricing?variantId=${SILVER_PENDANT_VARIANT_ID.split('/').pop()}`)
        .then(data => {
          if (data?.price) setPendantPrice(data.price);
        })
        .catch(err => console.error("Error fetching pendant price:", err));
    }
  }, [isPaymentPage]);

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

      // Exclude Gold Coins, Silver Pendants (paid), Insurance
      const isGoldCoin = item.variantId === GOLDCOIN_VARIANT_ID || item.variantId === "gid://shopify/ProductVariant/47661824082138";
      const isSilverPendant = item.variantId === SILVER_PENDANT_VARIANT_ID;
      const isInsurance = item.variantId === INSURANCE_VARIANT_ID;

      if (isDiamond && !isGoldCoin && !isSilverPendant && !isInsurance) {
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

  const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, summary: "Applied", value: 0, valueType: "FIXED_AMOUNT" };

  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (couponDetails.valueType === "FIXED_AMOUNT") {
      couponDiscountAmount = couponDetails.value;
    } else if (couponDetails.valueType === "PERCENTAGE") {
      couponDiscountAmount = (subtotalValue * couponDetails.value) / 100;
    }
  }

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

  const displayItems = (items || []).filter(
    (item) =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      !item.properties?.['_byj_parent'] &&
      !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
  );

  const hasPointsBalance = pointsData && parseInt(pointsData.points_balance || 0) > 0;
  const shouldShowPointsSection = showPoints && isPaymentPage && user && (loadingPoints || nectorPoints || hasPointsBalance);

  return (
    <div className={`space-y-6 ${className}`}>
      {showItems && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#443360] font-abhaya">Order Summary</h2>
          <div className="bg-white border border-zinc-100 rounded-lg p-4 space-y-4 shadow-sm">
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
                          Metal: <span className="text-zinc-800">{item.karat} {item.color}</span>
                        </p>
                        <p className="text-xs text-zinc-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-bold text-zinc-900">₹{(displayPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        {item.comparePrice > item.price && (
                          <span className="text-xs text-zinc-400 line-through">₹{(item.comparePrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isBYJ && (
                    <div className="bg-[#fef5f1] p-4 rounded-md space-y-4 border border-[#e0d0ba]/30 mt-2">
                      <div className="space-y-4">
                        <div className="border-b border-[#e0d0ba] pb-1.5">
                          <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#5c4f3a]">Style</span>
                            <span className="text-[11px] font-bold text-[#1c1810]">₹ {parseFloat(item.properties['_byj_style_price'] / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="text-[11px] font-medium text-zinc-800">{item.properties['Style']}</div>
                        </div>

                        <div className="pb-1">
                          <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#5c4f3a]">Charms</span>
                          </div>
                          <div className="space-y-2 mt-2">
                            {byjCharms.map((charm, idx) => (
                              <div key={idx} className="flex justify-between items-start gap-3">
                                <span className="text-[11px] font-medium text-zinc-800 leading-tight">{idx + 1}. {charm.title} {charm.qty > 1 ? `x ${charm.qty}` : ''}</span>
                                <span className="text-[11px] font-bold text-[#1c1810] whitespace-nowrap">₹ {parseFloat(charm.price * charm.qty / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-zinc-50 p-2 rounded-md flex items-center gap-2 mt-2">
                    <Truck size={14} className="text-black" />
                    <span className="text-[10px] font-medium text-black tracking-tight">
                      {item.estDelivery || getEstimatedDispatchDate(item.inStock, item.leadTime)}
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
        <div className="space-y-3 border-zinc-50 shadow-sm bg-white rounded-lg p-6">
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Subtotal</span>
            <span className="font-medium text-zinc-900">₹{subtotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-sm text-[#189351]">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider">Coupon ({typeof appliedCoupon === 'object' ? appliedCoupon.code : appliedCoupon})</span>
                {!isCheckoutPage && (
                  <button 
                    onClick={removeCoupon}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter"
                  >
                    (Remove)
                  </button>
                )}
              </div>
              <span className="font-bold">- ₹ {couponDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {goldCoinItem && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Free Gold Coin ({goldCoinItem.quantity})</span>
              <span className="font-bold">₹ 0</span>
            </div>
          )}
          {isSilverPendantClaimed && (
            <div className="flex justify-between text-sm text-[#189351]">
              <span className="font-medium">Free Silver Pendant</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 line-through font-figtree">
                  ₹{pendantPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="font-bold uppercase tracking-wide">FREE</span>
              </div>
            </div>
          )}
          {insuranceValue > 0 && (
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Insurance</span>
              <span className="font-bold">₹{insuranceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {nectorPoints && (
            <div className="flex lg:hidden justify-between text-sm text-[#189351]">
              <span className="font-bold uppercase tracking-wider">Redeemed {nectorPoints.coin_value} coins</span>
              <span className="font-bold">- ₹ {nectorPoints.fiat_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-[#189351]">
            <span>Shipping (Standard)</span>
            <span className="font-bold">Free</span>
          </div>
          <div className="border-t border-zinc-100 my-4 pt-4 flex justify-between items-center">
            <span className="text-base font-bold text-[#443360] uppercase tracking-wider">GRAND TOTAL</span>
            <span className="text-lg font-bold text-[#443360]">₹{grandTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      )}

      {showSilverPendantOffer && isPaymentPage && diamondTotalForOffer >= 30000 && (
        <div className="bg-[#FDF2F5] rounded-2xl border border-[#F1D1D9] shadow-[0_4px_20px_-4px_rgba(241,209,217,0.5)] p-4 flex gap-4 transition-all hover:shadow-[0_8px_30px_-4px_rgba(241,209,217,0.6)]">
          {/* Left Side: Image - Matching Order Summary Style */}
          <div className="w-20 h-20 bg-white rounded-md border border-[#F1D1D9]/50 p-1 shrink-0 flex items-center justify-center overflow-hidden">
            <Image 
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/free-pendant.jpg?v=1781522812" 
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
              <h3 className="text-[13px] font-bold text-[#443360] uppercase tracking-tight">Free Silver Pendant</h3>
              <p className="text-[11px] text-zinc-500 leading-snug">Gift unlocked for your Diamond order! Claim your free silver pendant now.</p>
            </div>
            
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 line-through font-figtree">
                  ₹{pendantPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-sm font-bold text-[#189351] font-figtree">FREE</span>
              </div>
              
              {isSilverPendantClaimed ? (
                <button 
                  onClick={() => {
                    onToggleSilverPendant();
                    toast.info("Free Silver Pendant removed from your order.");
                  }}
                  className="px-5 py-2 bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-500 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  REMOVE
                </button>
              ) : (
                <button 
                  onClick={() => {
                    onToggleSilverPendant();
                    toast.success("Free Silver Pendant added to your order!", {
                      icon: <Check className="w-4 h-4" />
                    });
                  }}
                  className="group relative px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.15em] shadow-lg shadow-slate-200 transition-all active:scale-[0.98] overflow-hidden cursor-pointer"
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
                <div className="flex items-center justify-between bg-white/80 p-3 rounded-lg border border-[#B4936B]/20 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-[#189351]">Applied: -₹{nectorPoints.fiat_value.toLocaleString('en-IN')}</span>
                    <p className="text-[11px] text-zinc-500 font-medium">Redeemed {nectorPoints.coin_value} coins</p>
                  </div>
                  <button 
                    onClick={handleRemovePoints} 
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider transition-colors"
                  >
                    REMOVE
                  </button>
                </div>
              );
            }
            if (hasDiamondJewellery && pointsData?.promotions?.[0]) {
              return (
                <div className="space-y-3">
                  <p className="text-[11px] text-zinc-500 leading-tight italic">Apply {pointsData.promotions[0].title} for {pointsData.promotions[0].coin_value} coins?</p>
                  <button onClick={handleApplyPoints} className="w-full bg-[#B4936B] hover:bg-[#A3825A] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">Apply Points</button>
                </div>
              );
            }
            if (!hasDiamondJewellery && pointsData) {
              return (
                <p className="text-[10px] text-zinc-400 text-center italic leading-tight">Loyalty points can only be applied to Diamond Jewellery.</p>
              );
            }
            if (pointsData && (!pointsData.promotions || pointsData.promotions.length === 0)) {
              return (
                <p className="text-[10px] text-zinc-400 text-center italic">Not enough coins to redeem for this order.</p>
              );
            }
            return null;
          })()}
        </div>
      )}

      {showContact && <CartContact />}
    </div>
  );
}
