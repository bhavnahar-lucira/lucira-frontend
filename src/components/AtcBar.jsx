"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Home, Store as StoreIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectPincode } from "@/redux/features/user/userSlice";
import { useAuth } from "@/hooks/useAuth";
import { pushPromoClick } from "@/lib/gtm";

const STORE_FOOTFALL_WEBHOOK = "https://store-footfall-pdp-forn-385594025448.asia-south1.run.app";

function getCookieValue(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

// ─── Store Footfall Form Modal ────────────────────────────────────────────────
function StoreFootfallModal({ open, onClose, product, activeVariant, device }) {
  const { user } = useAuth();
  const globalPincode = useSelector(selectPincode);

  const [pincode, setPincode] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  // Pre-fill on open
  React.useEffect(() => {
    if (open) {
      setSubmitted(false);
      setError("");
      const cookiePincode = getCookieValue("user_pincode");
      setPincode(globalPincode || cookiePincode || "");
      const rawPhone = (user?.phone || user?.mobile || "").replace(/^\+91/, "").replace(/^91/, "").slice(0, 10);
      setPhone(rawPhone);
    }
  }, [open, globalPincode, user]);

  const canSubmitDirectly = pincode.length === 6 && phone.length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (pincode.length !== 6) { setError("Please enter a valid 6-digit pincode."); return; }
    if (phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }

    setSubmitting(true);
    try {
      await fetch(STORE_FOOTFALL_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode,
          phone,
          product_title: product?.title || "",
          product_handle: product?.handle || "",
          variant_sku: activeVariant?.sku || "",
          variant_title: activeVariant?.title || "",
          page_url: typeof window !== "undefined" ? window.location.href : "",
          timestamp: new Date().toISOString(),
        }),
      });
      pushPromoClick({
        promo_id: device,
        promo_name: phone,
        creative_name: "store nearby sticky cta form filled",
        location_id: pincode,
      });
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1E4D1] flex items-center justify-center">
                  <StoreIcon size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-figtree font-bold text-base text-black leading-tight">Find Stores Nearby</h2>
                  <p className="text-xs text-zinc-400 font-figtree mt-0.5">We&apos;ll show you stores that carry this design</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-zinc-400">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-6 gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-[#F1E4D1] flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-figtree font-bold text-base text-black">Request Sent!</p>
                    <p className="text-sm text-zinc-500 font-figtree mt-1">Our team will reach out to help you find a store near you.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 h-12 w-full bg-primary text-white font-figtree font-semibold text-sm rounded-sm uppercase tracking-wider hover:bg-accent transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Product Preview */}
                  <div className="flex items-center gap-3 bg-[#FAFAFA] rounded-sm p-3">
                    <div className="w-12 h-12 rounded-sm bg-white border border-gray-100 overflow-hidden shrink-0 relative">
                      {(activeVariant?.image || product?.featuredImage) && (
                        <Image
                          src={activeVariant?.image || product?.featuredImage || ""}
                          alt={product?.title || "Product"}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-figtree font-semibold text-sm text-black truncate leading-tight">{product?.title}</p>
                      {activeVariant?.title && activeVariant?.title !== "Default Title" && (
                        <p className="text-xs text-zinc-400 font-figtree mt-0.5">{activeVariant.title}</p>
                      )}
                    </div>
                  </div>

                  {/* Pincode Field */}
                  <div>
                    <label className="block font-figtree font-semibold text-sm text-zinc-700 mb-1.5">
                      Your Pincode
                      {(globalPincode || getCookieValue("user_pincode")) && (
                        <span className="ml-2 text-xs font-normal text-[#2DB36F]">&#9679; Auto-filled</span>
                      )}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => { setError(""); setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); }}
                      placeholder="Enter 6-digit pincode"
                      className="w-full h-12 px-4 border border-gray-200 rounded-sm font-figtree text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                    />
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label className="block font-figtree font-semibold text-sm text-zinc-700 mb-1.5">
                      Phone Number
                      {(user?.phone || user?.mobile) && (
                        <span className="ml-2 text-xs font-normal text-[#2DB36F]">&#9679; Auto-filled</span>
                      )}
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-sm bg-gray-50 text-sm text-zinc-500 font-figtree shrink-0">+91</span>
                      <input
                        type="text"
                        inputMode="tel"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => { setError(""); setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); }}
                        placeholder="Enter 10-digit number"
                        className="flex-1 h-12 px-4 border border-gray-200 rounded-r-sm font-figtree text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-xs text-red-500 font-figtree -mt-2">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      "h-13 w-full bg-primary text-white font-figtree font-semibold text-sm uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors hover:bg-accent",
                      submitting && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <StoreIcon size={16} />
                        <span>Find Stores Nearby</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-zinc-400 font-figtree -mt-2">
                    We&apos;ll show you Lucira stores near your pincode that carry this design.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Cart Icon SVG ─────────────────────────────────────────────────────────────
function CartSvg() {
  return (
    <svg width={28} height={18} viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "28px", height: "18px" }}>
      <path d="M1 1H3L4.07085 6M4.07085 6L5.66 13.42C5.75758 13.8749 6.01067 14.2815 6.37571 14.5699C6.74075 14.8582 7.19491 15.0103 7.66 15H17.44C17.8952 14.9993 18.3365 14.8433 18.691 14.5578C19.0456 14.2724 19.2921 13.8745 19.39 13.43L21.04 6H4.07085ZM7.95 19.95C7.95 20.5023 7.50228 20.95 6.95 20.95C6.39772 20.95 5.95 20.5023 5.95 19.95C5.95 19.3977 6.39772 18.95 6.95 18.95C7.50228 18.95 7.95 19.3977 7.95 19.95ZM18.95 19.95C18.95 20.5023 18.5023 20.95 17.95 20.95C17.3977 20.95 16.95 20.5023 16.95 19.95C16.95 19.3977 17.3977 18.95 17.95 18.95C18.5023 18.95 18.95 19.3977 18.95 19.95Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main AtcBar ─────────────────────────────────────────────────────────────
export default function AtcBar({
  isTopVisible,
  isBottomVisible,
  product,
  activeVariant,
  onAddToCart,
  addingToCart,
  onToggleWishlist,
  isWishlisted,
  schemeData,
}) {
  const [hasTopAnimated, setHasTopAnimated] = React.useState(false);
  const [hasBottomAnimated, setHasBottomAnimated] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [storeModalOpen, setStoreModalOpen] = React.useState(false);
  const [storeModalDevice, setStoreModalDevice] = React.useState("desktop");

  const openStoreModal = (device) => {
    pushPromoClick({
      promo_id: device,
      promo_name: product?.title || "Stores Nearby",
      creative_name: "store nearby sticky cta pdp for footfall",
      location_id: "pdp",
    });
    setStoreModalDevice(device);
    setStoreModalOpen(true);
  };

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isTopVisible && !hasTopAnimated) {
      setHasTopAnimated(true);
    }
  }, [isTopVisible, hasTopAnimated]);

  React.useEffect(() => {
    if (isBottomVisible && !hasBottomAnimated) {
      setHasBottomAnimated(true);
    }
  }, [isBottomVisible, hasBottomAnimated]);

  const formatPrice = (num) => {
    if (num === null || num === undefined) return "0";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(num);
  };

  const currentPrice = activeVariant?.price || product?.price || 0;
  const comparePrice = activeVariant?.compare_price || product?.compare_price || 0;
  const discount = comparePrice > currentPrice ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0;

  const getValidSrc = (src, fallback = "/images/product/1.jpg") => {
    if (typeof src === 'string' && src.trim() !== '') return src;
    if (src && typeof src === 'object' && src.url) return src.url;
    return fallback;
  };

  const isBYJ = product?.tags?.includes("BYJ");

  const animatedCartBtn = (animateCondition) => (
    <span className="flex items-center justify-center">
      {isMounted && (
        <motion.span
          initial={{ width: 0, marginRight: 0, x: -350 }}
          animate={animateCondition ? {
            width: [0, 0, 28],
            marginRight: [0, 0, 8],
            x: [-350, 0]
          } : {
            width: 0,
            marginRight: 0,
            x: -350
          }}
          transition={{
            ease: [0.16, 1, 0.3, 1],
            x: { duration: 2.2, delay: 2 },
            width: { duration: 2.2, times: [0, 0.6, 1], delay: 2 },
            marginRight: { duration: 2.2, times: [0, 0.6, 1], delay: 2 }
          }}
          className="flex items-center justify-center shrink-0 overflow-hidden"
        >
          <CartSvg />
        </motion.span>
      )}
      <span>ADD TO CART</span>
    </span>
  );

  return (
    <>
      {/* ── Store Footfall Modal ── */}
      <StoreFootfallModal
        open={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        product={product}
        activeVariant={activeVariant}
        device={storeModalDevice}
      />

      {/* ── Sticky Top Bar (atcBar) ── */}
      <div
        className={cn(
          "atcBar fixed top-0 left-0 w-full bg-white z-[99] border-b border-gray-100 transition-all duration-500 transform shadow-sm px-4 lg:px-17 py-3",
          isTopVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        <div className="max-w-480 mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-gray-50 shrink-0">
              <Image
                src={getValidSrc(activeVariant?.image || product?.featuredImage || product?.images?.[0])}
                alt={product?.title || "Product"}
                fill
                unoptimized={String(getValidSrc(activeVariant?.image || product?.featuredImage || product?.images?.[0])).includes("cdn.shopify.com") || String(getValidSrc(activeVariant?.image || product?.featuredImage || product?.images?.[0])).includes("myshopify.com")}
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-black truncate leading-tight">
                {product?.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-black">
                  ₹{formatPrice(currentPrice)}
                </span>
                {comparePrice > currentPrice && (
                  <span className="text-xs text-gray-400 line-through font-medium">
                    ₹{formatPrice(comparePrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-bold text-[#2DB36F] flex items-center ml-1">
                    <span className="mr-0.5">↓</span>{discount}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isBYJ ? (
              <Button
                asChild
                className="h-14 px-10 text-sm font-bold bg-primary hover:bg-accent text-white rounded-sm transition-colors uppercase tracking-wider min-w-40 flex items-center justify-center"
              >
                <Link href="/build-your-jewelry">BUILD YOUR JEWELRY</Link>
              </Button>
            ) : (
              <>
                {/* Stores Nearby CTA — desktop sticky top bar */}
                <button
                  onClick={() => openStoreModal("desktop")}
                  className="hidden lg:flex h-14 px-6 items-center justify-center gap-2 border border-primary text-primary font-bold text-sm rounded-sm uppercase tracking-wider whitespace-nowrap hover:bg-primary/5 transition-colors"
                >
                  <StoreIcon size={16} />
                  <span>STORES NEARBY</span>
                </button>

                <Button
                  onClick={() => onAddToCart("header sticky cta")}
                  disabled={addingToCart}
                  className="h-14 px-10 text-sm font-bold bg-primary hover:bg-accent text-white rounded-sm transition-colors uppercase tracking-wider min-w-40 relative overflow-hidden gold-shimmer"
                >
                  {addingToCart ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        initial={{ opacity: 0, x: -120 }}
                        animate={isTopVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -120 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center justify-center shrink-0"
                      >
                        <CartSvg />
                      </motion.span>
                      <span>ADD TO CART</span>
                    </span>
                  )}
                </Button>

                <div className="hidden xl:flex items-center gap-2">
                  <Button asChild className="h-14 w-14 border border-accent text-accent rounded-sm flex items-center justify-center bg-white hover:bg-[#FFF5F5] transition-colors">
                    <a href="https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20home%20trial%20" target="_blank">
                      <Home size={20} />
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky Bottom Bar (atc-2) ── */}
      <div
        className={cn(
          "atc-2 fixed bottom-0 left-0 w-full z-[40] transition-all duration-300 transform pointer-events-none",
          isBottomVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="max-w-480 mx-auto px-4 lg:px-17">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_420px] 2xl:grid-cols-[1fr_530px] gap-10">
            <div className="hidden lg:block"></div>
            <div className="pointer-events-auto bg-white border border-gray-100 rounded-sm p-3 flex items-center gap-2 w-full">
              {!isBYJ && (
                <button
                  onClick={() => openStoreModal("desktop")}
                  className="h-14 flex-1 border border-primary text-primary font-semibold text-base rounded-sm flex items-center justify-center gap-2 whitespace-nowrap px-2 hover:bg-accent/5 transition-colors uppercase"
                >
                  <StoreIcon size={16} />
                  <span>STORES NEARBY</span>
                </button>
              )}
              <button
                onClick={() => onAddToCart("bottom sticky cta")}
                disabled={addingToCart}
                className="h-14 flex-[1.5] bg-primary text-white font-semibold text-base rounded-sm flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-[#8F5D5D] transition-colors relative overflow-hidden shimmer-btn"
              >
                {addingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : animatedCartBtn(hasBottomAnimated)}
              </button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden pointer-events-auto bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] -mx-4 px-4 py-3 flex items-center gap-2 w-screen">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send/?phone=919004435760&text=Hi%2C+I+want+to+get+more+information+about+this+product%3A+${encodeURIComponent(product?.title || '')}&type=phone_number&app_absent=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 aspect-square bg-white shadow-md border border-zinc-100 rounded-sm flex items-center justify-center shrink-0"
            >
              <div className="relative w-7 h-7">
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_2eb7b2b4-f6af-4848-893e-8de612c3e6cb.png?v=1782542639" alt="WhatsApp" fill className="object-contain" />
              </div>
            </a>

            {/* Stores CTA — replaces Scheme button in mobile sticky bottom bar */}
            {!isBYJ && (
              <button
                onClick={() => openStoreModal("mobile")}
                className="h-14 flex-1 border border-primary text-primary font-bold text-[13px] rounded-sm flex items-center justify-center gap-1.5 whitespace-nowrap px-2"
              >
                <StoreIcon size={15} />
                <span>STORES</span>
              </button>
            )}

            {/* Add to Cart */}
            <button
              onClick={() => onAddToCart("bottom sticky cta")}
              disabled={addingToCart}
              className="h-14 flex-[1.5] bg-primary text-white font-semibold text-sm rounded-sm flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-[#8F5D5D] transition-colors relative overflow-hidden shimmer-btn"
            >
              {addingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : animatedCartBtn(hasBottomAnimated)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
