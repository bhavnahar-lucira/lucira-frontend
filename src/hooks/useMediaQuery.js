"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

// Hydration-aware variant: `null` while the viewport is unknown (server render
// and the hydration pass), then the real boolean from the first render after
// hydration, kept in sync with the media query's own change events. Use it
// where the server and the browser must agree on the markup and the component
// has a way to render the "unknown" case (e.g. both variants, CSS-selected).
// `useMediaQuery` below keeps its original false-first behaviour for the many
// callers that only need a boolean.
export function useMediaQueryState(query) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null
  );
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
}
