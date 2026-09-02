"use client";

/**
 * ShareIntentSheet
 *
 * Mobile-only PDP bottom sheet, opened by useShareIntent when a shopper shows
 * save/send intent (copying the name, SKU or price, or long-pressing a product
 * image). Offers the thing they were about to do by hand - keep this design, or
 * send it to someone - in one tap.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Only used if SalesIQ has not loaded yet - same number and message shape the
// floating action button and AtcBar already use, so the shopper still lands in
// an existing thread rather than nowhere.
const EXPERT_WHATSAPP_NUMBER = "919004435760";

// The clipboard fallback field is looked up by id rather than held in a ref:
// the action list is built during render, and a ref read reachable from it trips
// the React Compiler's "no ref access during render" rule.
const FALLBACK_FIELD_ID = "share-intent-copy-fallback";

const ICON = {
  wishlist:
    "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/wishlist_fe19cf42-26e2-4836-ba0f-6be7582ccf14.png?v=1785913660",
  expertChat:
    "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/expert_chat.png?v=1785913660",
  whatsapp:
    "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/whatsapp_45d2f6e8-fb16-45dd-b4ef-5110ab7090b6.png?v=1785913660",
  copyLink:
    "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/copy_link.png?v=1785913660",
  more: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/more.png?v=1785913660",
};

export default function ShareIntentSheet({
  isOpen,
  onClose,
  intent,
  product,
  price,
  comparePrice,
  image,
  shareUrl,
  onShare,
  isWishlisted = false,
  onToggleWishlist,
}) {
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = useCallback(async () => {
    onShare?.("copy_link");
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard API needs a secure, focused context - fall back to selecting
      // the hidden field React already rendered for us. Rendered by React rather
      // than injected on demand: document.body is this sheet's portal container,
      // and appending to it mid-interaction makes React's own child cleanup fail
      // with a removeChild NotFoundError.
      const field = document.getElementById(FALLBACK_FIELD_ID);
      if (field) {
        field.select();
        document.execCommand("copy");
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [onShare, shareUrl]);

  const handleWhatsApp = useCallback(() => {
    onShare?.("whatsapp");
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank", "noopener,noreferrer");
    handleClose();
  }, [onShare, shareMessage, handleClose]);

  const handleExpertChat = useCallback(() => {
    onShare?.("expert_chat");

    // Opens the Zoho SalesIQ live chat. visible("show") is the call the floating
    // action button and CartContact already use - it reveals the widget - and
    // open() then opens the conversation itself, so the tap lands in the chat
    // rather than just un-hiding a launcher. Wrapped because both come from a
    // third-party script we do not control.
    const floatwindow = window.$zoho?.salesiq?.floatwindow;
    if (floatwindow) {
      try {
        floatwindow.visible("show");
        floatwindow.open?.();
      } catch {
        // Zoho API changed shape - the sheet still closes, no dead end.
      }
    } else {
      // SalesIQ script has not finished loading - send them to the WhatsApp
      // expert thread rather than leaving the tap dead.
      const message = `Hi, I want to get more information about this product: ${productTitle || ""}`;
      window.open(
        `https://wa.me/${EXPERT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }

    // Closed either way, so the chat window is not left behind this sheet.
    handleClose();
  }, [onShare, productTitle, handleClose]);

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

  const handleWishlist = useCallback(() => {
    onShare?.("wishlist");
    // Stays open on purpose: saving is not sharing, so the shopper may well
    // want a channel next.
    onToggleWishlist?.();
  }, [onShare, onToggleWishlist]);

  // Order mirrors the approved design: keep-it actions first, then channels.
  const actions = [
    {
      key: "wishlist",
      label: isWishlisted ? "Saved" : "Wishlist",
      bg: "#F9665E",
      icon: ICON.wishlist,
      onClick: handleWishlist,
    },
    {
      key: "expert_chat",
      label: "Expert Chat",
      bg: "#79A0CB",
      icon: ICON.expertChat,
      onClick: handleExpertChat,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      bg: "#29A319",
      icon: ICON.whatsapp,
      onClick: handleWhatsApp,
    },
    {
      key: "copy_link",
      label: copied ? "Copied!" : "Copy Link",
      bg: "#C27FD8",
      icon: ICON.copyLink,
      onClick: handleCopyLink,
    },
    {
      key: "more",
      label: "More",
      bg: "#B2B8B7",
      icon: ICON.more,
      onClick: handleNativeShare,
    },
  ];

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
            aria-label="Share this product"
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
            className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[22px] shadow-[0_-8px_40px_rgba(90,65,63,0.18)] font-figtree lg:hidden"
          >
            {/* Header row: the grabber and the close control share it, so the
                close button gets its own band instead of floating over the
                product card that starts immediately below. Fixed height keeps
                the 28px tap target fully inside the row. */}
            <div className="relative flex h-9 items-start justify-center pt-2.5">
              <span className="h-1 w-9 rounded-full bg-[#DFD8D6]" />

              {/* Kept even though the mockup omits it: the grabber is the only
                  other affordance and it is not reachable by a screen reader.
                  right-2.5 lines the icon up with the 16px content gutter. */}
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute right-2.5 top-1 flex h-7 w-7 items-center justify-center rounded-full text-[#B5ABA8] active:bg-[#F7F3F2]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-1">
              {/* What they're about to send */}
              <div className="flex items-center gap-3 rounded-[10px] border border-[#EFE7E5] bg-[#FDFBFA] p-2.5">
                {image ? (
                  <Image loader={shopifyLoader}
                    src={image}
                    alt={productTitle || "Product"}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover bg-white"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-[#F1EDEC]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-[1.3] text-[#2E2422]">
                    {productTitle}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    {price && (
                      <span className="text-[15px] font-bold text-[#2E2422]">₹{price}</span>
                    )}
                    {comparePrice && comparePrice !== price && (
                      <span className="text-[12.5px] font-medium text-[#A79A97] line-through">
                        ₹{comparePrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="mt-4 text-[15px] font-bold tracking-[-0.01em] text-[#2E2422]">
                Share this Product
              </h2>

              {/* Action tiles */}
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={action.onClick}
                    aria-label={action.label}
                    className="flex flex-col items-center gap-1.5 rounded-lg pb-0.5 active:opacity-70 transition-opacity"
                  >
                    <span
                      className="flex h-[60px] w-[60px] items-center justify-center rounded-[15px]"
                      style={{ backgroundColor: action.bg }}
                    >
                      {/* eager, not lazy: these mount while the sheet is still
                          sliding up from below the fold, so a lazy loader defers
                          them and the tiles arrive empty.

                          unoptimized: the source PNGs are already icon-sized
                          (39-52px), and the optimizer returns them at half that
                          even when asked for a larger width, which renders soft.
                          Serving the originals costs nothing at this size and
                          keeps every available pixel. */}
                      <Image
                        src={action.icon}
                        alt=""
                        width={28}
                        height={28}
                        loading="eager"
                        unoptimized
                        className="h-7 w-7 object-contain"
                      />
                    </span>
                    <span className="text-[10.5px] font-medium leading-tight text-[#4A3C39] text-center">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Disclosure - we changed their clipboard, so we say so */}
              {intent?.linkAppended && (
                <p className="mt-3 text-center text-[10.5px] leading-[1.45] text-[#A79A97]">
                  We added the product link to what you copied.
                </p>
              )}
            </div>

            <textarea
              id={FALLBACK_FIELD_ID}
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
