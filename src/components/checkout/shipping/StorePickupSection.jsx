"use client";

import { ChevronRight, LocateFixed, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDirectionsUrl, formatPickupReadyDate } from "@/hooks/checkout/useStorePickup";

/**
 * Two states, matching the Figma study: a pincode-search prompt when the
 * browser doesn't have (or hasn't granted) location access yet, and a
 * resolved-store card with a phone field once a store has been chosen.
 */
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
        <div className="space-y-5 bg-transparent pt-2">
          <h2 className="font-figtree text-[1.125rem] font-bold text-black">Pickup locations</h2>
          
          <button onClick={findNearestByGeolocation} className="flex items-center gap-2 text-[0.9375rem] font-medium font-figtree text-zinc-800 hover:underline">
            <Navigation size={18} className="text-zinc-600" />
            Use my location
          </button>
          
          <div className="space-y-4">
            <p className="text-[0.9375rem] text-zinc-500 font-figtree">There are {sortedStores.length} locations with your item</p>

            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {sortedStores.map((store) => {
                const isSelected = tempSelectedStoreId === store.id;
                return (
                  <div
                    key={store.id}
                    onClick={() => setTempSelectedStoreId(store.id)}
                    className={`relative flex items-start gap-4 p-5 rounded-[6px] border transition-all cursor-pointer ${
                      isSelected ? "border-black shadow-none" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className={`mt-[2px] size-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${isSelected ? "border-black bg-transparent" : "border-zinc-300"}`}>
                      {isSelected && <div className="size-2.5 rounded-full bg-black" />}
                    </div>
                    <div className="grow space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-black font-figtree text-[1rem] leading-tight">{store.code || store.name}</h3>
                        <span className="font-bold text-black font-figtree text-[0.875rem]">FREE</span>
                      </div>
                      <p className="text-[0.9375rem] text-zinc-500 leading-relaxed pr-6 font-figtree">
                        {store.address}, {store.city} {store.state}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <Button variant="outline" type="button" onClick={() => setShowStoreDialog(false)} className="flex-1 h-[46px] border border-zinc-200 text-black font-figtree text-[0.9375rem] font-medium rounded-[4px]">
                Cancel
              </Button>
              <Button type="button" onClick={saveStoreSelection} className="flex-1 h-[46px] bg-[#5A413F] hover:bg-[#4A312F] text-white font-figtree text-[0.9375rem] font-medium rounded-[4px] transition-colors border border-transparent">
                Save Location
              </Button>
            </div>
          </div>
        </div>
      ) : hasResolvedStore && selectedStore ? (
        <div className="space-y-4">
          {/* Pincode Display Box */}
          <div className="flex items-center h-14 rounded-sm border border-zinc-200 bg-[#FAFAFA] px-4 gap-3">
            <LocateFixed size={18} className="text-black shrink-0" />
            <span className="text-[1rem] font-figtree font-medium text-[#5A413F]">
              {pincodeQuery || "400064"}
            </span>
          </div>

          {/* Selected Store Card */}
          <div className="border border-zinc-200 rounded-sm overflow-hidden bg-white">
            <div className="p-4 sm:p-5 space-y-3">
              <h3 className="font-figtree text-[1.0625rem] font-bold text-black">{selectedStore.code}</h3>
              <p className="text-[0.9375rem] leading-relaxed text-black font-medium font-figtree pr-4 md:pr-10">
                {selectedStore.address}, {selectedStore.city} {selectedStore.state}
              </p>
              <div className="flex items-center gap-2 text-[0.9375rem] text-[#22A05B] font-figtree font-medium pt-1">
                <span className="size-1.5 rounded-full bg-[#22A05B]" />
                Pickup Available by {formatPickupReadyDate()}
              </div>
            </div>

            {/* Bottom Actions: Phone & Directions */}
            <div className="grid grid-cols-2 border-t border-zinc-200">
              <a 
                href={selectedStore.phone ? `tel:${selectedStore.phone}` : "#"} 
                className="flex items-center justify-center gap-2 h-14 border-r border-zinc-200 px-2 hover:bg-zinc-50 transition-colors"
              >
                <Phone size={18} className="text-black shrink-0" />
                <span className="text-[0.9375rem] font-figtree font-medium text-black">
                  {selectedStore.phone || "No phone"}
                </span>
              </a>
              <a
                href={getDirectionsUrl(selectedStore)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-14 text-[0.9375rem] font-figtree font-medium text-black hover:bg-zinc-50 transition-colors"
              >
                <Navigation size={18} className="text-black shrink-0" />
                Get Direction
              </a>
            </div>
          </div>
          
          <Button type="button" onClick={() => setShowStoreDialog(true)} className="w-full h-[48px] bg-transparent hover:bg-zinc-50 border border-[#5A413F] text-[#5A413F] font-figtree font-semibold text-[0.9375rem] rounded-[4px] transition-colors">
            Change Pickup
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-figtree text-[0.9375rem] font-medium text-black">Find Store near you for Pickup</h2>
          <div className="flex items-center h-[52px] rounded-[4px] border border-zinc-200 bg-white px-3 gap-2">
            <LocateFixed size={18} className="text-black shrink-0" />
            <input
              placeholder="Enter Pincode"
              value={pincodeQuery}
              maxLength={6}
              onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, ""))}
              className="h-full w-full min-w-0 bg-transparent outline-none text-[0.9375rem] font-figtree font-medium text-black placeholder:text-zinc-400"
            />
          </div>


          <Button type="button" onClick={findNearestStore} className="w-full h-12 bg-[#5A413F] hover:bg-[#4A312F] text-white text-[0.9375rem] font-figtree font-medium rounded-md transition-colors">
            Find Nearest Store
          </Button>
        </div>
      )}

    </div>
  );
}
