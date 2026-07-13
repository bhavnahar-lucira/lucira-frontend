"use client";

import { useEffect } from "react";

// Messages that cycle in the browser tab title once the user switches away
// to another tab (i.e. this page is hidden). They rotate to gently pull the
// user back to the store.
const AWAY_MESSAGES = [
  "💎 Come back to sparkle",
  "👀 Still thinking it over?",
  "✨ Your Lucira awaits",
];

// Swap the favicon while the tab is inactive for a bit more personality, then
// restore it on return. Set to the same logo used in the layout metadata.
const ACTIVE_FAVICON =
  "https://luciraonline.myshopify.com/cdn/shop/files/Favicon_New_10.png?crop=center&height=32&v=1767615434&width=32";

const INTERVAL_MS = 1500;

function getFaviconEl() {
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

export default function TabTitleAnimator() {
  useEffect(() => {
    let intervalId = null;
    let index = 0;
    let originalTitle = document.title;
    const faviconEl = getFaviconEl();
    const originalFavicon = faviconEl.getAttribute("href") || ACTIVE_FAVICON;

    const startAway = () => {
      // Capture the current (route-specific) title so we can restore it exactly.
      originalTitle = document.title;
      index = 0;
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        document.title = AWAY_MESSAGES[index % AWAY_MESSAGES.length];
        index += 1;
      }, INTERVAL_MS);
    };

    const stopAway = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      document.title = originalTitle;
      faviconEl.setAttribute("href", originalFavicon);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        startAway();
      } else {
        stopAway();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalId) clearInterval(intervalId);
      document.title = originalTitle;
      faviconEl.setAttribute("href", originalFavicon);
    };
  }, []);

  return null;
}
