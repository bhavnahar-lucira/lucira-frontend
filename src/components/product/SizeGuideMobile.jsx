"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Play } from "lucide-react";
import { Sheet } from "react-modal-sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

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

export function SizeGuideMobile({ children, nearestStore, availableStores = [], availableStoreCount = 0, deliveryInfo, getStoreDisplayName  }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unit, setUnit] = useState("inch"); // 'inch' or 'cm'
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  

  const convert = (val) => {
    if (unit === "mm") return (val * 25.4).toFixed(2);
    return val.toFixed(2);
  };

  return (
    <>
      
      <div onClick={() => setIsOpen(true)} className="contents">
        {children}
      </div>

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

      <Sheet 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        detents={[0.9, 0.5]}
      >
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>
            <div className="px-6 pb-8 flex flex-col h-full">
              <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Size Guide</h2>
                <button onClick={() => setIsOpen(false)} className="p-2">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-6 space-y-8 custom-scrollbar pr-1">
                <div 
                  onClick={() => setIsVideoOpen(true)}
                  className="bg-[#F8F9FA] rounded-sm flex items-center mb-4 gap-4 px-4 py-2.5 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
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
                  className="bg-white rounded-sm mb-4 flex items-center gap-4 p-3 border border-gray-100 shadow-sm"
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
                
                {/* Ring Sizer Promo */}
                <div className="bg-white rounded-2xl flex items-center gap-4 p-4 border border-gray-100 shadow-sm hidden">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                     <Image src="/images/product/product-1.jpg" alt="Ring sizer" fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">Order Our Free Ring Sizer</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Order our free ring sizer to find your perfect fit before placing your order.</p>
                  </div>
                </div>

                {/* Size Guide Section */}
                <div className="space-y-6 pt-2">
                  <h3 className="text-lg font-bold text-gray-900">Measure Your Size</h3>
                  
                  {/* Tabs */}
                  <div className="flex gap-6 border-b border-gray-100">
                    <button 
                      onClick={() => setUnit("inch")}
                      className={`pb-3 text-sm font-bold transition-all relative ${unit === 'inch' ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                      inch
                      {unit === 'inch' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
                    </button>
                    <button 
                      onClick={() => setUnit("mm")}
                      className={`pb-3 text-sm font-bold transition-all relative ${unit === 'mm' ? 'text-gray-900' : 'text-gray-400'}`}
                    >
                      mm
                      {unit === 'mm' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
                    </button>
                  </div>

                  {/* Table */}
                  <div className="w-full overflow-x-auto pb-4">
                    <table className="w-full text-center border-collapse table-fixed">
                      <thead>
                        <tr className="text-xs font-bold text-gray-900 border-b border-gray-100">
                          <th className="py-4 px-2 font-bold">Dia ({unit === 'inch' ? 'in' : 'mm'})</th>
                          <th className="py-4 px-2 font-bold">Cir ({unit === 'inch' ? 'in' : 'mm'})</th>
                          <th className="py-4 px-2 font-bold">IND</th>
                          <th className="py-4 px-2 font-bold">US</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sizeData.map((row, idx) => (
                          <tr key={idx} className="text-sm text-gray-900 font-medium">
                            <td className="py-4 px-2">{convert(row.diaIn)}</td>
                            <td className="py-4 px-2">{convert(row.cirIn)}</td>
                            <td className="py-4 px-2 text-black font-bold">{row.ind}</td>
                            <td className="py-4 px-2">{row.us}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 pb-2">
                 <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold text-sm uppercase tracking-widest"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onClick={() => setIsOpen(false)} />
      </Sheet>
    </>
  );
}
