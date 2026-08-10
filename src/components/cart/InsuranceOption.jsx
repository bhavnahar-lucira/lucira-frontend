"use client";

import { useCart } from "@/hooks/useCart";
import { Loader2, Check } from "lucide-react";
import { useState } from "react";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const INSURANCE_PRICE = 1;

export default function InsuranceOption() {
  const { items, addToCart, removeFromCart, loading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

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
        item.variantId !== "gid://shopify/ProductVariant/48052809498842"
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async () => {
    setIsProcessing(true);
    try {
      await removeFromCart(INSURANCE_VARIANT_ID);
    } finally {
      setIsProcessing(false);
    }
  };

  if (otherItemsQuantity === 0 && !isAdded) return null;

  return (
    <button
      type="button"
      onClick={isAdded ? handleRemove : handleAdd}
      disabled={isProcessing || loading}
      className="flex w-full items-center gap-3 rounded-[10px] border border-[#EADFD8] bg-white p-4 text-left transition-colors hover:border-[#5A413F]/30 disabled:opacity-50 cursor-pointer"
    >
      <span className="flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full border border-[#5A413F] text-[#5A413F]">
        <svg width="16" height="20" viewBox="0 0 18 22" fill="none">
          <path d="M5.75 10.7504L7.75 12.7504L11.75 8.75045M16.75 11.7504C16.75 16.7504 13.25 19.2505 9.09 20.7005C8.87216 20.7743 8.63554 20.7707 8.42 20.6905C4.25 19.2505 0.75 16.7504 0.75 11.7504V4.75045C0.75 4.48523 0.855357 4.23088 1.04289 4.04334C1.23043 3.85581 1.48478 3.75045 1.75 3.75045C3.75 3.75045 6.25 2.55045 7.99 1.03045C8.20185 0.849448 8.47135 0.75 8.75 0.75C9.02865 0.75 9.29815 0.849448 9.51 1.03045C11.26 2.56045 13.75 3.75045 15.75 3.75045C16.0152 3.75045 16.2696 3.85581 16.4571 4.04334C16.6446 4.23088 16.75 4.48523 16.75 4.75045V11.7504Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-figtree font-semibold text-[14px] lg:text-[16px] leading-tight text-black">
          Lucira Insurance
        </h3>
        <p className="font-figtree font-normal text-[12px] lg:text-[13px] leading-tight text-[#6B5B54] mt-1">
          Protect your Jewelry with our One-Time Protection Plan
        </p>
      </div>

      <div className="flex items-baseline gap-1.5 shrink-0 whitespace-nowrap">
        <span className="font-figtree text-[13px] text-zinc-400 line-through">₹999</span>
        <span className="font-figtree text-[15px] lg:text-[16px] font-semibold text-black">₹{INSURANCE_PRICE}</span>
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
