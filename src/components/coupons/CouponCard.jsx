"use client";

import React from "react";
import { CheckCircle, Copy, Loader2, Tag } from "lucide-react";
import { useSelector } from "react-redux";
import OfferCategoryIcon, { getOfferTheme } from "./offerCategoryTheme";
import { getOfferCategory, OFFER_CATEGORY_LABEL } from "@/lib/coupons";

/**
 * Ticket-style coupon card shared by the PDP unlock strip and the cart's
 * Saving Zone drawer so the two stay visually identical.
 *
 * mode="copy"  — PDP behaviour: copies the code to the clipboard.
 * mode="apply" — cart behaviour: applies the code straight to the cart.
 *
 * isBankOffer — the metal-split "additional % off" rules (5PERCENTDIAMOND /
 * 2PERCENTGOLD). Same ticket, highlighted: the spine and the accent take the
 * metal's colour, the logo slot carries a diamond or a bullion stack, and the
 * headline is derived from the discount rather than a staff-typed title, so
 * the card always reads "Additional 5% Off / On Diamond Products". Rendering
 * these through CouponCard rather than a card of their own is deliberate —
 * a separate component drifts from this one the first time either is touched.
 */
export default function CouponCard({
  coupon,
  onCopy,
  copiedCode,
  className = "w-[280px]",
  isMini = false,
  mode = "copy",
  onApply,
  onRemove,
  applyingCode = null,
  appliedCode = null,
  isApplicable = true,
  disabled = false,
  isBankOffer = false,
}) {
  const user = useSelector((state) => state.user?.user);
  const category = isBankOffer ? getOfferCategory(coupon) : null;
  const theme = isBankOffer ? getOfferTheme(category) : null;

  const bankAmountLabel = isBankOffer
    ? coupon.discountType === "percentage" || coupon.valueType === "PERCENTAGE"
      ? `${coupon.discountValue ?? coupon.value}%`
      : `₹${Number(coupon.discountValue ?? coupon.value ?? 0).toLocaleString("en-IN")}`
    : null;
  const isCopied = copiedCode === coupon.code;
  const isApplied = mode === "apply" && appliedCode?.toUpperCase() === coupon.code.toUpperCase();
  const isApplying = mode === "apply" && applyingCode === coupon.code;
  // The cart value falls outside this coupon's tier, so it can never succeed.
  const isOutOfTier = mode === "apply" && !isApplicable && !isApplied;
  // Only one coupon can be live on a cart, so once any code is applied every
  // other card is locked — the applied one has to be removed first.
  const isBlockedByOther = mode === "apply" && !!appliedCode && !isApplied;
  const isDimmed = isOutOfTier || isBlockedByOther || (mode === "apply" && disabled);

  return (
    <div className={`flex ${isMini ? 'h-24 md:h-28' : 'h-30 sm:h-30 min-[1500px]:h-30'} rounded-sm overflow-hidden relative shrink-0 shadow-xs bg-transparent ${className}`}>
      {/* Left Discount Vertical Tab (No border around it) */}
      <div
        className={`${isMini ? 'w-[32px] md:w-[38px]' : 'w-[40px]'} ${isBankOffer ? '' : 'bg-[#5C3E35]'} flex items-center justify-center relative shrink-0 rounded-l-sm`}
        style={isBankOffer ? { background: theme.accent } : undefined}
      >
        {/* Left Ticket Cutout/Notch (clean bite, no border) */}
        <div className={`absolute ${isMini ? '-left-[5px] w-2.5 h-2.5 md:-left-[6px] md:w-3.5 md:h-3.5' : '-left-[7px] w-3.5 h-3.5'} bg-[#FFF8F6] rounded-full z-20 top-1/2 -translate-y-1/2`} />

        <span
          className={`font-figtree font-semibold ${isMini ? 'text-[9px] md:text-[11px] tracking-wider' : 'text-[0.75rem] sm:text-[0.875rem] tracking-widest'} leading-[1.4] text-white uppercase [writing-mode:vertical-lr] rotate-180 align-middle whitespace-nowrap`}
        >
          {isBankOffer ? "BANK OFFER" : "DISCOUNT"}
        </span>
      </div>

      {/* Vertical Dashed Divider */}
      <div
        className="border-l border-dashed border-[#FBE3DC] h-full z-10"
        style={isBankOffer ? { borderColor: theme.tileBorder } : undefined}
      />

      {/* Right Content Area (With border on top, right, bottom) */}
      <div
        className={`flex-1 ${isMini ? 'p-2 md:p-3' : 'p-3'} flex flex-col justify-between min-w-0 ${isBankOffer ? '' : 'bg-white'} rounded-r-sm border-y border-r border-[#FBE3DC] relative ${isDimmed ? 'opacity-55' : ''}`}
        style={isBankOffer ? { background: theme.background, borderColor: theme.border } : undefined}
      >
        {/* Top Info & Vertical Capsule Logo */}
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0">
            <h4
              className={`${isMini ? 'text-[0.8rem] md:text-[0.95rem] font-semibold' : 'text-[1rem] sm:text-[1.1rem] font-semibold'} text-[#4E3629] tracking-normal mt-0.5 leading-[1.4] font-figtree`}
            >
              {isBankOffer ? (
                <>Additional <span style={{ color: theme.accent }}>{bankAmountLabel}</span> Off</>
              ) : (
                coupon.title
              )}
            </h4>
            <span
              className={`${isMini ? 'text-[0.625rem] md:text-[0.725rem] font-normal md:font-medium' : 'text-[0.7rem] sm:text-[0.75rem] font-medium'} text-black block truncate mt-[2px] font-figtree leading-[1.4] tracking-normal`}
            >
              {isBankOffer ? `On ${OFFER_CATEGORY_LABEL[category]}` : coupon.condition}
            </span>
          </div>

          {/* Vertical Capsule Logo — the metal stands in for it on a bank offer,
              so the card says which half of the cart it covers at a glance. */}
          {isBankOffer ? (
            <span
              className={`${isMini ? 'w-[24px] h-[24px] md:w-[28px] md:h-[28px]' : 'w-[30px] h-[30px]'} shrink-0 mt-0.5 flex items-center justify-center rounded-[5px]`}
              style={{ background: theme.tileBg, border: `1px solid ${theme.tileBorder}` }}
            >
              <OfferCategoryIcon category={category} className={isMini ? "w-3.5 h-3.5 md:w-4 md:h-4" : "w-[18px] h-[18px]"} />
            </span>
          ) : (
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/lucira-logo-small.png?v=1782455718"
              alt="Lucira Logo"
              className={`${isMini ? 'w-[18px] h-[28px] md:w-[22px] md:h-[32px]' : 'w-[24px] h-[36px]'} object-contain shrink-0 mt-0.5`}
            />
          )}
        </div>

        {/* Action Button Box — copy on the PDP, apply in the cart */}
        {mode === "apply" ? (
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.dataLayer && !isApplied) {
                window.dataLayer.push({
                  event: "promoClick",
                  promoClick: {
                    creative_name: `coupon applied - ${coupon.code}`,
                    location_id: "cart page",
                    promo_id: coupon.code,
                    promo_name: (user?.mobile || user?.phone) ? String(user.mobile || user.phone).replace(/\D/g, "").slice(-10) : "",
                  },
                });
              }
              isApplied ? onRemove?.(coupon.code) : onApply?.(coupon.code);
            }}
            disabled={isOutOfTier || isBlockedByOther || !!applyingCode || disabled}
            title={
              disabled
                ? "Not available while Free Silver Bracelet is claimed"
                : isOutOfTier
                ? `Not applicable — ${coupon.condition}`
                : isBlockedByOther
                  ? "Remove the applied coupon to use this one"
                  : undefined
            }
            className={`w-full ${isMini ? 'h-7 md:h-8 text-[0.75rem] md:text-[0.85rem] px-[8px] md:px-[12px]' : 'h-8 text-[0.875rem] px-[12px]'} flex items-center justify-center gap-1.5 rounded-sm border transition-all font-semibold uppercase tracking-normal font-figtree leading-[1.4] disabled:cursor-not-allowed ${
              isApplied
                ? "bg-emerald-50/50 border-emerald-200 text-emerald-600 cursor-pointer hover:bg-emerald-50"
                : "bg-white border-[#EBEBEB] text-[#1A1A1A] hover:bg-[#FFF8F6] hover:border-[#FBE3DC] cursor-pointer"
            }`}
          >
            {isApplied ? (
              <>
                <span className="lowercase first-letter:uppercase">applied</span>
                <CheckCircle className={`${isMini ? 'w-2.5 h-2.5 md:w-3.5 md:h-3.5' : 'w-3.5 h-3.5'} text-emerald-600 animate-scale-in shrink-0`} />
              </>
            ) : isApplying ? (
              <Loader2 className={`${isMini ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin text-[#5C3E35]`} />
            ) : disabled ? (
              <span className="normal-case">Not Available</span>
            ) : isOutOfTier ? (
              <span className="normal-case">Not Applicable</span>
            ) : (
              <>
                <span className="normal-case">Apply Coupon Code</span>
                <Tag className={`${isMini ? 'w-2.5 h-2.5 md:w-3 md:h-3' : 'w-3 h-3'} text-[#5C3E35] ml-1 shrink-0`} />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.dataLayer) {
                window.dataLayer.push({
                  event: "promoClick",
                  couponCode: coupon.code,
                });
              }
              onCopy?.(coupon.code);
            }}
            className={`w-full ${isMini ? 'h-7 md:h-8 text-[0.75rem] md:text-[0.85rem] px-[8px] md:px-[12px]' : 'h-8 text-[0.875rem] px-[12px]'} flex items-center justify-center gap-1.5 rounded-sm border transition-all cursor-pointer font-semibold uppercase tracking-normal font-figtree leading-[1.4] ${
              isCopied
                ? "bg-emerald-50/50 border-emerald-200 text-emerald-600"
                : "bg-white border-[#EBEBEB] text-[#1A1A1A] hover:bg-[#FFF8F6] hover:border-[#FBE3DC]"
            }`}
          >
            {isCopied ? (
              <>
                <span className="lowercase first-letter:uppercase">copied</span>
                <CheckCircle className={`${isMini ? 'w-2.5 h-2.5 md:w-3.5 md:h-3.5' : 'w-3.5 h-3.5'} text-emerald-600 animate-scale-in shrink-0`} />
              </>
            ) : (
              <>
                <span className="normal-case">Copy Coupon Code</span>
                <Copy className={`${isMini ? 'w-2.5 h-2.5 md:w-3 md:h-3' : 'w-3 h-3'} text-[#5C3E35] ml-1 shrink-0`} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
