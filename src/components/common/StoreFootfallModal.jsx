"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Store as StoreIcon, X, MapPin, Phone, ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { useSelector } from "react-redux";
import { selectPincode } from "@/redux/features/user/userSlice";
import { useAuth } from "@/hooks/useAuth";
import { pushPromoClick, formatGtmPrice, getNumericId } from "@/lib/gtm";
import { apiFetch } from "@/lib/api";
import { calculateDistance } from "@/utils/distance";
import { handleFromStoreName } from "@/data/stores";
import { resolveCoords } from "@/data/storeGeo";
import { STORE_PAGE_DEFAULTS } from "@/data/storePageDefaults";

const STORE_FOOTFALL_WEBHOOK = "https://store-footfall-pdp-forn-385594025448.asia-south1.run.app";
const NEARBY_RADIUS_KM = 30;

function getCookieValue(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

const STORE_TAG_MAPPING = {
  "Malad": ["divinecarat", "malad", "goregaon"],
  "Chembur": ["chembur", "cs1"],
  "Pune": ["pune", "ps1"],
  "Borivali": ["borivali", "bo1"],
  "Noida": ["noida", "nos18"],
};

export function isHeadOffice(store) {
  if (!store) return false;
  const name = String(store.name || "").toLowerCase();
  const handle = String(store.handle || "").toLowerCase();
  const city = String(store.city || "").toLowerCase();
  if (name.includes("divinecarat") || name.includes("head office") || name.includes("head_office")) return true;
  if (handle === "malad" || city === "malad") return true;
  if (store.visitable === false && (handle === "malad" || name.includes("malad"))) return true;
  return false;
}

export function getStoreDisplayName(name) {
  if (!name) return "";
  if (/divinecarat|head\s*office/i.test(name)) return "Head Office";
  if (name === "BO1" || /borivali/i.test(name)) return "Borivali";
  if (name === "CS1" || /chembur/i.test(name)) return "Chembur";
  if (name === "PS1" || /pune/i.test(name)) return "Pune";
  if (name === "NOS18" || /noida/i.test(name)) return "Noida";
  if (/paschim/i.test(name)) return "Paschim Vihar";
  if (/lajpat/i.test(name)) return "Lajpat Nagar";
  return name;
}

export function getCleanStoreName(store) {
  if (!store) return "";
  const name = store.name || "";
  const disp = getStoreDisplayName(name);
  if (disp && disp !== "Head Office") return `${disp} Lucira Store`;
  if (!/store/i.test(name) && store.city) return `${store.city} Lucira Store`;
  return name || "Lucira Store";
}

function getBaseVisitableStores() {
  const defaults = STORE_PAGE_DEFAULTS?.stores || [];
  return defaults
    .filter((s) => !isHeadOffice(s))
    .map((s) => {
      const handle = s.handle || handleFromStoreName(s.name || "");
      const coords = resolveCoords(handle, s.geo?.lat, s.geo?.lng);
      return {
        id: s.handle || s.id,
        handle: s.handle,
        name: s.name,
        displayName: getCleanStoreName(s),
        city: s.city,
        address: s.address,
        phone: s.phone || "+917208934782",
        mapLink: s.links?.map || "",
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        distance: null,
      };
    });
}

function mergeStoresWithApi(baseList, apiStores) {
  if (!apiStores || !apiStores.length) return baseList;
  const merged = [...baseList];
  for (const apiStore of apiStores) {
    if (isHeadOffice(apiStore)) continue;
    const handle = handleFromStoreName(apiStore.name || "");
    if (!handle || handle === "malad") continue;

    const existingIdx = merged.findIndex((s) => s.handle === handle);
    const coords = resolveCoords(handle, apiStore.latitude || apiStore.lat, apiStore.longitude || apiStore.lng);
    const storeObj = {
      id: handle || apiStore.shopifyId || apiStore.id,
      handle,
      shopifyId: apiStore.shopifyId,
      name: apiStore.name,
      displayName: getCleanStoreName(apiStore),
      city: apiStore.city || (existingIdx !== -1 ? merged[existingIdx].city : ""),
      address: apiStore.address || (existingIdx !== -1 ? merged[existingIdx].address : ""),
      phone: apiStore.phone || (existingIdx !== -1 ? merged[existingIdx].phone : "+917208934782"),
      mapLink: apiStore.mapLink || (existingIdx !== -1 ? merged[existingIdx].mapLink : ""),
      lat: coords?.lat ?? (existingIdx !== -1 ? merged[existingIdx].lat : null),
      lng: coords?.lng ?? (existingIdx !== -1 ? merged[existingIdx].lng : null),
      distance: null,
    };

    if (existingIdx !== -1) {
      merged[existingIdx] = { ...merged[existingIdx], ...storeObj };
    } else {
      merged.push(storeObj);
    }
  }
  return merged;
}

function sortStoresByDistance(stores, coords) {
  if (!coords || !coords.lat || !coords.lng) {
    return stores.map((s) => ({ ...s, distance: null }));
  }
  return [...stores]
    .map((store) => {
      let distance = null;
      if (store.lat && store.lng) {
        distance = calculateDistance(coords.lat, coords.lng, store.lat, store.lng);
      }
      return { ...store, distance };
    })
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return (a.displayName || a.name).localeCompare(b.displayName || b.name);
    });
}

function getDropdownOptionText(store) {
  const name = store.displayName || getCleanStoreName(store);
  if (store.distance !== null && store.distance !== undefined && !isNaN(store.distance)) {
    const km = store.distance < 10 ? store.distance.toFixed(1) : Math.round(store.distance);
    return `${name} (${km} km away)`;
  }
  return name;
}

async function fetchNearbyStores(pincode, activeVariant, isAppointment = false) {
  try {
    const [storesRes, pinRes] = await Promise.allSettled([
      apiFetch("/api/stores"),
      apiFetch(`/api/pincodes/check?pincode=${pincode}`, { suppressErrorLog: true }),
    ]);

    let allStores = storesRes.status === "fulfilled" ? (storesRes.value?.stores || []) : [];
    if (!allStores.length) return null;

    if (isAppointment) {
      allStores = allStores.filter((s) => !isHeadOffice(s));
    }

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

export default function StoreFootfallModal({
  open,
  onClose,
  product = null,
  activeVariant = null,
  device = "desktop",
  title = null,
  subtitle = null,
  buttonLabel = null,
  locationId = "homepage",
  isAppointment = false,
}) {
  const { user } = useAuth();
  const globalPincode = useSelector(selectPincode);

  const [name, setName] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeData, setStoreData] = useState(null);
  const [showFarStores, setShowFarStores] = useState(false);

  // Store selection state for appointment mode
  const [storeList, setStoreList] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [userManuallySelected, setUserManuallySelected] = useState(false);
  const [selectedStoreObj, setSelectedStoreObj] = useState(null);

  // Pre-fill on open
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setError("");
      setStoreData(null);
      setLoadingStores(false);
      setShowFarStores(false);
      setUserManuallySelected(false);
      setSelectedStoreObj(null);

      const cookiePincode = getCookieValue("user_pincode");
      const initialPin = globalPincode || cookiePincode || "";
      setPincode(initialPin);
      const rawPhone = (user?.phone || user?.mobile || "").replace(/^\+91/, "").replace(/^91/, "").slice(0, 10);
      setPhone(rawPhone);
      const accountName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || "";
      setName(accountName.slice(0, 50));

      if (isAppointment) {
        const base = getBaseVisitableStores();
        setStoreList(base);
        if (base.length > 0) {
          setSelectedStoreId(base[0].id);
        }

        // Fetch live stores from /api/stores and check pincode coordinates in parallel
        Promise.allSettled([
          apiFetch("/api/stores"),
          initialPin.length === 6
            ? apiFetch(`/api/pincodes/check?pincode=${initialPin}`, { suppressErrorLog: true })
            : Promise.resolve(null),
        ]).then(([storesRes, pinRes]) => {
          const apiStores = storesRes.status === "fulfilled" ? storesRes.value?.stores || [] : [];
          const merged = mergeStoresWithApi(base, apiStores);
          const pinData = pinRes.status === "fulfilled" ? pinRes.value?.data : null;
          const coords =
            pinData?.latitude && pinData?.longitude
              ? { lat: pinData.latitude, lng: pinData.longitude }
              : null;
          const sorted = sortStoresByDistance(merged, coords);
          setStoreList(sorted);
          if (sorted.length > 0) {
            setSelectedStoreId(sorted[0].id);
          }
        });
      }
    }
  }, [open, globalPincode, user, isAppointment]);

  const handlePincodeChange = (newPin) => {
    setError("");
    const cleaned = newPin.replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);

    if (isAppointment) {
      if (cleaned.length === 6) {
        apiFetch(`/api/pincodes/check?pincode=${cleaned}`, { suppressErrorLog: true })
          .then((res) => {
            const pinData = res?.data;
            if (pinData?.latitude && pinData?.longitude) {
              const coords = { lat: pinData.latitude, lng: pinData.longitude };
              setStoreList((prev) => {
                const sorted = sortStoresByDistance(prev, coords);
                if (!userManuallySelected && sorted.length > 0) {
                  setSelectedStoreId(sorted[0].id);
                }
                return sorted;
              });
            }
          })
          .catch(() => {});
      } else {
        setStoreList((prev) => prev.map((s) => ({ ...s, distance: null })));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (pincode.length !== 6) { setError("Please enter a valid 6-digit pincode."); return; }
    if (isAppointment && !selectedStoreId) { setError("Please select a store to book an appointment."); return; }
    if (phone.length < 10) { setError("Please enter a valid 10-digit phone number."); return; }

    setSubmitting(true);
    const chosenStore = isAppointment
      ? storeList.find((s) => s.id === selectedStoreId) || storeList[0]
      : null;
    setSelectedStoreObj(chosenStore);
    const storeDisplayName = chosenStore?.displayName || (chosenStore ? getStoreDisplayName(chosenStore.name) : "");

    const storesPromise = fetchNearbyStores(pincode, activeVariant, isAppointment);
    try {
      await fetch(STORE_FOOTFALL_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          pincode,
          phone,
          product_title: isAppointment
            ? `Store Appointment - ${storeDisplayName}`
            : (product?.title || "Store Visit"),
          product_handle: product?.handle || "",
          variant_sku: activeVariant?.sku || "",
          variant_title: activeVariant?.title || "",
          store_name: storeDisplayName,
          store_address: chosenStore?.address || "",
          store_id: chosenStore?.shopifyId || chosenStore?.id || "",
          appointment_type: isAppointment ? "visit_store" : "footfall",
          page_url: typeof window !== "undefined" ? window.location.href : "",
          timestamp: new Date().toISOString(),
        }),
      });

      if (isAppointment) {
        pushPromoClick({
          promo_id: pincode,
          promo_name: `Store Appointment - ${storeDisplayName}`,
          creative_name: "book appointment form filled",
          location_id: locationId,
          promo_position: device,
        });
      } else {
        const sellingPrice = activeVariant?.price || product?.price || 0;
        const preDiscountPrice = activeVariant?.compare_price || product?.compare_price || sellingPrice;
        const variantId = product ? getNumericId(activeVariant?.shopifyId || activeVariant?.id) : "";
        const rawImage = activeVariant?.image || product?.featuredImage || product?.images?.[0] || "";
        const origin = typeof window !== "undefined" ? window.location.origin : "";

        pushPromoClick({
          promo_id: pincode,
          promo_name: product?.title || "Store Visit",
          creative_name: product ? "store nearby sticky cta form filled" : "store visit form filled",
          location_id: variantId || locationId,
          promo_position: device,
          sku: activeVariant?.sku || product?.variants?.[0]?.sku || "",
          Grand_total: formatGtmPrice(preDiscountPrice),
          productPrice: formatGtmPrice(sellingPrice),
          Product_url: product?.handle
            ? `${origin}/products/${product.handle}${variantId ? `?variant=${variantId}` : ""}`
            : (typeof window !== "undefined" ? window.location.href : ""),
          Product_image: typeof rawImage === "string" ? rawImage : (rawImage?.url || ""),
        });
      }

      setSubmitted(true);
      setSubmitting(false);

      if (!isAppointment) {
        setLoadingStores(true);
        const results = await storesPromise;
        setStoreData(results);
        setLoadingStores(false);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      setLoadingStores(false);
    }
  };

  const modalTitle = title || (isAppointment ? "Book an Appointment" : "Find Stores Nearby");
  const modalSubtitle = subtitle || (
    isAppointment
      ? "Select your preferred store to schedule a visit"
      : product
      ? "We'll show you stores that carry this design"
      : "We'll show you stores near your location"
  );
  const modalButtonLabel = buttonLabel || (isAppointment ? "Book an Appointment" : "Find Stores Nearby");

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
                  {isAppointment ? (
                    <Calendar size={18} className="text-primary" />
                  ) : (
                    <StoreIcon size={18} className="text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="font-figtree font-bold text-base text-black leading-tight">{modalTitle}</h2>
                  <p className="text-xs text-zinc-400 font-figtree mt-0.5">{modalSubtitle}</p>
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
                      <p className="font-figtree font-bold text-sm text-black leading-tight">
                        {isAppointment ? "Appointment Request Sent!" : "Request Sent!"}
                      </p>
                      <p className="text-xs text-zinc-500 font-figtree mt-0.5">
                        {name.trim() ? `Thanks, ${name.trim().split(/\s+/)[0]}! ` : ""}
                        {isAppointment
                          ? `Our team will reach out shortly on +91 ${phone} to confirm your appointment at ${selectedStoreObj?.displayName || "our store"}.`
                          : `Our team will reach out shortly on +91 ${phone}.`}
                      </p>
                    </div>
                  </div>

                  {/* If Appointment mode: show confirmed store card */}
                  {isAppointment && selectedStoreObj && (
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-figtree font-bold text-sm text-black leading-tight truncate">
                            {selectedStoreObj.displayName}
                          </p>
                          {selectedStoreObj.distance !== null && selectedStoreObj.distance !== undefined && (
                            <span className="flex items-center gap-1 text-primary font-semibold text-xs font-figtree mt-1">
                              <MapPin size={12} />
                              {selectedStoreObj.distance < 10 ? selectedStoreObj.distance.toFixed(1) : Math.round(selectedStoreObj.distance)} Km away
                            </span>
                          )}
                        </div>
                        <span className="bg-[#E3F5E0] text-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 bg-[#76D168] rounded-full"></span>
                          <span className="text-[10px] font-bold uppercase font-figtree">Selected Store</span>
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 font-figtree leading-relaxed">
                        {selectedStoreObj.address}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5">
                        <a
                          href={`https://wa.me/+917208934782?text=${encodeURIComponent(
                            `Hi, I would like to book an appointment at the ${selectedStoreObj.displayName} store.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 aspect-square bg-[#29a319] rounded-sm flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
                        >
                          <div className="relative w-5 h-5">
                            <Image loader={shopifyLoader} src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_white.png" alt="WhatsApp" fill className="object-contain" />
                          </div>
                        </a>
                        <a
                          href={`tel:${selectedStoreObj.phone || "+917208934782"}`}
                          className="h-9 flex-1 border border-gray-200 bg-white text-black font-figtree font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                        >
                          <Phone size={12} />
                          Call
                        </a>
                        <a
                          href={selectedStoreObj.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Lucira Jewelry ${selectedStoreObj.displayName}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => pushPromoClick({
                            promo_id: device,
                            promo_name: selectedStoreObj.displayName,
                            creative_name: "appointment store directions clicked",
                            location_id: pincode,
                          })}
                          className="h-9 flex-1 bg-tertiary text-white font-figtree font-bold text-[11px] uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                        >
                          <MapPin size={12} />
                          Directions
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Nearby stores for PDP product check */}
                  {!isAppointment && (() => {
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
                      const waText = product?.title
                        ? `Hi, I would like to check the availability of ${product.title} at the ${displayName} store.`
                        : `Hi, I would like to visit the ${displayName} store.`;

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
                            {product ? (
                              store.isInStock ? (
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
                              )
                            ) : null}
                          </div>

                          <p className="text-xs text-zinc-500 font-figtree leading-relaxed line-clamp-2">
                            {store.address1 || store.address}{store.city ? `, ${store.city}` : ""}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5">
                            <a
                              href={`https://wa.me/+917208934782?text=${encodeURIComponent(waText)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 aspect-square bg-[#29a319] rounded-sm flex items-center justify-center shrink-0"
                            >
                              <div className="relative w-5 h-5">
                                <Image loader={shopifyLoader} src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_white.png" alt="WhatsApp" fill className="object-contain" />
                              </div>
                            </a>
                            <a
                              href={`tel:${store.phone || "+917208934782"}`}
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
                              {storeData?.deliverable && " You can still order online — we deliver this design to your doorstep."}
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
                  {product && (
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
                  )}

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
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="Enter 6-digit pincode"
                      className="w-full h-12 px-4 border border-gray-200 rounded-sm font-figtree text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                    />
                  </div>

                  {/* Store Selection Dropdown (Only in appointment mode / homepage) */}
                  {isAppointment && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-figtree font-semibold text-sm text-zinc-700">
                          Select Store
                        </label>
                        {pincode.length === 6 && storeList.some((s) => s.distance !== null) && (
                          <span className="text-xs font-normal text-[#2DB36F]">
                            &#9679; Nearest store auto-selected
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedStoreId}
                          onChange={(e) => {
                            setSelectedStoreId(e.target.value);
                            setUserManuallySelected(true);
                            setError("");
                          }}
                          className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-sm font-figtree text-sm text-black focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white appearance-none cursor-pointer"
                        >
                          {storeList.map((store) => (
                            <option key={store.id || store.handle} value={store.id || store.handle}>
                              {getDropdownOptionText(store)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>
                  )}

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
                        {isAppointment ? <Calendar size={16} /> : <StoreIcon size={16} />}
                        <span>{modalButtonLabel}</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-zinc-400 font-figtree -mt-2">
                    {isAppointment
                      ? "Our team will reach out to confirm your appointment at the selected store."
                      : product
                      ? "We'll show you Lucira stores near your pincode that carry this design."
                      : "We'll show you Lucira stores near your pincode."}
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
