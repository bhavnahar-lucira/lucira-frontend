"use client";

import React from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { Sheet as MobileSheet } from "react-modal-sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { X } from "lucide-react";

const PdpInfoSheet = ({ type, isOpen, onOpenChange }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const side = isMobile ? "bottom" : "right";

  const renderContent = () => {
    switch (type) {
      case "metal":
        return (
          <div className="space-y-8 font-figtree">
            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-4 tracking-wider uppercase">Karat</h4>
              <div className="flex gap-4">
                <figure className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257497_1_c572a805-3945-45f8-bf40-c47876e90aed.png?v=1774359387"
                    alt="9 KT Gold"
                    className="w-full h-auto object-contain rounded-lg border border-zinc-100 bg-zinc-50 p-2"
                  />
                </figure>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-4 tracking-wider uppercase">Color</h4>
              <div className="flex gap-4">
                <figure className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257497_a6e4ef63-b2e7-4278-8c32-38b167679ebd.png?v=1774433144"
                    alt="Yellow Gold"
                    className="w-full h-auto object-contain rounded-lg border border-zinc-100 bg-zinc-50 p-2"
                  />
                </figure>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-2 tracking-wider uppercase">Net Wt.</h4>
              <p className="text-[12px] lg:text-[14px] text-zinc-600 leading-relaxed">
                Net Wt. indicates only the weight of Metal from the Total Weight of the jewelry.
              </p>
            </div>
          </div>
        );
      case "dimension":
        return (
          <div className="space-y-8 font-figtree">
            <div className="pdp-sheet-section">
              <div className="grid grid-cols-2 gap-4">
                <figure className="flex flex-col items-center gap-3">
                  <h4 className="text-[14px] lg:text-[16px] font-bold font-figtree text-zinc-900 mb-1 uppercase">Height</h4>
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257497_ef0e1883-fce6-4ae5-8f5f-7d767cc4a343.png?v=1774258960"
                    alt="Height measurement"
                    className="w-full h-auto object-contain rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                  />
                </figure>
                <figure className="flex flex-col items-center gap-3">
                  <h4 className="text-[14px] lg:text-[16px] font-bold font-figtree text-zinc-900 mb-1 uppercase">Width</h4>
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257497_4df01e1c-7846-4b7d-a1ae-48e44907e308.png?v=1774258983"
                    alt="Width measurement"
                    className="w-full h-auto object-contain rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                  />
                </figure>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-2 tracking-wider uppercase">Gross Wt.</h4>
              <p className="text-[12px] lg:text-[14px] text-zinc-600 leading-relaxed">
                Gross Weight indicates the total weight of the jewelry, including the metal, diamonds, gemstones, and all other components used in the piece.
              </p>
            </div>
          </div>
        );
      case "diamond":
        return (
          <div className="space-y-8 font-figtree">
            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-4 tracking-wider uppercase">Position</h4>
              <div className="bg-[#F9F9F9] border border-zinc-100 rounded-xl p-4">
                <div className="bg-white rounded-lg p-2 w-full flex items-center justify-center">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257503_e5b7f116-3848-44e1-b838-e3691c85d5a2.png?v=1774259140"
                    alt="Diamond Position"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-4 tracking-wider uppercase">Quality</h4>
              <div className="bg-[#F9F9F9] border border-zinc-100 rounded-xl p-4">
                <div className="bg-white rounded-lg p-2 w-full flex items-center justify-center">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257505_d217c271-1e27-4513-b571-c6464e313e2b.png?v=1774259140"
                    alt="Diamond Quality"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-4 tracking-wider uppercase">Shape</h4>
              <div className="bg-[#F9F9F9] border border-zinc-100 rounded-xl p-4">
                <div className="bg-white rounded-lg p-2 w-full flex items-center justify-center">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257506_6987bc69-acbf-4dfb-b2e0-df136b4f6ed5.png?v=1774259141"
                    alt="Diamond Shapes"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-2 tracking-wider uppercase">Quantity</h4>
              <p className="text-[12px] lg:text-[14px] text-zinc-600 leading-relaxed">
                Quantity indicates the total number of Diamonds used in the jewelry.
              </p>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-2 tracking-wider uppercase">Carat</h4>
              <p className="text-[12px] lg:text-[14px] text-zinc-600 leading-relaxed">
                Carat (ct) is the standard unit of measurement used to indicate the weight of Diamonds used in the jewelry.
              </p>
            </div>
          </div>
        );
      case "gemstone":
        return (
          <div className="space-y-8 font-figtree">
            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-4 tracking-wider uppercase">Color</h4>
              <div className="bg-[#F9F9F9] border border-zinc-100 rounded-xl p-4">
                <div className="bg-white rounded-lg p-2 w-full flex items-center justify-center">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257506_1_8d9ce413-b8c0-4273-865c-f77702ff25bb.png?v=1774259280"
                    alt="Gemstone Colors"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-4 tracking-wider uppercase">Shape</h4>
              <div className="bg-[#F9F9F9] border border-zinc-100 rounded-xl p-4">
                <div className="bg-white rounded-lg p-2 w-full flex items-center justify-center">
                  <img
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257506_6987bc69-acbf-4dfb-b2e0-df136b4f6ed5.png?v=1774259141"
                    alt="Gemstone Shapes"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-2 tracking-wider uppercase">Quantity</h4>
              <p className="text-[12px] lg:text-[14px] text-zinc-600 leading-relaxed">
                Quantity indicates the total number of Gemstones used in the jewelry.
              </p>
            </div>

            <div className="pdp-sheet-section">
              <h4 className="text-[14px] lg:text-[14px] font-bold font-figtree text-zinc-900 mb-2 tracking-wider uppercase">Carat</h4>
              <p className="text-[12px] lg:text-[14px] text-zinc-600 leading-relaxed">
                Carat (ct) is the standard unit of measurement used to indicate the weight of Gemstones used in the jewelry.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "metal": return "Metal";
      case "dimension": return "Dimension";
      case "diamond": return "Diamond";
      case "gemstone": return "Gemstone";
      default: return "";
    }
  };

  if (isMobile) {
    return (
      <MobileSheet
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
        detent="content"
      >
        <MobileSheet.Container className="z-[499]">
          <MobileSheet.Header />
          <MobileSheet.Content>
            <div className="flex flex-col pb-6">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
                <h2 className="text-[15px] font-bold font-figtree text-zinc-900 uppercase tracking-widest">
                  {getTitle()}
                </h2>
                <button onClick={() => onOpenChange(false)} className="hover:bg-zinc-100 p-2 rounded-full transition-colors">
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>
              <div className="px-4 py-6">
                {renderContent()}
              </div>
            </div>
          </MobileSheet.Content>
        </MobileSheet.Container>
        <MobileSheet.Backdrop onTap={() => onOpenChange(false)} />
      </MobileSheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[450px] p-0"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="flex flex-row items-center justify-between p-6 border-b border-zinc-100 shrink-0 mt-0">
            <SheetTitle className="text-[16px] font-bold font-figtree text-zinc-900 uppercase tracking-widest mt-0">
              {getTitle()}
            </SheetTitle>
            <SheetClose className="hover:bg-zinc-100 p-2 rounded-full transition-colors">
              <X size={20} className="text-zinc-500" />
            </SheetClose>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {renderContent()}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PdpInfoSheet;
