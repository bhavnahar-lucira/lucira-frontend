"use client";

import { useEffect, useState } from "react";

export default function WebEngageRegistration() {
  const [showPrompt, setShowPrompt] = useState(false);

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

    const checkPermission = () => {
      if (!("Notification" in window)) return;

      // Don't show if already granted
      if (Notification.permission === "granted") return;

      // Don't show if user previously clicked 'Block' in our custom UI
      const isBlocked = localStorage.getItem("lucira_notifications_blocked");
      if (isBlocked) return;

      setShowPrompt(true);
    };

    const handleInitialCheck = () => {
      registerServiceWorker();
      checkPermission();
    };

    if (document.readyState === "complete") {
      handleInitialCheck();
    } else {
      window.addEventListener("load", handleInitialCheck);
      return () => window.removeEventListener("load", handleInitialCheck);
    }
  }, []);

  const handleAllow = () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    
    console.log("Attempting to request notification permission. Current state:", Notification.permission);

    // If permission is already denied at browser level, we CANNOT trigger the prompt again.
    if (Notification.permission === "denied") {
      alert("Notifications are currently BLOCKED in your browser settings for this site.\n\nPlease click the lock icon in your address bar and change 'Notifications' to 'Allow' to receive updates.");
      setShowPrompt(false);
      localStorage.setItem("lucira_notifications_blocked", "true");
      return;
    }

    // Modern browsers return a promise; older ones use a callback. 
    try {
      const promise = Notification.requestPermission((permission) => {
        handlePermissionResult(permission);
      });

      if (promise && typeof promise.then === "function") {
        promise.then(handlePermissionResult);
      }
    } catch (e) {
      console.error("Error requesting notification permission:", e);
    }
  };

  const handlePermissionResult = (permission) => {
    console.log("Permission result received:", permission);
    if (permission === "granted") {
      setShowPrompt(false);
    } else if (permission === "denied") {
      localStorage.setItem("lucira_notifications_blocked", "true");
      setShowPrompt(false);
    }
  };

  const handleBlock = () => {
    localStorage.setItem("lucira_notifications_blocked", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[10000] animate-slideDown">
      <div className="bg-[#5A413F] text-white px-4 py-3 md:py-2.5 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 shadow-2xl border-b border-white/10">
        <div className="flex items-center gap-2 text-center md:text-left">
          <p className="text-sm font-medium tracking-wide">
            Enable notifications to stay updated with our latest collections and exclusive offers.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBlock}
            className="text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-all hover:bg-white/5"
          >
            Block
          </button>
          <button
            onClick={handleAllow}
            className="bg-white text-[#5A413F] text-xs font-bold uppercase tracking-widest px-7 py-2 rounded shadow-lg hover:bg-gray-100 transition-all active:scale-95"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
