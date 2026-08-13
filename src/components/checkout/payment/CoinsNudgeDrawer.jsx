"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function CoinsNudgeDrawer({ open, onOpenChange, onProceed }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="flex flex-col max-w-sm mx-auto w-full" style={{ maxWidth: '100%' }}>
      <h3 className="font-figtree font-bold text-[18px] text-black mb-1.5" style={{ fontWeight: 600 }}>
        Get the Max Discount with Coins
      </h3>
      <p className="font-figtree text-[14px] text-[#222222]/80 mb-7" style={{ marginBottom: '18px' }}>
        Applying Lucira Coins will remove your coupon discount
      </p>

      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full bg-white border border-[#5A413F] text-[#5A413F] py-3.5 rounded-[6px] font-figtree font-medium text-[15px] transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            if (onProceed) onProceed();
          }}
          className="w-full bg-[#5A413F] text-white py-3.5 rounded-[6px] font-figtree font-medium text-[15px] transition-colors hover:bg-[#4A312F]"
        >
          Proceed
        </button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-white border-none rounded-[16px] [&>button]:hidden z-[2000]">
          <DialogTitle className="sr-only">Get the Max Discount with Coins</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white px-6 pb-8 pt-4 rounded-t-[20px] [&>div:first-child]:hidden z-[2000]">
        {content}
      </DrawerContent>
    </Drawer>
  );
}
