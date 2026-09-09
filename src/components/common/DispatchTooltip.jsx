"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

export default function DispatchTooltip({ text, align = "right", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
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
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="text-[#189351] hover:text-[#106b3a] transition-colors cursor-pointer inline-flex items-center justify-center p-0.5 rounded focus:outline-none"
        aria-label="Dispatch details"
      >
        <Info size={15} className="shrink-0" />
      </button>

      {isOpen && (
        <span
          role="tooltip"
          className={`absolute bottom-full mb-2 z-[9999] px-3 py-1.5 bg-[#1C1810] text-white text-[11px] sm:text-[12px] font-normal rounded-md shadow-2xl whitespace-nowrap pointer-events-none transition-all duration-150 leading-tight ${
            align === "right"
              ? "right-0"
              : align === "left"
              ? "left-0"
              : "left-1/2 -translate-x-1/2"
          }`}
        >
          {text}
          <span
            className={`absolute top-full border-solid border-t-[#1C1810] border-t-[5px] border-x-transparent border-x-[5px] border-b-0 w-0 h-0 ${
              align === "right"
                ? "right-2"
                : align === "left"
                ? "left-2"
                : "left-1/2 -translate-x-1/2"
            }`}
          />
        </span>
      )}
    </span>
  );
}
