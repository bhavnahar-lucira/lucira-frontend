"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// App-wide scroll positioning for client-side navigation.
//
// WHY: the App Router leaves `history.scrollRestoration` at the browser default
// ("auto") and only nudges scroll via `htmlElement.scrollTop = 0` +
// `domNode.focus()` on navigation (see next/dist/client/components/
// layout-router.js). On iOS Safari that is not enough for a forward push into a
// page that keeps streaming in lazy content for a second or two after the route
// commits (the PDP grows ~10k→16k px post-nav): Safari re-applies its own
// remembered offset partway through the growth, so the page opens mid-scroll.
// Chrome / Android honour the one-shot reset and don't do this.
//
// This component takes scroll fully into our hands:
//   • forces `scrollRestoration = "manual"` so the browser never fights us
//   • forward navigation  → pin the new page to the top, re-asserting for ~1.6s
//     so it survives iOS's post-commit layout growth
//   • Back / Forward      → restore the offset the shopper left that entry at
//     (keyed by URL; collection grids repaint synchronously from their own
//     module cache, so the page is tall enough to restore into)
//   • never fights a real scroll — the first pointer / wheel / key input aborts
//   • reload / bfcache restores are left to the browser (module cache is gone
//     on a full reload anyway, matching ORDERED_VIEW_CACHE's lifetime)
//
// Only reacts to `pathname` changes. Filter / sort / pagination on the
// collection pages keep the same pathname and already manage their own scroll.
// ─────────────────────────────────────────────────────────────────────────────

const scrollPositions = new Map();
const MAX_ENTRIES = 40;

const keyForCurrentUrl = () =>
  window.location.pathname + window.location.search;

function rememberPosition(key, y) {
  scrollPositions.delete(key); // re-insert so iteration order is LRU-ish
  scrollPositions.set(key, y);
  while (scrollPositions.size > MAX_ENTRIES) {
    scrollPositions.delete(scrollPositions.keys().next().value);
  }
}

export default function ScrollRestoration() {
  const pathname = usePathname();
  const isPopNavRef = useRef(false);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const previous = window.history.scrollRestoration;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Back / Forward fire popstate; a Link click does not. Clear the flag on a
    // short delay so a popstate that doesn't change the pathname (hash- or
    // query-only Back) can't leak onto the next forward navigation.
    let popResetTimer;
    const onPopState = () => {
      isPopNavRef.current = true;
      clearTimeout(popResetTimer);
      popResetTimer = setTimeout(() => {
        isPopNavRef.current = false;
      }, 120);
    };
    window.addEventListener("popstate", onPopState);

    // Continuously record where the shopper is so a later Back can return here.
    // Throttled and synchronous (no rAF) so it still fires under load / when the
    // tab loses focus mid-scroll. Users pause before tapping, so the last frame
    // recorded is their position when they leave.
    let lastRecordedAt = 0;
    const recordNow = () => {
      lastRecordedAt = Date.now();
      rememberPosition(keyForCurrentUrl(), window.scrollY);
    };
    const onScroll = () => {
      if (Date.now() - lastRecordedAt >= 100) recordNow();
    };
    const onPageHide = () => recordNow();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") recordNow();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(popResetTimer);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = previous || "auto";
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isPopNav = isPopNavRef.current;
    isPopNavRef.current = false;

    const isFirstRun = isFirstRunRef.current;
    isFirstRunRef.current = false;

    // On the initial mount, only intervene for a genuine fresh navigation —
    // leave reload and bfcache scroll restoration to the browser.
    if (isFirstRun) {
      const navType = window.performance?.getEntriesByType?.("navigation")?.[0]
        ?.type;
      if (navType === "reload" || navType === "back_forward") return;
    }

    // A hash link resolves its own scroll target — don't override it.
    if (window.location.hash) return;

    const targetY = isPopNav
      ? scrollPositions.get(keyForCurrentUrl()) ?? 0
      : 0;

    let cancelled = false;
    let raf = 0;
    const timers = [];
    const deadline = performance.now() + 1600;

    // Don't try to restore past the bottom while the page is still growing.
    const reachable = (y) =>
      y <= 0 ||
      document.documentElement.scrollHeight - window.innerHeight >= y - 1;

    const settle = () => {
      if (cancelled) return;
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", settle);
      window.removeEventListener("wheel", settle);
      window.removeEventListener("keydown", settle);
    };

    const assert = () => {
      if (cancelled) return;
      if (reachable(targetY) && Math.abs(window.scrollY - targetY) > 1) {
        window.scrollTo(0, targetY);
      }
    };

    const loop = () => {
      if (cancelled) return;
      assert();
      if (performance.now() < deadline) {
        raf = requestAnimationFrame(loop);
      } else {
        settle();
      }
    };

    // The moment the shopper actually interacts, get out of the way.
    window.addEventListener("pointerdown", settle, { passive: true });
    window.addEventListener("wheel", settle, { passive: true });
    window.addEventListener("keydown", settle);

    window.scrollTo(0, targetY);
    raf = requestAnimationFrame(loop);
    // Timeout backstops in case rAF is paused (tab not focused during the
    // transition) or the page keeps growing past the first animation frames.
    [50, 150, 350, 700, 1200].forEach((ms) =>
      timers.push(setTimeout(assert, ms))
    );

    return settle;
  }, [pathname]);

  return null;
}
