"use client";

// Right-hand drawer on desktop, bottom sheet on mobile — the surface the flow
// doc uses for the store list and the booking summary.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function SideDrawer({ open, onClose, title, children, footer }) {
  // Slide in from the right on desktop, up from the bottom on mobile — the
  // panel is docked to a different edge in each case, so animating the wrong
  // axis would start it off-screen in the wrong direction.
  const isDesktop = useMediaQuery("(min-width: 640px)");
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
          className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-end sm:items-stretch sm:justify-end"
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
