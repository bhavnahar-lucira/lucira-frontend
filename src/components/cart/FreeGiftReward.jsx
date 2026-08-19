"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Lock, Gift, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { pushPromoClick } from "@/lib/gtm";
import { FREE_GIFTS, isFreeGiftVariant, getApplicableFreeGift, getNextFreeGift } from "@/lib/freeGifts";

/**
 * Cart free-gift-with-purchase widget — sits directly beneath the "Apply
 * Coupon" trigger and reproduces its locked / login / claim / remove states.
 * Driven entirely by lib/freeGifts.js, so a new tier or a swapped gift
 * product is a config edit, not a change here.
 *
 * "Claimed" is derived purely from whether the gift's line item is actually
 * in the cart (never a separately-persisted flag), so it can't drift out of
 * sync across login/logout — logging out clears the cart itself, and the
 * next login re-derives this from whatever the fetched cart contains.
 *
 * @param {number} diamondTotal - the qualifying (diamond-only, plain-gold
 *   excluded) cart value, computed by the caller — same value the coupon
 *   ladder uses.
 */
export default function FreeGiftReward({ diamondTotal }) {
  const { items, appliedCoupon, addToCart, removeFromCart, removeCoupon, loading } = useCart();
  const user = useSelector((state) => state.user.user);
  const { openLogin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // {enabled, threshold} live server-side (settings collection, same doc the
  // backend's add-time and checkout-time checks read) so either can be tuned
  // without a redeploy — mirrors how GoldCoinOption pulls its own threshold
  // from /api/settings/gold-coin. Falls back to the static FREE_GIFTS config
  // until this resolves (or if it fails), so the widget never flashes locked.
  const [remoteConfig, setRemoteConfig] = useState(null);

  useEffect(() => {
    apiFetch("/api/settings/silver-bracelet", { suppressErrorLog: true })
      .then((data) => {
        setRemoteConfig({
          enabled: data?.enabled ?? true,
          threshold: Number(data?.threshold) || FREE_GIFTS[0]?.threshold,
        });
      })
      .catch((err) => console.error("Error fetching silver bracelet setting:", err));
  }, []);

  // Only one tier is configured today, so applying the one remote threshold
  // to every FREE_GIFTS entry is safe. A second tier would need its own
  // settings key and its own merge here rather than sharing this one.
  const effectiveGifts = useMemo(() => {
    if (!remoteConfig) return FREE_GIFTS;
    return FREE_GIFTS.map((g) => ({ ...g, threshold: remoteConfig.threshold }));
  }, [remoteConfig]);

  const appliedItem = items.find((item) => isFreeGiftVariant(item.variantId));
  const gift = getApplicableFreeGift(diamondTotal, effectiveGifts);
  const nextGift = getNextFreeGift(diamondTotal, effectiveGifts);

  const isLocked = !gift;
  const needsLogin = !!gift && !user;
  const isApplied = !!appliedItem;

  // A claimed gift doesn't survive the qualifying total dropping back below
  // its threshold (items removed, coupon applied to a restricted subtotal,
  // etc), or the shopper no longer being logged in — claiming requires a
  // user, so a gift line sitting in a guest cart (left over from a prior
  // login's cart merging back into a guest session, or similar) is an
  // invalid state, not a legitimately-held claim.
  useEffect(() => {
    if (appliedItem && (!gift || !user)) {
      removeFromCart(appliedItem.lineId || appliedItem.variantId);
    }
  }, [appliedItem, gift, user, removeFromCart]);

  // The gift and a coupon can't both apply. Claiming removes an active
  // coupon (see handleToggle) — this is the safety net for a coupon landing
  // afterwards (e.g. re-applied from the drawer).
  useEffect(() => {
    if (appliedCoupon && appliedItem && !isProcessing) {
      removeFromCart(appliedItem.lineId || appliedItem.variantId);
      toast.info(`${appliedItem.title || "Free gift"} removed as it cannot be combined with a coupon.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCoupon, appliedItem, isProcessing]);

  // Nothing to show: either nothing's configured/eligible/locked/applied, or
  // the promotion was switched off server-side (an already-claimed line from
  // before it was switched off still renders, so the shopper can remove it
  // rather than have it silently vanish).
  if (!gift && !nextGift && !isApplied) return null;
  if (remoteConfig && !remoteConfig.enabled && !isApplied) return null;

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const firstVariantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
      try {
        pushPromoClick({
          creative_name: isApplied ? "remove free gift - cart" : "claim free gift - cart",
          promo_id: (gift || appliedItem)?.variantId,
          item_id: firstVariantId || (gift || appliedItem)?.variantId,
          promo_position: "Cart Page",
        });
      } catch (e) {
        console.error("promoClick push failed", e);
      }

      if (isApplied) {
        await removeFromCart(appliedItem.lineId || appliedItem.variantId);
        toast.info(`${appliedItem.title || "Free gift"} removed from your order.`);
      } else if (gift) {
        if (appliedCoupon) {
          removeCoupon();
          toast.info("Coupon removed as the free gift offer cannot be combined with coupons.");
        }
        await addToCart({
          productId: gift.productId,
          variantId: gift.variantId,
          title: `Free ${gift.title}`,
          image: gift.image,
          price: 0,
          originalPrice: gift.worthValue,
          comparePrice: gift.worthValue,
          quantity: 1,
          variantTitle: "Free Gift",
          inStock: true,
          isFreeGift: true,
        });
        toast.success(`Free ${gift.title} has been added to your order!`);
      }
    } catch (e) {
      console.error("Error updating free gift reward:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`flex w-full items-center gap-2.5 sm:gap-3 border border-[#EADFD8] shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] transition-colors pr-2.5 sm:pr-3.5 ${isLocked ? "opacity-80" : ""}`}
      style={{
        borderRadius: "0px 0px 8px 8px",
        borderTop: "0px",
        background: isLocked ? "#FEF9F6" : "linear-gradient(89.31deg, rgb(254, 245, 241) 0%, rgb(241, 228, 209) 100%)",
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 10,
        gap: 10,
      }}
    >
      <div
        className={`w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] overflow-hidden shrink-0 ${isLocked ? "bg-[#f5f0ed]" : ""} flex items-center justify-center`}
        style={{ border: 0 }}
      >
        <img
          src={(isLocked ? nextGift : gift)?.image}
          alt={(isLocked ? nextGift : gift)?.title || "Free Gift"}
          className={`w-full h-full object-cover ${isLocked ? "mix-blend-multiply opacity-60" : ""}`}
          style={{ border: 0 }}
        />
      </div>
      <div className="min-w-0 flex-1 text-left py-1 sm:py-0">
        <p
          className={`font-figtree text-xs lg:text-[0.9rem] leading-[1.35] ${isLocked ? "text-[#6B5B54]" : "text-[#000000]"}`}
          style={{ color: isLocked ? "#6B5B54" : "rgb(0, 0, 0)", fontWeight: 500 }}
        >
          {isLocked ? (
            <>Add <span className="font-bold text-[#e7000b]">₹{Math.max(0, nextGift.threshold - diamondTotal).toLocaleString("en-IN")}</span> more to unlock a FREE {nextGift.title} worth {nextGift.worthLabel}.</>
          ) : needsLogin ? (
            <>Unlock to claim a FREE {gift.title} worth {gift.worthLabel}.</>
          ) : (
            <>You&apos;ve unlocked a FREE {gift.title} worth {gift.worthLabel}.</>
          )}
        </p>
      </div>
      {isLocked ? (
        <button
          type="button"
          disabled
          className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-3 sm:px-4 lg:px-6 font-figtree font-medium text-[12px] sm:text-[12px] lg:text-[14px] bg-[#EBEBEB] text-[#888888] cursor-not-allowed ml-0 lg:ml-[20px]"
        >
          <Lock className="w-3.5 h-3.5 hidden lg:block" />
          LOCKED
        </button>
      ) : needsLogin ? (
        <button
          type="button"
          onClick={() => openLogin()}
          className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-3 sm:px-4 lg:px-6 font-figtree font-medium text-[12px] sm:text-[12px] lg:text-[14px] bg-[#5A413F] text-white hover:bg-[#4A312F] cursor-pointer ml-0 lg:ml-[20px]"
        >
          <Lock className="w-3.5 h-3.5 hidden lg:block" />
          UNLOCK
        </button>
      ) : isApplied ? (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isProcessing || loading}
          className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-2.5 sm:px-4 lg:px-6 font-figtree font-medium text-[10px] sm:text-[11px] lg:text-[13px] hover:bg-[#e7000b]/10 cursor-pointer disabled:opacity-50 ml-0 lg:ml-[20px]"
          style={{
            border: "1px solid #e7000b",
            background: "transparent",
            color: "#e7000b",
          }}
        >
          {isProcessing ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : "REMOVE"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isProcessing || loading}
          className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-3 sm:px-4 lg:px-6 font-figtree font-medium text-[12px] sm:text-[12px] lg:text-[14px] bg-[#5A413F] text-white hover:bg-[#4A312F] cursor-pointer disabled:opacity-50 ml-0 lg:ml-[20px]"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
          ) : (
            <>
              <Gift className="w-3.5 h-3.5 hidden lg:block" />
              CLAIM
            </>
          )}
        </button>
      )}
    </div>
  );
}
