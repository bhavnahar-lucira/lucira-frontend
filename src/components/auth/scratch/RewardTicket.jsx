"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const LOGO_SRC = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/logo.svg";

// Punches the two half-circle notches at the perforation line (47% down).
const NOTCH_MASK =
  "radial-gradient(circle at 0 47%, transparent 11px, #000 11.5px) left / 51% 100% no-repeat," +
  "radial-gradient(circle at 100% 47%, transparent 11px, #000 11.5px) right / 51% 100% no-repeat";

function useCountUp(target, run) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return run ? value : target;
}

/**
 * The Lucira reward ticket from the Figma frames. `mode`:
 *  - "won"      → "You Won ₹X OFF / on Your Next Purchase"
 *  - "reveal"   → "You Have Already Won ₹X OFF / Enter OTP to Reveal your Code"
 *  - "reactivate" → same, "…to Reactivate your Code"
 */
export function RewardTicket({ amount = 0, mode = "won", countUp = false, stamp = "" }) {
  const reduce = useReducedMotion();
  const shown = useCountUp(amount, countUp && !reduce);

  const title = mode === "won" ? "You Won" : "You Have Already Won";
  const subtitle =
    mode === "won"
      ? "on Your Next Purchase"
      : mode === "reactivate"
        ? "Enter OTP to Reactivate your Code"
        : "Enter OTP to Reveal your Code";

  return (
    <div
      className="relative w-full h-full flex flex-col rounded-[12px] overflow-hidden select-none"
      style={{ WebkitMask: NOTCH_MASK, mask: NOTCH_MASK }}
    >
      <div className="flex items-center justify-center bg-[#5a413f]" style={{ flex: "0 0 47%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt="Lucira Jewelry"
          className="w-[48%] max-w-[130px] h-auto"
          style={{ filter: "brightness(0) invert(1)" }}
          draggable={false}
        />
      </div>
      <div className="absolute left-[14px] right-[14px] border-t-2 border-dashed border-[#3a2826]" style={{ top: "47%" }} />
      <div className="flex-1 bg-white flex flex-col items-center justify-center text-center px-3">
        <p className="text-[15px] leading-tight text-[#5a413f] m-0">{title}</p>
        <p className="text-[27px] leading-tight font-semibold text-[#5a413f] m-0 mt-1 tabular-nums">
          ₹{shown} OFF
        </p>
        <p className="text-[11px] leading-tight text-[#5B5B5B] m-0 mt-1">{subtitle}</p>
      </div>

      {stamp && (
        <motion.div
          initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -18 }}
          animate={{ scale: 1, opacity: 1, rotate: -12 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.25 }}
          className="absolute right-3 bottom-3 px-2 py-0.5 border-2 border-[#16a34a] text-[#16a34a] text-[10px] font-bold tracking-[1.5px] rounded-[4px] bg-white/80"
        >
          {stamp}
        </motion.div>
      )}
    </div>
  );
}
