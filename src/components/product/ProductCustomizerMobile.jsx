"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, X, ChevronRight } from "lucide-react";
import { Sheet } from "react-modal-sheet";
import { SizeGuideMobile } from "./SizeGuideMobile";
import { useSelector } from "react-redux";

export function ProductCustomizerMobile({
  activeColor,
  activeKarat,
  selectedSize,
  handleGoldSelection,
  handleSizeSelection,
  availableSizes,
  product,
  isColorInStock,
  isSizeInStock,
  nearestStore,
  availableStores,
  availableStoreCount,
  deliveryInfo,
  getStoreDisplayName,
  currentPrice,
  currentComparePrice
}) {
  const [isOpen, setIsOpen] = useState(false);
  const collectionContext = useSelector((state) => state.user.collectionContext);

  const getGoldColor = (metal) => {
    const lowerMetal = metal.toLowerCase();
    if (lowerMetal.includes("yellow") && lowerMetal.includes("white")) {
      return "linear-gradient(to right, #c59922 50%, #dfdfdf 50%)";
    }
    if (lowerMetal.includes("rose") && lowerMetal.includes("white")) {
      return "linear-gradient(to right, #f2b5b5 50%, #dfdfdf 50%)";
    }
    if (metal.includes("White")) return "linear-gradient(143.06deg, #dfdfdf 29.61%, #f3f3f3 48.83%, #dfdfdf 66.43%)";
    if (metal.includes("Rose")) return "linear-gradient(154.36deg, #f2b5b5 10.36%, #f8dbdb 68.09%)";
    return "linear-gradient(147.45deg, #c59922 17.98%, #ead59e 48.14%, #c59922 83.84%)";
  };

  const combinations = [];
  product.variants?.forEach((v) => {
    const karat = v.metafields?.metal_purity || String(v.color || v.title || "").split(" ")[0];
    const metal = v.metafields?.metal_color || String(v.color || v.title || "").split(" ").slice(1).join(" ");
    
    if (karat && metal && !combinations.find((c) => c.karat === karat && c.metal === metal)) {
      combinations.push({ karat, metal });
    }
  });

  const handles = product.collectionHandles || [];
  const isStrict9kt = collectionContext === "9kt-collection" &&
    handles.includes("9kt-collection") &&
    !handles.some(h => h !== "9kt-collection" && h !== "all" && h !== product.type?.toLowerCase() &&
      ["sports-collection", "cotton-candy", "hexa-collection", "solitaire-collection"].includes(h));

  const karatOrder = ["9KT", "14KT", "18KT"];
  const metalOrder = ["Yellow Gold", "Rose Gold", "White Gold"];

  combinations.sort((a, b) => {
    const aKaratVal = parseInt(String(a.karat).replace(/\D/g, ""), 10) || 0;
    const bKaratVal = parseInt(String(b.karat).replace(/\D/g, ""), 10) || 0;

    if (aKaratVal !== bKaratVal) return aKaratVal - bKaratVal;
    
    const aMetalIdx = metalOrder.findIndex(m => a.metal.toLowerCase().includes(m.split(" ")[0].toLowerCase()));
    const bMetalIdx = metalOrder.findIndex(m => b.metal.toLowerCase().includes(m.split(" ")[0].toLowerCase()));
    
    return (aMetalIdx === -1 ? 99 : aMetalIdx) - (bMetalIdx === -1 ? 99 : bMetalIdx);
  });

  return (
    <div className="space-y-4 mt-4 lg:hidden">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
          SIZE & CUSTOMIZATION
        </h3>
        <SizeGuideMobile nearestStore={nearestStore} availableStores={availableStores} availableStoreCount={availableStoreCount} deliveryInfo={deliveryInfo} getStoreDisplayName={getStoreDisplayName}>
          <button className="text-sm font-medium text-[#A67C7C] hover:cursor-pointer">
            Size Guide
          </button>
        </SizeGuideMobile>
      </div>

      <div className="border border-gray-200 rounded-2xl p-4 bg-white">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full border border-gray-100 shadow-inner`}
              style={{ background: getGoldColor(activeColor) }}
            ></div>
            <span className="text-sm font-medium text-gray-900">
              {activeKarat} {activeColor?.includes("-") ? activeColor.replace(" Gold", "") : activeColor}
            </span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="text-sm font-medium text-gray-900">
            Size : {selectedSize} IND
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(true)}
          className="w-full py-3 bg-tertiary rounded-sm text-white font-bold text-sm uppercase tracking-widest"
        >
          CUSTOMIZE
        </button>

        <Sheet 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          detents={[0.9, 0.5]}
        >
          <Sheet.Container>
            <Sheet.Header />
            <Sheet.Content>
              <div className="px-6 pb-8 flex flex-col h-full">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h2 className="text-lg font-bold">Customize</h2>
                  <button onClick={() => setIsOpen(false)} className="p-2">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="mt-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  <div className="flex items-center justify-start gap-4 mb-6">
                    <span className="text-2xl font-bold">&#8377;{currentPrice}</span>
                    <span className="text-lg text-gray-500 line-through font-medium">&#8377;{currentComparePrice}</span>
                  </div>
                  {/* Gold Selection */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      Select Gold Color & Karat:{" "}
                      <span className="text-gray-600 normal-case font-medium ml-1">
                        {activeKarat} {activeColor?.includes("-") ? activeColor.replace(" Gold", "") : activeColor}
                      </span>
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {combinations.map(({ karat, metal }) => {
                        const normalize = (s) => String(s || "").toLowerCase().replace(/kt/g, "k").trim();
                        const isActive = normalize(activeColor) === normalize(metal) && normalize(activeKarat) === normalize(karat);

                        return (
                          <div
                            key={`${karat}-${metal}`}
                            onClick={() => handleGoldSelection(metal, karat)}
                            className={`border rounded-xl py-3 px-2 cursor-pointer relative flex flex-col items-center gap-3 transition-all ${
                              isActive
                                ? "border-black bg-white ring-1 ring-black shadow-sm"
                                : "border-gray-200 bg-[#F9F9F9]"
                            }`}
                          >
                            {isColorInStock(metal, karat) && (
                              <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#2DB36F]"></span>
                            )}
                            <div
                              className={`w-7 h-7 rounded-full border border-gray-100 shadow-inner`}
                              style={{ background: getGoldColor(metal) }}
                            ></div>
                            <div className="text-[11px] text-center text-black leading-tight uppercase font-bold flex flex-col gap-0.5">
                              <span>{parseInt(String(karat).replace(/\D/g, ""), 10)}KT</span>
                              <span>{metal.includes("-") ? metal.replace(" Gold", "") : metal}</span>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ring Size */}
                  {availableSizes.length > 0 &&
                    availableSizes[0] !== null &&
                    availableSizes[0] !== undefined && (
                      <div className="space-y-4 pb-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold uppercase tracking-wider">
                            Select {(product.type || product.productType || "").replace(/s$/, "")} Size:{" "}
                            <span className="text-gray-600 normal-case font-medium ml-1">
                              {selectedSize} IND
                            </span>
                          </h4>
                        </div>

                        <div className={product.type === "Bracelets" ? "grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3" : "grid grid-cols-5 gap-3"}> 
                          {availableSizes.map((sizeStr) => {
                            const inStock = isSizeInStock(sizeStr);
                            return (
                              <button
                                key={`size-${sizeStr}`}
                                onClick={() => handleSizeSelection(sizeStr)}
                                className={`relative border rounded-lg h-12 flex items-center justify-center text-sm transition-all ${
                                  sizeStr === selectedSize
                                    ? "border-black bg-white ring-1 ring-black font-bold"
                                    : "border-gray-200 bg-[#F9F9F9] font-medium"
                                }`}
                              >
                                {sizeStr}
                                {inStock && (
                                  <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-[#2DB36F] rounded-full"></span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
                
                <div className="pt-6 pb-2">
                   <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full py-4 bg-primary text-white rounded-sm font-bold text-sm uppercase tracking-widest"
                  >
                    DONE
                  </button>
                </div>
              </div>
            </Sheet.Content>
          </Sheet.Container>
          <Sheet.Backdrop onClick={() => setIsOpen(false)} />
        </Sheet>
      </div>
    </div>
  );
}
