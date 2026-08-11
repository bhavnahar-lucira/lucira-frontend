"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Desktop header slot. Occupies the space the "Find a Store" link used to hold
// and absorbs its job — the store-locator link now lives inside the panel.
//
// Non-blocking by design: opens on hover (mouse only) or click, dismissed on
// outside click, Esc, or leaving the pill. Never a modal on first paint — an
// interstitial here costs more sessions than the personalisation wins back.
//
// Hover-to-open is only safe here because PincodePanel takes no focus on mount
// (it focuses its input only when you press Edit) — so a passing cursor can
// never steal the caret from the search bar next door.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Pencil } from "lucide-react";
import PincodePanel, { usePincodeResolution } from "./PincodePanel";
import { formatKm } from "@/lib/nearestStore";
import { pushPromoClick } from "@/lib/gtm";

// Open fast enough to feel like the pill itself expanded, but not so fast that
// a cursor crossing the header on its way to the cart flashes the panel open.
const HOVER_IN_MS = 90;
// The close delay is the forgiving one: it covers the diagonal drift off the
// pill on the way down to the panel, and any wobble along its edges.
const HOVER_OUT_MS = 220;
// Matches the CSS transition below — the panel stays mounted this long after
// close so the exit actually plays instead of the element vanishing.
const EXIT_MS = 150;

export default function PincodePicker({ locationId = "Header" }) {
  const [open, setOpen] = useState(false);
  // `mounted` keeps the node alive through the exit; `shown` drives the
  // transition. Two flags rather than one because a node has to be in the DOM
  // for a frame before the browser will animate it out of its closed state.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const wrapRef = useRef(null);
  const hoverTimer = useRef(null);
  const trackTimer = useRef(null);
  // Set when a click closes the panel while the cursor is still on the pill —
  // without it, the pointer sitting there would just re-open what you dismissed.
  const suppressHover = useRef(false);
  const ctl = usePincodeResolution({ locationId });
  const { committed, committedStore, committedInRange } = ctl;

  const track = useCallback(() => {
    pushPromoClick({
      creative_name: "Header pincode opened",
      location_id: locationId,
    });
  }, [locationId]);

  const toggle = useCallback(() => {
    if (trackTimer.current) clearTimeout(trackTimer.current);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setOpen((prev) => {
      // Already open from a hover — this click is a dismissal, and the open was
      // counted (or is about to be discarded by the clear above).
      if (prev) suppressHover.current = true;
      else track();
      return !prev;
    });
  }, [track]);

  // Pointer-driven opening is for mice only. A touch "hover" is really a tap,
  // and firing both paths would open and immediately toggle shut.
  const isMouse = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

  const onPointerEnter = useCallback(() => {
    if (!isMouse() || suppressHover.current) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setOpen(true);
      // Only count a hover-open the shopper actually sat with. Charging the
      // GTM event on every cursor that grazes the pill would drown the real
      // click-throughs this metric exists to measure.
      trackTimer.current = setTimeout(track, 400);
    }, HOVER_IN_MS);
  }, [track]);

  const onPointerLeave = useCallback(() => {
    suppressHover.current = false;
    if (!isMouse()) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      // Never yank the panel out from under someone mid-entry — if the caret is
      // in the pincode field, only an outside click or Esc closes it.
      if (wrapRef.current?.contains(document.activeElement)) return;
      if (trackTimer.current) clearTimeout(trackTimer.current);
      setOpen(false);
    }, HOVER_OUT_MS);
  }, []);

  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (trackTimer.current) clearTimeout(trackTimer.current);
    },
    [],
  );

  // Mount → next frame → animate in; close → animate out → unmount.
  useEffect(() => {
    if (open) {
      setMounted(true);
      // rAF gives the browser the one frame it needs to register the closed
      // state before we transition out of it. The timer is a floor, not a
      // nicety: a throttled or non-compositing tab never fires rAF, and
      // without it the panel would sit there mounted at opacity 0.
      const raf = requestAnimationFrame(() => setShown(true));
      const fallback = setTimeout(() => setShown(true), 50);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(fallback);
      };
    }
    setShown(false);
    const id = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [open]);

  // Outside click + Esc. Listeners only exist while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The pincode is the quiet top line and the STORE is the bold one. The old
  // arrangement paired a "Delivery only" label with "Delivering to 401504",
  // which said the same thing twice; and naming the store first is more useful
  // to the shopper than repeating a phrase they just typed a pincode into.
  const hasPin = !!committed;
  const label = hasPin ? `PIN ${committed}` : "Delivery & stores";
  const value = !hasPin
    ? "Add your pincode"
    : committedStore
      ? `${committedStore.shortName} · ${formatKm(committedStore.distance)}`
      : committedInRange === false
        ? "We deliver here"
        : "Finding your store…";

  return (
    <div
      ref={wrapRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="relative hidden shrink-0 lg:block"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex cursor-pointer items-center gap-2 rounded-full border border-[#EBE2E0] bg-white py-1 pl-2 pr-2.5 text-left shadow-[0_1px_2px_rgba(90,65,63,0.05)] transition-all hover:border-[#B77767] hover:shadow-[0_2px_8px_-3px_rgba(183,119,103,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B77767]"
      >
        {/* Green only when a store is genuinely reachable — the icon carries the
            same signal as the store card, so the two never disagree. */}
        <MapPin
          size={15}
          strokeWidth={2}
          className={`shrink-0 ${committedStore ? "text-[#006D4E]" : "text-[#B77767]"}`}
        />

        <span className="flex min-w-[92px] flex-col leading-[1.2]">
          <span
            className={`font-figtree text-[8.5px] font-bold uppercase tracking-[0.09em] tabular-nums ${
              hasPin ? "text-[#A08A85]" : "text-[#9D8681]"
            }`}
          >
            {label}
          </span>
          <span
            className={`flex items-center gap-1 font-figtree text-[11.5px] font-bold ${
              committedStore ? "text-[#006D4E]" : hasPin ? "text-[#5A413F]" : "text-[#B77767]"
            }`}
          >
            {committedStore && (
              <span className="size-[5px] shrink-0 rounded-full bg-[#006D4E]" />
            )}
            {value}
          </span>
        </span>

        {hasPin && <Pencil size={12} strokeWidth={2.2} className="shrink-0 text-[#B77767]" />}
      </button>

      {/* The 10px gap under the pill lives in this wrapper's padding rather than
          as a `top` offset, so the cursor stays inside the hover region on the
          way down to the panel. A bare gap would close it mid-travel. */}
      {mounted && (
        <div
          className={`absolute right-0 top-full z-[60] pt-[10px] ${
            shown ? "" : "pointer-events-none"
          }`}
        >
          <div
            role="dialog"
            aria-label="Delivery and stores"
            className={`relative w-[336px] origin-top-right rounded-[14px] border border-[#EBE2E0] bg-white px-[18px] pb-[18px] pt-5 shadow-[0_18px_44px_-22px_rgba(90,65,63,0.38),0_2px_6px_-2px_rgba(90,65,63,0.10)] transition-[opacity,translate,scale] duration-150 ease-out motion-reduce:transition-none ${
              shown
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-1 scale-[0.98] opacity-0"
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute -top-[7px] right-[34px] h-3 w-3 rotate-45 border-l border-t border-[#EBE2E0] bg-white"
            />
            <PincodePanel ctl={ctl} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
