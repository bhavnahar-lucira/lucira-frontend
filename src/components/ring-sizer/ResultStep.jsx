"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StepHeader, Footer, PrimaryButton } from "./chrome";
import { RingProductGlyph } from "./illustrations";
import { suggestWideBandAdjustment } from "@/lib/ringSizer";

/**
 * Placeholder product set. Replace with real recommendations - most likely a
 * Shopify collection filtered to variants available in the resolved size, so
 * the carousel only ever shows rings the customer can actually buy.
 */
const PLACEHOLDER_PRODUCTS = [
  { id: 1, name: "Solitaire Band" },
  { id: 2, name: "Eternity Ring" },
  { id: 3, name: "Halo Cluster" },
  { id: 4, name: "Classic Trio" },
  { id: 5, name: "Pavé Band" },
];

/**
 * Centre-focus carousel with the neighbours peeking in at both edges, matching
 * the result screen mockup.
 *
 * NOTE: the motion here is a best guess. The reference screen recording could
 * not be opened in this environment (no ffmpeg / video decoding available), so
 * timing, easing and whether it auto-advances at all still need confirming
 * against that video.
 */
function ProductCarousel({ products = PLACEHOLDER_PRODUCTS }) {
  const [active, setActive] = useState(Math.floor(products.length / 2));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % products.length), 2600);
    return () => clearInterval(id);
  }, [paused, products.length]);

  return (
    <div
      className="relative h-[190px] w-full overflow-hidden"
      onPointerDown={() => setPaused(true)}
      role="group"
      aria-label="Recommended rings"
    >
      {products.map((product, i) => {
        // Shortest path around the loop, so wrapping does not fling items
        // across the whole track.
        let offset = i - active;
        const half = products.length / 2;
        if (offset > half) offset -= products.length;
        if (offset < -half) offset += products.length;

        const isActive = offset === 0;
        const distance = Math.abs(offset);

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => {
              setPaused(true);
              setActive(i);
            }}
            aria-label={product.name}
            aria-current={isActive}
            className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
            style={{
              transform: `translate(-50%, -50%) translateX(${offset * 118}px) scale(${
                isActive ? 1 : 0.58
              })`,
              opacity: distance > 1.5 ? 0 : isActive ? 1 : 0.75,
              zIndex: 10 - distance,
              pointerEvents: distance > 1.5 ? "none" : "auto",
            }}
          >
            <span className="flex h-[150px] w-[150px] flex-col items-center justify-center rounded-full bg-white/80 shadow-[0_2px_16px_rgba(63,46,44,0.08)]">
              <RingProductGlyph className="h-[86px] w-[86px]" />
              {isActive ? (
                <span className="mt-1 px-3 text-center font-figtree text-[10px] tracking-wide text-[#8A7670] uppercase">
                  {product.name}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ResultStep({ result, onBack, onClose, onApply }) {
  const size = result?.size;
  const wideBand = suggestWideBandAdjustment(size);

  return (
    <>
      <StepHeader onBack={onBack} onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-6">
        <h2 className="mt-2 text-center font-abhaya text-[28px] leading-tight font-semibold text-[#3F2E2C]">
          Your size is {size?.indLabel ?? "—"}
        </h2>
        <p className="mt-1 text-center font-figtree text-[12px] text-[#8A7670]">
          Find diamond jewelry pieces that match your style.
        </p>

        <div className="-mx-6 mt-4">
          <ProductCarousel />
        </div>

        {/* Honest about precision: the reading is only ever good to about half
            a size, and saying so up front costs far less than a return. */}
        {result?.confidence === "low" && result?.alternativeSize ? (
          <p className="mx-auto mt-4 max-w-[280px] text-center font-figtree text-[12px] text-[#8A7670]">
            Your measurement sits between size {result.alternativeSize.indLabel} and{" "}
            {size?.indLabel}. We&apos;ve suggested the larger of the two.
          </p>
        ) : null}

        <p className="mx-auto mt-5 max-w-[290px] text-center font-figtree text-[13px] leading-relaxed text-[#3F2E2C] italic">
          &ldquo;Your size pairs beautifully with statement rings and wider bands.&rdquo;
        </p>

        {wideBand ? (
          <p className="mx-auto mt-2 max-w-[290px] text-center font-figtree text-[11px] text-[#8A7670]">
            For a wide band, consider size {wideBand.indLabel}.
          </p>
        ) : null}

        <p className="mt-6 text-center font-figtree text-[12px] text-[#8A7670]">
          You&apos;re one step closer to finding your Lucira ring.
        </p>
      </div>

      <Footer>
        <div className="space-y-3">
          {onApply && size ? (
            <PrimaryButton onClick={() => onApply(size)}>
              Use size {size.indLabel}
            </PrimaryButton>
          ) : (
            <Link prefetch={false} href="/collections/rings" className="block">
              <PrimaryButton>Browse all rings</PrimaryButton>
            </Link>
          )}

          <Link
            prefetch={false}
            href="https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20an%20appointment"
            target="_blank"
            className="block"
          >
            <PrimaryButton>Visit our store</PrimaryButton>
          </Link>
        </div>
      </Footer>
    </>
  );
}
