"use client";

import { ChevronLeft, X } from "lucide-react";

/**
 * Shared shell pieces for the ring sizer: page background, step header,
 * bullet list, sticky CTA footer, and the temporary image placeholder.
 *
 * Palette is inlined rather than tokenised because the sizer uses a blush
 * background that does not exist in globals.css yet. If these ship, promote
 * them to @theme vars.
 */
export const SIZER_BG = "#FAEFE9";
export const SIZER_INK = "#3F2E2C";

export function StepHeader({ step, onBack, onClose }) {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-center px-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
        >
          <ChevronLeft size={22} strokeWidth={1.5} color={SIZER_INK} />
        </button>
      ) : null}

      {step ? (
        <h1 className="font-figtree text-[13px] font-medium tracking-[0.18em] text-[#3F2E2C] uppercase">
          {step}
        </h1>
      ) : null}

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full active:bg-black/5"
        >
          <X size={22} strokeWidth={1.5} color={SIZER_INK} />
        </button>
      ) : null}
    </header>
  );
}

export function Bullets({ items, className = "" }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((text) => (
        <li key={text} className="flex gap-2 font-figtree text-[13px] leading-relaxed text-[#3F2E2C]">
          <span aria-hidden className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#3F2E2C]" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-[6px] bg-[#5A413F] px-6 py-4 font-figtree text-[13px] font-semibold tracking-[0.14em] text-white uppercase transition active:bg-[#4A3533] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function Footer({ children }) {
  return (
    <div
      className="shrink-0 px-5 pt-3"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  );
}

/**
 * Stand-in for artwork not yet supplied (Figma is not shared with this
 * workspace). Deliberately looks unfinished so it cannot be mistaken for
 * final design in review. Swap for <Image> + a Shopify CDN URL.
 */
export function ImagePlaceholder({ label, className = "", ratio = "4 / 3" }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-[4px] border border-dashed border-[#C9AFA6] bg-[#EFE0D9] ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <span className="px-4 text-center font-figtree text-[11px] tracking-wide text-[#9A7F76] uppercase">
        {label}
      </span>
    </div>
  );
}

/** The live "17.9 mm | Ring size: 16" readout under the measuring area. */
export function Readout({ primary, sizeLabel }) {
  return (
    <p className="text-center font-figtree text-[15px] text-[#3F2E2C]">
      <span className="tabular-nums">{primary}</span>
      {sizeLabel ? (
        <>
          <span className="mx-2 text-[#C9AFA6]">|</span>
          <span>Ring size: {sizeLabel}</span>
        </>
      ) : null}
    </p>
  );
}
