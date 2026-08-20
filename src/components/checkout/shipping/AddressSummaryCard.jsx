"use client";

import { Button } from "@/components/ui/button";
import { formatAddressLines } from "@/lib/checkout/address-helpers";

/**
 * Compact "selected address" card: name, address lines, phone (+ DEFAULT
 * badge), GSTIN, an optional edit pencil, and an "Add or Change Address"
 * trigger. Used for both the shipping card and the "different, saved"
 * billing card.
 */
export function AddressSummaryCard({
  address,
  onEdit,
  onChangeClick,
  changeLabel = "Add or Change Address",
  className = "",
}) {
  if (!address) return null;

  const name = [address.firstName, address.lastName].filter(Boolean).join(" ") || "Saved address";
  const detailLines = formatAddressLines(address).slice(1);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-[4px] border border-zinc-200 bg-white">
        {/* Top Part: Name, Edit Icon, Address */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-2 lg:mb-[10px]">
            <h3 className="font-figtree text-[1.0625rem] font-semibold text-black">{name}</h3>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="shrink-0 text-black hover:opacity-70 transition-opacity p-0.5"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2.00015H3.33333C2.97971 2.00015 2.64057 2.14063 2.39052 2.39068C2.14048 2.64072 2 2.97986 2 3.33348V12.6668C2 13.0204 2.14048 13.3596 2.39052 13.6096C2.64057 13.8597 2.97971 14.0002 3.33333 14.0002H12.6667C13.0203 14.0002 13.3594 13.8597 13.6095 13.6096C13.8595 13.3596 14 13.0204 14 12.6668V8.00015M12.25 1.75015C12.5152 1.48493 12.8749 1.33594 13.25 1.33594C13.6251 1.33594 13.9848 1.48493 14.25 1.75015C14.5152 2.01537 14.6642 2.37508 14.6642 2.75015C14.6642 3.12522 14.5152 3.48493 14.25 3.75015L8.24133 9.75948C8.08303 9.91765 7.88747 10.0334 7.67267 10.0962L5.75733 10.6562C5.69997 10.6729 5.63916 10.6739 5.58127 10.6591C5.52339 10.6442 5.47055 10.6141 5.4283 10.5719C5.38604 10.5296 5.35593 10.4768 5.3411 10.4189C5.32627 10.361 5.32727 10.3002 5.344 10.2428L5.904 8.32748C5.96702 8.11285 6.08302 7.91752 6.24133 7.75948L12.25 1.75015Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          <div className="text-[0.875rem] lg:text-[1rem] leading-snug text-zinc-600 font-medium font-figtree pr-4 lg:pr-0 lg:max-w-[80%] lg:mb-[6px]">
            {detailLines.join(", ")}
            {address.gstin && <p className="mt-1 font-medium text-black">GSTIN: {address.gstin}</p>}
          </div>
          {address.phone && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-[0.875rem] lg:text-[1rem] font-medium text-zinc-900 font-figtree">
                +{address.phone.replace(/^\+/, "")}
              </p>
              {address.isDefault && (
                <span className="rounded-[4px] bg-[#F5E9DA] px-2.5 py-1 text-[0.5625rem] lg:text-[0.875rem] font-bold uppercase tracking-wider text-[#5A413F]">
                  DEFAULT
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {onChangeClick && (
        <Button
          type="button"
          onClick={onChangeClick}
          className="w-full h-[48px] bg-transparent hover:bg-zinc-50 border border-[#5A413F] text-[#5A413F] font-figtree font-semibold text-[0.9375rem] lg:text-[1rem] rounded-[4px] transition-colors"
        >
          {changeLabel}
        </Button>
      )}
    </div>
  );
}
