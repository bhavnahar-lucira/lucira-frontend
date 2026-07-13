"use client";

import { ShoppingBag, ShoppingCart, Heart } from "lucide-react";
import { ORDERS_ICON_SVG, CART_ICON_SVG, WISHLIST_ICON_SVG } from "@/lib/socialProofIcons";

const ICON_SVG = { orders: ORDERS_ICON_SVG, cart: CART_ICON_SVG, wishlist: WISHLIST_ICON_SVG };

// Renders the custom social-proof badge icon for a metric type, shared by the
// product page and the checkout cart. Falls back to a matching lucide icon if the
// custom SVG hasn't been provided. `className` controls sizing (e.g. "[&_svg]:h-3").
export default function SocialBadgeIcon({ type, className = "" }) {
  const svg = ICON_SVG[type];
  if (svg && svg.trim()) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 ${className}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  const fallbackCls = "h-3 w-auto shrink-0";
  if (type === "wishlist") return <Heart className={fallbackCls} fill="currentColor" />;
  if (type === "orders") return <ShoppingBag className={fallbackCls} />;
  return <ShoppingCart className={fallbackCls} />;
}
