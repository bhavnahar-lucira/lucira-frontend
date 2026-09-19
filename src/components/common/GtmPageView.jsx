"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { pushCustomerData, pushMarketingData, pushPageView } from "@/lib/gtm";
import { saveUtmsFromUrl } from "@/lib/checkout-crm";
import { toE164 } from "@/lib/phone";

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
  const lastPathRef = useRef("");

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (lastPathRef.current === currentPath) return;
    lastPathRef.current = currentPath;

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

    // 4. Push Marketing Data
    pushMarketingData({
      utmSource: searchParams.get("utm_source") || "",
      utmMedium: searchParams.get("utm_medium") || "",
      utmCampaign: searchParams.get("utm_campaign") || "",
      utmTerm: searchParams.get("utm_term") || "",
      utmContent: searchParams.get("utm_content") || "",
      utmId: searchParams.get("utm_id") || ""
    });

  }, [pathname, searchParams]);

  useEffect(() => {
    // 3. Push Customer Data if authenticated
    if (isAuthenticated && user) {
      const canonicalPhone = toE164(user.mobile || user.phone);
      pushCustomerData({
        id: user.id || "",
        userId: canonicalPhone || user.id || "",
        cuid: canonicalPhone || "",
        name: user.name || "",
        mobile: canonicalPhone || user.mobile || "",
        phone: canonicalPhone || user.phone || "",
        email: user.email || "",
        device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
      });
    }
  }, [user?.id, isAuthenticated]);

  return null; // This component does not render anything
}
