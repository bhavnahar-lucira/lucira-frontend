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

const INTERVAL_MS = 3000;

// Wait before the messages start, so switching tabs briefly leaves the title alone.
const START_DELAY_MS = 5000;

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
    let startTimeoutId = null;
    let index = 0;
    let originalTitle = document.title;
    const faviconEl = getFaviconEl();
    const originalFavicon = faviconEl.getAttribute("href") || ACTIVE_FAVICON;

    const clearTimers = () => {
      if (startTimeoutId) {
        clearTimeout(startTimeoutId);
        startTimeoutId = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const showNextMessage = () => {
      document.title = AWAY_MESSAGES[index % AWAY_MESSAGES.length];
      index += 1;
    };

    const startAway = () => {
      // Capture the current (route-specific) title so we can restore it exactly.
      originalTitle = document.title;
      index = 0;
      clearTimers();
      startTimeoutId = setTimeout(() => {
        startTimeoutId = null;
        // Show the first message as the delay ends, otherwise setInterval would hold
        // the real title for another INTERVAL_MS before the first swap.
        showNextMessage();
        intervalId = setInterval(showNextMessage, INTERVAL_MS);
      }, START_DELAY_MS);
    };

    const stopAway = () => {
      // Returning within the delay leaves the title untouched, so restoring is a no-op.
      clearTimers();
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
      clearTimers();
      document.title = originalTitle;
      faviconEl.setAttribute("href", originalFavicon);
    };
  }, []);

  return null;
}
