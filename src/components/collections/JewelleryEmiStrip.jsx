"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Sliders
} from "lucide-react";
import "@/styles/jewellery-on-emi.css";

const DEFAULT_EMI_SETTINGS = {
  hero: {
    enabled: true,
    lead: "You can buy jewelry on EMI at Lucira where eligible, with 0-cost EMI and tenures of 3, 6, 9 and 12 months.",
    scope: {
      enabled: true,
      title: "EMI applies only to the eligible diamond component of a piece. We do not finance the gold component.",
      subtitle: "The gold component is paid as a down payment.",
    },
    description: "Get your jewelry without waiting for the final EMI. Once the required approval, KYC and order formalities are completed, eligible ready-to-ship (RTS) and made-to-order (MTO) orders can be handed over while the remaining EMIs continue as scheduled.",
    showDescription: true,
    buttons: [
      { id: "btn_1", label: "See how EMI works", href: "#how-it-works", variant: "primary", enabled: true },
      { id: "btn_2", label: "Visit an Experience Centre", href: "#experience-centres", variant: "secondary", enabled: true },
    ],
    trustText: "Certified lab-grown diamonds · Experience Centres in Mumbai, Pune, Noida and Delhi",
    showTrustText: true,
  },
  facts: [
    { id: "fact_1", title: "3 or 6", subtitle: "month EMI tenures", enabled: true },
    { id: "fact_2", title: "No cost EMI", subtitle: "on diamond, making charges and GST", enabled: true },
    { id: "fact_3", title: "₹0", subtitle: "processing fee", enabled: true },
    { id: "fact_4", title: "No extra cost", subtitle: "on your EMIs when paid on time", enabled: true },
  ],
  calculator: {
    title: "Jewelry EMI Calculator",
    subtitle: "Real-time monthly installment estimate",
    interestBadge: "0% Interest",
    minValue: 50000,
    maxValue: 300000,
    stepValue: 5000,
    defaultValue: 75000,
    presetAmounts: [50000, 75000, 100000, 150000, 200000],
    downPaymentOptions: [
      { percent: 0, label: "0% (Diamond)" },
      { percent: 20, label: "20% Gold" },
      { percent: 30, label: "30% Gold" },
      { percent: 40, label: "40% Gold" },
    ],
    defaultDownPaymentPercent: 20,
    // Making charges: 0% (free) plus a Custom % input only.
    makingChargesOptions: [
      { percent: 0, label: "0% (FREE)" },
    ],
    defaultMakingChargesPercent: 0,
    // GST is always the 3% government rate (no 0% option).
    gstPercent: 3,
    tenures: [3, 6, 9, 12],
    defaultTenure: 6,
    allowCustomTenure: true,
    minCustomTenure: 1,
    maxCustomTenure: 36,
    disclaimer: "*Illustration only. Subject to partner approval & KYC verification.",
    ctaText: "Explore Eligible Jewelry",
    ctaTarget: "products",
  },
};

export default function JewelleryEmiStrip({ onShopClick, descriptionHtml, emiSettings = null }) {
  // Merged settings: prop > fallback defaults
  const settings = useMemo(() => {
    if (!emiSettings) return DEFAULT_EMI_SETTINGS;
    return {
      hero: {
        ...DEFAULT_EMI_SETTINGS.hero,
        ...(emiSettings.hero || {}),
        scope: { ...DEFAULT_EMI_SETTINGS.hero.scope, ...(emiSettings.hero?.scope || {}) },
        buttons: Array.isArray(emiSettings.hero?.buttons) ? emiSettings.hero.buttons : DEFAULT_EMI_SETTINGS.hero.buttons,
      },
      facts: Array.isArray(emiSettings.facts) ? emiSettings.facts : DEFAULT_EMI_SETTINGS.facts,
      calculator: {
        ...DEFAULT_EMI_SETTINGS.calculator,
        ...(emiSettings.calculator || {}),
        presetAmounts: Array.isArray(emiSettings.calculator?.presetAmounts)
          ? emiSettings.calculator.presetAmounts
          : DEFAULT_EMI_SETTINGS.calculator.presetAmounts,
        downPaymentOptions: Array.isArray(emiSettings.calculator?.downPaymentOptions)
          ? emiSettings.calculator.downPaymentOptions
          : DEFAULT_EMI_SETTINGS.calculator.downPaymentOptions,
        makingChargesOptions: Array.isArray(emiSettings.calculator?.makingChargesOptions)
          ? emiSettings.calculator.makingChargesOptions
          : DEFAULT_EMI_SETTINGS.calculator.makingChargesOptions,
        defaultMakingChargesPercent: emiSettings.calculator?.defaultMakingChargesPercent ?? DEFAULT_EMI_SETTINGS.calculator.defaultMakingChargesPercent,
        gstPercent: emiSettings.calculator?.gstPercent ?? DEFAULT_EMI_SETTINGS.calculator.gstPercent,
        tenures: Array.isArray(emiSettings.calculator?.tenures)
          ? emiSettings.calculator.tenures
          : DEFAULT_EMI_SETTINGS.calculator.tenures,
      },
    };
  }, [emiSettings]);

  const calc = settings.calculator;

  // Calculator state
  const gstPercent = 3;
  const initialDefaultVal = calc.defaultValue || 75000;
  const initialPreTax = Math.round(initialDefaultVal / (1 + gstPercent / 100));
  const initialDown = Math.round((initialDefaultVal * 20) / 100);
  const initialMaking = Math.round(((initialPreTax * 0.08) / 100)) * 100;

  // Primary state: Total Jewelry Value (remains stable when Gold Down Payment changes)
  const [totalAmount, setTotalAmount] = useState(initialDefaultVal);
  const [tenure, setTenure] = useState(calc.defaultTenure || 6);

  // Making charges: Rupee amount entered by user
  const [customMakingChargesInput, setCustomMakingChargesInput] = useState(String(initialMaking));

  // Down payment is a rupee amount the shopper types (portion of Total Jewelry Value)
  const [customDownPaymentInput, setCustomDownPaymentInput] = useState(String(initialDown));

  // Custom amount state (when user wants to enter custom jewelry value)
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState(String(initialDefaultVal));

  // Calculations
  const downPaymentAmount = useMemo(() => {
    const amt = parseInt(customDownPaymentInput, 10);
    return Math.min(totalAmount, Math.max(0, isNaN(amt) ? 0 : amt));
  }, [customDownPaymentInput, totalAmount]);

  const preTaxTotal = useMemo(() => {
    return Math.round(totalAmount / (1 + gstPercent / 100));
  }, [totalAmount, gstPercent]);

  const gstAmount = useMemo(() => {
    return Math.max(0, totalAmount - preTaxTotal);
  }, [totalAmount, preTaxTotal]);

  const makingChargesAmount = useMemo(() => {
    const amt = parseInt(customMakingChargesInput, 10);
    return Math.max(0, isNaN(amt) ? 0 : amt);
  }, [customMakingChargesInput]);

  // Diamond component covers the rest of the pre-tax total after Gold and Making Charges
  const diamondAmount = useMemo(() => {
    return Math.max(0, preTaxTotal - downPaymentAmount - makingChargesAmount);
  }, [preTaxTotal, downPaymentAmount, makingChargesAmount]);

  // Total Financed Amount under 0% EMI (Total - Gold Down Payment)
  const financedAmount = useMemo(() => {
    return Math.max(0, totalAmount - downPaymentAmount);
  }, [totalAmount, downPaymentAmount]);

  // Share of the jewelry value the down payment covers (shown next to the amount).
  const downPaymentSharePercent = totalAmount > 0 ? Math.round((downPaymentAmount / totalAmount) * 100) : 0;

  // Monthly EMI (0% No Cost EMI)
  const monthlyEmi = useMemo(() => {
    if (tenure <= 0 || financedAmount <= 0) return 0;
    return Math.round(financedAmount / tenure);
  }, [financedAmount, tenure]);

  const handleJewelryValueChange = (newTotal, fromPreset = false) => {
    setTotalAmount(newTotal);
    const preTax = Math.round(newTotal / (1 + gstPercent / 100));
    const downAmt = Math.round((newTotal * 20) / 100);
    const makingAmt = Math.round(((preTax * 0.08) / 100)) * 100;

    setCustomDownPaymentInput(String(downAmt));
    setCustomMakingChargesInput(String(makingAmt));
    setCustomAmountInput(String(newTotal));
    if (fromPreset) {
      setIsCustomAmount(false);
    }
  };

  const handleCustomJewelryValueInput = (val) => {
    setCustomAmountInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setTotalAmount(num);
    }
  };

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

  // The hero lives in the Shopify collection description; dashboard settings / defaults are the fallback.
  // The hero div ends right before the next HTML comment, the TOC nav or the first section.
  const legacyHeroHtml = useMemo(() => {
    if (!descriptionHtml || typeof descriptionHtml !== "string") return null;
    const match = descriptionHtml.match(/<div class="hero">[\s\S]*?<\/div>\s*(?=<!--|<nav class="toc"|<section|$)/i);
    return match ? match[0] : null;
  }, [descriptionHtml]);

  const isHeroEnabled = settings.hero.enabled !== false;
  const activeFacts = (settings.facts || []).filter((f) => f.enabled !== false);
  const activeButtons = (settings.hero.buttons || []).filter((b) => b.enabled !== false);

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
        <div className={isHeroEnabled ? "grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start" : "max-w-xl mx-auto"}>

          {/* Left Column: Hero Content */}
          {isHeroEnabled && (
            <div className="lg:col-span-7 space-y-6 jewellery-emi-dynamic-hero">
              {/* Either structured dashboard-managed hero or legacy HTML */}
              {legacyHeroHtml ? (
                <div dangerouslySetInnerHTML={{ __html: legacyHeroHtml }} />
              ) : (
                <div className="hero space-y-5">
                  {/* Lead Headline */}
                  {settings.hero.lead && (
                    <p className="lead">{settings.hero.lead}</p>
                  )}

                  {/* Scope Box */}
                  {settings.hero.scope?.enabled && (settings.hero.scope.title || settings.hero.scope.subtitle) && (
                    <div className="scope">
                      {settings.hero.scope.title && (
                        <p><strong>{settings.hero.scope.title}</strong></p>
                      )}
                      {settings.hero.scope.subtitle && (
                        <p>{settings.hero.scope.subtitle}</p>
                      )}
                    </div>
                  )}

                  {/* Description Paragraph */}
                  {settings.hero.showDescription && settings.hero.description && (
                    <p
                      className="font-figtree text-[14px] text-zinc-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: settings.hero.description }}
                    />
                  )}

                  {/* Action Buttons */}
                  {activeButtons.length > 0 && (
                    <div className="btns">
                      {activeButtons.map((btn) => (
                        <a
                          key={btn.id || btn.label}
                          href={btn.href}
                          onClick={(e) => {
                            if (btn.href?.startsWith("#")) {
                              e.preventDefault();
                              scrollToId(btn.href.slice(1));
                            }
                          }}
                          className={`btn ${btn.variant === "secondary" ? "btn-s" : "btn-p"}`}
                        >
                          {btn.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Trust Text */}
                  {settings.hero.showTrustText && settings.hero.trustText && (
                    <p className="trust">{settings.hero.trustText}</p>
                  )}

                  {/* Fact Cards (Removable / Customizable from Dashboard) */}
                  {activeFacts.length > 0 && (
                    <div
                      className="facts"
                      data-count={activeFacts.length}
                      style={{
                        gridTemplateColumns: activeFacts.length <= 2
                          ? `repeat(${activeFacts.length}, minmax(0, 1fr))`
                          : activeFacts.length === 3
                          ? `repeat(3, minmax(0, 1fr))`
                          : undefined
                      }}
                    >
                      {activeFacts.map((fact) => (
                        <div key={fact.id || fact.title} className="fact">
                          <b>{fact.title}</b>
                          <span>{fact.subtitle}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right Column (or centered when no hero): Spacious, Elegant EMI Calculator */}
          <div className={isHeroEnabled ? "lg:col-span-5" : "w-full"} id="calculator">
            <div className="bg-[#FAF6F4] border border-[#EBE1D7] rounded-[10px] p-6 lg:p-7 shadow-[0_4px_24px_-4px_rgba(90,65,63,0.07)]">

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EBE1D7]">
                <div>
                  <h2 className="font-figtree font-semibold text-[17px] text-[#2B2523] leading-tight">
                    {calc.title || "Jewelry EMI Calculator"}
                  </h2>
                  <p className="text-xs text-zinc-500 font-figtree mt-0.5">
                    {calc.subtitle || "Real-time monthly installment estimate"}
                  </p>
                </div>
                {/* Interest Badge */}
                <div className="rounded-[4px] bg-[#EAF7EE] text-[#00A63E] border border-[#B8DAB6] text-[11px] font-semibold px-2.5 py-1 font-figtree uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span>{calc.interestBadge || "0% Interest"}</span>
                </div>
              </div>

              {/* 1. Value input & slider */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Jewelry Value</span>
                  <span className="text-[18px] font-bold text-[#5A413F]">
                    ₹{formatINR(totalAmount)} {isCustomAmount && <span className="text-xs font-normal text-zinc-400">(Custom)</span>}
                  </span>
                </div>

                <input
                  type="range"
                  min={calc.minValue || 50000}
                  max={calc.maxValue || 300000}
                  step={calc.stepValue || 5000}
                  value={Math.min(calc.maxValue || 300000, Math.max(calc.minValue || 50000, totalAmount))}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const isPreset = (calc.presetAmounts || []).includes(val);
                    handleJewelryValueChange(val, isPreset);
                  }}
                  className="emi-slider w-full"
                />

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(calc.presetAmounts || []).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        handleJewelryValueChange(amt, true);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-[6px] border font-figtree transition-all cursor-pointer ${
                        !isCustomAmount && totalAmount === amt
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      ₹{formatINR(amt)}
                    </button>
                  ))}

                  {/* Custom Jewelry Value Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(true);
                      setCustomAmountInput(String(totalAmount));
                    }}
                    className={`text-xs px-3 py-1.5 rounded-[6px] border font-figtree transition-all cursor-pointer ${
                      isCustomAmount
                        ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                        : "bg-white text-[#5A413F] border-[#5A413F]/40 hover:border-[#5A413F] hover:bg-[#FAF6F4]"
                    }`}
                    title="Enter custom jewelry value"
                  >
                    Custom
                  </button>
                </div>

                {/* Custom Amount Input Panel */}
                {isCustomAmount && (
                  <div className="mt-2 p-3 rounded-[8px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-xs transition-all">
                    <span className="text-xs font-medium text-zinc-600 font-figtree">
                      Enter amount:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const step = calc.stepValue || 5000;
                          const nextVal = Math.max(1000, totalAmount - step);
                          handleJewelryValueChange(nextVal);
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                        title="Decrease by ₹5,000"
                      >
                        −
                      </button>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-[#5A413F]">₹</span>
                        <input
                          type="number"
                          min={1000}
                          max={5000000}
                          step={calc.stepValue || 5000}
                          value={customAmountInput}
                          placeholder="50000"
                          onChange={(e) => handleCustomJewelryValueInput(e.target.value)}
                          className="w-28 h-7 pl-6 pr-2 font-bold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const step = calc.stepValue || 5000;
                          const nextVal = totalAmount + step;
                          handleJewelryValueChange(nextVal);
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                        title="Increase by ₹5,000"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Down Payment (Gold Component) */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Gold Down Payment</span>
                  <span className="text-[13px] font-semibold text-[#5A413F]">
                    ₹{formatINR(downPaymentAmount)} <span className="text-xs text-zinc-400 font-normal">({downPaymentSharePercent}%)</span>
                  </span>
                </div>

                {/* Down Payment amount input (the only way to set it) */}
                {(
                  <div className="mt-2 p-3 rounded-[8px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-xs transition-all">
                    <span className="text-xs font-medium text-zinc-600 font-figtree">
                      Enter amount:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.max(0, downPaymentAmount - 1000);
                          setCustomDownPaymentInput(String(nextVal));
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                        title="Decrease by ₹1,000"
                      >
                        −
                      </button>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-[#5A413F]">₹</span>
                        <input
                          type="number"
                          min={0}
                          max={totalAmount}
                          step={1000}
                          value={customDownPaymentInput}
                          placeholder="15000"
                          onChange={(e) => setCustomDownPaymentInput(e.target.value)}
                          className="w-28 h-7 pl-6 pr-2 font-bold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.min(totalAmount, downPaymentAmount + 1000);
                          setCustomDownPaymentInput(String(nextVal));
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                        title="Increase by ₹1,000"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-figtree">
                      (max ₹{formatINR(totalAmount)})
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Tenure Selection */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Tenure</span>
                  <span className="text-[13px] font-semibold text-[#5A413F]">
                    {tenure} Months
                  </span>
                </div>

                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${calc.tenures.length}, minmax(0, 1fr))`
                  }}
                >
                  {calc.tenures.map((t) => (
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

              {/* 4. Making Charges */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between font-figtree">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-zinc-700">Making Charges</span>
                    <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                      Financed on EMI
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold text-[#5A413F]">
                    ₹{formatINR(makingChargesAmount)}
                  </span>
                </div>

                {/* Making charges amount (the only way to set it) */}
                <div className="mt-2 p-3 rounded-[8px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-xs transition-all">
                  <span className="text-xs font-medium text-zinc-600 font-figtree">
                    Enter amount:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomMakingChargesInput(String(Math.max(0, makingChargesAmount - 500)))}
                      className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                      title="Decrease by ₹500"
                    >
                      −
                    </button>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs font-bold text-[#5A413F]">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={customMakingChargesInput}
                        placeholder="0"
                        onChange={(e) => setCustomMakingChargesInput(e.target.value)}
                        className="w-28 h-7 pl-6 pr-2 font-bold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomMakingChargesInput(String(makingChargesAmount + 500))}
                      className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                      title="Increase by ₹500"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Results Card (Checkout Summary Breakdown Style) */}
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

                <div className="pt-2.5 border-t border-[#EBE1D7] space-y-2 text-xs">
                  {/* Financed Amount Row & Badge */}
                  <div className="flex justify-between items-center text-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-800">Financed on No Cost EMI:</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        0% Interest
                      </span>
                    </div>
                    <span className="font-bold text-[#5A413F] text-[13px]">₹{formatINR(financedAmount)}</span>
                  </div>

                  {/* Itemized Components included in EMI */}
                  <div className="ml-2 pl-2.5 border-l-2 border-[#5A413F]/25 space-y-1 text-[11.5px] text-zinc-600">
                    <div className="flex justify-between items-center">
                      <span>• Diamond Component:</span>
                      <span className="font-medium text-zinc-900">₹{formatINR(diamondAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span>• Making Charges:</span>
                      </div>
                      <span className="font-medium text-zinc-900">₹{formatINR(makingChargesAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span>• GST:</span>
                        {gstPercent === 0 && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded uppercase">
                            FREE
                          </span>
                        )}
                      </div>
                      <span className={gstPercent === 0 ? "font-bold text-emerald-600" : "font-medium text-zinc-900"}>
                        {gstPercent === 0 ? "₹0 (FREE)" : `₹${formatINR(gstAmount)} (${gstPercent}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Gold Down Payment */}
                  <div className="pt-1.5 border-t border-[#EBE1D7]/70 flex justify-between items-center text-zinc-700">
                    <span className="font-medium">Gold Down Payment ({downPaymentSharePercent}%):</span>
                    <span className="font-semibold text-zinc-900">₹{formatINR(downPaymentAmount)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBE1D7]/60 flex justify-between items-center text-xs font-medium text-[#00A63E]">
                  <span>Processing Fee: ₹0</span>
                  <span>0% Interest EMI</span>
                </div>
              </div>

              {/* Action Button (Checkout Button Style) */}
              <button
                type="button"
                onClick={() => scrollToId(calc.ctaTarget || "products")}
                className="mt-5 w-full h-[46px] rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] text-white font-figtree font-medium uppercase tracking-wider text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <ShoppingBag size={15} />
                <span>{calc.ctaText || "Explore Eligible Jewelry"}</span>
              </button>

              <p className="text-[11px] text-zinc-400 text-center mt-2.5 font-figtree">
                {calc.disclaimer || "*Illustration only. Subject to partner approval & KYC verification."}
              </p>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
