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
    makingChargesOptions: [
      { percent: 0, label: "0% (FREE)" },
      { percent: 8, label: "8%" },
      { percent: 10, label: "10%" },
      { percent: 12, label: "12%" },
    ],
    defaultMakingChargesPercent: 0,
    gstPercent: 0,
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
  const [totalAmount, setTotalAmount] = useState(calc.defaultValue || 75000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(calc.defaultDownPaymentPercent ?? 20);
  const [tenure, setTenure] = useState(calc.defaultTenure || 6);

  // Making charges state (defaults to 0% FREE)
  const defaultMc = calc.defaultMakingChargesPercent ?? 0;
  const [makingChargesPercent, setMakingChargesPercent] = useState(defaultMc);
  const [isCustomMakingCharges, setIsCustomMakingCharges] = useState(false);
  const [customMakingChargesInput, setCustomMakingChargesInput] = useState(String(defaultMc));

  // GST rate (defaults to 0% FREE)
  const defaultGst = calc.gstPercent ?? 0;
  const [gstPercent, setGstPercent] = useState(defaultGst);

  // Custom amount state (when user wants to enter custom jewelry value)
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState(String(calc.defaultValue || 75000));

  // Custom tenure state (when user wants to enter custom months)
  const [isCustomTenure, setIsCustomTenure] = useState(false);
  const [customTenureInput, setCustomTenureInput] = useState(String(calc.defaultTenure || 6));

  // Custom interest rate state (defaults to 0% for 0-Cost EMI)
  const [interestRate, setInterestRate] = useState(0);
  const [isCustomInterest, setIsCustomInterest] = useState(false);
  const [customInterestInput, setCustomInterestInput] = useState("0");

  // Sync if settings change
  useEffect(() => {
    if (calc.defaultValue && totalAmount === 75000) {
      setTotalAmount(calc.defaultValue);
      setCustomAmountInput(String(calc.defaultValue));
    }
    if (calc.defaultDownPaymentPercent !== undefined && downPaymentPercent === 20) {
      setDownPaymentPercent(calc.defaultDownPaymentPercent);
    }
    if (calc.defaultMakingChargesPercent !== undefined && makingChargesPercent === 0) {
      setMakingChargesPercent(calc.defaultMakingChargesPercent);
      setCustomMakingChargesInput(String(calc.defaultMakingChargesPercent));
    }
    if (calc.gstPercent !== undefined && gstPercent === 0) {
      setGstPercent(calc.gstPercent);
    }
    if (calc.defaultTenure && tenure === 6) {
      setTenure(calc.defaultTenure);
      setCustomTenureInput(String(calc.defaultTenure));
    }
  }, [calc]);

  // The hero lives in the Shopify collection description; dashboard settings / defaults are the fallback.
  // The hero div ends right before the next HTML comment, the TOC nav or the first section.
  const legacyHeroHtml = useMemo(() => {
    if (!descriptionHtml || typeof descriptionHtml !== "string") return null;
    const match = descriptionHtml.match(/<div class="hero">[\s\S]*?<\/div>\s*(?=<!--|<nav class="toc"|<section|$)/i);
    return match ? match[0] : null;
  }, [descriptionHtml]);

  // Calculations
  const downPaymentAmount = useMemo(() => {
    return Math.round((totalAmount * downPaymentPercent) / 100);
  }, [totalAmount, downPaymentPercent]);

  // Total Financed Amount under 0% EMI (covers Diamond + Making Charges + GST)
  const financedAmount = useMemo(() => {
    return Math.max(0, totalAmount - downPaymentAmount);
  }, [totalAmount, downPaymentAmount]);

  // Pre-tax subtotal & GST (3% govt standard for jewelry in India)
  const preTaxSubtotal = useMemo(() => {
    if (gstPercent <= 0) return totalAmount;
    return Math.round(totalAmount / (1 + gstPercent / 100));
  }, [totalAmount, gstPercent]);

  const gstAmount = useMemo(() => {
    if (gstPercent <= 0) return 0;
    return Math.max(0, totalAmount - preTaxSubtotal);
  }, [totalAmount, preTaxSubtotal, gstPercent]);

  // Making charges calculation
  const makingChargesAmount = useMemo(() => {
    return Math.round((preTaxSubtotal * makingChargesPercent) / 100);
  }, [preTaxSubtotal, makingChargesPercent]);

  // Diamond component (eligible financed diamond value)
  const diamondAmount = useMemo(() => {
    // Total Financed Amount = Diamond + Making Charges + GST
    // Diamond = Financed Amount - Making Charges - GST
    const diamondVal = financedAmount - makingChargesAmount - gstAmount;
    return Math.max(0, diamondVal);
  }, [financedAmount, makingChargesAmount, gstAmount]);

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
                {/* Interest Badge / Switcher */}
                {interestRate === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomInterest(true);
                      setInterestRate(12);
                      setCustomInterestInput("12");
                    }}
                    className="rounded-[4px] bg-[#EAF7EE] text-[#00A63E] border border-[#B8DAB6] text-[11px] font-semibold px-2.5 py-1 font-figtree uppercase tracking-wider hover:bg-[#dcfce7] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Click to check custom interest"
                  >
                    <span>{calc.interestBadge || "0% Interest"}</span>
                    <span className="text-[9px] font-bold text-zinc-600 bg-white/80 px-1 py-0.5 rounded border border-[#B8DAB6]">Custom %</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setInterestRate(0);
                      setIsCustomInterest(false);
                      setCustomInterestInput("0");
                    }}
                    className="rounded-[4px] bg-[#FFF8E7] text-[#B45309] border border-[#FDE68A] text-[11px] font-semibold px-2.5 py-1 font-figtree uppercase tracking-wider hover:bg-[#FEF3C7] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Click to reset to 0% Interest"
                  >
                    <span>{interestRate}% Interest</span>
                    <span className="text-[9px] font-bold text-[#B45309] bg-white/80 px-1 py-0.5 rounded border border-[#FDE68A]">Reset 0%</span>
                  </button>
                )}
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
                    setTotalAmount(val);
                    setCustomAmountInput(String(val));
                    const isPreset = (calc.presetAmounts || []).includes(val);
                    if (isPreset) {
                      setIsCustomAmount(false);
                    }
                  }}
                  className="emi-slider w-full"
                />

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(calc.presetAmounts || []).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTotalAmount(amt);
                        setIsCustomAmount(false);
                        setCustomAmountInput(String(amt));
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
                          setTotalAmount(nextVal);
                          setCustomAmountInput(String(nextVal));
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
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomAmountInput(val);
                            const num = parseInt(val, 10);
                            if (!isNaN(num) && num > 0) {
                              setTotalAmount(num);
                            }
                          }}
                          className="w-28 h-7 pl-6 pr-2 font-bold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const step = calc.stepValue || 5000;
                          const nextVal = totalAmount + step;
                          setTotalAmount(nextVal);
                          setCustomAmountInput(String(nextVal));
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
                    ₹{formatINR(downPaymentAmount)} <span className="text-xs text-zinc-400 font-normal">({downPaymentPercent}%)</span>
                  </span>
                </div>

                <div 
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(4, calc.downPaymentOptions.length)}, minmax(0, 1fr))`
                  }}
                >
                  {calc.downPaymentOptions.map((opt) => (
                    <button
                      key={opt.percent}
                      type="button"
                      onClick={() => setDownPaymentPercent(opt.percent)}
                      className={`h-[38px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                        downPaymentPercent === opt.percent
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Tenure Selection (Customizable & with User Custom Option) */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Tenure</span>
                  <span className="text-[13px] font-semibold text-[#5A413F]">
                    {tenure} Months {isCustomTenure && <span className="text-xs font-normal text-zinc-400">(Custom)</span>}
                  </span>
                </div>

                <div 
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(5, (calc.tenures.length + (calc.allowCustomTenure ? 1 : 0)))}, minmax(0, 1fr))`
                  }}
                >
                  {calc.tenures.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTenure(t);
                        setIsCustomTenure(false);
                      }}
                      className={`h-[40px] rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                        !isCustomTenure && tenure === t
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      <span className="text-[13px] font-bold">{t} Mo</span>
                    </button>
                  ))}

                  {/* Customer Custom Tenure Button */}
                  {calc.allowCustomTenure && (
                    <button
                      type="button"
                      onClick={() => setIsCustomTenure(true)}
                      className={`h-[40px] rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                        isCustomTenure
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-[#5A413F] border-[#5A413F]/40 hover:border-[#5A413F] hover:bg-[#FAF6F4]"
                      }`}
                      title="Enter a custom tenure in months"
                    >
                      <span className="text-[12px] font-semibold">Custom</span>
                    </button>
                  )}
                </div>

                {/* Custom Tenure Input Panel */}
                {isCustomTenure && (
                  <div className="mt-2 p-3 rounded-[8px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-xs transition-all">
                    <span className="text-xs font-medium text-zinc-600 font-figtree">
                      Choose months:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const minVal = calc.minCustomTenure || 1;
                          const nextVal = Math.max(minVal, tenure - 1);
                          setTenure(nextVal);
                          setCustomTenureInput(String(nextVal));
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
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
                        className="w-14 h-7 text-center font-bold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const maxVal = calc.maxCustomTenure || 36;
                          const nextVal = Math.min(maxVal, tenure + 1);
                          setTenure(nextVal);
                          setCustomTenureInput(String(nextVal));
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-figtree">
                      ({calc.minCustomTenure || 1}–{calc.maxCustomTenure || 36} mos)
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Making Charges & GST Selection */}
              <div className="mt-5 space-y-3.5">
                {/* Making Charges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-figtree">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-zinc-700">Making Charges</span>
                      {makingChargesPercent === 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          100% FREE
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                          Financed on EMI
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-semibold text-[#5A413F]">
                      {makingChargesPercent === 0 ? (
                        <span className="text-emerald-600 font-bold">₹0 (FREE)</span>
                      ) : (
                        <>₹{formatINR(makingChargesAmount)} <span className="text-xs text-zinc-400 font-normal">({makingChargesPercent}%)</span></>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {(calc.makingChargesOptions || [
                      { percent: 0, label: "0% (FREE)" },
                      { percent: 8, label: "8%" },
                      { percent: 10, label: "10%" },
                      { percent: 12, label: "12%" },
                    ]).map((opt) => (
                      <button
                        key={opt.percent}
                        type="button"
                        onClick={() => {
                          setMakingChargesPercent(opt.percent);
                          setIsCustomMakingCharges(false);
                          setCustomMakingChargesInput(String(opt.percent));
                        }}
                        className={`h-[38px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                          !isCustomMakingCharges && makingChargesPercent === opt.percent
                            ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                            : opt.percent === 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-500 font-semibold"
                            : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}

                    {/* Customer Custom Making Charges Button */}
                    <button
                      type="button"
                      onClick={() => setIsCustomMakingCharges(true)}
                      className={`h-[38px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                        isCustomMakingCharges
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-[#5A413F] border-[#5A413F]/40 hover:border-[#5A413F] hover:bg-[#FAF6F4]"
                      }`}
                      title="Enter custom making charges percentage"
                    >
                      <span className="text-[12px] font-semibold">Custom</span>
                    </button>
                  </div>

                  {/* Custom Making Charges Input Panel */}
                  {isCustomMakingCharges && (
                    <div className="mt-2 p-3 rounded-[8px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-xs transition-all">
                      <span className="text-xs font-medium text-zinc-600 font-figtree">
                        Enter charges (%):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = Math.max(0, makingChargesPercent - 1);
                            setMakingChargesPercent(nextVal);
                            setCustomMakingChargesInput(String(nextVal));
                          }}
                          className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                          title="Decrease by 1%"
                        >
                          −
                        </button>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            step={0.5}
                            value={customMakingChargesInput}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomMakingChargesInput(val);
                              const num = parseFloat(val);
                              if (!isNaN(num) && num >= 0) {
                                setMakingChargesPercent(Math.min(50, num));
                              }
                            }}
                            className="w-16 h-7 text-center font-bold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                          />
                          <span className="text-xs font-bold text-zinc-500 ml-1.5">%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = Math.min(50, makingChargesPercent + 1);
                            setMakingChargesPercent(nextVal);
                            setCustomMakingChargesInput(String(nextVal));
                          }}
                          className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                          title="Increase by 1%"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* GST Selector (Free 0% by default, or 3% Govt Standard) */}
                <div className="space-y-1.5 pt-2.5 border-t border-[#EBE1D7]/60">
                  <div className="flex items-center justify-between font-figtree text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-zinc-700">Goods & Services Tax (GST)</span>
                      {gstPercent === 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          0% FREE GST
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                          3% Govt. Tax
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-[#5A413F]">
                      {gstPercent === 0 ? (
                        <span className="text-emerald-600 font-bold">₹0 (FREE)</span>
                      ) : (
                        `₹${formatINR(gstAmount)} (3%)`
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGstPercent(0)}
                      className={`h-[34px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        gstPercent === 0
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      <span>0% GST (Free)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstPercent(3)}
                      className={`h-[34px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        gstPercent === 3
                          ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                          : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                      }`}
                    >
                      <span>3% GST (Standard)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Interest Rate Selection */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between font-figtree">
                  <span className="text-[13px] font-medium text-zinc-700">Interest Rate (p.a.)</span>
                  <span className="text-[13px] font-semibold text-[#5A413F]">
                    {interestRate}% {interestRate === 0 ? <span className="text-xs font-semibold text-[#00A63E]">(0-Cost)</span> : <span className="text-xs font-normal text-zinc-400">(Custom)</span>}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* 0% Interest (Default) */}
                  <button
                    type="button"
                    onClick={() => {
                      setInterestRate(0);
                      setIsCustomInterest(false);
                      setCustomInterestInput("0");
                    }}
                    className={`h-[38px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center gap-1 col-span-2 ${
                      interestRate === 0 && !isCustomInterest
                        ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                        : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                    }`}
                  >
                    <span>0% Interest (Default)</span>
                  </button>

                  {/* 12% p.a. Bank EMI */}
                  <button
                    type="button"
                    onClick={() => {
                      setInterestRate(12);
                      setIsCustomInterest(false);
                      setCustomInterestInput("12");
                    }}
                    className={`h-[38px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                      !isCustomInterest && interestRate === 12
                        ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                        : "bg-white text-zinc-700 border-[#EBE1D7] hover:border-[#5A413F]"
                    }`}
                  >
                    <span>12% p.a.</span>
                  </button>

                  {/* Custom Interest */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomInterest(true);
                      if (interestRate === 0) {
                        setInterestRate(14);
                        setCustomInterestInput("14");
                      }
                    }}
                    className={`h-[38px] text-xs rounded-[6px] border font-figtree transition-all cursor-pointer flex items-center justify-center ${
                      isCustomInterest || (interestRate > 0 && interestRate !== 12)
                        ? "bg-[#5A413F] text-white border-[#5A413F] font-semibold shadow-xs"
                        : "bg-white text-[#5A413F] border-[#5A413F]/40 hover:border-[#5A413F] hover:bg-[#FAF6F4]"
                    }`}
                    title="Enter custom interest percentage"
                  >
                    <span className="text-[12px] font-semibold">Custom</span>
                  </button>
                </div>

                {/* Custom Interest Input Panel */}
                {isCustomInterest && (
                  <div className="mt-2 p-3 rounded-[8px] bg-white border border-[#EBE1D7] flex items-center justify-between gap-2 shadow-xs transition-all">
                    <span className="text-xs font-medium text-zinc-600 font-figtree">
                      Enter interest rate (%):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.max(0, interestRate - 1);
                          setInterestRate(nextVal);
                          setCustomInterestInput(String(nextVal));
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                        title="Decrease by 1%"
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
                          className="w-16 h-7 text-center font-bold text-xs text-[#5A413F] border border-[#EBE1D7] rounded focus:outline-none focus:border-[#5A413F]"
                        />
                        <span className="text-xs font-bold text-zinc-500 ml-1.5">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.min(36, interestRate + 1);
                          setInterestRate(nextVal);
                          setCustomInterestInput(String(nextVal));
                        }}
                        className="w-7 h-7 rounded border border-[#EBE1D7] text-zinc-700 hover:bg-zinc-100 font-bold flex items-center justify-center text-sm cursor-pointer"
                        title="Increase by 1%"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
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
                        {makingChargesPercent === 0 && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded uppercase">
                            FREE
                          </span>
                        )}
                      </div>
                      <span className={makingChargesPercent === 0 ? "font-bold text-emerald-600" : "font-medium text-zinc-900"}>
                        {makingChargesPercent === 0 ? "₹0 (FREE)" : `₹${formatINR(makingChargesAmount)} (${makingChargesPercent}%)`}
                      </span>
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
                    <span className="font-medium">Gold Down Payment ({downPaymentPercent}%):</span>
                    <span className="font-semibold text-zinc-900">₹{formatINR(downPaymentAmount)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBE1D7]/60 flex flex-col gap-1.5 text-xs font-medium">
                  {interestRate === 0 ? (
                    <div className="flex justify-between items-center text-[#00A63E]">
                      <span>Processing Fee: ₹0</span>
                      <span>0% Interest EMI</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-zinc-600">
                        <span>Total Interest ({interestRate}% p.a.):</span>
                        <span className="font-semibold text-zinc-900">₹{formatINR(totalInterest)}</span>
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
