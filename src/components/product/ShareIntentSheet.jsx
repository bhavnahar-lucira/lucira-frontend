"use client";

/**
 * ShareIntentSheet
 *
 * Mobile-only PDP bottom sheet, opened by useShareIntent when a shopper shows
 * save/send intent (copying the name, SKU or price, or long-pressing a product
 * image). Offers the thing they were about to do by hand - send this exact
 * design to someone - in one tap.
 *
 * Copy leans on "get an opinion" rather than "share", because on a PDP the
 * motive for sending a ring to someone is almost always asking what they think.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Share2, X } from "lucide-react";

const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.015-.52-.075-.148-.669-1.611-.916-2.207-.244-.579-.49-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

/**
 * The headline mirrors what the shopper actually grabbed, so the sheet reads as
 * a response to them rather than a generic interruption.
 */
const INTENT_COPY = {
  product_image: {
    eyebrow: "Saving this photo?",
    headline: "Send the design instead",
    sub: "A photo loses the price and the details. Share the link and they see everything.",
  },
  sku: {
    eyebrow: "That's the design code",
    headline: "Send the full design",
    // Deliberately makes no claim about the clipboard: the text-copy path
    // enriches it, the Copy SKU button leaves it alone. The disclosure line at
    // the foot of the sheet is what reports enrichment, and only when it
    // actually happened.
    sub: "The code alone won't open anything. Send the link and they see the exact piece.",
  },
  price: {
    eyebrow: "Comparing notes?",
    headline: "Send it across",
    sub: "Price, metal and diamond details travel with the link.",
  },
  product_name: {
    eyebrow: "Want a second opinion?",
    headline: "Send this to someone",
    sub: "They'll see the exact design, size and price you're looking at.",
  },
  other_text: {
    eyebrow: "Want a second opinion?",
    headline: "Send this to someone",
    sub: "They'll see the exact design, size and price you're looking at.",
  },
};

export default function ShareIntentSheet({
  isOpen,
  onClose,
  intent,
  product,
  sku,
  price,
  comparePrice,
  image,
  shareUrl,
  onShare,
}) {
  const [copied, setCopied] = useState(false);
  // Rendered by React rather than injected on demand: document.body is this
  // sheet's portal container, and appending to it mid-interaction makes React's
  // own child cleanup fail with a removeChild NotFoundError.
  const fallbackFieldRef = useRef(null);

  const productTitle = product?.title;

  // Reset on dismissal instead of on open, so no effect has to call setState.
  const handleClose = useCallback(() => {
    setCopied(false);
    onClose?.();
  }, [onClose]);

  // Lock the page behind the sheet so a drag on the backdrop doesn't scroll the
  // PDP underneath.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const copy = INTENT_COPY[intent?.signal] || INTENT_COPY.product_name;

  const shareMessage = useMemo(
    () =>
      [
        "Found this at Lucira - what do you think?",
        "",
        productTitle,
        price ? `₹${price}` : null,
        shareUrl,
      ]
        .filter(Boolean)
        .join("\n"),
    [productTitle, price, shareUrl]
  );

  const handleWhatsApp = useCallback(() => {
    onShare?.("whatsapp");
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank", "noopener,noreferrer");
    handleClose();
  }, [onShare, shareMessage, handleClose]);

  const handleCopyLink = useCallback(async () => {
    onShare?.("copy_link");
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard API needs a secure, focused context - fall back to selecting
      // the hidden field React already rendered for us.
      const field = fallbackFieldRef.current;
      if (field) {
        field.select();
        document.execCommand("copy");
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [onShare, shareUrl]);

  const handleNativeShare = useCallback(async () => {
    onShare?.("native_share");
    if (!navigator.share) {
      handleCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: productTitle,
        text: "Found this at Lucira - what do you think?",
        url: shareUrl,
      });
      handleClose();
    } catch {
      // User dismissed the OS share sheet - leave ours open so they can pick
      // another channel.
    }
  }, [onShare, productTitle, shareUrl, handleClose, handleCopyLink]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px] lg:hidden"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Share this design"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 550) handleClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[20px] shadow-[0_-8px_40px_rgba(90,65,63,0.18)] lg:hidden"
          >
            {/* Grabber */}
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="h-1 w-9 rounded-full bg-[#E4DBD8]" />
            </div>

            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-3 top-3 p-1.5 rounded-full text-[#A79A97] active:bg-[#F7F3F2]"
            >
              <X size={18} />
            </button>

            <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {/* Intent-aware heading */}
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                {copy.eyebrow}
              </p>
              <h2 className="mt-1 font-abhaya text-[26px] leading-[1.15] font-semibold text-primary">
                {copy.headline}
              </h2>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-[#7A6B68]">{copy.sub}</p>

              {/* What they're sending */}
              <div className="mt-4 flex items-center gap-3 rounded-card border border-[#EFE7E5] bg-[#FBF8F7] p-2.5">
                {image ? (
                  <Image
                    src={image}
                    alt={productTitle || "Product"}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-card object-cover bg-[#F1EDEC]"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-card bg-[#F1EDEC]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-medium leading-[1.35] text-[#3F2E2C]">
                    {productTitle}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {price && <span className="text-[13px] font-bold text-primary">₹{price}</span>}
                    {comparePrice && comparePrice !== price && (
                      <span className="text-[11px] text-[#A79A97] line-through">₹{comparePrice}</span>
                    )}
                    {sku && (
                      <span className="truncate text-[10px] uppercase tracking-wide text-[#A79A97]">
                        · {sku}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary channel - WhatsApp leads on an India-first storefront */}
              <button
                onClick={handleWhatsApp}
                className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-5 py-3.5 text-[15px] font-semibold text-white active:opacity-90 transition-opacity"
              >
                <WhatsAppIcon size={19} />
                Send on WhatsApp
              </button>

              {/* Secondary channels */}
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 rounded-full border border-[#E4DBD8] px-4 py-3 text-[13px] font-semibold text-primary active:bg-[#FBF8F7] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-success" />
                      Link copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy link
                    </>
                  )}
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 rounded-full border border-[#E4DBD8] px-4 py-3 text-[13px] font-semibold text-primary active:bg-[#FBF8F7] transition-colors"
                >
                  <Share2 size={16} />
                  More
                </button>
              </div>

              {/* Disclosure - we changed their clipboard, so we say so */}
              {intent?.linkAppended && (
                <p className="mt-3 text-center text-[11px] leading-[1.45] text-[#A79A97]">
                  We added the product link to what you copied.
                </p>
              )}
            </div>

            <textarea
              ref={fallbackFieldRef}
              value={shareUrl || ""}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute h-px w-px opacity-0"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
