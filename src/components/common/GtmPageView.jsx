"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { pushCustomerData, pushMarketingData, pushPageView } from "@/lib/gtm";
import { saveUtmsFromUrl } from "@/lib/checkout-crm";

// Helper to determine the page type following Shopify conventions
const getPageType = (pathname) => {
  if (pathname === "/") return "index";
  if (pathname.startsWith("/collections")) return "collection";
  if (pathname.startsWith("/products")) return "product";
  if (pathname === "/checkout/cart") return "cart";
  if (pathname === "/checkout/shipping") return "checkout";
  if (pathname === "/checkout/payment") return "checkout";
  if (pathname.startsWith("/search")) return "search";
  if (pathname.startsWith("/pages/")) return "page";
  if (pathname.startsWith("/admin") || pathname.startsWith("/account")) return "account";
  if (pathname === "/login") return "login";
  return "other";
};

export default function GtmPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useSelector((state) => state.user);

  useEffect(() => {
    // 1. Determine Page Info
    const pageType = getPageType(pathname);
    const pageUrl = typeof window !== 'undefined' ? window.location.href : "";

    // 2. Save UTMs to localStorage for later use in checkout
    saveUtmsFromUrl(searchParams);

    // 3. Push the specific pageView event as requested
    pushPageView({
      pageType: pageType,
      pageUrl: pageUrl,
      utmSource: searchParams.get("utm_source") || "",
      utmMedium: searchParams.get("utm_medium") || "",
      utmCampaign: searchParams.get("utm_campaign") || "",
      utmTerm: searchParams.get("utm_term") || "",
      utmContent: searchParams.get("utm_content") || "",
      utmId: searchParams.get("utm_id") || ""
    });

    // 3. Push Customer Data if authenticated
    if (isAuthenticated && user) {
      pushCustomerData({
        name: user.name || "",
        mobile: user.mobile || "",
        email: user.email || "",
        device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
      });
    }
    // 4. Push Marketing Data
    pushMarketingData({
      utmSource: searchParams.get("utm_source") || "",
      utmMedium: searchParams.get("utm_medium") || "",
      utmCampaign: searchParams.get("utm_campaign") || "",
      utmTerm: searchParams.get("utm_term") || "",
      utmContent: searchParams.get("utm_content") || "",
      utmId: searchParams.get("utm_id") || ""
    });

  }, [pathname, searchParams, user, isAuthenticated]);

  return null; // This component does not render anything
}