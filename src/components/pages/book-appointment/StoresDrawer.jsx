"use client";

// "Stores Near You" — every live store, closest first, so a shopper can pick a
// store other than the one we auto-selected (or find one when their own pincode
// has none nearby).

import React from "react";
import { MapPin, Check } from "lucide-react";
import SideDrawer from "./SideDrawer";
import { PincodeChip } from "./parts";
import { storeLabel, storeAddress, formatDistance } from "@/lib/bookAppointment";

export default function StoresDrawer({ open, onClose, pincode, stores, selectedId, onSelect, onChangePincode }) {
  // The wireframe badges the closest store; everything below it is just ordered.
  const nearestId = stores?.find((s) => s.distance !== null)?.shopifyId;

  return (
    <SideDrawer open={open} onClose={onClose} title="Stores Near You">
      <div className="flex flex-col gap-3">
        {pincode && <PincodeChip pincode={pincode} onChange={onChangePincode} />}

        {!stores?.length && (
          <p className="text-sm text-zinc-500 font-figtree text-center py-8">
            We could not load our stores right now. Please try again in a moment.
          </p>
        )}

        {stores?.map((store) => {
          const isSelected = store.shopifyId === selectedId;
          return (
            <button
              key={store.shopifyId || store.id}
              type="button"
              onClick={() => onSelect(store)}
              className={`text-left border rounded-sm p-4 flex flex-col gap-1.5 transition-colors cursor-pointer ${
                isSelected ? "border-primary bg-primary/5" : "border-gray-100 bg-gray-50/50 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-figtree font-bold text-sm text-black leading-tight">
                  {storeLabel(store)}
                </span>
                {store.shopifyId === nearestId && (
                  <span className="text-[9px] font-figtree font-bold uppercase tracking-wider text-primary bg-[#F1E4D1] px-2 py-0.5 rounded-full shrink-0">
                    Nearest
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-500 font-figtree leading-relaxed">{storeAddress(store)}</p>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                {store.distance !== null ? (
                  <span className="flex items-center gap-1 text-primary font-semibold text-xs font-figtree">
                    <MapPin size={12} />
                    {formatDistance(store.distance)}
                  </span>
                ) : (
                  <span />
                )}
                {isSelected && (
                  <span className="flex items-center gap-1 text-[11px] font-figtree font-bold text-primary uppercase tracking-wide">
                    <Check size={12} strokeWidth={3} />
                    Selected
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </SideDrawer>
  );
}
