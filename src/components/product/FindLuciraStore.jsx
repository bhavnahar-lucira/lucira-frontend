"use client";

import { useState, useEffect } from "react";
import { Phone, Calendar, Navigation, Clock, Star, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import LazyImage from "@/components/common/LazyImage";
import shopifyLoader from "@/utils/shopifyLoader";
import OpeningSoonOverlay from "@/components/common/OpeningSoonOverlay";
import { isStoreActive, handleFromStoreName, isStoreOpeningSoon } from "@/data/stores";
import { storeByHandle, formatTimings, storeStatus, asStorePages } from "@/lib/storeContent";
import { apiFetch } from "@/lib/api";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export function FindLuciraStore({ 
  pincode, 
  setPincode, 
  handlePincodeCheck, 
  checkingPincode, 
  deliveryInfo,
  availableStores,
  product,
  activeVariant,
  hasConfirmedPincode = false,
  resetPincodeState,
  storePages = null,
}) {
  const [liveStorePages, setLiveStorePages] = useState(storePages);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (storePages && Array.isArray(storePages.stores) && storePages.stores.length > 0) {
      setLiveStorePages(storePages);
    } else {
      apiFetch("/api/settings/store-pages")
        .then((data) => {
          if (data && Array.isArray(data.stores) && data.stores.length > 0) {
            setLiveStorePages(data);
          }
        })
        .catch(() => {});
    }
  }, [storePages]);

  const getStoreDisplayName = (name) => {
    if (!name) return "";
    if (name.includes("Divinecarat")) return "Head Office";
    if (name === "BO1") return "Borivali";
    if (name === "CS1") return "Chembur";
    if (name === "PS1") return "Pune";
    if (name === "NOS18") return "Noida";
    return name;
  };

  const getValidSrc = (src, fallback = "/images/product/1.jpg") => {
    if (typeof src === 'string' && src.trim() !== '') return src;
    if (src && typeof src === 'object' && src.url) return src.url;
    return fallback;
  };

  const resolveStoreConfig = (store) => {
    if (!store) return null;
    if (store.storeConfig) return store.storeConfig;
    const { stores = [] } = asStorePages(liveStorePages);

    // 1. By shopifyLocationId
    if (store.shopifyId) {
      const matchByLoc = stores.find(
        (s) =>
          s.shopifyLocationId &&
          (s.shopifyLocationId === store.shopifyId ||
            store.shopifyId.includes(s.shopifyLocationId) ||
            s.shopifyLocationId.includes(store.shopifyId))
      );
      if (matchByLoc) return matchByLoc;
    }

    // 2. By handle
    const handle = store.handle || handleFromStoreName(store.name);
    if (handle) {
      const matchByHandle = stores.find((s) => s.handle === handle);
      if (matchByHandle) return matchByHandle;
    }

    // 3. By city or store name
    const nameLower = (store.name || "").toLowerCase();
    const cityLower = (store.city || "").toLowerCase();
    const matchByName = stores.find((s) => {
      const sName = (s.name || "").toLowerCase();
      const sCity = (s.city || "").toLowerCase();
      return (
        (sName && (nameLower.includes(sName) || sName.includes(nameLower))) ||
        (sCity && (nameLower.includes(sCity) || cityLower.includes(sCity)))
      );
    });
    if (matchByName) return matchByName;

    return storeByHandle(liveStorePages, handle);
  };

  const getStoreImage = (store, storeConfig) => {
    const config = storeConfig || resolveStoreConfig(store);

    // 1. Prioritize dashboard configured image
    const dashboardImg =
      config?.images?.homepage ||
      config?.images?.locator ||
      config?.images?.collection?.[0];
    if (dashboardImg) return dashboardImg;

    // 2. Fallback to Shopify store image
    if (store?.image) return store.image;

    // 3. Safe fallback
    return "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/store_5f7eef5f-e3ba-4088-8fc0-c2b42ce7624e.jpg";
  };

  // Hide any store whose location is switched off in the central registry or unpublished
  const storesToDisplay = (availableStores || []).filter((store) => {
    const handle = store?.handle || handleFromStoreName(store?.name);
    if (!isStoreActive(handle)) return false;
    const config = resolveStoreConfig(store);
    if (config && config.published === false) return false;
    return true;
  });

  return (
    <section className="w-full py-10 bg-gray-50 mt-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-17">
        <div className="w-full text-center mb-8 md:mb-12">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Find in Lucira Store Near You
          </h2>

          {/* Pincode */}
          <div className="relative max-w-lg mx-auto mb-3">
            <Input
              value={pincode}
              readOnly={hasConfirmedPincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !hasConfirmedPincode) {
                  handlePincodeCheck(pincode);
                }
              }}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter pin code"
              className="w-full h-[3.0625rem] bg-white border border-gray-200 rounded font-figtree font-medium text-xs leading-[1.4] tracking-normal text-black placeholder:text-black pr-32 md:pr-36 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              onClick={() => {
                if (hasConfirmedPincode) {
                  if (resetPincodeState) resetPincodeState();
                  return;
                }
                handlePincodeCheck(pincode);
              }}
              disabled={checkingPincode}
              className="h-[2.4375rem] md:h-10.5 text-xs md:text-sm px-4 md:px-6 font-figtree font-bold md:font-semibold leading-[1.4] tracking-normal uppercase rounded absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#5A413F] hover:bg-[#5A413F]/90 text-white hover:cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {checkingPincode ? (
                <Loader2 className="animate-spin" size={18} />
              ) : hasConfirmedPincode ? (
                "CHANGE"
              ) : (
                "CHECK"
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-900">
            <Clock size={16} />
            <span>{deliveryInfo.message || "Enter pincode to check delivery"}</span>
          </div>
        </div>

        {storesToDisplay.length > 0 ? (
          <div className="relative group">
            <Swiper
              spaceBetween={30}
              slidesPerView={1}
              onSwiper={setSwiperInstance}
              onSlideChange={(swiper) => {
                setActiveSlideIndex(swiper.realIndex ?? swiper.activeIndex);
              }}
              className="w-full"
            >
              {storesToDisplay.map((store, index) => {
                const handle = store?.handle || handleFromStoreName(store?.name);
                const storeConfig = resolveStoreConfig(store);
                const storeImage = getStoreImage(store, storeConfig);
                const status = storeConfig
                  ? storeStatus(storeConfig)
                  : { label: "Open Now", tone: "open", openingSoon: false };
                const isOpeningSoon = status.openingSoon || isStoreOpeningSoon(handle);
                const isOpenTone = status.tone === "open";

                const rawTimings =
                  (storeConfig && formatTimings(storeConfig)) ||
                  "Monday - Sunday | 10:30 am - 10:00 pm";
                const displayTimings = rawTimings.replace(
                  /^Monday\s*-\s*Sunday\s*\|\s*/i,
                  "Mon - Sun | "
                );
                const rating = storeConfig?.rating ?? 4.8;

                const displayName =
                  store.displayName ||
                  storeConfig?.name ||
                  (getStoreDisplayName(store.name) === "Head Office"
                    ? "Head Office"
                    : `${getStoreDisplayName(store.name)} Lucira Store`);

                const storeAddress =
                  store.addressFormatted ||
                  storeConfig?.address ||
                  [store.address1 || store.address, store.city, store.province, store.zip]
                    .filter(Boolean)
                    .join(", ");

                const mapUrl =
                  store.mapLink ||
                  storeConfig?.links?.map ||
                  storeConfig?.links?.directions ||
                  ((store.latitude || store.lat) && (store.longitude || store.lng)
                    ? `https://www.google.com/maps/search/?api=1&query=${store.latitude || store.lat},${store.longitude || store.lng}`
                    : "");

                const phoneHref =
                  storeConfig?.links?.call ||
                  (storeConfig?.phone
                    ? (storeConfig.phone.startsWith("tel:")
                        ? storeConfig.phone
                        : `tel:${storeConfig.phone.replace(/\s+/g, "")}`)
                    : null) ||
                  (store.phone
                    ? (store.phone.startsWith("tel:") ? store.phone : `tel:${store.phone.replace(/\s+/g, "")}`)
                    : "tel:+917208934782");

                const appointmentUrl =
                  storeConfig?.links?.appointment ||
                  storeConfig?.links?.whatsapp ||
                  `https://wa.me/+917208934782?text=${encodeURIComponent(
                    `I'd like to book an appointment at ${displayName} for ${product?.title || "Lucira jewelry"}`
                  )}`;

                return (
                  <SwiperSlide key={store.shopifyId || index}>
                    <div className="w-full bg-white border border-[#E5E5E5] rounded-sm overflow-hidden flex flex-col md:grid md:grid-cols-[45%_55%] min-h-fit md:min-h-[450px]">
                      {/* Map / Image */}
                      <div className="relative h-48 sm:h-64 md:h-full min-h-[200px]">
                        <LazyImage
                          src={storeImage}
                          alt={displayName}
                          fill
                          className="object-cover"
                          priority={index === 0}
                        />
                        <div
                          className={`absolute top-4 right-4 md:top-6 md:right-6 ${
                            isOpenTone
                              ? "bg-[#D1EBE3] text-[#006D4E] border-[#A3D9C9]"
                              : "bg-[#f5e8e8] text-[#dc2626] border-[#fecaca]"
                          } px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 text-xs md:text-sm font-medium border z-10`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOpenTone
                                ? isOpeningSoon
                                  ? "bg-[#006D4E]"
                                  : "bg-[#006D4E] animate-pulse"
                                : "bg-[#dc2626]"
                            }`}
                          ></span>
                          {isOpeningSoon ? "Opening Soon" : status.label}
                        </div>
                        {isOpeningSoon && <OpeningSoonOverlay label={null} />}
                      </div>

                      {/* Store Info */}
                      <div className="p-6 sm:p-8 md:px-12 md:py-8 flex flex-col justify-center">
                        <div className="space-y-4 md:space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xl md:text-2xl font-semibold italic mb-2 md:mb-4">
                                {displayName}
                              </h3>
                              <p className="text-sm md:text-base leading-relaxed text-gray-600">
                                {storeAddress}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star key={i} size={14} fill="#FFC107" color="#FFC107" />
                                ))}
                              </div>
                              <span className="text-xs md:text-sm font-bold">{rating}</span>
                            </div>
                          </div>

                          <div className="bg-[#F3F4F6] px-4 py-2.5 md:px-5 md:py-3 rounded-full flex items-center gap-3 w-fit">
                            <Clock size={16} className="text-black shrink-0" />
                            <span className="text-xs md:text-sm font-semibold">
                              Timings: <span className="font-normal block sm:inline">{displayTimings}</span>
                            </span>
                          </div>

                          {/* Product preview */}
                          {product && (
                            <div className="bg-[#F9FAFB] p-3 md:p-4 rounded-sm border border-gray-100">
                              <div className="flex gap-3 md:gap-4 items-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 bg-[#F3F4F6] rounded-sm shrink-0 relative overflow-hidden">
                                  <Image loader={shopifyLoader} 
                                    src={getValidSrc(activeVariant?.image || product.featuredImage || product.images?.[0])}
                                    alt={product.title}
                                    fill
                                    className="object-contain p-1"
                                  />
                                </div>
                                <div className="space-y-1.5 md:space-y-2 min-w-0">
                                  <p className="font-bold text-xs md:text-sm leading-tight truncate">
                                    {product.title}
                                  </p>
                                  <div className="bg-white border border-gray-100 rounded-sm p-1.5 md:p-2 flex flex-col gap-0.5 w-fit">
                                    <div className="flex items-center gap-2">
                                       <Clock size={10} className="text-gray-400" />
                                       <span className="text-[10px] md:text-xs text-gray-500">
                                         {activeVariant?.size ? `Size ${activeVariant.size} | ` : ""}{activeVariant?.color || ""}
                                       </span>
                                    </div>
                                    {(() => {
                                      const isAvailableInAnyStore = availableStores.some(s => s.isInStock);
                                      const showShipsToStore = isAvailableInAnyStore;
                                      if (isOpeningSoon) {
                                        return (
                                          <p className="text-[10px] md:text-xs font-semibold text-amber-600">
                                            Opening Soon
                                          </p>
                                        );
                                      }
                                      return (
                                        <p className={`text-[10px] md:text-xs font-semibold ${store.isInStock ? "text-[#006D4E]" : (showShipsToStore ? "text-amber-600" : "text-gray-600")}`}>
                                          {store.isInStock ? "Available in Store" : (showShipsToStore ? "Ships to Store" : "Made to Order")}
                                        </p>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 pt-6 md:pt-8">
                          <Button 
                            variant="outline" 
                            className="h-10 md:h-12 px-4 md:px-6 w-full sm:w-auto hover:cursor-pointer rounded-sm border-primary text-xs md:text-sm font-medium tracking-wider hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                            onClick={() => {
                              if (mapUrl) {
                                window.open(mapUrl, '_blank');
                              }
                            }}
                          >
                            <Navigation size={16} />
                            DIRECT ME
                          </Button>

                          <Button 
                            variant="outline" 
                            className="h-10 md:h-12 px-4 md:px-6 w-full sm:w-auto hover:cursor-pointer rounded-sm border-primary text-xs md:text-sm font-medium tracking-wider hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                            onClick={() => window.open(phoneHref, '_self')}
                          >
                            <Phone size={16} />
                            CALL US
                          </Button>

                          <Button 
                            className="h-10 md:h-12 px-4 md:px-6 w-full sm:w-auto hover:cursor-pointer rounded-sm text-white text-xs md:text-sm font-medium tracking-wider flex items-center justify-center gap-2"
                            onClick={() => window.open(appointmentUrl, '_blank')}
                          >
                            <Calendar size={16} />
                            BOOK APPOINTMENT
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Carousel Controls */}
            {storesToDisplay.length > 1 && (
              <div className="flex justify-between items-center mt-6 px-1 md:px-2">
                <div className="flex items-center gap-2">
                  {storesToDisplay.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to store ${i + 1}`}
                      onClick={() => {
                        if (swiperInstance && !swiperInstance.destroyed) {
                          swiperInstance.slideTo(i);
                          setActiveSlideIndex(i);
                        }
                      }}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer p-0 border-0 focus:outline-none ${
                        activeSlideIndex === i
                          ? "w-6 bg-black"
                          : "w-2 bg-[#D1D5DB] hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <button
                    type="button"
                    aria-label="Previous store"
                    onClick={() => {
                      if (swiperInstance && !swiperInstance.destroyed) {
                        swiperInstance.slidePrev();
                      }
                    }}
                    disabled={activeSlideIndex === 0}
                    className="w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={20} className="md:w-6 md:h-6" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next store"
                    onClick={() => {
                      if (swiperInstance && !swiperInstance.destroyed) {
                        swiperInstance.slideNext();
                      }
                    }}
                    disabled={activeSlideIndex === storesToDisplay.length - 1}
                    className="w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={20} className="md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-white border border-[#E5E5E5] rounded-sm p-12 text-center">
            <p className="text-gray-500 italic">No stores found nearby. Please enter a pincode to check availability.</p>
          </div>
        )}
      </div>
    </section>
  );
}

