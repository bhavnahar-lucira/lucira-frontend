"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAnalytics } from "../hooks/useAnalytics";

export function AnalyticsProvider({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { initSession, trackPageView } = useAnalytics();
  
  const initialized = useRef(false);
  const lastPathname = useRef("");

  useEffect(() => {
    // Initialize session and capture UTM params from URL if any
    const urlParams = Object.fromEntries(searchParams.entries());
    initSession(urlParams);
    initialized.current = true;
    
    // Add visibility change and pagehide listeners to track exits
    const handleExit = () => {
      // We can use navigator.sendBeacon inside our analytics hook if needed
      // but exit page is updated on the server during each page_view.
    };

    window.addEventListener("visibilitychange", handleExit);
    window.addEventListener("pagehide", handleExit);

    return () => {
      window.removeEventListener("visibilitychange", handleExit);
      window.removeEventListener("pagehide", handleExit);
    };
  }, [initSession, searchParams]);

  useEffect(() => {
    // Track page views on route change
    if (initialized.current && pathname !== lastPathname.current) {
      lastPathname.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname, trackPageView]);

  return <>{children}</>;
}
