"use client";

import { useCart } from "@/hooks/useCart";
import { Loader2, Check, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";

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
      .filter(item => item.variantId !== INSURANCE_VARIANT_ID && item.variantId !== "gid://shopify/ProductVariant/47661824082138")
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

  const handleAdd = async () => {
    if (isAdded) return;
    setIsProcessing(true);
    try {
      const product = {
        productId: "gid://shopify/Product/9207163617498",
        variantId: INSURANCE_VARIANT_ID,
        title: "Insurance",
        image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/story-ring.jpg",
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
    <div className="bg-white border border-[#EADFD8] rounded-2xl p-4 shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] space-y-3">
      {/* Image banner */}
      <div className="relative w-full aspect-[2.2/1] lg:aspect-[3.4/1] rounded-xl overflow-hidden bg-[#FEF9F6]">
        <Image
          loader={shopifyLoader}
          src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/story-ring.jpg"
          alt="Insurance"
          fill
          sizes="(max-width: 1024px) 100vw, 480px"
          className="object-cover"
        />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-md p-1 border border-zinc-100">
          <Image loader={shopifyLoader} src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/small-logo.svg" alt="Lucira" width={18} height={18} />
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-1.5">
        <ShieldCheck size={16} className="text-[#5A413F] shrink-0" />
        <h3 className="font-figtree font-medium text-sm lg:text-base leading-[1.3] text-[#3D2B28]">
          Lucira Jewelry Insurance
        </h3>
      </div>

      {/* Description */}
      <p className="font-figtree font-normal text-xs lg:text-sm leading-[1.4] text-[#6B5B54]">
        Protect your jewelry from accidental damage, loss, or theft with a one-time protection plan.
      </p>

      {/* Price + CTA */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-baseline gap-2">
          <span className="font-figtree text-xs lg:text-sm text-[#6B5B54] line-through">₹999</span>
          <span className="font-figtree text-base lg:text-lg font-semibold text-[#3D2B28]">₹{INSURANCE_PRICE}</span>
        </div>
        <div className="flex flex-row gap-2 shrink-0">
          {isAdded ? (
            <>
              <button
                onClick={handleRemove}
                disabled={isProcessing || loading}
                className="h-11 px-5 border border-[#5A413F]/40 text-[#5A413F] font-figtree font-medium uppercase tracking-wide text-xs lg:text-sm rounded-[6px] transition-colors hover:bg-[#5A413F]/5 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Remove"}
              </button>
              <div className="h-11 px-6 bg-[#4F7A5E] text-white font-figtree font-medium uppercase tracking-wide text-xs lg:text-sm rounded-[6px] flex items-center justify-center gap-1.5 cursor-default">
                Added <Check size={12} />
              </div>
            </>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isProcessing || loading}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-[6px] bg-[#5A413F] hover:bg-[#4A3533] transition-colors h-11 px-10 lg:px-14 font-figtree font-medium uppercase tracking-wide text-xs lg:text-sm text-white disabled:opacity-50 cursor-pointer"
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
  );
}
