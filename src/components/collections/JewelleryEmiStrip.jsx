"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag
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
    makingChargesOptions: [
      { percent: 0, label: "0% (FREE)" },
    ],
    defaultMakingChargesPercent: 0,
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
  const initialDiamond = Math.max(0, initialPreTax - initialDown - initialMaking);

  const [diamondAmount, setDiamondAmount] = useState(initialDiamond);
  const [tenure, setTenure] = useState(calc.defaultTenure || 6);

  // Making charges: Rupee amount entered by user
  const [customMakingChargesInput, setCustomMakingChargesInput] = useState(String(initialMaking));

  // Down payment is a rupee amount the shopper types
  const [customDownPaymentInput, setCustomDownPaymentInput] = useState(String(initialDown));

  // Custom amount state (when user wants to enter custom jewelry value)
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState(String(initialDefaultVal));

  // Custom tenure state (when user wants to enter custom months)
  const [isCustomTenure, setIsCustomTenure] = useState(false);
  const [customTenureInput, setCustomTenureInput] = useState(String(calc.defaultTenure || 6));

  // Custom interest rate state (defaults to 0% for 0-Cost EMI)
  const [interestRate, setInterestRate] = useState(0);
  const [isCustomInterest, setIsCustomInterest] = useState(false);
  const [customInterestInput, setCustomInterestInput] = useState("0");

  // Calculations
  const downPaymentAmount = useMemo(() => {
    const amt = parseInt(customDownPaymentInput, 10);
    return Math.max(0, isNaN(amt) ? 0 : amt);
  }, [customDownPaymentInput]);

  const makingChargesAmount = useMemo(() => {
    const amt = parseInt(customMakingChargesInput, 10);
    return Math.max(0, isNaN(amt) ? 0 : amt);
  }, [customMakingChargesInput]);

  // Pre-tax subtotal = Down Payment (Gold) + Diamond Component + Making Charges
  const preTaxSubtotal = useMemo(() => {
    return downPaymentAmount + diamondAmount + makingChargesAmount;
  }, [downPaymentAmount, diamondAmount, makingChargesAmount]);

  // GST (3% govt standard for jewelry in India)
  const gstAmount = useMemo(() => {
    if (gstPercent <= 0) return 0;
    return Math.round(preTaxSubtotal * (gstPercent / 100));
  }, [preTaxSubtotal, gstPercent]);

  // Total Financed Amount under 0% EMI (covers Diamond + Making Charges + GST)
  const financedAmount = useMemo(() => {
    return Math.max(0, diamondAmount + makingChargesAmount + gstAmount);
  }, [diamondAmount, makingChargesAmount, gstAmount]);

  // Total jewelry value = Gold down payment + Financed amount
  const totalAmount = useMemo(() => {
    return downPaymentAmount + financedAmount;
  }, [downPaymentAmount, financedAmount]);

  // Share of the jewelry value the down payment covers (shown next to the amount).
  const downPaymentSharePercent = totalAmount > 0 ? Math.round((downPaymentAmount / totalAmount) * 100) : 0;

  // Monthly EMI (supports 0-cost and custom annual interest rate)
  const monthlyEmi = useMemo(() => {
    if (tenure <= 0 || financedAmount <= 0) return 0;
    if (!interestRate || interestRate <= 0) {
      return Math.round(financedAmount / tenure);
    }
    const r = (interestRate / 12) / 100;
    const emi = (financedAmount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
    return Math.round(emi);
  }, [financedAmount, tenure, interestRate]);

  const handleJewelryValueChange = (newTotal, fromPreset = false) => {
    const preTax = Math.round(newTotal / (1 + gstPercent / 100));
    const downAmt = Math.round((newTotal * 20) / 100);
    const makingAmt = Math.round(((preTax * 0.08) / 100)) * 100;
    const diaAmt = Math.max(0, preTax - downAmt - makingAmt);

    setCustomDownPaymentInput(String(downAmt));
    setCustomMakingChargesInput(String(makingAmt));
    setDiamondAmount(diaAmt);
    setCustomAmountInput(String(newTotal));
    if (fromPreset) {
      setIsCustomAmount(false);
    }
  };

  const handleCustomJewelryValueInput = (val) => {
    setCustomAmountInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      const preTax = Math.round(num / (1 + gstPercent / 100));
      const curDown = parseInt(customDownPaymentInput, 10) || Math.round(num * 0.2);
      const curMaking = parseInt(customMakingChargesInput, 10) || 0;
      const diaAmt = Math.max(0, preTax - curDown - curMaking);
      setDiamondAmount(diaAmt);
    }
  };

  // Total Interest for custom interest rates
  const totalInterest = useMemo(() => {
    if (tenure <= 0 || financedAmount <= 0 || !interestRate || interestRate <= 0) return 0;
    return Math.max(0, Math.round(monthlyEmi * tenure - financedAmount));
  }, [monthlyEmi, tenure, financedAmount, interestRate]);

  const totalPayable = useMemo(() => {
    return financedAmount + totalInterest;
  }, [financedAmount, totalInterest]);

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

  // Separate the facts/plan block from the hero text so facts can render full-width below the calculator
  const heroMainHtml = useMemo(() => {
    if (!legacyHeroHtml || typeof legacyHeroHtml !== "string") return null;
    const factsRegex = /(?:<p[^>]*>[\s\S]*?(?:Lucira Jewelry EMI Plan|EMI Plan|Plan:)[\s\S]*?<\/p>\s*)?<div class="facts"[^>]*>[\s\S]*?<\/div>/i;
    const match = legacyHeroHtml.match(factsRegex);
    return match ? legacyHeroHtml.replace(match[0], "") : legacyHeroHtml;
  }, [legacyHeroHtml]);

  const heroFactsHtml = useMemo(() => {
    if (!legacyHeroHtml || typeof legacyHeroHtml !== "string") return null;
    const factsRegex = /(?:<p[^>]*>[\s\S]*?(?:Lucira Jewelry EMI Plan|EMI Plan|Plan:)[\s\S]*?<\/p>\s*)?<div class="facts"[^>]*>[\s\S]*?<\/div>/i;
    const match = legacyHeroHtml.match(factsRegex);
    return match ? match[0] : null;
  }, [legacyHeroHtml]);

  const isHeroEnabled = settings.hero.enabled !== false;
  const activeFacts = (settings.facts || []).filter((f) => f.enabled !== false);
  const activeButtons = (settings.hero.buttons || []).filter((b) => b.enabled !== false);

  return (
    <section className="jewellery-emi-strip w-full bg-white border-b border-[#EBE1D7]">
      <div className="container-main py-6 lg:py-10">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400 font-figtree mb-5 lg:mb-6">
          <Link href="/" className="hover:text-[#5A413F] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/collections/all" className="hover:text-[#5A413F] transition-colors">Collections</Link>
          <span>/</span>
          <span className="text-[#5A413F] font-semibold">Jewelry on EMI</span>
        </nav>

        {/* Hero & Sleek Compact Calculator Grid */}
        <div className={isHeroEnabled ? "grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start" : "max-w-xl mx-auto"}>

          {/* Left Column: Hero Content */}
          {isHeroEnabled && (
            <div className="lg:col-span-7 space-y-5 jewellery-emi-dynamic-hero">
              {heroMainHtml ? (
                <div dangerouslySetInnerHTML={{ __html: heroMainHtml }} />
              ) : (
                <div className="hero space-y-4">
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
                </div>
              )}
            </div>
          )}

          {/* Right Column: Sleek & Compact Luxury EMI Calculator */}
          <div className={isHeroEnabled ? "lg:col-span-5" : "w-full"} id="calculator">
            <div className="bg-[#FAF6F4] border border-[#EBE1D7] rounded-[10px] p-4 lg:p-4.5 shadow-[0_2px_12px_-2px_rgba(90,65,63,0.06)] font-figtree">

              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EBE1D7]">
                <div>
                  <h2 className="font-figtree font-semibold text-sm sm:text-[15px] text-[#2B2523] leading-tight">
                    {calc.title || "Jewelry EMI Calculator"}
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-figtree mt-0.5">
                    {calc.subtitle || "Real-time monthly installment estimate"}
                  </p>
                </div>
                {/* Interest Badge / Switcher */}
                {interestRate === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomInterest(true);
                      setInterestRate(12);
                      setCustomInterestInput("12");
                    }}
                    className="rounded-[4px] bg-[#EAF7EE] text-[#00A63E] border border-[#B8DAB6] text-[10px] font-semibold px-2 py-0.5 font-figtree uppercase tracking-wider hover:bg-[#dcfce7] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Click to check custom interest"
                  >
                    <span>{calc.interestBadge || "0% Interest"}</span>
                    <span className="text-[9px] font-semibold text-zinc-600 bg-white/80 px-1 py-0.2 rounded border border-[#B8DAB6]">Custom %</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setInterestRate(0);
                      setIsCustomInterest(false);
                      setCustomInterestInput("0");
                    }}
                    className="rounded-[4px] bg-[#FFF8E7] text-[#B45309] border border-[#FDE68A] text-[10px] font-semibold px-2 py-0.5 font-figtree uppercase tracking-wider hover:bg-[#FEF3C7] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Click to reset to 0% Interest"
                  >
                    <span>{interestRate}% Interest</span>
                    <span className="text-[9px] font-semibold text-[#B45309] bg-white/80 px-1 py-0.2 rounded border border-[#FDE68A]">Reset 0%</span>
                  </button>
                )}
              </div>

              {/* 1. Value input & slider */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between font-figtree text-xs">
                  <span className="font-medium text-zinc-700">Jewelry Value</span>
                  <span className="font-semibold text-sm text-[#5A413F]">
                    ₹{formatINR(totalAmount)} {isCustomAmount && <span className="text-[10px] font-normal text-zinc-400">(Custom)</span>}
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

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {(calc.presetAmounts || []).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleJewelryValueChange(amt, true)}
                      className={`text-[11px] px-2 py-0.5 rounded-[3px] border font-figtree transition-all cursor-pointer ${
                        !isCustomAmount && totalAmount === amt
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-2xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F] font-medium"
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
                    className={`text-[11px] px-2 py-0.5 rounded-[3px] border font-figtree transition-all cursor-pointer ${
                      isCustomAmount
                        ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-2xs"
                        : "bg-white text-[#5A413F] border-[#5A413F]/40 hover:border-[#5A413F] hover:bg-[#FAF6F4] font-medium"
                    }`}
                    title="Enter custom jewelry value"
                  >
                    Custom
                  </button>
                </div>

                {/* Custom Amount Input Panel */}
                {isCustomAmount && (
                  <div className="mt-1 p-1.5 rounded-[4px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-2xs">
                    <span className="text-[11px] font-medium text-zinc-600 font-figtree">
                      Enter custom value:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const step = calc.stepValue || 5000;
                          const nextVal = Math.max(1000, totalAmount - step);
                          handleJewelryValueChange(nextVal);
                        }}
                        className="w-5 h-5 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer"
                      >
                        −
                      </button>
                      <div className="relative flex items-center">
                        <span className="absolute left-1.5 text-[11px] font-semibold text-[#5A413F]">₹</span>
                        <input
                          type="number"
                          min={1000}
                          max={5000000}
                          step={calc.stepValue || 5000}
                          value={customAmountInput}
                          placeholder="50000"
                          onChange={(e) => handleCustomJewelryValueInput(e.target.value)}
                          className="w-20 h-5 pl-4 pr-1 font-semibold text-[11px] text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const step = calc.stepValue || 5000;
                          const nextVal = totalAmount + step;
                          handleJewelryValueChange(nextVal);
                        }}
                        className="w-5 h-5 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Down Payment (Gold Component) - Compact Single-Row Stepper */}
              <div className="mt-2.5 flex items-center justify-between gap-2 bg-white border border-[#EBE1D7] rounded-[6px] px-2.5 py-1.5 shadow-2xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-800 font-figtree">Gold Down Payment</span>
                    <span className="text-[10px] text-zinc-500 font-normal">({downPaymentSharePercent}%)</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-figtree leading-none mt-0.5">Paid upfront as gold component</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = Math.max(0, downPaymentAmount - 1000);
                      setCustomDownPaymentInput(String(nextVal));
                    }}
                    className="w-6 h-6 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer transition-colors"
                    title="Decrease by ₹1,000"
                  >
                    −
                  </button>
                  <div className="relative flex items-center">
                    <span className="absolute left-1.5 text-xs font-semibold text-[#5A413F]">₹</span>
                    <input
                      type="number"
                      min={0}
                      max={totalAmount}
                      step={1000}
                      value={customDownPaymentInput}
                      placeholder="15000"
                      onChange={(e) => setCustomDownPaymentInput(e.target.value)}
                      className="w-20 h-6 pl-4 pr-1 text-center font-semibold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = Math.min(totalAmount, downPaymentAmount + 1000);
                      setCustomDownPaymentInput(String(nextVal));
                    }}
                    className="w-6 h-6 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer transition-colors"
                    title="Increase by ₹1,000"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Tenure Selection - Compact Row */}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-zinc-800 font-figtree block">Tenure</span>
                  <span className="text-[10px] text-zinc-400 font-figtree block leading-none mt-0.5">
                    {tenure} Months {isCustomTenure && "(Custom)"}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {calc.tenures.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTenure(t);
                        setIsCustomTenure(false);
                      }}
                      className={`h-7 px-2.5 rounded-[4px] border font-figtree transition-all cursor-pointer flex items-center justify-center text-xs ${
                        !isCustomTenure && tenure === t
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-2xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F] font-medium"
                      }`}
                    >
                      {t} Mo
                    </button>
                  ))}

                  {calc.allowCustomTenure && (
                    <button
                      type="button"
                      onClick={() => setIsCustomTenure(true)}
                      className={`h-7 px-2.5 rounded-[4px] border font-figtree transition-all cursor-pointer flex items-center justify-center text-xs ${
                        isCustomTenure
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-2xs"
                          : "bg-white text-[#5A413F] border-[#5A413F]/40 hover:border-[#5A413F] hover:bg-[#FAF6F4] font-medium"
                      }`}
                      title="Enter a custom tenure in months"
                    >
                      Custom
                    </button>
                  )}
                </div>
              </div>

              {/* Custom Tenure Input Panel */}
              {isCustomTenure && (
                <div className="mt-1 p-1.5 rounded-[4px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-2xs">
                  <span className="text-[11px] font-medium text-zinc-600 font-figtree">
                    Choose months ({calc.minCustomTenure || 1}–{calc.maxCustomTenure || 36} mos):
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const minVal = calc.minCustomTenure || 1;
                        const nextVal = Math.max(minVal, tenure - 1);
                        setTenure(nextVal);
                        setCustomTenureInput(String(nextVal));
                      }}
                      className="w-5 h-5 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={calc.minCustomTenure || 1}
                      max={calc.maxCustomTenure || 36}
                      value={customTenureInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTenureInput(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num > 0) {
                          const clamped = Math.min(calc.maxCustomTenure || 36, Math.max(calc.minCustomTenure || 1, num));
                          setTenure(clamped);
                        }
                      }}
                      className="w-10 h-5 text-center font-semibold text-[11px] text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const maxVal = calc.maxCustomTenure || 36;
                        const nextVal = Math.min(maxVal, tenure + 1);
                        setTenure(nextVal);
                        setCustomTenureInput(String(nextVal));
                      }}
                      className="w-5 h-5 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Making Charges - Compact Single-Row Stepper */}
              <div className="mt-2.5 flex items-center justify-between gap-2 bg-white border border-[#EBE1D7] rounded-[6px] px-2.5 py-1.5 shadow-2xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-800 font-figtree">Making Charges</span>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                      On EMI
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-figtree leading-none mt-0.5">Financed at 0% extra cost</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCustomMakingChargesInput(String(Math.max(0, makingChargesAmount - 500)))}
                    className="w-6 h-6 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer transition-colors"
                    title="Decrease by ₹500"
                  >
                    −
                  </button>
                  <div className="relative flex items-center">
                    <span className="absolute left-1.5 text-xs font-semibold text-[#5A413F]">₹</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={customMakingChargesInput}
                      placeholder="0"
                      onChange={(e) => setCustomMakingChargesInput(e.target.value)}
                      className="w-20 h-6 pl-4 pr-1 text-center font-semibold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomMakingChargesInput(String(makingChargesAmount + 500))}
                    className="w-6 h-6 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer transition-colors"
                    title="Increase by ₹500"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 5. GST (3% Standard Government Rate) */}
              <div className="mt-2.5 flex items-center justify-between text-xs px-1 font-figtree">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-700">Goods & Services Tax (GST)</span>
                  <span className="text-[9px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded">
                    3% Standard
                  </span>
                </div>
                <span className="font-semibold text-xs text-[#5A413F]">
                  ₹{formatINR(gstAmount)}
                </span>
              </div>

              {/* 6. Interest Rate Row */}
              <div className="mt-2.5 flex items-center justify-between gap-2 px-1 font-figtree text-xs">
                <span className="font-medium text-zinc-700">Interest Rate (p.a.)</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setInterestRate(0);
                      setIsCustomInterest(false);
                      setCustomInterestInput("0");
                    }}
                    className={`h-6 px-2 rounded-[3px] border font-figtree transition-all cursor-pointer text-[11px] ${
                      interestRate === 0 && !isCustomInterest
                        ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-2xs"
                        : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F] font-medium"
                    }`}
                  >
                    0% (No-Cost)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomInterest(true);
                      const val = interestRate === 0 ? 12 : interestRate;
                      setInterestRate(val);
                      setCustomInterestInput(String(val));
                    }}
                    className={`h-6 px-2 rounded-[3px] border font-figtree transition-all cursor-pointer text-[11px] ${
                      isCustomInterest || interestRate > 0
                        ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-2xs"
                        : "bg-white text-[#5A413F] border-[#5A413F]/40 hover:border-[#5A413F] hover:bg-[#FAF6F4] font-medium"
                    }`}
                  >
                    Custom %
                  </button>
                </div>
              </div>

              {/* Custom Interest Input (if active) */}
              {isCustomInterest && (
                <div className="mt-1 p-1.5 rounded-[4px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-2xs">
                  <span className="text-[11px] font-medium text-zinc-600 font-figtree">
                    Interest rate per annum:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = Math.max(0, interestRate - 1);
                        setInterestRate(nextVal);
                        setCustomInterestInput(String(nextVal));
                      }}
                      className="w-5 h-5 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer"
                    >
                      −
                    </button>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={36}
                        step={0.5}
                        value={customInterestInput}
                        placeholder="12"
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomInterestInput(val);
                          const num = parseFloat(val);
                          if (!isNaN(num) && num >= 0) {
                            setInterestRate(Math.min(36, num));
                          }
                        }}
                        className="w-12 h-5 pr-3 text-center font-semibold text-[11px] text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                      />
                      <span className="absolute right-1 text-[10px] font-semibold text-zinc-500">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = Math.min(36, interestRate + 1);
                        setInterestRate(nextVal);
                        setCustomInterestInput(String(nextVal));
                      }}
                      className="w-5 h-5 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-semibold flex items-center justify-center text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* 7. Results Card (Checkout Summary Style) */}
              <div className="mt-3 bg-white border border-[#EBE1D7] rounded-[8px] p-3 space-y-2 font-figtree shadow-2xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-[#3D2B28] uppercase tracking-[0.4px]">Monthly Installment</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[19px] font-semibold text-[#5A413F] leading-none">
                      ₹{formatINR(monthlyEmi)}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">/ month</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBE1D7] space-y-1 text-xs">
                  {/* Financed Amount Row & Badge */}
                  <div className="flex justify-between items-center text-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-800">Financed on No Cost EMI:</span>
                      <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                        0% Interest
                      </span>
                    </div>
                    <span className="font-semibold text-[#5A413F] text-xs">₹{formatINR(financedAmount)}</span>
                  </div>

                  {/* Itemized Components included in EMI */}
                  <div className="ml-2 pl-2 border-l border-[#5A413F]/20 space-y-0.5 text-[11px] text-zinc-600">
                    <div className="flex justify-between items-center">
                      <span>• Diamond Component:</span>
                      <span className="font-semibold text-zinc-800">₹{formatINR(diamondAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• Making Charges:</span>
                      <span className="font-semibold text-zinc-800">₹{formatINR(makingChargesAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• GST (3%):</span>
                      <span className="font-semibold text-zinc-800">₹{formatINR(gstAmount)}</span>
                    </div>
                  </div>

                  {/* Gold Down Payment */}
                  <div className="pt-1 border-t border-[#EBE1D7]/70 flex justify-between items-center text-zinc-700">
                    <span className="font-medium">Gold Down Payment ({downPaymentSharePercent}%):</span>
                    <span className="font-semibold text-zinc-800">₹{formatINR(downPaymentAmount)}</span>
                  </div>
                </div>

                {/* Savings Banner */}
                <div className="pt-1.5 border-t border-[#EBE1D7]/60 flex flex-col gap-1 text-xs">
                  {interestRate === 0 ? (
                    <div className="rounded-[4px] bg-[#EAF7EE] border border-[#B8DAB6]/40 px-2.5 py-1 flex justify-between items-center text-[11px] font-semibold text-[#00A63E]">
                      <span>Processing Fee: ₹0</span>
                      <span>0% Interest EMI</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-zinc-600">
                        <span>Total Interest ({interestRate}% p.a.):</span>
                        <span className="font-semibold text-zinc-800">₹{formatINR(totalInterest)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#B45309]">
                        <span>Total Payable (Financed + Interest):</span>
                        <span className="font-semibold">₹{formatINR(totalPayable)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button (Checkout Button Style) */}
              <button
                type="button"
                onClick={() => scrollToId(calc.ctaTarget || "products")}
                className="mt-3 w-full h-[40px] rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] text-white font-figtree font-semibold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <ShoppingBag size={14} />
                <span>{calc.ctaText || "Explore Eligible Jewelry"}</span>
              </button>

              <p className="text-[10px] text-zinc-400 text-center mt-1.5 font-figtree">
                {calc.disclaimer || "*Illustration only. Subject to partner approval & KYC verification."}
              </p>

            </div>
          </div>

        </div>

        {/* Full-width Facts / EMI Plan strip below hero & calculator */}
        {(heroFactsHtml || activeFacts.length > 0) && (
          <div className="w-full mt-8 pt-6 border-t border-[#EBE1D7]">
            {heroFactsHtml ? (
              <div
                className="jewellery-emi-facts-fullwidth"
                dangerouslySetInnerHTML={{ __html: heroFactsHtml }}
              />
            ) : (
              <div className="jewellery-emi-facts-fullwidth">
                <p className="font-figtree text-xs font-semibold text-[#3D2B28] uppercase tracking-wider mb-3">
                  Lucira Jewelry EMI Plan:
                </p>
                <div className="facts">
                  {activeFacts.map((fact) => (
                    <div key={fact.id || fact.title} className="fact">
                      <b>{fact.title}</b>
                      <span>{fact.subtitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
