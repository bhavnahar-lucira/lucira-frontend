"use client";

import { useCart } from "@/hooks/useCart";
import { Loader2, Check } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const INSURANCE_PRICE = 1;

export default function InsuranceOption() {
  const { items, addToCart, removeFromCart, loading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const insuranceItem = items.find(item => item.variantId === INSURANCE_VARIANT_ID);
  const isAdded = !!insuranceItem;

  // Calculate total quantity of other items
  const otherItemsQuantity = items
    .filter(item => item.variantId !== INSURANCE_VARIANT_ID && item.variantId !== "gid://shopify/ProductVariant/GOLDCOIN_100MG" && item.variantId !== "gid://shopify/ProductVariant/47661824082138")
    .reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleAdd = async () => {
    if (isAdded) return;
    setIsProcessing(true);
    try {
      const product = {
        productId: "gid://shopify/Product/9207163617498",
        variantId: INSURANCE_VARIANT_ID,
        title: "Insurance",
        image: "/images/story-ring.jpg",
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
    <div className="bg-white border border-accent/30 p-4 rounded-lg flex items-center gap-4 flex-wrap xl:flex-nowrap">
      <div className="relative size-24 shrink-0 rounded-xl overflow-hidden border border-zinc-100 w-full xl:w-24">
        <Image 
          src="/images/story-ring.jpg" 
          alt="Insurance" 
          fill 
          className="object-cover"
        />
        <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm rounded-md p-1 border border-zinc-100">
          <Image src="/images/icons/small-logo.svg" alt="Lucira" width={16} height={16} />
        </div>
      </div>

      <div className="flex-grow space-y-1">
        <h3 className="text-sm font-bold text-zinc-900 leading-tight uppercase tracking-tight">
          Lucira Jewelry Insurance
        </h3>
        <p className="text-[11px] text-zinc-500 font-medium leading-normal pr-4">
          Protect your jewelry from accidental damage, loss, or theft with a one-time protection plan.
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 line-through font-medium">₹999</span>
            <span className="text-sm font-bold text-zinc-900">₹{INSURANCE_PRICE}</span>
          </div>
          <div className="flex flex-row gap-2 shrink-0 min-w-50">
            {isAdded ? (
              <>
                <button
                  onClick={handleRemove}
                  disabled={isProcessing || loading}
                  className="w-full py-2.5 border border-[#965A60] text-[#965A60] text-[10px] font-bold uppercase tracking-widest rounded-full transition-all hover:bg-[#965A60]/5 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Remove"}
                </button>
                <div className="w-full py-2.5 bg-[#4F7A5E] text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-1 cursor-default shadow-lg shadow-[#4F7A5E]/20">
                  Added <Check size={12} />
                </div>
              </>
            ) : (
              <button
                onClick={handleAdd}
                disabled={isProcessing || loading}
                className="w-full py-3 bg-[#965A60] hover:bg-[#854d53] text-white text-[10px] font-bold uppercase tracking-widest rounded-full transition-all disabled:opacity-50 shadow-lg shadow-[#965A60]/20"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  "Add"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
