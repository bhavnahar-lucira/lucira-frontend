"use client";

import { ChevronRight, LocateFixed, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreSelectorDialog } from "./StoreSelectorDialog";
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
      {hasResolvedStore && selectedStore ? (
        <div className="space-y-4">
          {/* Pincode Display Box */}
          <div className="flex items-center h-[52px] rounded-[4px] border border-zinc-200 bg-[#FCF9F8] px-4 gap-3">
            <LocateFixed size={18} className="text-black shrink-0" />
            <span className="text-[15px] font-figtree font-medium text-[#5A413F]">
              {pincodeQuery || "400064"}
            </span>
          </div>

          {/* Selected Store Card */}
          <div className="border border-zinc-200 rounded-[4px] overflow-hidden bg-white shadow-sm">
            <div className="p-4 sm:p-5 space-y-2.5">
              <h3 className="font-figtree text-[16px] font-semibold text-black mb-1">{selectedStore.code}</h3>
              <p className="text-[14px] leading-snug text-zinc-900 font-medium font-figtree pr-4 md:pr-10">
                {selectedStore.address}, {selectedStore.city} {selectedStore.state}
              </p>
              <div className="flex items-center gap-1.5 text-[14px] text-[#22A05B] font-figtree font-medium pt-1">
                <span className="size-1.5 rounded-full bg-[#22A05B]" />
                Pickup Available by {formatPickupReadyDate()}
              </div>
            </div>

            {/* Bottom Actions: Phone Input & Directions */}
            <div className="grid grid-cols-2 border-t border-zinc-200">
              <div className="flex items-center justify-center gap-2 h-12 border-r border-zinc-200">
                <Phone size={16} className="text-black shrink-0" />
                <input
                  placeholder="Phone number"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-[125px] bg-transparent outline-none text-[14px] font-figtree font-medium text-black placeholder:text-zinc-400"
                />
              </div>
              <a
                href={getDirectionsUrl(selectedStore)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-12 text-[14px] font-figtree font-medium text-black hover:bg-zinc-50 transition-colors"
              >
                <Navigation size={16} className="text-black shrink-0" />
                Get Direction
              </a>
            </div>
          </div>
          
          <Button type="button" onClick={openStoreDialog} className="w-full h-12 bg-[#5A413F] hover:bg-[#4A312F] text-white text-[15px] font-figtree font-medium rounded-md transition-colors">
            Change Pickup
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-figtree text-[15px] font-medium text-black">Find Store near you for Pickup</h2>
          <div className="flex items-center h-[52px] rounded-[4px] border border-zinc-200 bg-white px-3 gap-2">
            <LocateFixed size={18} className="text-black shrink-0" />
            <input
              placeholder="Enter Pincode"
              value={pincodeQuery}
              maxLength={6}
              onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, ""))}
              className="h-full w-full min-w-0 bg-transparent outline-none text-[15px] font-figtree font-medium text-black placeholder:text-zinc-400"
            />
          </div>

          {sortedStores[0] && (
            <div className="border border-zinc-200 rounded-[4px] overflow-hidden bg-white">
              <div className="p-4 sm:p-5 space-y-1">
                <h3 className="font-figtree text-[16px] font-semibold text-black mb-2">{sortedStores[0].code}</h3>
                <p className="text-[14px] leading-snug text-zinc-900 font-medium font-figtree pr-4">
                  {sortedStores[0].address}, {sortedStores[0].city} {sortedStores[0].state}
                </p>
              </div>
              {sortedStores.length > 1 && (
                <button
                  type="button"
                  onClick={openStoreDialog}
                  className="w-full flex items-center justify-between px-5 py-[14px] border-t border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  <span className="font-figtree text-[14px] font-medium text-black">{sortedStores.length - 1} more Locations</span>
                  <ChevronRight size={18} className="text-black" />
                </button>
              )}
            </div>
          )}

          <Button type="button" onClick={findNearestStore} className="w-full h-12 bg-[#5A413F] hover:bg-[#4A312F] text-white text-[15px] font-figtree font-medium rounded-md transition-colors">
            Find Nearest Store
          </Button>
        </div>
      )}

      <StoreSelectorDialog
        isDesktop={isDesktop}
        open={showStoreDialog}
        onOpenChange={setShowStoreDialog}
        stores={sortedStores}
        selectedStoreId={tempSelectedStoreId}
        onSelect={setTempSelectedStoreId}
        onUseMyLocation={findNearestByGeolocation}
        onSave={saveStoreSelection}
      />
    </div>
  );
}
