"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import CouponCard from "@/components/coupons/CouponCard";
import CouponDrawer from "@/components/coupons/CouponDrawer";
import { COUPONS, COUPON_DISCLAIMER, parsePrice, getOfferCategory, OFFER_CATEGORY } from "@/lib/coupons";
import { pushPromoClick } from "@/lib/gtm";
import { apiFetch } from "@/lib/api";
import { useAtcLoginGate } from "@/hooks/useAtcLoginGate";

/**
 * Compact "Unlock Exclusive Offers" strip under the PDP "Total saving on this
 * jewelry" box. Replaces the inline Unlock Coupon block that used to sit below
 * the price. Logged-in shoppers get the coupon drawer straight away; guests go
 * through the same compact login popup / bottom sheet as add-to-cart, and the
 * drawer opens for them once that login completes.
 *
 * `attached` tucks the strip under the savings box (inset, bottom-rounded);
 * without it the strip renders as a standalone rounded bar.
 */
export default function OffersStrip({
  user,
  toast,
  currentPrice,
  productId,
  productCategory,
  productImage = null,
  attached = false,
}) {
  const requireLogin = useAtcLoginGate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [dynamicCoupons, setDynamicCoupons] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/cart/coupons/active", { suppressErrorLog: true })
      .then((res) => {
        if (!cancelled && res?.coupons) {
          setDynamicCoupons(res.coupons);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Logging out while the drawer is open: the offers are a logged-in perk, so
  // close it rather than leave a guest looking at codes.
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    if (!user) setIsDrawerOpen(false);
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const trackOffersUnlocked = () => {
    try {
      pushPromoClick({
        creative_name: "unlock coupons - pdp",
        location_id: typeof window !== "undefined" ? window.location.href : "",
        promo_id: String(productId || ""),
        promo_name: user?.mobile || user?.phone || "",
      });
    } catch (error) {
      console.error("Error pushing to dataLayer:", error);
    }
  };

  const handleViewOffers = () => {
    const openDrawer = () => setIsDrawerOpen(true);
    const sentToLogin = requireLogin(
      () => {
        trackOffersUnlocked();
        toast.success("Offers Unlocked Successfully!");
        openDrawer();
      },
      {
        productImage,
        heading: "Unlock Exclusive Offers",
        subtext: "Login / Signup to view offers & save more on this jewelry",
        buttonText: "View Offers",
        rewardSource: "unlock_coupon",
      }
    );
    if (!sentToLogin) openDrawer();
  };

  // /api/cart/coupons/active also includes featured-only rules (not toggled
  // "Show in Saving Zone drawer") for the cart's FeaturedOfferBanner — filter
  // back down to drawer-only here, same as the cart's drawer list.
  const couponsList = dynamicCoupons ? dynamicCoupons.filter((c) => c.showInDrawer) : COUPONS;
  const priceValue = parsePrice(currentPrice);

  // The metal-split "additional % off" offers (e.g. 5% on Diamond / 3% on Gold),
  // only when this product's price meets the offer's minimum spend.
  const bankOffers = (dynamicCoupons || [])
    .filter((c) => c.isFeatured)
    .filter((c) => {
      const category = getOfferCategory(c);
      if (category === OFFER_CATEGORY.ALL || !productCategory) return true;
      return category === productCategory;
    })
    .filter((c) => {
      const min = Number(c.minAmount || c.minRequirementValue || 0);
      return priceValue >= min;
    });

  return (
    <>
      <div className={`relative z-10 ${attached ? "-mt-2 mx-8 sm:mx-9 pt-2" : ""}`}>
        {/* Design asset: red tag with its string. The string's curl sits at
            ~(97%, 12%) of the image; that point is anchored a few px inside the
            strip's bottom-left corner and the image paints BENEATH the strip,
            so the curl's tail disappears behind the rounded corner and the
            string reads as hooked round it. The tag body hangs out left and
            below. The wrapper's side margins are >= the overhang so the
            column never clips it; its z-index keeps the body above the card
            below. */}
        <Image
          src="/images/product/offer-tag.png"
          alt=""
          width={88}
          height={75}
          className="absolute z-0 pointer-events-none select-none w-[36px] h-auto -left-[29px] -bottom-[19px] sm:w-[40px] sm:-left-[33px] sm:-bottom-[22px]"
        />
        <div
          className={`relative z-[1] flex items-center justify-between gap-3 bg-[#4E3B38] text-white pl-5 sm:pl-6 pr-3.5 sm:pr-5 py-2.5 ${
            attached ? "rounded-b-xl" : "rounded-xl"
          }`}
        >
          <span className="font-figtree font-medium text-[13px] sm:text-sm leading-[1.4] tracking-normal truncate">
            Unlock Exclusive Offers
          </span>
          <button
            type="button"
            onClick={handleViewOffers}
            className="shrink-0 font-figtree font-semibold text-[13px] sm:text-sm leading-[1.4] underline underline-offset-[3px] decoration-1 text-white hover:text-white/85 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            View Offers
          </button>
        </div>
      </div>

      <CouponDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Available Coupons">
        {bankOffers.map((offer) => (
          <div key={`bank-${offer.code}`} className="w-full">
            <CouponCard coupon={offer} onCopy={handleCopyCode} copiedCode={copiedCode} isBankOffer className="w-full" />
          </div>
        ))}

        {couponsList.map((coupon, idx) => (
          <div key={coupon.id || coupon.code || idx} className="w-full">
            <CouponCard coupon={coupon} onCopy={handleCopyCode} copiedCode={copiedCode} className="w-full" />
          </div>
        ))}

        <p className="text-[11px] text-zinc-500 font-figtree font-medium text-center pt-2 leading-relaxed">
          {COUPON_DISCLAIMER}
        </p>
      </CouponDrawer>
    </>
  );
}
