"use client";

import { Pencil } from "lucide-react";
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
    <div className={`rounded-lg border border-zinc-200 bg-white p-5 space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 text-sm text-zinc-600">
          <p className="font-semibold text-zinc-900">{name}</p>
          {detailLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {address.gstin && <p className="font-medium text-zinc-800">GSTIN: {address.gstin}</p>}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-full bg-white shadow border border-zinc-100 p-2 text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>

      {address.phone && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-900">+{address.phone.replace(/^\+/, "")}</p>
          {address.isDefault && (
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Default
            </span>
          )}
        </div>
      )}

      {onChangeClick && (
        <Button
          type="button"
          onClick={onChangeClick}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold"
        >
          {changeLabel}
        </Button>
      )}
    </div>
  );
}
