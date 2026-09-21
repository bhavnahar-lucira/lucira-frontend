"use client";

// Right-hand drawer on desktop, bottom sheet on mobile — the surface the flow
// doc uses for the store list and the booking summary.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Matches the `sm:` breakpoint the panel's own classes dock it with — the two
// have to agree, or the drawer animates along an axis it is not docked to.
const DESKTOP_QUERY = "(min-width: 640px)";

// Read through useSyncExternalStore rather than useMediaQuery, which starts at
// false and only corrects in an effect — one render too late here. A product
// card mounts this drawer ALREADY open, so framer-motion reads `initial` on the
// very first render, and a false there sent the desktop drawer sliding UP from
// the bottom before CSS parked it against the right edge. The Book Appointment
// page never showed it: its drawers mount closed with the page, so the effect
// has long since run by the time one opens. This is also the pattern
// useUserPincode settled on, for the reason it documents — the React Compiler
// rejects hydrating state inside an effect.
const subscribeToDesktop = (onChange) => {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
const desktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;
// The drawer is only ever opened by a click, so the server never renders one
// open — but it does render this component closed, and that pass needs an
// answer. Mobile-first is the safe one: it is what the old hook assumed.
const desktopServerSnapshot = () => false;

export default function SideDrawer({ open, onClose, title, children, footer }) {
  const isDesktop = React.useSyncExternalStore(
    subscribeToDesktop,
    desktopSnapshot,
    desktopServerSnapshot
  );
  // Slide in from the right on desktop, up from the bottom on mobile — the
  // panel is docked to a different edge in each case, so animating the wrong
  // axis would start it off-screen in the wrong direction.
  const offscreen = isDesktop ? { x: "100%", y: 0 } : { x: 0, y: "100%" };
  // A drawer that scrolls the page behind it reads as broken on mobile.
  React.useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          /* Above every overlay this drawer can share a screen with. The app's
             tiers run roughly: header and floating buttons at 100, the Book
             Appointment focus scrim at 110, dialogs and sheets at 2000, and
             toasts, tooltips and the coupon drawer at 9999 — a booking that is
             mid-OTP must not end up behind any of them. Deliberately UNDER the
             99999 tier, which is full-screen takeovers (Instagram popup, cart
             item modal) that should still win, and under third-party widgets,
             which inject at max int and are not ours to fight. */
          className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-end sm:items-stretch sm:justify-end"
        >
          <motion.aside
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ ...offscreen, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ ...offscreen, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full sm:w-[420px] sm:max-w-full bg-white shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-none sm:h-full rounded-t-2xl sm:rounded-none"
          >
            <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-figtree font-bold text-base text-black">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-zinc-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer && <div className="shrink-0 border-t border-gray-100 px-5 py-4">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
