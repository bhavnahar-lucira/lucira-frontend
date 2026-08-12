"use client";

import { IndianRupee, TrendingUp, HeartHandshake } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const FEATURES = [
  {
    icon: IndianRupee,
    title: "Rates captured at checkout",
    description: "Gold and other rates are fixed at the time you reach checkout",
  },
  {
    icon: TrendingUp,
    title: "Protected from market fluctuations",
    description: "Your price won't change if rates move during the 10 minutes",
  },
  {
    icon: HeartHandshake,
    title: "Complete your purchase with confidence",
    description: "The protected price remains unchanged while you checkout",
  },
];

export default function PriceProtectionDrawer({ open, onOpenChange, secondsLeft = 0 }) {
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white px-6 pb-8 pt-2 rounded-t-[20px] [&>div:first-child]:hidden">
        <div className="flex flex-col items-center max-w-sm mx-auto w-full text-center">
          <div className="w-14 h-14 rounded-full bg-[#FBEFDD] flex items-center justify-center mb-4">
            <IndianRupee size={24} className="text-[#5A413F]" strokeWidth={2} />
          </div>

          <h3 className="font-figtree font-bold text-[18px] text-black mb-1.5">
            A Promise to Protect Your Price
          </h3>
          <p className="font-figtree text-[13px] text-[#222222]/70 mb-6 leading-snug">
            Your Final Price won&apos;t fluctuate as per the market for{" "}
            <span className="font-semibold text-black">{mm}:{ss} mins</span>
          </p>

          <div className="w-full space-y-5 text-left mb-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FBEFDD] flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#5A413F]" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-figtree font-semibold text-[13.5px] text-black leading-tight">{title}</p>
                  <p className="font-figtree text-[12.5px] text-[#222222]/65 leading-snug mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="font-figtree text-[12px] text-[#222222]/50 mb-4">
            Complete your Payment to secure your Luxury
          </p>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#5A413F] text-white py-3.5 rounded-[6px] font-figtree font-medium text-[15px] transition-colors hover:bg-[#4A312F]"
          >
            Got It
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
