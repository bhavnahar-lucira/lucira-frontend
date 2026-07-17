"use client";

import { useEffect } from "react";

// Badge artwork for the social-proof band, shared by the product page and the
// checkout cart. Hosted on the Shopify CDN; the colours are baked into each PNG
// to match its badge (see SOCIAL_BADGE_STYLES in "@/lib/socialProof").
const ICON_SRC = {
  orders:
    "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/orders.png?v=1784271964",
  cart: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/cart_6fdf02a3-06a1-4db8-ab57-61f5f70d1acf.png?v=1784271963",
  wishlist:
    "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/wishlist.png?v=1784271963",
};

// The band rotates metrics every 2.6s, so the 2nd and 3rd icons are requested
// long after first paint and would pop in late. Fetch all three once per page.
let warmed = false;
function warmIconCache() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  for (const src of Object.values(ICON_SRC)) {
    const img = new window.Image();
    img.src = src;
  }
}

// `className` controls sizing and is applied to the icon itself, e.g. "h-3 w-auto".
// `animate` plays this metric's entry gesture; the band keeps every metric mounted, so
// only the visible one should gesture. Re-adding the class on rotation replays it.
export default function SocialBadgeIcon({ type, className = "", animate = true }) {
  useEffect(warmIconCache, []);

  const src = ICON_SRC[type];
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      fetchPriority="low"
      className={`shrink-0 select-none social-badge-icon ${animate ? `social-badge-icon--${type}` : ""} ${className}`}
    />
  );
}
