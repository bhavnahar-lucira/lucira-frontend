"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BadgePercent, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCart } from "@/hooks/useCart";
import { applyCoupon, removeCoupon, removePoints } from "@/redux/features/cart/cartSlice";
import { apiFetch } from "@/lib/api";
import { pushPromoClick } from "@/lib/gtm";
import {
  ADDITIONAL_OFFER_SLABS,
  formatInr as inr,
  getAdditionalOfferBenefit,
  getEternaBenefit,
  isAdditionalOfferCode,
} from "@/lib/cartOffers";

const rangeLabel = (slab) =>
  slab.max === Infinity ? `${inr(slab.min)} and above` : `${inr(slab.min)} - ${inr(slab.max)}`;

export default function AdditionalOffersSlab({ className = "" }) {
  const dispatch = useDispatch();
  const { items, appliedCoupon, nectorPoints } = useCart();
  const user = useSelector((state) => state.user.user);

  const [isApplying, setIsApplying] = useState(false);
  // Guards the auto-upgrade effect so a failed switch isn't retried in a loop.
  const autoSwitchAttempt = useRef(null);

  const { subtotal: offerSubtotal, slab: currentSlab, amount: offerAmount } = useMemo(
    () => getAdditionalOfferBenefit(items),
    [items]
  );

  // Only one coupon can be applied to a cart, so when the Eterna 3% is worth more this
  // offer steps aside and lets the Eterna banner take the sale.
  const eternaAmount = useMemo(() => getEternaBenefit(items).amount, [items]);
  const isOutrankedByEterna = eternaAmount > offerAmount;

  const couponDetails = typeof appliedCoupon === "object" ? appliedCoupon : { code: appliedCoupon };
  const appliedCode = couponDetails?.code || "";
  const isThisOfferApplied = isAdditionalOfferCode(appliedCode);
  const isCurrentSlabApplied = isThisOfferApplied && appliedCode.toUpperCase() === currentSlab?.code;

  const applySlabCoupon = async (slab, { silent = false } = {}) => {
    if (!slab) return false;
    setIsApplying(true);
    try {
      let value = slab.amount;
      let valueType = "FIXED_AMOUNT";
      let summary = `${inr(slab.amount)} off on Diamond Jewellery`;

      try {
        const data = await apiFetch("/api/cart/coupon/validate", {
          method: "POST",
          body: JSON.stringify({ items, couponCode: slab.code, customerEmail: user?.email }),
          suppressErrorLog: true,
        });
        if (data?.value) {
          value = Number(data.value);
          valueType = data.valueType || valueType;
          summary = data.summary || summary;
        }
      } catch (err) {
        // The backend resolves entitlement from the Shopify collection. Eligibility here is
        // already established from the cart items' own collection tag, and Shopify re-checks
        // the code at checkout, so a "not applicable" answer must not block the offer.
        // Anything else (inactive code, minimum not met) is a real failure.
        if (!/not applicable/i.test(err?.message || "")) {
          if (!silent) toast.error(err.message);
          return false;
        }
      }

      if (nectorPoints) {
        dispatch(removePoints());
        if (!silent) toast.info("Loyalty points removed as a coupon is applied.");
      }

      dispatch(applyCoupon({ code: slab.code, summary, value, valueType }));

      pushPromoClick({
        creative_name: "Additional Offers - Diamond Jewelry",
        location_id: "cart summary",
        promo_id: slab.code,
        promo_name: `${inr(slab.amount)} off on ${rangeLabel(slab)}`,
        promo_position: "Cart Page",
      });

      if (!silent) toast.success(`${inr(slab.amount)} additional discount applied!`);
      return true;
    } finally {
      setIsApplying(false);
    }
  };

  // Keep an applied ADDITIONALRS code on the tier the cart currently qualifies for —
  // editing the cart must not leave a higher (or now invalid) slab attached to it.
  useEffect(() => {
    if (!isThisOfferApplied || isCurrentSlabApplied) {
      autoSwitchAttempt.current = null;
      return;
    }

    if (!currentSlab) {
      dispatch(removeCoupon());
      toast.error("Additional offer removed — your Diamond Jewellery total changed.");
      return;
    }

    if (autoSwitchAttempt.current === currentSlab.code) return;
    autoSwitchAttempt.current = currentSlab.code;
    applySlabCoupon(currentSlab, { silent: true }).then((ok) => {
      if (!ok) dispatch(removeCoupon());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThisOfferApplied, isCurrentSlabApplied, currentSlab?.code]);

  const handleRemove = () => {
    dispatch(removeCoupon());
    toast.error("Additional offer removed");
  };

  // Nothing qualifies, or the Eterna offer is the better deal — stay out of the way.
  if (offerSubtotal <= 0 || isOutrankedByEterna) return null;

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-[#EADFD8] bg-white shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] ${className}`}
    >
      <div
        className="flex w-full items-center gap-3 p-3.5"
        style={{ background: "linear-gradient(89.31deg, rgb(254, 245, 241) 0%, rgb(241, 228, 209) 100%)" }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#EADFD8] bg-white/70">
          <BadgePercent size={18} className="text-[#5A413F]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-figtree text-[13px] font-medium leading-[1.3] text-[#3D2B28] lg:text-[15px]">
            Additional Offers
          </p>
          <p className="font-figtree text-[11px] font-medium leading-[1.3] text-[#6B5B54] lg:text-[12px] mt-[3px]">
            {currentSlab
              ? `${inr(currentSlab.amount)} off on Diamond Jewellery`
              : `Add ${inr(ADDITIONAL_OFFER_SLABS[0].min - offerSubtotal)} more on Diamond Jewellery to unlock`}
          </p>
        </div>
        {currentSlab &&
          (isCurrentSlabApplied ? (
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[12px] font-bold uppercase tracking-wide text-[#189351]">Applied</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-[10px] font-bold uppercase tracking-wide text-red-500 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => applySlabCoupon(currentSlab)}
              disabled={isApplying}
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[4px] bg-[#5A413F] px-4 font-figtree text-[11px] font-medium uppercase tracking-wide text-white transition-colors hover:bg-[#4A3533] disabled:cursor-not-allowed disabled:opacity-70 lg:h-10 lg:px-6 lg:text-[13px] cursor-pointer"
            >
              {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply Now"}
            </button>
          ))}
      </div>

    </div>
  );
}
