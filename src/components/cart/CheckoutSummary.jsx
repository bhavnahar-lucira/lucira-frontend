"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MessageSquare, Truck, MessageCircle, Coins, Loader2, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyPoints, removePoints } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import CartContact from "./CartContact";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

export default function CheckoutSummary({ 
  showItems = true, 
  showBreakdown = true, 
  showPoints = true, 
  showContact = true,
  className = ""
}) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { items, totalAmount, appliedCoupon, removeCoupon, nectorPoints } = useCart();
  const user = useSelector((state) => state.user.user);
  
  const [pointsData, setPointsData] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const isPaymentPage = pathname && (pathname === "/checkout/payment" || pathname.includes("/checkout/payment"));

  const isCheckoutPage = pathname && pathname.startsWith("/checkout") && pathname !== "/checkout/cart";

  // Check if cart contains Diamond Jewellery
  const hasDiamondJewellery = (items || []).some(item => {
    const type = (item.type || item.productType || item.product_type || "").toLowerCase();
    const title = (item.title || "").toLowerCase();
    const hasDiamondCharges = !!item.diamondCharges || (item.customAttributes?.some(attr => attr.key === "_Diamond Charges" && attr.value));
    
    return type.includes("diamond") || title.includes("diamond") || 
           type.includes("solitaire") || title.includes("solitaire") ||
           type.includes("gemstone") || title.includes("gemstone") ||
           hasDiamondCharges;
  });

  const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
  const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;

  const goldCoinItem = (items || []).find(item => item.variantId === GOLDCOIN_VARIANT_ID);
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

      const response = await fetch('/api/nector/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: getNectorCustomerId(user.id),
          country: "ind",
          action: "list",
          amount: Math.max(totalAmount || 0, 1)
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      
      const points = result?.data || result;
      const meta = result?.meta || {};
      const statusCode = meta.code || result?.status || 200;

      // Nector sometimes returns success directly or nested in data
      if (statusCode === 200 || points?.points_balance !== undefined || points?.available_points !== undefined) {
        setPointsData(points);
      } else if (statusCode !== 422 && Object.keys(result || {}).length > 0) {
        // Only log if it's NOT a 422 (No discount available) and not an empty object
        console.error("Nector API Error Details:", result);
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
      item.variantId !== GOLDCOIN_VARIANT_ID
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
              return (
                <div key={index} className="space-y-3">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-zinc-50 rounded-md border border-zinc-100 p-1 shrink-0 block">
                      <Image
                        src={item.image || "/images/product/1.jpg"}
                        alt={item.title}
                        width={80}
                        height={80}
                        unoptimized={String(item.image).includes("cdn.shopify.com") || String(item.image).includes("myshopify.com")}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />                    </div>
                    <div className="flex-grow space-y-1">
                      <h3 className="text-sm font-medium text-zinc-800 leading-tight transition-colors">{item.title}</h3>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-tight">
                          Metal: <span className="text-zinc-800">{item.karat} {item.color}</span>
                        </p>
                        <p className="text-xs text-zinc-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-bold text-zinc-900">₹{(item.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        {item.comparePrice > item.price && (
                          <span className="text-xs text-zinc-400 line-through">₹{(item.comparePrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isInsurance && (
                   <div className="bg-zinc-50 p-2 rounded-md flex items-center gap-2">
                     <Truck size={14} className="text-black" />
                     <span className="text-[10px] font-medium text-black">
                       {item.estDelivery 
                         ? (item.estDelivery.includes("dispatch by") 
                             ? item.estDelivery.replace("dispatch by", "delivery by") 
                             : `Est. Delivery by ${item.estDelivery}`)
                         : "Est. Delivery by 8-10 Days"}
                     </span>
                   </div>
                  )}

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
