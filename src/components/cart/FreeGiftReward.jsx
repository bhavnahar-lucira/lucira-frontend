"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Lock, Gift, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { pushPromoClick } from "@/lib/gtm";
import { 
  FREE_GIFTS, 
  isFreeGiftVariant, 
  isFreeGiftItem,
  getApplicableFreeGift, 
  getNextFreeGift, 
  getNextGiftMilestone,
  getEligibleGiftQuantity,
  mapRemoteFreeGiftTiers, 
  isTierLive,
  cleanId,
  setCachedFreeGiftTiers
} from "@/lib/freeGifts";
import { setGiftTiersConfig } from "@/redux/features/cart/cartSlice";
import NoImageIcon from "@/components/common/RewardBadgeIcon";

/**
 * Cart free-gift-with-purchase widget — sits directly beneath the "Apply
 * Coupon" trigger and reproduces its locked / login / claim / remove states.
 * Driven entirely by dashboard settings via lib/freeGifts.js.
 *
 * @param {number} diamondTotal - the qualifying (diamond-only, plain-gold
 *   excluded) cart value, computed by the caller — same value the coupon
 *   ladder uses.
 */
export default function FreeGiftReward({ diamondTotal }) {
  const dispatch = useDispatch();
  const { items, appliedCoupon, addToCart, removeFromCart, updateCartItem, removeCoupon, loading } = useCart();
  const user = useSelector((state) => state.user.user);
  const { openLogin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const giftTiersConfig = useSelector(state => state.cart.giftTiersConfig);
  const [fetchedConfig, setFetchedConfig] = useState(null);

  useEffect(() => {
    if (giftTiersConfig) return;

    apiFetch("/api/settings/silver-bracelet", { suppressErrorLog: true })
      .then((data) => {
        setFetchedConfig({
          enabled: data?.enabled ?? true,
          tiers: mapRemoteFreeGiftTiers(data?.tiers),
        });
        if (data?.tiers) {
          setCachedFreeGiftTiers(data.tiers);
          dispatch(setGiftTiersConfig(data));
        }
      })
      .catch((err) => console.error("Error fetching silver bracelet setting:", err));
  }, [giftTiersConfig, dispatch]);

  const remoteConfig = useMemo(() => {
    return giftTiersConfig
      ? {
          enabled: giftTiersConfig.enabled ?? true,
          tiers: mapRemoteFreeGiftTiers(giftTiersConfig.tiers),
        }
      : fetchedConfig;
  }, [giftTiersConfig, fetchedConfig]);

  // All configured tiers, enabled or not
  const effectiveGifts = useMemo(() => {
    if (!remoteConfig) return FREE_GIFTS;
    return remoteConfig.tiers;
  }, [remoteConfig]);

  useEffect(() => {
    if (effectiveGifts && effectiveGifts.length > 0) {
      setCachedFreeGiftTiers(effectiveGifts);
    }
  }, [effectiveGifts]);

  // Only enabled, currently-scheduled tiers count toward what a shopper can unlock
  const activeGifts = useMemo(
    () => effectiveGifts.filter((g) => g.enabled !== false && isTierLive(g)),
    [effectiveGifts]
  );

  const appliedItem = (items || []).find((item) => {
    if (!isFreeGiftItem(item, effectiveGifts)) return false;
    const v = cleanId(item.variantId);
    return effectiveGifts.some((g) => {
      const target = cleanId(g.variantId);
      return v === target || v.includes(target) || target.includes(v);
    });
  });

  const appliedTier = appliedItem
    ? effectiveGifts.find((g) => {
        const target = cleanId(g.variantId);
        const v = cleanId(appliedItem.variantId);
        return v === target || v.includes(target) || target.includes(v);
      })
    : null;

  const gift = getApplicableFreeGift(diamondTotal, activeGifts);
  const nextGift = getNextFreeGift(diamondTotal, activeGifts);
  const isApplied = !!appliedItem;
  const displayGift = isApplied ? appliedTier : gift;

  const isLocked = !displayGift;
  const needsLogin = !isApplied && !!gift && !user;

  const appliedTierStillValid =
    !!appliedTier && appliedTier.enabled !== false && isTierLive(appliedTier) && diamondTotal >= appliedTier.threshold;

  // Cleanup any orphan / stale free gift items that do not belong to the valid applied tier
  useEffect(() => {
    if (isProcessing) return;
    const staleItems = (items || []).filter((item) => {
      if (!isFreeGiftItem(item, effectiveGifts)) return false;
      // If user not logged in or threshold not met or appliedTier invalid, ALL free gifts must be removed
      if (!appliedTierStillValid || !user || !appliedTier) return true;
      // If this item is not the currently valid applied tier variant, it's an orphan from an old/different tier
      const v = cleanId(item.variantId);
      const target = cleanId(appliedTier.variantId);
      return v !== target && !v.includes(target) && !target.includes(v);
    });

    if (staleItems.length > 0) {
      staleItems.forEach((stale) => {
        removeFromCart(stale.lineId || stale.variantId);
      });
    }
  }, [items, appliedTierStillValid, user, appliedTier, isProcessing, removeFromCart, effectiveGifts]);

  // Auto-sync gift quantity when diamondTotal changes and tier scales with spend
  useEffect(() => {
    if (!appliedItem || !appliedTier || !appliedTier.scaleQuantityWithSpend || isProcessing) return;
    const targetQty = getEligibleGiftQuantity(diamondTotal, appliedTier);
    if (targetQty > 0 && targetQty !== Number(appliedItem.quantity || 1)) {
      updateCartItem({
        lineId: appliedItem.lineId,
        variantId: appliedItem.variantId,
        quantity: targetQty,
      });
    }
  }, [diamondTotal, appliedItem, appliedTier, isProcessing, updateCartItem]);

  // Remove gift if a non-combinable coupon is applied
  useEffect(() => {
    if (appliedCoupon && appliedItem && !appliedTier?.combineCoupons && !isProcessing) {
      removeFromCart(appliedItem.lineId || appliedItem.variantId);
      toast.info(`${appliedItem.title || "Free gift"} removed as it cannot be combined with a coupon.`);
    }
  }, [appliedCoupon, appliedItem, appliedTier, isProcessing, removeFromCart]);

  const hasFreeGift = gift || nextGift || isApplied;
  const isFreeGiftEnabled = remoteConfig && remoteConfig.enabled;
  const showFreeGiftBanner = isFreeGiftEnabled || isApplied;

  const nextMilestone = getNextGiftMilestone(diamondTotal, activeGifts, displayGift);
  const eligibleQty = displayGift ? getEligibleGiftQuantity(diamondTotal, displayGift) : 0;

  if (!hasFreeGift || !showFreeGiftBanner) return null;

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const firstVariantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
      try {
        pushPromoClick({
          creative_name: isApplied ? "remove free gift - cart" : "claim free gift - cart",
          promo_id: (isApplied ? appliedItem : gift)?.variantId,
          item_id: firstVariantId || (isApplied ? appliedItem : gift)?.variantId,
          promo_position: "Cart Page",
        });
      } catch (e) {
        console.error("promoClick push failed", e);
      }

      if (isApplied) {
        await removeFromCart(appliedItem.lineId || appliedItem.variantId);
        toast.info(`${appliedItem.title || "Free gift"} removed from your order.`);
      } else if (gift) {
        if (appliedCoupon && !gift.combineCoupons) {
          removeCoupon();
          toast.info("Coupon removed as the free gift offer cannot be combined with coupons.");
        }
        const claimQty = getEligibleGiftQuantity(diamondTotal, gift);
        await addToCart({
          productId: gift.productId,
          variantId: gift.variantId,
          title: `Free ${gift.title}`,
          image: gift.image,
          price: 0,
          originalPrice: gift.worthValue,
          comparePrice: gift.worthValue,
          quantity: claimQty,
          variantTitle: "Free Gift",
          inStock: true,
          isFreeGift: true,
          properties: {
            _is_free_gift: "true",
            is_free_gift: "true",
          },
        });
        toast.success(`Free ${gift.title}${claimQty > 1 ? ` (${claimQty})` : ""} has been added to your order!`);
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
        gap: 16,
      }}
    >
      <div
        className={`w-[40px] h-[40px] sm:w-[40px] sm:h-[40px] overflow-hidden shrink-0 ${isLocked ? "bg-[#f5f0ed]" : ""} flex items-center justify-center`}
        style={{ border: 0 }}
      >
        {(() => {
          const imgSrc = (isLocked ? nextGift : displayGift)?.bannerImage || (isLocked ? nextGift : displayGift)?.image;
          if (!imgSrc) return <NoImageIcon className={isLocked ? "opacity-60" : ""} />;
          return (
            <img
              src={imgSrc}
              alt={(isLocked ? nextGift : displayGift)?.title || "Free Gift"}
              className={`w-full h-full object-cover ${isLocked ? "mix-blend-multiply opacity-60" : ""}`}
              style={{ border: 0 }}
            />
          );
        })()}
      </div>
      <div className="min-w-0 flex-1 text-left py-1 sm:py-0">
        <p
          className={`font-figtree text-xs lg:text-[0.9rem] leading-[1.35] ${isLocked ? "text-[#6B5B54]" : "text-[#000000]"}`}
          style={{ color: isLocked ? "#6B5B54" : "rgb(0, 0, 0)", fontWeight: 500 }}
        >
          {isLocked ? (
            <>Add <span className="font-bold text-[#e7000b]">₹{Math.max(0, nextGift.threshold - diamondTotal).toLocaleString("en-IN")}</span> more to unlock a FREE {nextGift.title}.</>
          ) : needsLogin ? (
            gift.bannerText ? (
              <>{gift.bannerText.replace(/\s*worth\s*₹?\s*[\d,]+/gi, "").trim()}</>
            ) : (
              <>Unlock to claim a FREE {gift.title}{eligibleQty > 1 ? ` (${eligibleQty} items)` : ""}.</>
            )
          ) : (
            displayGift.bannerText ? (
              <>{displayGift.bannerText.replace(/\s*worth\s*₹?\s*[\d,]+/gi, "").trim()}</>
            ) : (
              <>
                You&apos;ve unlocked {eligibleQty > 1 ? `${eligibleQty}x ` : "a "}FREE {displayGift.title}.
                {nextMilestone?.isMultiplier && (
                  <> Add <span className="font-bold text-[#e7000b]">₹{nextMilestone.remaining.toLocaleString("en-IN")}</span> more to get {nextMilestone.targetQuantity}x FREE {displayGift.title}!</>
                )}
              </>
            )
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
          onClick={() => openLogin({
            useCheckoutAuth: true,
            overrideHeading: "Sign Up To Unlock Free Gift",
            overrideSubtext: "",
            overrideButtonText: "CONTINUE",
          })}
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
