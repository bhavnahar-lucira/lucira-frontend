"use client";

import useShopifyToggle from "@/hooks/useShopifyToggle";

export default function FooterPageContent({ html }) {
  useShopifyToggle();

  return (
    <div
      className="footer-pages"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}