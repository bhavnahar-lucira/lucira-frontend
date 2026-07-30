"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Home, Store as StoreIcon, X, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectPincode } from "@/redux/features/user/userSlice";
import { useAuth } from "@/hooks/useAuth";
import { pushPromoClick } from "@/lib/gtm";
import { apiFetch } from "@/lib/api";
import { calculateDistance } from "@/utils/distance";

const STORE_FOOTFALL_WEBHOOK = "https://store-footfall-pdp-forn-385594025448.asia-south1.run.app";

// A store counts as "nearby" only within this radius — beyond it the success
// screen switches to an opt-in "view all stores" flow so the CTA stays honest.
const NEARBY_RADIUS_KM = 30;

function getCookieValue(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

// Same display names + stock tag matching as the PDP "Find Our Nearest Store" flow
// (ProductPageClient) so both surfaces always agree on availability.
const STORE_TAG_MAPPING = {
  "Malad": ["divinecarat", "malad", "goregaon"],
  "Chembur": ["chembur", "cs1"],
  "Pune": ["pune", "ps1"],
  "Borivali": ["borivali", "bo1"],
  "Noida": ["noida", "nos18"],
};

function getStoreDisplayName(name) {
  if (!name) return "";
  if (name.includes("Divinecarat")) return "Head Office";
  if (name === "BO1") return "Borivali";
  if (name === "CS1") return "Chembur";
  if (name === "PS1") return "Pune";
  if (name === "NOS18") return "Noida";
  return name;
}

async function fetchNearbyStores(pincode, activeVariant) {
  try {
    const [storesRes, pinRes] = await Promise.allSettled([
      apiFetch("/api/stores"),
      apiFetch(`/api/pincodes/check?pincode=${pincode}`, { suppressErrorLog: true }),
    ]);

    const allStores = storesRes.status === "fulfilled" ? (storesRes.value?.stores || []) : [];
    if (!allStores.length) return null;

    const pinData = pinRes.status === "fulfilled" ? pinRes.value?.data : null;
    const deliverable = pinRes.status === "fulfilled" ? !!pinRes.value?.deliverable : false;
    const coords = pinData?.latitude && pinData?.longitude
      ? { lat: pinData.latitude, lng: pinData.longitude }
      : null;

    const inStoreTags = activeVariant?.metafields?.in_store_available || [];

    const stockStoreIds = allStores.filter((store) => {
      if (inStoreTags.includes(store.shopifyId)) return true;
      const storeNumericId = store.shopifyId?.split("/").pop() || "";
      if (storeNumericId && inStoreTags.some((tag) => String(tag).includes(storeNumericId))) return true;

      const storeNameLower = (store.name || "").toLowerCase();
      const storeCityLower = (store.city || "").toLowerCase();

      return inStoreTags.some((tag) => {
        const tagLower = String(tag).toLowerCase();
        if (tagLower.includes("gid://")) return false;
        const searchTerms = STORE_TAG_MAPPING[tag] || [tagLower];
        return searchTerms.some((term) => storeNameLower.includes(term) || storeCityLower.includes(term));
      });
    }).map((s) => s.shopifyId);

    const storesWithData = allStores.map((store) => {
      let distance = null;
      if (coords && (store.latitude || store.lat) && (store.longitude || store.lng)) {
        distance = calculateDistance(
          coords.lat,
          coords.lng,
          store.latitude || store.lat,
          store.longitude || store.lng
        );
      }
      return { ...store, distance, isInStock: stockStoreIds.includes(store.shopifyId) };
    });

    storesWithData.sort((a, b) => {
      if (coords) {
        if (a.distance !== null && b.distance !== null) {
          if (a.distance !== b.distance) return a.distance - b.distance;
        } else if (a.distance !== null) {
          return -1;
        } else if (b.distance !== null) {
          return 1;
        }
      }
      if (a.isInStock && !b.isInStock) return -1;
      if (!a.isInStock && b.isInStock) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return { stores: storesWithData, deliverable, hasCoords: !!coords };
  } catch {
    return null;
  }
}

// ─── Store Footfall Form Modal ────────────────────────────────────────────────
function StoreFootfallModal({ open, onClose, product, activeVariant, device }) {
  const { user } = useAuth();
  const globalPincode = useSelector(selectPincode);

  const [name, setName] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loadingStores, setLoadingStores] = React.useState(false);
  const [storeData, setStoreData] = React.useState(null);
  const [showFarStores, setShowFarStores] = React.useState(false);

  // Pre-fill on open
  React.useEffect(() => {
    if (open) {
      setSubmitted(false);
      setError("");
      setStoreData(null);
      setLoadingStores(false);
      setShowFarStores(false);
      const cookiePincode = getCookieValue("user_pincode");
      setPincode(globalPincode || cookiePincode || "");
      const rawPhone = (user?.phone || user?.mobile || "").replace(/^\+91/, "").replace(/^91/, "").slice(0, 10);
      setPhone(rawPhone);
      const accountName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || "";
      setName(accountName.slice(0, 50));
    }
  }, [open, globalPincode, user]);

  const canSubmitDirectly = pincode.length === 6 && phone.length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (pincode.length !== 6) { setError("Please enter a valid 6-digit pincode."); return; }
    if (phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }

    setSubmitting(true);
    // Kick off the store lookup alongside the webhook so results are ready
    // (or nearly ready) by the time the success screen renders.
    const storesPromise = fetchNearbyStores(pincode, activeVariant);
    try {
      await fetch(STORE_FOOTFALL_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
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
      setSubmitting(false);
      setLoadingStores(true);
      const results = await storesPromise;
      setStoreData(results);
      setLoadingStores(false);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      setLoadingStores(false);
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
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
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
            <div className="px-6 py-6 overflow-y-auto">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-4"
                >
                  {/* Compact success banner */}
                  <div className="flex items-center gap-3 bg-[#F1F9F1] border border-[#DBEFDB] rounded-sm p-3">
                    <div className="w-9 h-9 rounded-full bg-[#E3F5E0] flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-[#2DB36F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-figtree font-bold text-sm text-black leading-tight">Request Sent!</p>
                      <p className="text-xs text-zinc-500 font-figtree mt-0.5">
                        {name.trim() ? `Thanks, ${name.trim().split(/\s+/)[0]}! ` : ""}Our team will reach out shortly on +91 {phone}.
                      </p>
                    </div>
                  </div>

                  {/* Nearby stores */}
                  {(() => {
                    if (loadingStores) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-sm text-zinc-500 font-figtree">Finding Lucira stores near {pincode}…</p>
                        </div>
                      );
                    }

                    const stores = storeData?.stores || [];
                    if (!stores.length) {
                      return (
                        <p className="text-sm text-zinc-500 font-figtree text-center py-4">
                          Our team will reach out to help you find a store near you.
                        </p>
                      );
                    }

                    const anyInStock = stores.some((s) => s.isInStock);
                    const nearest = stores[0];
                    const hasNearbyStore = storeData.hasCoords && stores.some((s) => s.distance !== null && s.distance <= NEARBY_RADIUS_KM);

                    const renderStoreCard = (store) => {
                      const displayName = getStoreDisplayName(store.name);
                      const mapsHref = store.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Lucira Jewelry ${displayName} ${store.city || ""}`)}`;
                      return (
                        <div key={store.id || store.shopifyId} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col gap-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-figtree font-bold text-sm text-black leading-tight truncate">{displayName}</p>
                              {store.distance !== null && (
                                <span className="flex items-center gap-1 text-primary font-semibold text-xs font-figtree mt-1">
                                  <MapPin size={12} />
                                  {Math.round(store.distance)} Km away
                                </span>
                              )}
                            </div>
                            {store.isInStock ? (
                              <span className="bg-[#E3F5E0] text-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                                <span className="w-1.5 h-1.5 bg-[#76D168] rounded-full"></span>
                                <span className="text-[10px] font-bold uppercase font-figtree">In Stock</span>
                              </span>
                            ) : anyInStock ? (
                              <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-100 shrink-0">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                <span className="text-[10px] font-bold uppercase font-figtree">Ships to Store</span>
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-gray-200 shrink-0">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                <span className="text-[10px] font-bold uppercase font-figtree">Made to Order</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-zinc-500 font-figtree leading-relaxed line-clamp-2">
                            {store.address1 || store.address}{store.city ? `, ${store.city}` : ""}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5">
                            <a
                              href={`https://wa.me/919004435760?text=${encodeURIComponent(`Hi, I would like to check the availability of ${product?.title || "a design"} at the ${displayName} store.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 aspect-square bg-[#29a319] rounded-sm flex items-center justify-center shrink-0"
                            >
                              <div className="relative w-5 h-5">
                                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_white.png" alt="WhatsApp" fill className="object-contain" />
                              </div>
                            </a>
                            <a
                              href={`tel:${store.phone || "+919004435760"}`}
                              className="h-9 flex-1 border border-gray-200 bg-white text-black font-figtree font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                            >
                              <Phone size={12} />
                              Call
                            </a>
                            <a
                              href={mapsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => pushPromoClick({
                                promo_id: device,
                                promo_name: displayName,
                                creative_name: "store nearby form directions clicked",
                                location_id: pincode,
                              })}
                              className="h-9 flex-1 bg-tertiary text-white font-figtree font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                            >
                              <MapPin size={12} />
                              Directions
                            </a>
                          </div>
                        </div>
                      );
                    };

                    const moreLine = stores.length > 3 && (
                      <p className="text-center text-[11px] text-zinc-400 font-figtree">
                        + {stores.length - 3} more Lucira {stores.length - 3 === 1 ? "store" : "stores"} across India
                      </p>
                    );

                    // Stores within the nearby radius — the CTA promise holds
                    if (hasNearbyStore) {
                      return (
                        <div className="flex flex-col gap-3">
                          <p className="font-figtree font-bold text-sm text-black">
                            Lucira stores near you
                            <span className="ml-1.5 font-normal text-zinc-400">· Pincode {pincode}</span>
                          </p>
                          {stores.slice(0, 3).map(renderStoreCard)}
                          {moreLine}
                        </div>
                      );
                    }

                    // No store nearby — be upfront, and only show the full list if the user asks
                    if (!showFarStores) {
                      return (
                        <div className="flex flex-col items-center text-center gap-3 border border-gray-100 rounded-xl bg-gray-50/50 p-5">
                          <div className="w-12 h-12 rounded-full bg-[#F1E4D1] flex items-center justify-center">
                            <MapPin size={20} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-figtree font-bold text-sm text-black">No stores near your pincode</p>
                            <p className="text-xs text-zinc-500 font-figtree mt-1.5 leading-relaxed">
                              {nearest?.distance !== null && nearest?.distance !== undefined
                                ? <>There&apos;s no Lucira store within {NEARBY_RADIUS_KM} Km of {pincode}. Our closest store is <span className="font-semibold text-zinc-700">{getStoreDisplayName(nearest.name)}</span>, about {Math.round(nearest.distance)} Km away.</>
                                : <>We couldn&apos;t find a Lucira store close to pincode {pincode}.</>}
                              {storeData.deliverable && " You can still order online — we deliver this design to your doorstep."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowFarStores(true);
                              pushPromoClick({
                                promo_id: device,
                                promo_name: nearest ? getStoreDisplayName(nearest.name) : "no nearby store",
                                creative_name: "store nearby form view all stores clicked",
                                location_id: pincode,
                              });
                            }}
                            className="h-10 w-full border border-primary text-primary font-figtree font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors"
                          >
                            <StoreIcon size={14} />
                            View All Lucira Stores
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-3">
                        <p className="font-figtree font-bold text-sm text-black">
                          Lucira stores across India
                          <span className="ml-1.5 font-normal text-zinc-400">· nearest first</span>
                        </p>
                        {stores.slice(0, 3).map(renderStoreCard)}
                        {moreLine}
                      </div>
                    );
                  })()}

                  <button
                    onClick={onClose}
                    className="h-12 w-full bg-primary text-white font-figtree font-semibold text-sm rounded-sm uppercase tracking-wider hover:bg-accent transition-colors shrink-0"
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

                  {/* Name Field (optional) */}
                  <div>
                    <label className="block font-figtree font-semibold text-sm text-zinc-700 mb-1.5">
                      Your Name
                      <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
                      {(user?.first_name || user?.name) && name && (
                        <span className="ml-2 text-xs font-normal text-[#2DB36F]">&#9679; Auto-filled</span>
                      )}
                    </label>
                    <input
                      type="text"
                      autoComplete="name"
                      maxLength={50}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="How should we address you?"
                      className="w-full h-12 px-4 border border-gray-200 rounded-sm font-figtree text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                    />
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
