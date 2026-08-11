"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Mobile pincode surface. Two shapes, one brain:
//
//   variant="chip"  — lives INSIDE the header row, directly beside the logo-mark
//                     (not centred, and not boxed in a pill — see the render
//                     below). This is the default surface now.
//   variant="strip" — the original full-width row under the search bar. Kept for
//                     any caller that still wants a banner-shaped entry point.
//
// Both share this component deliberately. `usePincodeResolution` keeps its
// `lastResolved` guard in a ref that is PER INSTANCE (see PincodePanel.jsx), so
// a second component calling the hook would fire its own resolveNearestStores
// request on every page load. One mounted instance = one request.
//
// Uses the vaul drawer (src/components/ui/drawer.jsx) rather than the Radix
// `Sheet`, because vaul is what the rest of the app already reaches for on
// mobile — ProductCard, the PDP and both saving calculators ship it — and it
// brings the drag handle, drag-to-dismiss and max-h-[80vh] that a bottom sheet
// wants, without configuration.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import PincodePanel, { usePincodeResolution } from "./PincodePanel";
import { formatKm } from "@/lib/nearestStore";
import { pushPromoClick } from "@/lib/gtm";

export default function PincodeStrip({
  locationId = "Header Mobile",
  className = "",
  variant = "strip",
}) {
  const [open, setOpen] = useState(false);
  const ctl = usePincodeResolution({ locationId });
  // Driven by the committed pincode, not by what is being typed in the sheet —
  // see the note on `committed` in PincodePanel.
  const { committed, committedStore, committedInRange } = ctl;

  const onOpen = () => {
    setOpen(true);
    pushPromoClick({
      creative_name: "Header pincode opened",
      location_id: locationId,
    });
  };

  // The one line worth a shopper's glance. Same wording as the desktop pill so
  // the two breakpoints never describe the same state differently.
  const readout = committedStore
    ? `${committedStore.shortName} · ${formatKm(committedStore.distance)}`
    : committedInRange === false
      ? "We deliver here"
      : "Finding store…";

  const drawer = (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="bg-white px-4 pb-6 lg:hidden">
        <DrawerTitle className="sr-only">Delivery and stores</DrawerTitle>
        <div className="pt-2">
          <PincodePanel ctl={ctl} onDone={() => setOpen(false)} compact />
        </div>
      </DrawerContent>
    </Drawer>
  );

  if (variant === "chip") {
    return (
      <>
        {/* Borderless by design: this now sits inline beside the logo-mark
            instead of floating alone in the row's centre, and a rounded,
            filled pill in that spot reads as a second brand mark competing
            with the real one. Dropping the border/fill lets it read as
            header information, the same register as the row it's in — the
            colour on the icon and dot is still the whole signal for "store
            found nearby". The button stays 44px tall for the thumb; only the
            visible surface lost its shape. */}
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={
            committed
              ? `Delivery pincode ${committed}${committedStore ? `, nearest store ${committedStore.shortName}` : ""}. Change`
              : "Add your pincode to find your nearest store"
          }
          className={`flex h-11 min-w-0 items-center gap-1.5 pl-2 pr-1 ${className}`}
        >
          <span className="h-5 w-px shrink-0 bg-[#EBE2E0]" aria-hidden="true" />

          <MapPin
            size={14}
            strokeWidth={2}
            className={`shrink-0 ${committedStore ? "text-[#006D4E]" : "text-[#B77767]"}`}
          />

          {committed ? (
            // Same information architecture as the desktop pill — quiet PIN
            // line above, the store as the headline — just miniaturised.
            <span className="flex min-w-0 flex-col text-left leading-[1.15]">
              <span className="font-figtree text-[8px] font-bold uppercase tracking-[0.08em] tabular-nums text-[#A08A85]">
                PIN {committed}
              </span>
              <span
                className={`flex min-w-0 items-center gap-1 font-figtree text-[11px] font-bold ${
                  committedStore ? "text-[#006D4E]" : "text-[#5A413F]"
                }`}
              >
                {committedStore && (
                  <span className="size-[4px] shrink-0 rounded-full bg-[#006D4E]" />
                )}
                <span className="truncate">{readout}</span>
              </span>
            </span>
          ) : (
            // Before entry there is no readout to stack, so one line states the
            // job. An icon alone was rejected for the same reason as on the
            // strip: nobody taps a pin to find out what it does.
            <span className="whitespace-nowrap font-figtree text-[11.5px] font-bold text-[#B77767]">
              Add pincode
            </span>
          )}

          <ChevronDown
            size={12}
            strokeWidth={2.4}
            className={`shrink-0 ${committedStore ? "text-[#006D4E]" : "text-[#B77767]"}`}
          />
        </button>

        {drawer}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className={`flex w-full items-center gap-2 border-b px-3 py-2 text-left transition-colors ${
          committedStore
            ? "border-[#D8ECE4] bg-[#F1FAF6]"
            : "border-[#F6E7E2] bg-[#FFF7F4]"
        } ${className}`}
      >
        <MapPin
          size={15}
          strokeWidth={2}
          className={`shrink-0 ${committedStore ? "text-[#006D4E]" : "text-[#B77767]"}`}
        />

        <span className="min-w-0 flex-1 font-figtree text-[11px] leading-snug text-[#5A413F]">
          {committed ? (
            <>
              <span className="block text-[8.5px] font-bold uppercase tracking-[0.1em] tabular-nums text-[#A08A85]">
                PIN {committed}
              </span>
              {committedStore ? (
                <b className="flex items-center gap-1.5 font-bold text-[#006D4E]">
                  <span className="size-[5px] shrink-0 rounded-full bg-[#006D4E]" />
                  {committedStore.shortName} · {formatKm(committedStore.distance)} away
                </b>
              ) : (
                <b className="font-bold">We deliver here</b>
              )}
            </>
          ) : (
            <>
              <b className="font-bold">Find your nearest store</b> — add your pincode
              to see what you can try on today
            </>
          )}
        </span>

        <span
          className={`shrink-0 font-figtree text-[9.5px] font-bold uppercase tracking-[0.07em] ${
            committedStore ? "text-[#006D4E]" : "text-[#B77767]"
          }`}
        >
          {committed ? "Change" : "Add"}
        </span>
      </button>

      {drawer}
    </>
  );
}
