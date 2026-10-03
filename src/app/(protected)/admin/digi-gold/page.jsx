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

function fmtPrice(val) {
  if (val === null || val === undefined) return "0";
  return Number(val).toLocaleString("en-IN");
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
          setExpandedPlanId(res.plans[0]._id);
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
      setPrecloseLoading(true);
      setPrecloseModalOpen(true);
      const data = await calculateDgrpPreclose(plan._id);
      setPrecloseData({ ...data, plan });
    } catch (err) {
      console.error(err);
      toast.error("Failed to calculate pre-closure details");
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
        /* Plan Cards List (Matching Image 3) */
        <div className="space-y-6">
          {plans.map((plan) => {
            const isExpanded = expandedPlanId === plan._id;
            const liveMetrics = plan.live_metrics || {};
            const lockedRate = liveMetrics.locked_gold_rate || plan.financials?.locked_gold_rate || 15802;
            const todayRate = liveMetrics.today_gold_rate || currentGoldRate;
            const benefit = liveMetrics.protected_benefit_per_gm || 0;
            const nextIns = liveMetrics.next_installment;
            const isCompleted = plan.financials?.status === "completed" || plan.financials?.status === "pre_closed";

            return (
              <div
                key={plan._id}
                className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
              >
                {/* ── Top Summary Header (Exact layout from Image 3) ── */}
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Thumbnail & Title */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-50 border border-zinc-100 p-1">
                        {plan.product?.image ? (
                          <Image
                            src={plan.product.image}
                            alt={plan.product.title || "Product"}
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-400">
                            <Coins size={24} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                          {plan.product?.title || "Diamond Jewelry Piece"}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                          {plan.product?.metal_purity} {plan.product?.metal_color} · {plan.product?.metal_weight}g
                          {plan.product?.diamond_carat ? ` · ${plan.product.diamond_carat}ct Diamond` : ""}
                        </p>
                        <span className="inline-block text-[10px] font-mono text-zinc-400 mt-1">
                          {plan.plan_code}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="self-start sm:self-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          plan.financials?.status === "pre_closed"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : plan.financials?.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <ShieldCheck size={12} />
                        {plan.financials?.status === "pre_closed"
                          ? "Pre-Closed"
                          : plan.financials?.status === "completed"
                          ? "Fully Paid"
                          : "Active Price Lock"}
                      </span>
                    </div>
                  </div>

                  {/* 3 Metric Badges: Locked / Today / Benefit */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 rounded-2xl bg-zinc-50/80 p-3 sm:p-4 border border-zinc-100 text-center">
                    <div>
                      <span className="block text-[10px] sm:text-xs text-zinc-500 font-medium">
                        Locked Gold Rate
                      </span>
                      <span className="text-xs sm:text-base font-bold text-zinc-900">
                        ₹{fmtPrice(lockedRate)}/gm
                      </span>
                    </div>

                    <div className="border-x border-zinc-200">
                      <span className="block text-[10px] sm:text-xs text-zinc-500 font-medium">
                        Today&apos;s Gold Rate
                      </span>
                      <span className="text-xs sm:text-base font-bold text-zinc-900">
                        ₹{fmtPrice(todayRate)}/gm
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] sm:text-xs text-zinc-500 font-medium">
                        Benefit / Protected Rate
                      </span>
                      <span className="text-xs sm:text-base font-bold text-emerald-600">
                        ₹{fmtPrice(benefit)}/gm
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Pre-close at Lowest Rate | View Plan */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    {!isCompleted && (
                      <Button
                        onClick={() => handleOpenPreclose(plan)}
                        className="w-full sm:flex-1 h-11 bg-[#5A413F] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#463231] transition-all cursor-pointer shadow-md shadow-[#5A413F]/10"
                      >
                        Pre-close at Lowest Rate
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() =>
                        setExpandedPlanId(isExpanded ? null : plan._id)
                      }
                      className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider border-zinc-200 text-zinc-700 hover:bg-zinc-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isExpanded ? "Hide Plan" : "View Plan"}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>

                {/* ── Expanded Detail View (Exact layout from Image 3 bottom) ── */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-[#FAFAFA] p-5 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {/* Financial 3-pillar breakdown */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 border-b border-zinc-200/80 pb-5 text-center">
                      <div>
                        <span className="block text-[10px] sm:text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                          Total Order
                        </span>
                        <span className="text-sm sm:text-xl font-bold text-zinc-900">
                          ₹{fmtPrice(plan.financials?.original_product_price)}*
                        </span>
                      </div>
                      <div className="border-x border-zinc-200">
                        <span className="block text-[10px] sm:text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                          Amount Paid
                        </span>
                        <span className="text-sm sm:text-xl font-bold text-[#5A413F]">
                          ₹{fmtPrice(plan.financials?.total_paid)}*
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] sm:text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                          Amount Pending
                        </span>
                        <span className="text-sm sm:text-xl font-bold text-zinc-900">
                          ₹{fmtPrice(plan.financials?.amount_pending)}*
                        </span>
                      </div>
                    </div>

                    {/* Next Installment Alert Banner */}
                    {nextIns && !isCompleted && (
                      <div className="flex items-center justify-between rounded-xl bg-amber-50/80 px-4 py-2.5 border border-amber-200/70 text-xs text-amber-900 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-amber-700" />
                          <span>
                            Next installment :{" "}
                            <strong className="font-bold">{fmtDate(nextIns.due_date)}</strong>
                          </span>
                        </div>
                        <span className="font-bold">₹{fmtPrice(nextIns.amount)}</span>
                      </div>
                    )}

                    {/* Payment History Table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                        Payment History
                      </h4>

                      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              <th className="py-3 px-4">Due Date</th>
                              <th className="py-3 px-4">Description</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50">
                            {plan.installments?.map((ins) => {
                              const isPaid = ins.status === "paid";
                              const isPreclosed = ins.status === "pre_closed";
                              const isPayingThis = payingInstallmentNumber === ins.installment_number;

                              return (
                                <tr key={ins.installment_number} className="hover:bg-zinc-50/50 transition-colors">
                                  <td className="py-3.5 px-4 font-medium text-zinc-600">
                                    {fmtDate(ins.due_date)}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-zinc-900">
                                    {ins.label}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {isPaid ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                        <CheckCircle2 size={13} />
                                        Paid
                                      </span>
                                    ) : isPreclosed ? (
                                      <span className="inline-flex items-center gap-1 text-purple-600 font-bold">
                                        Pre-Closed
                                      </span>
                                    ) : (
                                      <Button
                                        size="sm"
                                        disabled={isPayingThis}
                                        onClick={() => handlePayInstallment(plan, ins)}
                                        className="h-7 px-3 bg-[#5A413F] text-white text-[11px] font-bold rounded-lg hover:bg-[#463231] cursor-pointer"
                                      >
                                        {isPayingThis ? (
                                          <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                          "Pay Now"
                                        )}
                                      </Button>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-bold text-zinc-900">
                                    ₹{fmtPrice(ins.amount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
