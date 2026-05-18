"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Tag, Phone, MessageSquare, Gift, Truck, MessageCircle, ChevronRight, X, Loader2, CircleChevronRight, BadgePercent, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import InsuranceOption from "./InsuranceOption";
import GoldCoinOption, { GOLDCOIN_VARIANT_ID } from "./GoldCoinOption";
import { useCart } from "@/hooks/useCart";
import { applyCoupon, removeCoupon } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import CartContact from "./CartContact";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";

export default function CartSummary({ onPlaceOrder }) {
  const dispatch = useDispatch();
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  
  const { items, totalAmount, totalQuantity, appliedCoupon, updateCartItem, removeFromCart } = useCart();
  const user = useSelector((state) => state.user.user);
  const [goldCoinThreshold, setGoldCoinThreshold] = useState(20000);

  useEffect(() => {
    fetch("/api/settings/gold-coin")
      .then(res => res.json())
      .then(data => {
        if (data.threshold) setGoldCoinThreshold(Number(data.threshold) || 20000);
      })
      .catch(err => console.error("Error fetching gold coin threshold:", err));
  }, []);

  const otherItemsQuantity = items
    .filter(item => item.variantId !== INSURANCE_VARIANT_ID && item.variantId !== GOLDCOIN_VARIANT_ID)
    .reduce((acc, item) => acc + (Number(item.quantity || item.qty || 1)), 0);

  const diamondTotal = items
    .filter(item => item.variantId !== INSURANCE_VARIANT_ID && item.variantId !== GOLDCOIN_VARIANT_ID)
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

  const eligibleGoldCoins = Math.max(0, Math.floor(diamondTotal / goldCoinThreshold));

  const insuranceItem = items.find(item => item.variantId === INSURANCE_VARIANT_ID);
  const insuranceAmount = insuranceItem ? insuranceItem.price * (Number(insuranceItem.quantity || insuranceItem.qty || 1)) : 0;

  const goldCoinItem = items.find(item => item.variantId === GOLDCOIN_VARIANT_ID);

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
    if (goldCoinItem) {
      const currentCoinQty = Number(goldCoinItem.quantity || goldCoinItem.qty || 0);
      if (eligibleGoldCoins <= 0) {
        removeFromCart(GOLDCOIN_VARIANT_ID);
      } else if (currentCoinQty !== eligibleGoldCoins) {
        updateCartItem({
          currentVariantId: GOLDCOIN_VARIANT_ID,
          quantity: eligibleGoldCoins
        });
      }
    }
  }, [otherItemsQuantity, insuranceItem?.quantity, insuranceItem?.qty, eligibleGoldCoins, goldCoinItem?.quantity, goldCoinItem?.qty, updateCartItem, removeFromCart]);

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
          const res = await fetch("/api/cart/coupon/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              items, 
              couponCode: couponDetails.code,
              customerEmail: user?.email 
            })
          });

          if (!res.ok) {
            dispatch(removeCoupon());
            toast.error("Coupon removed: items in cart are no longer eligible.", {
              icon: <Check className="w-4 h-4" />
            });
          }
        } catch (err) {
          console.error("Auto-validation failed:", err);
        }
      };
      const timer = setTimeout(validateCurrentCoupon, 500);
      return () => clearTimeout(timer);
    }
  }, [items, appliedCoupon, couponDetails?.code, user?.email, dispatch]);

  const subtotal = totalAmount - insuranceAmount;
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (couponDetails.valueType === "FIXED_AMOUNT") {
      couponDiscountAmount = couponDetails.value;
    } else if (couponDetails.valueType === "PERCENTAGE") {
      couponDiscountAmount = (subtotal * couponDetails.value) / 100;
    }
  }

  const discount = couponDiscountAmount; 
  const shipping = 0; 
  const grandTotal = subtotal + insuranceAmount - discount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    try {
      const res = await fetch("/api/cart/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items, 
          couponCode: couponCode.trim(),
          customerEmail: user?.email 
            })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      dispatch(applyCoupon({ 
        code: data.code, 
        summary: data.summary,
        value: data.value,
        valueType: data.valueType
      }));
      toast.success(`Coupon "${data.code}" applied!`);
      setIsCouponDialogOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Desktop Pricing Breakdown (LG) */}
      <div className="hidden lg:block bg-white rounded-lg p-6 space-y-3 border-zinc-50 shadow-sm">
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Subtotal</span>
          <span className="font-medium text-zinc-900">₹ {subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-[#189351]">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider">Coupon ({couponDetails.code})</span>
              <button 
                onClick={handleRemoveCoupon}
                className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter"
              >
                (Remove)
              </button>
            </div>
            <span className="font-bold whitespace-nowrap">- ₹ {couponDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        {goldCoinItem && (
          <div className="flex justify-between text-sm text-[#189351]">
            <span>Free Gold Coin ({Number(goldCoinItem.quantity || goldCoinItem.qty || 1)})</span>
            <span className="font-bold">₹ 0</span>
          </div>
        )}
        {insuranceItem && (
          <div className="flex justify-between text-sm text-zinc-600">
            <span>Insurance</span>
            <span className="font-medium text-zinc-900">₹ {insuranceAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-[#189351]">
          <span>Shipping (Standard)</span>
          <span className="font-bold">Free</span>
        </div>
        
        <div className="border-t border-zinc-100 mt-4 pt-4 flex justify-between items-center">
          <span className="text-base font-bold text-[#443360] uppercase tracking-wider">GRAND TOTAL</span>
          <span className="text-lg font-bold text-[#443360]">₹ {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Mobile Order Summary (LG Hidden) */}
      <div className="lg:hidden space-y-4">
        <h3 className="text-[14px] font-bold text-[#443360] uppercase tracking-wider ml-1">Order Summary</h3>
        <div className="bg-white rounded-lg p-6 space-y-4 border border-zinc-50 shadow-sm">
          <div className="space-y-3">
            <div className="flex justify-between text-[14px] text-zinc-500 font-medium">
              <span>Subtotal</span>
              <span className="text-zinc-900">₹ {subtotal.toLocaleString('en-IN')}</span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between text-[14px] font-medium items-center text-[#189351]">
                <div className="flex items-center gap-2">
                  <span className="uppercase">Coupon ({couponDetails.code})</span>
                  <button 
                    onClick={handleRemoveCoupon}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                  >
                    (Remove)
                  </button>
                </div>
                <span className="font-bold">- ₹ {couponDiscountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {goldCoinItem && (
              <div className="flex justify-between text-sm text-[#189351]">
                <span>Free Gold Coin ({Number(goldCoinItem.quantity || goldCoinItem.qty || 1)})</span>
                <span className="font-bold">₹ 0</span>
              </div>
            )}

            {insuranceItem && (
              <div className="flex justify-between text-[14px] text-zinc-500">
                <span>Insurance</span>
                <span className="text-zinc-900">₹ {insuranceAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-[14px] text-[#189351]">
              <span>Shipping (Standard)</span>
              <span className="font-bold">Free</span>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-4 flex justify-between items-center">
            <span className="text-base font-bold text-[#443360] uppercase tracking-wider">GRAND TOTAL</span>
            <span className="text-lg font-bold text-[#443360]">₹ {grandTotal  .toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Mobile Offers Group (Coupon, Gold Coin, Insurance) - ALL BELOW SUMMARY */}
      <div className="lg:hidden space-y-6">
        <div className="space-y-4">
          <h3 className="text-[14px] font-bold text-[#443360] uppercase tracking-wider ml-1">Lucira Offers</h3>          
          <GoldCoinOption />
          <button 
            onClick={() => setIsCouponDialogOpen(true)}
            className="flex items-center justify-between w-full p-4 bg-white border border-accent/30 rounded-lg group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full shadow-sm">
                <Tag size={20} className="text-primary" />
              </div>
              <span className="text-[15px] font-bold text-[#443360] uppercase font-figtree">
                {appliedCoupon ? `Applied: ${couponDetails.code}` : "Apply Coupon"}
              </span>
            </div>
            <div className="bg-accent p-1.5 rounded-full">
              <ChevronRight size={18} className="text-white" />
            </div>
          </button>
          <InsuranceOption />
        </div>
      </div>

      {/* Desktop Only Actions & Options */}
      <div className="hidden lg:block space-y-4">
        <Button 
          onClick={onPlaceOrder}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 uppercase tracking-[0.2em] shadow-lg shadow-zinc-100 transition-all rounded-lg text-base"
        >
          Place Order
        </Button>
        
        <GoldCoinOption />

        <div className="space-y-3">
          <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-between w-full p-4 bg-white border border-accent/30 rounded-lg hover:border-accent transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full shadow-sm">
                    <Tag size={20} className="text-primary" />
                  </div>
                  <span className="text-[15px] font-bold text-[#443360] uppercase font-figtree">
                    {appliedCoupon ? `Applied: ${couponDetails.code}` : "Apply Coupon"}
                  </span>
                </div>
                <div className="bg-accent p-1.5 rounded-full">
                  <ChevronRight size={18} className="text-white" />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="space-y-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
                  <Tag size={24} />
                </div>
                <DialogTitle className="text-2xl font-light text-center text-zinc-800 font-abhaya">Apply Coupon</DialogTitle>
                <DialogDescription className="text-sm text-center text-zinc-500">
                  Enter your coupon code below to unlock special discounts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter Coupon Code" 
                  className="h-12 text-center text-lg font-bold tracking-widest uppercase"
                />
                <Button 
                  onClick={handleApplyCoupon}
                  disabled={isApplying || !couponCode.trim()}
                  className="w-full h-12 bg-primary hover:bg-primary/90 uppercase font-bold tracking-widest text-white transition-all shadow-md"
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
      <CartContact />
    </div>
  );
}
