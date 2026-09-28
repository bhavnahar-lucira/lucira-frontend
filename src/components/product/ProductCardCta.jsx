"use client";

// The call to action at the foot of a collection card.
//
// Exactly one of three, picked by what the shopper can actually do with THIS
// piece, in this order:
//
//   1. In stock            → Try At Home, plus a video call beside it. A piece
//                            that exists can be brought to them, so that is the
//                            strongest offer and it wins outright — including
//                            over a virtual try-on the product may also have.
//   2. Out of stock, but
//      Camweara can render
//      a try-on            → Virtual Try-On. Nothing to bring, but they can
//                            still see it on their own hand.
//   3. Neither             → Chat with Expert, on WhatsApp, with the piece
//                            already named in the message.
//
// The try-on flag comes from custom.has_virtual_tryon, backfilled from
// Camweara's own manifest (see scripts/backfill-tryon-metafield.js in
// lucira-backend), so the button is only ever offered where the try-on will
// actually load. Reading a metafield rather than mounting Camweara per card
// matters here: this renders once per tile in a grid of 25.
//
// Colours and the hover wipe live in globals.css under PRODUCT CARD CTA; each
// button passes its own --cta and --cta-ink.

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Video, Gem } from "lucide-react";
import TryOnButton from "../common/TryOnButton";
import ProductAppointmentDrawer from "../pages/book-appointment/ProductAppointmentDrawer";
import { APPOINTMENT_TYPES } from "@/lib/bookAppointment";
import { pushPromoClick, getNumericId } from "@/lib/gtm";

const WHATSAPP_NUMBER = "+917208934782";

/**
 * Brand colour per CTA, plus the label colour once the hover fill is down.
 *
 * Ink is white throughout. Virtual Try-On was the one exception while it was
 * amber — white on that sat at about 2.2:1 and was genuinely hard to read — but
 * #B76F79 is dark enough to carry white at about 3.8:1, which is also what the
 * Best Seller badge already does on the near-identical #B77767.
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

/**
 * Drawn rather than the usual PNG mark: that asset is WhatsApp green, which is
 * invisible once the green fill is down. As currentColor it flips with the label.
 */
function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="product-cta-icon w-4 h-4 shrink-0">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.78 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.23 8.23z" />
    </svg>
  );
}

/**
 * creative_name per button. One constant rather than four string literals at
 * the call sites, because these are the names the GTM triggers and the promo
 * reports are keyed on — a typo in one of them is a funnel that silently
 * reports nothing.
 *
 * Both WhatsApp buttons share a name: the full-width one and the icon beside
 * Virtual Try-On are the same offer reached two ways, and splitting them would
 * only mean adding the two numbers back together to answer "how many shoppers
 * asked an expert".
 */
const CREATIVE = {
  tryAtHome: "Product card try at home",
  videoCall: "Product card video call",
  virtualTryOn: "Product card virtual try on",
  whatsapp: "Product card whatsapp",
};

export default function ProductCardCta({
  product,
  currentVariant,
  inStock,
  // Tile index, price, and image — all worked out by the card already, passed
  // down so the promoClick describes the same piece at the same price the
  // shopper is looking at rather than re-deriving any of it.
  index,
  price,
  comparePrice,
  image,
}) {
  const router = useRouter();
  const pathname = usePathname();

  // The drawer mounts already open, unlike the Book Appointment page's, which
  // mounts with the page and opens later. That matters for the booking form:
  // it prefills a signed-in shopper's details on the closed→open transition,
  // and there is no such transition here — which is why useSlotBookingForm
  // seeds at mount too.
  const [appointment, setAppointment] = React.useState(null);

  const hasTryOn = String(product?.productMetafields?.has_virtual_tryon) === "true";

  const sku = currentVariant?.sku || product?.variants?.[0]?.sku || "";

  // Unique per card: Camweara keys its init off the element id, so two cards
  // sharing one would have the second overwrite the first.
  const tryOnId = React.useMemo(
    () => `tryon-card-${String(product?.id || product?.handle || "").replace(/[^a-zA-Z0-9]/g, "")}`,
    [product?.id, product?.handle]
  );

  // The surface the tile is sitting on, in the vocabulary the rest of the app's
  // promoClicks already speak (the header, View Similar, the PDP). The card is
  // not only ever on a collection grid — search and the related rails render it
  // too — so this is read rather than assumed.
  const locationId =
    pathname === "/"
      ? "homepage"
      : pathname?.startsWith("/products/")
        ? "pdp"
        : pathname?.startsWith("/collections/")
          ? "plp"
          : "inner pages";

  // What every one of these events says about the piece, in the field names the
  // PDP's promoClick established — so a Try At Home off a collection tile and
  // one off the product page land in the same columns instead of two shapes of
  // the same event.
  const promoProduct = React.useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
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

  const track = (creative) =>
    pushPromoClick({
      ...promoProduct,
      creative_name: creative,
      // The VARIANT, not the product: two colours of one ring are two different
      // things to bring to someone's home or to render on their hand, and the
      // card fires this for whichever one is on screen. SKU, then handle, only
      // as fallbacks — an event with no id at all is one nobody can join.
      promo_id: promoProduct.variant_id || sku || product?.handle || "",
      promo_name: product?.title || "",
      promo_position: "Product Card",
      location_id: locationId,
      // The tile's slot in the grid, passed through exactly as the card's own
      // productClick sends it as indexPosition — so the two events agree on
      // which tile this was. The collection grid numbers from 1. Omitted where
      // the surface does not number its tiles at all, rather than sent as a 0
      // that would read as the first one.
      ...(index === undefined || index === null || index === ""
        ? {}
        : { index_position: String(index) }),
    });

  const openAppointment = (type, creative) => {
    track(creative);
    setAppointment(type);
  };

  // Camweara reveals its own button once the model for this SKU is ready, which
  // is the only honest signal that the try-on can launch. If it has not (script
  // blocked, SKU pulled since the backfill), send them to the PDP rather than
  // firing a click into a button that will not respond.
  const launchTryOn = () => {
    track(CREATIVE.virtualTryOn);
    const el = document.getElementById(tryOnId);
    const ready = el && window.getComputedStyle(el).visibility === "visible";
    if (ready) el.click();
    else router.push(`/products/${product.handle}`);
  };

  const whatsappHref = React.useMemo(() => {
    const url = product?.handle
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/products/${product.handle}`
      : "";
    const message = `Hi, I want to get more information about this product: ${product?.title || ""}${url ? `\n${url}` : ""}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [product]);

  return (
    <>
      {/* mt-auto: pinned to the bottom of the card, see ProductCard. */}
      <div className="mt-auto pt-2.5">
        {inStock ? (
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              style={toneVars(TONES.tryAtHome)}
              onClick={() => openAppointment(APPOINTMENT_TYPES.tryAtHome, CREATIVE.tryAtHome)}
              className={`${BASE} flex-1 min-w-0 px-3`}
            >
              <span className="product-cta-fill" aria-hidden="true" />
              <Home size={16} className="product-cta-icon shrink-0" />
              <span className="truncate">Try At Home</span>
            </button>
            <button
              type="button"
              aria-label="Book a video call"
              title="Book a video call"
              style={toneVars(TONES.videoCall)}
              onClick={() => openAppointment(APPOINTMENT_TYPES.videoCall, CREATIVE.videoCall)}
              className={`${BASE} w-11 shrink-0`}
            >
              <span className="product-cta-fill" aria-hidden="true" />
              <Video size={16} className="product-cta-icon" />
            </button>
          </div>
        ) : hasTryOn ? (
          <>
            {/* Paired the same way the in-stock row is: the try-on is the offer,
                and an expert is one tap away beside it for anyone it does not
                answer — which, on a piece that cannot be bought right now, is
                the more likely outcome. */}
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
                href={whatsappHref}
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
            {/* Does the Camweara handshake out of sight; the button above is what
                the shopper sees, and clicking it forwards to this one. Clipped
                rather than `hidden`, because display:none would stop Camweara
                binding to it — it has to stay a laid-out element. */}
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
            href={whatsappHref}
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

      {/* Mounted only once a CTA has been pressed: the drawer pulls in the whole
          booking flow — slot picker, OTP, the lead webhook — and a collection
          page renders 25 of these cards. */}
      {appointment && (
        <ProductAppointmentDrawer
          open
          onClose={() => setAppointment(null)}
          type={appointment}
          product={product}
          locationId={locationId}
          promoProduct={promoProduct}
        />
      )}
    </>
  );
}
