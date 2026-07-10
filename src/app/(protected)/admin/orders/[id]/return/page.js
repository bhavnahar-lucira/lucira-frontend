"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  ChevronLeft, RefreshCcw, Loader2, CheckCircle2, ShieldCheck,
  Truck, Wallet, CalendarClock, AlertCircle, Info, PackageX
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const FALLBACK_REASONS = [
  { value: "SIZE_TOO_SMALL", label: "Size too small" },
  { value: "SIZE_TOO_LARGE", label: "Size too large" },
  { value: "DEFECTIVE", label: "Damaged or defective" },
  { value: "WRONG_ITEM", label: "Received the wrong item" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "STYLE", label: "Didn't like the style" },
  { value: "COLOR", label: "Didn't like the colour" },
  { value: "UNWANTED", label: "Changed my mind" },
  { value: "OTHER", label: "Other reason" },
];

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function RequestReturnPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selection, setSelection] = useState({}); // fli -> { selected, quantity, reason, note }
  const [step, setStep] = useState("select"); // 'select' | 'review'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!accessToken) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await apiFetch(`/api/customer/orders/${id}/returnable`);
        setData(res);
        const init = {};
        (res?.items || []).forEach((it) => {
          init[it.fulfillmentLineItemId] = {
            selected: false,
            quantity: 1,
            reason: "",
            note: "",
          };
        });
        setSelection(init);
      } catch (err) {
        console.error("[RequestReturn] load failed:", err);
        toast.error("Couldn't load return details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken, id]);

  const reasons = data?.reasons?.length ? data.reasons : FALLBACK_REASONS;
  const eligibleItems = (data?.items || []).filter((i) => i.eligible);
  const ineligibleItems = (data?.items || []).filter((i) => !i.eligible);

  const selectedList = eligibleItems.filter((i) => selection[i.fulfillmentLineItemId]?.selected);
  const canReview = selectedList.length > 0 &&
    selectedList.every((i) => selection[i.fulfillmentLineItemId]?.reason);

  const toggleItem = (fli) => {
    setSelection((prev) => ({
      ...prev,
      [fli]: { ...prev[fli], selected: !prev[fli]?.selected },
    }));
  };
  const setField = (fli, field, value) => {
    setSelection((prev) => ({ ...prev, [fli]: { ...prev[fli], [field]: value } }));
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        orderId: id,
        lineItems: selectedList.map((i) => ({
          fulfillmentLineItemId: i.fulfillmentLineItemId,
          quantity: selection[i.fulfillmentLineItemId].quantity || 1,
          reason: selection[i.fulfillmentLineItemId].reason,
          customerNote: selection[i.fulfillmentLineItemId].note || "",
        })),
      };
      const res = await apiFetch("/api/customer/returns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res?.success) {
        toast.success("Return request submitted");
        router.push(`/admin/returns/${res.returnNumericId}`);
      } else {
        toast.error(res?.detail?.[0]?.message || "Couldn't submit your return");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("[RequestReturn] submit failed:", err);
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="font-figtree flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white rounded-[2rem] md:rounded-[3rem] border border-zinc-100">
        <Loader2 className="size-8 md:size-10 animate-spin text-primary" />
        <p className="font-figtree text-zinc-400 font-semibold uppercase tracking-[0.13em] text-xs">
          Checking return eligibility...
        </p>
      </div>
    );
  }

  const BackHeader = (
    <div className="flex items-center gap-4">
      <button
        onClick={() => (step === "review" ? setStep("select") : router.push(`/admin/orders/${id}`))}
        className="size-10 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary/20 transition-colors shrink-0"
        aria-label="Back"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div>
        <h2 className="font-figtree text-xl md:text-2xl font-bold text-primary tracking-tight">
          Request a Return
        </h2>
        {data?.orderName && (
          <p className="font-figtree text-xs md:text-sm text-zinc-400 font-medium">
            Order {data.orderName}
          </p>
        )}
      </div>
    </div>
  );

  // ── Not eligible ──
  const notEligible = !data?.eligible;
  if (notEligible) {
    const reason = data?.reason;
    let title = "This order isn't eligible for return";
    let message = "We couldn't find any items eligible for return on this order.";
    let Icon = PackageX;

    if (reason === "WINDOW_EXPIRED") {
      Icon = CalendarClock;
      title = "Return window has closed";
      message = `Returns can be requested within ${data?.windowDays || 15} days of delivery${data?.deadline ? `. This order's window closed on ${formatDate(data.deadline)}.` : "."}`;
    } else if (reason === "NOT_DELIVERED") {
      Icon = Truck;
      title = "Order not delivered yet";
      message = "You can request a return once your order has been delivered.";
    } else if (reason === "NO_RETURNABLE_ITEMS") {
      Icon = PackageX;
      title = "No returnable items";
      message = "The items on this order are either custom/engraved pieces or have already been returned.";
    }

    return (
      <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {BackHeader}
        <div className="bg-white rounded-[2rem] border border-zinc-100 p-8 md:p-12 text-center space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="size-16 md:size-20 bg-zinc-50 text-zinc-400 rounded-3xl flex items-center justify-center mx-auto">
            <Icon size={34} />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-figtree text-lg md:text-2xl font-bold text-zinc-900">{title}</h3>
            <p className="font-figtree text-sm text-zinc-500 leading-relaxed">{message}</p>
          </div>

          {data?.existingReturns?.length > 0 && (
            <div className="pt-2">
              <Link prefetch={false}
                href={`/admin/returns/${data.existingReturns[0].id.split("/").pop()}`}
                className="font-figtree inline-flex items-center gap-2 px-6 py-3 bg-[#5A413F] text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-[1.25rem] hover:bg-[#4A3533] transition-colors"
              >
                <RefreshCcw size={14} /> View your return
              </Link>
            </div>
          )}

          <Link prefetch={false}
            href={`/admin/orders/${id}`}
            className="font-figtree inline-block text-xs font-bold text-zinc-400 hover:text-primary uppercase tracking-[0.15em] pt-1"
          >
            Back to order
          </Link>
        </div>
      </div>
    );
  }

  // ── Eligible: selection / review ──
  return (
    <div className="font-figtree space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {BackHeader}

      {/* Policy assurance strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: CalendarClock, title: `${data?.windowDays || 15}-day window`, sub: data?.deadline ? `Until ${formatDate(data.deadline)}` : "After delivery" },
          { icon: Truck, title: "Free pickup", sub: "By our courier partner" },
          { icon: Wallet, title: "Bank transfer refund", sub: "Within 7 days of QC" },
        ].map((p, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <p.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-figtree text-[13px] font-bold text-zinc-900 truncate">{p.title}</p>
              <p className="font-figtree text-[11px] text-zinc-400 truncate">{p.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {step === "select" ? (
        <>
          {data?.existingReturns?.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="font-figtree text-[13px] text-blue-900/80 leading-relaxed">
                You already have a return on this order (
                <Link prefetch={false} href={`/admin/returns/${data.existingReturns[0].id.split("/").pop()}`} className="font-bold underline">
                  {data.existingReturns[0].name || "view status"}
                </Link>
                ). You can still return any remaining eligible items below.
              </p>
            </div>
          )}

          {/* Item selection */}
          <div className="space-y-4">
            <h3 className="font-figtree text-sm font-bold text-zinc-900 uppercase tracking-[0.1em]">
              Select items to return
            </h3>

            {eligibleItems.map((item) => {
              const st = selection[item.fulfillmentLineItemId] || {};
              const selected = !!st.selected;
              return (
                <div
                  key={item.fulfillmentLineItemId}
                  className={`bg-white rounded-[1.75rem] border transition-all duration-300 overflow-hidden ${selected ? "border-primary/40 shadow-[0_12px_30px_rgba(90,65,63,0.10)]" : "border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"}`}
                >
                  <div className="p-5 md:p-6 flex gap-4 md:gap-5">
                    <button
                      onClick={() => toggleItem(item.fulfillmentLineItemId)}
                      className={`mt-1 size-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary border-primary text-white" : "border-zinc-200 text-transparent hover:border-primary/40"}`}
                      aria-label={selected ? "Deselect item" : "Select item"}
                    >
                      <CheckCircle2 size={16} />
                    </button>

                    <div className="size-20 md:size-24 bg-[#FBFBFB] rounded-2xl overflow-hidden shrink-0 border border-zinc-50 flex items-center justify-center p-2">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} width={110} height={110} className="object-contain w-full h-full" />
                      ) : (
                        <RefreshCcw className="text-zinc-200" size={28} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <h4 className="font-figtree text-sm md:text-base font-bold text-zinc-900 leading-snug">
                        {item.title}
                      </h4>
                      {item.maxQuantity > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="font-figtree text-[11px] text-zinc-400 font-semibold uppercase tracking-wide">Qty</span>
                          <select
                            disabled={!selected}
                            value={st.quantity || 1}
                            onChange={(e) => setField(item.fulfillmentLineItemId, "quantity", Number(e.target.value))}
                            className="font-figtree text-sm border border-zinc-200 rounded-lg px-2 py-1 bg-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {Array.from({ length: item.maxQuantity }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                          <span className="font-figtree text-[11px] text-zinc-300">of {item.maxQuantity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason + note (revealed when selected) */}
                  {selected && (
                    <div className="px-5 md:px-6 pb-6 pt-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="font-figtree text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-1.5 block">
                          Reason for return <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={st.reason || ""}
                          onChange={(e) => setField(item.fulfillmentLineItemId, "reason", e.target.value)}
                          className="font-figtree w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Select a reason…</option>
                          {reasons.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-figtree text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-1.5 block">
                          Add a note <span className="text-zinc-300 normal-case tracking-normal font-medium">(optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          maxLength={300}
                          value={st.note || ""}
                          onChange={(e) => setField(item.fulfillmentLineItemId, "note", e.target.value)}
                          placeholder="Tell us more so our team can help faster…"
                          className="font-figtree w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ineligible items */}
            {ineligibleItems.map((item) => (
              <div key={item.fulfillmentLineItemId} className="bg-zinc-50/60 rounded-[1.75rem] border border-zinc-100 p-5 md:p-6 flex gap-4 md:gap-5 opacity-80">
                <div className="size-20 md:size-24 bg-white rounded-2xl overflow-hidden shrink-0 border border-zinc-100 flex items-center justify-center p-2 grayscale">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} width={110} height={110} className="object-contain w-full h-full" />
                  ) : (
                    <RefreshCcw className="text-zinc-200" size={28} />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h4 className="font-figtree text-sm md:text-base font-bold text-zinc-500 leading-snug">{item.title}</h4>
                  <span className="font-figtree inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 bg-white border border-zinc-200 px-2.5 py-1 rounded-full">
                    <AlertCircle size={12} /> {item.ineligibleReason || "Not returnable"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="bg-white rounded-[1.75rem] border border-zinc-100 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky bottom-4">
            <p className="font-figtree text-[13px] text-zinc-500 text-center sm:text-left">
              {selectedList.length > 0
                ? <><span className="font-bold text-zinc-900">{selectedList.length}</span> item{selectedList.length > 1 ? "s" : ""} selected</>
                : "Select at least one item to continue"}
            </p>
            <button
              disabled={!canReview}
              onClick={() => setStep("review")}
              className="font-figtree w-full sm:w-auto px-8 py-4 bg-[#5A413F] text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-[1.25rem] hover:bg-[#4A3533] transition-all shadow-[0_10px_20px_rgba(90,65,63,0.15)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Review request <ChevronLeft className="rotate-180 size-4" />
            </button>
          </div>
        </>
      ) : (
        /* ── Review step ── */
        <>
          <div className="bg-white rounded-[1.75rem] border border-zinc-100 p-6 md:p-8 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="font-figtree text-sm font-bold text-zinc-900 uppercase tracking-[0.1em]">
              Review your return
            </h3>
            <div className="divide-y divide-zinc-100">
              {selectedList.map((item) => {
                const st = selection[item.fulfillmentLineItemId];
                const reasonLabel = reasons.find((r) => r.value === st.reason)?.label || st.reason;
                return (
                  <div key={item.fulfillmentLineItemId} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <div className="size-16 bg-[#FBFBFB] rounded-xl overflow-hidden shrink-0 border border-zinc-50 flex items-center justify-center p-1.5">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} width={80} height={80} className="object-contain w-full h-full" />
                      ) : (
                        <RefreshCcw className="text-zinc-200" size={22} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-figtree text-sm font-bold text-zinc-900 leading-snug">{item.title}</h4>
                      <p className="font-figtree text-[12px] text-zinc-500 mt-0.5">Qty {st.quantity || 1} · {reasonLabel}</p>
                      {st.note && <p className="font-figtree text-[12px] text-zinc-400 mt-1 italic">“{st.note}”</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-primary/5 rounded-[1.75rem] border border-primary/10 p-6 md:p-7 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <h4 className="font-figtree text-[13px] font-bold text-primary uppercase tracking-[0.1em]">What happens next</h4>
            </div>
            <ul className="font-figtree text-[13px] text-zinc-600 space-y-2 leading-relaxed">
              <li>1. Our team reviews and approves your request.</li>
              <li>2. Our courier partner picks up the item — <span className="font-semibold">free of charge</span>.</li>
              <li>3. We complete a quality check on the returned piece.</li>
              <li>4. On approval, our team coordinates your refund via <span className="font-semibold">bank transfer within 7 days</span>.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setStep("select")}
              disabled={submitting}
              className="font-figtree w-full sm:w-auto px-8 py-4 border-[1.5px] border-zinc-200 text-zinc-500 text-[11px] font-bold uppercase tracking-[0.15em] rounded-[1.25rem] hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40"
            >
              Edit selection
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="font-figtree flex-1 w-full px-8 py-4 bg-[#5A413F] text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-[1.25rem] hover:bg-[#4A3533] transition-all shadow-[0_10px_20px_rgba(90,65,63,0.15)] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : <><CheckCircle2 size={16} /> Confirm return request</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
