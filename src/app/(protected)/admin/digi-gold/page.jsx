"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/user/userSlice";
import {
  fetchUserDgrpPlans,
  createDgrpInstallmentOrder,
  verifyDgrpInstallmentPayment,
  calculateDgrpPreclose,
  createDgrpPrecloseOrder,
  verifyDgrpPreclosePayment,
} from "@/lib/api";
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-toastify";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtOrdinalDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const j = day % 10;
  const k = day % 100;
  let suffix = "th";
  if (j === 1 && k !== 11) suffix = "st";
  else if (j === 2 && k !== 12) suffix = "nd";
  else if (j === 3 && k !== 13) suffix = "rd";
  return `${day}${suffix} ${month} ${year}`;
}

function fmtNextPaymentDate(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function fmtPrice(val) {
  if (val === null || val === undefined) return "0";
  return Number(val).toLocaleString("en-IN");
}

function isDateArrived(str) {
  if (!str) return false;
  const target = new Date(str);
  if (isNaN(target.getTime())) return false;
  const now = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return todayMidnight >= targetMidnight;
}

function getProductSpecsLine(product) {
  if (!product) return "14K yellow gold · Lab-Grown diamond";
  if (product.specs_line) return product.specs_line;

  const parts = [];
  if (product.diamond_carat) parts.push(`${product.diamond_carat} ct`);
  if (product.diamond_clarity) parts.push(`${product.diamond_clarity} Clarity`);
  if (product.diamond_color) parts.push(`${product.diamond_color} Color`);

  const goldParts = [];
  if (product.metal_purity) goldParts.push(product.metal_purity);
  if (product.metal_color) goldParts.push(product.metal_color.toLowerCase());
  if (goldParts.length > 0) parts.push(goldParts.join(" "));

  if (product.metal_weight) parts.push(`${product.metal_weight} g`);
  if (product.diamond_shape) parts.push(product.diamond_shape);
  parts.push(product.diamond_type || "Lab-Grown diamond");

  return parts.length > 0 ? parts.join(" · ") : "14K yellow gold · Lab-Grown diamond";
}

function getInstallmentLabel(ins) {
  if (ins.label) {
    return ins.label.replace(/Installment/i, "Instalment");
  }
  if (ins.installment_number === 0) return "10% Advance";
  const num = ins.installment_number;
  const j = num % 10;
  const k = num % 100;
  let suffix = "th";
  if (j === 1 && k !== 11) suffix = "st";
  else if (j === 2 && k !== 12) suffix = "nd";
  else if (j === 3 && k !== 13) suffix = "rd";
  return `${num}${suffix} Instalment`;
}

export default function DigiGoldPage() {
  const user = useSelector(selectUser);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGoldRate, setCurrentGoldRate] = useState(15802);
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // Pre-close Modal state
  const [precloseModalOpen, setPrecloseModalOpen] = useState(false);
  const [precloseData, setPrecloseData] = useState(null);
  const [precloseLoading, setPrecloseLoading] = useState(false);
  const [payingInstallmentNumber, setPayingInstallmentNumber] = useState(null);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

  // Prevent Radix body pointer-events lock when Razorpay opens
  useEffect(() => {
    if (!isRazorpayOpen) return;

    const originalPointerEvents = document.body.style.pointerEvents;
    document.body.style.pointerEvents = "auto";

    const fixInterval = setInterval(() => {
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "auto";
      }
      const rzpContainer = document.querySelector(".razorpay-container");
      if (rzpContainer) {
        rzpContainer.style.pointerEvents = "auto";
        rzpContainer.style.zIndex = "2147483647";
      }
    }, 100);

    return () => {
      clearInterval(fixInterval);
      document.body.style.pointerEvents = originalPointerEvents || "";
    };
  }, [isRazorpayOpen]);

  const loadPlans = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchUserDgrpPlans({
        mobile: user.phone || user.mobile || "",
        email: user.email || "",
        user_id: user.id || "",
      });

      if (res?.plans) {
        setPlans(res.plans);
        if (res.current_gold_rate_24k) {
          setCurrentGoldRate(res.current_gold_rate_24k);
        }
        if (res.plans.length > 0 && !expandedPlanId) {
          // Check if url query param has specific plan
          let targetId = res.plans[0]._id;
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const queryPlan = params.get("plan");
            if (queryPlan) {
              const matched = res.plans.find(
                (p) =>
                  p.plan_code === queryPlan ||
                  p._id === queryPlan ||
                  String(p.shopify_order_number) === queryPlan
              );
              if (matched) targetId = matched._id;
            }
          }
          setExpandedPlanId(targetId);
        }
      }
    } catch (err) {
      console.error("Failed to load DGRP plans:", err);
      toast.error("Failed to load your Lock & Key plans");
    } finally {
      setLoading(false);
    }
  }, [user, expandedPlanId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans();
  }, [loadPlans]);

  // Handle Monthly Installment Payment via Razorpay
  const handlePayInstallment = async (plan, installment) => {
    try {
      setPayingInstallmentNumber(installment.installment_number);
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error("Payment gateway is loading, please try again in a moment.");
      }

      const orderData = await createDgrpInstallmentOrder({
        plan_id: plan._id,
        installment_number: installment.installment_number,
      });

      if (!orderData || !orderData.orderId) {
        throw new Error(orderData?.message || "Failed to create installment order");
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: "INR",
        name: "Lucira Jewelry",
        description: `Installment #${installment.installment_number} for ${plan.product?.title?.slice(0, 25)}`,
        order_id: orderData.orderId,
        prefill: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          email: user?.email || "",
          contact: user?.phone || user?.mobile || "",
        },
        theme: { color: "#5A413F" },
        handler: async function (response) {
          setIsRazorpayOpen(false);
          try {
            const verifyRes = await verifyDgrpInstallmentPayment({
              plan_id: plan._id,
              installment_number: installment.installment_number,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes?.success) {
              toast.success("Installment paid successfully!");
              await loadPlans();
            } else {
              throw new Error(verifyRes?.error || "Failed to verify installment");
            }
          } catch (e) {
            console.error(e);
            toast.error(e.message || "Verification failed");
          } finally {
            setPayingInstallmentNumber(null);
          }
        },
        modal: {
          ondismiss: () => {
            setIsRazorpayOpen(false);
            setPayingInstallmentNumber(null);
          },
          confirm_close: false,
          escape: true,
          backdropclose: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(response.error?.description || "Payment failed");
        setIsRazorpayOpen(false);
        setPayingInstallmentNumber(null);
      });
      setIsRazorpayOpen(true);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to initiate installment payment");
      setIsRazorpayOpen(false);
      setPayingInstallmentNumber(null);
    }
  };

  // Open Pre-close Modal
  const handleOpenPreclose = async (plan) => {
    try {
      setPrecloseData(null);
      setPrecloseLoading(true);
      setPrecloseModalOpen(true);
      const data = await calculateDgrpPreclose(plan._id);
      setPrecloseData({ ...data, plan });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to calculate pre-closure details");
      setPrecloseModalOpen(false);
    } finally {
      setPrecloseLoading(false);
    }
  };

  // Execute Pre-close Payment via Razorpay
  const handleExecutePreclose = async () => {
    if (!precloseData || !precloseData.plan) return;

    try {
      setPrecloseLoading(true);
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error("Payment gateway is loading, please try again.");
      }

      const orderData = await createDgrpPrecloseOrder(precloseData.plan._id);
      if (!orderData || !orderData.orderId) {
        throw new Error(orderData?.message || "Failed to initialize pre-closure payment");
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: "INR",
        name: "Lucira Jewelry",
        description: `Pre-close Plan: ${precloseData.plan.plan_code}`,
        order_id: orderData.orderId,
        prefill: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          email: user?.email || "",
          contact: user?.phone || user?.mobile || "",
        },
        theme: { color: "#5A413F" },
        handler: async function (response) {
          setIsRazorpayOpen(false);
          try {
            const verifyRes = await verifyDgrpPreclosePayment({
              plan_id: precloseData.plan._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              gold_savings: precloseData.gold_savings,
              amount_paid: precloseData.pending_preclose_amount,
            });

            if (verifyRes?.success) {
              toast.success("Plan successfully pre-closed at lowest gold rate!");
              setPrecloseModalOpen(false);
              await loadPlans();
            } else {
              throw new Error(verifyRes?.error || "Pre-closure verification failed");
            }
          } catch (e) {
            console.error(e);
            toast.error(e.message || "Pre-closure verification failed");
          } finally {
            setPrecloseLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsRazorpayOpen(false);
            setPrecloseLoading(false);
          },
          confirm_close: false,
          escape: true,
          backdropclose: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(response.error?.description || "Payment failed");
        setIsRazorpayOpen(false);
        setPrecloseLoading(false);
      });
      setIsRazorpayOpen(true);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to process pre-closure");
      setIsRazorpayOpen(false);
      setPrecloseLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-serif">
            Digi Gold
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
            Lock &amp; Key Gold Rate Protection Plans &amp; Installments
          </p>
        </div>

        {/* Live Gold Rate Chip */}
        <div className="flex items-center gap-3 rounded-2xl bg-[#FAF2EB] px-4 py-2.5 border border-[#EBD8C8] self-start sm:self-auto">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#5A413F] text-amber-300">
            <Coins size={16} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Today&apos;s 24KT Gold Rate
            </span>
            <span className="text-sm font-bold text-[#5A413F]">
              ₹{fmtPrice(currentGoldRate)}/gm
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-[#5A413F]" size={36} />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Loading your Digi Gold plans...
          </p>
        </div>
      ) : plans.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#FAF2EB] text-[#5A413F]">
            <Coins size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">No Active Lock &amp; Key Plans</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Lock today&apos;s gold rate with only a 10% down payment and unlock luxury with 3 or 6 months easy installments.
            </p>
          </div>
          <Button asChild className="h-11 px-8 rounded-xl bg-[#5A413F] text-white font-bold uppercase tracking-wider hover:bg-[#463231]">
            <Link href="/collections/all">Explore Jewelry</Link>
          </Button>
        </div>
      ) : (
        /* Plan Cards List (Exact UI from Figma Screenshot: Frame 1437258052 & 1437258053) */
        <div className="space-y-6">
          {plans.map((plan) => {
            const isExpanded = expandedPlanId === plan._id;
            const liveMetrics = plan.live_metrics || {};
            const lockedRate = liveMetrics.locked_gold_rate || plan.financials?.locked_gold_rate || 15802;
            const todayRate = liveMetrics.today_gold_rate || currentGoldRate || 17418;
            const benefit = todayRate > lockedRate 
              ? (todayRate - lockedRate) 
              : (liveMetrics.protected_benefit_per_gm || 0);

            const productValue = plan.financials?.original_product_price || 60000;
            const amountPaid = plan.financials?.total_paid || 0;
            const currentBalance = plan.financials?.amount_pending ?? Math.max(0, productValue - amountPaid);
            const completedPct = Math.min(100, Math.max(0, Math.round((amountPaid / (productValue || 1)) * 100)));

            const unpaidInstallments = (plan.installments || []).filter(
              (i) =>
                String(i.status || "").toLowerCase() !== "paid" &&
                String(i.status || "").toLowerCase() !== "pre_closed"
            );
            const nextIns = unpaidInstallments[0];
            const nextPaymentDateStr = nextIns ? fmtNextPaymentDate(nextIns.due_date) : "";
            const isCompleted = plan.financials?.status === "completed" || plan.financials?.status === "pre_closed";

            return (
              <div
                key={plan._id}
                className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 transition-all duration-200 shadow-sm"
              >
                {/* ── Top Section (Frame 1437258052) ── */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  {/* Left: Square Product Image */}
                  <div className="relative w-full sm:w-48 sm:h-48 md:w-56 md:h-56 aspect-square shrink-0 rounded-2xl bg-[#FBFBFB] border border-zinc-100 flex items-center justify-center p-4 overflow-hidden mx-auto sm:mx-0">
                    {plan.product?.image ? (
                      <Image
                        src={plan.product.image}
                        alt={plan.product.title || "Product"}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-300 gap-2">
                        <Coins size={36} />
                        <span className="text-[10px] font-medium text-zinc-400">Jewelry Piece</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Details & Action Row */}
                  <div className="flex-1 min-w-0 w-full flex flex-col justify-between self-stretch">
                    <div>
                      {/* Product Title */}
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                        {plan.product?.title || "2 CT Round Cut with Side Diamonds Accent Engagement Ring"}
                      </h3>

                      {/* Specs Subtitle */}
                      <p className="text-xs text-zinc-500 font-normal mt-1 leading-relaxed">
                        {getProductSpecsLine(plan.product)}
                      </p>
                    </div>

                    {/* 3 Rates Row */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-6 my-5 sm:my-6">
                      <div>
                        <span className="block text-xs text-zinc-500 font-normal">
                          Locked Gold Rated
                        </span>
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mt-1">
                          {Math.round(lockedRate)}/gm
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs text-zinc-500 font-normal">
                          Today&apos;s Gold Rate
                        </span>
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mt-1">
                          {Math.round(todayRate)}/gm
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs text-zinc-500 font-normal">
                          Benefit if Pre Closed Today
                        </span>
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-[#16A34A] mt-1">
                          {benefit > 0 ? `${Math.round(benefit)}/gm` : "0/gm"}
                        </span>
                      </div>
                    </div>

                    {/* Buttons Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                      <button
                        onClick={() => handleOpenPreclose(plan)}
                        disabled={isCompleted}
                        className="w-full sm:flex-1 h-11 bg-[#5A413F] text-white font-medium text-xs sm:text-sm rounded-lg hover:bg-[#463231] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        Pre-close at Lowest Rate
                      </button>

                      <button
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan._id)}
                        className="w-full sm:flex-1 h-11 bg-[#ECE8E5] text-[#2D2322] border border-[#DCD6D1] rounded-lg font-medium text-xs sm:text-sm hover:bg-[#E2DDD9] transition-all flex items-center justify-center cursor-pointer"
                      >
                        View Plan
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Expanded Section (Frame 1437258053) ── */}
                {isExpanded && (
                  <div className="mt-8 pt-6 border-t border-zinc-100">
                    {/* 3 Financial Pillars */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-6">
                      <div>
                        <span className="block text-xs text-zinc-500 font-medium">
                          Product Value
                        </span>
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mt-1">
                          ₹{fmtPrice(productValue)}*
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs text-zinc-500 font-medium">
                          Amount Paid
                        </span>
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mt-1">
                          ₹{fmtPrice(amountPaid)}*
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="block text-xs text-zinc-500 font-medium">
                          Current Balance
                        </span>
                        <span className="block text-xl sm:text-2xl md:text-3xl font-bold text-zinc-900 mt-1">
                          ₹{fmtPrice(currentBalance)}*
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5 sm:mt-6">
                      <div className="w-full h-1.5 bg-[#E8E3DF] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#5A413F] rounded-full transition-all duration-500"
                          style={{ width: `${completedPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 font-normal mt-2.5">
                        {completedPct}% Completed{nextPaymentDateStr ? ` - Next Payment by ${nextPaymentDateStr}` : ""}
                      </p>
                    </div>

                    {/* Payment History */}
                    <div className="mt-8">
                      <h4 className="text-sm sm:text-base font-bold text-zinc-900 mb-2">
                        Payment History
                      </h4>

                      <div className="divide-y divide-zinc-100">
                        {(() => {
                          const firstUnpaid = plan.installments?.find(
                            (i) =>
                              String(i.status || "").toLowerCase() !== "paid" &&
                              String(i.status || "").toLowerCase() !== "pre_closed"
                          );

                          return plan.installments?.map((ins) => {
                            const isPaid = String(ins.status || "").toLowerCase() === "paid";
                            const isPreclosed =
                              String(ins.status || "").toLowerCase() === "pre_closed" ||
                              plan.financials?.status === "pre_closed";
                            const isPayingThis = payingInstallmentNumber === ins.installment_number;
                            const isDue = isDateArrived(ins.due_date);
                            const isFirstUnpaid = firstUnpaid?.installment_number === ins.installment_number;

                            return (
                              <div
                                key={ins.installment_number}
                                className="grid grid-cols-12 items-center py-3.5 sm:py-4 text-xs sm:text-sm"
                              >
                                {/* Col 1: Date */}
                                <div className="col-span-3 sm:col-span-3 font-normal text-zinc-700">
                                  {fmtOrdinalDate(ins.due_date)}
                                </div>

                                {/* Col 2: Milestone description */}
                                <div className="col-span-4 sm:col-span-4 font-normal text-zinc-800">
                                  {getInstallmentLabel(ins)}
                                </div>

                                {/* Col 3: Status / Action */}
                                <div className="col-span-2 sm:col-span-2">
                                  {isPaid ? (
                                    <span className="font-normal text-zinc-800">Paid</span>
                                  ) : isPreclosed ? (
                                    <span className="font-normal text-purple-700">Pre-Closed</span>
                                  ) : isFirstUnpaid && isDue ? (
                                    <button
                                      onClick={() => handlePayInstallment(plan, ins)}
                                      disabled={isPayingThis || payingInstallmentNumber !== null}
                                      className="font-semibold text-[#5A413F] underline hover:opacity-80 transition-opacity cursor-pointer text-left"
                                    >
                                      {isPayingThis ? (
                                        <span className="inline-flex items-center gap-1">
                                          <Loader2 size={12} className="animate-spin" />
                                          Paying
                                        </span>
                                      ) : (
                                        "Pay Now"
                                      )}
                                    </button>
                                  ) : (
                                    <span className="font-normal text-zinc-300 select-none">
                                      Pay Now
                                    </span>
                                  )}
                                </div>

                                {/* Col 4: Amount */}
                                <div className="col-span-3 sm:col-span-3 text-right font-bold text-zinc-900">
                                  ₹{fmtPrice(ins.amount)}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pre-close Modal ── */}
      <Dialog
        open={precloseModalOpen}
        onOpenChange={(open) => {
          if (isRazorpayOpen) return;
          setPrecloseModalOpen(open);
        }}
      >
        <DialogContent
          className="sm:max-w-md p-6 rounded-3xl bg-white border border-zinc-200"
          onPointerDownOutside={(e) => {
            if (isRazorpayOpen || document.querySelector(".razorpay-container")) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (isRazorpayOpen || document.querySelector(".razorpay-container")) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogTitle className="text-lg font-serif font-bold text-[#5A413F]">
            Pre-close at Lowest Gold Rate
          </DialogTitle>

          {precloseLoading && !precloseData ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="animate-spin text-[#5A413F]" size={32} />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Calculating live gold market rate...
              </p>
            </div>
          ) : precloseData ? (
            <div className="space-y-4 pt-2 text-xs">
              <p className="text-zinc-600 leading-relaxed">
                You can pre-close this jewelry plan immediately. If today&apos;s gold rate is lower than your locked rate, the savings are deducted from your balance!
              </p>

              <div className="space-y-2 rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Locked Rate:</span>
                  <span className="font-bold text-zinc-900">₹{fmtPrice(precloseData.locked_gold_rate)}/gm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Today&apos;s Rate:</span>
                  <span className="font-bold text-zinc-900">₹{fmtPrice(precloseData.today_gold_rate)}/gm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Metal Weight:</span>
                  <span className="font-bold text-zinc-900">{precloseData.metal_weight_grams} grams</span>
                </div>
                {precloseData.gold_savings > 0 && (
                  <div className="flex justify-between text-emerald-600 pt-1 border-t border-zinc-200">
                    <span className="font-bold">Gold Rate Drop Savings:</span>
                    <span className="font-bold">-₹{fmtPrice(precloseData.gold_savings)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-zinc-200">
                  <span className="text-zinc-500">Adjusted Total Price:</span>
                  <span className="font-bold text-zinc-900">₹{fmtPrice(precloseData.adjusted_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Paid So Far:</span>
                  <span className="font-bold text-zinc-900">₹{fmtPrice(precloseData.total_paid_so_far)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#5A413F] pt-2 border-t border-zinc-300">
                  <span>Net Pending to Pre-close:</span>
                  <span>₹{fmtPrice(precloseData.pending_preclose_amount)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  disabled={precloseLoading || precloseData.pending_preclose_amount <= 0}
                  onClick={handleExecutePreclose}
                  className="w-full h-12 bg-[#5A413F] text-white font-bold uppercase tracking-wider rounded-xl hover:bg-[#463231] shadow-lg shadow-[#5A413F]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {precloseLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    `PAY ₹${fmtPrice(precloseData.pending_preclose_amount)} & PRE-CLOSE`
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
