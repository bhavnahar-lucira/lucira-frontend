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
          <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm p-6 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-zinc-900 text-base">{selectedStore.code}</h3>
              <span className="font-bold text-zinc-900 text-sm">FREE</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {selectedStore.address}, {selectedStore.city} {selectedStore.state}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <span className="size-1.5 rounded-full bg-green-600" />
              Pickup Available by {formatPickupReadyDate()}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center h-12 rounded-md border border-zinc-200 px-3 gap-2">
                <Phone size={16} className="text-zinc-400 shrink-0" />
                <input
                  placeholder="Phone number"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="h-full w-full min-w-0 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
              </div>
              <a
                href={getDirectionsUrl(selectedStore)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-12 rounded-md border border-zinc-200 text-sm font-bold text-primary hover:bg-zinc-50"
              >
                <Navigation size={14} />
                Get Direction
              </a>
            </div>
          </div>
          <Button type="button" onClick={openStoreDialog} className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold">
            Change Pickup
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-abhaya text-xl font-bold text-zinc-900">Find Store near you for Pickup</h2>
          <div className="flex items-center h-12 rounded-md border border-zinc-200 bg-white px-3 gap-2">
            <LocateFixed size={16} className="text-zinc-400 shrink-0" />
            <input
              placeholder="Enter Pincode"
              value={pincodeQuery}
              maxLength={6}
              onChange={(e) => setPincodeQuery(e.target.value.replace(/\D/g, ""))}
              className="h-full w-full min-w-0 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>

          {sortedStores[0] && (
            <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
              <div className="p-5 space-y-1">
                <h3 className="font-bold text-zinc-900">{sortedStores[0].code}</h3>
                <p className="text-sm text-zinc-500">
                  {sortedStores[0].address}, {sortedStores[0].city} {sortedStores[0].state}
                </p>
              </div>
              {sortedStores.length > 1 && (
                <button
                  type="button"
                  onClick={openStoreDialog}
                  className="w-full flex items-center justify-between px-5 py-3 border-t border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-700">{sortedStores.length - 1} more Locations</span>
                  <ChevronRight size={16} className="text-zinc-700" />
                </button>
              )}
            </div>
          )}

          <Button type="button" onClick={findNearestStore} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold">
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
