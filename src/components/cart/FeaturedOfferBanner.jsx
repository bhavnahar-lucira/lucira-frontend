"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import OfferCategoryIcon, { getOfferTheme } from "@/components/coupons/offerCategoryTheme";
import { getOfferCategory, getCategoryBase, OFFER_CATEGORY_LABEL } from "@/lib/coupons";

/**
 * "Featured Offer" banner — sits above the Apply Coupon block, promoting
 * whichever Product Discounts rule staff toggled "Featured Offer" on in the
 * dashboard. Unlike the drawer (which lists everything a customer could go
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
 * The live featured offers are split by metal (5PERCENTDIAMOND /
 * 2PERCENTGOLD), which is why each is measured against its OWN slice of the
 * cart rather than one subtotal — a diamond rule is worth nothing on an
 * all-gold cart, so it cannot lead. A mixed cart surfaces whichever single
 * offer is worth more, rather than implying the two combine; whatever the
 * banner did not lead with becomes a one-line teaser into the Saving Zone,
 * so the other half of the offer structure is never silently absent.
 *
 * @param {Array} dynamicCoupons   full drawer-eligible coupon list (has
 *   .isFeatured, .method, .id, .code, .discountType/.discountValue, .minAmount)
 * @param {Array} activeDiscounts  claim-gated automatic rules currently
 *   eligible for this cart (from useCart()) — gives exact .claimed/.cartSavings
 *   for the automatic ones; a rule not present here (yet) is simply not
 *   eligible, so it's excluded from the banner entirely.
 * @param {number} diamondTotal    value of the cart's diamond lines.
 * @param {number} goldTotal       value of the cart's plain gold lines.
 * @param {number} productTotal    value of every discountable line — the base
 *   for a featured rule that names no metal at all.
 * @param {string|null} effectiveAppliedCode  the code currently "applied"
 *   (code coupon or claimed automatic rule), used to render Applied/Remove.
 * @param {string|null} applyingCode  code currently mid-apply, for the spinner.
 * @param {Function} onApply   (code) => Promise — CartSummary's handleApplyCoupon.
 * @param {Function} onRemove  (code) => Promise — CartSummary's handleRemoveCoupon.
 * @param {boolean} loading    cart loading state, to disable the button.
 */
/**
 * Which featured offer leads, and which are left over.
 *
 * Lives here rather than inline because two surfaces need the same answer and
 * must not disagree: this banner renders `primary`, while CartSummary renders
 * `others` as the "also available" line clipped under the Apply Coupon card.
 * Deriving that twice is how the two would drift into advertising an offer the
 * banner is already showing.
 *
 * @returns {{primary: object|null, others: object[]}}
 */
export function selectFeaturedOffers({
  dynamicCoupons,
  activeDiscounts,
  diamondTotal = 0,
  goldTotal = 0,
  productTotal = 0,
  effectiveAppliedCode,
  // Every applied code. A combined pair puts two on the cart, and checking
  // only the first would report the second as unclaimed — which showed the
  // combined banner a CLAIM button while both were already applied.
  appliedCodes,
}) {
  const liveCodes = (appliedCodes && appliedCodes.length
    ? appliedCodes
    : effectiveAppliedCode
      ? [effectiveAppliedCode]
      : []).map((c) => String(c || "").toUpperCase());
  const featuredCandidates = (dynamicCoupons || []).filter((c) => c.isFeatured);
  const totals = { diamondTotal, goldTotal, productTotal };

  const withEligibility = featuredCandidates
    .map((c) => {
      const isApplied = liveCodes.includes(String(c.code).toUpperCase());
      const category = getOfferCategory(c);
      const base = getCategoryBase(category, totals);

      if (c.method === "automatic") {
        // An automatic rule absent from activeDiscounts has no claimable id to
        // send, so there is nothing a banner could do with it — that one really
        // does have to drop out rather than render a dead button.
        const live = (activeDiscounts || []).find((d) => d.id === c.id);
        if (!live && !isApplied) return null;
        return { ...c, category, claimed: live?.claimed ?? isApplied, savings: live?.cartSavings ?? 0, isApplicable: true };
      }
      // Code discounts have no live per-cart eligibility signal until
      // submitted — approximate with "the cart holds something this offer can
      // discount, and clears the rule's own minimum". Savings is an estimate
      // for ranking only (the real figure is whatever Shopify returns on
      // submit).
      //
      // An offer whose metal isn't in the cart is kept rather than dropped —
      // it can't be the banner, but the customer is still told it exists (see
      // `otherOffers` below), which is how a gold-only cart learns the diamond
      // side is worth more.
      const isApplicable = base > 0 && base >= Number(c.minAmount || 0);
      const savings = c.discountType === "percentage" ? base * (c.discountValue / 100) : c.discountValue;
      return { ...c, category, claimed: isApplied, savings, isApplicable };
    })
    .filter(Boolean);

  // At most ONE banner out here. A mixed diamond + plain gold cart qualifies
  // for both offers, but they never stack — showing both side by side reads
  // as if they add up. So the applied one leads (it has to stay removable),
  // otherwise the highest-value offer wins.
  const offers = [...withEligibility].sort((a, b) => {
    if (a.claimed !== b.claimed) return a.claimed ? -1 : 1;
    if (a.isApplicable !== b.isApplicable) return a.isApplicable ? -1 : 1;
    return b.savings - a.savings;
  });

  // Nothing in the cart qualifies for any featured offer — there's no banner
  // to lead with, so nothing renders at all.
  const primary = offers.find((o) => o.claimed || o.isApplicable) || null;
  if (!primary) return { primary: null, others: [] };

  return { primary, others: offers.filter((o) => o.code !== primary.code) };
}

export default function FeaturedOfferBanner({
  dynamicCoupons,
  activeDiscounts,
  diamondTotal,
  goldTotal = 0,
  productTotal = 0,
  effectiveAppliedCode,
  appliedCodes,
  applyingCode,
  onApply,
  onRemove,
  loading,
}) {
  const [processingCode, setProcessingCode] = useState(null);
  const user = useSelector((state) => state.user.user);
  const { openLogin } = useAuth();

  const { primary } = selectFeaturedOffers({
    dynamicCoupons,
    activeDiscounts,
    diamondTotal,
    goldTotal,
    productTotal,
    effectiveAppliedCode,
    appliedCodes,
  });

  if (!primary) return null;

  const claimedOffer = primary.claimed ? primary : null;

  const handleToggle = async (offer) => {
    // The button's own `disabled` prop lags one render behind a click (React
    // batches the setProcessingCode that would flip it), so a fast
    // double-click/double-tap can still fire this twice before it takes
    // effect — the two overlapping apply/remove calls then race and settle
    // in whatever order their responses land, showing an "applied, removed,
    // applied, removed" toast flicker along the way. This is a synchronous
    // guard the render lag can't get around.
    if (processingCode) return;
    setProcessingCode(offer.code);
    try {
      if (offer.claimed) {
        await onRemove(offer.code);
      } else {
        await onApply(offer.code);
      }
    } finally {
      setProcessingCode(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 mb-[10px]">
      {[primary].map((best) => {
        const theme = getOfferTheme(best.category);
        const amountLabel =
          best.discountType === "percentage"
            ? `${best.discountValue}%`
            : `₹${Number(best.discountValue).toLocaleString("en-IN")}`;
        const categoryLabel = OFFER_CATEGORY_LABEL[best.category];
        const isBusy = processingCode === best.code || applyingCode === best.code;
        // Same gate the free-gift tier banner uses: a logged-out shopper sees
        // the offer and an UNLOCK that opens login, rather than a Claim that
        // would fail on a cart the backend can't attribute to anyone.
        const needsLogin = !best.claimed && !user;
        // The other offer is live — this one can't be claimed on top of it.
        const isBlockedByOther = !!claimedOffer && !best.claimed;
        // Nothing in the cart this offer's metal applies to. It still shows,
        // so the customer sees the whole offer structure, but Claim would only
        // come back from Shopify as "not applicable to the items in your cart".
        const isOutOfCategory = !best.claimed && !best.isApplicable;
        const isDimmed = isBlockedByOther || isOutOfCategory;

        return (
    /* A flat tile in the metal's palest tint — no gradient, no border, no
       shadow, in every state. The claimed state reads from the copy and the
       Remove button, not from an outline. */
    <div
      key={best.code}
      className={`relative w-full overflow-hidden border-0 shadow-none transition-colors ${isDimmed ? "opacity-60" : ""}`}
      style={{ borderRadius: "8px", background: theme.flatBg }}
    >

      {/* Literal px, not p-2 — the site's root font-size varies by breakpoint,
          so rem padding drifts off the spec (p-2 lands at 6.5px in places). */}
      <div className="relative flex items-center gap-2.5 p-[8px] sm:gap-3 lg:p-[10px]">
        <span
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[6px]"
          style={{ background: theme.tileSolid, border: `1px solid ${theme.tileBorder}` }}
        >
          <OfferCategoryIcon category={best.category} className="h-[22px] w-[22px]" />
        </span>

        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-figtree text-[0.85rem] font-semibold capitalize leading-[1.25] tracking-[0.01em] lg:text-[1rem]" style={{ color: theme.accent }}>
            Additional {amountLabel} Off
          </p>

          {/* No code anywhere on a featured offer — Claim submits it for the
              customer, so the code is never something they need to see or
              share. The cart trigger hides it for the same reason. */}
          <p className="mt-[3px] truncate font-figtree text-[0.68rem] leading-[1.3] text-black lg:mt-[6px] lg:text-[0.875rem]">
            {best.claimed ? (
              best.savings > 0 ? (
                <>
                  You&apos;re saving{" "}
                  <span className="font-semibold text-[#189351]">
                    &#8377;{Math.round(best.savings).toLocaleString("en-IN")}
                  </span>{" "}
                  on {categoryLabel}.
                </>
              ) : (
                <>Applied to {categoryLabel} in your cart.</>
              )
            ) : (
              <>On {categoryLabel}</>
            )}
          </p>
        </div>

        {needsLogin ? (
          <button
            type="button"
            onClick={() => openLogin()}
            className="ml-0 flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] px-3 font-figtree text-[12px] font-medium uppercase tracking-wide text-white transition hover:brightness-95 sm:h-9 sm:gap-1.5 sm:px-4 lg:ml-[20px] lg:h-10 lg:gap-2 lg:px-6 lg:text-[14px]"
            style={{ background: theme.accent }}
          >
            <Lock className="hidden h-3.5 w-3.5 lg:block" />
            UNLOCK
          </button>
        ) : (
        <button
          type="button"
          onClick={() => handleToggle(best)}
          disabled={isBusy || loading || isBlockedByOther || isOutOfCategory}
          title={
            isBlockedByOther
              ? `Remove the ${claimedOffer.code} offer to use this one`
              : isOutOfCategory
                ? `Add ${categoryLabel.toLowerCase()} to your cart to use this offer`
                : undefined
          }
          className={
            best.claimed
              ? "ml-0 flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] px-2.5 font-figtree text-[10px] font-medium uppercase tracking-wide transition hover:bg-[#e7000b]/10 disabled:opacity-50 sm:h-9 sm:gap-1.5 sm:px-4 sm:text-[11px] lg:ml-[20px] lg:h-10 lg:gap-2 lg:px-6 lg:text-[13px]"
              // Claim carries the metal rather than the house brown, so the
              // whole banner reads as one offer instead of a tinted panel with
              // an unrelated button dropped on it.
              : "ml-0 flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] px-3 font-figtree text-[12px] font-medium uppercase tracking-wide text-white transition hover:brightness-95 disabled:opacity-50 sm:h-9 sm:gap-1.5 sm:px-4 lg:ml-[20px] lg:h-10 lg:gap-2 lg:px-6 lg:text-[14px]"
          }
          style={
            best.claimed
              ? { border: "1px solid #e7000b", background: "transparent", color: "#e7000b" }
              : { background: theme.accent }
          }
        >
          {isBusy ? <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" /> : best.claimed ? "REMOVE" : "CLAIM"}
        </button>
        )}
      </div>
    </div>
        );
      })}
    </div>
  );
}
