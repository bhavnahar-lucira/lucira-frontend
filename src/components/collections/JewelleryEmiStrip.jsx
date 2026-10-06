"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Calculator, 
  ShoppingBag 
} from "lucide-react";
import "@/styles/jewellery-on-emi.css";

const PRESET_AMOUNTS = [50000, 75000, 100000, 150000, 200000];
const TENURES = [3, 6, 9, 12];

export default function JewelleryEmiStrip({ onShopClick, descriptionHtml }) {
  // Calculator state
  const [totalAmount, setTotalAmount] = useState(75000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [tenure, setTenure] = useState(6);

  // Extract dynamic hero HTML from Shopify descriptionHtml if present
  const heroHtml = useMemo(() => {
    if (!descriptionHtml || typeof descriptionHtml !== "string" || !descriptionHtml.trim()) {
      return null;
    }
    const match = descriptionHtml.match(/<div class="hero">([\s\S]*?)<\/div>\s*(?:<nav class="toc">|<section|<div class="facts">|$)/i);
    return match ? match[0] : null;
  }, [descriptionHtml]);

  // Calculations
  const downPaymentAmount = useMemo(() => {
    return Math.round((totalAmount * downPaymentPercent) / 100);
  }, [totalAmount, downPaymentPercent]);

  const financedDiamondAmount = useMemo(() => {
    return Math.max(0, totalAmount - downPaymentAmount);
  }, [totalAmount, downPaymentAmount]);

  // Lucira 0-Cost EMI
  const monthlyEmi = useMemo(() => {
    if (tenure <= 0 || financedDiamondAmount <= 0) return 0;
    return Math.round(financedDiamondAmount / tenure);
  }, [financedDiamondAmount, tenure]);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (id === "products" && onShopClick) {
      onShopClick();
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val);
  };

  return (
    <section className="jewellery-emi-strip w-full bg-white border-b border-[#EBE1D7]">
      <div className="container-main py-8 lg:py-12">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400 font-figtree mb-6 lg:mb-8">
          <Link href="/" className="hover:text-[#5A413F] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/collections/all" className="hover:text-[#5A413F] transition-colors">Collections</Link>
          <span>/</span>
          <span className="text-[#5A413F] font-semibold">Jewelry on EMI</span>
        </nav>

        {/* Hero & Spacious Calculator Grid */}
        <div className={heroHtml ? "grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start" : "max-w-xl mx-auto"}>
          
          {/* Left Column: Dynamically rendered from Shopify description (zero hardcoded copy) */}
          {heroHtml && (
            <div 
              className="lg:col-span-7 space-y-6 jewellery-emi-dynamic-hero"
              dangerouslySetInnerHTML={{ __html: heroHtml }}
            />
          )}

          {/* Right Column (or centered when no hero): Spacious, Elegant EMI Calculator */}
          <div className={heroHtml ? "lg:col-span-5" : "w-full"} id="calculator">
            <div className="bg-[#FAF6F4] border border-[#EBE1D7] rounded-[10px] p-6 lg:p-7 shadow-[0_4px_24px_-4px_rgba(90,65,63,0.07)]">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EBE1D7]">
                <div>
                  <h2 className="font-figtree font-semibold text-[17px] text-[#2B2523] leading-tight">
                    Jewelry EMI Calculator
                  </h2>
                  <p className="text-xs text-zinc-500 font-figtree mt-0.5">Real-time monthly installment estimate</p>
                </div>
                <span className="rounded-[4px] bg-[#EAF7EE] text-[#00A63E] border border-[#B8DAB6] text-[11px] font-semibold px-2.5 py-1 font-figtree uppercase tracking-wider">
                  0% Interest
                </span>
              </div>

              {/* 1. Value input & slider */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Jewelry Value</span>
                  <span className="text-[18px] font-bold text-[#5A413F]">
                    ₹{formatINR(totalAmount)}
                  </span>
                </div>

                <input
                  type="range"
                  min={50000}
                  max={300000}
                  step={5000}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="emi-slider w-full"
                />

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTotalAmount(amt)}
                      className={`text-xs px-3 py-1.5 rounded-[6px] border font-figtree transition-all cursor-pointer ${
                        totalAmount === amt
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      ₹{formatINR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Down Payment (Gold Component) */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Gold Down Payment</span>
                  <span className="text-[13px] font-semibold text-[#5A413F]">
                    ₹{formatINR(downPaymentAmount)} <span className="text-xs text-zinc-400 font-normal">({downPaymentPercent}%)</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0, 20, 30, 40].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDownPaymentPercent(pct)}
                      className={`h-[38px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                        downPaymentPercent === pct
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      {pct === 0 ? "0% (Diamond)" : `${pct}% Gold`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Tenure Selection */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Tenure</span>
                  <span className="text-[13px] font-semibold text-[#5A413F]">{tenure} Months</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {TENURES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTenure(t)}
                      className={`h-[40px] rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                        tenure === t
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      <span className="text-[13px] font-bold">{t} Mo</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Results Card (Checkout Summary Breakdown Style) */}
              <div className="mt-5 bg-white border border-[#EBE1D7] rounded-[8px] p-4 space-y-3 font-figtree shadow-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-medium text-zinc-600">Monthly Installment</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[24px] font-bold text-[#5A413F] leading-none">
                      ₹{formatINR(monthlyEmi)}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">/ month</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBE1D7] space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>Financed Diamond Amount:</span>
                    <span className="font-semibold text-zinc-900">₹{formatINR(financedDiamondAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>Gold Down Payment:</span>
                    <span className="font-semibold text-zinc-900">₹{formatINR(downPaymentAmount)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBE1D7]/60 flex justify-between items-center text-xs text-[#00A63E] font-medium">
                  <span>Processing Fee: ₹0</span>
                  <span>0% Interest EMI</span>
                </div>
              </div>

              {/* Action Button (Checkout Button Style) */}
              <button
                type="button"
                onClick={() => scrollToId("products")}
                className="mt-5 w-full h-[46px] rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] text-white font-figtree font-medium uppercase tracking-wider text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <ShoppingBag size={15} />
                <span>Explore Eligible Jewelry</span>
              </button>

              <p className="text-[11px] text-zinc-400 text-center mt-2.5 font-figtree">
                *Illustration only. Subject to partner approval & KYC verification.
              </p>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
