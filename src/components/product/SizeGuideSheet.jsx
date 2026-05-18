"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import Link from "next/link";

const sizeData = [
  { ind: 5, us: "3", diaIn: 0.56, cirIn: 1.77 },
  { ind: 6, us: "3.5", diaIn: 0.58, cirIn: 1.82 },
  { ind: 7, us: "4", diaIn: 0.59, cirIn: 1.87 },
  { ind: 8, us: "4.5", diaIn: 0.60, cirIn: 1.89 },
  { ind: 9, us: "5", diaIn: 0.61, cirIn: 1.92 },
  { ind: 10, us: "5.5", diaIn: 0.63, cirIn: 1.97 },
  { ind: 11, us: "6", diaIn: 0.64, cirIn: 2.02 },
  { ind: 12, us: "6.5", diaIn: 0.65, cirIn: 2.04 },
  { ind: 13, us: "7", diaIn: 0.67, cirIn: 2.09 },
  { ind: 14, us: "7.5", diaIn: 0.68, cirIn: 2.14 },
  { ind: 15, us: "8", diaIn: 0.69, cirIn: 2.16 },
  { ind: 16, us: "8.5", diaIn: 0.70, cirIn: 2.21 },
  { ind: 17, us: "9", diaIn: 0.71, cirIn: 2.24 },
  { ind: 18, us: "9.5", diaIn: 0.73, cirIn: 2.29 },
  { ind: 19, us: "10", diaIn: 0.74, cirIn: 2.34 },
  { ind: 20, us: "10.5", diaIn: 0.76, cirIn: 2.39 },
  { ind: 21, us: "11", diaIn: 0.77, cirIn: 2.41 },
  { ind: 22, us: "11.5", diaIn: 0.78, cirIn: 2.46 },
  { ind: 23, us: "12", diaIn: 0.80, cirIn: 2.51 },
  { ind: 24, us: "12.5", diaIn: 0.81, cirIn: 2.56 },
  { ind: 25, us: "13", diaIn: 0.83, cirIn: 2.61 },
  { ind: 26, us: "13.5", diaIn: 0.84, cirIn: 2.63 },
];

export function SizeGuideSheet({ children }) {
  const [unit, setUnit] = useState("inch");
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const convert = (val) => {
    if (unit === "mm") return (val * 25.4).toFixed(2);
    return val.toFixed(2);
  };

  return (
    <>
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogPortal>
          <DialogOverlay className="z-9999 bg-black/60 backdrop-blur-sm" />
          <DialogContent 
            className="z-10000 sm:max-w-[800px] p-0 overflow-hidden border-none bg-black shadow-2xl"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Ring Measurement Tutorial</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-video bg-black">
              <video
                src="https://cdn.shopify.com/videos/c/o/v/b6bd45e165384f7bb50a9598b5986822.mp4"
                className="w-full h-full"
                autoPlay
                muted
                playsInline
                controls
              />
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[450px] p-0 flex flex-col overflow-hidden"
        >
          <SheetHeader className="p-6 border-b border-gray-100 flex flex-row items-center justify-between shrink-0">
            <SheetTitle className="text-2xl font-bold font-figtree">Size Guide</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
            <div 
              onClick={() => setIsVideoOpen(true)}
              className="bg-[#F8F9FA] rounded-lg flex items-center gap-4 px-4 py-2.5 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="relative w-20 h-16 bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                <Image 
                  src="/images/Sizing_A_ring_thumb.jpg" 
                  alt="Video Icon" 
                  fill 
                  className="object-cover"
                />
                <Play size={20} fill="white" className="text-white relative z-10" />
              </div>
              <span className="text-sm text-black font-medium">
                Watch this quick video to measure your ring right.
              </span>
            </div>

            <Link
              href="https://wa.me/919004435760?text=Hi,%20I%20want%20to%20book%20an%20appointment"
              target="_blank"
              className="bg-white rounded-xl flex items-center gap-4 p-3 border border-gray-100 shadow-sm"
            >
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                <Image src="/images/store.jpg" alt="Lucira store" fill className="object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900">Visit Nearest Lucira Store</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Visit Lucira store to get professionally sized.
                </p>
                <button className="text-[11px] font-bold uppercase tracking-widest text-gray-900 mt-2 border-b border-gray-900 pb-0.5">
                  BOOK APPOINTMENT
                </button>
              </div>
            </Link>

            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-bold text-gray-900">Size Guide Table</h3>
              <div className="flex gap-4 border-b border-gray-100">
                <button
                  onClick={() => setUnit("inch")}
                  className={`pb-2 text-sm font-medium transition-all relative ${
                    unit === "inch" ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  inch
                  {unit === "inch" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
                </button>
                <button
                  onClick={() => setUnit("mm")}
                  className={`pb-2 text-sm font-medium transition-all relative ${
                    unit === "mm" ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  mm
                  {unit === "mm" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
                </button>
              </div>

              <div className="w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-sm font-bold text-gray-900 border-b border-gray-100">
                      <th className="py-4">Diameter ({unit === "inch" ? "in" : "mm"})</th>
                      <th className="py-4 pl-4 border-gray-100 border-l">Circumference</th>
                      <th className="py-4 pl-4 border-gray-100 border-l">IND</th>
                      <th className="py-4 pl-4 border-gray-100 border-l">US</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sizeData.map((row, idx) => (
                      <tr key={idx} className="text-sm text-gray-900">
                        <td className="py-4">{convert(row.diaIn)}</td>
                        <td className="py-4 pl-4 border-gray-100 border-l">{convert(row.cirIn)}</td>
                        <td className="py-4 pl-4 border-gray-100 border-l">{row.ind}</td>
                        <td className="py-4 pl-4 border-gray-100 border-l">{row.us}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}