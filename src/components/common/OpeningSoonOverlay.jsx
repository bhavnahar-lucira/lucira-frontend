"use client";

/**
 * Frosted-glass overlay shown on top of a store image while the store is
 * "Opening Soon" (its real photo / storefront isn't live yet).
 *
 * Drop it as the LAST child inside a `position: relative` (+ overflow-hidden)
 * image container. It blurs the image behind it and shows a centered label.
 *
 * Usage:
 *   <div className="relative overflow-hidden ...">
 *     <Image ... />
 *     {store.openingSoon && <OpeningSoonOverlay />}
 *   </div>
 */
export default function OpeningSoonOverlay({ label = "Opening Soon", className = "" }) {
  return (
    <div
      aria-hidden="false"
      role="img"
      aria-label={label}
      className={`pointer-events-none absolute inset-0 z-[3] flex items-center justify-center backdrop-blur-md ${className}`}
    >
      {label ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-1.5 text-xs font-extrabold uppercase leading-none tracking-[0.7px] text-[#5A413F] shadow-sm backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}
