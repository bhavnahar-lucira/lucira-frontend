"use client";

import { Info } from "lucide-react";

export default function PriceProtectionTimer({ secondsLeft = 0, onInfoClick, className = "" }) {
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className={`flex items-center justify-between gap-2 bg-[#FBEFDD] px-4 py-[12px] ${className}`}>
      <span className="font-figtree text-[1rem] leading-none font-normal tracking-normal text-[#3D2B28]">
        Price Protection active for <span className="font-semibold text-[#5A413F]">{mm}:{ss}</span> mins
      </span>
      <button
        type="button"
        onClick={onInfoClick}
        className="shrink-0 text-[#3D2B28]/80 cursor-pointer"
        aria-label="About price protection"
      >
        <Info size={15} />
      </button>
    </div>
  );
}
