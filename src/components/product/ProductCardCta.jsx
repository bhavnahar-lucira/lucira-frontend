"use client";

// The call to action at the foot of a collection card.
//
// Exactly one of three, picked by what the shopper can actually do with THIS
// piece, in this order:
//
//   1. In stock            → Try At Home, plus a video call beside it (both redirect to WhatsApp with prefilled messages).
//   2. Out of stock, but
//      Camweara can render
//      a try-on            → Virtual Try-On + WhatsApp expert beside it.
//   3. Neither             → Chat with Expert, on WhatsApp, with prefilled product message.
//
// Colours and the hover wipe live in globals.css under PRODUCT CARD CTA; each
// button passes its own --cta and --cta-ink.

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Video, Gem } from "lucide-react";
import TryOnButton from "../common/TryOnButton";
import { pushPromoClick, getNumericId } from "@/lib/gtm";

const WHATSAPP_NUMBER = "+917208934782";

/**
 * Brand colour per CTA, plus the label colour once the hover fill is down.
 */
const TONES = {
  tryAtHome: { cta: "#5A413F", ink: "#FFFFFF" },
  videoCall: { cta: "#189351", ink: "#FFFFFF" },
  virtualTryOn: { cta: "#B76F79", ink: "#FFFFFF" },
  whatsapp: { cta: "#0D9F16", ink: "#FFFFFF" },
};

const toneVars = (tone) => ({ "--cta": tone.cta, "--cta-ink": tone.ink });

const BASE =
  "product-cta flex items-center justify-center gap-2 h-10 lg:h-11 rounded-sm border " +
  "font-figtree font-semibold text-[12px] lg:text-sm leading-[1.4] tracking-normal cursor-pointer";

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="product-cta-icon w-4 h-4 shrink-0">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.23 8.23z" />
    </svg>
  );
}

const CREATIVE = {
  tryAtHome: "Product card try at home",
  videoCall: "Product card video call started",
  virtualTryOn: "Product card virtual try on",
  whatsapp: "Product card whatsapp",
};

export default function ProductCardCta({
  product,
  currentVariant,
  inStock,
  index,
  price,
  comparePrice,
  image,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const hasTryOn = String(product?.productMetafields?.has_virtual_tryon) === "true";
  const sku = currentVariant?.sku || product?.variants?.[0]?.sku || "";

  const tryOnId = React.useMemo(
    () => `tryon-card-${String(product?.id || product?.handle || "").replace(/[^a-zA-Z0-9]/g, "")}`,
    [product?.id, product?.handle]
  );

  const locationId =
    pathname === "/"
      ? "homepage"
      : pathname?.startsWith("/products/")
        ? "pdp"
        : pathname?.startsWith("/collections/")
          ? "plp"
          : "inner pages";

  const promoProduct = React.useMemo(() => {
    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://www.lucirajewelry.com";
    return {
      product_id: String(getNumericId(product?.shopifyId || product?.id) || ""),
      product_name: product?.title || "",
      sku,
      variant_id: String(getNumericId(currentVariant?.id || currentVariant?.shopifyId) || ""),
      product_url: product?.handle ? `${origin}/products/${product.handle}` : "",
      product_image: image || "",
      price: Number(price || 0),
      offer_price: Number(comparePrice || price || 0),
    };
  }, [product, currentVariant, sku, image, price, comparePrice]);

  const track = (creative) => {
    pushPromoClick({
      ...promoProduct,
      creative_name: creative,
      promo_id: promoProduct.variant_id || sku || product?.handle || "",
      promo_name: product?.title || "",
      promo_position: "Product Card",
      location_id: locationId,
      ...(index === undefined || index === null || index === ""
        ? {}
        : { index_position: String(index) }),
    });
  };

  const launchTryOn = () => {
    track(CREATIVE.virtualTryOn);
    const el = document.getElementById(tryOnId);
    const ready = el && window.getComputedStyle(el).visibility === "visible";
    if (ready) el.click();
    else router.push(`/products/${product.handle}`);
  };

  const productTitle = product?.title || "";
  const productUrl = promoProduct.product_url || "";

  // 1. Try At Home WhatsApp URL: "Hi, I'd like to book a free home trial for:\n[Product Name] [Product URL]"
  const tryAtHomeWhatsappHref = React.useMemo(() => {
    const message = `Hi, I'd like to book a free home trial for:\n${productTitle}${productUrl ? ` ${productUrl}` : ""}`;
    return `https://api.whatsapp.com/send/?phone=+917208934782&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }, [productTitle, productUrl]);

  // 2. Videocall WhatsApp URL: "Hi, I'd like to schedule a video call for [Product Name] [Product URL]"
  const videoCallWhatsappHref = React.useMemo(() => {
    const message = `Hi, I'd like to schedule a video call for ${productTitle}${productUrl ? ` ${productUrl}` : ""}`;
    return `https://api.whatsapp.com/send/?phone=+917208934782&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }, [productTitle, productUrl]);

  // 3. Chat With Experts WhatsApp URL: "Hi! I'm interested in this product and would like to know more: [Product Name] [Product URL]"
  const chatWithExpertsWhatsappHref = React.useMemo(() => {
    const message = `Hi! I'm interested in this product and would like to know more: ${productTitle}${productUrl ? ` ${productUrl}` : ""}`;
    return `https://api.whatsapp.com/send/?phone=+917208934782&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }, [productTitle, productUrl]);

  return (
    <div className="mt-auto pt-2.5">
      {inStock ? (
        <div className="flex items-stretch gap-2">
          {/* Try At Home Button -> Direct WhatsApp redirection */}
          <a
            href={tryAtHomeWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={toneVars(TONES.tryAtHome)}
            onClick={() => track(CREATIVE.tryAtHome)}
            className={`${BASE} flex-1 min-w-0 px-3`}
          >
            <span className="product-cta-fill" aria-hidden="true" />
            <Home size={16} className="product-cta-icon shrink-0" />
            <span className="truncate">Try At Home</span>
          </a>

          {/* Video Call Button -> Direct WhatsApp redirection */}
          <a
            href={videoCallWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Schedule a video call"
            title="Schedule a video call"
            style={toneVars(TONES.videoCall)}
            onClick={() => track(CREATIVE.videoCall)}
            className={`${BASE} w-11 shrink-0`}
          >
            <span className="product-cta-fill" aria-hidden="true" />
            <Video size={16} className="product-cta-icon" />
          </a>
        </div>
      ) : hasTryOn ? (
        <>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              style={toneVars(TONES.virtualTryOn)}
              onClick={launchTryOn}
              className={`${BASE} flex-1 min-w-0 px-3`}
            >
              <span className="product-cta-fill" aria-hidden="true" />
              <Gem size={16} className="product-cta-icon shrink-0" />
              <span className="truncate">Virtual Try-On</span>
            </button>
            <a
              href={chatWithExpertsWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with an expert on WhatsApp"
              title="Chat with an expert on WhatsApp"
              style={toneVars(TONES.whatsapp)}
              onClick={() => track(CREATIVE.whatsapp)}
              className={`${BASE} w-11 shrink-0`}
            >
              <span className="product-cta-fill" aria-hidden="true" />
              <WhatsAppMark />
            </a>
          </div>

          <span aria-hidden="true" className="sr-only">
            <TryOnButton
              sku={sku}
              productTitle={product?.title}
              isAvailable={false}
              id={tryOnId}
              className="pointer-events-none"
            />
          </span>
        </>
      ) : (
        <a
          href={chatWithExpertsWhatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          style={toneVars(TONES.whatsapp)}
          onClick={() => track(CREATIVE.whatsapp)}
          className={`${BASE} w-full px-3`}
        >
          <span className="product-cta-fill" aria-hidden="true" />
          <WhatsAppMark />
          <span className="truncate">Chat with Expert</span>
        </a>
      )}
    </div>
  );
}
