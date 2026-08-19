"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CheckoutSummary from "@/components/cart/CheckoutSummary";
import PriceProtectionTimer from "@/components/checkout/payment/PriceProtectionTimer";
import PriceProtectionDrawer from "@/components/checkout/payment/PriceProtectionDrawer";
import CoinsNudgeDrawer from "@/components/checkout/payment/CoinsNudgeDrawer";
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
import { getStoredUtms, sendCheckoutCrmEvent } from "@/lib/checkout-crm";
import { trackPaymentStep } from "@/lib/searchAnalytics";
import { calculateCouponDiscount } from "@/lib/coupons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useCustomerAddresses } from "@/hooks/checkout/useCustomerAddresses";
import { useBillingAddress } from "@/hooks/checkout/useBillingAddress";


const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

const BILLING_SELECTION_STORAGE_KEY = "checkoutBillingAddressSelection";

const emptyAddressForm = {
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  zip: "",
  country: "India",
  phone: "",
  gstin: "",
};

function normalizeAddressForm(address = {}, customer = {}) {
  return {
    ...emptyAddressForm,
    firstName: address.firstName || customer.firstName || "",
    lastName: address.lastName || customer.lastName || "",
    company: address.company || "",
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    province: address.province || "",
    zip: address.zip || "",
    country: address.country || "India",
    phone: address.phone || "",
    gstin: address.gstin || "",
  };
}

function AddressFields({ form, onChange, makeDefault, onDefaultChange, submitLabel, onSubmit, saving, children, isMobile = false }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input placeholder="First name" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="Last name" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="Company (optional)" value={form.company} onChange={(e) => onChange("company", e.target.value)} className="h-12 border-zinc-200" />
        {form.country.trim().toLowerCase() === "india" ? (
          <Input
            placeholder="GSTIN (optional, 15 characters)"
            value={form.gstin}
            onChange={(e) => onChange("gstin", e.target.value.toUpperCase())}
            maxLength={15}
            className="h-12 border-zinc-200"
          />
        ) : (
          <div className="hidden md:block" />
        )}
        <div className="md:col-span-2">
          <Input placeholder="Address" value={form.address1} onChange={(e) => onChange("address1", e.target.value)} className="h-12 border-zinc-200" />
        </div>
        <div className="md:col-span-2">
          <Input placeholder="Apartment, suite, etc. (optional)" value={form.address2} onChange={(e) => onChange("address2", e.target.value)} className="h-12 border-zinc-200" />
        </div>
        <Input placeholder="City" value={form.city} onChange={(e) => onChange("city", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="State" value={form.province} onChange={(e) => onChange("province", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="PIN code" value={form.zip} onChange={(e) => onChange("zip", e.target.value)} className="h-12 border-zinc-200" />
        <Input placeholder="Country/Region" value={form.country} onChange={(e) => onChange("country", e.target.value)} className="h-12 border-zinc-200" />
        <div className="md:col-span-2">
          <Input
            placeholder="Phone (10 digits) *"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="h-12 border-zinc-200"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id={`make-default-${isMobile ? 'mobile' : 'desktop'}`} checked={makeDefault} onCheckedChange={(checked) => onDefaultChange(Boolean(checked))} />
        <label htmlFor={`make-default-${isMobile ? 'mobile' : 'desktop'}`} className="text-sm font-medium text-zinc-700 cursor-pointer">
          Use this as my default shipping address
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button type="button" onClick={onSubmit} disabled={saving} className={`grow md:grow-0 md:w-auto h-14 md:h-12 bg-primary hover:bg-primary/90 text-white font-bold ${isMobile ? 'rounded-full uppercase tracking-widest' : ''}`}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
        {children}
      </div>
    </div>
  );
}


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

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const hasFiredPaymentStep = useRef(false);
  

  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState("razorpay");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkoutSelection, setCheckoutSelection] = useState(null);
  const summaryRef = useRef(null);
  const summaryBreakdownRef = useRef(null);
  const [addAddressDialogOpen, setAddAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressSaving, setAddressSaving] = useState(false);
  const [makeDefault, setMakeDefault] = useState(false);

  const { user, accessToken, isAuthenticated } = useSelector((state) => state.user);
  const { items, totalAmount, appliedCoupon, nectorPoints, loading } = useCart();

  // We need eligibleBraceletId first
  useEffect(() => {
    if (items && items.length > 0 && !hasFiredPaymentStep.current) {
      trackPaymentStep(items);
      hasFiredPaymentStep.current = true;
    }
  }, [items]);


  const [showPriceProtection, setShowPriceProtection] = useState(false);
  const [showCoinsNudge, setShowCoinsNudge] = useState(false);
  const [coinsProceedAction, setCoinsProceedAction] = useState(null);

  const [priceProtectionSeconds, setPriceProtectionSeconds] = useState(600);
  useEffect(() => {
    if (typeof window === "undefined") return;

    let endTime = localStorage.getItem("priceProtectionEndTime");
    if (!endTime || parseInt(endTime, 10) < Date.now()) {
      endTime = Date.now() + 600 * 1000;
      localStorage.setItem("priceProtectionEndTime", endTime);
    } else {
      endTime = parseInt(endTime, 10);
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setPriceProtectionSeconds(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        localStorage.removeItem("priceProtectionEndTime");
        window.location.reload();
      }
    }, 1000);
    
    setPriceProtectionSeconds(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

    return () => clearInterval(interval);
  }, []);

  const scrollToSummary = () => {
    const target = summaryBreakdownRef.current || summaryRef.current;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const { addresses, customer, selectedAddressId, selectedAddress, loadingAddresses } = useCustomerAddresses({ accessToken, user });
  const { selectedBillingAddress } = useBillingAddress({
    accessToken,
    addresses,
    loadingAddresses,
    selectedAddressId,
    selectedAddress,
  });

  const checkoutItems = useMemo(() => {
    return items || [];
  }, [items]);

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
        const type = (item.type || item.category || item.productType || item.product_type || "").toLowerCase();
        const title = (item.title || "").toLowerCase();
        const tags = (item.tags || []).map(t => t.toLowerCase());
        const hasDiamondCharges = !!item.diamondCharges || (item.customAttributes?.some(attr => attr.key === "_Diamond Charges" && attr.value));

        const isPlainGold = tags.some(t => t.includes("plain gold") || t === "plaingold");

        if (isPlainGold) return false;

        return type.includes("diamond") || title.includes("diamond") ||
          type.includes("solitaire") || title.includes("solitaire") ||
          type.includes("gemstone") || title.includes("gemstone") ||
          tags.some(t => t.includes("diamond") || t.includes("solitaire")) ||
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
        utm: getStoredUtms(),
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
              utm: getStoredUtms(),
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

  // Track if cart has been fetched at least once
  const cartFetched = useRef(false);
  useEffect(() => {
    if (!loading) {
      cartFetched.current = true;
    }
  }, [loading]);

  const isInitialLoading = loading && !cartFetched.current;

  if (isInitialLoading) {
    return (
      <div className="bg-white min-h-screen overflow-x-clip">
        <div className="container-main relative z-10 !px-0 lg:!px-17 lg:!max-w-[2100px] lg:!w-[94%]">
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
            <div className="grow lg:basis-[60%] lg:shrink-0 p-0 lg:py-10 lg:px-4 lg:pl-[30px] lg:pr-[20px] space-y-10 bg-white min-w-0">
              <div className="space-y-10 animate-pulse mt-4 px-4 lg:px-0">
                <div className="space-y-4">
                  {/* Address box skeleton */}
                  <div className="h-20 w-full lg:max-w-md bg-zinc-50 rounded-lg border border-zinc-100" />
                </div>
                <div className="space-y-4">
                  <div className="h-6 w-40 bg-zinc-200 rounded-md" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 w-full lg:max-w-md bg-zinc-50 rounded-md border border-zinc-100" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:basis-[40%] lg:shrink-0 lg:py-10 lg:pl-12 lg:bg-transparent bg-[#FAFAFA]">
              <div className="space-y-8 animate-pulse lg:pt-4 p-4 lg:p-0">
                <div className="space-y-6">
                  <div className="h-6 w-32 bg-zinc-200 rounded-md lg:hidden" />
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4">
                      <div className="size-20 bg-zinc-100 rounded-md shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 w-full bg-zinc-100 rounded" />
                        <div className="h-3 w-2/3 bg-zinc-50 rounded" />
                        <div className="h-4 w-1/3 bg-zinc-100 rounded mt-2" />
                      </div>
                    </div>
                  ))}
                  <div className="space-y-4 pt-6 border-t border-zinc-100">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-4 w-24 bg-zinc-100 rounded" />
                        <div className="h-4 w-16 bg-zinc-100 rounded" />
                      </div>
                    ))}
                    <div className="border-t border-zinc-100 pt-4 flex justify-between items-center">
                      <div className="h-5 w-32 bg-zinc-200 rounded" />
                      <div className="h-6 w-24 bg-zinc-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-clip">
      <div className="container-main relative z-10 !px-0 lg:!px-17 lg:!max-w-[2100px] lg:!w-[94%]">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

          {/* Main Content Area (60%) */}
          <div className="grow lg:basis-[60%] lg:shrink-0 p-0 lg:py-10 lg:px-4 lg:pl-[30px] lg:pr-[20px] space-y-10 bg-white min-w-0">

            {/* MOBILE ONLY ORDER */}
            {!isDesktop && (
              <div className="space-y-6 px-0 lg:px-4">
                <div className="border-0 lg:border lg:border-[#EBE1D7] lg:rounded-[8px] overflow-hidden mb-3 lg:mb-0">
                  <div className="flex items-center gap-4 py-4 px-4 bg-white">
                    <div className="w-11 h-11 rounded-full border border-[#EBE1D7] flex items-center justify-center shrink-0 bg-[#FDFBF9]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="font-figtree font-medium text-[14px] leading-none tracking-normal align-middle mb-[9px] text-black truncate">
                        Delivering to {customer?.name || user?.name || "Customer"}
                      </p>
                      <p className="font-figtree font-normal text-[12px] leading-none tracking-normal align-middle text-black truncate">
                        {isPickup ? [checkoutSelection?.selectedStore?.address, checkoutSelection?.selectedStore?.city, checkoutSelection?.selectedStore?.state, checkoutSelection?.selectedStore?.zip].filter(Boolean).join(", ") : formatAddressPreview(selectedAddress)}
                      </p>
                    </div>
                    <Link prefetch={false} href={shipToChangeHref} className="font-figtree font-medium text-[13px] text-black shrink-0">
                      Change
                    </Link>
                  </div>

                  <PriceProtectionTimer
                    secondsLeft={priceProtectionSeconds}
                    onInfoClick={() => setShowPriceProtection(true)}
                    className="rounded-none lg:rounded-b-[8px] mb-0 lg:mb-2"
                  />
                </div>

                <div className="space-y-4 pt-2 px-4 lg:pb-4">
                  <h2 className="font-figtree font-medium text-black uppercase tracking-wide text-[0.9375rem] mb-4 lg:hidden">PAYMENT OPTIONS</h2>
                  <RadioGroup value={selectedPaymentGateway} onValueChange={setSelectedPaymentGateway}>
                      {paymentGateways.map((gateway) => (
                        <div key={gateway.id} className="relative">
                          <Label
                            htmlFor={`m-opt-${gateway.id}`}
                            className={`block p-4 rounded-[6px] border transition-colors cursor-pointer ${selectedPaymentGateway === gateway.id ? "border-[#5A413F] bg-[#FAF0E6]/40" : "border-[#EBE1D7]"}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-figtree font-medium text-black text-[0.9rem] mb-[8px]">
                                  {gateway.id === "razorpay" ? `Full Payment ₹${Number(gateway.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : `Partial COD ₹${Number(gateway.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                                </h4>
                                <p className="font-figtree text-[0.8rem] text-black/70 mt-1">
                                  {gateway.id === "razorpay" ? "Complete your Purchase with Ease" : `Pay Remaining ₹${partialCodDetails.codAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} at Delivery`}
                                </p>
                              </div>
                              <div className="relative flex items-center justify-center shrink-0">
                                <RadioGroupItem value={gateway.id} id={`m-opt-${gateway.id}`} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10.0003 18.3337C14.6027 18.3337 18.3337 14.6027 18.3337 10.0003C18.3337 5.39795 14.6027 1.66699 10.0003 1.66699C5.39795 1.66699 1.66699 5.39795 1.66699 10.0003C1.66699 14.6027 5.39795 18.3337 10.0003 18.3337Z" stroke={selectedPaymentGateway === gateway.id ? "#5A413F" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  {selectedPaymentGateway === gateway.id && <circle cx="10" cy="10" r="5" fill="#5A413F"/>}
                                </svg>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                <div className="px-4 lg:px-0">
                  <CheckoutSummary
                    showItems={false}
                    showBreakdown={false}
                    showContact={false}
                    mobilePaymentCoinsTheme={true}
                    onApplyCoinsWarning={(proceed) => {
                      setCoinsProceedAction(() => proceed);
                      setShowCoinsNudge(true);
                    }}
                  />
                </div>

                <div ref={summaryRef} className="scroll-mt-16 bg-white px-4 lg:px-0 pb-[150px]">
                  <CheckoutSummary
                    items={checkoutItems}
                    cartTotal={totalAmount}
                    showControls={false}
                    showPoints={false}
                    showItems={false}
                    breakdownRef={summaryBreakdownRef}
                    compactBreakdown={true}
                  />
                </div>
              </div>
            )}

            {/* DESKTOP ONLY ORDER */}
            {isDesktop && (
              <div className="space-y-6">
                <div className="border border-[#EBE1D7] rounded-[8px] overflow-hidden">
                  <div className="flex items-center gap-4 py-4 px-4 bg-white">
                    <div className="w-11 h-11 rounded-full border border-[#EBE1D7] flex items-center justify-center shrink-0 bg-[#FDFBF9]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="font-figtree font-medium text-[14px] leading-none tracking-normal align-middle mb-[9px] text-black truncate">
                        Delivering to {customer?.name || user?.name || "Customer"}
                      </p>
                      <p className="font-figtree font-normal text-[12px] leading-none tracking-normal align-middle text-black truncate">
                        {isPickup ? [checkoutSelection?.selectedStore?.address, checkoutSelection?.selectedStore?.city, checkoutSelection?.selectedStore?.state, checkoutSelection?.selectedStore?.zip].filter(Boolean).join(", ") : formatAddressPreview(selectedAddress)}
                      </p>
                    </div>
                    <Link prefetch={false} href={shipToChangeHref} className="font-figtree font-medium text-[13px] text-black shrink-0">
                      Change
                    </Link>
                  </div>

                  <PriceProtectionTimer
                    secondsLeft={priceProtectionSeconds}
                    onInfoClick={() => setShowPriceProtection(true)}
                    className="rounded-b-[8px] m-0"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <h2 className="font-figtree font-medium text-black uppercase tracking-wide text-[1.1rem]">PAYMENT OPTIONS</h2>
                  <RadioGroup value={selectedPaymentGateway} onValueChange={setSelectedPaymentGateway}>
                      {paymentGateways.map((gateway) => (
                        <div key={gateway.id} className="relative m-0">
                          <Label
                            htmlFor={`d-opt-${gateway.id}`}
                            className={`block p-4 rounded-[6px] border transition-colors cursor-pointer ${selectedPaymentGateway === gateway.id ? "border-[#5A413F] bg-[#FAF0E6]/40" : "border-[#EBE1D7]"}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-figtree font-medium text-black text-[1rem] mb-[8px]">
                                  {gateway.id === "razorpay" ? `Full Payment ₹${Number(gateway.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : `Partial COD ₹${Number(gateway.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                                </h4>
                                <p className="font-figtree text-[12px] text-black/70 mt-[8px] mb-0">
                                  {gateway.id === "razorpay" ? "Complete your Purchase with Ease" : `Pay Remaining ₹${partialCodDetails.codAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} at Delivery`}
                                </p>
                              </div>
                              <div className="relative flex items-center justify-center shrink-0">
                                <RadioGroupItem value={gateway.id} id={`d-opt-${gateway.id}`} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10.0003 18.3337C14.6027 18.3337 18.3337 14.6027 18.3337 10.0003C18.3337 5.39795 14.6027 1.66699 10.0003 1.66699C5.39795 1.66699 1.66699 5.39795 1.66699 10.0003C1.66699 14.6027 5.39795 18.3337 10.0003 18.3337Z" stroke={selectedPaymentGateway === gateway.id ? "#5A413F" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  {selectedPaymentGateway === gateway.id && <circle cx="10" cy="10" r="5" fill="#5A413F"/>}
                                </svg>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                <div className="flex items-center justify-between gap-6 pt-4">
                  <Link prefetch={false} href="/checkout/shipping" className="flex items-center gap-1.5 text-[0.975rem] capitalize font-semibold text-accent hover:opacity-80 transition-opacity">
                    <ChevronLeft className="size-4" />
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
                <div className="lg:sticky lg:top-6 space-y-6">
                  <CheckoutSummary
                    showItems={false}
                    mobilePaymentCoinsTheme={true}
                    onApplyCoinsWarning={(proceed) => {
                      setCoinsProceedAction(() => proceed);
                      setShowCoinsNudge(true);
                    }}
                  >
                    {/* Desktop Button - Moved here to match cart page */}
                    <div className="hidden lg:block mt-6 pt-4 border-t border-zinc-200 sticky bottom-0 bg-white z-20 pb-4">
                      <Button
                        type="button"
                        onClick={handlePayNow}
                        disabled={paymentLoading || !finalAmount || !selectedBillingAddress || (!isPickup && !selectedAddress)}
                        className="w-full flex shrink-0 items-center justify-center rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] transition-colors h-[50px] font-figtree font-medium uppercase tracking-wider text-[1rem] lg:text-[1.0625rem] text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBE1D7] px-4 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center px-0.5">
            <span className="text-[14px] font-medium text-black font-figtree flex items-center gap-2">
              Pay Securely
              <div className="flex items-center gap-2 ml-1">
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_upi.svg" className="h-[12px] w-auto" alt="UPI" width={36} height={12} unoptimized />
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_visa.svg" className="h-[10px] w-auto" alt="VISA" width={36} height={10} unoptimized />
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icon_mastercard.svg" className="h-[12px] w-auto" alt="MASTERCARD" width={36} height={12} unoptimized />
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Icons_rupay.svg" className="h-[12px] w-auto" alt="RuPay" width={36} height={12} unoptimized />
                <span className="text-[12px] text-zinc-500 font-medium">+12</span>
              </div>
            </span>
          </div>
          <Button
            onClick={handlePayNow}
            disabled={paymentLoading || !finalAmount || !selectedBillingAddress || (!isPickup && !selectedAddress)}
            className="w-full flex items-center justify-center rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] transition-colors h-[50px] font-figtree font-medium uppercase tracking-wider text-[1rem] lg:text-[1.0625rem] text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paymentLoading ? "PROCESSING..." : `PAY ₹${selectedPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </Button>
        </div>
      </div>

      <PriceProtectionDrawer
        open={showPriceProtection}
        onOpenChange={setShowPriceProtection}
        secondsLeft={priceProtectionSeconds}
      />
      <CoinsNudgeDrawer
        open={showCoinsNudge}
        onOpenChange={setShowCoinsNudge}
        onProceed={() => {
          if (coinsProceedAction) coinsProceedAction();
          setCoinsProceedAction(null);
        }}
      />
    </div>
  );
}
