"use client";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ShieldCheck, TrendingUp, Shield } from "lucide-react";

export default function PriceProtectionDrawer({ open, onOpenChange }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white px-6 pb-8 pt-4 rounded-t-[20px]">
        <div className="flex flex-col items-center max-w-sm mx-auto w-full">
          <div className="w-[52px] h-[52px] rounded-full border border-[#EBE1D7] flex items-center justify-center bg-[#FDFBF9] mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3D2B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 10h6"></path><path d="M9 13h6"></path><path d="M12 16L12 8"></path></svg>
          </div>
          
          <h3 className="font-figtree font-bold text-[17px] text-black text-center mb-1.5">
            A Promise to Protect Your Price
          </h3>
          <p className="font-figtree text-[0.8125rem] text-black/60 text-center mb-8">
            Your Final Price won't fluctuate as per the market for<br/>
            <span className="font-semibold text-black">09:32 mins</span>
          </p>

          <div className="space-y-6 w-full mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-[#EBE1D7] flex items-center justify-center shrink-0 bg-[#FDFBF9]">
                <span className="font-figtree text-[15px] font-medium text-[#3D2B28]">₹</span>
              </div>
              <div className="pt-0.5">
                <h4 className="font-figtree font-bold text-[15px] text-black">Rates captured at checkout</h4>
                <p className="font-figtree text-[13px] text-black/80 leading-snug mt-0.5">Gold and other rates are fixed at the time you reach checkout</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-[#EBE1D7] flex items-center justify-center shrink-0 bg-[#FDFBF9]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </div>
              <div className="pt-0.5">
                <h4 className="font-figtree font-bold text-[15px] text-black">Protected from market fluctuations</h4>
                <p className="font-figtree text-[13px] text-black/80 leading-snug mt-0.5">Your price won't change if rates move during the 10 minutes</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-[#EBE1D7] flex items-center justify-center shrink-0 bg-[#FDFBF9]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path><path d="M12 11.5L9.5 9"></path><path d="M12 11.5L14.5 9"></path></svg>
              </div>
              <div className="pt-0.5">
                <h4 className="font-figtree font-bold text-[15px] text-black">Complete your purchase with confidence</h4>
                <p className="font-figtree text-[13px] text-black/80 leading-snug mt-0.5">The protected price remains unchanged while you checkout</p>
              </div>
            </div>
          </div>

          <p className="font-figtree text-[13px] text-black/70 text-center mb-4">
            Complete your Payment to secure your Luxury
          </p>
          
          <button 
            type="button" 
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#5A413F] hover:bg-[#4A312F] transition-colors text-white py-[14px] rounded-[6px] font-figtree font-medium text-[15px]"
          >
            Got It
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
