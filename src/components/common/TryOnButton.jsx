"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ✅ Extracts product-level SKU from variant SKU
// "LJ-N00078-14RGLGD" → "LJ-N00078"
// Handles edge cases: null, already short, no second hyphen
function getProductSku(sku) {
  if (!sku) return null;

  const clean = sku.replace("/", ""); // your existing sanitization
  const parts = clean.split("-");

  // SKU format: {prefix}-{productId}-{variantSuffix}
  // We want only first two segments: "LJ" + "N00078" → "LJ-N00078"
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[1]}`;
  }

  // Fallback: return as-is if it doesn't match expected format
  return clean;
}

export default function TryOnButton({
  sku,
  productTitle,
  isAvailable,
  className = "",
  id = "tryonbutton2",
}) {
  const formattedSku = sku?.replace("/", "");       // original (for buy-now matching)
  const productSku = getProductSku(sku);             // trimmed (for Camweara init)
  const productName = productTitle;

  // ✅ Load Camweara External Button Script — uses productSku (all variants)
  useEffect(() => {
    if (!productSku) return;

    let retryCount = 0;
    const maxRetries = 10;

    const initCamweara = () => {
      const btnElement = document.getElementById(id);

      if (window.loadTryOnButton && btnElement) {
        window.loadTryOnButton({
          psku: productSku,          // 👈 trimmed SKU — shows all variants
          page: "product",
          tryonBtnId: id,
          regionId: "2",
          company: "luciraonline",
          buynow: {
            enable: isAvailable,
          },
          buynowCallback: "onTryOnBuynowCallback",
        });
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initCamweara, 500);
      }
    };

    if (document.getElementById("camweara-script")) {
      initCamweara();
      return;
    }

    const script = document.createElement("script");
    script.id = "camweara-script";
    script.src = "https://camweara.com/integrations/camweara_api_external_btn.js";
    script.async = true;
    script.onload = () => setTimeout(initCamweara, 100);

    document.body.appendChild(script);
  }, [productSku, isAvailable, id]);   // 👈 depend on productSku, not formattedSku

  // ✅ Buy Now Callback — still uses full formattedSku for exact variant match
  useEffect(() => {
    if (!formattedSku) return;

    window.onTryOnBuynowCallback = async (skuReceived) => {
      if (skuReceived === formattedSku) {
        try {
          await apiFetch("/api/cart/add", {
            method: "POST",
            body: JSON.stringify({ sku: skuReceived, quantity: 1 }),
          });
        } catch (e) {
          console.error("TryOn Buy Now failed:", e);
        }
      } else {
        try {
          const data = await apiFetch(
            `/api/search-by-sku?sku=${encodeURIComponent(skuReceived)}`
          );
          if (data?.handle) {
            window.location.href = `/products/${data.handle}`;
          }
        } catch (e) {
          console.error("TryOn search-by-sku failed:", e);
        }
      }
    };
  }, [formattedSku]);

  // ✅ GTM Tracking
  const pushDataLayer = () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "promoClick",
      promoClick: {
        promo_id: productSku,          // 👈 use productSku for consistent tracking
        creative_name: "Virtual Try On",
        promo_position: "Above Media Gallery",
        promo_name: productName,
        location_id: "pdp",
      },
    });
  };

  if (!productSku) return null;

  return (
    <button
      id={id}
      onClick={pushDataLayer}
      style={{ visibility: "hidden" }}
      className={
        className ||
        `
        bg-[#EDEDED]
        text-black
        hover:bg-[#E0E0E0]
        cursor-pointer
        btn-peek-animation
      `
      }
    >
      <span className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
        <svg
          width="34"
          height="34"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </span>
      <span className="btn-text text-xs font-bold uppercase tracking-wider">
        Virtual try on
      </span>
    </button>
  );
}