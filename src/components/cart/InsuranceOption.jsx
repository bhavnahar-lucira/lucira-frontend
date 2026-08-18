"use client";

import { useCart } from "@/hooks/useCart";
import { Loader2, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const INSURANCE_PRICE = 1;
const SILVER_BRACELET_VARIANT_ID = "gid://shopify/ProductVariant/48414958715098";
const isPendantVariant = (id) => id === SILVER_BRACELET_VARIANT_ID;

export default function InsuranceOption() {
  const { items, addToCart, removeFromCart, loading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const autoAddAttempted = useRef(false);

  const insuranceItem = items.find(item => item.variantId === INSURANCE_VARIANT_ID);
  const isAdded = !!insuranceItem;

  // Calculate total quantity of other items
  const otherItemsQuantity = (() => {
    let qty = 0;
    const byjGroups = new Set();
    items
      .filter(item =>
        item.variantId !== INSURANCE_VARIANT_ID &&
        !(item.variantId === "gid://shopify/ProductVariant/47661824082138" && item.isFreeGift) &&
        !isPendantVariant(item.variantId)
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

  const handleAdd = async () => {
    if (isAdded) return;
    setIsProcessing(true);
    try {
      const product = {
        productId: "gid://shopify/Product/9207163617498",
        variantId: INSURANCE_VARIANT_ID,
        title: "Insurance",
        image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Insurance_Img_on_Cart_no_radius.png?v=1785224168",
        price: INSURANCE_PRICE,
        quantity: otherItemsQuantity || 1,
        variantTitle: "Shipping Protection",
        inStock: true
      };
      await addToCart(product);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("insuranceRemoved");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async () => {
    setIsProcessing(true);
    try {
      await removeFromCart(INSURANCE_VARIANT_ID);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("insuranceRemoved", "true");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-add insurance if there are other items in the cart and the user hasn't explicitly removed it
  useEffect(() => {
    if (
      otherItemsQuantity > 0 &&
      !isAdded &&
      !isProcessing &&
      !loading &&
      !autoAddAttempted.current &&
      typeof window !== "undefined"
    ) {
      if (!sessionStorage.getItem("insuranceRemoved")) {
        autoAddAttempted.current = true;
        handleAdd();
      }
    }
  }, [otherItemsQuantity, isAdded, isProcessing, loading]);

  if (otherItemsQuantity === 0 && !isAdded) return null;

  return (
    <button
      type="button"
      onClick={isAdded ? handleRemove : handleAdd}
      disabled={isProcessing || loading}
      className="flex w-full items-center gap-4 rounded-[6px] bg-[#FAFAFA] border-0 p-3 text-left transition-colors hover:border-[#5A413F]/30 disabled:opacity-50 cursor-pointer"
    >
      <span className="flex w-auto h-auto p-0 border-0 shrink-0 items-center justify-center text-[#5A413F]">
        <svg width="16" height="20" viewBox="0 0 18 22" fill="none">
          <path d="M5.75 10.7504L7.75 12.7504L11.75 8.75045M16.75 11.7504C16.75 16.7504 13.25 19.2505 9.09 20.7005C8.87216 20.7743 8.63554 20.7707 8.42 20.6905C4.25 19.2505 0.75 16.7504 0.75 11.7504V4.75045C0.75 4.48523 0.855357 4.23088 1.04289 4.04334C1.23043 3.85581 1.48478 3.75045 1.75 3.75045C3.75 3.75045 6.25 2.55045 7.99 1.03045C8.20185 0.849448 8.47135 0.75 8.75 0.75C9.02865 0.75 9.29815 0.849448 9.51 1.03045C11.26 2.56045 13.75 3.75045 15.75 3.75045C16.0152 3.75045 16.2696 3.85581 16.4571 4.04334C16.6446 4.23088 16.75 4.48523 16.75 4.75045V11.7504Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-figtree font-semibold text-[0.875rem] lg:text-[1rem] leading-none text-black">
          Lucira Insurance
        </h3>
        <p className="font-figtree font-normal text-[0.7rem] lg:text-[0.875rem] leading-[1.4] text-black mt-[6px]">
          Protect your Jewelry with our One-Time Protection Plan
        </p>
      </div>

      <div className="flex items-baseline gap-1.5 shrink-0 whitespace-nowrap">
        <span className="font-figtree text-[0.8125rem] lg:text-[0.9375rem] text-zinc-400 line-through">₹999</span>
        <span className="font-figtree text-[0.9375rem] lg:text-[1.125rem] font-semibold text-black">₹{INSURANCE_PRICE}</span>
      </div>

      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${isAdded ? "bg-[#5A413F] border-[#5A413F]" : "border-[#5A413F]/50"}`}>
        {isProcessing ? (
          <Loader2 size={12} className={`animate-spin ${isAdded ? "text-white" : "text-[#5A413F]"}`} />
        ) : (
          isAdded && <Check size={13} className="text-white" />
        )}
      </span>
    </button>
  );
}
