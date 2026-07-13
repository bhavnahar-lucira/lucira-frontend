"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSocialCount, buildSocialMetrics, SOCIAL_BADGE_STYLES, SOCIAL_DISPLAY_LABELS } from "@/lib/socialProof";
import SocialBadgeIcon from "@/components/common/SocialBadgeIcon";

// FOMO band that rotates one metric at a time. Icons, colours and labels are shared
// with the checkout cart via "@/lib/socialProof" + SocialBadgeIcon.
export default function ProductSocialProofBand({ socialProof, className = "" }) {
  const metrics = useMemo(() => buildSocialMetrics(socialProof, SOCIAL_DISPLAY_LABELS), [socialProof]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (metrics.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % metrics.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [metrics.length]);

  if (metrics.length === 0) return null;

  // Modulo keeps the index valid if the available-metric count changes (e.g. product switch).
  const m = metrics[idx % metrics.length];

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 lg:px-2.5 lg:py-1 max-[374px]:px-1.5 ${className}`}
      style={SOCIAL_BADGE_STYLES[m.key]}
    >
      <span
        key={m.key}
        className="inline-flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-500"
      >
        <SocialBadgeIcon type={m.key} className="[&_svg]:h-3 [&_svg]:w-auto lg:[&_svg]:h-[14px] max-[374px]:[&_svg]:h-2.5" />
        <span className="font-figtree font-semibold whitespace-nowrap tracking-tight text-[10px] lg:text-sm max-[374px]:text-[9px]">
          {formatSocialCount(m.value)} {m.label}
        </span>
      </span>
    </span>
  );
}
