"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAddressLines } from "@/lib/checkout/address-helpers";

/**
 * Inline (not a dialog/bottom-sheet) list of saved addresses to pick from,
 * with an optional "Add new address" trigger — used for both the shipping
 * and billing "Add or Change Address" flows, which stay on the page instead
 * of opening a popup.
 */
export function AddressListInline({
  addresses,
  selectedAddressId,
  onSelect,
  onDelete,
  radioGroupName = "addresses",
  onAddNew,
  addNewLabel = "Add new address",
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {addresses.map((address) => {
          const isSelected = selectedAddressId === address.id;
          return (
            <div
              key={address.id}
              onClick={() => onSelect(address.id)}
              role="button"
              tabIndex={0}
              className={`rounded-md border p-4 sm:p-5 text-left transition-all cursor-pointer relative ${
                isSelected ? "border-[#5A413F] bg-[#FCF9F8]" : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Custom Radio */}
                <div className="relative flex items-center justify-center mt-1">
                  <input
                    type="radio"
                    name={radioGroupName}
                    checked={isSelected}
                    onChange={() => {}}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div
                    className={`flex items-center justify-center w-4 h-4 rounded-full border-2 transition-colors ${
                      isSelected ? "border-black" : "border-zinc-400"
                    }`}
                  >
                    {isSelected && <div className="w-[8px] h-[8px] rounded-full bg-black" />}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-figtree text-[15px] font-medium text-black">
                        {[address.firstName, address.lastName].filter(Boolean).join(" ") || "Saved address"}
                      </h3>
                      {address.isDefault && (
                        <span className="rounded-full bg-[#18181B] px-2.5 py-[2px] text-[10px] font-bold uppercase tracking-wide text-white">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={address.isDefault}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onDelete(address.id);
                      }}
                      className={`rounded-full border border-zinc-100 bg-white p-[7px] shadow-sm text-zinc-400 transition ${
                        address.isDefault ? "opacity-50 cursor-not-allowed" : "hover:border-red-200 hover:text-red-600"
                      }`}
                    >
                      <Trash2 className="size-[15px]" />
                    </button>
                  </div>
                  <div className="mt-2.5 space-y-1 text-[14px] leading-snug text-zinc-600 font-medium font-figtree">
                    {formatAddressLines(address).map((line) => (
                      <p key={`${address.id}-${line}`}>{line}</p>
                    ))}
                    {address.gstin && <p className="font-medium text-zinc-800">GSTIN: {address.gstin}</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className="w-full h-[52px] rounded-md border-dashed border-2 border-zinc-200 text-zinc-500 bg-transparent hover:text-black hover:border-zinc-300 transition-colors flex items-center justify-center gap-2 font-figtree font-medium text-[15px]"
        >
          <Plus size={16} />
          {addNewLabel}
        </button>
      )}
    </div>
  );
}
