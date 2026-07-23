"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

const RING_SIZER_PATH = "/ring-sizer";

/**
 * Thumbnail for the size-guide entry point: a phone lying flat with a ring
 * resting on its screen - the tool's whole premise in one glyph.
 *
 * Inline SVG rather than a CDN image so the block cannot render half-empty
 * while a photo loads, and so it inherits the drawer's palette.
 */
function RingSizerThumb({ className = "" }) {
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" role="presentation">
      <rect width="80" height="80" rx="8" fill="#FAEFE9" />
      <rect x="22" y="12" width="36" height="56" rx="6" fill="#fff" stroke="#3F2E2C" strokeWidth="1.6" />
      <rect x="26" y="16" width="28" height="48" rx="3" fill="#F3E6E0" />
      <g opacity="0.55">
        {[22, 30, 38, 46, 54].map((y) => (
          <line key={y} x1="26" y1={y} x2="54" y2={y} stroke="#C9AFA6" strokeWidth="0.6" />
        ))}
        {[32, 40, 48].map((x) => (
          <line key={x} x1={x} y1="16" x2={x} y2="64" stroke="#C9AFA6" strokeWidth="0.6" />
        ))}
      </g>
      <circle cx="40" cy="40" r="12.5" stroke="#3F2E2C" strokeWidth="1.2" fill="none" />
      <circle cx="40" cy="40" r="15.5" stroke="#C8A15A" strokeWidth="4" fill="none" />
      <circle cx="40" cy="24.5" r="2.6" fill="#fff" stroke="#A8823F" strokeWidth="1" />
    </svg>
  );
}

/**
 * "Measure with your phone" entry point for the size-guide drawer.
 *
 * Mobile goes straight to the tool. Desktop cannot: the sizer works by
 * matching a real credit card against the screen, and a desktop monitor has
 * no fixed relationship between CSS pixels and millimetres - the reading
 * would be meaningless. So desktop shows a QR that hands the flow to a phone.
 */
export function RingSizerPromo({ isMobile = false, onNavigate }) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [url, setUrl] = useState("");

  /**
   * Built from the live origin, not a hardcoded domain, so the QR resolves to
   * whatever host the shopper is actually on - production, staging, or a LAN
   * address during testing. Falls back to the configured base URL for the
   * first paint before hydration.
   */
  useEffect(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || "https://www.lucirajewelry.com";
    setUrl(`${origin}${RING_SIZER_PATH}`);
  }, []);

  const body = (
    <>
      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
        <RingSizerThumb className="w-full h-full" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-gray-900">Find Your Size With Your Phone</h4>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {isMobile
            ? "Measure in a minute using a ring you own or a strip of paper."
            : "Scan the QR with your phone to measure in under a minute."}
        </p>
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-900 mt-2 border-b border-gray-900 pb-0.5">
          {isMobile ? "MEASURE NOW" : "SCAN TO MEASURE"}
        </span>
      </div>
    </>
  );

  const shell = "bg-white rounded-sm mb-4 flex items-center gap-4 p-3 border border-gray-100 shadow-sm";

  if (isMobile) {
    return (
      <Link
        prefetch={false}
        href={RING_SIZER_PATH}
        onClick={onNavigate}
        className={shell}
      >
        {body}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsQrOpen(true)}
        className={`${shell} w-full text-left cursor-pointer hover:bg-gray-50 transition-colors`}
      >
        {body}
      </button>

      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogPortal>
          <DialogOverlay className="z-9999 bg-black/60 backdrop-blur-sm" />
          <DialogContent className="z-10000 sm:max-w-[420px] p-0 overflow-hidden border-none bg-white shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Lucira Ring Sizer</DialogTitle>
            </DialogHeader>

            <div className="px-8 py-10 text-center">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-900">
                Lucira Ring Sizer
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                To find your perfect ring size, scan the QR code below with your phone.
              </p>

              <div className="mt-6 inline-flex items-center justify-center rounded-lg bg-white p-4 border border-gray-100">
                {url ? (
                  <QRCodeSVG
                    value={url}
                    size={180}
                    level="M"
                    marginSize={0}
                    fgColor="#3F2E2C"
                    bgColor="#ffffff"
                  />
                ) : (
                  <div className="h-[180px] w-[180px] animate-pulse rounded bg-gray-100" />
                )}
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-gray-400">
                The sizer measures against your phone screen, so it needs to run on a
                phone to stay accurate.
              </p>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
