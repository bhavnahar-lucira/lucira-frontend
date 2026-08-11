"use client";

import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileBottomSheet } from "@/components/common/MobileBottomSheet";

function StoreListContent({ stores, selectedStoreId, onSelect, onUseMyLocation }) {
  return (
    <div className="p-6 space-y-6">
      <button onClick={onUseMyLocation} className="flex items-center gap-2 text-[15px] font-medium font-figtree text-zinc-800 hover:underline">
        <Navigation size={18} className="text-zinc-600" />
        Use my location
      </button>

      <div className="space-y-4">
        <p className="text-[15px] text-zinc-500 font-figtree">There are {stores.length} locations with your item</p>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {stores.map((store) => {
            const isSelected = selectedStoreId === store.id;
            return (
              <div
                key={store.id}
                onClick={() => onSelect(store.id)}
                className={`relative flex items-start gap-4 p-5 rounded-lg border transition-all cursor-pointer ${
                  isSelected ? "border-black shadow-sm" : "border-zinc-100 hover:border-zinc-200"
                }`}
              >
                <div
                  className={`mt-1 size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-black bg-transparent" : "border-zinc-300"
                  }`}
                >
                  {isSelected && <div className="size-2.5 rounded-full bg-black" />}
                </div>

                <div className="grow space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-black font-figtree text-[16px]">{store.code || store.name}</h3>
                    <span className="font-bold text-black font-figtree text-[15px]">FREE</span>
                  </div>
                  <p className="text-[15px] text-zinc-500 leading-relaxed pr-8 font-figtree">
                    {store.address}, {store.city} {store.state}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StoreSelectorDialog({
  isDesktop,
  open,
  onOpenChange,
  stores,
  selectedStoreId,
  onSelect,
  onUseMyLocation,
  onSave,
}) {
  const content = (
    <StoreListContent stores={stores} selectedStoreId={selectedStoreId} onSelect={onSelect} onUseMyLocation={onUseMyLocation} />
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-lg border-none">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold font-figtree text-black">Pickup locations</DialogTitle>
          </DialogHeader>
          {content}
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 h-12 border-zinc-200 text-zinc-800 font-figtree font-medium rounded-sm">
              Cancel
            </Button>
            <Button onClick={onSave} className="px-10 h-12 bg-[#5A413F] hover:bg-[#4A312F] text-white font-figtree font-medium rounded-sm">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <MobileBottomSheet
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Pickup locations"
      footer={
        <Button onClick={onSave} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-full uppercase tracking-widest">
          SAVE LOCATION
        </Button>
      }
    >
      {content}
    </MobileBottomSheet>
  );
}
