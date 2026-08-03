"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { pushPromoClick } from "@/lib/gtm";
import { cn } from "@/lib/utils";

// Visibility thresholds mirror the mobile search bar hysteresis in
// MobileHeader (expand past 64, collapse below 40): the sticky header on PDP
// uses top:-40px, so past these depths the announcement bar has scrolled away
// and the subheader slides in right under the pinned logo/search row.
const SHOW_Y = 64;
const HIDE_Y = 40;

// Extra breathing room between the subheader and the section scrolled to
const SCROLL_PADDING = 12;

// How long the scroll-spy stays quiet after a tab click, so the smooth scroll
// passing over intermediate sections doesn't flicker the active state.
const SPY_SUPPRESS_MS = 900;

const TABS = [
  { id: "customize", label: "Customize" },
  { id: "delivery", label: "Delivery" },
  { id: "details", label: "Details" },
  { id: "reviews", label: "Reviews" },
];

export default function PdpSubHeader({ sectionRefs }) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("customize");
  const [topOffset, setTopOffset] = useState(0);
  const barRef = useRef(null);
  const spySuppressedUntil = useRef(0);
  const rafRef = useRef(null);

  const getBarHeight = () => barRef.current?.offsetHeight || 44;

  const sync = useCallback(() => {
    rafRef.current = null;
    const y = window.scrollY;
    setVisible((v) => (v ? y > HIDE_Y : y > SHOW_Y));

    // The site header is sticky with top:-40px on PDP, so its rect bottom is
    // exactly where the subheader must sit once the TopBar has scrolled away.
    const header = document.querySelector("header");
    if (header) {
      setTopOffset(Math.max(0, Math.round(header.getBoundingClientRect().bottom)));
    }

    // Scroll-spy: the active tab is the last section whose top has crossed
    // under the subheader.
    if (Date.now() < spySuppressedUntil.current) return;
    const spyLine = (header ? header.getBoundingClientRect().bottom : 0) + getBarHeight() + SCROLL_PADDING + 8;
    let current = TABS[0].id;
    for (const tab of TABS) {
      const el = sectionRefs[tab.id]?.current;
      if (el && el.getBoundingClientRect().top <= spyLine) {
        current = tab.id;
      }
    }
    setActiveTab(current);
  }, [sectionRefs]);

  useEffect(() => {
    const onScroll = () => {
      // rAF doesn't fire in hidden/background tabs, which would leave the bar
      // stale after a programmatic scroll (e.g. restored scroll position).
      if (document.hidden) {
        sync();
        return;
      }
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(sync);
      }
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [sync]);

  const handleTabClick = (tab) => {
    pushPromoClick({
      creative_name: "pdp subheader",
      promo_id: tab.label,
      location_id: "pdp",
    });

    const el = sectionRefs[tab.id]?.current;
    if (!el) return;

    setActiveTab(tab.id);
    spySuppressedUntil.current = Date.now() + SPY_SUPPRESS_MS;

    const header = document.querySelector("header");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const offset = headerBottom + getBarHeight() + SCROLL_PADDING;
    const target = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  };

  return (
    <div
      ref={barRef}
      style={{ top: `${topOffset}px` }}
      className={cn(
        "lg:hidden fixed left-0 right-0 z-90 bg-white border-b border-gray-100",
        "transition-[opacity,transform] duration-300 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}
    >
      <div className="grid grid-cols-4 h-12 px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 font-figtree leading-none tracking-normal transition-all duration-200 cursor-pointer",
              activeTab === tab.id
                ? "text-[15px] font-semibold text-[#5A4140]"
                : "text-[13px] font-normal text-neutral-500"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "absolute bottom-0 h-[2.5px] w-7 rounded-full bg-[#5A4140] transition-all duration-200",
                activeTab === tab.id ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
