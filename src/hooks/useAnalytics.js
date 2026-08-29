"use client";

import { useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/redux/features/user/userSlice";

const TRACKING_API = "http://localhost:3010/api/analytics/events";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const useAnalytics = () => {
  const user = useSelector(selectUser);

  const getAnonymousId = () => {
    if (typeof window === "undefined") return null;
    let id = localStorage.getItem("lucira_anonymous_id");
    if (!id) {
      id = generateId();
      localStorage.setItem("lucira_anonymous_id", id);
    }
    return id;
  };

  const getSession = () => {
    if (typeof window === "undefined") return { sessionId: null };
    
    const lastActivity = localStorage.getItem("lucira_session_last_activity");
    let sessionId = localStorage.getItem("lucira_session_id");

    const now = Date.now();
    
    // If no session or timed out
    if (!sessionId || !lastActivity || now - parseInt(lastActivity, 10) > SESSION_TIMEOUT_MS) {
      sessionId = generateId();
      localStorage.setItem("lucira_session_id", sessionId);
    }
    
    localStorage.setItem("lucira_session_last_activity", now.toString());
    
    return { sessionId };
  };

  const sendEvent = useCallback((eventData, useBeacon = false) => {
    try {
      const anonymousId = getAnonymousId();
      const { sessionId } = getSession();
      
      // Extract customerId from redux state
      const customerId = user?.id || user?._id || user?.customerId || null;
      
      const payload = {
        ...eventData,
        sessionId,
        anonymousId,
        customerId,
        timestamp: new Date().toISOString()
      };

      // Use beacon API if requested and supported
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(TRACKING_API, JSON.stringify(payload));
      } else {
        fetch(TRACKING_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true, // helps ensure delivery if page unloads
        }).catch((err) => console.error("Analytics error:", err));
      }
    } catch (e) {
      console.error("Failed to construct analytics payload:", e);
    }
  }, [user]);

  const initSession = useCallback((urlParams) => {
    // Only capture UTM on initialization if they exist
    const hasUtm = Object.keys(urlParams).some(k => k.startsWith('utm_'));
    const sessionData = {
      event: "session_start",
      page: window.location.pathname,
      referrer: document.referrer,
      deviceType: /Mobile|Android|iP(ad|hone)/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      browser: navigator.userAgent,
    };

    if (hasUtm) {
      sessionData.utmSource = urlParams.utm_source;
      sessionData.utmMedium = urlParams.utm_medium;
      sessionData.utmCampaign = urlParams.utm_campaign;
      sessionData.utmTerm = urlParams.utm_term;
      sessionData.utmContent = urlParams.utm_content;
    }

    sendEvent(sessionData);
  }, [sendEvent]);

  const trackPageView = useCallback((pathname) => {
    // Delay slightly so Next.js has time to update document.title for the new route
    setTimeout(() => {
      sendEvent({
        event: "page_view",
        page: pathname,
        pageTitle: document.title,
        referrer: document.referrer
      });
    }, 500);
  }, [sendEvent]);

  const trackProductView = useCallback((product) => {
    sendEvent({
      event: "product_view",
      page: window.location.pathname,
      productId: product.id,
      productTitle: product.title,
      price: product.price
    });
  }, [sendEvent]);

  const trackAddToCart = useCallback((product, quantity = 1, cartId = null) => {
    sendEvent({
      event: "add_to_cart",
      page: window.location.pathname,
      productId: product.id,
      productTitle: product.title,
      price: product.price,
      quantity,
      cartId
    });
  }, [sendEvent]);
  
  const trackBeginCheckout = useCallback((cartId, value) => {
    sendEvent({
      event: "begin_checkout",
      page: window.location.pathname,
      cartId,
      price: value
    });
  }, [sendEvent]);

  const trackPurchase = useCallback((orderId, value, currency = 'INR') => {
    sendEvent({
      event: "purchase",
      page: window.location.pathname,
      orderId,
      price: value,
      currency
    });
  }, [sendEvent]);

  return {
    initSession,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    sendEvent // For any custom events
  };
};
