"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, ShoppingCart, Heart } from "lucide-react";
import { formatSocialCount, buildSocialMetrics } from "@/lib/socialProof";
import { ORDERS_ICON_SVG, CART_ICON_SVG, WISHLIST_ICON_SVG } from "./socialProofIcons";

// Product-page labels (from design): "20+ Ordered", "200+ In Cart", "2K+ Wishlisted".
const PDP_LABELS = { orders: "Ordered", cart: "In Cart", wishlist: "Wishlisted" };

// Exact badge colours (from design).
const PDP_STYLES = {
  orders: { backgroundColor: "#FED5A9", color: "#E54C2C" },
  cart: { backgroundColor: "#E7D3F8", color: "#7926BC" },
  wishlist: { backgroundColor: "#FF4A591F", color: "#FF4A59" }, // 12% tint bg, solid text
};

const PDP_ICON_SVG = { orders: ORDERS_ICON_SVG, cart: CART_ICON_SVG, wishlist: WISHLIST_ICON_SVG };

// Fallback icon (matches the checkout cart) when a custom SVG hasn't been pasted in yet.
function FallbackIcon({ type }) {
  const cls = "h-3 w-auto lg:h-[14px] max-[374px]:h-2.5 shrink-0";
  if (type === "wishlist") return <Heart className={cls} fill="currentColor" />;
  if (type === "orders") return <ShoppingBag className={cls} />;
  return <ShoppingCart className={cls} />;
}

function BadgeIcon({ type }) {
  const svg = PDP_ICON_SVG[type];
  if (svg && svg.trim()) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 [&_svg]:h-3 [&_svg]:w-auto lg:[&_svg]:h-[14px] max-[374px]:[&_svg]:h-2.5"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return <FallbackIcon type={type} />;
}

// FOMO band that rotates one metric at a time (mirrors the checkout cart's SocialProofBand).
export default function ProductSocialProofBand({ socialProof, className = "" }) {
  const metrics = useMemo(() => buildSocialMetrics(socialProof, PDP_LABELS), [socialProof]);
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
      style={PDP_STYLES[m.key]}
    >
      <span
        key={m.key}
        className="inline-flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-500"
      >
        <BadgeIcon type={m.key} />
        <span className="font-figtree font-semibold whitespace-nowrap tracking-tight text-[10px] lg:text-sm max-[374px]:text-[9px]">
          {formatSocialCount(m.value)} {m.label}
        </span>
      </span>
    </span>
  );
}
