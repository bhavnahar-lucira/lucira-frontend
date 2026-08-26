"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Tag, Phone, MessageSquare, Gift, Truck, MessageCircle, ChevronRight, X, Loader2, CircleChevronRight, Check, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { pushPromoClick, getNumericId } from "@/lib/gtm";
import { useAuth } from "@/hooks/useAuth";
import InsuranceOption from "./InsuranceOption";

import { useCart } from "@/hooks/useCart";
import { applyCoupon, addCoupon, removeCoupon, removePoints } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import { trackCheckout as trackSearchCheckout } from "@/lib/searchAnalytics";
import CartContact from "./CartContact";
import CouponDrawer from "@/components/coupons/CouponDrawer";
import CouponCard from "@/components/coupons/CouponCard";
import OfferCategoryIcon, { getOfferTheme } from "@/components/coupons/offerCategoryTheme";
import { COUPONS, COUPON_DISCLAIMER, getApplicableCouponCode, getApplicableCouponCodes, calculateCouponDiscount, getOfferCategory, getCategoryBase, getItemOfferCategory, canCombineOffers, OFFER_CATEGORY, OFFER_CATEGORY_LABEL } from "@/lib/coupons";
import { apiFetch } from "@/lib/api";
import TrustBadges from "@/components/common/TrustBadges";
import Image from "next/image";
import FreeGiftReward from "./FreeGiftReward";
import FeaturedOfferBanner, { selectFeaturedOffers } from "./FeaturedOfferBanner";
import { FREE_GIFTS, isFreeGiftVariant } from "@/lib/freeGifts";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";

export default function CartSummary({ onPlaceOrder, breakdownRef = null }) {
  const dispatch = useDispatch();
  // One drawer serves both breakpoints — it slides in from the right on desktop
  // and up from the bottom on mobile, so the old Dialog/Sheet pair is gone.
  const [isCouponDrawerOpen, setIsCouponDrawerOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applyingCode, setApplyingCode] = useState(null);
  const [dynamicCoupons, setDynamicCoupons] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/cart/coupons/active", { suppressErrorLog: true })
      .then(res => {
        if (!cancelled && res?.coupons) {
          setDynamicCoupons(res.coupons);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  // Which listed coupon is mid-apply, so only that card shows a spinner.
  
  const { items, totalAmount, totalQuantity, appliedCoupon, appliedCoupons, updateCartItem, removeFromCart, removeMultipleFromCart, addToCart, loading, nectorPoints, activeDiscounts, claimDiscount, unclaimDiscount } = useCart();
  const user = useSelector((state) => state.user.user);
  const { openLogin } = useAuth();


  const otherItemsQuantity = (() => {
    let qty = 0;
    const byjGroups = new Set();
    items
      .filter(item =>
        item.variantId !== INSURANCE_VARIANT_ID &&
        !item.isFreeGift &&
        !isFreeGiftVariant(item.variantId)
      )
      .forEach(item => {
        const byjGroupId = item.properties?.['_byj_group_id'];
        if (byjGroupId) {
          if (!byjGroups.has(byjGroupId)) {
            byjGroups.add(byjGroupId);
            qty += Number(item.quantity || item.qty || 1);
          }
        } else {
          qty += Number(item.quantity || item.qty || 1);
        }
      });
    return qty;
  })();

  // Every line a discount could land on. Insurance and free gifts are neither
  // discountable nor part of any offer's base, so they never count.
  const productTotal = items
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !item.isFreeGift &&
      !isFreeGiftVariant(item.variantId)
    )
    .reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || item.qty || 1), 0);

  // Split by metal in one pass. The live offer structure prices the two
  // categories differently (additional 5% on diamond, 2% on plain gold) and
  // forbids stacking them, so each rule has to be weighed against its own
  // half of the cart — see FeaturedOfferBanner. `goldTotal` is "everything
  // eligible that isn't diamond", which in this catalogue is plain gold.
  const { diamondTotal, goldTotal } = items
    .filter(item => {
      const isBYJ = Boolean(
        item.properties?.['_byj_group_id'] || 
        item.properties?.['_byj_preview'] || 
        item.properties?.['_byj_parent'] || 
        item.properties?.[' _byj_parent'] || 
        item.tags?.includes('BYJ') || 
        String(item.handle || "").toLowerCase().includes('byj') || 
        String(item.title || "").toLowerCase().includes('byj')
      );
      return item.variantId !== INSURANCE_VARIANT_ID &&
        !item.isFreeGift &&
        !isFreeGiftVariant(item.variantId) &&
        !isBYJ;
    })
    .reduce((acc, item) => {
        const lineTotal = Number(item.price) * Number(item.quantity || item.qty || 1);
        if (getItemOfferCategory(item) === OFFER_CATEGORY.DIAMOND) {
            return { ...acc, diamondTotal: acc.diamondTotal + lineTotal };
        }
        return { ...acc, goldTotal: acc.goldTotal + lineTotal };
    }, { diamondTotal: 0, goldTotal: 0 });

  // Bundled once so the combine rule and the featured banner are always
  // measured against the same numbers.
  const offerTotals = { diamondTotal, goldTotal, productTotal };

  // Applied coupons come back from redux-persist, so a stored entry can
  // predate a dashboard toggle — or a field we only started saving later.
  // Re-read the stacking flags from the live coupon list before deciding
  // anything, so the decision never rests on a stale snapshot.
  const hydratedAppliedCoupons = (appliedCoupons || []).map((c) => {
    const live = (dynamicCoupons || []).find(
      (d) => String(d.code).toUpperCase() === String(c?.code || "").toUpperCase()
    );
    return live
      ? {
          ...c,
          combineCoupons: !!live.combineCoupons,
          coinsApplicable: !!live.coinsApplicable,
          minAmount: live.minAmount,
          discountType: live.discountType,
          discountValue: live.discountValue,
        }
      : c;
  });

  const insuranceItem = items.find(item => item.variantId === INSURANCE_VARIANT_ID);
  const insuranceAmount = insuranceItem ? insuranceItem.price * (Number(insuranceItem.quantity || insuranceItem.qty || 1)) : 0;
  // Claiming requires a logged-in user, so a gift line without one is an
  // invalid leftover state (FreeGiftReward's own effect removes it), not a
  // legitimate claim — don't reflect it as applied here in the meantime.
  const appliedGiftItem = user ? items.find(item => item.isFreeGift || isFreeGiftVariant(item.variantId)) : null;

  const firstProductName = items.find(item =>
    item.variantId !== INSURANCE_VARIANT_ID &&
    !item.isFreeGift &&
    !isFreeGiftVariant(item.variantId)
  )?.title;

  // Auto-sync insurance and gold coin quantities
  useEffect(() => {
    // Sync Insurance
    if (insuranceItem) {
      const currentInsQty = Number(insuranceItem.quantity || insuranceItem.qty || 0);
      if (otherItemsQuantity <= 0) {
        const insuranceItems = items.filter(i => i.variantId === INSURANCE_VARIANT_ID);
        if (insuranceItems.length > 1) {
          const lineIds = insuranceItems.map(i => i.lineId).filter(Boolean);
          const variantIds = insuranceItems.map(i => i.variantId).filter(Boolean);
          removeMultipleFromCart({ lineIds, variantIds });
        } else {
          removeFromCart(insuranceItems[0]?.lineId || INSURANCE_VARIANT_ID);
        }
      } else if (currentInsQty !== otherItemsQuantity) {
        updateCartItem({
          currentVariantId: INSURANCE_VARIANT_ID,
          quantity: otherItemsQuantity
        });
      }
    }

  }, [otherItemsQuantity, insuranceItem?.quantity, insuranceItem?.qty, updateCartItem, removeFromCart]);

  const couponDetails = (appliedCoupon && typeof appliedCoupon === 'object') 
    ? appliedCoupon 
    : { code: appliedCoupon || "", summary: "Applied", value: 0, valueType: "FIXED_AMOUNT" };

  const hasCoupon = !!appliedCoupon;
  const currentCouponCode = couponDetails?.code;

  // Re-validate coupon when items change
  useEffect(() => {
    if (hasCoupon && items.length === 0) {
      dispatch(removeCoupon());
      return;
    }

    if (hasCoupon && items.length > 0 && currentCouponCode) {
        // Clearing the timer is not enough: once the request is in flight, its
        // resolution would re-dispatch applyCoupon and resurrect a coupon the
        // user just removed — which is why removing used to take several taps.
        let cancelled = false;

        const validateCurrentCoupon = async () => {
          try {
            const data = await apiFetch("/api/cart/coupon/validate", {
              method: "POST",
              body: JSON.stringify({
                items,
                couponCode: currentCouponCode,
                customerEmail: user?.email
              }),
              suppressErrorLog: true
            });
            if (cancelled) return;
            // A product-restricted coupon with nothing eligible left in the cart
            // must be dropped, not allowed to discount the whole cart.
            if (data.restricted && !data.applicableItemIds?.length) {
              dispatch(removeCoupon());
              return;
            }
            dispatch(applyCoupon({
              code: data.code,
              summary: data.summary,
              value: data.value,
              valueType: data.valueType,
              restricted: data.restricted,
              applicableItemIds: data.applicableItemIds
            }));
          } catch (err) {
          if (cancelled) return;
          dispatch(removeCoupon());
          toast.error("Coupon removed: items in cart are no longer eligible.", {
            icon: <Check className="w-4 h-4" />
          });
        }
      };
      const timer = setTimeout(validateCurrentCoupon, 500);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [items, hasCoupon, currentCouponCode, user?.email, dispatch]);

  // Sum of original prices (comparePrice if it is greater than price, otherwise price)
  const originalSubtotal = items
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !item.isFreeGift &&
      !isFreeGiftVariant(item.variantId)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      const originalPrice = compare > price ? compare : price;
      return acc + (originalPrice * qty);
    }, 0);

  // Total savings = sum of (original price - selling price) across all real cart products
  const totalSavings = items
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !item.isFreeGift &&
      !isFreeGiftVariant(item.variantId)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      return acc + (compare > price ? (compare - price) * qty : 0);
    }, 0);


  const subtotal = otherItemsQuantity > 0 ? (totalAmount - insuranceAmount) : 0;

  const couponDiscountAmount = calculateCouponDiscount(appliedCoupons?.length ? appliedCoupons : appliedCoupon, items, subtotal);

  const discount = couponDiscountAmount;
  const shipping = 0;
  const grandTotal = subtotal + insuranceAmount - discount + shipping;

  // Shipping is always free; this is the standard rate we display as struck-through
  // to make that saving visible, and it feeds into the "you will save" banner below.
  const SHIPPING_ORIGINAL_VALUE = 500;
  const totalSavingsBanner = totalSavings + couponDiscountAmount + SHIPPING_ORIGINAL_VALUE;

  // codeOverride is passed when a listed coupon card is tapped; otherwise the
  // code typed into the drawer's input is used.
  const handleApplyCoupon = async (codeOverride) => {
    const code = (codeOverride ?? couponCode).trim();
    if (!code) return;
    if (items.some(item => item.isFreeGift || isFreeGiftVariant(item.variantId))) {
      toast.error("Coupons cannot be applied while a free gift is claimed. Please remove it first.");
      return;
    }

    // Drawer-listed "automatic" Product Discounts rules have no real Shopify
    // code — they're claim-gated (see /api/cart/discount/claim), not
    // something to submit through coupon/validate. A customer typing one in
    // (or clicking its card) would otherwise always get "invalid code" back,
    // since Shopify has no code to look up for an automatic discount.
    const dynamicMatch = dynamicCoupons?.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (dynamicMatch?.method === "automatic") {
      setIsApplying(true);
      if (codeOverride) setApplyingCode(code);
      try {
        await claimDiscount(dynamicMatch.id, { coinsApplicable: !!dynamicMatch.coinsApplicable });
        toast.success("Coupon applied!");
        setIsCouponDrawerOpen(false);
        setCouponCode("");
      } catch (err) {
        // claimDiscount already shows its own error toast — nothing more to do.
      } finally {
        setIsApplying(false);
        setApplyingCode(null);
      }
      return;
    }

    setIsApplying(true);
    if (codeOverride) setApplyingCode(code);
    try {
      const data = await apiFetch("/api/cart/coupon/validate", {
        method: "POST",
        body: JSON.stringify({
          items,
          couponCode: code,
          customerEmail: user?.email
        }),
        suppressErrorLog: true
      });
      // A product-restricted coupon with nothing eligible in the cart must be
      // blocked, not allowed to discount the whole cart.
      if (data.restricted && !data.applicableItemIds?.length) {
        toast.error('This coupon is not applicable to the items in your cart.');
        return;
      }
      // Staff can mark a discount "Lucira Coins applicable", in which case
      // redeemed coins stay put instead of being cleared on apply.
      const coinsApplicable = !!dynamicMatch?.coinsApplicable;
      if (nectorPoints && !coinsApplicable) {
        dispatch(removePoints());
        toast.info("Loyalty points removed as a coupon is applied.", {
          icon: <Check className="w-4 h-4" />
        });
      }

      const claimedProductDiscount = (activeDiscounts || []).find((d) => d.claimed);
      if (claimedProductDiscount) {
        try {
          await unclaimDiscount(claimedProductDiscount.id);
        } catch (e) {
          // unclaimDiscount already shows its own error toast.
        }
        toast.info(`${claimedProductDiscount.title} removed as a coupon is applied.`, {
          icon: <Check className="w-4 h-4" />
        });
      }

      const incoming = {
        code: data.code,
        summary: data.summary,
        value: data.value,
        valueType: data.valueType,
        restricted: data.restricted,
        applicableItemIds: data.applicableItemIds,
        minAmount: dynamicMatch?.minAmount,
        coinsApplicable,
        combineCoupons: !!dynamicMatch?.combineCoupons
      };
      // Two offers may sit on the cart together only when they cover
      // different metals and each independently qualifies — otherwise this
      // replaces whatever was applied, as it always has.
      const alreadyApplied = hydratedAppliedCoupons.filter(
        (c) => String(c?.code || "").toUpperCase() !== String(data.code).toUpperCase()
      );
      const combines = canCombineOffers([...alreadyApplied, incoming], offerTotals);
      dispatch(combines ? addCoupon(incoming) : applyCoupon(incoming));
      toast.success(`Coupon "${data.code}" applied!`);
      setIsCouponDrawerOpen(false);
      setCouponCode("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsApplying(false);
      setApplyingCode(null);
    }
  };

  // Called two ways: CouponCard's onRemove passes the card's own code
  // string, but the "remove applied coupon" chip elsewhere just does
  // onClick={handleRemoveCoupon} — React passes the click event there, not
  // a code — so anything that isn't actually a string falls back to
  // whichever coupon is currently applied.
  const handleRemoveCoupon = async (code) => {
    const targetCode = typeof code === "string" ? code : effectiveAppliedCode;
    const dynamicMatch = dynamicCoupons?.find((c) => c.code.toUpperCase() === (targetCode || "").toUpperCase());
    if (dynamicMatch?.method === "automatic") {
      try {
        await unclaimDiscount(dynamicMatch.id);
        toast.error("Coupon removed", { icon: <Check className="w-4 h-4" /> });
      } catch (err) {
        // unclaimDiscount already shows its own error toast.
      }
      return;
    }
    dispatch(removeCoupon(typeof code === "string" ? code : undefined));
    toast.error("Coupon removed", {
      icon: <Check className="w-4 h-4" />
    });
  };

  // Shared by the "Proceed To Checkout" CTA.
  const handleProceedToCheckout = () => {
    // If user not logged in, fire promoClick
    if (!user) {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const variantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
      const promoData = {
        creative_name: "cart page login popup",
        promo_id: firstItem?.sku || variantId || "",
        item_id: variantId || "",
        promo_position: "Cart Page",
      };
      try {
        pushPromoClick(promoData);
      } catch (e) {
        // swallow errors from analytics
        console.error('promo push failed', e);
      }
    }
    
    // Track checkout for search analytics (passing items in cart to see if any match the search context)
    const simplifiedItems = items.map(item => ({
      productId: String(getNumericId(item.productId)),
      variantId: String(getNumericId(item.variantId)),
      quantity: item.quantity
    }));
    trackSearchCheckout(simplifiedItems);
    onPlaceOrder();
  };



  // Tiers run off diamondTotal, not subtotal: these coupons do not apply to
  // plain gold, so only the diamond-bearing lines count toward the band. An
  // all-gold cart yields 0 and therefore no applicable coupon at all.
  // The tiers are exclusive bands, so at most one code ever qualifies; the rest
  // render disabled in the drawer.
  const applicableCouponCode = getApplicableCouponCode(diamondTotal);
  const applicableCouponCodes = getApplicableCouponCodes(diamondTotal);

  // The Saving Zone drawer is dashboard-driven: /api/cart/coupons/active
  // returns codes staff toggled either "Show in Saving Zone drawer" OR
  // "Featured Offer" on (the FeaturedOfferBanner above needs the latter too)
  // — filter back down to drawer-only here so a featured-but-not-drawer rule
  // doesn't also clutter this list. Falls back to the static ladder if that
  // fetch hasn't resolved yet or failed, so the drawer never renders empty.
  const couponsList = dynamicCoupons ? dynamicCoupons.filter((c) => c.showInDrawer) : COUPONS;
  const isDynamicCouponsList = !!dynamicCoupons;

  // Dashboard coupons carry their own minAmount instead of fitting the static
  // ladder's exclusive bands, so applicability is just "cart clears this
  // coupon's own minimum" — more than one can be applicable at once, unlike
  // the old mutually-exclusive band logic.
  //
  // For "automatic" rules, diamondTotal (diamond-charges only) is the wrong
  // yardstick — a rule can target any collection (e.g. Gold Jewelry), not
  // just diamond items, so a gold-only cart would always read as ineligible.
  // The backend already computed real eligibility (collection match + the
  // cart's true aggregate subtotal for that rule) when it built
  // activeDiscounts — use that instead of re-deriving it heuristically here.
  // Code coupons have no such live signal until submitted, so they keep the
  // diamondTotal heuristic the static ladder always used.
  const applicableCoupons = couponsList.filter((c) => {
    if (!isDynamicCouponsList) return applicableCouponCodes.includes(c.code);
    if (c.method === "automatic") return !!activeDiscounts?.find((d) => d.id === c.id);
    return diamondTotal >= Number(c.minAmount || 0);
  });
  // The metal-split "additional % off" rules staff toggled Featured on. They
  // are deliberately absent from `couponsList` (their "Show in Saving Zone
  // drawer" toggle is off — the cart banner is their lead placement), but the
  // drawer is where a customer goes looking for offers, so they get a section
  // of their own at the top instead of being invisible here. Both metals are
  // listed even when only one qualifies, so the structure of the offer is
  // legible; the one that can't win renders disabled.
  const featuredBankOffers = (dynamicCoupons || [])
    .filter((c) => c.isFeatured)
    .map((c) => {
      const category = getOfferCategory(c);
      const base = getCategoryBase(category, { diamondTotal, goldTotal, productTotal });
      return { ...c, category, isApplicable: base > 0 && base >= Number(c.minAmount || 0) };
    })
    .sort((a, b) => Number(b.isApplicable) - Number(a.isApplicable));

  // A featured offer is claimed from its banner, never typed, so its code is
  // never shown to the customer — printing it here would be the one place it
  // leaks, and invites someone to pass it around.
  //
  // `dynamicCoupons` arrives from a fetch, so on the first paint after a
  // reload we don't yet know whether the applied code is featured. Withhold
  // the code until we do: guessing "not featured" would flash the very code
  // this is meant to hide.
  const hideAppliedCode =
    !!appliedCoupon &&
    (!isDynamicCouponsList ||
      !!featuredBankOffers.find((c) => c.code.toUpperCase() === (couponDetails.code || "").toUpperCase()));

  const generalApplicableCode = isDynamicCouponsList
    ? [...applicableCoupons].sort((a, b) => Number(b.minAmount || 0) - Number(a.minAmount || 0))[0]?.code || null
    : applicableCouponCode;

  // A code coupon (Redux appliedCoupon) and a claimed automatic discount
  // (backend activeDiscounts) are two different mechanisms, but only one can
  // ever be live at once (claiming removes an applied code, see useCart's
  // claimDiscount) — so they collapse to one "currently applied" code for
  // the card UI here.
  const claimedDynamicCoupon = dynamicCoupons?.find(
    (c) => c.method === "automatic" && activeDiscounts?.find((d) => d.id === c.id)?.claimed
  );
  const effectiveAppliedCode = appliedCoupon ? couponDetails.code : (claimedDynamicCoupon?.code || null);

  // Both codes when a combined pair is live, so a card can tell "I am one of
  // the applied ones" from "another one is applied".
  const appliedCodes = (appliedCoupons || []).map((c) => String(c?.code || "").toUpperCase()).filter(Boolean);
  const claimedAutomaticCode = claimedDynamicCoupon?.code ? [String(claimedDynamicCoupon.code).toUpperCase()] : [];
  const allAppliedCodes = appliedCodes.length ? appliedCodes : claimedAutomaticCode;
  // Sum of the applied percentage rates, for the drawer's combined notice.
  // Only meaningful when a pair is live; each rate still only touches its
  // own products, which the notice says explicitly.
  const appliedCombinedPercent = (appliedCoupons || []).reduce((acc, c) => {
    const pct = c?.valueType === "PERCENTAGE" ? Number(c.value) : Number(c?.discountValue) || 0;
    return acc + (Number.isFinite(pct) ? pct : 0);
  }, 0);

  // The featured offer the banner isn't leading with, if there is exactly one
  // — surfaced as the "also available" line under the Apply Coupon card. Both
  // that line and the banner read from the same selector so they can never
  // end up advertising the same offer twice.
  const otherFeaturedOffer = (() => {
    const { others } = selectFeaturedOffers({
      dynamicCoupons,
      activeDiscounts,
      diamondTotal,
      goldTotal,
      productTotal,
      effectiveAppliedCode,
      appliedCodes: allAppliedCodes,
    });
    if (others.length !== 1) return null;
    const o = others[0];
    return {
      ...o,
      amountLabel:
        o.discountType === "percentage"
          ? `${o.discountValue}%`
          : `₹${Number(o.discountValue).toLocaleString("en-IN")}`,
    };
  })();


  // Lead with the coupon the customer can actually use — an applied one first,
  // otherwise the qualifying tier — so the drawer never opens on a disabled
  // card. The remaining coupons keep their original ladder order beneath it.

  const leadCouponCode = effectiveAppliedCode || generalApplicableCode;
  const orderedCoupons = leadCouponCode
    ? [
        ...couponsList.filter((c) => c.code.toUpperCase() === leadCouponCode.toUpperCase()),
        ...couponsList.filter((c) => c.code.toUpperCase() !== leadCouponCode.toUpperCase()),
      ]
    : couponsList;

  // Same tile in the mobile and desktop offer groups; both open the one drawer.
  const couponTrigger = (
    <button
      type="button"
      onClick={() => {
        const firstItem = items && items.length > 0 ? items[0] : null;
        const variantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
        try {
          pushPromoClick({
            creative_name: "apply coupon banner - cart",
            promo_id: appliedCoupon ? (couponDetails?.code || "") : "view_coupons",
            item_id: variantId || "",
            promo_position: "Cart Page",
          });
        } catch (e) {
          console.error("promoClick push failed", e);
        }
        setIsCouponDrawerOpen(true);
      }}
      className="flex items-center gap-[12px] w-full border border-[#EADFD8] bg-white transition-colors hover:border-[#5A413F]/30 cursor-pointer px-[10px] py-[12px] lg:p-[10px]"
      style={{ margin: "0px", borderRadius: FREE_GIFTS.length > 0 ? "4px 4px 0px 0px" : "4px", borderColor: "#eaeaea" }}
    >
      <span className="flex h-9 w-9 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-sm bg-[#FEF9F6] border border-[#EADFD8]">
        <svg viewBox="0 0 24 24" fill="none" className="text-[#5A413F] w-[18px] h-[18px] lg:w-[24px] lg:h-[24px]">
          <path d="M15.0952 8.57815L8.59518 15.0781M8.59518 8.57815H8.60601M15.0952 15.0781H15.106M3.01601 8.16648C2.85789 7.45422 2.88217 6.71356 3.0866 6.01318C3.29103 5.31281 3.66899 4.67538 4.18544 4.16001C4.70188 3.64465 5.3401 3.26802 6.0409 3.06506C6.74171 2.8621 7.48242 2.83937 8.19435 2.99898C8.5862 2.38614 9.12602 1.8818 9.76404 1.53246C10.4021 1.18311 11.1178 1 11.8452 1C12.5726 1 13.2883 1.18311 13.9263 1.53246C14.5643 1.8818 15.1042 2.38614 15.496 2.99898C16.209 2.83867 16.951 2.8613 17.6529 3.06476C18.3549 3.26821 18.9939 3.64589 19.5107 4.16265C20.0274 4.67941 20.4051 5.31848 20.6086 6.0204C20.812 6.72232 20.8347 7.4643 20.6743 8.17732C21.2872 8.56917 21.7915 9.10899 22.1409 9.74701C22.4902 10.385 22.6733 11.1007 22.6733 11.8281C22.6733 12.5556 22.4902 13.2713 22.1409 13.9093C21.7915 14.5473 21.2872 15.0871 20.6743 15.479C20.834 16.1909 20.8112 16.9316 20.6083 17.6324C20.4053 18.3332 20.0287 18.9714 19.5133 19.4879C18.9979 20.0043 18.3605 20.3823 17.6601 20.5867C16.9598 20.7912 16.2191 20.8154 15.5068 20.6573C15.1155 21.2725 14.5753 21.779 13.9361 22.1299C13.297 22.4808 12.5797 22.6648 11.8506 22.6648C11.1215 22.6648 10.4042 22.4808 9.76504 22.1299C9.12593 21.779 8.58569 21.2725 8.19435 20.6573C7.48242 20.8169 6.74171 20.7942 6.0409 20.5912C5.3401 20.3883 4.70188 20.0117 4.18544 19.4963C3.66899 18.9809 3.29103 18.3435 3.0866 17.6431C2.88217 16.9427 2.85789 16.2021 3.01601 15.4898C2.39847 15.099 1.88979 14.5583 1.53732 13.9181C1.18484 13.2779 1 12.559 1 11.8281C1 11.0973 1.18484 10.3784 1.53732 9.73817C1.88979 9.09796 2.39847 8.5573 3.01601 8.16648Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-figtree text-[0.85rem] font-semibold capitalize leading-[1.25] tracking-[0.01em] lg:text-[1rem]">
          {appliedCoupon
            ? hideAppliedCode
              ? "Offer Applied"
              : `Applied: ${couponDetails.code}`
            : "Apply Coupon"}
        </p>
        <p className="font-figtree font-normal text-[0.65rem] lg:text-[0.9rem] leading-[1.4] lg:leading-[1.3] text-black mt-[5px]">
          View all available coupons.
        </p>
      </div>
      {/* On mobile the chevron becomes a filled brand-brown disc, which is the
          only affordance at that width that reads as "this opens something". */}
      <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-[50%] bg-[#5A413F]">
        <ChevronRight className="text-white w-[18px] h-[18px]" />
      </span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Coupon Trigger placed above summary for all views */}
      <div className="flex flex-col mb-[20px]">
        <h3 className="font-figtree text-sm font-semibold text-[#3D2B28] uppercase tracking-[0.4px] ml-0 mb-[14px] lg:hidden">Offer Zone</h3>
        <FeaturedOfferBanner
          dynamicCoupons={dynamicCoupons}
          activeDiscounts={activeDiscounts}
          diamondTotal={diamondTotal}
          goldTotal={goldTotal}
          productTotal={productTotal}
          effectiveAppliedCode={effectiveAppliedCode}
          appliedCodes={allAppliedCodes}
          applyingCode={applyingCode}
          onApply={handleApplyCoupon}
          onRemove={handleRemoveCoupon}
          loading={loading}
        />
        {couponTrigger}

        {/* The featured offer the banner isn't leading with, clipped to the
            bottom of the Apply Coupon card so the two read as one control. A
            gold-only cart has no other way of learning the diamond side pays
            more; tapping it opens the Saving Zone where both are listed. */}
        {otherFeaturedOffer && (
          <button
            type="button"
            onClick={() => setIsCouponDrawerOpen(true)}
            className="group flex w-full cursor-pointer items-center gap-1.5 text-left transition-colors hover:bg-black/[0.03]"
            style={{
              background: "#ffffff",
              border: "1px solid #eaeaea",
              borderTop: 0,
              borderRadius: "0 0 4px 4px",
              padding: 8,
              marginBottom: 20,
            }}
          >
            <OfferCategoryIcon category={otherFeaturedOffer.category} className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span
              className="min-w-0 flex-1 truncate font-figtree leading-[1.3]"
              style={{ color: "#000", fontSize: "0.85rem", fontWeight: 500 }}
            >
              Also available:{" "}
              <span className="font-semibold" style={{ color: getOfferTheme(otherFeaturedOffer.category).accent }}>
                Additional {otherFeaturedOffer.amountLabel} Off
              </span>{" "}
              on {OFFER_CATEGORY_LABEL[otherFeaturedOffer.category]}
            </span>
            {/* The row itself is the whole tap target already (onClick above) —
                "View" is dropped on mobile so the offer text gets the space
                instead of truncating; the chevron alone still reads as
                "opens something" at that width, same as the Apply Coupon row. */}
            <span
              className="hidden shrink-0 font-figtree font-semibold uppercase tracking-wide text-[#5A413F] underline-offset-2 group-hover:underline lg:inline"
              style={{ fontSize: "0.85rem" }}
            >
              View
            </span>
            <ChevronRight className="shrink-0 text-[#5A413F]" style={{ width: 12, height: 12 }} />
          </button>
        )}

        <FreeGiftReward diamondTotal={diamondTotal} />
      </div>

      {/* Desktop Pricing Breakdown (LG) */}
      <div className="hidden lg:block bg-transparent rounded-sm p-0 space-y-3.5 border-0">
        <div className="flex justify-between items-center font-figtree text-base text-[#000000]">
          <span>Subtotal</span>
          <span className="font-semibold text-[#3D2B28]">₹ {originalSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between items-center font-figtree text-base text-[#000000]">
            <span>Savings</span>
            <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        <div className="flex justify-between items-center font-figtree text-base">
          <span className={appliedCoupon ? "text-[#189351] font-semibold uppercase tracking-wide" : "text-[#000000]"}>
            {appliedCoupon ? "Coupon Applied" : "Coupon Discount"}
          </span>
          {appliedCoupon ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {couponDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <button
                onClick={handleRemoveCoupon}
                className="text-[0.625rem] font-bold text-red-500 hover:underline uppercase tracking-tighter"
              >
                (Remove)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCouponDrawerOpen(true)}
              className="font-semibold text-[#5A413F] hover:underline"
            >
              Apply Coupon
            </button>
          )}
        </div>
        {appliedGiftItem && (
          <div className="flex justify-between items-center font-figtree text-base text-[#000000]">
            <span>{appliedGiftItem.title || "Free Gift"} ({Number(appliedGiftItem.quantity || appliedGiftItem.qty || 1)})</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#00A63E]">Free</span>
            </div>
          </div>
        )}

        {insuranceItem && (
          <div className="flex justify-between items-center font-figtree text-base text-[#000000]">
            <span>Insurance</span>
            <span className="font-semibold text-[#3D2B28]">₹ {insuranceAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        )}
        <div className="flex justify-between items-center font-figtree text-base text-[#000000]">
          <span>Shipping (Standard)</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#00A63E]">Free</span>
            <span className="text-sm text-gray-400 line-through font-normal">₹ {SHIPPING_ORIGINAL_VALUE}</span>
          </div>
        </div>

        <div className="border-t border-[#EADFD8] mt-4 pt-4 flex justify-between items-center">
          <span className="font-figtree text-base font-semibold text-[#3D2B28] uppercase tracking-[0.4px]">Grand Total</span>
          <span className="font-figtree text-xl font-bold text-[#3D2B28]">₹ {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>

        {totalSavingsBanner > 0 && (
          <div className="mt-4 rounded-[4px] bg-[#EAF7EE] p-2 text-center">
            <span className="font-figtree text-[0.9rem] lg:text-[1rem] font-medium text-[#00A63E] block">
              You will save <span className="font-semibold no-underline">₹{totalSavingsBanner.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> on this order
            </span>
          </div>
        )}
      </div>

      {/* Mobile Order Summary (LG Hidden) */}
      <div ref={breakdownRef} className="lg:hidden scroll-mt-20 space-y-3">
        <h3 className="font-figtree text-sm font-semibold text-[#3D2B28] uppercase tracking-[0.4px] ml-0 mb-[14px]">Order Summary</h3>
        <div className="bg-white rounded-sm space-y-3 border-0 p-0">
          <div className="mb-3">
            <div className="flex justify-between font-figtree text-[0.75rem] text-black mb-2 leading-[1.4]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#3D2B28]">₹ {originalSubtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>

            {totalSavings > 0 && (
              <div className="flex justify-between font-figtree text-[0.75rem] text-black mb-2 leading-[1.4]">
                <span>Savings</span>
                <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            )}

            <div className="flex justify-between font-figtree text-[0.75rem] items-center mb-2 leading-[1.4]">
              <span className={appliedCoupon ? "font-semibold uppercase tracking-wide text-[#189351]" : "text-black"}>
                {appliedCoupon ? "Coupon Applied" : "Coupon Discount"}
              </span>
              {appliedCoupon ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#00A63E] whitespace-nowrap">- ₹ {couponDiscountAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-[0.625rem] font-bold text-red-500 hover:underline uppercase tracking-tighter"
                  >
                    (Remove)
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCouponDrawerOpen(true)}
                  className="font-semibold text-[#5A413F] hover:underline"
                >
                  Apply Coupon
                </button>
              )}
            </div>

            {appliedGiftItem && (
              <div className="flex justify-between items-center font-figtree text-[0.75rem] text-black mb-2 leading-[1.4]">
                <span>{appliedGiftItem.title || "Free Gift"} ({Number(appliedGiftItem.quantity || appliedGiftItem.qty || 1)})</span>
                <span className="font-semibold text-[#00A63E]">Free</span>
              </div>
            )}

            {insuranceItem && (
              <div className="flex justify-between font-figtree text-[0.75rem] text-black mb-2 leading-[1.4]">
                <span>Insurance</span>
                <span className="font-semibold text-[#3D2B28]">₹ {insuranceAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            )}

            <div className="flex justify-between font-figtree text-[0.75rem] text-black mb-2 leading-[1.4]">
              <span>Shipping (Standard)</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#00A63E]">Free</span>
                <span className="text-[0.6875rem] text-gray-400 line-through font-normal">₹ {SHIPPING_ORIGINAL_VALUE}</span>
              </div>
            </div>
          </div>

          <div className="border-t-[1.5px] border-[#E7E7E7] pt-3 flex justify-between items-center">
            <span className="font-figtree text-[1rem] font-semibold text-[#3D2B28] uppercase tracking-[0.4px]">Grand Total</span>
            <span className="font-figtree text-[1rem] font-semibold text-[#3D2B28]">₹ {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>

          {totalSavingsBanner > 0 && (
            <div className="mt-3 rounded-[4px] bg-[#EAF7EE] p-2 text-center">
              <span className="font-figtree text-[0.9rem] lg:text-[1rem] font-medium text-[#00A63E] block">
                You will save <span className="font-semibold no-underline">₹{totalSavingsBanner.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> on this order
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Offers Group (Gold Coin, Insurance) - ALL BELOW SUMMARY */}
      <div className="lg:hidden space-y-6">
        <div className="space-y-4">
          <InsuranceOption />
        </div>
      </div>



      {/* Desktop Only Actions & Options */}
      <div className="hidden lg:block space-y-4">

        <Button
          onClick={handleProceedToCheckout}
          className="w-full flex shrink-0 items-center justify-center rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] transition-colors h-[50px] font-figtree font-medium uppercase tracking-wider text-[1rem] lg:text-[1.0625rem] text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          Proceed To Checkout
        </Button>
        
        <InsuranceOption />
      </div>

      {/* Contact Section */}
      <CartContact productName={firstProductName} />

      {/* Saving Zone — one drawer for both breakpoints, rendered once at the
          root so the mobile/desktop trigger groups share a single instance. */}
      <CouponDrawer
        open={isCouponDrawerOpen}
        onClose={() => setIsCouponDrawerOpen(false)}
        title="Saving Zone"
      >
        {/* Manual code entry — locked while a coupon is live, since a cart can
            only carry one at a time. */}
        <div className="flex items-stretch gap-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && couponCode.trim() && !isApplying && !appliedCoupon && !appliedGiftItem) handleApplyCoupon();
            }}
            disabled={!!appliedCoupon || !!appliedGiftItem}
            placeholder={appliedGiftItem ? `Disabled due to Diamond Bracelet` : "Enter Coupon Code"}
            className="h-12 flex-1 rounded-sm border-[#EADFD8] bg-white font-figtree text-sm font-semibold tracking-[0.1em] uppercase text-[#3D2B28] placeholder:text-[#B9A79E] placeholder:font-medium placeholder:tracking-normal placeholder:normal-case focus-visible:ring-2 focus-visible:ring-[#5A413F]/30 focus-visible:border-[#5A413F] disabled:opacity-55"
          />
          <Button
            onClick={() => handleApplyCoupon()}
            disabled={isApplying || !couponCode.trim() || !!appliedCoupon || !!appliedGiftItem}
            className="h-12 shrink-0 rounded-sm bg-[#5A413F] hover:bg-[#4A3533] px-5 font-figtree uppercase font-semibold tracking-[0.1em] text-xs text-white transition-colors disabled:opacity-50"
          >
            {isApplying && !applyingCode ? <Loader2 className="animate-spin" /> : "Apply"}
          </Button>
        </div>

        {appliedCoupon && (
          <div className="flex items-center justify-between gap-3 rounded-sm border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5">
            <p className="font-figtree text-xs font-medium leading-[1.4] text-emerald-700">
              {appliedCodes.length > 1
                ? `Both offers applied — ${appliedCombinedPercent}% combined, each rate on its own products.`
                : "Only one coupon can be used at a time."}
            </p>
            <button
              onClick={handleRemoveCoupon}
              className="shrink-0 font-figtree text-[0.6875rem] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {appliedGiftItem && !appliedCoupon && (
          <div className="flex items-center justify-between gap-3 rounded-sm border border-amber-200 bg-amber-50/70 px-3.5 py-2.5">
            <p className="font-figtree text-xs font-medium leading-[1.4] text-[#3D2B28]">
              Coupons cannot be applied while Diamond Bracelet is claimed.
            </p>
            <button
              onClick={() => removeFromCart(appliedGiftItem.lineId || appliedGiftItem.variantId)}
              className="shrink-0 font-figtree text-[0.6875rem] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}



        {!user ? (
          <div className="rounded-sm border border-[#EADFD8] bg-[#FFF8F6] px-5 py-6 flex flex-col items-center justify-center text-center mt-2">
            <div className="w-12 h-12 rounded-sm bg-[#5A413F]/10 flex items-center justify-center mb-3">
              <Gift className="w-6 h-6 text-[#5A413F]" />
            </div>
            <h4 className="font-figtree font-semibold text-[#3D2B28] text-sm md:text-base mb-1.5 uppercase tracking-wide">
              Login to Unlock Coupons
            </h4>
            <p className="font-figtree text-xs md:text-sm text-[#000000] mb-4" style={{ maxWidth: "270px" }}>
              Login or register to access members-only discounts and rewards.
            </p>
            <Button
              onClick={() => {
                const firstItem = items && items.length > 0 ? items[0] : null;
                const variantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
                try {
                  pushPromoClick({
                    creative_name: "saving zone coupon drawer login",
                    promo_id: firstItem?.sku || variantId || "",
                    item_id: variantId || "",
                    promo_position: "Cart Page",
                  });
                } catch (e) {
                  console.error("promoClick push failed", e);
                }
                setIsCouponDrawerOpen(false);
                openLogin();
              }}
              className="h-11 px-6 rounded-sm bg-[#5A413F] hover:bg-[#4A3533] font-figtree uppercase text-xs text-white transition-colors cursor-pointer"
              style={{ fontWeight: 400, letterSpacing: "0.6px", borderRadius: "4px" }}
            >
              Login / Register
            </Button>
          </div>
        ) : (
          <>
            {/* Bank discounts lead the list — same ticket as every other
                coupon, highlighted in its metal so it reads as the headline
                offer rather than another rung on the ₹-ladder. */}
            {featuredBankOffers.map((offer) => (
              <div key={offer.code} className="w-full">
                <CouponCard
                  coupon={offer}
                  className="w-full"
                  mode="apply"
                  isBankOffer
                  onApply={handleApplyCoupon}
                  onRemove={handleRemoveCoupon}
                  applyingCode={applyingCode}
                  appliedCodes={allAppliedCodes}
                  allowCombine={canCombineOffers([...hydratedAppliedCoupons, offer], offerTotals)}
                  appliedCode={effectiveAppliedCode}
                  isApplicable={offer.isApplicable}
                  disabled={!!appliedGiftItem}
                />
              </div>
            ))}

            {/* Every card is disabled — say why rather than leaving a dead list */}
            {!appliedCoupon && couponsList.length > 0 && applicableCoupons.length === 0 && items.length > 0 && (
              <div className="rounded-sm border border-[#EADFD8] bg-white px-3.5 py-2.5">
                <p className="font-figtree text-xs font-medium leading-[1.4] text-[#000000]">
                  These coupons apply to diamond products only. Add a diamond product to unlock them.
                </p>
              </div>
            )}

            {/* The dashboard-driven coupon ladder, in the same card design */}
            {(() => {
              const baseCoupons = [...couponsList];
              const allApplicable = applicableCoupons.map((c) => c.code);

              const referenceOrder = [...baseCoupons].sort((a, b) => Number(a.minAmount || 0) - Number(b.minAmount || 0));

              return [...referenceOrder]
                .sort((a, b) => {
                  const aApp = allApplicable.includes(a.code);
                  const bApp = allApplicable.includes(b.code);

                  // Always push applicable coupons to the top
                  if (aApp && !bApp) return -1;
                  if (!aApp && bApp) return 1;

                  // If both are applicable, show highest minAmount first
                  if (aApp && bApp) {
                     return Number(b.minAmount || 0) - Number(a.minAmount || 0);
                  }
                  // If neither are applicable, show lowest minAmount first (closer to being reachable)
                  return Number(a.minAmount || 0) - Number(b.minAmount || 0);
                })
                .map((coupon) => (
                  <div key={coupon.code} className="w-full">
                    <CouponCard
                      coupon={coupon}
                      className="w-full"
                      mode="apply"
                      onApply={handleApplyCoupon}
                      onRemove={handleRemoveCoupon}
                      applyingCode={applyingCode}
                      appliedCodes={allAppliedCodes}
                      allowCombine={canCombineOffers([...hydratedAppliedCoupons, coupon], offerTotals)}
                      appliedCode={effectiveAppliedCode}
                      isApplicable={allApplicable.includes(coupon.code)}
                      disabled={!!appliedGiftItem}
                    />
                  </div>
                ));
            })()}
          </>
        )}

        <p className="text-[0.6875rem] text-zinc-500 font-figtree font-medium text-center pt-2 leading-relaxed">
          {COUPON_DISCLAIMER}
        </p>
      </CouponDrawer>
    </div>
  );
}
