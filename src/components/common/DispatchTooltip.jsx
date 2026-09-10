"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

const GUTTER = 10;
const OFFSET = 8;

/**
 * The bubble renders inside a body portal with fixed viewport coordinates to prevent
 * clipping from overflow-hidden ancestors (such as cart item cards) and guarantees
 * it stays fully visible across all mobile, tablet, and desktop screen sizes.
 */
export default function DispatchTooltip({ text, align = "center", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const bubbleRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const position = useCallback(() => {
    const button = buttonRef.current;
    const bubble = bubbleRef.current;
    if (!button || !bubble) return;

    const anchor = button.getBoundingClientRect();
    if (!anchor.width && !anchor.height) {
      setIsOpen(false);
      return;
    }

    const { width, height } = bubble.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left;
    if (align === "right") {
      left = anchor.right - width;
    } else if (align === "left") {
      left = anchor.left;
    } else if (align === "auto") {
      const anchorCenterX = anchor.left + anchor.width / 2;
      if (anchorCenterX > vw * 0.65) {
        left = anchor.right - width;
      } else if (anchorCenterX < vw * 0.35) {
        left = anchor.left;
      } else {
        left = anchorCenterX - width / 2;
      }
    } else {
      // "center"
      left = anchor.left + anchor.width / 2 - width / 2;
    }

    // Clamp horizontally to stay within viewport bounds
    const maxLeft = Math.max(GUTTER, vw - width - GUTTER);
    left = Math.min(Math.max(left, GUTTER), maxLeft);

    // Position above by default; flip below if there's no room above
    let top = anchor.top - height - OFFSET;
    let below = false;
    if (top < GUTTER) {
      const flipped = anchor.bottom + OFFSET;
      if (flipped + height <= vh - GUTTER) {
        top = flipped;
        below = true;
      } else {
        top = GUTTER;
      }
    }

    const anchorCenter = anchor.left + anchor.width / 2;
    const arrowPos = anchorCenter - left;
    const arrow = Math.min(Math.max(arrowPos, 12), Math.max(width - 12, 12));

    setCoords({
      top,
      left,
      below,
      arrow,
    });
  }, [align]);

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [isOpen, position]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  if (!text) return null;

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="text-current hover:opacity-75 transition-opacity cursor-pointer inline-flex items-center justify-center p-0.5 rounded focus:outline-none"
        aria-label="Dispatch details"
      >
        <Info size={15} className="shrink-0" />
      </button>

      {isOpen && mounted &&
        createPortal(
          <span
            ref={bubbleRef}
            role="tooltip"
            style={{
              top: coords ? coords.top : 0,
              left: coords ? coords.left : 0,
              maxWidth: `calc(100vw - ${GUTTER * 2}px)`,
            }}
            className={`fixed z-[9999] w-max max-w-[18rem] sm:max-w-[20rem] px-3.5 py-2 bg-[#1C1810] text-white text-[11px] sm:text-[12px] font-figtree font-medium rounded-lg shadow-2xl border border-white/10 pointer-events-none leading-snug tracking-normal transition-opacity duration-150 ${
              coords ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          >
            {text}
            <span
              style={{ left: coords ? coords.arrow : "50%" }}
              className={`absolute -translate-x-1/2 border-solid border-x-transparent border-x-[5px] w-0 h-0 pointer-events-none ${
                coords && coords.below
                  ? "bottom-full border-b-[#1C1810] border-b-[6px] border-t-0"
                  : "top-full border-t-[#1C1810] border-t-[6px] border-b-0"
              }`}
            />
          </span>,
          document.body
        )}
    </span>
  );
}
