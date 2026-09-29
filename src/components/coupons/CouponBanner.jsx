"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, CheckCircle2, Info } from "lucide-react";
import { COUPON_DISCLAIMER } from "@/lib/coupons";

/**
 * One coupon ticket in the customer's account — the welcome reward and each
 * occasion coupon (birthday / anniversary) are the same card with a different
 * heading. Shown on My Overview and on Earn Rewards, so it lives here rather
 * than inside either page.
 */
export default function CouponBanner({ heading, coupon, footnote, copied, onCopy }) {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!showInfo) return;
    const close = () => setShowInfo(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showInfo]);

  return (
    <div className="relative rounded-[8px] shadow-lg shadow-primary/20">
      {/* Gradient + dot texture live in their own clipped layer so the tooltip
          below (a sibling, not clipped) isn't cut off by overflow-hidden. */}
      <div className="absolute inset-0 rounded-[8px] overflow-hidden bg-gradient-to-br from-[#4A3230] via-primary to-[#7C5A45]">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "14px 14px" }}
        />
      </div>
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4">
        <div className="hidden sm:flex shrink-0 size-10 rounded-full bg-white/15 items-center justify-center ring-1 ring-white/20">
          <Gift className="size-5 text-white" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Gift className="size-4 text-white sm:hidden" strokeWidth={2} />
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">{heading}</h3>
            <span className="text-[11px] font-semibold text-white/80">{coupon.title}</span>

            <div className="relative group/info" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                className="flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Coupon terms"
              >
                <Info className="size-3.5" strokeWidth={2.5} />
              </button>
              <div
                className={`absolute z-30 top-full left-0 mt-2 w-64 rounded-lg bg-white text-zinc-700 text-[11px] font-medium leading-relaxed p-3 shadow-xl transition-opacity ${
                  showInfo ? "opacity-100" : "opacity-0 pointer-events-none"
                } group-hover/info:opacity-100 group-hover/info:pointer-events-auto`}
              >
                {coupon.condition}. {COUPON_DISCLAIMER}
              </div>
            </div>
          </div>
          {footnote && <p className="text-[11px] font-semibold text-white/70 mt-1">{footnote}</p>}
        </div>

        <button
          onClick={() => onCopy(coupon.code)}
          className="shrink-0 flex items-center justify-between sm:justify-start gap-3 h-10 pl-4 pr-2 rounded-xl bg-white/95 hover:bg-white transition-colors font-bold text-[13px] tracking-[0.15em] text-primary cursor-pointer"
        >
          {coupon.code}
          <span className="flex items-center justify-center size-6 rounded-lg bg-primary/10">
            {copied ? (
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5 text-primary" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * The occasion coupons a customer currently holds, as cards. Both account
 * surfaces render the same list the same way — GET /api/customer/occasion-coupons
 * returns nothing at all unless a window is open, so this is usually empty.
 */
export function OccasionCoupons({ coupons, copiedCode, onCopy }) {
  return (coupons || []).map((coupon) => (
    <CouponBanner
      key={coupon.code}
      heading={`Your ${coupon.occasionLabel} Gift`}
      coupon={coupon}
      footnote={`Valid till ${new Date(coupon.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
      copied={copiedCode === coupon.code}
      onCopy={onCopy}
    />
  ));
}
