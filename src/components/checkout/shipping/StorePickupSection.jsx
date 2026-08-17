"use client";

import { ChevronRight, LocateFixed, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDirectionsUrl, formatPickupReadyDate } from "@/hooks/checkout/useStorePickup";

/**
 * Two states, matching the Figma study: a pincode-search prompt when the
 * browser doesn't have (or hasn't granted) location access yet, and a
 * resolved-store card with a phone field once a store has been chosen.
 */
const storeNameMapping = {
  "BO1": "Borivali",
  "CS1": "Chembur",
  "PS1": "Pune",
  "NOS18": "Noida"
};

const getStoreDisplayName = (codeOrName) => {
  return storeNameMapping[codeOrName] || codeOrName;
};

export function StorePickupSection({ isDesktop, pickup, pickupPhone, setPickupPhone }) {
  const {
    sortedStores,
    selectedStore,
    showStoreDialog,
    setShowStoreDialog,
    tempSelectedStoreId,
    setTempSelectedStoreId,
    pincodeQuery,
    setPincodeQuery,
    hasResolvedStore,
    findNearestStore,
    findNearestByGeolocation,
    openStoreDialog,
    saveStoreSelection,
  } = pickup;

  return (
    <div className="space-y-6">
      {showStoreDialog ? (
        <div className="relative bg-transparent pt-1 pb-[60px] min-h-[400px]">
          <h2 className="font-figtree text-[1rem] lg:text-[1.125rem] font-medium text-black mb-4">Stores Available Near You</h2>
          
          <div className="space-y-3 pb-6">
            {sortedStores.map((store, index) => {
              const isSelected = tempSelectedStoreId === store.id;
              return (
                <div
                  key={store.id}
                  onClick={() => setTempSelectedStoreId(store.id)}
                  className={`relative rounded-[6px] border transition-all cursor-pointer overflow-hidden ${
                    isSelected ? "border-[#EADFD8] bg-[#FCF9F8]" : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-figtree lg:text-[1.0625rem] text-black lg:font-semibold max-lg:text-[16px] max-lg:font-semibold max-lg:leading-none">{getStoreDisplayName(store.code || store.name)}</h3>
                      <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.0003 18.3337C14.6027 18.3337 18.3337 14.6027 18.3337 10.0003C18.3337 5.39795 14.6027 1.66699 10.0003 1.66699C5.39795 1.66699 1.66699 5.39795 1.66699 10.0003C1.66699 14.6027 5.39795 18.3337 10.0003 18.3337Z" stroke={isSelected ? "#5A413F" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          {isSelected && <circle cx="10" cy="10" r="5" fill="#5A413F"/>}
                        </svg>
                      </div>
                    </div>
                    <p className="font-figtree lg:text-[0.9375rem] text-zinc-800 lg:text-black lg:font-medium lg:max-w-[80%] leading-relaxed pr-6 max-lg:text-[0.875rem] max-lg:font-normal max-lg:mt-3">
                      {store.address}, {store.city}, {store.state} {store.pincode ? `- ${store.pincode}` : ""}
                    </p>
                  </div>
                  <div className={`border-t p-3 px-4 flex justify-between items-center ${isSelected ? "border-[#EADFD8]" : "border-zinc-200"}`}>
                    <span className="font-figtree text-[0.875rem] lg:text-[0.9375rem] font-medium text-black">
                      {store.distance !== undefined ? `${Number(store.distance).toFixed(2)} Km Away` : (index === 0 ? "2 Km Away" : "16 Km Away")}
                    </span>
                    {index === 0 && (
                      <span className="font-figtree text-[0.75rem] lg:text-[10px] font-bold text-[#22A05B] bg-[#EAF7EE] px-2 py-1 lg:px-3 lg:py-1.5 rounded-[4px] tracking-widest uppercase">
                        Nearest
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="hidden lg:block absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-8 pb-0">
            <Button type="button" onClick={saveStoreSelection} className="w-full h-[50px] bg-[#5A413F] hover:bg-[#4A312F] text-white font-figtree text-[1rem] lg:text-[1.0625rem] font-medium tracking-wide uppercase rounded-[4px] transition-colors shadow-sm">
              Confirm
            </Button>
          </div>
        </div>
      ) : hasResolvedStore && selectedStore ? (
        <div className="space-y-4">
          {/* Pincode Display Box */}
          <div className="flex items-center h-14 rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 gap-3">
            <LocateFixed size={18} className="text-black shrink-0" />
            <span className="text-[1rem] lg:text-[1.0625rem] font-figtree font-medium text-[#5A413F]">
              {pincodeQuery || selectedStore.zip || "Current location"}
            </span>
          </div>

          {/* Selected Store Card */}
          <div className="border border-zinc-200 rounded-sm overflow-hidden bg-white">
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="font-figtree text-[1.0625rem] lg:text-[1.125rem] font-bold text-black">{getStoreDisplayName(selectedStore.code || selectedStore.name)}</h3>
                {selectedStore.distance !== undefined && (
                  <span className="font-figtree text-[0.875rem] lg:text-[0.9375rem] font-medium text-black whitespace-nowrap">
                    ({Number(selectedStore.distance).toFixed(2)} Km Away)
                  </span>
                )}
              </div>
              <p className="text-[0.875rem] lg:text-[0.9375rem] leading-relaxed text-black font-medium font-figtree pr-4 md:pr-10">
                {selectedStore.address}, {selectedStore.city} {selectedStore.state}
              </p>
              <div className="flex items-center gap-2 text-[0.9375rem] lg:text-[1rem] text-[#22A05B] font-figtree font-medium pt-1">
                <span className="size-1.5 rounded-full bg-[#22A05B]" />
                Pickup Available by {formatPickupReadyDate()}
              </div>
            </div>

            {/* Bottom Actions: Phone & Directions */}
            <div className="grid grid-cols-2 border-t border-zinc-200">
              <a 
                href={selectedStore.phone ? `tel:${selectedStore.phone}` : "#"} 
                className="flex items-center justify-center gap-2 h-14 border-r border-zinc-200 px-2 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Phone size={18} className="text-black shrink-0" />
                <span className="text-[0.9375rem] lg:text-[1rem] font-figtree font-medium text-black">
                  {selectedStore.phone || "No phone"}
                </span>
              </a>
              <a
                href={getDirectionsUrl(selectedStore)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-14 text-[0.9375rem] lg:text-[1rem] font-figtree font-medium text-black hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Navigation size={18} className="text-black shrink-0" />
                Get Direction
              </a>
            </div>
          </div>
          
          <Button type="button" onClick={() => setShowStoreDialog(true)} className="w-full h-[48px] bg-transparent hover:bg-zinc-50 border border-[#5A413F] text-[#5A413F] font-figtree font-semibold text-[0.9375rem] lg:text-[1rem] rounded-[4px] transition-colors">
            Change Pickup
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-figtree text-[0.9375rem] lg:text-[1.0625rem] font-medium text-black">Find Store near you for Pickup</h2>
          <div className="flex items-center h-[52px] rounded-[4px] border border-zinc-200 bg-white px-3 gap-2">
            <LocateFixed size={18} className="text-black shrink-0" />
            <input
              placeholder="Enter Pincode"
              value={pincodeQuery}
              maxLength={6}
              onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, ""))}
              className="h-full w-full min-w-0 bg-transparent outline-none text-[0.9375rem] lg:text-[1.0625rem] font-figtree font-medium text-black placeholder:text-zinc-400"
            />
          </div>


          <Button type="button" onClick={findNearestStore} className="w-full h-12 lg:h-[45px] bg-[#5A413F] hover:bg-[#4A312F] text-white text-[0.9375rem] lg:text-[1.1rem] font-figtree font-medium rounded-md transition-colors">
            Find Nearest Store
          </Button>
        </div>
      )}

    </div>
  );
}
