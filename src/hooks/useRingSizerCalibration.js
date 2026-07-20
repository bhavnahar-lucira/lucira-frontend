"use client";

import { useCallback, useEffect, useState } from "react";
import { isPlausiblePxPerMm } from "@/lib/ringSizer";

const STORAGE_KEY = "lucira_ringsizer_cal_v1";

/**
 * Owns the device calibration: the pxPerMm ratio, its persistence, and the
 * checks that decide whether a stored ratio can still be trusted.
 *
 * Why any of this is needed: a CSS pixel has no fixed physical size. It varies
 * with device pixel ratio, screen density and - critically - the browser's
 * current zoom. A ratio captured at one zoom level is meaningless at another,
 * so we fingerprint the environment alongside the value and throw the value
 * away when the fingerprint moves.
 */

function readFingerprint() {
  if (typeof window === "undefined") return null;
  return {
    dpr: window.devicePixelRatio || 1,
    screenW: window.screen?.width ?? 0,
    screenH: window.screen?.height ?? 0,
  };
}

function sameDevice(a, b) {
  if (!a || !b) return false;
  // Screen dimensions can swap on rotation, so compare them unordered.
  const [aMin, aMax] = [Math.min(a.screenW, a.screenH), Math.max(a.screenW, a.screenH)];
  const [bMin, bMax] = [Math.min(b.screenW, b.screenH), Math.max(b.screenW, b.screenH)];
  return Math.abs(a.dpr - b.dpr) < 0.01 && aMin === bMin && aMax === bMax;
}

/**
 * Browser zoom detection.
 *
 * iOS Safari ignores `user-scalable=no`, so a pinch-zoom can silently
 * invalidate the calibration mid-flow and there is no way to prevent it. The
 * only reliable defence is to watch visualViewport.scale and ask the user to
 * reset. Android Chrome honours the viewport meta tag, but desktop browser
 * zoom still shows up here, so the same guard covers both platforms.
 */
function readZoom() {
  if (typeof window === "undefined" || !window.visualViewport) return 1;
  return window.visualViewport.scale ?? 1;
}

export function useRingSizerCalibration() {
  const [pxPerMm, setPxPerMm] = useState(null);
  const [isRestored, setIsRestored] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Restore a previous calibration if the device fingerprint still matches.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        if (isPlausiblePxPerMm(stored?.pxPerMm) && sameDevice(stored, readFingerprint())) {
          setPxPerMm(stored.pxPerMm);
          setIsRestored(true);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Private mode / storage disabled - calibration just won't persist.
    }
    setZoom(readZoom());
    setIsReady(true);
  }, []);

  // Track zoom for the whole session, not just on mount.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onChange = () => setZoom(vv.scale ?? 1);
    vv.addEventListener("resize", onChange);
    vv.addEventListener("scroll", onChange);
    return () => {
      vv.removeEventListener("resize", onChange);
      vv.removeEventListener("scroll", onChange);
    };
  }, []);

  const save = useCallback((nextPxPerMm) => {
    if (!isPlausiblePxPerMm(nextPxPerMm)) return false;
    setPxPerMm(nextPxPerMm);
    setIsRestored(false);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ pxPerMm: nextPxPerMm, ...readFingerprint(), ts: Date.now() })
      );
    } catch {
      // Non-fatal: the value still works for this session.
    }
    return true;
  }, []);

  const clear = useCallback(() => {
    setPxPerMm(null);
    setIsRestored(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  // More than 2% off 1.0 is a real zoom, not float noise.
  const isZoomed = Math.abs(zoom - 1) > 0.02;

  return {
    pxPerMm,
    /** True when a usable calibration exists and the page is not zoomed. */
    isCalibrated: isPlausiblePxPerMm(pxPerMm) && !isZoomed,
    /** True when the value came from storage - lets the UI offer "skip". */
    isRestored,
    /** False until localStorage has been read; avoids an SSR/hydration flash. */
    isReady,
    isZoomed,
    zoom,
    save,
    clear,
  };
}
