"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Side drawer shell shared by the PDP "View All" coupons panel and the cart's
 * Saving Zone. Slides in from the right on desktop and up from the bottom on
 * mobile, matching the PDP presentation exactly.
 */
export default function CouponDrawer({ open, onClose, title = "Available Coupons", children }) {
  const [isMobile, setIsMobile] = useState(false);

  // Track responsive screen size for drawer presentation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Lock body scroll while the drawer owns the viewport
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on Escape, matching the dialog behaviour this replaces
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // The drawer is portalled to <body>. Rendered in place it would be trapped in
  // whatever stacking context its parent sits in (the cart column), so the
  // sticky checkout header — only z-50/z-100 — would still paint over it no
  // matter how high this z-index goes. Nothing renders until `open`, so there
  // is no server/client markup to mismatch here.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex justify-center sm:justify-end items-end sm:items-stretch">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Drawer Body */}
          <motion.div
            initial={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
            animate={isMobile ? { y: 0, x: 0 } : { x: 0, y: 0 }}
            exit={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="relative w-full sm:max-w-[380px] h-[85vh] sm:h-full rounded-t-3xl sm:rounded-none bg-[#FFF8F6] shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#FBE3DC] flex flex-col bg-white rounded-t-3xl sm:rounded-none shrink-0">

              <div className="flex items-center justify-between w-full">
                <h3 className="text-base font-figtree font-semibold text-[#5C3E35] tracking-wide uppercase">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  aria-label="Close coupon panel"
                  className="p-1.5 hover:bg-[#FFF8F6] rounded-full transition-colors text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
