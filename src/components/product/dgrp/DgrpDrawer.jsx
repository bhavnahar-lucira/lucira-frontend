"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Clock,
  Gift,
  Truck,
  Store,
  CheckCircle2,
  Loader2,
  Coins,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";
import { createDgrpAdvanceOrder, verifyDgrpAdvancePayment } from "@/lib/api";
import { useStorePickup } from "@/hooks/checkout/useStorePickup";
import { StorePickupSection } from "@/components/checkout/shipping/StorePickupSection";
import { useCustomerAddresses } from "@/hooks/checkout/useCustomerAddresses";
import {
  emptyAddressForm,
  normalizeAddressForm,
  validateAddressForm,
  INDIAN_STATES,
} from "@/lib/checkout/address-helpers";
import { cleanPhoneInput, toTenDigit } from "@/lib/phone";
import shopifyLoader from "@/utils/shopifyLoader";

// Shopify CDN Assets for Lock & Key DGRP Drawer
const DGRP_ASSETS = {
  goldIcon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/gold-icon-image.png?v=1791012529",
  lockKeyLogo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/lock-_-key-image_00101f3b-6800-4911-a09b-d121c52996ff.png?v=1791012529",
  pendant: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/dgrp-pendant.png?v=1791012529",
  vectorUp: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Vector_e4c67206-c91d-462a-8ac5-5fa67efde47f.png?v=1791012545",
  vectorDown: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Vector-1.png?v=1791012545",
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
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

export default function DgrpDrawer({
  isOpen,
  onClose,
  product,
  activeVariant,
  currentPrice = 0,
  lockedGoldRate = 15802,
  isDiamond = true,
  tenureMonths = 6,
  advanceAmount = 0,
  monthlyEmi = 0,
}) {
  const router = useRouter();
  const { user, accessToken } = useSelector((state) => state.user || {});

  // Steps: 1 = Offer Breakdown, 2 = Address & Payment, 3 = Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

  // Address & Form state matching shipping page
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [isCompanyPurchase, setIsCompanyPurchase] = useState(false);
  const [makeDefault, setMakeDefault] = useState(true);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);

  // Customer addresses hook
  const { addresses, createAddress } = useCustomerAddresses({ accessToken, user });

  // Store Pickup hook matching shipping page flow
  const pickup = useStorePickup({ selectedShippingZip: addressForm.zip });

  const updateAddressField = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePincodeChange = (value) => {
    const cleanZip = value.replace(/\D/g, "").slice(0, 6);
    updateAddressField("zip", cleanZip);
    if (cleanZip.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${cleanZip}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            setAddressForm((prev) => ({
              ...prev,
              city: prev.city || po.District || po.Block || "",
              province: prev.province || po.State || "",
            }));
          }
        })
        .catch(() => {});
    }
  };

  // Prevent Radix body pointer-events lock when Razorpay opens
  useEffect(() => {
    if (!isRazorpayOpen) return;

    const originalPointerEvents = document.body.style.pointerEvents;
    document.body.style.pointerEvents = "auto";

    const fixInterval = setInterval(() => {
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "auto";
      }
      const rzpContainer = document.querySelector(".razorpay-container");
      if (rzpContainer) {
        rzpContainer.style.pointerEvents = "auto";
        rzpContainer.style.zIndex = "2147483647";
      }
    }, 100);

    return () => {
      clearInterval(fixInterval);
      document.body.style.pointerEvents = originalPointerEvents || "";
    };
  }, [isRazorpayOpen]);

  // Reset and pre-fill address on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const defaultAddr = addresses?.find((a) => a.isDefault) || addresses?.[0];
      if (defaultAddr) {
        setAddressForm(normalizeAddressForm(defaultAddr, user || {}));
        setIsCompanyPurchase(Boolean(defaultAddr.company || defaultAddr.gstin));
      } else if (user) {
        setAddressForm(normalizeAddressForm({}, user || {}));
      }
    }
  }, [isOpen, addresses, user]);

  const handleSaveAddressClick = async () => {
    const validationError = validateAddressForm(addressForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      setIsSavingAddress(true);
      if (createAddress && accessToken && !accessToken.startsWith("simulated_")) {
        await createAddress(addressForm, { makeDefault });
      }
      toast.success("Address saved");
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("address already exists")) {
        toast.success("Address saved");
      } else {
        toast.error(err.message || "Unable to save address");
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

  const formatPrice = (val) => {
    if (!val) return "0";
    return Number(val).toLocaleString("en-IN");
  };

  const totalInstallmentSum = monthlyEmi * tenureMonths;
  const rateHighSim = Math.round(lockedGoldRate * 1.18);
  const rateLowSim = Math.round(lockedGoldRate * 0.92);

  // Handle Pay 10% Advance via Razorpay
  const handlePayAdvance = async () => {
    if (deliveryMethod === "delivery") {
      const validationError = validateAddressForm(addressForm);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    } else {
      const cleanPhone = (addressForm.phone || "").replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        toast.error("Please enter a valid 10-digit Indian mobile number");
        return;
      }
      if (!pickup.selectedStore) {
        toast.error("Please find and select a store for pickup");
        return;
      }
    }

    try {
      setLoading(true);
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error("Unable to initialize payment gateway. Please check your connection.");
      }

      const resolvedAddress = deliveryMethod === "pickup"
        ? {
            delivery_method: "pickup",
            is_company: false,
            first_name: addressForm.firstName,
            last_name: addressForm.lastName,
            store_id: pickup.selectedStore?.id || "",
            store_name: pickup.selectedStore?.name || pickup.selectedStore?.code || "",
            address_line: pickup.selectedStore?.address || "",
            landmark: pickup.selectedStore?.name || "",
            pincode: pickup.selectedStore?.zip || "",
            city: pickup.selectedStore?.city || "",
            state: pickup.selectedStore?.state || "",
            country: "India",
            mobile: addressForm.phone,
            email: addressForm.email,
          }
        : {
            delivery_method: "delivery",
            is_company: isCompanyPurchase,
            company: isCompanyPurchase ? addressForm.company : "",
            gstin: isCompanyPurchase ? addressForm.gstin : "",
            first_name: addressForm.firstName,
            last_name: addressForm.lastName,
            address_line: addressForm.address1,
            landmark: addressForm.address2,
            pincode: addressForm.zip,
            city: addressForm.city,
            state: addressForm.province,
            country: "India",
            mobile: addressForm.phone,
            email: addressForm.email,
          };

      const orderPayload = {
        product: {
          id: product?.id || product?.shopifyId,
          variantId: activeVariant?.id,
          title: product?.title || "Jewelry Item",
          image: activeVariant?.image?.url || product?.featuredImage?.url || (product?.media && product?.media[0]?.url) || "",
          sku: activeVariant?.sku || product?.sku || "",
          metal_purity: activeVariant?.metafields?.metal_purity || "18KT",
          metal_color: activeVariant?.metafields?.metal_color || "Yellow Gold",
          metal_weight: Number(activeVariant?.metafields?.metal_weight || 2.5),
          diamond_carat: Number(activeVariant?.metafields?.diamond_carat || 0),
          is_diamond: isDiamond,
        },
        product_price: currentPrice,
        locked_gold_rate: lockedGoldRate,
        is_diamond: isDiamond,
        customer: {
          user_id: user?.id || null,
          first_name: addressForm.firstName,
          last_name: addressForm.lastName,
          email: addressForm.email,
          mobile: addressForm.phone,
        },
        shipping_address: resolvedAddress,
      };

      const orderData = await createDgrpAdvanceOrder(orderPayload);

      if (!orderData || !orderData.orderId) {
        throw new Error(orderData?.message || "Failed to create advance payment order");
      }

      const razorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: "INR",
        name: "Lucira Jewelry",
        description: `10% Lock & Key Advance: ${product?.title?.slice(0, 30)}`,
        order_id: orderData.orderId,
        prefill: {
          name: `${addressForm.firstName} ${addressForm.lastName}`.trim(),
          email: addressForm.email,
          contact: addressForm.phone,
        },
        theme: {
          color: "#5A413F",
        },
        notes: {
          delivery_method: deliveryMethod,
          shipping_address: deliveryMethod === "pickup"
            ? `Pickup at ${pickup.selectedStore?.name}: ${pickup.selectedStore?.address}, ${pickup.selectedStore?.city}`
            : `${addressForm.address1}, ${addressForm.address2 ? addressForm.address2 + ", " : ""}${addressForm.city}, ${addressForm.province} - ${addressForm.zip}`,
        },
        handler: async function (response) {
          setIsRazorpayOpen(false);
          try {
            setLoading(true);
            const verifyPayload = {
              dgrpOrderId: orderData.dgrpOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };

            await verifyDgrpAdvancePayment(verifyPayload);
            toast.success("10% Advance received! Gold rate successfully locked.");
            setStep(3);
          } catch (verifyErr) {
            console.error("Advance verification error:", verifyErr);
            toast.error(verifyErr.message || "Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsRazorpayOpen(false);
            setLoading(false);
            toast.info("Payment window closed.");
          },
          confirm_close: false,
          escape: true,
          backdropclose: true,
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.on("payment.failed", function (response) {
        toast.error(response.error?.description || "Payment failed");
        setIsRazorpayOpen(false);
        setLoading(false);
      });

      setIsRazorpayOpen(true);
      rzp.open();
    } catch (err) {
      console.error("Advance order error:", err);
      toast.error(err.message || "Failed to process payment");
      setIsRazorpayOpen(false);
      setLoading(false);
    }
  };

  const productImgSrc =
    activeVariant?.image?.url ||
    product?.featuredImage?.url ||
    (product?.media && product?.media[0]?.url) ||
    "";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (isRazorpayOpen) return;
        if (!open) onClose?.();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[440px] p-0 overflow-y-auto bg-white border-l border-zinc-200 z-[600]"
        style={{ maxWidth: "440px" }}
        showCloseButton={false}
        onPointerDownOutside={(e) => {
          if (isRazorpayOpen || document.querySelector(".razorpay-container")) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isRazorpayOpen || document.querySelector(".razorpay-container")) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          e.preventDefault();
        }}
      >
        <SheetTitle className="sr-only">Lock &amp; Key - Gold Rate Protection</SheetTitle>

        {/* Header Bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between bg-white px-5 sm:px-6 pt-5 pb-3 font-figtree">
          <h2 className="font-abhaya text-2xl font-semibold tracking-tight text-[#1F1918]">
            Lock &amp; Key
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 1: Offer Breakdown (Exact Figma Frame 1 Design) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="px-5 sm:px-6 pb-6 pt-1 space-y-4 font-figtree animate-in fade-in duration-200">
            {/* Hero Wrapper: Chain begins from the very top behind the Gold Rate Banner */}
            <div className="relative -mx-5 sm:-mx-6 overflow-hidden isolate">
              {/* Live Gold Rate Banner (z-20 to sit on top of the chain) */}
              <div className="relative z-20 mx-5 sm:mx-6 rounded-[8px] bg-[#F7EFE8] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative size-8 rounded-full overflow-hidden shrink-0">
                    <Image
                      loader={shopifyLoader}
                      src={DGRP_ASSETS.goldIcon}
                      alt="Current 24KT Gold Rate"
                      width={64}
                      height={64}
                      className="size-full object-cover"
                      priority
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#2D201E] leading-tight">
                      Current 24KT Gold Rate
                    </p>
                    <p className="text-[9.5px] text-[#7A6A64] mt-0.5">
                      Last Updated Today 10:00 am
                    </p>
                  </div>
                </div>
                <span className="rounded-[6px] bg-[#523A36] px-2.5 py-1 text-[11.5px] font-semibold text-white tracking-wide">
                  ₹{formatPrice(lockedGoldRate)}/gm
                </span>
              </div>

              {/* Full-width Chain & Diamond Pendant: starts behind the banner and sweeps down */}
              <div
                className="relative w-full aspect-[864/1008] max-w-full mx-auto -mt-10 sm:-mt-11"
                style={{ marginTop: "calc(var(--spacing, 0.25rem) * -22)" }}
              >
                {/* Full background chain with diamond pendant hanging at base */}
                <Image
                  loader={shopifyLoader}
                  src={DGRP_ASSETS.pendant}
                  alt="Diamond Pendant Frame"
                  fill
                  className="object-contain pointer-events-none select-none z-10"
                  priority
                />

                {/* Content nestled inside the chain loop: starts below banner and ends above bail */}
                <div
                  className="absolute inset-x-0 top-[140px] bottom-[50%] z-20 flex flex-col items-center justify-center p-0 text-center"
                  style={{ top: "160px" }}
                >
                  {/* Lock & Key Stylized Logo: translate-x-[5.8%] centers the keyhole and 'Lock' text with the chain and pendant */}
                  <div className="relative w-[225px] max-w-full aspect-[528/380] translate-x-[5.8%]">
                    <Image
                      loader={shopifyLoader}
                      src={DGRP_ASSETS.lockKeyLogo}
                      alt="Lock & Key"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  {/* Slogan sitting snugly above the chevron bail */}
                  <p className="font-figtree text-[12.5px] sm:text-[13.5px] font-medium text-[#2D201E] leading-[1.25] mt-1 sm:mt-1.5">
                    Lock Gold Rate &amp;<br />
                    Unlock Luxury
                  </p>
                </div>
              </div>

              {/* Offer announcement directly below the diamond pendant */}
              <div className="text-center font-figtree mt-[18px] px-4">
                <p className="text-[12.5px] sm:text-[13px] text-[#4A3F3D] font-normal">
                  Lock Gold Rate just by paying 10% &amp; get
                </p>
                <p className="text-[16px] sm:text-[17px] font-semibold text-[#1C1917] mt-0.5 tracking-tight">
                  Free Diamond Pendent
                </p>
              </div>
            </div>

            {/* Formula Row (Pay Now + Installments → Total) */}
            <div className="flex items-center justify-around my-5 px-1 text-center font-figtree">
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[#7A6A64] font-medium">Pay Now</span>
                <span className="text-[16px] sm:text-[17px] font-semibold text-[#1C1917] mt-1">
                  ₹{formatPrice(advanceAmount)}
                </span>
              </div>
              <span className="text-zinc-400 font-medium text-base pb-1">+</span>
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[#7A6A64] font-medium">Installments</span>
                <span className="text-[16px] sm:text-[17px] font-semibold text-[#1C1917] mt-1">
                  ₹{formatPrice(monthlyEmi)}
                </span>
                <span className="text-[10px] text-[#7A6A64] font-normal mt-0.5">
                  x {tenureMonths} Months
                </span>
              </div>
              <span className="text-zinc-400 font-medium text-base pb-1">→</span>
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[#7A6A64] font-medium">Total</span>
                <span className="text-[16px] sm:text-[17px] font-semibold text-[#1C1917] mt-1">
                  ₹{formatPrice(currentPrice)}
                </span>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="font-figtree">
              <h4
                className="text-[0.8125rem] sm:text-[0.875rem] text-[#1C1917] tracking-tight"
                style={{
                  marginBottom: "14px",
                  fontWeight: 600,
                }}
              >
                How It Works if you Lock Gold at ₹{formatPrice(lockedGoldRate)}/gm
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Increase Benefit Card */}
                <div
                  className="rounded-[8px] p-2.5 sm:p-3 flex flex-col justify-between gap-2.5"
                  style={{ background: "#fff4e6d6" }}
                >
                  <div className="flex items-start gap-1.5">
                    <Image
                      loader={shopifyLoader}
                      src={DGRP_ASSETS.vectorUp}
                      alt="Gold rate increases"
                      width={16}
                      height={16}
                      className="size-4 object-contain shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] sm:text-[10.5px] text-[#2D201E] leading-tight">
                      If Gold Rate Increases to<br />
                      <strong className="font-semibold text-[#1C1917]">₹{formatPrice(rateHighSim)}/gm</strong>
                    </p>
                  </div>
                  <div className="rounded-[6px] bg-white py-1.5 px-2 text-center text-[10px] sm:text-[10.5px] font-medium text-[#2D201E]">
                    You will pay only <strong className="font-semibold">₹{formatPrice(lockedGoldRate)}/gm</strong>
                  </div>
                </div>

                {/* Decrease Benefit Card */}
                <div
                  className="rounded-[8px] p-2.5 sm:p-3 flex flex-col justify-between gap-2.5"
                  style={{ background: "#fff4e6d6" }}
                >
                  <div className="flex items-start gap-1.5">
                    <Image
                      loader={shopifyLoader}
                      src={DGRP_ASSETS.vectorDown}
                      alt="Gold rate decreases"
                      width={16}
                      height={16}
                      className="size-4 object-contain shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] sm:text-[10.5px] text-[#2D201E] leading-tight">
                      If Gold Rate Decreases to<br />
                      <strong className="font-semibold text-[#1C1917]">₹{formatPrice(rateLowSim)}/gm</strong>
                    </p>
                  </div>
                  <div className="rounded-[6px] bg-white py-1.5 px-2 text-center text-[10px] sm:text-[10.5px] font-medium text-[#2D201E]">
                    Can Pre-close at <strong className="font-semibold">₹{formatPrice(rateLowSim)}/gm</strong>
                  </div>
                </div>
              </div>

              <p className="text-center text-[10.5px] text-[#4A3F3D] font-normal pt-1 pb-0.5">
                Win - Win Situation
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={() => setStep(2)}
              className="w-full h-[50px] bg-[#523A36] hover:bg-[#422D2A] text-white font-figtree font-semibold uppercase tracking-wider text-[13px] sm:text-[14px] rounded-[6px] transition-colors cursor-pointer shadow-xs"
            >
              CONTINUE
            </Button>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 2: Address & Payment */}
        {/* ───────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 font-figtree animate-in fade-in duration-200">
            {/* Live Gold Rate Banner in Step 2 */}
            <div className="rounded-[8px] bg-[#F7EFE8] px-3 py-2 flex items-center justify-between font-figtree">
              <div className="flex items-center gap-2.5">
                <div className="relative size-8 rounded-full overflow-hidden shrink-0">
                  <Image
                    loader={shopifyLoader}
                    src={DGRP_ASSETS.goldIcon}
                    alt="Current 24KT Gold Rate"
                    width={64}
                    height={64}
                    className="size-full object-cover"
                    priority
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#2D201E] leading-tight">
                    Current 24KT Gold Rate
                  </p>
                  <p className="text-[9.5px] text-[#7A6A64] mt-0.5">
                    Last Updated Today 10:00 am
                  </p>
                </div>
              </div>
              <span className="rounded-[6px] bg-[#523A36] px-2.5 py-1 text-[11.5px] font-semibold text-white tracking-wide">
                ₹{formatPrice(lockedGoldRate)}/gm
              </span>
            </div>

            {/* Breakdown Rows */}
            <div className="space-y-2.5 font-figtree text-[12.5px] pt-0.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-800">
                  <Calendar size={14} className="text-[#5A413F]" />
                  10% Advance Payment
                </span>
                <span className="font-semibold text-zinc-900">₹{formatPrice(advanceAmount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-800">
                  <CreditCard size={14} className="text-[#5A413F]" />
                  Monthly Premium
                </span>
                <span className="font-semibold text-zinc-900">₹{formatPrice(monthlyEmi)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-800">
                  <Clock size={14} className="text-[#5A413F]" />
                  Total Installment ({tenureMonths} months)
                </span>
                <span className="font-semibold text-zinc-900">₹{formatPrice(totalInstallmentSum)}</span>
              </div>

              <div className="flex items-center justify-between text-zinc-800">
                <span className="flex items-center gap-2">
                  <Gift size={14} className="text-[#5A413F]" />
                  Free Diamond Pendant
                </span>
                <span className="font-semibold text-[#189351]">
                  Free <span className="line-through text-zinc-400 font-normal ml-1">₹15,000</span>
                </span>
              </div>
            </div>

            {/* Delivery Method Tabs — matching checkout shipping page */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-800 font-figtree">
                DELIVERY METHOD
              </label>

              <div className="flex w-full gap-2 relative z-10 -mb-[1px]">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] sm:text-[12.5px] font-medium transition-all cursor-pointer font-figtree ${
                    deliveryMethod === "delivery"
                      ? "bg-[#F5F5F5] text-zinc-900 rounded-t-[8px] rounded-b-none font-semibold"
                      : "bg-transparent text-zinc-600 hover:bg-zinc-50 rounded-t-[8px] rounded-b-none"
                  }`}
                >
                  <svg width="14" height="11" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.5 9.83333V1.83333C8.5 1.47971 8.35952 1.14057 8.10948 0.890524C7.85943 0.640476 7.52029 0.5 7.16667 0.5H1.83333C1.47971 0.5 1.14057 0.640476 0.890524 0.890524C0.640476 1.14057 0.5 1.47971 0.5 1.83333V9.16667C0.5 9.34348 0.570238 9.51305 0.695262 9.63807C0.820286 9.7631 0.989856 9.83333 1.16667 9.83333H2.5M2.5 9.83333C2.5 10.5697 3.09695 11.1667 3.83333 11.1667C4.56971 11.1667 5.16667 10.5697 5.16667 9.83333M2.5 9.83333C2.5 9.09695 3.09695 8.5 3.83333 8.5C4.56971 8.5 5.16667 9.09695 5.16667 9.83333M9.16667 9.83333H5.16667M9.16667 9.83333C9.16667 10.5697 9.76362 11.1667 10.5 11.1667C11.2364 11.1667 11.8333 10.5697 11.8333 9.83333M9.16667 9.83333C9.16667 9.09695 9.76362 8.5 10.5 8.5C11.2364 8.5 11.8333 9.09695 11.8333 9.83333M11.8333 9.83333H13.1667C13.3435 9.83333 13.513 9.7631 13.6381 9.63807C13.7631 9.51305 13.8333 9.34348 13.8333 9.16667V6.73333C13.8331 6.58204 13.7813 6.43534 13.6867 6.31733L11.3667 3.41733C11.3043 3.33925 11.2252 3.27619 11.1352 3.2328C11.0452 3.18941 10.9466 3.16681 10.8467 3.16667H8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Delivery
                  {deliveryMethod === "delivery" && (
                    <>
                      <div className="absolute bottom-0 -left-3 w-3 h-3 text-[#F5F5F5]">
                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M12 12V0C12 6.627 6.627 12 0 12h12z" /></svg>
                      </div>
                      <div className="absolute bottom-0 -right-3 w-3 h-3 text-[#F5F5F5]">
                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M0 12V0c0 6.627 5.373 12 12 12H0z" /></svg>
                      </div>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] sm:text-[12.5px] font-medium transition-all cursor-pointer font-figtree ${
                    deliveryMethod === "pickup"
                      ? "bg-[#F5F5F5] text-zinc-900 rounded-t-[8px] rounded-b-none font-semibold"
                      : "bg-transparent text-zinc-600 hover:bg-zinc-50 rounded-t-[8px] rounded-b-none"
                  }`}
                >
                  <svg width="11" height="14" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.234 13.6993C7.474 12.6287 11.1667 9.162 11.1667 5.83333C11.1667 4.41885 10.6048 3.06229 9.60457 2.0621C8.60438 1.0619 7.24782 0.5 5.83333 0.5C4.41885 0.5 3.06229 1.0619 2.0621 2.0621C1.0619 3.06229 0.5 4.41885 0.5 5.83333C0.5 9.162 4.19267 12.6287 5.43267 13.6993C5.54818 13.7862 5.6888 13.8332 5.83333 13.8332C5.97787 13.8332 6.11848 13.7862 6.234 13.6993Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.83333 7.83333C6.9379 7.83333 7.83333 6.9379 7.83333 5.83333C7.83333 4.72876 6.9379 3.83333 5.83333 3.83333C4.72876 3.83333 3.83333 4.72876 3.83333 5.83333C3.83333 6.9379 4.72876 7.83333 5.83333 7.83333Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Pickup
                  {deliveryMethod === "pickup" && (
                    <>
                      <div className="absolute bottom-0 -left-3 w-3 h-3 text-[#F5F5F5]">
                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M12 12V0C12 6.627 6.627 12 0 12h12z" /></svg>
                      </div>
                      <div className="absolute bottom-0 -right-3 w-3 h-3 text-[#F5F5F5]">
                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M0 12V0c0 6.627 5.373 12 12 12H0z" /></svg>
                      </div>
                    </>
                  )}
                </button>
              </div>

              {/* Tab Body */}
              <div className="bg-[#F5F5F5] -mx-4 sm:-mx-5 px-4 sm:px-5 py-3.5 rounded-b-[10px] space-y-3">
                {deliveryMethod === "delivery" ? (
                  <div className="space-y-2.5 font-figtree">
                    <h3 className="font-figtree text-[13px] sm:text-[13.5px] font-medium text-black">
                      Shipping Address
                    </h3>

                    {/* Purchasing for Company Toggle */}
                    <div className="flex items-center justify-between gap-3 py-0.5">
                      <label
                        htmlFor="drawer-company-purchase"
                        className="text-[12px] font-medium font-figtree text-zinc-500 cursor-pointer"
                      >
                        Purchasing for / under Company
                      </label>
                      <div className="scale-85 origin-right">
                        <ToggleSwitch
                          id="drawer-company-purchase"
                          checked={isCompanyPurchase}
                          onCheckedChange={(next) => {
                            setIsCompanyPurchase(next);
                            if (!next) {
                              setAddressForm((prev) => ({ ...prev, company: "", gstin: "" }));
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Form Inputs Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="First Name *"
                        value={addressForm.firstName}
                        onChange={(e) => updateAddressField("firstName", e.target.value)}
                        className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                      />
                      <Input
                        placeholder="Last Name *"
                        value={addressForm.lastName}
                        onChange={(e) => updateAddressField("lastName", e.target.value)}
                        className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                      />

                      {isCompanyPurchase && (
                        <>
                          <div className="col-span-2">
                            <Input
                              placeholder="Company Name *"
                              value={addressForm.company}
                              onChange={(e) => updateAddressField("company", e.target.value)}
                              className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="GSTIN (Optional)"
                              value={addressForm.gstin}
                              onChange={(e) => updateAddressField("gstin", e.target.value.toUpperCase())}
                              maxLength={15}
                              className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                            />
                          </div>
                        </>
                      )}

                      <div className="col-span-2">
                        <Input
                          placeholder="Address *"
                          value={addressForm.address1}
                          onChange={(e) => updateAddressField("address1", e.target.value)}
                          className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <Input
                          placeholder="Landmark (Optional)"
                          value={addressForm.address2}
                          onChange={(e) => updateAddressField("address2", e.target.value)}
                          className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                        />
                      </div>

                      <Input
                        placeholder="Pincode *"
                        value={addressForm.zip}
                        maxLength={6}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                      />
                      <Input
                        placeholder="City *"
                        value={addressForm.city}
                        onChange={(e) => updateAddressField("city", e.target.value)}
                        className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                      />

                      <div className="relative w-full">
                        <select
                          value={addressForm.province}
                          onChange={(e) => updateAddressField("province", e.target.value)}
                          className="w-full h-[38px] appearance-none rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 pr-8 outline-none shadow-none focus-visible:ring-0 focus-visible:border-zinc-400 cursor-pointer"
                        >
                          <option value="" disabled className="text-zinc-400">
                            State *
                          </option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state} className="text-zinc-900">
                              {state}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="text-zinc-500 pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2" />
                      </div>

                      <Input
                        value="India"
                        readOnly
                        className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-500 px-2.5 shadow-none cursor-default"
                      />

                      <div className="col-span-2 flex items-center px-2.5 h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px]">
                        <span className="text-zinc-900 mr-2 text-[12.5px] font-medium select-none">+91</span>
                        <input
                          type="tel"
                          placeholder="Phone *"
                          value={addressForm.phone}
                          maxLength={10}
                          onChange={(e) => updateAddressField("phone", cleanPhoneInput(e.target.value))}
                          className="h-full grow bg-transparent outline-none text-[12.5px] font-figtree text-zinc-900 placeholder:text-zinc-400"
                        />
                      </div>

                      <div className="col-span-2">
                        <Input
                          type="email"
                          placeholder="Mail Id"
                          value={addressForm.email}
                          onChange={(e) => updateAddressField("email", e.target.value)}
                          className="h-[38px] rounded-[4px] border border-zinc-200 bg-white font-figtree text-[12.5px] text-zinc-900 placeholder:text-zinc-400 px-2.5 shadow-none focus-visible:ring-0 focus-visible:border-zinc-400"
                        />
                      </div>
                    </div>

                    {/* Default Address Checkbox */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <Checkbox
                        id="drawer-make-default"
                        checked={makeDefault}
                        onCheckedChange={(checked) => setMakeDefault(Boolean(checked))}
                        className="size-3.5 rounded-[3px] border-zinc-300 data-[state=checked]:bg-[#5A413F] data-[state=checked]:border-[#5A413F]"
                      />
                      <label
                        htmlFor="drawer-make-default"
                        className="text-[11.5px] font-figtree font-medium text-zinc-500 cursor-pointer select-none"
                      >
                        Use this as my Default Shopping Address
                      </label>
                    </div>

                    {/* Save Address Button */}
                    <Button
                      type="button"
                      onClick={handleSaveAddressClick}
                      disabled={isSavingAddress}
                      className="w-full h-[38px] bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-figtree font-medium text-[12.5px] rounded-[4px] transition-colors shadow-none cursor-pointer mt-1"
                    >
                      {isSavingAddress ? <Loader2 className="size-3.5 animate-spin" /> : "Save Address"}
                    </Button>

                    {/* Billing Same as Shipping Toggle */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[12px] font-medium font-figtree text-zinc-800">
                        Billing Address same as Shipping Address
                      </span>
                      <div className="scale-85 origin-right">
                        <ToggleSwitch
                          checked={sameAsBilling}
                          onCheckedChange={setSameAsBilling}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 font-figtree">
                    <StorePickupSection
                      isDesktop={false}
                      pickup={pickup}
                      pickupPhone={addressForm.phone}
                      setPickupPhone={(val) => updateAddressField("phone", cleanPhoneInput(val))}
                      cartItems={[{ inStock: true, leadTime: 12 }]}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Button Action */}
            <div className="pt-1.5">
              {deliveryMethod === "pickup" && pickup.showStoreDialog ? (
                <Button
                  type="button"
                  onClick={pickup.saveStoreSelection}
                  className="w-full h-[44px] bg-[#523A36] hover:bg-[#422D2A] text-white font-figtree font-semibold uppercase tracking-wider text-[12.5px] sm:text-[13px] rounded-[6px] transition-colors cursor-pointer"
                >
                  {pickup.sortedStores.length === 0 ? "CLOSE" : "CONFIRM"}
                </Button>
              ) : (
                <Button
                  disabled={loading}
                  onClick={handlePayAdvance}
                  className="w-full h-[44px] bg-[#523A36] hover:bg-[#422D2A] text-white font-figtree font-semibold uppercase tracking-wider text-[12.5px] sm:text-[13px] rounded-[6px] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>PROCESSING...</span>
                    </>
                  ) : (
                    <span>PAY ₹{formatPrice(advanceAmount)}</span>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 3: Success Screen */}
        {/* ───────────────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-8 text-center space-y-6 font-figtree animate-in zoom-in-95 duration-300">
            {/* Product Centerpiece */}
            <div className="mx-auto size-40 sm:size-48 relative overflow-hidden rounded-[8px] bg-zinc-50 border border-zinc-200 p-4 shadow-xs flex items-center justify-center">
              {productImgSrc ? (
                <Image
                  loader={productImgSrc.includes("cdn.shopify.com") ? shopifyLoader : undefined}
                  src={productImgSrc}
                  alt={product?.title || "Jewelry piece"}
                  fill
                  className="object-contain p-2"
                  unoptimized={!productImgSrc.includes("cdn.shopify.com")}
                />
              ) : (
                <CheckCircle2 size={64} className="text-emerald-500" />
              )}
            </div>

            {/* "Its Yours" Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-lg sm:text-xl">
                <CheckCircle2 size={24} className="text-emerald-600" />
                <span>Its Yours</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Don&apos;t miss any Installment for any penalty.
              </p>
            </div>

            {/* Go to My Account CTA */}
            <Button
              onClick={() => {
                onClose?.();
                router.push("/admin/digi-gold");
              }}
              className="w-full h-[48px] bg-[#523A36] hover:bg-[#422D2A] text-white font-figtree font-semibold uppercase tracking-wider text-[13px] sm:text-[14px] rounded-[6px] transition-colors cursor-pointer shadow-xs"
            >
              GO TO MY ACCOUNT
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
