"use client";

import { useMediaQueryState } from "@/hooks/useMediaQuery";

// Renders the `mobile` or `desktop` variant of a block according to the
// viewport, without the server ever having to guess it.
//
// The server (and React's hydration pass, which must produce the same tree)
// cannot know the screen width, so while it is unknown BOTH variants are
// emitted, each inside a wrapper that is `display: contents` (invisible to
// layout) at its own widths and `display: none` at the other's. CSS therefore
// shows exactly one variant from the first paint, with no switch on screen.
// Once hydrated the width is known and only the matching variant stays
// mounted, which is what every caller rendered before this helper existed.
//
// `maxMobilePx` is the last width (inclusive) treated as mobile. The CSS
// variants are listed literally per breakpoint, both so Tailwind can generate
// them and so the CSS line can never drift from the JavaScript media query.
const VARIANTS = {
  767: { query: "(max-width: 767px)", mobile: "contents md:hidden", desktop: "hidden md:contents" },
  768: { query: "(max-width: 768px)", mobile: "contents min-[769px]:hidden", desktop: "hidden min-[769px]:contents" },
  1023: { query: "(max-width: 1023px)", mobile: "contents lg:hidden", desktop: "hidden lg:contents" },
  1024: { query: "(max-width: 1024px)", mobile: "contents min-[1025px]:hidden", desktop: "hidden min-[1025px]:contents" },
};

export default function Responsive({ maxMobilePx = 1023, mobile = null, desktop = null }) {
  const variant = VARIANTS[maxMobilePx];
  if (!variant) {
    throw new Error(`Responsive: unsupported maxMobilePx ${maxMobilePx}; add it to VARIANTS`);
  }
  const isMobile = useMediaQueryState(variant.query);

  if (isMobile === null) {
    return (
      <>
        {mobile !== null && <div className={variant.mobile}>{mobile}</div>}
        {desktop !== null && <div className={variant.desktop}>{desktop}</div>}
      </>
    );
  }
  return isMobile ? mobile : desktop;
}
