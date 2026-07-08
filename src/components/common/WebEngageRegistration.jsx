"use client";

import { useEffect } from "react";

export default function WebEngageRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log("WebEngage Service Worker registered: ", registration);
      } catch (error) {
        if (error.name === 'InvalidStateError') {
          console.warn("WebEngage Service Worker registration skipped: Document is in an invalid state (likely due to Turbopack HMR).");
        } else {
          console.error("WebEngage Service Worker registration failed: ", error);
        }
      }
    };

    const handleInitialCheck = () => {
      registerServiceWorker();
    };

    if (document.readyState === "complete") {
      handleInitialCheck();
    } else {
      window.addEventListener("load", handleInitialCheck);
      return () => window.removeEventListener("load", handleInitialCheck);
    }
  }, []);

  return null;
}
