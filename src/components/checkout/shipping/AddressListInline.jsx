"use client";

import { Plus, Trash, Edit } from "lucide-react";
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
  onEdit,
  radioGroupName = "addresses",
}) {
  return (
    <div className="space-y-4">
      {addresses.map((address) => {
        const isSelected = selectedAddressId === address.id;
        return (
          <div
            key={address.id}
            onClick={() => onSelect(address.id)}
            role="button"
            tabIndex={0}
            className={`rounded-md border p-5 text-left transition-all cursor-pointer relative flex flex-col gap-4 ${
              isSelected ? "border-[#5A413F] bg-[#FCF9F8]" : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div className="flex-1 w-full overflow-hidden pr-3">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-figtree text-[1.0625rem] font-semibold text-black truncate">
                    {[address.firstName, address.lastName].filter(Boolean).join(" ")}
                    {address.phone ? ` | ${address.phone}` : ""}
                  </h3>
                </div>
                
                <div className="space-y-1 text-[0.9375rem] leading-relaxed text-zinc-900 font-medium font-figtree">
                  {formatAddressLines(address).filter(line => line !== [address.firstName, address.lastName].filter(Boolean).join(" ")).map((line) => (
                    <p key={`${address.id}-${line}`}>{line}</p>
                  ))}
                  {address.gstin && <p className="font-medium text-zinc-900 mt-1">GSTIN: {address.gstin}</p>}
                </div>
              </div>

              {/* Custom Radio */}
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="radio"
                  name={radioGroupName}
                  checked={isSelected}
                  onChange={() => {}}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full border-[2px] transition-colors ${
                    isSelected ? "border-[#5A413F]" : "border-[#5A413F]"
                  }`}
                >
                  {isSelected && <div className="w-3 h-3 rounded-full bg-[#5A413F]" />}
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                disabled={address.isDefault}
                onClick={async (e) => {
                  e.stopPropagation();
                  await onDelete(address.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 h-[46px] rounded-[4px] border border-zinc-200 bg-white text-[#5A413F] font-figtree font-medium text-[0.9375rem] hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash className="size-[18px]" strokeWidth={1.5} />
                Delete
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(address);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 h-[46px] rounded-[4px] border border-zinc-200 bg-white text-[#5A413F] font-figtree font-medium text-[0.9375rem] hover:bg-zinc-50 transition-colors"
                >
                  <Edit className="size-[18px]" strokeWidth={1.5} />
                  Edit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
