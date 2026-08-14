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
import GoldCoinOption, { GOLDCOIN_VARIANT_ID } from "./GoldCoinOption";
import { useCart } from "@/hooks/useCart";
import { applyCoupon, removeCoupon, removePoints } from "@/redux/features/cart/cartSlice";
import { toast } from "react-toastify";
import { trackCheckout as trackSearchCheckout } from "@/lib/searchAnalytics";
import CartContact from "./CartContact";
import CouponDrawer from "@/components/coupons/CouponDrawer";
import CouponCard from "@/components/coupons/CouponCard";
import { COUPONS, COUPON_DISCLAIMER, getApplicableCouponCode, getApplicableCouponCodes, calculateCouponDiscount } from "@/lib/coupons";
import { apiFetch } from "@/lib/api";
import TrustBadges from "@/components/common/TrustBadges";
import Image from "next/image";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const SILVER_PENDANT_VARIANT_ID = "gid://shopify/ProductVariant/48052809498842";
const SILVER_PENDANT_5K_VARIANT_ID = "gid://shopify/ProductVariant/48335367602394";
const isPendantVariant = (id) => id === SILVER_PENDANT_VARIANT_ID || id === SILVER_PENDANT_5K_VARIANT_ID;

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
  
  const { items, totalAmount, totalQuantity, appliedCoupon, updateCartItem, removeFromCart, addToCart, loading, nectorPoints } = useCart();
  const user = useSelector((state) => state.user.user);
  const { openLogin } = useAuth();
  const [goldCoinConfig, setGoldCoinConfig] = useState({ enabled: true, threshold: 20000 });

  useEffect(() => {
    apiFetch("/api/settings/gold-coin")
      .then(data => {
        setGoldCoinConfig({
          enabled: data.enabled ?? false,
          threshold: Number(data.threshold) || 20000
        });
      })
      .catch(err => console.error("Error fetching gold coin threshold:", err));
  }, []);

  const otherItemsQuantity = (() => {
    let qty = 0;
    const byjGroups = new Set();
    items
      .filter(item => 
        item.variantId !== INSURANCE_VARIANT_ID && 
        !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
!isPendantVariant(item.variantId)
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

  const diamondTotal = items
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
        !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
!isPendantVariant(item.variantId) &&
        !isBYJ;
    })
    .reduce((acc, item) => {
        const itemQty = Number(item.quantity || item.qty || 1);
        let charges = Number(item.diamondCharges || 0);
        
        // Robust Fallback: Try parsing variant_config if diamondCharges is 0
        if (charges === 0 && item.metafields?.variant_config) {
            try {
                const config = JSON.parse(item.metafields.variant_config);
                if (config.advanced_stone_config) {
                    charges = config.advanced_stone_config.reduce((sAcc, s) => sAcc + (s.stone_weight * 50000), 0);
                } else if (config.diamond_charges) {
                    charges = config.diamond_charges;
                }
            } catch(e) {}
        }

        // Final fallback: If it's a diamond ring but charges still 0, use price
        if (charges === 0 && (item.title?.toLowerCase().includes("diamond") || item.handle?.toLowerCase().includes("diamond"))) {
           charges = item.price;
        }

        if (charges > 0) {
            return acc + (Number(item.price) * itemQty);
        }
        return acc;
    }, 0);

  const eligibleGoldCoins = Math.max(0, Math.floor(diamondTotal / goldCoinConfig.threshold));

  const insuranceItem = items.find(item => item.variantId === INSURANCE_VARIANT_ID);
  const insuranceAmount = insuranceItem ? insuranceItem.price * (Number(insuranceItem.quantity || insuranceItem.qty || 1)) : 0;

  const goldCoinItem = items.find(item => item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift);
  const isSilverPendant10kEligible = diamondTotal >= 30000;
  const isSilverPendant5kEligible = diamondTotal >= 15000 && diamondTotal < 30000;
  const isSilverPendantEligible = isSilverPendant10kEligible || isSilverPendant5kEligible;

  const currentEligiblePendant = isSilverPendant10kEligible 
    ? {
        variantId: SILVER_PENDANT_VARIANT_ID,
        productId: "gid://shopify/Product/9342370414810",
        worthText: "₹10,000",
        image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/ChatGPT_Image_Aug_3_2026_01_42_46_PM.png?v=1785745617"
      } 
    : isSilverPendant5kEligible 
      ? {
          variantId: SILVER_PENDANT_5K_VARIANT_ID,
          productId: "gid://shopify/Product/9429345108186",
          worthText: "₹5,000",
          image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/ChatGPT_Image_Aug_3_2026_01_42_46_PM.png?v=1785745617"
        }
      : null;

  const silverPendantItem10k = items.find(item => item.variantId === SILVER_PENDANT_VARIANT_ID);
  const silverPendantItem5k = items.find(item => item.variantId === SILVER_PENDANT_5K_VARIANT_ID);
  const silverPendantItem = silverPendantItem10k || silverPendantItem5k;
  const isSilverPendantApplied = !!silverPendantItem;

  const [isSilverPendantLoading, setIsSilverPendantLoading] = useState(false);
  const [pendantPrice, setPendantPrice] = useState(0);

  useEffect(() => {
    if (!currentEligiblePendant) return;
    apiFetch(`/api/products/pricing?variantId=${currentEligiblePendant.variantId.split('/').pop()}`, { suppressErrorLog: true })
      .then(data => {
        const p = Number(data?.price || data?.compare_price || 0);
        if (p > 0) setPendantPrice(p);
      })
      .catch(err => console.error("Error fetching silver pendant price:", err));
  }, [currentEligiblePendant?.variantId]);

  useEffect(() => {
    if (appliedCoupon && isSilverPendantApplied && !isSilverPendantLoading) {
      removeFromCart(silverPendantItem?.lineId || silverPendantItem?.variantId);
      if (typeof window !== "undefined") localStorage.removeItem("isSilverPendantClaimed");
      toast.info("Free Silver Pendant removed as it cannot be combined with a coupon.");
    }
  }, [appliedCoupon, isSilverPendantApplied, isSilverPendantLoading, removeFromCart, silverPendantItem, toast]);

  const handleToggleSilverPendant = async () => {
    setIsSilverPendantLoading(true);
    try {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const variantId = firstItem?.variantId || firstItem?.id || firstItem?.shopifyId || "";
      try {
        pushPromoClick({
          creative_name: isSilverPendantApplied ? "remove free silver pendant - cart" : "claim free silver pendant - cart",
          promo_id: currentEligiblePendant?.variantId || SILVER_PENDANT_VARIANT_ID,
          item_id: variantId || (currentEligiblePendant?.variantId || SILVER_PENDANT_VARIANT_ID),
          promo_position: "Cart Page",
        });
      } catch (e) {
        console.error("promoClick push failed", e);
      }

      if (isSilverPendantApplied) {
        if (typeof window !== "undefined") localStorage.removeItem("isSilverPendantClaimed");
        await removeFromCart(silverPendantItem?.lineId || silverPendantItem?.variantId);
        toast.info("Free Silver Pendant removed from your order.");
      } else if (currentEligiblePendant) {
        if (appliedCoupon) {
          dispatch(removeCoupon());
          toast.info("Coupon removed as Free Pendant offer cannot be combined with coupons.");
        }
        if (typeof window !== "undefined") localStorage.setItem("isSilverPendantClaimed", "true");
        
        const isTier2 = eligiblePendantId === SILVER_PENDANT_VARIANT_ID;
        const productId = isTier2 ? "gid://shopify/Product/9342370414810" : "gid://shopify/Product/9429345108186";

        const product = {
          productId: currentEligiblePendant.productId,
          variantId: currentEligiblePendant.variantId,
          title: "Free Silver Pendant",
          image: currentEligiblePendant.image,
          price: 0,
          originalPrice: pendantPrice,
          comparePrice: pendantPrice,
          quantity: 1,
          variantTitle: "Free Gift",
          inStock: true,
          isFreeGift: true
        };
        await addToCart(product);
        toast.success("Free Silver Pendant added to your order!", {
          icon: <Check className="w-4 h-4" />
        });
      }
    } catch (e) {
      console.error("Error updating Free Pendant:", e);
    } finally {
      setIsSilverPendantLoading(false);
    }
  };

  const firstProductName = items.find(item =>
    item.variantId !== INSURANCE_VARIANT_ID &&
    !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
!isPendantVariant(item.variantId)
  )?.title;

  // Auto-sync insurance and gold coin quantities
  useEffect(() => {
    // Sync Insurance
    if (insuranceItem) {
      const currentInsQty = Number(insuranceItem.quantity || insuranceItem.qty || 0);
      if (otherItemsQuantity <= 0) {
        removeFromCart(INSURANCE_VARIANT_ID);
      } else if (currentInsQty !== otherItemsQuantity) {
        updateCartItem({
          currentVariantId: INSURANCE_VARIANT_ID,
          quantity: otherItemsQuantity
        });
      }
    }

    // Sync Gold Coin
    if (goldCoinItem && goldCoinItem.isFreeGift) {
      const currentCoinQty = Number(goldCoinItem.quantity || goldCoinItem.qty || 0);
      
      // Remove if promotion is disabled OR if eligibility threshold not met
      if (!goldCoinConfig.enabled || eligibleGoldCoins <= 0) {
        removeFromCart(goldCoinItem.lineId || GOLDCOIN_VARIANT_ID);
      } else if (currentCoinQty !== eligibleGoldCoins) {
        updateCartItem({
          lineId: goldCoinItem.lineId,
          currentVariantId: GOLDCOIN_VARIANT_ID,
          quantity: eligibleGoldCoins
        });
      }
    }

    // Sync Silver Pendant
    if (silverPendantItem10k && currentEligiblePendant?.variantId !== SILVER_PENDANT_VARIANT_ID) {
      removeFromCart(silverPendantItem10k.lineId || silverPendantItem10k.variantId);
    }
    if (silverPendantItem5k && currentEligiblePendant?.variantId !== SILVER_PENDANT_5K_VARIANT_ID) {
      removeFromCart(silverPendantItem5k.lineId || silverPendantItem5k.variantId);
    }
  }, [otherItemsQuantity, insuranceItem?.quantity, insuranceItem?.qty, eligibleGoldCoins, goldCoinItem?.quantity, goldCoinItem?.qty, updateCartItem, removeFromCart, goldCoinConfig.enabled, silverPendantItem10k, silverPendantItem5k, currentEligiblePendant]);

  const couponDetails = (appliedCoupon && typeof appliedCoupon === 'object') 
    ? appliedCoupon 
    : { code: appliedCoupon || "", summary: "Applied", value: 0, valueType: "FIXED_AMOUNT" };

  // Re-validate coupon when items change
  useEffect(() => {
    if (appliedCoupon && items.length === 0) {
      dispatch(removeCoupon());
      return;
    }

    if (appliedCoupon && items.length > 0 && couponDetails?.code) {
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
                couponCode: couponDetails.code,
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
  }, [items, appliedCoupon, couponDetails?.code, user?.email, dispatch]);

  // Sum of original prices (comparePrice if it is greater than price, otherwise price)
  const originalSubtotal = items
    .filter(item =>
      item.variantId !== INSURANCE_VARIANT_ID &&
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      !(isPendantVariant(item.variantId) && item.isFreeGift)
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
      !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
      !(isPendantVariant(item.variantId) && item.isFreeGift)
    )
    .reduce((acc, item) => {
      const qty = Number(item.quantity || item.qty || 1);
      const compare = Number(item.comparePrice || 0);
      const price = Number(item.price || 0);
      return acc + (compare > price ? (compare - price) * qty : 0);
    }, 0);


  const subtotal = otherItemsQuantity > 0 ? (totalAmount - insuranceAmount) : 0;

  const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotal);

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
    if (isSilverPendantApplied) {
      toast.error("Coupons cannot be applied while Free Silver Pendant is claimed. Please remove the pendant first.");
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
      if (nectorPoints) {
        dispatch(removePoints());
        toast.info("Loyalty points removed as a coupon is applied.", {
          icon: <Check className="w-4 h-4" />
        });
      }

      if (isSilverPendantApplied) {
        await removeFromCart(silverPendantItem?.lineId || silverPendantItem?.variantId);
        if (typeof window !== "undefined") localStorage.removeItem("isSilverPendantClaimed");
        toast.info("Free Pendant removed as it cannot be combined with a coupon.");
      }

      dispatch(applyCoupon({
        code: data.code,
        summary: data.summary,
        value: data.value,
        valueType: data.valueType,
        restricted: data.restricted,
        applicableItemIds: data.applicableItemIds
      }));
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

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    toast.error("Coupon removed", {
      icon: <Check className="w-4 h-4" />
    });
  };

  // Shared by the "Proceed To Checkout" CTA.
  const handleProceedToCheckout = () => {
    // If user not logged in, fire promoClick and open login modal
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
      openLogin("/checkout/shipping");
      return;
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

  // Lead with the coupon the customer can actually use — an applied one first,
  // otherwise the qualifying tier — so the drawer never opens on a disabled
  // card. The remaining coupons keep their original ladder order beneath it.
  const leadCouponCode = (appliedCoupon && couponDetails.code) || applicableCouponCode;
  const orderedCoupons = leadCouponCode
    ? [
        ...COUPONS.filter((c) => c.code.toUpperCase() === leadCouponCode.toUpperCase()),
        ...COUPONS.filter((c) => c.code.toUpperCase() !== leadCouponCode.toUpperCase()),
      ]
    : COUPONS;

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
      className="flex items-center gap-4 w-full border border-[#EADFD8] bg-white transition-colors hover:border-[#5A413F]/30 cursor-pointer px-[10px] py-[12px] lg:p-[10px]"
      style={{ margin: "0px", borderRadius: isSilverPendantEligible ? "4px 4px 0px 0px" : "4px", borderColor: "#eaeaea" }}
    >
      <span className="flex h-9 w-9 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-sm bg-[#FEF9F6] border border-[#EADFD8]">
        <svg viewBox="0 0 24 24" fill="none" className="text-[#5A413F] w-[18px] h-[18px] lg:w-[24px] lg:h-[24px]">
          <path d="M15.0952 8.57815L8.59518 15.0781M8.59518 8.57815H8.60601M15.0952 15.0781H15.106M3.01601 8.16648C2.85789 7.45422 2.88217 6.71356 3.0866 6.01318C3.29103 5.31281 3.66899 4.67538 4.18544 4.16001C4.70188 3.64465 5.3401 3.26802 6.0409 3.06506C6.74171 2.8621 7.48242 2.83937 8.19435 2.99898C8.5862 2.38614 9.12602 1.8818 9.76404 1.53246C10.4021 1.18311 11.1178 1 11.8452 1C12.5726 1 13.2883 1.18311 13.9263 1.53246C14.5643 1.8818 15.1042 2.38614 15.496 2.99898C16.209 2.83867 16.951 2.8613 17.6529 3.06476C18.3549 3.26821 18.9939 3.64589 19.5107 4.16265C20.0274 4.67941 20.4051 5.31848 20.6086 6.0204C20.812 6.72232 20.8347 7.4643 20.6743 8.17732C21.2872 8.56917 21.7915 9.10899 22.1409 9.74701C22.4902 10.385 22.6733 11.1007 22.6733 11.8281C22.6733 12.5556 22.4902 13.2713 22.1409 13.9093C21.7915 14.5473 21.2872 15.0871 20.6743 15.479C20.834 16.1909 20.8112 16.9316 20.6083 17.6324C20.4053 18.3332 20.0287 18.9714 19.5133 19.4879C18.9979 20.0043 18.3605 20.3823 17.6601 20.5867C16.9598 20.7912 16.2191 20.8154 15.5068 20.6573C15.1155 21.2725 14.5753 21.779 13.9361 22.1299C13.297 22.4808 12.5797 22.6648 11.8506 22.6648C11.1215 22.6648 10.4042 22.4808 9.76504 22.1299C9.12593 21.779 8.58569 21.2725 8.19435 20.6573C7.48242 20.8169 6.74171 20.7942 6.0409 20.5912C5.3401 20.3883 4.70188 20.0117 4.18544 19.4963C3.66899 18.9809 3.29103 18.3435 3.0866 17.6431C2.88217 16.9427 2.85789 16.2021 3.01601 15.4898C2.39847 15.099 1.88979 14.5583 1.53732 13.9181C1.18484 13.2779 1 12.559 1 11.8281C1 11.0973 1.18484 10.3784 1.53732 9.73817C1.88979 9.09796 2.39847 8.5573 3.01601 8.16648Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-figtree font-medium text-[0.875rem] lg:text-[1rem] leading-none lg:leading-[1.3] text-black lg:text-[#3D2B28] mt-0 mb-1">
          {appliedCoupon ? `Applied: ${couponDetails.code}` : "Apply Coupon"}
        </p>
        <p className="font-figtree font-normal text-[0.75rem] lg:text-[0.9rem] leading-[1.4] lg:leading-[1.3] text-black mt-[5px]">
          View all available coupons.
        </p>
      </div>
      <span className="flex h-8 w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-[50%]" style={{ background: "transparent" }}>
        <ChevronRight className="text-[#5A413F] w-[24px] h-[24px] lg:w-[28px] lg:h-[28px]" />
      </span>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Coupon Trigger placed above summary for all views */}
      <div className="flex flex-col mb-[20px]">
        <h3 className="font-figtree text-[0.875rem] lg:hidden font-medium text-black uppercase tracking-wider mb-3" style={{
            fontFamily: "Figtree",
            fontWeight: 500,
            lineHeight: "100%",
            letterSpacing: "0%",
            textTransform: "uppercase"
        }}>OFFER ZONE</h3>
        {couponTrigger}
        {(() => {
          const isLocked = !isSilverPendantEligible;
          const needsLogin = isSilverPendantEligible && !user;
          const targetImage = isLocked ? "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/LJ-SLP001.jpg?v=1781353423" : currentEligiblePendant?.image;
          const targetWorth = isLocked ? "₹5,000" : currentEligiblePendant?.worthText;
          const shortfall = 15000 - diamondTotal;
          
          return (
            <div
              className={`flex w-full items-center gap-2.5 sm:gap-3 border border-[#EADFD8] shadow-[0_2px_12px_-4px_rgba(90,65,63,0.10)] transition-colors pr-2.5 sm:pr-3.5 ${isLocked ? 'opacity-80' : ''}`}
              style={{
                borderRadius: "0px 0px 8px 8px",
                borderTop: "0px",
                background: isLocked ? "#FEF9F6" : "linear-gradient(89.31deg, rgb(254, 245, 241) 0%, rgb(241, 228, 209) 100%)",
                paddingTop: 8,
                paddingBottom: 8,
                paddingLeft: 0,
                gap: 0
              }}
            >
              <div
                className={`w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] overflow-hidden shrink-0 ${isLocked ? 'bg-[#f5f0ed]' : 'bg-white'} flex items-center justify-center`}
                style={{ border: 0 }}
              >
                <img
                  src={targetImage}
                  alt="Silver Pendant"
                  className={`w-full h-full object-cover ${isLocked ? 'mix-blend-multiply opacity-60' : ''}`}
                  style={{ border: 0 }}
                />
              </div>
              <div className="min-w-0 flex-1 text-left py-1 sm:py-0">
                <p
                  className="font-figtree font-medium text-sm lg:text-base leading-[1.3] text-[#3D2B28]"
                  style={{ color: "rgb(0, 0, 0)", fontWeight: 500, display: "none", marginBottom: "2px" }}
                >
                  Silver Pendant
                </p>
                <p
                  className={`font-figtree font-normal text-[0.9rem] lg:text-[0.9rem] leading-[1.35] ${isLocked ? 'text-[#6B5B54]' : 'text-[#000000]'}`}
                  style={{ color: isLocked ? "#6B5B54" : "rgb(0, 0, 0)", fontWeight: 500 }}
                >
                  {isLocked 
                    ? <>Add <span className="font-bold text-[#e7000b]">₹{shortfall.toLocaleString('en-IN')}</span> more to unlock a FREE Diamond Pendant worth {targetWorth}.</>
                    : needsLogin
                      ? <>Unlock to claim a FREE Diamond Pendant worth {targetWorth}.</>
                      : <>You&apos;ve unlocked a FREE Diamond Pendant worth {targetWorth}.</>
                  }
                </p>
              </div>
              {isLocked ? (
                <button
                  type="button"
                  disabled
                  className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-3 sm:px-4 lg:px-6 font-figtree font-medium text-[12px] sm:text-[12px] lg:text-[14px] bg-[#EBEBEB] text-[#888888] cursor-not-allowed"
                  style={{ marginLeft: "20px" }}
                >
                  <Lock className="w-3.5 h-3.5 hidden lg:block" />
                  LOCKED
                </button>
              ) : needsLogin ? (
                <button
                  type="button"
                  onClick={() => openLogin()}
                  className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-3 sm:px-4 lg:px-6 font-figtree font-medium text-[12px] sm:text-[12px] lg:text-[14px] bg-[#5A413F] text-white hover:bg-[#4A312F] cursor-pointer"
                  style={{ marginLeft: "20px" }}
                >
                  <Lock className="w-3.5 h-3.5 hidden lg:block" />
                  UNLOCK
                </button>
              ) : isSilverPendantApplied ? (
                <button
                  type="button"
                  onClick={handleToggleSilverPendant}
                  disabled={isSilverPendantLoading || loading}
                  className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-2.5 sm:px-4 lg:px-6 font-figtree font-medium text-[10px] sm:text-[11px] lg:text-[13px] hover:bg-[#e7000b]/10 cursor-pointer disabled:opacity-50"
                  style={{
                    border: "1px solid #e7000b",
                    background: "transparent",
                    color: "#e7000b",
                    marginLeft: "20px"
                  }}
                >
                  {isSilverPendantLoading ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : "REMOVE"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleSilverPendant}
                  disabled={isSilverPendantLoading || loading}
                  className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 rounded-[4px] h-7 sm:h-9 lg:h-10 uppercase tracking-wide transition px-3 sm:px-4 lg:px-6 font-figtree font-medium text-[12px] sm:text-[12px] lg:text-[14px] bg-[#5A413F] text-white hover:bg-[#4A312F] cursor-pointer disabled:opacity-50"
                  style={{ marginLeft: "20px" }}
                >
                  {isSilverPendantLoading ? (
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
        })()}
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
        {goldCoinItem && (
          <div className="flex justify-between items-center font-figtree text-base text-[#000000]">
            <span>Free Gold Coin ({Number(goldCoinItem.quantity || goldCoinItem.qty || 1)})</span>
            <span className="font-semibold text-[#00A63E]">₹ 0</span>
          </div>
        )}
        {silverPendantItem && (
          <div className="flex justify-between items-center font-figtree text-base text-[#000000]">
            <span>{silverPendantItem.title || "Free Silver Pendant"} ({Number(silverPendantItem.quantity || silverPendantItem.qty || 1)})</span>
            <div className="flex items-center gap-2">
              {(Number(silverPendantItem.comparePrice || silverPendantItem.originalPrice || pendantPrice) > 0) && (
                <span className="text-sm text-gray-400 line-through font-normal">
                  ₹ {Number(silverPendantItem.comparePrice || silverPendantItem.originalPrice || pendantPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              )}
              <span className="font-semibold text-[#00A63E]">₹ 0</span>
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
            <span className="font-figtree text-[0.9rem] lg:text-[1.1rem] font-medium text-[#00A63E] block">
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

            {goldCoinItem && (
              <div className="flex justify-between font-figtree text-[0.75rem] text-black mb-2 leading-[1.4]">
                <span>Free Gold Coin ({Number(goldCoinItem.quantity || goldCoinItem.qty || 1)})</span>
                <span className="font-semibold text-[#00A63E]">₹ 0</span>
              </div>
            )}

            {silverPendantItem && (
              <div className="flex justify-between items-center font-figtree text-[0.75rem] text-black mb-2 leading-[1.4]">
                <span>{silverPendantItem.title || "Free Silver Pendant"} ({Number(silverPendantItem.quantity || silverPendantItem.qty || 1)})</span>
                <div className="flex items-center gap-2">
                  {(Number(silverPendantItem.comparePrice || silverPendantItem.originalPrice || pendantPrice) > 0) && (
                    <span className="text-[0.625rem] text-gray-400 line-through font-normal">
                      ₹ {Number(silverPendantItem.comparePrice || silverPendantItem.originalPrice || pendantPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  )}
                  <span className="font-semibold text-[#00A63E]">₹ 0</span>
                </div>
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
              <span className="font-figtree text-[0.9rem] lg:text-[1.1rem] font-medium text-[#00A63E] block">
                You will save <span className="font-semibold no-underline">₹{totalSavingsBanner.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> on this order
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Offers Group (Gold Coin, Insurance) - ALL BELOW SUMMARY */}
      <div className="lg:hidden space-y-6">
        <div className="space-y-4">
          <GoldCoinOption />
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
        
        <GoldCoinOption />

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
              if (e.key === "Enter" && couponCode.trim() && !isApplying && !appliedCoupon && !isSilverPendantApplied) handleApplyCoupon();
            }}
            disabled={!!appliedCoupon || isSilverPendantApplied}
            placeholder={isSilverPendantApplied ? "Disabled due to Free Silver Pendant" : "Enter Coupon Code"}
            className="h-12 flex-1 rounded-sm border-[#EADFD8] bg-white font-figtree text-sm font-semibold tracking-[0.1em] uppercase text-[#3D2B28] placeholder:text-[#B9A79E] placeholder:font-medium placeholder:tracking-normal placeholder:normal-case focus-visible:ring-2 focus-visible:ring-[#5A413F]/30 focus-visible:border-[#5A413F] disabled:opacity-55"
          />
          <Button
            onClick={() => handleApplyCoupon()}
            disabled={isApplying || !couponCode.trim() || !!appliedCoupon || isSilverPendantApplied}
            className="h-12 shrink-0 rounded-sm bg-[#5A413F] hover:bg-[#4A3533] px-5 font-figtree uppercase font-semibold tracking-[0.1em] text-xs text-white transition-colors disabled:opacity-50"
          >
            {isApplying && !applyingCode ? <Loader2 className="animate-spin" /> : "Apply"}
          </Button>
        </div>

        {appliedCoupon && (
          <div className="flex items-center justify-between gap-3 rounded-sm border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5">
            <p className="font-figtree text-xs font-medium leading-[1.4] text-emerald-700">
              Only one coupon can be used at a time.
            </p>
            <button
              onClick={handleRemoveCoupon}
              className="shrink-0 font-figtree text-[0.6875rem] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {isSilverPendantApplied && !appliedCoupon && (
          <div className="flex items-center justify-between gap-3 rounded-sm border border-amber-200 bg-amber-50/70 px-3.5 py-2.5">
            <p className="font-figtree text-xs font-medium leading-[1.4] text-[#3D2B28]">
              Coupons cannot be applied while the Free Silver Pendant is claimed.
            </p>
            <button
              onClick={() => {
                setIsCouponDrawerOpen(false);
                handleToggleSilverPendant();
              }}
              className="shrink-0 font-figtree text-[0.6875rem] font-bold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
            >
              Remove Pendant
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
            <p className="font-figtree text-xs md:text-sm text-[#000000] mb-4">
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
              className="h-11 px-6 rounded-sm bg-[#5A413F] hover:bg-[#4A3533] font-figtree uppercase font-semibold tracking-wide text-xs text-white transition-colors cursor-pointer"
            >
              Login / Register
            </Button>
          </div>
        ) : (
          <>
            {/* Every card is disabled — say why rather than leaving a dead list */}
            {!appliedCoupon && applicableCouponCodes.length === 0 && items.length > 0 && (
              <div className="rounded-sm border border-[#EADFD8] bg-white px-3.5 py-2.5">
                <p className="font-figtree text-xs font-medium leading-[1.4] text-[#000000]">
                  These coupons apply to diamond products only. Add a diamond product to unlock them.
                </p>
              </div>
            )}

            {/* The same coupon ladder the PDP shows, in the same card design */}
            {(() => {
              const baseCoupons = [...COUPONS];
              const allApplicable = [...applicableCouponCodes];

              const referenceOrder = [...baseCoupons];

              return baseCoupons
                .sort((a, b) => {
                  const aApp = allApplicable.includes(a.code);
                  const bApp = allApplicable.includes(b.code);

                  if (aApp && !bApp) return -1;
                  if (!aApp && bApp) return 1;

                  if (aApp && bApp) {
                     return referenceOrder.findIndex(c => c.code === b.code) - referenceOrder.findIndex(c => c.code === a.code);
                  }
                  return referenceOrder.findIndex(c => c.code === a.code) - referenceOrder.findIndex(c => c.code === b.code);
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
                      appliedCode={appliedCoupon ? couponDetails.code : null}
                      isApplicable={allApplicable.includes(coupon.code)}
                      disabled={isSilverPendantApplied}
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
