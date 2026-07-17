"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatSocialCount, buildSocialMetrics, SOCIAL_BADGE_STYLES } from "@/lib/socialProof";
import SocialBadgeIcon from "@/components/common/SocialBadgeIcon";

const ROTATE_MS = 2600;

// Per-surface sizing. Everything else (rotation, colours, motion) is shared so the
// product page and the checkout cart behave identically.
const VARIANTS = {
  product: {
    pill: "px-2 py-0.5 lg:px-2.5 lg:py-1 max-[374px]:px-1.5",
    spacer: "basis-[4px] max-w-[8px]",
    icon: "h-3 w-auto lg:h-[14px] max-[374px]:h-2.5",
    text: "font-figtree font-semibold tracking-tight text-[10px] lg:text-sm max-[374px]:text-[9px]",
  },
  cart: {
    pill: "px-3 py-1.5 backdrop-blur-sm max-w-[calc(100%-16px)]",
    spacer: "basis-[6px] max-w-[10px]",
    icon: "h-[15px] w-auto",
    text: "font-semibold text-[13px]",
  },
  // Sits on a ~128px thumbnail. Since the pill is always as wide as the WIDEST metric,
  // this variant is scaled down so even that one clears the inset instead of running
  // edge-to-edge across the image.
  cartCompact: {
    pill: "px-2 py-1 backdrop-blur-sm max-w-[calc(100%-16px)]",
    spacer: "basis-[4px] max-w-[8px]",
    icon: "h-3 w-auto",
    text: "font-semibold text-[10px]",
  },
};

// FOMO band that rotates one metric at a time (Ordered -> In Cart -> Wishlisted).
//
// All metrics render stacked in a single grid cell rather than swapping one node in
// and out. That does two things: the pill is permanently as wide as the WIDEST metric
// (so it never resizes or re-centres mid-rotation), and both the outgoing and incoming
// metric are present at once, which is what lets them cross-fade instead of cutting.
export default function SocialProofBand({ socialProof, variant = "product", className = "" }) {
  const metrics = useMemo(() => buildSocialMetrics(socialProof), [socialProof]);
  const [idx, setIdx] = useState(0);
  // The metric we just moved away from — it exits upward while the next one rises in.
  const prevRef = useRef(-1);

  useEffect(() => {
    prevRef.current = -1;
    setIdx(0);
  }, [metrics.length]);

  useEffect(() => {
    if (metrics.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => {
        prevRef.current = i;
        return (i + 1) % metrics.length;
      });
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [metrics.length]);

  if (metrics.length === 0) return null;

  const active = idx % metrics.length;
  const v = VARIANTS[variant] ?? VARIANTS.product;

  return (
    <span
      className={`social-badge-pill inline-flex w-fit shrink-0 items-center overflow-hidden rounded-card ${v.pill} ${className}`}
      style={SOCIAL_BADGE_STYLES[metrics[active].key]}
    >
      <span className="grid items-center">
        {metrics.map((m, i) => {
          const state = i === active ? "active" : i === prevRef.current ? "exit" : "idle";
          return (
            <span
              key={m.key}
              data-state={state}
              aria-hidden={state === "active" ? undefined : "true"}
              className="social-badge-item col-start-1 row-start-1 flex min-w-0 items-center justify-center"
            >
              <SocialBadgeIcon type={m.key} animate={state === "active"} className={v.icon} />
              {/* Absorbs the leftover width a shorter metric leaves inside the fixed-width
                  pill, up to a cap, so "20+ Ordered" doesn't float in empty space. The
                  widest metric has no leftover, so it keeps the base gap. */}
              <span aria-hidden="true" className={`shrink-0 grow ${v.spacer}`} />
              <span className={`truncate ${v.text}`}>
                {formatSocialCount(m.value)} {m.label}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
