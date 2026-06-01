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
        console.error("WebEngage Service Worker registration failed: ", error);
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
