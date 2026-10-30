"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fetchDispatchSettings } from "@/lib/api";
import {
  DISPATCH_DEFAULTS,
  dispatchConfigHasTimer,
  formatDispatchMessage,
  mergeDispatchConfig,
} from "@/lib/utils";

/* ------------------------------------------------------------------
   Config cache
   ------------------------------------------------------------------
   The dispatch config is store-wide, not per-product, and every cart line and
   summary row on a page wants it. Cache it at module level behind a single
   in-flight promise so a ten-line cart still makes one request. The TTL matches
   what the dashboard promises editors: "picks up saved changes within about a
   minute". */
const CACHE_TTL_MS = 60_000;

let cachedConfig = null;
let cachedAt = 0;
let inFlight = null;

function isFresh() {
  return cachedConfig !== null && Date.now() - cachedAt < CACHE_TTL_MS;
}

export function loadDispatchConfig() {
  if (isFresh()) return Promise.resolve(cachedConfig);
  if (inFlight) return inFlight;

  inFlight = fetchDispatchSettings()
    .then((data) => {
      cachedConfig = mergeDispatchConfig(data);
      cachedAt = Date.now();
      return cachedConfig;
    })
    .catch((error) => {
      // The line is decoration around a stock status, never a blocker — an
      // unreachable endpoint falls back to the defaults, which reproduce the
      // backend's own. The fallback is cached too, so we don't re-request it
      // once per component.
      console.warn("[useDispatchInfo] Failed to load dispatch settings:", error);
      cachedConfig = mergeDispatchConfig(null);
      cachedAt = Date.now();
      return cachedConfig;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Lets a layout warm the cache before the first dispatch line renders. */
export function primeDispatchConfig() {
  if (typeof window === "undefined") return;
  loadDispatchConfig();
}

/* ------------------------------------------------------------------
   Shared 1s clock
   ------------------------------------------------------------------
   One interval for the whole page rather than one per dispatch line, and it
   only runs while something is actually subscribed. Read through
   useSyncExternalStore so the server snapshot stays null: SSR and the first
   client render then agree on the plain-date wording, and the countdown only
   appears once hydration is done. */
let clockNow = null;
let clockTimer = null;
const clockListeners = new Set();

function subscribeClock(onChange) {
  clockListeners.add(onChange);
  // React re-reads the snapshot right after subscribing, so seeding the clock
  // here is enough to start the countdown on this render rather than in a second.
  if (clockNow === null) clockNow = Date.now();
  if (clockTimer === null) {
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    clockListeners.delete(onChange);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

const noopSubscribe = () => () => {};
const getClockSnapshot = () => clockNow;
const getClockServerSnapshot = () => null;

/**
 * Reads the dashboard's Dispatch Settings and hands back a formatter.
 *
 *   const { getDispatch } = useDispatchInfo();
 *   const info = getDispatch({ inStock, leadTime });  // see formatDispatchMessage
 *
 * When the config asks for a countdown the component re-renders once a second
 * so the timer ticks; with no timer configured no interval runs at all.
 */
export function useDispatchInfo() {
  const [config, setConfig] = useState(() => cachedConfig || DISPATCH_DEFAULTS);
  const [loading, setLoading] = useState(() => !isFresh());

  useEffect(() => {
    let alive = true;
    loadDispatchConfig().then((next) => {
      if (!alive) return;
      setConfig(next);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const hasTimer = useMemo(() => dispatchConfigHasTimer(config), [config]);
  const nowTs = useSyncExternalStore(
    hasTimer ? subscribeClock : noopSubscribe,
    getClockSnapshot,
    getClockServerSnapshot
  );

  const getDispatch = useCallback(
    (options = {}) =>
      formatDispatchMessage(config, {
        ...options,
        now: nowTs === null ? new Date() : new Date(nowTs),
        // Before hydration there is no clock, so never render a countdown.
        allowTimer: nowTs !== null && options.allowTimer !== false,
      }),
    [config, nowTs]
  );

  return { config, loading, enabled: config.enabled !== false, getDispatch };
}

export default useDispatchInfo;
