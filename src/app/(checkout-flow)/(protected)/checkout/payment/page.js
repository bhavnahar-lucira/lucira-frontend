"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CheckoutSummary from "@/components/cart/CheckoutSummary";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  clearCart,
  removePoints,
  removeCoupon,
  applyCoupon,
  applyPoints,
  repriceCartForCheckout,
} from "@/redux/features/cart/cartSlice";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  apiFetch,
  completeRazorpayPayment,
  createRazorpayOrder,
} from "@/lib/api";
import { getCookie } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { toast } from "react-toastify";
import { pushAddPaymentInfo } from "@/lib/gtm";
import { sendCheckoutCrmEvent } from "@/lib/checkout-crm";
import { calculateCouponDiscount } from "@/lib/coupons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useCustomerAddresses } from "@/hooks/checkout/useCustomerAddresses";
import { useBillingAddress } from "@/hooks/checkout/useBillingAddress";


const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";
const SILVER_PENDANT_VARIANT_ID = "gid://shopify/ProductVariant/48052809498842";

function formatAddressPreview(address) {
  if (!address) return "";

  return [
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(" "),
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function getCartSessionId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("cart_session_id") || "";
}

function normalizePhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const router = useRouter();
  const dispatch = useDispatch();

  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState("razorpay");
  const [paymentLoading, setPaymentLoading] = useState(false);
  // Seeded from the cart, not localStorage: the PDP offer popup sets the claim flag
  // without adding the gift, which made the pendant appear here when it was never added.
  const [isSilverPendantClaimed, setIsSilverPendantClaimed] = useState(false);
  const [pendantPrice, setPendantPrice] = useState(0);

  useEffect(() => {
    apiFetch(`/api/products/pricing?variantId=${SILVER_PENDANT_VARIANT_ID.split('/').pop()}`, { suppressErrorLog: true })
      .then(data => {
        const p = Number(data?.price || data?.compare_price || 0);
        if (p > 0) setPendantPrice(p);
      })
      .catch(err => console.error("Error fetching pendant price in payment:", err));
  }, []);
  const [checkoutSelection, setCheckoutSelection] = useState(null);
  const summaryRef = useRef(null);
  const summaryBreakdownRef = useRef(null);

  const scrollToSummary = () => {
    // Land on the price breakdown rather than the top of the section, which sits above
    // the items and offers. Falls back to the section if the breakdown isn't rendered.
    const target = summaryBreakdownRef.current || summaryRef.current;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const { user, accessToken } = useSelector((state) => state.user);
  const { items, totalAmount, appliedCoupon, nectorPoints } = useCart();

  const { addresses, customer, selectedAddressId, selectedAddress, loadingAddresses } = useCustomerAddresses({ accessToken, user });
  const { selectedBillingAddress } = useBillingAddress({
    accessToken,
    addresses,
    loadingAddresses,
    selectedAddressId,
    selectedAddress,
  });

  const diamondTotalForOffer = useMemo(() => {
    return (items || []).reduce((acc, item) => {
      const type = (item.type || item.productType || item.product_type || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const hasDiamondCharges = !!item.diamondCharges || (item.customAttributes?.some(attr => attr.key === "_Diamond Charges" && attr.value));

      const isDiamond = type.includes("diamond") || title.includes("diamond") ||
                        type.includes("solitaire") || title.includes("solitaire") ||
                        type.includes("gemstone") || title.includes("gemstone") ||
                        hasDiamondCharges;

      const isGoldCoin = item.variantId === "gid://shopify/ProductVariant/47753346973914" || item.variantId === "gid://shopify/ProductVariant/47661824082138";
      const isSilverPendant = item.variantId === SILVER_PENDANT_VARIANT_ID;
      const isInsurance = item.variantId === INSURANCE_VARIANT_ID;
      const isBYJ = Boolean(
        item.properties?.['_byj_group_id'] ||
        item.properties?.['_byj_preview'] ||
        item.properties?.['_byj_parent'] ||
        item.properties?.[' _byj_parent'] ||
        item.tags?.includes('BYJ') ||
        String(item.handle || "").toLowerCase().includes('byj') ||
        String(item.title || "").toLowerCase().includes('byj')
      );

      if (isDiamond && !isGoldCoin && !isSilverPendant && !isInsurance && !isBYJ) {
        return acc + (Number(item.price || 0) * Number(item.quantity || 1));
      }
      return acc;
    }, 0);
  }, [items]);

  const isEligibleForPendant = diamondTotalForOffer >= 30000 && !appliedCoupon;

  useEffect(() => {
    const claimed = isEligibleForPendant && (items || []).some(item => item.variantId === SILVER_PENDANT_VARIANT_ID);
    setIsSilverPendantClaimed(claimed);
    if (!claimed && typeof window !== "undefined") localStorage.removeItem("isSilverPendantClaimed");
  }, [items, appliedCoupon, isEligibleForPendant]);

  const checkoutItems = useMemo(() => {
    // ALWAYS remove any persistent pendant first to prevent duplicates/persistence
    const baseItems = (items || []).filter(item => item.variantId !== SILVER_PENDANT_VARIANT_ID);

    if (!isEligibleForPendant || !isSilverPendantClaimed) return baseItems;

    return [
      ...baseItems,
      {
        variantId: SILVER_PENDANT_VARIANT_ID,
        quantity: 1,
        price: 0,
        finalPrice: 0,
        originalPrice: pendantPrice || 0,
        comparePrice: pendantPrice || 0,
        title: "Free Silver Pendant",
        isFreeGift: true,
        image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/ChatGPT_Image_Aug_3_2026_01_42_46_PM.png?v=1785745617"
      }
    ];
  }, [items, isSilverPendantClaimed, isEligibleForPendant, pendantPrice]);

  const finalAmount = useMemo(() => {
    const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
    const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
    const subtotalValue = (totalAmount || 0) - insuranceValue;

    const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotalValue);

    const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
    return subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;
  }, [items, totalAmount, appliedCoupon, nectorPoints]);

  const isPickup = checkoutSelection?.deliveryMethod === "pickup";
  const isIndiaShipping = (selectedAddress?.country || "").trim().toLowerCase() === "india";

  // Remove points when leaving the payment page to prevent stale points
  useEffect(() => {
    return () => {
      dispatch(removePoints());
    };
  }, [dispatch]);

  useEffect(() => {
    const checkDelivery = async () => {
      if (typeof window === "undefined") return;

      const selectionStr = localStorage.getItem("checkout_selection");
      if (!selectionStr) {
        router.push("/checkout/shipping");
        return;
      }

      const selection = JSON.parse(selectionStr);
      if (selection.deliveryMethod === "ship" && selection.selectedAddress?.zip) {
        try {
          const data = await apiFetch(`/api/pincodes/check?pincode=${selection.selectedAddress.zip.trim()}`);
          if (!data.deliverable) {
            toast.error("We are not delivering to this pincode. Redirecting to shipping...");
            router.push("/checkout/shipping");
          }
        } catch (err) {
          console.error("Payment page pincode check error:", err);
        }
      }
    };
    checkDelivery();
  }, [router]);

  const partialCodDetails = useMemo(() => {
    const total = Math.max(0, Number(finalAmount || 0));

    const hasGoldCoin = items?.length > 0 && items.some(item =>
      item.variantId === GOLDCOIN_VARIANT_ID ||
      (item.handle && item.handle.includes("gold-coin")) ||
      (item.type && item.type.toLowerCase() === "gold coin") ||
      (item.title && item.title.toLowerCase().includes("gold coin"))
    );

    const isEligible = total > 0 && total < 50000 && !hasGoldCoin;
    const prepaidAmount = isEligible ? total * 0.2 : 0;
    const codAmount = isEligible ? total - prepaidAmount : 0;

    return {
      isEligible,
      prepaidAmount: Math.round(prepaidAmount),
      codAmount: Math.round(codAmount),
    };
  }, [finalAmount, items]);

  const paymentGateways = useMemo(() => {
    const gateways = [
      {
        id: "razorpay",
        name: "Razorpay Secure (UPI, Cards, Int'l Cards, Wallets)",
        amount: finalAmount,
      },
    ];

    if (partialCodDetails.isEligible) {
      gateways.push({
        id: "partial_cod",
        name: "Partial COD",
        amount: partialCodDetails.prepaidAmount,
      });
    }

    return gateways;
  }, [finalAmount, partialCodDetails]);

  const selectedPayableAmount = selectedPaymentGateway === "partial_cod"
    ? partialCodDetails.prepaidAmount
    : finalAmount;

  useEffect(() => {
    if (selectedPaymentGateway === "partial_cod" && !partialCodDetails.isEligible) {
      setSelectedPaymentGateway("razorpay");
    }
  }, [partialCodDetails.isEligible, selectedPaymentGateway]);

  useEffect(() => {
    if (nectorPoints) {
      const hasDiamondJewellery = items.some(item => {
        const type = (item.type || item.productType || item.product_type || "").toLowerCase();
        const title = (item.title || "").toLowerCase();
        const hasDiamondCharges = !!item.diamondCharges || (item.customAttributes?.some(attr => attr.key === "_Diamond Charges" && attr.value));

        return type.includes("diamond") || title.includes("diamond") ||
          type.includes("solitaire") || title.includes("solitaire") ||
          type.includes("gemstone") || title.includes("gemstone") ||
          hasDiamondCharges;
      });

      if (!hasDiamondJewellery) {
        dispatch(removePoints());
        toast.info("Loyalty points removed as diamond jewellery is no longer in cart.", {
          toastId: "points-removed-safety"
        });
      }
    }
  }, [items, nectorPoints, dispatch]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("checkout_selection");
      if (stored) {
        setCheckoutSelection(JSON.parse(stored));
      }
    }
  }, []);

  const handlePayNow = async () => {
    if (selectedPaymentGateway === "partial_cod" && !partialCodDetails.isEligible) {
      toast.info("Partial COD is available only below ₹50,000 cart value.");
      return;
    }

    const isPickup = checkoutSelection?.deliveryMethod === "pickup";

    if (!isPickup && !selectedAddress) {
      toast.error("Please choose a shipping address before payment.");
      return;
    }

    if (!selectedBillingAddress) {
      toast.error("Please choose a billing address before payment.");
      return;
    }

    try {
      // Trigger CRM Webhook for Add Payment Info on click
      sendCheckoutCrmEvent("add_payment_info", {
        email: customer?.email || user?.email || checkoutSelection?.customerEmail || "",
        mobile: customer?.phone || user?.mobile || selectedAddress?.phone || "",
        firstName: customer?.firstName || user?.name?.split(' ')[0] || "",
        lastName: customer?.lastName || user?.name?.split(' ')[1] || "",
        totalCartValue: Number(finalAmount),
        cartItems: checkoutItems,
        paymentType: selectedPaymentGateway === "partial_cod" ? "Partial COD" : "Razorpay",
        billingPincode: selectedBillingAddress?.zip || "",
        billingCity: selectedBillingAddress?.city || "",
        billingState: selectedBillingAddress?.province || "",
        shippingPincode: isPickup ? checkoutSelection?.selectedStore?.zip : (selectedAddress?.zip || ""),
        shippingCity: isPickup ? checkoutSelection?.selectedStore?.city : (selectedAddress?.city || ""),
        shippingState: isPickup ? (checkoutSelection?.selectedStore?.state || checkoutSelection?.selectedStore?.province) : (selectedAddress?.province || "")
      });

      setPaymentLoading(true);

      const getNumericId = (gid) => {
        if (!gid) return 0;
        if (typeof gid === 'number') return gid;
        const match = String(gid).match(/\d+$/);
        return match ? Number(match[0]) : 0;
      };

      const filteredItemsForGtm = (items || []).filter(
        (item) =>
          item.variantId !== INSURANCE_VARIANT_ID &&
          !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
          !item.properties?.['_byj_parent'] &&
          !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
      );

      const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
      const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
      const subtotalValue = (totalAmount || 0) - insuranceValue;

      const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
      const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotalValue);

      const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
      const grandTotalValue = subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;
      const paymentMethodDetails = selectedPaymentGateway === "partial_cod"
        ? {
          type: "partial_cod",
          prepaidAmount: partialCodDetails.prepaidAmount,
          codAmount: partialCodDetails.codAmount,
          grandTotal: grandTotalValue,
        }
        : {
          type: "razorpay",
          prepaidAmount: grandTotalValue,
          codAmount: 0,
          grandTotal: grandTotalValue,
        };
      const loyaltyPoints = appliedCoupon?.loyaltyPoints || "";

      const purchaseDataForLater = {
        currency: "INR",
        value: grandTotalValue,
        tax: Number((grandTotalValue * 0.03).toFixed(2)),
        shipping: 0,
        affiliation: "Lucira Jewelry",
        transaction_id: `temp_${Date.now()}`,
        coupon: couponDetails?.code || "NA",
        send_to: "G-K6H0NZ4YJ8",
        items: checkoutItems.map((item, idx) => {
          const lowerTitle = (item.title || "").toLowerCase();
          let category = item.type || item.productType || "";
          if (!category) {
            if (lowerTitle.includes("ring")) category = "Rings";
            else if (lowerTitle.includes("earring") || lowerTitle.includes("bali")) category = "Earrings";
            else if (lowerTitle.includes("pendant")) category = "Pendants";
            else if (lowerTitle.includes("bracelet")) category = "Bracelets";
            else if (item.variantId === GOLDCOIN_VARIANT_ID) category = "Gold Coin";
            else if (item.variantId === INSURANCE_VARIANT_ID) category = "Insurance";
            else if (item.variantId === SILVER_PENDANT_VARIANT_ID) category = "Silver Pendant";
          }

          return {
            item_id: getNumericId(item.productId || item.shopifyId || item.id),
            variant_id: getNumericId(item.variantId),
            item_name: item.title,
            price: Number(item.price || 0),
            item_brand: "Lucira Jewelry",
            item_category: "",
            category: category,
            item_variant: item.variantTitle || "",
            quantity: item.quantity,
            index: idx
          };
        })
      };
      window.localStorage.setItem("gtm_purchase_data", JSON.stringify(purchaseDataForLater));

      pushAddPaymentInfo({
        payment_type: selectedPaymentGateway === "partial_cod" ? "Partial COD" : "Razorpay",
        value: paymentMethodDetails.prepaidAmount,
        currency: "INR",
        coupon: couponDetails?.code || "NA",
        loyalty_points: loyaltyPoints,
        send_to: "G-K6H0NZ4YJ8",
        items: checkoutItems.map((item, idx) => {
          const lowerTitle = (item.title || "").toLowerCase();
          let category = item.type || item.productType || "";
          if (!category) {
            if (lowerTitle.includes("ring")) category = "Rings";
            else if (lowerTitle.includes("earring") || lowerTitle.includes("bali")) category = "Earrings";
            else if (lowerTitle.includes("pendant")) category = "Pendants";
            else if (lowerTitle.includes("bracelet")) category = "Bracelets";
            else if (item.variantId === GOLDCOIN_VARIANT_ID) category = "Gold Coin";
            else if (item.variantId === INSURANCE_VARIANT_ID) category = "Insurance";
            else if (item.variantId === SILVER_PENDANT_VARIANT_ID) category = "Silver Pendant";
          }

          return {
            item_id: getNumericId(item.productId || item.shopifyId || item.id),
            variant_id: getNumericId(item.variantId),
            item_name: item.title,
            item_variant: item.variantTitle || "",
            item_brand: "Lucira Jewelry",
            item_category: "",
            price: Number(item.price || 0),
            quantity: item.quantity,
            category: category,
            index: idx
          };
        })
      });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

      const customerName =
        customer?.firstName || customer?.lastName
          ? [customer?.firstName, customer?.lastName].filter(Boolean).join(" ")
          : user?.name || "Lucira Customer";

      const order = await createRazorpayOrder({
        userId: user?.id || "",
        context: process.env.NODE_ENV === 'development' ? 'localhost' : 'storefront',
        sessionId: getCartSessionId(),
        items: checkoutItems,
        customer: {
          name: customerName,
          email: customer?.email || user?.email || checkoutSelection?.customerEmail || "",
          phone: normalizePhone(customer?.phone || user?.mobile || selectedAddress?.phone || ""),
        },
        shippingAddress: isPickup ? checkoutSelection.selectedStore : selectedAddress,
        billingAddress: selectedBillingAddress,
        appliedCoupon: appliedCoupon ? {
          ...couponDetails,
          value: couponDiscountAmount,
          valueType: "FIXED_AMOUNT"
        } : null,
        nectorPoints: nectorPoints,
        paymentMethod: paymentMethodDetails,
        amount: paymentMethodDetails.prepaidAmount, // Use the correct calculated amount
        gclid: getCookie("gclid") || "",
      }, accessToken);

      // Razorpay collects the draft-order total, which the server rebuilds from
      // the live metal rates and re-validated discounts. If that lands anywhere
      // other than the total on screen, stop: re-sync to the server's numbers and
      // let the customer see them before paying. Reconciling the discount here is
      // what keeps this from looping — otherwise a coupon the server rejected
      // would fail the same check on every retry.
      const serverPricing = order?.pricing;
      const serverGrandTotal = Number(serverPricing?.grandTotal ?? order?.paymentMethod?.grandTotal);

      if (Number.isFinite(serverGrandTotal) && Math.round(serverGrandTotal) !== Math.round(grandTotalValue)) {
        console.warn(
          `[payment] Total mismatch — shown ₹${grandTotalValue}, server ₹${serverGrandTotal}. Re-syncing.`
        );

        if (serverPricing) {
          const serverCoupon = Number(serverPricing.couponDiscount || 0);
          const serverPoints = Number(serverPricing.pointsDiscount || 0);

          if (appliedCoupon && serverCoupon !== couponDiscountAmount) {
            if (serverCoupon > 0) {
              // Pin to the amount the server honoured, as a flat value.
              dispatch(applyCoupon({ ...couponDetails, value: serverCoupon, valueType: "FIXED_AMOUNT", restricted: false, applicableItemIds: [] }));
            } else {
              dispatch(removeCoupon());
              toast.info(`Coupon ${couponDetails?.code || ""} is no longer valid for this order.`);
            }
          }

          if (nectorPoints && serverPoints !== pointsDiscountAmount) {
            if (serverPoints > 0) dispatch(applyPoints({ ...nectorPoints, fiat_value: serverPoints }));
            else {
              dispatch(removePoints());
              toast.info("Your loyalty points could not be applied to this order.");
            }
          }
        }

        await dispatch(repriceCartForCheckout({ userId: user?.id }));

        toast.info("Your total has been updated to today's live rates. Please review it and pay again.");
        scrollToSummary();
        return;
      }

      const razorpay = new window.Razorpay({
        key: order.key,
        name: "Lucira",
        description: "Complete your order securely",
        order_id: order.orderId,
        handler: async function handleSuccess(response) {
          try {
            setPaymentLoading(true);

            const getNumericId = (gid) => {
              if (!gid) return 0;
              if (typeof gid === 'number') return gid;
              const match = String(gid).match(/\d+$/);
              return match ? Number(match[0]) : 0;
            };

            const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
            const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
            const subtotalValue = (totalAmount || 0) - insuranceValue;

            const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
            const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotalValue);

            const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
            const grandTotalValue = subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;
            const purchaseValue = selectedPaymentGateway === "partial_cod"
              ? partialCodDetails.prepaidAmount
              : grandTotalValue;

            const purchaseData = {
              currency: "INR",
              value: purchaseValue,
              tax: Number((purchaseValue * 0.03).toFixed(2)),
              shipping: 0,
              affiliation: "Lucira Jewelry",
              transaction_id: response.razorpay_payment_id,
              coupon: couponDetails?.code || "NA",
              send_to: "G-K6H0NZ4YJ8",
              items: checkoutItems.map((item, idx) => {
                const lowerTitle = (item.title || "").toLowerCase();
                let category = item.type || item.productType || "";
                if (!category) {
                  if (lowerTitle.includes("ring")) category = "Rings";
                  else if (lowerTitle.includes("earring") || lowerTitle.includes("bali")) category = "Earrings";
                  else if (lowerTitle.includes("pendant")) category = "Pendants";
                  else if (lowerTitle.includes("bracelet")) category = "Bracelets";
                  else if (item.variantId === GOLDCOIN_VARIANT_ID) category = "Gold Coin";
                  else if (item.variantId === INSURANCE_VARIANT_ID) category = "Insurance";
                  else if (item.variantId === SILVER_PENDANT_VARIANT_ID) category = "Silver Pendant";
                }

                return {
                  item_id: getNumericId(item.productId || item.shopifyId || item.id),
                  variant_id: getNumericId(item.variantId),
                  item_name: item.title,
                  price: Number(item.price || 0),
                  item_brand: "Lucira Jewelry",
                  item_category: category,
                  // category: category,
                  item_variant: item.variantTitle || "",
                  quantity: item.quantity,
                  index: idx
                };
              })
            };

            window.localStorage.setItem("gtm_purchase_data", JSON.stringify(purchaseData));

            const completion = await completeRazorpayPayment({
              userId: user?.id || "",
              sessionId: getCartSessionId(),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              draftId: order.draftId,
              byj_image: items.find(item => item.properties?.['byj_image'])?.properties?.['byj_image'] || items.find(item => item.properties?.['_byj_preview'])?.properties?.['_byj_preview'] || "",
        byj_preview: items.find(item => item.properties?.['byj_image'])?.properties?.['byj_image'] || items.find(item => item.properties?.['_byj_preview'])?.properties?.['_byj_preview'] || "",
        metafields: [
          {
            namespace: "custom",
            key: "byj_image",
            value: items.find(item => item.properties?.['byj_image'])?.properties?.['byj_image'] || items.find(item => item.properties?.['_byj_preview'])?.properties?.['_byj_preview'] || "",
            type: "file_reference"
          }
        ],
        order_metafields: {
          "custom.byj_image": items.find(item => item.properties?.['byj_image'])?.properties?.['byj_image'] || items.find(item => item.properties?.['_byj_preview'])?.properties?.['_byj_preview'] || ""
        },
        "custom.byj_image": items.find(item => item.properties?.['byj_image'])?.properties?.['byj_image'] || items.find(item => item.properties?.['_byj_preview'])?.properties?.['_byj_preview'] || "",
              customer: {
                id: customer?.id || "",
                name: customerName,
                email: customer?.email || user?.email || checkoutSelection?.customerEmail || "",
                phone: normalizePhone(customer?.phone || user?.mobile || selectedAddress?.phone || ""),
              },
              shippingAddress: isPickup ? checkoutSelection.selectedStore : selectedAddress,
              billingAddress: selectedBillingAddress,
              appliedCoupon: appliedCoupon ? {
                ...couponDetails,
                value: couponDiscountAmount,
                valueType: "FIXED_AMOUNT"
              } : null,
              nectorPoints: nectorPoints, // Pass points for completion attributes
              paymentMethod: order.paymentMethod || paymentMethodDetails,
              cartItems: checkoutItems, // Pass items explicitly as fallback for backend
              gclid: getCookie("gclid") || "",
            }, accessToken);

            toast.success(
              completion?.shopifyOrderName
                ? `Order placed successfully: ${completion.shopifyOrderName}`
                : "Order placed successfully"
            );

            // Wait a moment for any background processes or toast to be visible
            setTimeout(() => {
              const successUrl = completion?.shopifyOrderName
                ? `/success?orderName=${encodeURIComponent(completion.shopifyOrderName)}`
                : "/success";
              router.replace(successUrl);
            }, 500);
          } catch (completionError) {
            toast.error(completionError.message || "Payment succeeded but order creation failed");
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment window closed.");
          },
          confirm_close: true,
        },
        prefill: {
          name: order.customer?.name || customerName,
          email: order.customer?.email || checkoutSelection?.customerEmail || "",
          contact: order.customer?.phone || order.customer?.contact || normalizePhone(customer?.phone || user?.mobile || selectedAddress?.phone || ""),
          method: "upi",
        },
        notes: {
          shipping_address: isPickup ? checkoutSelection.selectedStore?.address : formatAddressPreview(selectedAddress),
          billing_address: formatAddressPreview(selectedBillingAddress),
          shipping_gstin: selectedAddress?.gstin || "",
          billing_gstin: selectedBillingAddress?.gstin || "",
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                methods: ["vpa", "qr"],
              },
            },
            sequence: ["block.upi", "block.cards", "block.netbanking"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: "#111111",
        },
        retry: {
          enabled: false,
        },
      });

      razorpay.on("payment.failed", function handleFailure(response) {
        const reason =
          response?.error?.description ||
          response?.error?.reason ||
          "Payment failed. Please try again.";

        const getNumericId = (gid) => {
          if (!gid) return 0;
          if (typeof gid === 'number') return gid;
          const match = String(gid).match(/\d+$/);
          return match ? Number(match[0]) : 0;
        };

        const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
        const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
        const subtotalValue = (totalAmount || 0) - insuranceValue;

        const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
        const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, items, subtotalValue);

        const grandTotalValue = subtotalValue + insuranceValue - couponDiscountAmount;

        const failureData = {
          currency: "INR",
          value: grandTotalValue,
          error_message: reason,
          coupon: couponDetails?.code || "NA",
          send_to: "G-K6H0NZ4YJ8",
          items: checkoutItems.map((item, idx) => {
            const lowerTitle = (item.title || "").toLowerCase();
            let category = item.type || item.productType || "";
            if (!category) {
              if (lowerTitle.includes("ring")) category = "Rings";
              else if (lowerTitle.includes("earring") || lowerTitle.includes("bali")) category = "Earrings";
              else if (lowerTitle.includes("pendant")) category = "Pendants";
              else if (lowerTitle.includes("bracelet")) category = "Bracelets";
              else if (item.variantId === GOLDCOIN_VARIANT_ID) category = "Gold Coin";
              else if (item.variantId === INSURANCE_VARIANT_ID) category = "Insurance";
              else if (item.variantId === SILVER_PENDANT_VARIANT_ID) category = "Silver Pendant";
            }

            return {
              item_id: getNumericId(item.productId || item.shopifyId || item.id),
              item_name: item.title,
              item_variant: item.variantTitle || "",
              item_brand: "Lucira Jewelry",
              item_category: "",
              price: Number(item.price || 0),
              quantity: item.quantity,
              category: category,
              index: idx
            };
          })
        };

        window.localStorage.setItem("gtm_payment_failure_data", JSON.stringify(failureData));
        router.push("/failure");
      });

      razorpay.open();
    } catch (error) {
      toast.error(error.message || "Unable to start payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const shipToChangeHref = `/checkout/shipping?method=${isPickup ? "pickup" : "ship"}`;

  return (
    <div className="bg-white min-h-screen overflow-x-clip">
      <div className="container-main relative z-10">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

          {/* Main Content Area (60%) */}
          <div className="grow lg:basis-[60%] lg:shrink-0 py-10 px-0 lg:pr-12 space-y-10 bg-white">

            {/* MOBILE ONLY ORDER */}
            {!isDesktop && (
              <div className="space-y-10 px-4">
                {/* 1. Lucira Coins Balance */}
                <CheckoutSummary
                  showItems={false}
                  showBreakdown={false}
                  showContact={false}
                  isSilverPendantClaimed={isSilverPendantClaimed}
                  onToggleSilverPendant={() => setIsSilverPendantClaimed(!isSilverPendantClaimed)}
                />

                {/* 2. Payment options */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-abhaya font-bold text-zinc-900">Payment</h2>
                    <p className="text-sm font-figtree text-zinc-500">All transactions are secure and encrypted.</p>
                  </div>
                  <RadioGroup value={selectedPaymentGateway} onValueChange={setSelectedPaymentGateway} className="grid gap-0 border border-zinc-200 rounded-lg overflow-hidden bg-white">
                    {paymentGateways.map((gateway, index) => (
                      <div key={gateway.id} className={`flex flex-col ${index < paymentGateways.length - 1 ? "border-b border-zinc-100" : ""}`}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPaymentGateway(gateway.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedPaymentGateway(gateway.id);
                            }
                          }}
                          className={`p-5 flex ${gateway.id === "partial_cod" ? "flex-row gap-3" : "flex-col md:flex-row gap-4 md:gap-0"} items-center justify-between transition-all cursor-pointer ${selectedPaymentGateway === gateway.id ? "bg-accent/15" : "bg-white"}`}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={gateway.id} id={`m-${gateway.id}`} className="text-[#005BD3] border-zinc-300" />
                            <Label htmlFor={`m-${gateway.id}`} className="font-medium text-zinc-900 cursor-pointer">{gateway.name}</Label>
                          </div>
                          <div className={`flex items-center gap-3 ${gateway.id === "partial_cod" ? "shrink-0" : ""}`}>
                            <span className="text-sm font-bold text-zinc-900">₹{Number(gateway.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            {gateway.id === "razorpay" ? (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1 items-center bg-white px-2 py-1 rounded border border-zinc-100">
                                  <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_upi.svg" className="h-3 w-auto opacity-70" alt="UPI" width={36} height={12} unoptimized />
                                </div>
                                <div className="flex gap-1 items-center bg-white px-2 py-1 rounded border border-zinc-100">
                                  <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_visa.svg" className="h-2 w-auto opacity-70" alt="VISA" width={36} height={8} unoptimized />
                                </div>
                                <div className="flex gap-1 items-center bg-white px-2 py-1 rounded border border-zinc-100">
                                  <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_mastercard.svg" className="h-3 w-auto opacity-70" alt="MASTERCARD" width={36} height={12} unoptimized />
                                </div>
                                <span className="text-[10px] text-zinc-400 font-bold">+18</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-zinc-500">
                                COD ₹{partialCodDetails.codAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* 3. Order Summary */}
                <div ref={summaryRef} className="scroll-mt-16">
                  <CheckoutSummary
                    showPoints={false}
                    showContact={false}
                    isSilverPendantClaimed={isSilverPendantClaimed}
                    onToggleSilverPendant={() => setIsSilverPendantClaimed(!isSilverPendantClaimed)}
                    showSilverPendantOffer={false}
                    breakdownRef={summaryBreakdownRef}
                  />
                </div>

                {/* 4. Contact, Ship to, Bill to section */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  <div className="p-4 grid grid-cols-[100px_1fr] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">Contact</span>
                    <span className="text-zinc-900 font-medium truncate">{customer?.email || checkoutSelection?.customerEmail || ""}</span>
                  </div>
                  <div className="p-4 grid grid-cols-[100px_1fr_60px] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">{isPickup ? "Pickup" : "Ship to"}</span>
                    <div className="text-zinc-900 font-medium">
                      {isPickup ? (
                        <div className="space-y-1">
                          <p className="font-bold">{checkoutSelection?.selectedStore?.code || checkoutSelection?.selectedStore?.name}</p>
                          <p className="line-clamp-2 text-zinc-600 font-normal">{checkoutSelection?.selectedStore?.address}</p>
                        </div>
                      ) : selectedAddress ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2">{formatAddressPreview(selectedAddress)}</p>
                          {selectedAddress.gstin && <p className="text-sm font-semibold">GSTIN: {selectedAddress.gstin}</p>}
                        </div>
                      ) : (
                        <p>No shipping address selected</p>
                      )}
                    </div>
                    <Link prefetch={false} href={shipToChangeHref} className="text-black font-semibold text-right underline">Change</Link>
                  </div>
                  <div className="p-4 grid grid-cols-[100px_1fr_60px] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">Bill to</span>
                    <div className="text-zinc-900 font-medium">
                      {selectedBillingAddress ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2">{formatAddressPreview(selectedBillingAddress)}</p>
                          {selectedBillingAddress.gstin && <p className="text-sm font-semibold">GSTIN: {selectedBillingAddress.gstin}</p>}
                        </div>
                      ) : (
                        <p>No billing address selected</p>
                      )}
                    </div>
                    <Link prefetch={false} href={shipToChangeHref} className="text-black font-semibold text-right underline">Change</Link>
                  </div>
                  <div className="p-4 grid grid-cols-[100px_1fr] items-center gap-4 text-sm">
                    <span className="text-zinc-500 whitespace-nowrap">{isPickup ? "Method" : "Shipping"}</span>
                    <span className="text-zinc-900 font-medium">
                      {isPickup ? "Pickup" : "Shipping Rate"} · <span className="font-bold">{isPickup || isIndiaShipping ? "FREE" : "Calculated at next step"}</span>
                    </span>
                  </div>
                </div>

                {/* 5. CONTACT US FOR ASSISTANCE */}
                <CheckoutSummary showItems={false} showBreakdown={false} showPoints={false} showSilverPendantOffer={false} />
              </div>
            )}

            {/* DESKTOP ONLY ORDER */}
            {isDesktop && (
              <div className="space-y-10">
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  <div className="p-4 grid grid-cols-[140px_1fr] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">Contact</span>
                    <span className="text-zinc-900 font-medium truncate">{customer?.email || checkoutSelection?.customerEmail || ""}</span>
                  </div>
                  <div className="p-4 grid grid-cols-[140px_1fr_60px] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">{isPickup ? "Pickup location" : "Ship to"}</span>
                    <div className="text-zinc-900 font-medium">
                      {isPickup ? (
                        <div className="space-y-1">
                          <p className="font-bold">{checkoutSelection?.selectedStore?.code || checkoutSelection?.selectedStore?.name}</p>
                          <p className="line-clamp-2 text-zinc-600 font-normal">{checkoutSelection?.selectedStore?.address}</p>
                        </div>
                      ) : selectedAddress ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2">{formatAddressPreview(selectedAddress)}</p>
                          {selectedAddress.gstin && <p className="text-sm font-semibold">GSTIN: {selectedAddress.gstin}</p>}
                        </div>
                      ) : (
                        <p>No shipping address selected</p>
                      )}
                    </div>
                    <Link prefetch={false} href={shipToChangeHref} className="text-black font-semibold text-right underline">Change</Link>
                  </div>
                  <div className="p-4 grid grid-cols-[140px_1fr_60px] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">Bill to</span>
                    <div className="text-zinc-900 font-medium">
                      {selectedBillingAddress ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2">{formatAddressPreview(selectedBillingAddress)}</p>
                          {selectedBillingAddress.gstin && <p className="text-sm font-semibold">GSTIN: {selectedBillingAddress.gstin}</p>}
                        </div>
                      ) : (
                        <p>No billing address selected</p>
                      )}
                    </div>
                    <Link prefetch={false} href={shipToChangeHref} className="text-black font-semibold text-right underline">Change</Link>
                  </div>
                  <div className="p-4 grid grid-cols-[140px_1fr] items-center gap-4 text-sm">
                    <span className="text-zinc-500 whitespace-nowrap">{isPickup ? "Method" : "Shipping method"}</span>
                    <span className="text-zinc-900 font-medium">
                      {isPickup ? "Pickup" : "Shipping Rate"} · <span className="font-bold">{isPickup || isIndiaShipping ? "FREE" : "Calculated at next step"}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-abhaya font-bold text-zinc-900">Payment</h2>
                    <p className="text-sm font-figtree text-zinc-500">All transactions are secure and encrypted.</p>
                  </div>
                  <RadioGroup value={selectedPaymentGateway} onValueChange={setSelectedPaymentGateway} className="grid gap-0 border border-zinc-200 rounded-lg overflow-hidden bg-white">
                    {paymentGateways.map((gateway, index) => (
                      <div key={gateway.id} className={`flex flex-col ${index < paymentGateways.length - 1 ? "border-b border-zinc-100" : ""}`}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPaymentGateway(gateway.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedPaymentGateway(gateway.id);
                            }
                          }}
                          className={`p-5 flex ${gateway.id === "partial_cod" ? "flex-row gap-3" : "flex-col md:flex-row gap-4 md:gap-0"} items-center justify-between transition-all cursor-pointer ${selectedPaymentGateway === gateway.id ? "bg-accent/15" : "bg-white"}`}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={gateway.id} id={gateway.id} className="text-[#005BD3] border-zinc-300" />
                            <Label htmlFor={gateway.id} className="font-medium text-zinc-900 cursor-pointer">{gateway.name}</Label>
                          </div>
                          <div className={`flex items-center gap-3 ${gateway.id === "partial_cod" ? "shrink-0" : ""}`}>
                            <span className="text-sm font-bold text-zinc-900">₹{Number(gateway.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            {gateway.id === "razorpay" ? (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1 items-center bg-white px-2 py-1 rounded border border-zinc-100">
                                  <Image src="/images/icons/upi.svg" className="h-3 w-auto opacity-70" alt="UPI" width={36} height={12} unoptimized />
                                </div>
                                <div className="flex gap-1 items-center bg-white px-2 py-1 rounded border border-zinc-100">
                                  <Image src="/images/icons/visa.svg" className="h-2 w-auto opacity-70" alt="VISA" width={36} height={8} unoptimized />
                                </div>
                                <div className="flex gap-1 items-center bg-white px-2 py-1 rounded border border-zinc-100">
                                  <Image src="/images/icons/mastercard.svg" className="h-3 w-auto opacity-70" alt="MASTERCARD" width={36} height={12} unoptimized />
                                </div>
                                <span className="text-[10px] text-zinc-400 font-bold">+18</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-zinc-500">
                                COD ₹{partialCodDetails.codAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between gap-6 pt-4">
                  <Link prefetch={false} href="/checkout/shipping" className="flex items-center gap-2 text-sm font-bold text-accent hover:underline">
                    <ChevronLeft size={16} />
                    Return to shipping
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Summary Sidebar (40%) */}
          {isDesktop && (
            <div className="w-full lg:basis-[40%] lg:shrink-0 relative">
              <div className="hidden lg:block absolute inset-y-0 left-0 w-screen border-l border-zinc-100 z-0" />
              <div className="relative z-10 py-10 px-4 lg:pl-12 lg:bg-transparent bg-[#FAFAFA] min-h-full scroll-mt-16" ref={summaryRef}>
                <div className="lg:sticky lg:top-0 space-y-6">
                  <CheckoutSummary
                    isSilverPendantClaimed={isSilverPendantClaimed}
                    onToggleSilverPendant={() => setIsSilverPendantClaimed(!isSilverPendantClaimed)}
                  >
                    {/* Desktop Button - Moved here to match cart page */}
                    <div className="hidden lg:block">
                      <Button
                        type="button"
                        onClick={handlePayNow}
                        disabled={paymentLoading || !finalAmount || !selectedBillingAddress || (!isPickup && !selectedAddress)}
                        className="w-full flex shrink-0 items-center justify-center rounded-sm bg-[#5A413F] h-14 font-figtree font-medium uppercase tracking-wide text-[1.15rem] text-white cursor-pointer hover:bg-[#4A312F] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {paymentLoading
                          ? "Processing..."
                          : `Pay now ₹${selectedPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      </Button>
                    </div>
                  </CheckoutSummary>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-semibold text-black leading-none font-figtree tracking-normal">
              ₹{selectedPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <button
              onClick={scrollToSummary}
              className="text-[14px] font-medium text-black cursor-pointer font-figtree"
            >
              View Order Summary
            </button>
          </div>
          <Button
            onClick={handlePayNow}
            disabled={paymentLoading || !finalAmount || !selectedBillingAddress || (!isPickup && !selectedAddress)}
            className="w-full flex items-center justify-center rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] h-[50px] font-figtree font-medium uppercase tracking-wider text-[15px] text-white cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paymentLoading ? "PROCESSING..." : "PAY NOW"}
          </Button>
        </div>
      </div>
    </div>
  );
}
