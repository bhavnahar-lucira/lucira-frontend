"use client";

import { useEffect } from "react";

export default function ZohoSalesIQ() {
  useEffect(() => {
    // 1. Initial setup for $zoho object
    window.$zoho = window.$zoho || {};
    window.$zoho.salesiq = window.$zoho.salesiq || { ready: function() {} };

    // 2. afterReady callback for cookie consent
    window.$zoho.salesiq.afterReady = function() {
      // Hide the native float button to use our custom FAB instead
      if (window.$zoho.salesiq.floatbutton) {
        window.$zoho.salesiq.floatbutton.visible('hide');
      }
      
      if (window.$zoho.salesiq.privacy) {
        window.$zoho.salesiq.privacy.updateCookieConsent([
          'necessary',
          'analytics',
          'performance',
          'advertisement'
        ]);
      }
    };

    // 3. Lazy loading logic
    let zohoLoaded = false;
    const loadZoho = () => {
      if (zohoLoaded) return;
      zohoLoaded = true;

      const s = document.createElement('script');
      s.src = 'https://salesiq.zohopublic.in/widget?wc=siq2e12e9db232ea8ab5f0ff99b39f60ba8cf16a05cc958274a1631cbcf3fc63621';
      s.defer = true;
      s.id = 'zsiqscript';
      document.head.appendChild(s);
    };

    // Load on user interaction
    const events = ['scroll', 'mousemove', 'touchstart', 'keydown'];
    const eventOptions = { once: true, passive: true };
    
    events.forEach(ev => {
      window.addEventListener(ev, loadZoho, eventOptions);
    });

    // Fallback load after 5 seconds
    const timeoutId = setTimeout(loadZoho, 5000);

    return () => {
      clearTimeout(timeoutId);
      events.forEach(ev => {
        window.removeEventListener(ev, loadZoho, eventOptions);
      });
    };
  }, []);

  return null;
}
