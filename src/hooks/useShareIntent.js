"use client";

/**
 * useShareIntent
 *
 * Detects "I want to save or send this product" intent on mobile PDPs.
 *
 * WHY THIS EXISTS INSTEAD OF SCREENSHOT DETECTION
 * There is no web API that tells a page a screenshot was taken. iOS Safari and
 * Android Chrome both fire nothing at all on the OS screenshot gesture - no
 * visibilitychange, no blur, no pagehide. It is deliberately invisible to web
 * content. So instead of the screenshot itself we listen for the two gestures
 * that carry the same intent and ARE observable:
 *
 *   1. copy  - the user selected text (name / SKU / price) to paste somewhere.
 *   2. long-press on a product image - the native "Save Image" gesture.
 *
 * Both are then classified so the dataLayer records WHICH detail the user
 * grabbed, because that is the real intent signal: someone copying the SKU is
 * about to ask a store about it, someone copying the price is comparing.
 */

import { useEffect, useRef } from "react";

// Long-press threshold. Below ~450ms a carousel tap registers as a press;
// above ~700ms the native callout has usually already won.
const LONG_PRESS_MS = 550;

// A swipe on the gallery must not read as a press.
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

// De-dupes a single physical gesture (contextmenu + the touch timer can both
// resolve from one press). This is not a frequency cap - the sheet still opens
// on every distinct trigger.
const RETRIGGER_COOLDOWN_MS = 6000;

// A long-press on a product image opens our sheet, so the native iOS callout
// ("Save Image / Copy / Share") is suppressed to avoid two menus at once.
// Flip to false to let the native menu coexist and rely on `copy` alone.
const SUPPRESS_NATIVE_IMAGE_MENU = true;

const MIN_COPIED_CHARS = 3;

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[₹,]/g, "")
    .replace(/\brs\.?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Works out which product detail the user copied. Ordered most-specific first:
 * a SKU is unambiguous, a price is near-unambiguous, a title match may be
 * partial (users rarely select the whole name cleanly).
 */
function classifyCopiedText(rawText, matchers = {}) {
  const copied = normalize(rawText);
  if (copied.length < MIN_COPIED_CHARS) return null;

  const sku = normalize(matchers.sku);
  if (sku && (copied === sku || copied.includes(sku))) return "sku";

  const priceCandidates = (matchers.prices || [])
    .map(normalize)
    .filter((p) => p.length >= 3);
  if (priceCandidates.some((p) => copied === p || copied.includes(p))) return "price";

  const title = normalize(matchers.title);
  if (title && copied.length >= 6 && (title.includes(copied) || copied.includes(title))) {
    return "product_name";
  }

  return "other_text";
}

export function useShareIntent({
  enabled = false,
  matchers,
  onIntent,
  zoneSelector = "[data-pdp-gallery-mobile]",
} = {}) {
  // Everything the listeners need lives in refs so the effect can attach once
  // and never re-bind on a price or variant change mid-interaction.
  const onIntentRef = useRef(onIntent);
  const matchersRef = useRef(matchers);
  const lastFiredAtRef = useRef(0);

  // Synced after commit, not during render: the React Compiler is enabled on
  // this project and render-phase ref writes are not safe under it.
  useEffect(() => {
    onIntentRef.current = onIntent;
    matchersRef.current = matchers;
  });

  useEffect(() => {
    if (!enabled) return;

    // Read at event time rather than captured, so a variant switch that rewrites
    // the ?variant= query is always reflected in the shared link.
    const currentUrl = () => window.location.href;

    const fire = (payload) => {
      const now = Date.now();
      if (now - lastFiredAtRef.current < RETRIGGER_COOLDOWN_MS) return false;
      lastFiredAtRef.current = now;
      onIntentRef.current?.({ ...payload, url: currentUrl() });
      return true;
    };

    /* ---------------------------------------------------------------- copy */

    const handleCopy = (event) => {
      // Copying out of the pincode box or a search field is not share intent.
      if (event.target?.closest?.("input, textarea, [contenteditable='true']")) return;

      const selected = window.getSelection?.()?.toString() ?? "";
      const signal = classifyCopiedText(selected, matchersRef.current);
      if (!signal) return;

      // A bare SKU or price pasted into WhatsApp is useless to the recipient,
      // so when the copy is a confirmed product detail we append the product
      // link. Arbitrary text copies are left untouched - silently rewriting
      // those would break ordinary copy/paste.
      const shouldEnrich = signal !== "other_text";
      if (shouldEnrich && event.clipboardData) {
        const { title } = matchersRef.current || {};
        const trimmed = selected.trim();
        // Don't restate the title when they already copied it.
        const needsTitle = title && !normalize(trimmed).includes(normalize(title));
        const enriched = [trimmed, "", needsTitle ? title : null, currentUrl()]
          .filter((line) => line !== null && line !== undefined)
          .join("\n");
        try {
          event.clipboardData.setData("text/plain", enriched);
          event.preventDefault();
        } catch {
          // Clipboard is read-only in some embedded webviews; the copy still
          // completes natively, we just skip the enrichment.
        }
      }

      fire({
        trigger: "copy_text",
        signal,
        copiedText: selected.trim().slice(0, 120),
        linkAppended: shouldEnrich,
      });
    };

    /* ---------------------------------------------------- image long-press */

    let pressTimer = null;
    let pressOrigin = null;

    const clearPress = () => {
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = null;
      pressOrigin = null;
    };

    const inZone = (target) => !!target?.closest?.(zoneSelector);

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1) return;
      const zone = event.target?.closest?.(zoneSelector);
      if (!zone) return;

      // iOS ignores preventDefault for the long-press callout; only the CSS
      // property -webkit-touch-callout suppresses it, and Chromium refuses to
      // set that via the DOM. So we mark the zone and let globals.css carry the
      // declaration. Marked on first touch rather than on mount because the
      // gallery renders a skeleton until its media resolves, so the zone may
      // not exist yet when the effect runs.
      if (SUPPRESS_NATIVE_IMAGE_MENU) zone.setAttribute("data-share-intent-armed", "");

      const touch = event.touches[0];
      pressOrigin = { x: touch.clientX, y: touch.clientY };
      pressTimer = setTimeout(() => {
        fire({ trigger: "image_long_press", signal: "product_image" });
        clearPress();
      }, LONG_PRESS_MS);
    };

    const handleTouchMove = (event) => {
      if (!pressOrigin) return;
      const touch = event.touches[0];
      const drift = Math.hypot(touch.clientX - pressOrigin.x, touch.clientY - pressOrigin.y);
      if (drift > LONG_PRESS_MOVE_TOLERANCE_PX) clearPress();
    };

    // Android resolves a long-press as contextmenu on a timing of its own, so
    // it is a trigger in its own right rather than only a suppression target.
    const handleContextMenu = (event) => {
      if (!inZone(event.target)) return;
      if (SUPPRESS_NATIVE_IMAGE_MENU) event.preventDefault();
      clearPress();
      fire({ trigger: "image_long_press", signal: "product_image" });
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", clearPress, { passive: true });
    document.addEventListener("touchcancel", clearPress, { passive: true });
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      clearPress();
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", clearPress);
      document.removeEventListener("touchcancel", clearPress);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.querySelectorAll(zoneSelector).forEach((zone) => {
        zone.removeAttribute("data-share-intent-armed");
      });
    };
  }, [enabled, zoneSelector]);
}

export default useShareIntent;
