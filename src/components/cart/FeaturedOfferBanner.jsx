"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import NoImageIcon from "@/components/common/RewardBadgeIcon";

/**
 * "Featured Offer" banner — sits above the Apply Coupon block, promoting
 * whichever Product Discounts rule staff toggled "Featured Offer" on in the
 * dashboard. Unlike the drawer (which only lists things a customer has to go
 * looking for), this is the lead placement, so only the single best-value
 * featured offer shows at a time.
 *
 * Featured rules can be either method — a discount CODE (customer never
 * types anything; clicking Claim submits the code the same way the drawer
 * does) or an "automatic" rule (claim-gated via /api/cart/discount/claim,
 * same as the free-gift banner). Both are driven from the same
 * `dynamicCoupons` list (GET /api/cart/coupons/active) the drawer already
 * fetches — this component takes it as a prop rather than re-fetching, and
 * reuses the parent's onApply/onRemove so code-vs-automatic branching lives
 * in exactly one place (CartSummary's handleApplyCoupon).
 *
 * @param {Array} dynamicCoupons   full drawer-eligible coupon list (has
 *   .isFeatured, .method, .id, .code, .discountType/.discountValue, .minAmount)
 * @param {Array} activeDiscounts  claim-gated automatic rules currently
 *   eligible for this cart (from useCart()) — gives exact .claimed/.cartSavings
 *   for the automatic ones; a rule not present here (yet) is simply not
 *   eligible, so it's excluded from the banner entirely.
 * @param {number} diamondTotal    rough cart value estimate, used only to
 *   rank a featured CODE offer against a featured automatic one (automatic
 *   offers already carry an exact cartSavings; codes don't until submitted).
 * @param {string|null} effectiveAppliedCode  the code currently "applied"
 *   (code coupon or claimed automatic rule), used to render Applied/Remove.
 * @param {string|null} applyingCode  code currently mid-apply, for the spinner.
 * @param {Function} onApply   (code) => Promise — CartSummary's handleApplyCoupon.
 * @param {Function} onRemove  (code) => Promise — CartSummary's handleRemoveCoupon.
 * @param {boolean} loading    cart loading state, to disable the button.
 */
export default function FeaturedOfferBanner({
  dynamicCoupons,
  activeDiscounts,
  diamondTotal,
  effectiveAppliedCode,
  applyingCode,
  onApply,
  onRemove,
  loading,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const featuredCandidates = (dynamicCoupons || []).filter((c) => c.isFeatured);

  const withEligibility = featuredCandidates
    .map((c) => {
      const isApplied = !!effectiveAppliedCode && effectiveAppliedCode.toUpperCase() === c.code.toUpperCase();
      if (c.method === "automatic") {
        // activeDiscounts only contains automatic rules that already matched
        // a cart line AND cleared their own minRequirement — absence here
        // means genuinely not eligible right now, not just "unknown".
        const live = (activeDiscounts || []).find((d) => d.id === c.id);
        if (!live && !isApplied) return null;
        return { ...c, claimed: live?.claimed ?? isApplied, savings: live?.cartSavings ?? 0 };
      }
      // Code discounts have no live per-cart eligibility signal until
      // submitted — approximate with the same "cart clears this minimum"
      // check the drawer already uses, and estimate savings for ranking
      // only (the actual amount is whatever Shopify returns on submit).
      const eligible = diamondTotal >= Number(c.minAmount || 0);
      if (!eligible && !isApplied) return null;
      const savings = c.discountType === "percentage" ? diamondTotal * (c.discountValue / 100) : c.discountValue;
      return { ...c, claimed: isApplied, savings };
    })
    .filter(Boolean);

  // Applied one leads (so the customer can see/remove what's active);
  // otherwise the highest-savings eligible offer.
  const best =
    withEligibility.find((c) => c.claimed) ||
    [...withEligibility].sort((a, b) => b.savings - a.savings)[0] ||
    null;

  if (!best) return null;

  const discountLabel = best.discountType === "percentage" ? `${best.discountValue}% off` : `₹${best.discountValue} off`;
  const isBusy = isProcessing || applyingCode === best.code;

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      if (best.claimed) {
        await onRemove(best.code);
      } else {
        await onApply(best.code);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="flex w-full items-center gap-2.5 sm:gap-3 border border-[#EADFD8] shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] transition-colors pr-2.5 sm:pr-3.5"
      style={{
        borderRadius: "8px",
        background: "linear-gradient(89.31deg, rgb(254, 245, 241) 0%, rgb(241, 228, 209) 100%)",
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 10,
        marginBottom: 16,
      }}
    >
      <div className="w-[40px] h-[40px] shrink-0 flex items-center justify-center bg-[#FEF9F6] rounded-sm" style={{ border: "1px solid #EADFD8" }}>
        <NoImageIcon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1 text-left py-1 sm:py-0">
        <p className="font-figtree text-[0.8rem] lg:text-[0.95rem] leading-[1.35] text-[#3D2B28]" style={{ fontWeight: 600 }}>
          {best.code}
        </p>
        <p className="font-figtree text-[0.7rem] lg:text-[0.8rem] leading-[1.3] text-black mt-1">
          {best.claimed ? <>You&apos;ve applied this offer.</> : <>Get <span className="font-bold">{discountLabel}</span>.</>}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isBusy || loading}
        className={
          best.claimed
            ? "flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-2.5 sm:px-4 lg:px-6 font-figtree font-medium text-[10px] sm:text-[11px] lg:text-[13px] hover:bg-[#e7000b]/10 cursor-pointer disabled:opacity-50 ml-0 lg:ml-[20px]"
            : "flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-3 sm:px-4 lg:px-6 font-figtree font-medium text-[12px] sm:text-[12px] lg:text-[14px] bg-[#5A413F] text-white hover:bg-[#4A312F] cursor-pointer disabled:opacity-50 ml-0 lg:ml-[20px]"
        }
        style={best.claimed ? { border: "1px solid #e7000b", background: "transparent", color: "#e7000b" } : undefined}
      >
        {isBusy ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : best.claimed ? "REMOVE" : "CLAIM"}
      </button>
    </div>
  );
}
