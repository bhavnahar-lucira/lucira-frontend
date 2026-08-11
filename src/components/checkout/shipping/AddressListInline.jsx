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
    <div className="space-y-3">
      <div className="space-y-3">
        {addresses.map((address) => {
          const isSelected = selectedAddressId === address.id;
          return (
            <div
              key={address.id}
              onClick={() => onSelect(address.id)}
              role="button"
              tabIndex={0}
              className={`rounded-lg border p-4 text-left transition-all cursor-pointer ${
                isSelected ? "border-primary bg-[#FFF8F4]" : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name={radioGroupName}
                  checked={isSelected}
                  onChange={() => {}}
                  className="mt-1 size-4 accent-black"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">
                        {[address.firstName, address.lastName].filter(Boolean).join(" ") || "Saved address"}
                      </h3>
                      {address.isDefault && (
                        <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                          Default
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
                      className={`rounded-full border border-zinc-200 p-2 text-zinc-600 transition ${address.isDefault ? "opacity-50 cursor-not-allowed" : "hover:border-red-200 hover:text-red-600"}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-zinc-600">
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
        <Button
          type="button"
          variant="outline"
          onClick={onAddNew}
          className="w-full h-12 border-dashed border-2 border-zinc-200 text-zinc-500 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-2 font-bold"
        >
          <Plus size={18} />
          {addNewLabel}
        </Button>
      )}
    </div>
  );
}
