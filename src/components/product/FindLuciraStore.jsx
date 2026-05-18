"use client";

import { Phone, Calendar, Navigation, Clock, Star, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation as SwiperNavigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export function FindLuciraStore({ 
  pincode, 
  setPincode, 
  handlePincodeCheck, 
  checkingPincode, 
  deliveryInfo,
  availableStores,
  product,
  activeVariant
}) {

  const getStoreDisplayName = (name) => {
    if (!name) return "";
    if (name.includes("Divinecarat")) return "Malad";
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

  // If no stores are found nearby (e.g. initial state or no results), we can still show a default or empty state.
  // The user wants a slider if more stores are there.
  
  const storesToDisplay = availableStores.length > 0 ? availableStores : [];

  return (
    <section className="w-full py-10 bg-gray-50 mt-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-17">
        <div className="w-full text-center mb-8 md:mb-12">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Find in Lucira Store Near You
          </h2>

          {/* Pincode */}
          <div className="flex flex-row justify-center items-center gap-0 mb-3 max-w-lg mx-auto">
            <Input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePincodeCheck()}
              placeholder="Enter pin code"
              className="h-10 sm:h-12 rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-[#D1D1D1] placeholder:text-gray-400 text-sm bg-white"
            />
            <Button 
              onClick={handlePincodeCheck}
              disabled={checkingPincode}
              className="h-10 sm:h-12 px-4 sm:px-10 rounded-l-none bg-tertiary hover:bg-accent/90 text-white text-xs sm:text-sm font-bold tracking-widest shrink-0"
            >
              {checkingPincode ? <Loader2 className="animate-spin" size={18} /> : "CHECK"}
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
              modules={[SwiperNavigation, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{
                prevEl: ".store-prev",
                nextEl: ".store-next",
              }}
              pagination={{
                clickable: true,
                el: ".store-pagination",
                bulletClass: "swiper-pagination-bullet !w-2 !h-2 !bg-gray-300 !opacity-100",
                bulletActiveClass: "swiper-pagination-bullet-active !w-6 md:!w-6 !h-2 !rounded-full !bg-black",
              }}
              className="w-full"
            >
              {storesToDisplay.map((store, index) => (
                <SwiperSlide key={store.shopifyId || index}>
                  <div className="w-full bg-white border border-[#E5E5E5] rounded-sm overflow-hidden flex flex-col md:grid md:grid-cols-[45%_55%] min-h-fit md:min-h-[450px]">
                    {/* Map / Image */}
                    <div className="relative h-48 sm:h-64 md:h-full min-h-[200px]">
                      <Image
                        src="/images/store.jpg"
                        alt={getStoreDisplayName(store.name)}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-[#D1EBE3] text-[#006D4E] px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 text-xs md:text-sm font-medium border border-[#A3D9C9] z-10">
                        <span className="w-2 h-2 bg-[#006D4E] rounded-full animate-pulse"></span>
                        Open Now
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="p-6 sm:p-8 md:px-12 md:py-8 flex flex-col justify-center">
                      <div className="space-y-4 md:space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xl md:text-2xl font-semibold italic mb-2 md:mb-4">
                              {getStoreDisplayName(store.name)} Lucira Store
                            </h3>
                            <p className="text-sm md:text-base leading-relaxed text-gray-600">
                              {store.address1 || store.address}, {store.city}, {store.province || ""} {store.zip || ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} size={14} fill="#FFC107" color="#FFC107" />
                              ))}
                            </div>
                            <span className="text-xs md:text-sm font-bold">4.8</span>
                          </div>
                        </div>

                        <div className="bg-[#F3F4F6] px-4 py-2.5 md:px-5 md:py-3 rounded-full flex items-center gap-3 w-fit">
                          <Clock size={16} className="text-black shrink-0" />
                          <span className="text-xs md:text-sm font-semibold">
                            Timings: <span className="font-normal block sm:inline">Mon - Sun | 10:30 am - 10:00 pm</span>
                          </span>
                        </div>

                        {/* Product preview */}
                        {product && (
                          <div className="bg-[#F9FAFB] p-3 md:p-4 rounded-sm border border-gray-100">
                            <div className="flex gap-3 md:gap-4 items-center">
                              <div className="w-14 h-14 md:w-16 md:h-16 bg-[#F3F4F6] rounded-sm shrink-0 relative overflow-hidden">
                                <Image 
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
                                  <p className={`text-[10px] md:text-xs font-semibold ${store.isInStock ? "text-[#006D4E]" : "text-amber-600"}`}>
                                    {store.isInStock ? "Available in Store" : "Ships to Store"}
                                  </p>
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
                            const lat = store.latitude || store.lat;
                            const lng = store.longitude || store.lng;
                            if (lat && lng) {
                              window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                            }
                          }}
                        >
                          <Navigation size={16} />
                          DIRECT ME
                        </Button>

                        <Button 
                          variant="outline" 
                          className="h-10 md:h-12 px-4 md:px-6 w-full sm:w-auto hover:cursor-pointer rounded-sm border-primary text-xs md:text-sm font-medium tracking-wider hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                          onClick={() => window.open(`tel:${store.phone || "+919172499912"}`, '_self')}
                        >
                          <Phone size={16} />
                          CALL US
                        </Button>

                        <Button 
                          className="h-10 md:h-12 px-4 md:px-6 w-full sm:w-auto hover:cursor-pointer rounded-sm text-white text-xs md:text-sm font-medium tracking-wider flex items-center justify-center gap-2"
                          onClick={() => window.open(`https://wa.me/919172499912?text=I'd like to book an appointment at ${getStoreDisplayName(store.name)} store for ${product?.title}`, '_blank')}
                        >
                          <Calendar size={16} />
                          BOOK APPOINTMENT
                        </Button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Carousel Controls */}
            {storesToDisplay.length > 1 && (
              <div className="flex justify-between items-center mt-6 px-1 md:px-2">
                <div className="store-pagination flex items-center gap-2"></div>
                <div className="flex items-center gap-3 md:gap-4">
                  <button className="store-prev w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft size={20} className="md:w-6 md:h-6" />
                  </button>
                  <button className="store-next w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed">
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
