"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="bg-black text-white text-sm">
      <div className="page-width flex items-center justify-between py-2">

        <ChevronLeft size={16} />

        <p className="flex items-center gap-2">
          🪙 Free Gold Coin on orders over ₹15,000
        </p>

        <ChevronRight size={16} />

      </div>
    </div>
  );
}