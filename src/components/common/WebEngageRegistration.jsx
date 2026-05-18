"use client";

import { useEffect } from "react";

export default function WebEngageRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("WebEngage Service Worker registered: ", registration);
          })
          .catch((error) => {
            console.error("WebEngage Service Worker registration failed: ", error);
          });
      });
    }
  }, []);

  return null;
}
