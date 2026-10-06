"use client";

import React from "react";

export default function DgrpPdpBanner({
  advanceAmount = 0,
  monthlyEmi = 0,
  tenureMonths = 6,
  isDiamond = true,
  onClick,
}) {
  const formatPrice = (val) => {
    if (!val) return "0";
    return Number(val).toLocaleString("en-IN");
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
      className="group relative flex w-full cursor-pointer select-none items-stretch overflow-hidden rounded-[8px] bg-[#FBF3EA] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.995]"
    >
      {/* Left Voucher Body */}
      <div className="flex flex-1 items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 min-w-0">
        {/* Jewelry Padlock Icon with Keyhole & Gold Rim */}
        <div className="flex size-8.5 sm:size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5D423F] to-[#432D2B] border border-[#D4AF37]/50 shadow-xs transition-transform duration-200 group-hover:scale-105">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 sm:w-5 sm:h-5 text-[#F3C872]"
          >
            {/* Elegant Padlock Shackle */}
            <path
              d="M7.5 10V6.5C7.5 4.015 9.515 2 12 2C14.485 2 16.5 4.015 16.5 6.5V10"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            {/* Padlock Body */}
            <rect
              x="4.5"
              y="9.5"
              width="15"
              height="12"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.9"
              fill="#523A37"
            />
            {/* Keyhole */}
            <circle cx="12" cy="14.2" r="1.3" fill="currentColor" />
            <path
              d="M12 15.5V17.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Text Content */}
        <div className="min-w-0 flex-1">
          <div className="font-figtree font-semibold tracking-[0.05em] text-[#8A6A3A] uppercase text-[9px] sm:text-xs">
            LOCK AND KEY OFFER
          </div>
          <div className="my-0.5 truncate font-figtree font-semibold text-[#3B2A25] text-xs sm:text-[15px] md:text-[1.05rem] leading-tight sm:leading-snug">
            ₹{formatPrice(advanceAmount)} now + ₹{formatPrice(monthlyEmi)}/mo
          </div>
          <div className="truncate font-figtree text-[#6B5249] text-[10px] sm:text-xs">
            {isDiamond
              ? "Free diamond pendant with gold rate lock"
              : "Lock gold rate & pay in easy installments"}
          </div>
        </div>
      </div>

      {/* Right Perforated Coupon Stub */}
      <div className="flex flex-col items-center justify-center border-l-[1.5px] border-dashed border-[#D9BF9C] bg-[#F5E7D4]/60 px-2 sm:px-4 py-2 sm:py-3 min-w-[74px] sm:min-w-[104px] shrink-0 transition-colors group-hover:bg-[#F5E7D4]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="rounded-[4px] bg-[#5A413F] px-2 sm:px-3.5 py-1.5 font-figtree text-[11px] sm:text-[13px] font-medium text-[#FBF3EA] whitespace-nowrap transition-colors hover:bg-[#4A312F] cursor-pointer shadow-xs active:scale-95"
        >
          Lock rate
        </button>
      </div>
    </div>
  );
}
