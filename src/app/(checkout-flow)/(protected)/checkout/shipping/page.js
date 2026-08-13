"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Navigation,
  Truck,
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  Check,
  Plus,
} from "lucide-react";
import CheckoutSummary from "@/components/cart/CheckoutSummary";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { pushAddShippingInfo, pushBeginCheckout } from "@/lib/gtm";
import { sendCheckoutCrmEvent } from "@/lib/checkout-crm";
import { calculateCouponDiscount } from "@/lib/coupons";
import { MobileBottomSheet } from "@/components/common/MobileBottomSheet";
import { CheckoutAuthForm } from "@/components/checkout/CheckoutAuthForm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AddressForm } from "@/components/checkout/shipping/AddressForm";
import { AddressListInline } from "@/components/checkout/shipping/AddressListInline";
import { AddressSummaryCard } from "@/components/checkout/shipping/AddressSummaryCard";
import { BillingAddressSection } from "@/components/checkout/shipping/BillingAddressSection";
import { StorePickupSection } from "@/components/checkout/shipping/StorePickupSection";
import { emptyAddressForm, normalizeAddressForm } from "@/lib/checkout/address-helpers";
import { useCustomerAddresses } from "@/hooks/checkout/useCustomerAddresses";
import { usePincodeLookup } from "@/hooks/checkout/usePincodeLookup";
import { usePincodeDeliverability } from "@/hooks/checkout/usePincodeDeliverability";
import { useBillingAddress } from "@/hooks/checkout/useBillingAddress";
import { useStorePickup } from "@/hooks/checkout/useStorePickup";
import { getEstimatedDispatchDate } from "@/lib/utils";
import Image from "next/image";

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47661824082138";

const ShippingSkeleton = () => (
  <div className="space-y-10 animate-pulse">
    {/* Delivery Method Skeleton */}
    <div className="space-y-4">
      <div className="h-7 w-48 bg-zinc-200 rounded-md" />
      <div className="h-12 w-full max-w-md bg-zinc-100 rounded-lg" />
    </div>

    {/* Shipping Address Header Skeleton */}
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-zinc-200 rounded-md" />
          <div className="h-4 w-64 bg-zinc-100 rounded-md" />
        </div>
        <div className="h-11 w-44 bg-zinc-100 rounded-lg" />
      </div>

      {/* Address Cards Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-56 w-full border border-zinc-200 rounded-lg bg-white p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="size-5 rounded-full border-2 border-zinc-200" />
                <div className="h-6 w-32 bg-zinc-200 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="size-8 rounded-full bg-zinc-50 border border-zinc-100" />
                <div className="size-8 rounded-full bg-zinc-50 border border-zinc-100" />
              </div>
            </div>
            <div className="pl-9 space-y-2">
              <div className="h-3.5 w-1/2 bg-zinc-100 rounded" />
              <div className="h-3.5 w-3/4 bg-zinc-100 rounded" />
              <div className="h-3.5 w-2/3 bg-zinc-100 rounded" />
              <div className="h-3.5 w-1/2 bg-zinc-100 rounded" />
              <div className="h-3.5 w-1/4 bg-zinc-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SummarySkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="space-y-4">
      <div className="h-7 w-32 bg-zinc-200 rounded-md" />
      <div className="h-80 w-full bg-white rounded-lg border border-zinc-200 p-6 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="size-20 bg-zinc-100 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full bg-zinc-100 rounded" />
              <div className="h-3 w-1/2 bg-zinc-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="h-60 w-full bg-white rounded-lg border border-zinc-200 p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex justify-between">
          <div className="h-4 w-24 bg-zinc-100 rounded" />
          <div className="h-4 w-16 bg-zinc-100 rounded" />
        </div>
      ))}
      <div className="border-t border-zinc-100 pt-4 flex justify-between">
        <div className="h-6 w-32 bg-zinc-200 rounded" />
        <div className="h-6 w-24 bg-zinc-200 rounded" />
      </div>
    </div>
  </div>
);



export default function ShippingPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user, accessToken, isAuthenticated } = useSelector((state) => state.user);
  const { items: cartItems, totalAmount, appliedCoupon, nectorPoints } = useCart();
  const searchParams = useSearchParams();
  const [deliveryMethod, setDeliveryMethod] = useState(searchParams.get("method") || "ship");
  const summaryRef = useRef(null);
  const hasFiredBeginCheckout = useRef(false);

  const {
    addresses,
    customer,
    selectedAddressId,
    selectedAddress,
    hasSavedAddresses,
    loadingAddresses,
    createAddress,
    updateAddress,
    selectAddress,
    deleteAddress,
  } = useCustomerAddresses({ accessToken, user });

  const {
    billingAddressMode,
    selectedBillingAddress,
    setBillingMode,
    selectBillingAddress,
  } = useBillingAddress({ accessToken, addresses, loadingAddresses, selectedAddressId, selectedAddress });

  const pickup = useStorePickup({ selectedShippingZip: selectedAddress?.zip });
  const [pickupPhone, setPickupPhone] = useState("");

  const [shippingView, setShippingView] = useState("card"); // "card" | "list" | "form" (only relevant once there's a saved address)
  const [dialogMode, setDialogMode] = useState("create");
  const [dialogSaving, setDialogSaving] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [makeDefault, setMakeDefault] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [isCompanyPurchase, setIsCompanyPurchase] = useState(false);
  const addressFormRef = useRef(null);

  const { pincodeLoading } = usePincodeLookup(addressForm.zip, setAddressForm);

  // Pre-fill the inline create form once we know the customer has no saved addresses.
  useEffect(() => {
    if (!loadingAddresses && addresses.length === 0) {
      setAddressForm(normalizeAddressForm({}, customer || user || {}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAddresses, addresses.length, customer, user]);

  useEffect(() => {
    const currentCustomer = customer || user;
    if (cartItems && cartItems.length > 0 && !hasFiredBeginCheckout.current) {
      const getNumericId = (gid) => {
        if (!gid) return 0;
        if (typeof gid === 'number') return gid;
        const match = String(gid).match(/\d+$/);
        return match ? Number(match[0]) : 0;
      };

      const filteredItemsForGtm = cartItems.filter(
        (item) =>
          item.variantId !== INSURANCE_VARIANT_ID &&
          !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
          !item.properties?.['_byj_parent'] &&
          !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
      );

      const checkoutData = {
        payment_type: "Pay Via UPI / COD",
        send_to: "G-K6H0NZ4YJ8",
        value: Number(totalAmount),
        currency: "INR",
        items: filteredItemsForGtm.map((item, idx) => {
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
            shopify_product_id: item.sku || "",
            variant_id: String(getNumericId(item.variantId)),
            item_name: item.title,
            item_variant: item.variantTitle || `${item.karat || ""} ${item.color || ""}`.trim(),
            item_brand: "Lucira Jewelry",
            item_category: "",
            price: Number(item.price || 0),
            quantity: item.quantity,
            category: category,
            index: idx
          };
        }),
        coupon: (typeof appliedCoupon === 'object' ? appliedCoupon?.code : appliedCoupon) || "NA"
      };

      pushBeginCheckout(checkoutData);

      // Trigger CRM Webhook for Begin Checkout
      sendCheckoutCrmEvent("begin_checkout", {
        email: currentCustomer?.email || "",
        mobile: currentCustomer?.phone || currentCustomer?.mobile || "",
        firstName: currentCustomer?.firstName || currentCustomer?.name?.split(' ')[0] || "",
        lastName: currentCustomer?.lastName || currentCustomer?.name?.split(' ')[1] || "",
        totalCartValue: Number(totalAmount),
        cartItems: cartItems
      });

      hasFiredBeginCheckout.current = true;
    }
  }, [cartItems, totalAmount, appliedCoupon, customer, user]);



  const finalAmount = useMemo(() => {
    const insuranceItem = (cartItems || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
    const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
    const subtotalValue = (totalAmount || 0) - insuranceValue;

    const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, cartItems, subtotalValue);

    const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
    return subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;
  }, [cartItems, totalAmount, appliedCoupon, nectorPoints]);

  const scrollToSummary = () => {
    if (summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const selection = {
        deliveryMethod,
        selectedStoreId: pickup.selectedStoreId,
        selectedStore: pickup.dbStores.find((s) => s.id === pickup.selectedStoreId) || null,
        selectedAddress: selectedAddress,
        customerEmail: customer?.email || "",
        pickupPhone,
      };
      window.localStorage.setItem("checkout_selection", JSON.stringify(selection));
    }
  }, [deliveryMethod, pickup.selectedStoreId, pickup.dbStores, selectedAddress, customer, pickupPhone]);

  const { isDeliverable, checkingPincode } = usePincodeDeliverability(selectedAddress?.zip, {
    enabled: deliveryMethod === "ship",
  });

  const updateForm = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!addressForm.firstName.trim()) return "First name is required";
    if (!addressForm.lastName.trim()) return "Last name is required";
    if (!addressForm.address1.trim()) return "Address is required";
    if (!addressForm.city.trim()) return "City is required";
    if (!addressForm.province.trim()) return "State is required";
    if (!addressForm.zip.trim()) return "PIN code is required";

    if (!/^\d{6}$/.test(addressForm.zip.trim())) {
      return "Please enter a valid 6-digit PIN code";
    }

    if (!addressForm.country.trim()) return "Country is required";
    if (addressForm.gstin.trim() && addressForm.gstin.trim().length !== 15) {
      return "GSTIN must be 15 characters";
    }
    return "";
  };

  const confirmPincodeMismatch = (form) => {
    if (form.zip && form._pincodeCity && form._pincodeProvince) {
      const cityMismatch = form.city?.trim().toLowerCase() !== form._pincodeCity?.trim().toLowerCase();
      const stateMismatch = form.province?.trim().toLowerCase() !== form._pincodeProvince?.trim().toLowerCase();

      if (cityMismatch || stateMismatch) {
        return window.confirm(
          `The entered City/State does not match the PIN Code.\n\nPIN ${form.zip} belongs to:\n${form._pincodeCity}, ${form._pincodeProvince}\n\nDo you want to continue?`
        );
      }
    }
    return true;
  };

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingAddressId("");
    setAddressForm(normalizeAddressForm({}, customer || user || {}));
    setMakeDefault(!hasSavedAddresses);
    setIsCompanyPurchase(false);
    setShippingView("form");
  };

  const openEditDialog = (address) => {
    setDialogMode("edit");
    setEditingAddressId(address.id);
    setAddressForm(normalizeAddressForm(address, customer || user || {}));
    setMakeDefault(Boolean(address.isDefault));
    setIsCompanyPurchase(Boolean(address.company || address.gstin));
    setShippingView("form");
  };

  const handleCreateAddress = async (useDialog = false) => {
    const validationError = validateForm();
    if (validationError) return toast.error(validationError);
    if (!confirmPincodeMismatch(addressForm)) return;

    try {
      if (useDialog) setDialogSaving(true);
      else setInlineSaving(true);

      await createAddress(addressForm, { makeDefault });

      toast.success("Address added");
      if (useDialog) setShippingView("card");
    } catch (error) {
      toast.error(error.message || "Unable to add address");
    } finally {
      if (useDialog) setDialogSaving(false);
      else setInlineSaving(false);
    }
  };

  const handleUpdateAddress = async () => {
    const validationError = validateForm();
    if (validationError) return toast.error(validationError);
    if (!confirmPincodeMismatch(addressForm)) return;

    try {
      setDialogSaving(true);

      await updateAddress(editingAddressId, addressForm, { makeDefault });

      setShippingView("card");
      toast.success("Address updated");
    } catch (error) {
      toast.error(error.message || "Unable to update address");
    } finally {
      setDialogSaving(false);
    }
  };

  const handleContinueToPayment = () => {
    const getNumericId = (gid) => {
      if (!gid) return 0;
      if (typeof gid === 'number') return gid;
      const match = String(gid).match(/\d+$/);
      return match ? Number(match[0]) : 0;
    };

    const insuranceItem = (cartItems || []).find(item => item.variantId === INSURANCE_VARIANT_ID);
    const insuranceValue = insuranceItem ? (insuranceItem.price * (insuranceItem.quantity || 1)) : 0;
    const subtotalValue = (totalAmount || 0) - insuranceValue;

    const couponDetails = typeof appliedCoupon === 'object' ? appliedCoupon : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };
    const couponDiscountAmount = calculateCouponDiscount(appliedCoupon, cartItems, subtotalValue);

    const pointsDiscountAmount = nectorPoints?.fiat_value || 0;
    const grandTotalValue = subtotalValue + insuranceValue - couponDiscountAmount - pointsDiscountAmount;

    const filteredItemsForGtm = (cartItems || []).filter(
      (item) =>
        item.variantId !== INSURANCE_VARIANT_ID &&
        !(item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift) &&
        !item.properties?.['_byj_parent'] &&
        !(item.properties?.['_byj_group_id'] && !item.properties?.['_byj_preview'])
    );

    // Build-your-jewelry lines carry their own rendered preview, everything else
    // uses the Shopify variant image. Relative paths are made absolute so GTM
    // always receives a full URL.
    const getImageUrl = (item) => {
      const raw = item.properties?.['_byj_preview'] || item.image || "";
      if (!raw) return "";
      if (/^(https?:|data:)/i.test(raw)) return raw;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return raw.startsWith("/") ? `${origin}${raw}` : `${origin}/${raw}`;
    };

    const shippingData = {
      value: grandTotalValue,
      currency: "INR",
      items: filteredItemsForGtm.map((item, idx) => {
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
          image_url: getImageUrl(item),
          index: idx
        };
      }),
      coupon: couponDetails?.code || "NA"
    };

    pushAddShippingInfo(shippingData);
  };

  const isLoading = loadingAddresses;

  const isContinueDisabled = (deliveryMethod === "ship"
    ? (!selectedAddress || !isDeliverable || checkingPincode)
    : !pickup.selectedStoreId) || !selectedBillingAddress;


  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="container-main">
          <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
            <div className="grow lg:basis-[60%] lg:shrink-0 py-10 px-4 lg:pr-12">
              <ShippingSkeleton />
            </div>
            <div className="w-full lg:basis-[40%] lg:shrink-0 py-10 px-4 lg:pl-12 bg-[#FAFAFA]">
              <SummarySkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-clip">
      <div className="container-main relative z-10 max-lg:!px-0">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          <div className="grow lg:basis-[60%] lg:shrink-0 flex flex-col bg-white p-0 lg:pr-12 lg:py-10">
            <h2 className="font-figtree text-[0.6875rem] md:text-[1rem] font-bold md:font-medium text-zinc-900 uppercase tracking-[0.1em] md:tracking-normal leading-normal md:leading-none px-6 lg:px-0 mt-5 md:mt-0 mb-3 md:mb-5">Delivery Method</h2>
            <div className="flex w-full md:max-w-[380px] gap-3 relative z-10 px-6 lg:px-0 -mb-[1px]">
              <button
                onClick={() => setDeliveryMethod("ship")}
                className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 text-[0.875rem] lg:text-[1rem] font-medium transition-all ${deliveryMethod === "ship" ? "bg-[#F5F5F5] lg:bg-[#F9F9F9] text-zinc-900 rounded-t-[10px] rounded-b-none" : "bg-transparent text-zinc-600 hover:bg-zinc-50 rounded-t-[10px] rounded-b-none"
                  }`}
              >
                <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.5 9.83333V1.83333C8.5 1.47971 8.35952 1.14057 8.10948 0.890524C7.85943 0.640476 7.52029 0.5 7.16667 0.5H1.83333C1.47971 0.5 1.14057 0.640476 0.890524 0.890524C0.640476 1.14057 0.5 1.47971 0.5 1.83333V9.16667C0.5 9.34348 0.570238 9.51305 0.695262 9.63807C0.820286 9.7631 0.989856 9.83333 1.16667 9.83333H2.5M2.5 9.83333C2.5 10.5697 3.09695 11.1667 3.83333 11.1667C4.56971 11.1667 5.16667 10.5697 5.16667 9.83333M2.5 9.83333C2.5 9.09695 3.09695 8.5 3.83333 8.5C4.56971 8.5 5.16667 9.09695 5.16667 9.83333M9.16667 9.83333H5.16667M9.16667 9.83333C9.16667 10.5697 9.76362 11.1667 10.5 11.1667C11.2364 11.1667 11.8333 10.5697 11.8333 9.83333M9.16667 9.83333C9.16667 9.09695 9.76362 8.5 10.5 8.5C11.2364 8.5 11.8333 9.09695 11.8333 9.83333M11.8333 9.83333H13.1667C13.3435 9.83333 13.513 9.7631 13.6381 9.63807C13.7631 9.51305 13.8333 9.34348 13.8333 9.16667V6.73333C13.8331 6.58204 13.7813 6.43534 13.6867 6.31733L11.3667 3.41733C11.3043 3.33925 11.2252 3.27619 11.1352 3.2328C11.0452 3.18941 10.9466 3.16681 10.8467 3.16667H8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delivery
                {deliveryMethod === "ship" && (
                  <>
                    <div className="absolute bottom-0 -left-3 w-3 h-3 text-[#F5F5F5] lg:hidden">
                      <svg viewBox="0 0 12 12" fill="currentColor"><path d="M12 12V0C12 6.627 6.627 12 0 12h12z" /></svg>
                    </div>
                    <div className="absolute bottom-0 -right-3 w-3 h-3 text-[#F5F5F5] lg:text-[#F9F9F9]">
                      <svg viewBox="0 0 12 12" fill="currentColor"><path d="M0 12V0c0 6.627 5.373 12 12 12H0z" /></svg>
                    </div>
                  </>
                )}
              </button>
              <button
                onClick={() => setDeliveryMethod("pickup")}
                className={`relative flex-1 flex items-center justify-center gap-2 py-3.5 text-[0.875rem] lg:text-[1rem] font-medium transition-all ${deliveryMethod === "pickup" ? "bg-[#F5F5F5] lg:bg-[#F9F9F9] text-zinc-900 rounded-t-[10px] rounded-b-none" : "bg-transparent text-zinc-600 hover:bg-zinc-50 rounded-t-[10px] rounded-b-none"
                  }`}
              >
                <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.234 13.6993C7.474 12.6287 11.1667 9.162 11.1667 5.83333C11.1667 4.41885 10.6048 3.06229 9.60457 2.0621C8.60438 1.0619 7.24782 0.5 5.83333 0.5C4.41885 0.5 3.06229 1.0619 2.0621 2.0621C1.0619 3.06229 0.5 4.41885 0.5 5.83333C0.5 9.162 4.19267 12.6287 5.43267 13.6993C5.54818 13.7862 5.6888 13.8332 5.83333 13.8332C5.97787 13.8332 6.11848 13.7862 6.234 13.6993Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5.83333 7.83333C6.9379 7.83333 7.83333 6.9379 7.83333 5.83333C7.83333 4.72876 6.9379 3.83333 5.83333 3.83333C4.72876 3.83333 3.83333 4.72876 3.83333 5.83333C3.83333 6.9379 4.72876 7.83333 5.83333 7.83333Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Pickup
                {deliveryMethod === "pickup" && (
                  <>
                    <div className="absolute bottom-0 -left-3 w-3 h-3 text-[#F5F5F5] lg:text-[#F9F9F9]">
                      <svg viewBox="0 0 12 12" fill="currentColor"><path d="M12 12V0C12 6.627 6.627 12 0 12h12z" /></svg>
                    </div>
                    <div className="absolute bottom-0 -right-3 w-3 h-3 text-[#F5F5F5] lg:text-[#F9F9F9]">
                      <svg viewBox="0 0 12 12" fill="currentColor"><path d="M0 12V0c0 6.627 5.373 12 12 12H0z" /></svg>
                    </div>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#F5F5F5] lg:bg-[#F9F9F9] px-4 py-6 md:p-6 lg:p-8 lg:rounded-tr-[10px] lg:rounded-b-[10px] rounded-none relative z-0 lg:mt-0">
              {deliveryMethod === "ship" ? (
                <div key="ship" className="space-y-6">
                  {loadingAddresses ? (
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-6 text-zinc-600 bg-white">
                      <Loader2 className="size-5 animate-spin" />
                      Loading saved addresses...
                    </div>
                  ) : hasSavedAddresses ? (
                    shippingView === "form" ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => { setShippingView("card"); setDialogMode(""); }} className="text-zinc-500 hover:text-zinc-900">
                            <ChevronLeft className="size-5" />
                          </button>
                          <h3 className="font-figtree text-[0.9375rem] lg:text-[1rem] font-medium text-black">{dialogMode === "edit" ? "Edit Address" : "Shipping Address"}</h3>
                        </div>
                        <AddressForm
                          form={addressForm}
                          onChange={updateForm}
                          makeDefault={makeDefault}
                          onDefaultChange={setMakeDefault}
                          isCompanyPurchase={isCompanyPurchase}
                          onCompanyPurchaseChange={setIsCompanyPurchase}
                          submitLabel={dialogMode === "edit" ? "Save Changes" : "Save Address"}
                          onSubmit={dialogMode === "edit" ? handleUpdateAddress : () => handleCreateAddress(true)}
                          saving={dialogSaving}
                          hideEmail={addresses.length > 0}
                        />
                      </div>
                    ) : shippingView === "list" ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => dialogMode ? setDialogMode("") : setShippingView("card")} className="text-zinc-500 hover:text-zinc-900">
                            <ChevronLeft className="size-5" />
                          </button>
                          <h3 className="font-figtree text-[0.9375rem] lg:text-[1.0625rem] font-bold text-black">Select Address</h3>
                        </div>

                        {dialogMode === "create" ? (
                          <div ref={addressFormRef} className="space-y-5">
                            <h4 className="text-center text-[0.9375rem] lg:text-[1.0625rem] font-semibold font-figtree text-[#5A413F]">Adding New Address</h4>
                            <div className="">
                              <AddressForm
                                form={addressForm}
                                onChange={updateForm}
                                makeDefault={makeDefault}
                                onDefaultChange={setMakeDefault}
                                isCompanyPurchase={isCompanyPurchase}
                                onCompanyPurchaseChange={setIsCompanyPurchase}
                                submitLabel="Save Address"
                                onSubmit={async () => {
                                  await handleCreateAddress(true);
                                  setDialogMode(""); // Close inline form on success
                                }}
                                saving={dialogSaving}
                                hideEmail={addresses.length > 0}
                              >
                                <Button type="button" onClick={() => setDialogMode("")} className="flex-1 h-[46px] bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 font-figtree font-medium text-[0.875rem] lg:text-[0.9375rem] rounded-[4px] transition-colors">
                                  Cancel
                                </Button>
                              </AddressForm>
                            </div>
                          </div>
                        ) : dialogMode === "edit" ? (
                          <div ref={addressFormRef} className="space-y-5">
                            <h4 className="text-center text-[0.9375rem] lg:text-[1.0625rem] font-semibold font-figtree text-[#5A413F]">Editing Address</h4>
                            <div className="">
                              <AddressForm
                                form={addressForm}
                                onChange={updateForm}
                                makeDefault={makeDefault}
                                onDefaultChange={setMakeDefault}
                                isCompanyPurchase={isCompanyPurchase}
                                onCompanyPurchaseChange={setIsCompanyPurchase}
                                submitLabel="Save Changes"
                                onSubmit={async () => {
                                  await handleUpdateAddress();
                                  setDialogMode(""); // Close inline form on success
                                }}
                                saving={dialogSaving}
                                hideEmail={addresses.length > 0}
                              >
                                <Button type="button" onClick={() => setDialogMode("")} className="flex-1 h-[46px] bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 font-figtree font-medium text-[0.875rem] lg:text-[0.9375rem] rounded-[4px] transition-colors">
                                  Cancel
                                </Button>
                              </AddressForm>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setDialogMode("create");
                              setEditingAddressId("");
                              setAddressForm(normalizeAddressForm({}, customer || user || {}));
                              setMakeDefault(!hasSavedAddresses);
                              setIsCompanyPurchase(false);
                              setTimeout(() => {
                                addressFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 50);
                            }}
                            className="w-full h-[52px] rounded-md border-dashed border border-[#5A413F]/40 text-[#5A413F] bg-white hover:bg-[#FCF9F8] transition-colors flex items-center justify-center gap-2 font-figtree font-medium text-[0.9375rem] lg:text-[1rem]"
                          >
                            <Plus size={18} />
                            Add New Address
                          </button>
                        )}

                        <div className="space-y-4 pt-2">
                          <h4 className="font-figtree text-[0.875rem] lg:text-[1rem] font-semibold text-black">Saved Addresses</h4>
                          <AddressListInline
                            addresses={addresses}
                            selectedAddressId={selectedAddressId}
                            onSelect={async (id) => {
                              await selectAddress(id);
                              setShippingView("card");
                            }}
                            onDelete={deleteAddress}
                            onEdit={(address) => {
                                  setDialogMode("edit");
                                  setEditingAddressId(address.id);
                                  setAddressForm(normalizeAddressForm(address, customer || user || {}));
                                  setMakeDefault(Boolean(address.isDefault));
                                  setIsCompanyPurchase(Boolean(address.company || address.gstin));
                                  setTimeout(() => {
                                    addressFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }, 50);
                                }}
                                radioGroupName="all-shipping-addresses"
                              />
                            </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="font-figtree text-[0.9375rem] lg:text-[1.0625rem] font-medium text-black">Shipping Address</h3>
                        <AddressSummaryCard
                          address={selectedAddress}
                          onEdit={() => openEditDialog(selectedAddress)}
                          onChangeClick={() => setShippingView("list")}
                        />

                        {!isDeliverable && selectedAddress && !checkingPincode && (
                          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
                            <XCircle className="size-5 shrink-0" />
                            <p className="text-sm font-bold uppercase tracking-tight">We are not delivering product on this address</p>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-figtree text-[0.9375rem] lg:text-[1.0625rem] font-medium text-black">Shipping Address</h3>
                      <AddressForm
                        form={addressForm}
                        onChange={updateForm}
                        makeDefault={makeDefault}
                        onDefaultChange={setMakeDefault}
                        isCompanyPurchase={isCompanyPurchase}
                        onCompanyPurchaseChange={setIsCompanyPurchase}
                        submitLabel="Save Address"
                        onSubmit={() => handleCreateAddress(false)}
                        saving={inlineSaving}
                      />
                    </div>
                  )}

                  <BillingAddressSection
                    isDesktop={isDesktop}
                    addresses={addresses}
                    customer={customer}
                    user={user}
                    createAddress={createAddress}
                    deleteAddress={deleteAddress}
                    billingAddressMode={billingAddressMode}
                    selectedBillingAddress={selectedBillingAddress}
                    setBillingMode={setBillingMode}
                    selectBillingAddress={selectBillingAddress}
                  />


                </div>
              ) : (
                <div key="pickup" className="space-y-6">
                  <StorePickupSection
                    isDesktop={isDesktop}
                    pickup={pickup}
                    pickupPhone={pickupPhone}
                    setPickupPhone={setPickupPhone}
                  />

                  <BillingAddressSection
                    isDesktop={isDesktop}
                    isPickup={true}
                    addresses={addresses}
                    customer={customer}
                    user={user}
                    createAddress={createAddress}
                    deleteAddress={deleteAddress}
                    billingAddressMode={billingAddressMode}
                    selectedBillingAddress={selectedBillingAddress}
                    setBillingMode={setBillingMode}
                    selectBillingAddress={selectBillingAddress}
                  />
                </div>
              )}

              <div className="hidden lg:flex flex-col md:flex-row items-center justify-between gap-6 pt-10 px-2">
                <Link prefetch={false} href="/checkout/cart" className="flex items-center gap-1.5 text-[0.975rem] capitalize font-semibold text-accent hover:opacity-80 transition-opacity">
                  <ChevronLeft className="size-4" />
                  Return to cart
                </Link>
              </div>
            </div>
          </div>

          <div className="w-full lg:basis-[40%] lg:shrink-0 relative">
            <div className="hidden lg:block absolute inset-y-0 left-0 w-screen border-l border-zinc-100 z-0" />
            <div className="relative z-10 py-6 px-4 lg:px-0 lg:py-10 lg:pl-12 lg:pr-12 mb-0 lg:bg-transparent min-h-full bg-white scroll-mt-16" ref={summaryRef}>
              <div className="lg:sticky lg:top-4 space-y-6">
                {deliveryMethod === "ship" && hasSavedAddresses && (
                  <div className="pt-6 border-t border-zinc-200 lg:border-none lg:pt-0">
                    <h3 className="text-[14px] lg:text-[0.875rem] font-figtree font-medium lg:font-bold text-black uppercase tracking-normal lg:tracking-wide leading-none lg:leading-normal mb-4">DELIVERY ESTIMATES</h3>
                    <div className="space-y-4">
                      {cartItems.filter(i => i.variantId !== INSURANCE_VARIANT_ID && i.variantId !== GOLDCOIN_VARIANT_ID && !i.properties?.['_byj_parent'] && !(i.properties?.['_byj_group_id'] && !i.properties?.['_byj_preview'])).map((item, idx) => {
                        const isBYJ = item.properties?.['_byj_preview'];
                        const displayImage = isBYJ ? item.properties['_byj_preview'] : item.image;
                        return (
                          <div key={idx} className="flex gap-4 items-center">
                            <div className="w-20 h-20 bg-[#FAFAFA] rounded-md shrink-0 p-1 flex items-center justify-center">
                              {displayImage && (
                                <Image src={displayImage} alt={item.title || "Product"} width={80} height={80} className="w-full h-full object-contain mix-blend-multiply" />
                              )}
                            </div>
                            <div>
                              <p className="text-[0.8125rem] lg:text-[0.875rem] font-figtree text-black mb-1">Estimated Dispatch by</p>
                              <p className="text-[14px] lg:text-[1rem] font-figtree font-semibold leading-none lg:leading-normal tracking-normal text-black align-middle lg:align-baseline">
                                {getEstimatedDispatchDate(item.inStock, item.leadTime).replace(/Estimated dispatch by /i, "")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <CheckoutSummary showItems={false} showContact={false}>
                  {/* Desktop Button - Moved inside to match cart and payment pages */}
                  <div className="hidden lg:block mt-6 pt-4 border-t border-zinc-200 sticky bottom-0 bg-white z-20 pb-4">
                    <Button
                      disabled={isContinueDisabled}
                      onClick={() => {
                        if (isContinueDisabled) {
                          toast.error(`Please select a valid ${deliveryMethod === "ship" ? "shipping address" : "pickup location"}`);
                          return;
                        }
                        handleContinueToPayment();
                        router.push("/checkout/payment");
                      }}
                      className="w-full flex shrink-0 items-center justify-center rounded-[4px] bg-[#5A413F] h-[50px] font-figtree font-medium uppercase tracking-wider text-[1.0625rem] text-white cursor-pointer hover:bg-[#4A312F] transition-colors"
                    >
                      CONTINUE TO PAYMENT
                    </Button>
                  </div>
                </CheckoutSummary>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-[1.125rem] font-semibold text-black leading-none font-figtree tracking-normal">
              ₹{finalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <button
              onClick={scrollToSummary}
              className="text-[0.875rem] lg:text-[0.9375rem] font-medium text-black cursor-pointer font-figtree"
            >
              View Order Summary
            </button>
          </div>
          <Link prefetch={false} href="/checkout/payment" className={`w-full block ${isContinueDisabled ? "pointer-events-none opacity-50" : ""}`} onClick={handleContinueToPayment}>
            <Button
              disabled={isContinueDisabled}
              className="w-full flex items-center justify-center rounded-[4px] bg-[#5A413F] hover:bg-[#4A312F] h-[50px] font-figtree font-medium uppercase tracking-wider text-[0.9375rem] lg:text-[1.0625rem] text-white cursor-pointer transition-colors disabled:cursor-not-allowed"
            >
              CONTINUE TO PAYMENT
            </Button>
          </Link>
        </div>
      </div>

      {/* AUTHENTICATION OVERLAY */}
      {!isAuthenticated && (
        isDesktop ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#00000099]">
            <div className="bg-white rounded-lg shadow-2xl max-w-[420px] w-full overflow-hidden">
              <CheckoutAuthForm onSuccess={() => { }} />
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[110] bg-[#00000099]">
            <MobileBottomSheet isOpen={true} onClose={() => { }} title="Checkout Securely" hideHeader={true} detent="content-height" hideDragHandle={true} disableDrag={true}>
              <CheckoutAuthForm onSuccess={() => { }} />
            </MobileBottomSheet>
          </div>
        )
      )}
    </div>
  );
}
