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
  onAddNew,
  radioGroupName = "addresses",
}) {
  return (
    <div className="space-y-4">
      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className="w-full h-[52px] rounded-md border-dashed border border-[#5A413F]/40 text-[#5A413F] bg-white hover:bg-[#FCF9F8] transition-colors flex items-center justify-center gap-2 font-figtree font-medium text-[0.9375rem] lg:text-[1rem]"
        >
          <Plus size={18} />
          Add New Address
        </button>
      )}
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
                  <h3 className="font-figtree text-[1.0625rem] font-semibold text-black break-words">
                    {[address.firstName, address.lastName].filter(Boolean).join(" ")}
                    {address.phone ? ` | ${address.phone}` : ""}
                  </h3>
                </div>
                
                <div className="text-[0.9375rem] lg:text-[1rem] leading-relaxed text-zinc-600 font-medium font-figtree pr-4 lg:max-w-[80%]">
                  {formatAddressLines(address).filter(line => line !== [address.firstName, address.lastName].filter(Boolean).join(" ")).join(", ")}
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
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.0003 18.3337C14.6027 18.3337 18.3337 14.6027 18.3337 10.0003C18.3337 5.39795 14.6027 1.66699 10.0003 1.66699C5.39795 1.66699 1.66699 5.39795 1.66699 10.0003C1.66699 14.6027 5.39795 18.3337 10.0003 18.3337Z" stroke={isSelected ? "#5A413F" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  {isSelected && <circle cx="10" cy="10" r="5" fill="#5A413F"/>}
                </svg>
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
                className="flex-1 flex items-center justify-center gap-2 h-[46px] rounded-[4px] border border-zinc-200 bg-white text-[#5A413F] font-figtree font-medium text-[0.9375rem] lg:text-[1rem] hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="flex-1 flex items-center justify-center gap-2 h-[46px] rounded-[4px] border border-zinc-200 bg-white text-[#5A413F] font-figtree font-medium text-[0.9375rem] lg:text-[1rem] hover:bg-zinc-50 transition-colors"
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
