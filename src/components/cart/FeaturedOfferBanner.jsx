"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, Lock, Zap, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import OfferCategoryIcon, { getOfferTheme } from "@/components/coupons/offerCategoryTheme";
import { getOfferCategory, getFeaturedOfferBase, isFeaturedOfferEligible, OFFER_CATEGORY_LABEL } from "@/lib/coupons";

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
 * offer is worth more, rather than implying the two combine; the runner-up
 * becomes a one-line teaser into the Saving Zone — but only while this cart
 * still qualifies for it, so the teaser is never a deal the cart can't take.
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
  // { ruleId: value of the cart this rule's "Exclusions" carve out }. Comes
  // off the backend's per-line excludedFromRuleIds tag — the browser has no
  // view of a product's collections, so it can't derive this itself.
  excludedTotalsByRule = {},
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

      if (c.method === "automatic") {
        // An automatic rule absent from activeDiscounts has no claimable id to
        // send, so there is nothing a banner could do with it — that one really
        // does have to drop out rather than render a dead button. Anything the
        // backend DID return there it already vetted (collection match + real
        // aggregate subtotal), so its presence is the eligibility signal.
        const live = (activeDiscounts || []).find((d) => d.id === c.id);
        if (!live && !isApplied) return null;
        return { ...c, category, claimed: live?.claimed ?? isApplied, savings: live?.cartSavings ?? 0, isApplicable: true };
      }

      // Code discounts have no live per-cart eligibility signal until
      // submitted — lean on the one shared gate: the cart holds something this
      // offer's metal covers AND that slice clears the rule's dashboard
      // minimum. Being applied does NOT make a below-minimum offer eligible —
      // the shopper may have just lowered a quantity under the bar, and
      // CartSummary strips it on the same render this reports it.
      //
      // Savings is an estimate for ranking only (the real figure is whatever
      // Shopify returns on submit).
      const base = getFeaturedOfferBase(c, totals, excludedTotalsByRule);
      const isApplicable = isFeaturedOfferEligible(c, totals, excludedTotalsByRule);
      // "Almost there": the cart holds this metal but hasn't cleared the
      // minimum. Not claimable, but worth showing as an "add ₹X more" nudge
      // rather than staying invisible.
      const isTeaser = !isApplied && !isApplicable && base > 0;
      const savings = c.discountType === "percentage" ? base * (c.discountValue / 100) : c.discountValue;
      return { ...c, category, claimed: isApplied, savings, isApplicable, isTeaser };
    })
    .filter(Boolean);

  // At most ONE banner out here. A mixed diamond + plain gold cart qualifies
  // for both offers, but they never stack — showing both side by side reads
  // as if they add up. So an applied+eligible offer leads (it has to stay
  // removable), otherwise the highest-value eligible offer wins, and failing
  // that the closest "almost there" teaser.
  const offers = [...withEligibility].sort((a, b) => {
    if (a.claimed !== b.claimed) return a.claimed ? -1 : 1;
    if (a.isApplicable !== b.isApplicable) return a.isApplicable ? -1 : 1;
    return b.savings - a.savings;
  });

  // Lead with a claimable/claimed offer; an applied one that has fallen back
  // under its minimum is mid-removal (CartSummary strips it) so it is skipped
  // here too. If nothing is claimable, fall back to an "add ₹X more" teaser so
  // a cart that's close still sees what a little more unlocks. Nothing in
  // either bucket means no banner at all.
  const primary =
    offers.find((o) => o.isApplicable) ||
    offers.find((o) => o.isTeaser) ||
    null;
  if (!primary) return { primary: null, others: [] };

  // The "also available" line under Apply Coupon only ever names a second
  // offer this cart can take right now — a teaser there would read as a
  // claimable deal that then refuses.
  return {
    primary,
    others: offers.filter((o) => o.code !== primary.code && o.isApplicable),
  };
}

export default function FeaturedOfferBanner({
  dynamicCoupons,
  activeDiscounts,
  diamondTotal,
  goldTotal = 0,
  productTotal = 0,
  excludedTotalsByRule = {},
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
    excludedTotalsByRule,
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

        // How much of the cart this offer's metal covers, and how far that is
        // from the dashboard minimum spend — so a cart that is close gets a
        // "you're almost there" nudge rather than a dead "not applicable".
        const base = getFeaturedOfferBase(best, { diamondTotal, goldTotal, productTotal }, excludedTotalsByRule);
        const minAmount = Number(best.minAmount || 0);
        const minLabel = minAmount > 0 ? `₹${minAmount.toLocaleString("en-IN")}` : null;
        const shortfall = minAmount > 0 ? Math.max(0, minAmount - base) : 0;
        const hasNothingEligible = !best.claimed && base <= 0;
        const isBelowMinimum = !best.claimed && base > 0 && !best.isApplicable;
        // CLAIM can't win in either case; but only a genuinely empty category
        // dims the tile — an "almost there" cart stays bright so it still pulls.
        const isOutOfCategory = hasNothingEligible || isBelowMinimum;
        const isDimmed = isBlockedByOther || hasNothingEligible;
        const accent = best.claimed ? "#189351" : theme.accent;
        // The CLAIM button only earns the shimmer + glow when tapping it would
        // actually do something.
        const claimIsLive = !best.claimed && !isBusy && !loading && !isBlockedByOther && !isOutOfCategory;

        return (
    /* Reframed as an "Instant Bank Discount" callout — a white label strip over
       the theme's tinted gradient body, so it reads as a bank perk worth
       grabbing rather than one more coupon row. */
    <div
      key={best.code}
      className={`relative w-full overflow-hidden transition-colors ${isDimmed ? "opacity-70" : ""}`}
      style={{ background: theme.background }}
    >
      {/* Eyebrow — a white strip that labels the tile an instant bank discount,
          floating above the tinted body on a small gap. */}
      <div
        className="flex items-center gap-1.5 px-[10px] pt-[7px] pb-[8px] lg:px-[12px] lg:pt-[9px]"
        style={{ background: "#ffffff", marginBottom: "10px" }}
      >
        {best.claimed ? (
          <CheckCircle className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" style={{ color: accent }} />
        ) : (
          <Zap className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" fill={accent} style={{ color: accent }} />
        )}
        <span
          className="font-figtree text-[0.7rem] font-semibold uppercase leading-none tracking-[0.7px]"
          style={{ color: accent }}
        >
          {best.claimed ? "Instant Bank Discount · Applied" : "Instant Bank Discount"}
        </span>
      </div>

      {/* Literal px, not p-2 — the site's root font-size varies by breakpoint,
          so rem padding drifts off the spec (p-2 lands at 6.5px in places). */}
      <div className="relative flex items-center gap-2.5 px-[10px] pb-[8px] sm:gap-3 lg:px-[12px] lg:pb-[10px]">
        <span
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[6px] lg:h-[42px] lg:w-[42px]"
          style={{ background: theme.tileSolid, border: `1px solid ${theme.tileBorder}` }}
        >
          <OfferCategoryIcon category={best.category} className="h-[21px] w-[21px] lg:h-[23px] lg:w-[23px]" />
        </span>

        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-figtree text-[0.75rem] font-semibold capitalize leading-[1.2] tracking-[0.01em] lg:text-[1.05rem]" style={{ color: theme.accent }}>
            Additional {amountLabel} Off
          </p>

          {/* One sub-line, never two. Claimable → what the shopper stands to
              save; below the minimum → the "add ₹X more" nudge; empty category
              → "add {metal}". No code anywhere — Claim submits it for them. */}
          <p className="mt-[4px] truncate font-figtree text-[0.68rem] leading-[1.3] text-black lg:text-[0.82rem]">
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
            ) : hasNothingEligible ? (
              <>Add {categoryLabel.toLowerCase()} to grab this deal.</>
            ) : isBelowMinimum ? (
              <>
                On {categoryLabel} &middot; add{" "}
                <span className="font-semibold" style={{ color: theme.accent }}>
                  &#8377;{shortfall.toLocaleString("en-IN")}
                </span>{" "}
                more
              </>
            ) : best.savings > 0 ? (
              <>
                You can save{" "}
                <span className="font-semibold" style={{ color: theme.accent }}>
                  &#8377;{Math.round(best.savings).toLocaleString("en-IN")}
                </span>{" "}
                on {categoryLabel.toLowerCase()}
              </>
            ) : (
              <>
                On {categoryLabel}
                {minLabel && <> &middot; above {minLabel}</>}
              </>
            )}
          </p>
        </div>

        {needsLogin ? (
          <button
            type="button"
            onClick={() => openLogin()}
            className="ml-0 flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] px-3 font-figtree text-[12px] font-semibold uppercase tracking-wide text-white transition hover:brightness-95 sm:h-9 sm:gap-1.5 sm:px-4 lg:ml-[16px] lg:h-10 lg:gap-2 lg:px-6 lg:text-[14px]"
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
              : hasNothingEligible
                ? `Add ${categoryLabel.toLowerCase()} to your cart to use this offer`
                : isBelowMinimum
                  ? `Add ₹${shortfall.toLocaleString("en-IN")} more in ${categoryLabel.toLowerCase()} to use this offer`
                  : undefined
          }
          className={
            best.claimed
              ? "ml-0 flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] px-2.5 font-figtree text-[10px] font-medium uppercase tracking-wide transition hover:bg-[#e7000b]/10 disabled:opacity-50 sm:h-9 sm:gap-1.5 sm:px-4 sm:text-[11px] lg:ml-[16px] lg:h-10 lg:gap-2 lg:px-6 lg:text-[13px]"
              // Claim carries the metal rather than the house brown, so the
              // whole banner reads as one offer instead of a tinted panel with
              // an unrelated button dropped on it. shimmer-btn adds the slow
              // sweep that says "act on this" — but only when it's live.
              : `${claimIsLive ? "shimmer-btn " : ""}ml-0 flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] px-4 font-figtree text-[12px] font-semibold uppercase tracking-wide text-white transition hover:brightness-95 disabled:opacity-50 sm:h-9 sm:gap-1.5 sm:px-5 lg:ml-[16px] lg:h-10 lg:gap-2 lg:px-7 lg:text-[14px]`
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
