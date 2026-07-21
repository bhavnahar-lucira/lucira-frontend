"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StepHeader, Footer, PrimaryButton } from "./chrome";
import { RingProductGlyph } from "./illustrations";
import { suggestWideBandAdjustment } from "@/lib/ringSizer";

/**
 * Shopify stores ring sizes as zero-padded two-character strings ("05", "12"),
 * while the size chart holds plain integers. Without this the filter silently
 * matches nothing and every customer sees the full unfiltered list.
 */
const toShopifySize = (ind) => String(ind).padStart(2, "0");

/**
 * Carousel sizing.
 *
 *   CAROUSEL_SIZE_PX  diameter of the centre ring
 *   NEIGHBOUR_SCALE   side rings, as a fraction of that
 *   RING_GAP_PX       visible space between centre ring and neighbour
 *
 * Spacing is DERIVED from the gap rather than set directly, so the gap stays
 * what it says it is. Setting spacing directly meant every change to the ring
 * size silently moved the gap too - growing the centre pushes its edges toward
 * neighbours whose positions have not moved, closing the space.
 */
const CAROUSEL_SIZE_PX = 176;
const NEIGHBOUR_SCALE = 0.5;

/**
 * Visible gap between the centre ring and each neighbour, in px. This is the
 * dial to turn for carousel tightness - everything else is derived from it.
 *
 * Deliberately an absolute value rather than a fraction of the track width.
 * The shell is capped at max-w-[480px], so a ratio produced a gap that changed
 * with the container: ~22px on a 375px phone but ~65px once the shell hit its
 * 480px ceiling. The spacing between two rings is a composition decision, not
 * something that should drift with screen size.
 */
const RING_GAP_PX = 22;

/* Centre-to-centre distance: half the centre ring + half a neighbour + the gap. */
const RING_SPACING_PX =
  CAROUSEL_SIZE_PX / 2 + (CAROUSEL_SIZE_PX * NEIGHBOUR_SCALE) / 2 + RING_GAP_PX;

/**
 * Keep only rings actually made in the customer's size.
 *
 * Falls back to the unfiltered list rather than showing an empty carousel -
 * a customer who has just been told their size should never hit a dead end,
 * and the sizes shown on each PDP will still be correct.
 */
function productsForSize(products, size) {
  if (!products?.length || !size) return products ?? [];
  const wanted = toShopifySize(size.ind);
  const matching = products.filter((p) => p.sizes?.includes(wanted));
  return matching.length ? matching : products;
}

/**
 * Centre-focus carousel with the neighbours peeking in at both edges, matching
 * the result screen mockup.
 *
 * NOTE: the motion here is a best guess. The reference screen recording could
 * not be opened in this environment (no ffmpeg / video decoding available), so
 * timing, easing and whether it auto-advances at all still need confirming
 * against that video.
 */
function ProductCarousel({ products }) {
  const [active, setActive] = useState(Math.floor(products.length / 2));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % products.length), 2600);
    return () => clearInterval(id);
  }, [paused, products.length]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: `${CAROUSEL_SIZE_PX + 40}px` }}
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

        const inner = (
          <span
            className="relative flex items-center justify-center overflow-hidden rounded-full bg-white/80 shadow-[0_2px_16px_rgba(63,46,44,0.08)]"
            style={{ height: `${CAROUSEL_SIZE_PX}px`, width: `${CAROUSEL_SIZE_PX}px` }}
          >
            {product.image ? (
              <Image
                src={product.image}
                alt={product.alt || product.title}
                width={CAROUSEL_SIZE_PX}
                height={CAROUSEL_SIZE_PX}
                sizes={`${CAROUSEL_SIZE_PX}px`}
                // Only the centre item is worth prioritising; the peeking
                // neighbours can load lazily.
                priority={isActive}
                className="h-full w-full object-cover"
              />
            ) : (
              <RingProductGlyph className="h-1/2 w-1/2" />
            )}
          </span>
        );

        return (
          <div
            key={product.id}
            className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
            style={{
              transform: `translate(-50%, -50%) translateX(${offset * RING_SPACING_PX}px) scale(${
                isActive ? 1 : NEIGHBOUR_SCALE
              })`,
              opacity: distance > 1.5 ? 0 : isActive ? 1 : 0.75,
              zIndex: 10 - distance,
              pointerEvents: distance > 1.5 ? "none" : "auto",
            }}
          >
            {isActive && product.handle ? (
              <Link
                prefetch={false}
                href={`/products/${product.handle}`}
                aria-label={product.title}
                className="block"
              >
                {inner}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setActive(i);
                }}
                aria-label={product.title}
                className="block"
              >
                {inner}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ResultStep({ result, products = [], onBack, onClose, onApply }) {
  const size = result?.size;
  const wideBand = suggestWideBandAdjustment(size);
  const recommended = useMemo(() => productsForSize(products, size), [products, size]);

  return (
    <>
      <StepHeader onBack={onBack} onClose={onClose} />

      {/* Centred in the leftover space, same pattern as Step 03: the min-h-full
          inner wrapper does the centring rather than justify-center on the
          scroller, which would push overflow above the scroll origin and make
          the heading unreachable on a short screen. */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="flex min-h-full flex-col justify-center py-4">
        <h2 className="text-center font-abhaya text-[28px] leading-tight font-semibold text-[#3F2E2C]">
          Your size is {size?.indLabel ?? "—"}
        </h2>
        <p className="mt-1 text-center font-figtree text-[12px] text-[#8A7670]">
          Find diamond jewelry pieces that match your style.
        </p>

        {recommended.length ? (
          <div className="-mx-6 mt-4">
            <ProductCarousel products={recommended} />
          </div>
        ) : null}

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
