"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function BodyClassManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    let templateClass = "default-template";
    if (pathname === "/") {
      templateClass = "homepage-template";
    } else if (pathname.startsWith("/products/")) {
      templateClass = "pdp-template";
    } else if (pathname.startsWith("/collections/")) {
      templateClass = "plp-template";
    } else if (pathname.startsWith("/blogs/")) {
      templateClass = "blog-template";
    } else if (pathname.startsWith("/pages/")) {
      templateClass = "page-template";
    } else if (pathname === "/cart" || pathname.startsWith("/checkout/")) {
      templateClass = "cart-template";
    } else if (pathname.startsWith("/build-your-jewelry")) {
      templateClass = "byj-template";
    }

    const allTemplates = [
      "homepage-template",
      "pdp-template",
      "plp-template",
      "blog-template",
      "page-template",
      "cart-template",
      "byj-template",
      "default-template",
    ];

    document.body.classList.remove(...allTemplates);
    document.body.classList.add(templateClass);
  }, [pathname]);

  return null;
}
