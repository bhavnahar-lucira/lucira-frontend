"use client";

import { useState, useEffect } from "react";

export default function PriceProtectionTimer({ onInfoClick, className = "" }) {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check session storage for existing timer
    const storedEndTime = sessionStorage.getItem("lucira_price_protection_end");
    if (storedEndTime) {
      const remaining = Math.max(0, Math.floor((parseInt(storedEndTime, 10) - Date.now()) / 1000));
      setTimeLeft(remaining);
    } else {
      // Set new end time
      sessionStorage.setItem("lucira_price_protection_end", (Date.now() + 600 * 1000).toString());
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className={`bg-[#F4E9DF] py-[14px] flex items-center justify-center gap-2.5 w-full ${className}`}>
      <span className="font-figtree text-[15px] text-[#222222]">
        Price Protection active for <span className="font-semibold text-[#5A413F] text-[16px]">{formattedTime} mins</span>
      </span>
      <button type="button" onClick={onInfoClick} className="shrink-0 pt-0.5">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#222222" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
      </button>
    </div>
  );
}
