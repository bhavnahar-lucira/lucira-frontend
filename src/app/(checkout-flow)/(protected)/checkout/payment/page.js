"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CheckoutSummary from "@/components/cart/CheckoutSummary";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  clearCart,
  removePoints,
} from "@/redux/features/cart/cartSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, Trash2, Plus, Loader2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  completeRazorpayPayment,
  createRazorpayOrder,
  deleteCustomerAddress,
  fetchCheckoutAddressSelection,
  fetchCustomerAddresses,
  saveCheckoutAddressSelection,
  selectDefaultCustomerAddress,
  createCustomerAddress,
} from "@/lib/api";
import { selectUser } from "@/redux/features/user/userSlice";
import { useCart } from "@/hooks/useCart";
import { toast } from "react-toastify";
import { pushAddPaymentInfo } from "@/lib/gtm";
import { sendCheckoutCrmEvent } from "@/lib/checkout-crm";
import { MobileBottomSheet } from "@/components/common/MobileBottomSheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";


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
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
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

function formatAddressLines(address) {
  if (!address) return [];

  return [
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
}

function readStoredBillingSelection() {
  if (typeof window === "undefined") {
    return { billingAddressMode: "same", billingAddressId: "" };
  }

  try {
    const rawValue = window.localStorage.getItem(BILLING_SELECTION_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : null;
    if (parsedValue?.billingAddressMode === "different" && parsedValue?.billingAddressId) {
      return {
        billingAddressMode: "different",
        billingAddressId: parsedValue.billingAddressId,
      };
    }
  } catch (error) {
    console.error("Billing selection restore error:", error);
  }

  return { billingAddressMode: "same", billingAddressId: "" };
}

function persistBillingSelection(selection) {
  if (typeof window === "undefined") return;

  if (selection?.billingAddressMode === "different" && selection?.billingAddressId) {
    window.localStorage.setItem(
      BILLING_SELECTION_STORAGE_KEY,
      JSON.stringify({
        billingAddressMode: "different",
        billingAddressId: selection.billingAddressId,
      })
    );
    return;
  }

  window.localStorage.removeItem(BILLING_SELECTION_STORAGE_KEY);
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
  const [addresses, setAddresses] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [billingAddressMode, setBillingAddressMode] = useState("same");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState("");
  const [billingAddressSnapshot, setBillingAddressSnapshot] = useState(null);
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState("razorpay");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkoutSelection, setCheckoutSelection] = useState(null);
  const summaryRef = useRef(null);

  const scrollToSummary = () => {
    if (summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const [addAddressDialogOpen, setAddAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressSaving, setAddressSaving] = useState(false);
  const [makeDefault, setMakeDefault] = useState(false);

  const user = useSelector(selectUser);
  const {items, totalAmount, appliedCoupon, nectorPoints } = useCart();

  const finalAmount = useMemo(() => {
    const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
    const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
    const subtotalValue = (totalAmount || 0) - insuranceValue;

    const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      if (couponDetails.valueType === "FIXED_AMOUNT") {
        couponDiscountAmount = couponDetails.value;
      } else if (couponDetails.valueType === "PERCENTAGE") {
        couponDiscountAmount = (subtotalValue * couponDetails.value) / 100;
      }
    }

    const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
    return subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;
  }, [items, totalAmount, appliedCoupon, nectorPoints]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  const billingModeRef = useRef("same");
  const billingAddressIdRef = useRef("");

  const selectedBillingAddress = useMemo(() => {
    if (billingAddressMode === "same") return selectedAddress;
    return (
      addresses.find((address) => address.id === selectedBillingAddressId) ||
      billingAddressSnapshot ||
      null
    );
  }, [addresses, billingAddressMode, selectedAddress, selectedBillingAddressId, billingAddressSnapshot]);

  const isPickup = checkoutSelection?.deliveryMethod === "pickup";
  const isIndiaShipping = (selectedAddress?.country || "").trim().toLowerCase() === "india";

  // Remove points when leaving the payment page
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
          const res = await fetch(`/api/pincodes/check?pincode=${selection.selectedAddress.zip.trim()}`);
          const data = await res.json();
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
    const isEligible = total > 0 && total < 50000;
    const prepaidAmount = isEligible ? total * 0.2 : 0;
    const codAmount = isEligible ? total - prepaidAmount : 0;

    return {
      isEligible,
      prepaidAmount: Math.round(prepaidAmount),
      codAmount: Math.round(codAmount),
    };
  }, [finalAmount]);

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
    if (customer) {
      setAddressForm(normalizeAddressForm({}, customer));
    }
  }, [customer]);

  const updateAddressForm = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateNewAddress = async () => {
    if (!addressForm.firstName.trim() || !addressForm.address1.trim() || !addressForm.city.trim() || !addressForm.zip.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setAddressSaving(true);
    try {
      const payload = await createCustomerAddress({
        address: addressForm,
        makeDefault,
      });
      
      applyAddressPayload(payload);
      
      const newAddress = payload.addresses.find(a => 
        a.address1 === addressForm.address1 && a.zip === addressForm.zip
      ) || payload.addresses[payload.addresses.length - 1];

      if (newAddress) {
        handleSelectBillingAddress(newAddress.id);
      }

      setAddAddressDialogOpen(false);
      setAddressForm(normalizeAddressForm({}, customer));
      toast.success("Address added successfully");
    } catch (error) {
      toast.error(error.message || "Unable to add address");
    } finally {
      setAddressSaving(false);
    }
  };

  const openAddNewAddress = () => {
    setBillingDialogOpen(false);
    setAddAddressDialogOpen(true);
  };

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

  useEffect(() => {
    billingModeRef.current = billingAddressMode;
  }, [billingAddressMode]);

  useEffect(() => {
    billingAddressIdRef.current = selectedBillingAddressId;
  }, [selectedBillingAddressId]);

  const applyAddressPayload = useCallback(
    (payload, selection = null) => {
      setAddresses(payload.addresses || []);
      setCustomer(payload.customer || null);

      const nextSelectedId = payload.defaultAddressId || payload.addresses?.[0]?.id || "";
      const requestedBillingMode = selection?.billingAddressMode || billingModeRef.current;
      const requestedBillingAddressId = selection?.billingAddressId || billingAddressIdRef.current;
      const hasRequestedBillingAddress =
        requestedBillingMode === "different" &&
        (payload.addresses || []).some((address) => address.id === requestedBillingAddressId);
      const resolvedBillingMode = hasRequestedBillingAddress ? "different" : "same";
      const resolvedBillingAddressId = hasRequestedBillingAddress
        ? requestedBillingAddressId
        : nextSelectedId;
      const currentAddress = (payload.addresses || []).find((address) => address.id === nextSelectedId) || null;
      const currentBillingAddress = (payload.addresses || []).find((address) => address.id === resolvedBillingAddressId) || null;

      billingModeRef.current = resolvedBillingMode;
      billingAddressIdRef.current = resolvedBillingAddressId;
      setSelectedAddressId(nextSelectedId);
      setBillingAddressMode(resolvedBillingMode);
      setSelectedBillingAddressId(resolvedBillingAddressId);
      setBillingAddressSnapshot(currentBillingAddress || null);
    },
    []
  );

  const loadAddresses = useCallback(async () => {
    try {
      const storedSelection = readStoredBillingSelection();
      const [payload, selection] = await Promise.all([
        fetchCustomerAddresses(),
        fetchCheckoutAddressSelection(),
      ]);
      const effectiveSelection =
        selection?.billingAddressMode === "different" && selection?.billingAddressId
          ? selection
          : storedSelection;
      applyAddressPayload(payload, effectiveSelection);
    } catch (error) {
      toast.error(error.message || "Unable to load addresses");
    }
  }, [applyAddressPayload]);

  useEffect(() => {
    Promise.resolve().then(loadAddresses);
  }, [loadAddresses]);

  const handleSelectAddress = async (addressId) => {
    try {
      applyAddressPayload(await selectDefaultCustomerAddress(addressId));
      setAddressDialogOpen(false);
      if (billingAddressMode === "same") {
        setSelectedBillingAddressId(addressId);
      }
    } catch (error) {
      toast.error(error.message || "Unable to select address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const payload = await deleteCustomerAddress(addressId);
      applyAddressPayload(payload);
      if (selectedBillingAddressId === addressId) {
        setSelectedBillingAddressId(payload.defaultAddressId || payload.addresses?.[0]?.id || "");
        setBillingAddressMode("same");
        setBillingAddressSnapshot(payload.addresses?.[0] || null);
        billingModeRef.current = "same";
        billingAddressIdRef.current = payload.defaultAddressId || payload.addresses?.[0]?.id || "";
        persistBillingSelection({ billingAddressMode: "same" });
        await saveCheckoutAddressSelection({ billingAddressMode: "same" });
      }
      toast.error("Address removed", {
        icon: <Check className="w-4 h-4" />
      });
    } catch (error) {
      toast.error(error.message || "Unable to remove address");
    }
  };

  const handleSelectBillingAddress = async (addressId) => {
    const nextBillingAddress = addresses.find((address) => address.id === addressId) || null;
    billingModeRef.current = "different";
    billingAddressIdRef.current = addressId;
    setBillingAddressMode("different");
    setSelectedBillingAddressId(addressId);
    setBillingAddressSnapshot(nextBillingAddress);
    setBillingDialogOpen(false);
    persistBillingSelection({
      billingAddressMode: "different",
      billingAddressId: addressId,
    });

    try {
      await saveCheckoutAddressSelection({
        billingAddressMode: "different",
        billingAddressId: addressId,
      });
    } catch (error) {
      toast.error(error.message || "Unable to save billing address");
    }
  };

  const handleBillingModeChange = async (value) => {
    setBillingAddressMode(value);

    if (value === "same") {
      billingModeRef.current = "same";
      billingAddressIdRef.current = selectedAddressId;
      setSelectedBillingAddressId(selectedAddressId);
      setBillingAddressSnapshot(selectedAddress);
      persistBillingSelection({ billingAddressMode: "same" });
      try {
        await saveCheckoutAddressSelection({ billingAddressMode: "same" });
      } catch (error) {
        toast.error(error.message || "Unable to save billing preference");
      }
      return;
    }

    if (!selectedBillingAddressId) {
      billingAddressIdRef.current = selectedAddressId;
      setSelectedBillingAddressId(selectedAddressId);
      setBillingAddressSnapshot(selectedAddress);
    }
    setBillingDialogOpen(true);
  };

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
        cartItems: items,
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

      const insuranceItem = (items || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
      const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
      const subtotalValue = (totalAmount || 0) - insuranceValue;

      const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
      let couponDiscountAmount = 0;
      if (appliedCoupon) {
        if (couponDetails.valueType === "FIXED_AMOUNT") {
          couponDiscountAmount = couponDetails.value;
        } else if (couponDetails.valueType === "PERCENTAGE") {
          couponDiscountAmount = (subtotalValue * couponDetails.value) / 100;
        }
      }

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
        items: (items || []).map((item, idx) => {
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
        items: (items || []).map((item, idx) => {
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
        sessionId: getCartSessionId(),
        customer: {
          name: customerName,
          email: customer?.email || user?.email || checkoutSelection?.customerEmail || "",
          phone: normalizePhone(customer?.phone || user?.mobile || selectedAddress?.phone || ""),
        },
        shippingAddress: isPickup ? checkoutSelection.selectedStore : selectedAddress,
        billingAddress: selectedBillingAddress,
        appliedCoupon: appliedCoupon,
        nectorPoints: nectorPoints,
        paymentMethod: paymentMethodDetails,
      });

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
            let couponDiscountAmount = 0;
            if (appliedCoupon) {
              if (couponDetails.valueType === "FIXED_AMOUNT") {
                couponDiscountAmount = couponDetails.value;
              } else if (couponDetails.valueType === "PERCENTAGE") {
                couponDiscountAmount = (subtotalValue * couponDetails.value) / 100;
              }
            }

            const grandTotalValue = subtotalValue + insuranceValue - couponDiscountAmount;
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
              items: (items || []).map((item, idx) => {
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

            window.localStorage.setItem("gtm_purchase_data", JSON.stringify(purchaseData));

            const completion = await completeRazorpayPayment({
              userId: user?.id || "",
              sessionId: getCartSessionId(),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              draftId: order.draftId,
              customer: {
                id: customer?.id || "",
                name: customerName,
                email: customer?.email || user?.email || checkoutSelection?.customerEmail || "",
                phone: normalizePhone(customer?.phone || user?.mobile || selectedAddress?.phone || ""),
              },
              shippingAddress: isPickup ? checkoutSelection.selectedStore : selectedAddress,
              billingAddress: selectedBillingAddress,
              appliedCoupon: appliedCoupon,
              nectorPoints: nectorPoints, // Pass points for completion attributes
              paymentMethod: order.paymentMethod || paymentMethodDetails,
            });

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
          contact: order.customer?.contact || "",
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
        let couponDiscountAmount = 0;
        if (appliedCoupon) {
          if (couponDetails.valueType === "FIXED_AMOUNT") {
            couponDiscountAmount = couponDetails.value;
          } else if (couponDetails.valueType === "PERCENTAGE") {
            couponDiscountAmount = (subtotalValue * couponDetails.value) / 100;
          }
        }

        const grandTotalValue = subtotalValue + insuranceValue - couponDiscountAmount;

        const failureData = {
          currency: "INR",
          value: grandTotalValue,
          error_message: reason,
          coupon: couponDetails?.code || "NA",
          send_to: "G-K6H0NZ4YJ8",
          items: (items || []).map((item, idx) => {
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

  const AddressListContent = ({ type }) => (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
      {addresses.map((address) => {
        const isSelected = type === "shipping" ? selectedAddressId === address.id : selectedBillingAddress?.id === address.id;
        return (
          <div
            key={`${type}-${address.id}`}
            onClick={() => type === "shipping" ? handleSelectAddress(address.id) : handleSelectBillingAddress(address.id)}
            role="button"
            tabIndex={0}
            className={`rounded-xl border p-4 text-left transition-all ${
              isSelected ? "border-accent bg-accent/10" : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name={`${type}-addresses`}
                checked={isSelected}
                onChange={() => {}}
                className="mt-1 size-4 accent-black"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900">
                      {[address.firstName, address.lastName].filter(Boolean).join(" ") || "Saved address"}
                    </h3>
                    {address.isDefault && (
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleDeleteAddress(address.id);
                    }}
                    className="rounded-full bg-white shadow border border-zinc-200 p-2 text-zinc-600 transition hover:border-red-200 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-sm text-zinc-600">
                  {formatAddressLines(address).map((line) => (
                    <p key={`line-${address.id}-${line}`}>{line}</p>
                  ))}
                  {address.gstin && <p className="font-medium text-zinc-800">GSTIN: {address.gstin}</p>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {type === "billing" && (
        <Button
          variant="outline"
          onClick={openAddNewAddress}
          className="w-full h-12 border-dashed border-2 border-zinc-200 text-zinc-500 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2 font-bold"
        >
          <Plus size={18} />
          Add new address
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <div className="max-w-7xl w-full mx-auto relative z-10 px-4">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          
          {/* Main Content Area (60%) */}
          <div className="grow lg:basis-[60%] lg:shrink-0 py-10 px-0 lg:pr-12 space-y-10 bg-white">
            
            {/* MOBILE ONLY ORDER */}
            {!isDesktop && (
              <div className="space-y-10 px-4">
                {/* 1. Lucira Coins Balance */}
                <CheckoutSummary showItems={false} showBreakdown={false} showContact={false} />

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

                {/* 3. Order Summary */}
                <div ref={summaryRef}>
                  <CheckoutSummary showPoints={false} showContact={false} />
                </div>

                {/* 4. Contact, Ship to, Bill to section */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  <div className="p-4 grid grid-cols-[100px_1fr] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">Contact</span>
                    <span className="text-zinc-900 font-medium truncate">{customer?.email || checkoutSelection?.customerEmail || "techamitjha@gmail.com"}</span>
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
                    <Link href={`/checkout/shipping?method=${isPickup ? "pickup" : "ship"}`} className="text-black font-semibold text-right underline">Change</Link>
                  </div>
                  {!isPickup && (
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
                      <button type="button" onClick={() => setBillingDialogOpen(true)} className="text-black font-semibold text-right underline">Change</button>
                    </div>
                  )}
                  <div className="p-4 grid grid-cols-[100px_1fr] items-center gap-4 text-sm">
                    <span className="text-zinc-500 whitespace-nowrap">{isPickup ? "Method" : "Shipping"}</span>
                    <span className="text-zinc-900 font-medium">
                      {isPickup ? "Pickup" : "Shipping Rate"} · <span className="font-bold">{isPickup || isIndiaShipping ? "FREE" : "Calculated at next step"}</span>
                    </span>
                  </div>
                </div>

                {/* 5. Billing address selection */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-zinc-900 font-abhaya">Billing address</h2>
                    <p className="text-sm font-figtree text-zinc-500">Select the address that matches your card.</p>
                  </div>
                  {isPickup ? (
                    <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white">
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          {selectedBillingAddress ? (
                            <>
                              <h4 className="font-bold text-zinc-900">{[selectedBillingAddress.firstName, selectedBillingAddress.lastName].filter(Boolean).join(" ")}</h4>
                              <p className="text-sm text-zinc-500">{formatAddressPreview(selectedBillingAddress)}</p>
                            </>
                          ) : (
                            <p className="text-sm text-zinc-500 italic">No billing address selected</p>
                          )}
                        </div>
                        <Button variant="outline" onClick={() => setBillingDialogOpen(true)} className="border-zinc-200 text-zinc-800 font-bold">Select billing address</Button>
                      </div>
                    </div>
                  ) : (
                    <RadioGroup value={billingAddressMode} onValueChange={handleBillingModeChange} className="grid gap-0 border border-zinc-100 rounded-lg overflow-hidden bg-white">
                      <div className={`p-5 flex items-center gap-3 border-b border-zinc-100 ${billingAddressMode === "same" ? "bg-accent/15" : ""}`}>
                        <RadioGroupItem value="same" id="m-same" className="text-black border-zinc-300" />
                        <Label htmlFor="m-same" className="font-medium text-zinc-900 cursor-pointer">Same as shipping address</Label>
                      </div>
                      <div className={`p-5 flex items-center gap-3 transition-all hover:bg-zinc-50/50 cursor-pointer ${billingAddressMode === "different" ? "bg-accent/15" : ""}`}>
                        <RadioGroupItem value="different" id="m-different" className="text-black border-zinc-300" />
                        <Label htmlFor="m-different" className="font-medium text-zinc-900 cursor-pointer">Use a different billing address</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>

                {/* 6. CONTACT US FOR ASSISTANCE */}
                <CheckoutSummary showItems={false} showBreakdown={false} showPoints={false} />
              </div>
            )}

            {/* DESKTOP ONLY ORDER */}
            {isDesktop && (
              <div className="space-y-10">
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                  <div className="p-4 grid grid-cols-[140px_1fr] items-center gap-4 text-sm border-b border-zinc-100">
                    <span className="text-zinc-500 whitespace-nowrap">Contact</span>
                    <span className="text-zinc-900 font-medium truncate">{customer?.email || checkoutSelection?.customerEmail || "techamitjha@gmail.com"}</span>
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
                    <Link href={`/checkout/shipping?method=${isPickup ? "pickup" : "ship"}`} className="text-black font-semibold text-right underline">Change</Link>
                  </div>
                  {!isPickup && (
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
                      <button type="button" onClick={() => setBillingDialogOpen(true)} className="text-black font-semibold text-right underline">Change</button>
                    </div>
                  )}
                  <div className="p-4 grid grid-cols-[140px_1fr] items-center gap-4 text-sm">
                    <span className="text-zinc-500 whitespace-nowrap">{isPickup ? "Method" : "Shipping method"}</span>
                    <span className="text-zinc-900 font-medium">
                      {isPickup ? "Pickup" : "Shipping Rate"} · <span className="font-bold">{isPickup || isIndiaShipping ? "FREE" : "Calculated at next step"}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-zinc-900 font-abhaya">Billing address</h2>
                    <p className="text-sm font-figtree text-zinc-500">Select the address that matches your card or payment method.</p>
                  </div>
                  {isPickup ? (
                    <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white">
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          {selectedBillingAddress ? (
                            <>
                              <h4 className="font-bold text-zinc-900">{[selectedBillingAddress.firstName, selectedBillingAddress.lastName].filter(Boolean).join(" ")}</h4>
                              <p className="text-sm text-zinc-500">{formatAddressPreview(selectedBillingAddress)}</p>
                            </>
                          ) : (
                            <p className="text-sm text-zinc-500 italic">No billing address selected</p>
                          )}
                        </div>
                        <Button variant="outline" onClick={() => setBillingDialogOpen(true)} className="border-zinc-200 text-zinc-800 font-bold">Select billing address</Button>
                      </div>
                    </div>
                  ) : (
                    <RadioGroup value={billingAddressMode} onValueChange={handleBillingModeChange} className="grid gap-0 border border-zinc-100 rounded-lg overflow-hidden bg-white">
                      <div className={`p-5 flex items-center gap-3 border-b border-zinc-100 ${billingAddressMode === "same" ? "bg-accent/15" : ""}`}>
                        <RadioGroupItem value="same" id="same" className="text-black border-zinc-300" />
                        <Label htmlFor="same" className="font-medium text-zinc-900 cursor-pointer">Same as shipping address</Label>
                      </div>
                      <div className={`p-5 flex items-center gap-3 transition-all hover:bg-zinc-50/50 cursor-pointer ${billingAddressMode === "different" ? "bg-accent/15" : ""}`}>
                        <RadioGroupItem value="different" id="different" className="text-black border-zinc-300" />
                        <Label htmlFor="different" className="font-medium text-zinc-900 cursor-pointer">Use a different billing address</Label>
                      </div>
                    </RadioGroup>
                  )}
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
                  <Link href="/checkout/shipping" className="flex items-center gap-2 text-sm font-bold text-accent hover:underline">
                    <ChevronLeft size={16} />
                    Return to shipping
                  </Link>
                  <Button 
                    type="button" 
                    onClick={handlePayNow} 
                    disabled={paymentLoading || !totalAmount || !selectedBillingAddress || (!isPickup && !selectedAddress)} 
                    className="px-14 h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all text-lg uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentLoading
                      ? "Processing..."
                      : `Pay now ₹${selectedPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Summary Sidebar (40%) */}
          {isDesktop && (
            <div className="w-full lg:basis-[40%] lg:shrink-0 relative">
              <div className="hidden lg:block absolute inset-y-0 left-0 w-screen bg-[#FAFAFA] border-l border-zinc-100 z-0" />
              <div className="relative z-10 py-10 px-4 lg:pl-12 bg-[#FAFAFA] lg:bg-transparent min-h-full">
                <div className="lg:sticky lg:top-0">
                  <CheckoutSummary />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.08)] z-[60]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-zinc-900 leading-none">₹ {selectedPayableAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <button 
              onClick={scrollToSummary}
              className="text-[11px] font-bold text-accent uppercase tracking-tight mt-1 text-left whitespace-nowrap"
            >
              View Order Summary
            </button>
          </div>
          <Button 
            onClick={handlePayNow}
            disabled={paymentLoading || !finalAmount || !selectedBillingAddress || (!isPickup && !selectedAddress)}
            className="grow bg-primary hover:bg-accent text-white font-bold h-12 uppercase tracking-widest rounded-lg text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paymentLoading ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </div>

      {/* POPUPS */}
      {isDesktop ? (
        <>
          <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>All addresses</DialogTitle>
                <DialogDescription>Select an address to use for shipping.</DialogDescription>
              </DialogHeader>
              <AddressListContent type="shipping" />
            </DialogContent>
          </Dialog>

          <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Billing address</DialogTitle>
                <DialogDescription>Select the billing address to use for this payment.</DialogDescription>
              </DialogHeader>
              <AddressListContent type="billing" />
            </DialogContent>
          </Dialog>

          <Dialog open={addAddressDialogOpen} onOpenChange={setAddAddressDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add new address</DialogTitle>
                <DialogDescription>Email and phone stay tied to your account.</DialogDescription>
              </DialogHeader>
              <AddressFields
                form={addressForm}
                onChange={updateAddressForm}
                makeDefault={makeDefault}
                onDefaultChange={setMakeDefault}
                submitLabel="Save address"
                onSubmit={handleCreateNewAddress}
                saving={addressSaving}
              >
                <Button variant="link" onClick={() => { setAddAddressDialogOpen(false); setBillingDialogOpen(true); }} className="font-bold underline px-0">Choose existing</Button>
              </AddressFields>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <MobileBottomSheet isOpen={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} title="All addresses">
            <AddressListContent type="shipping" />
          </MobileBottomSheet>

          <MobileBottomSheet isOpen={billingDialogOpen} onClose={() => setBillingDialogOpen(false)} title="Billing address">
            <AddressListContent type="billing" />
          </MobileBottomSheet>

          <MobileBottomSheet isOpen={addAddressDialogOpen} onClose={() => setAddAddressDialogOpen(false)} title="Add new address">
            <AddressFields
              form={addressForm}
              onChange={updateAddressForm}
              makeDefault={makeDefault}
              onDefaultChange={setMakeDefault}
              submitLabel="SAVE ADDRESS"
              onSubmit={handleCreateNewAddress}
              saving={addressSaving}
              isMobile={true}
            >
              <Button variant="link" onClick={() => { setAddAddressDialogOpen(false); setBillingDialogOpen(true); }} className="font-bold underline px-0">Choose existing</Button>
            </AddressFields>
          </MobileBottomSheet>
        </>
      )}
    </div>
  );
}
