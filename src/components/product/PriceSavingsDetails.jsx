"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Image from "next/image";

export default function PriceSavingsDetails({ priceBreakup, onTabChange }) {
  if (!priceBreakup) return null;

  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold tracking-tight mb-4 uppercase tracking-wider">Price & Savings Details:</h2>

      <div className="bg-gray-50 border border-gray-100 rounded-sm p-5">
        <Tabs 
          defaultValue="price" 
          className="w-full"
          onValueChange={(value) => onTabChange?.(value)}
        >
          <TabsList className={`grid ${priceBreakup.comparison ? 'grid-cols-2' : 'grid-cols-1'} bg-gray-100 p-1 rounded-sm mb-6 w-full h-12!`}>
            <TabsTrigger 
              value="price" 
              className="flex items-center justify-center gap-2 text-[13px] font-bold data-[state=active]:bg-tertiary data-[state=active]:text-white rounded-sm transition-all h-full hover:cursor-pointer uppercase tracking-tight"
            >
              Price Breakup
            </TabsTrigger>
            {priceBreakup.comparison && (
              <TabsTrigger 
                value="comparison" 
                className="flex items-center justify-center gap-2 text-[13px] font-bold data-[state=active]:bg-tertiary data-[state=active]:text-white rounded-sm transition-all h-full hover:cursor-pointer uppercase tracking-tight"
              >
                Comparison
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="price" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {priceBreakup.price?.map((item, index) => (
                <PriceRow 
                  key={index} 
                  label={item.label} 
                  value={item.value} 
                  oldValue={item.oldValue} 
                  discount={item.discount}
                />
              ))}
              
              <div className="flex justify-between items-center pt-5 border-t border-gray-200 mt-4">
                <span className="text-base font-bold text-gray-900 uppercase">Grand Total</span>
                <span className="text-lg font-bold text-gray-900">{priceBreakup.grand_total}</span>
              </div>
            </motion.div>
          </TabsContent>

          {priceBreakup.comparison && (
            <TabsContent value="comparison" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">Attributes</div>
                  <div className="text-xs font-bold text-gray-900 uppercase tracking-widest text-center leading-tight">Lucira<br/>Grown</div>
                  <div className="text-xs font-bold text-gray-900 uppercase tracking-widest text-center leading-tight">Mined<br/>Diamond</div>
                </div>

                <ComparisonRow label="Price" lucira={priceBreakup.comparison?.price?.lucira} mined={priceBreakup.comparison?.price?.mined} isPrice />
                <ComparisonRow label="Carat" lucira={priceBreakup.comparison?.carat} mined={priceBreakup.comparison?.carat} />
                <ComparisonRow label="Clarity" lucira={priceBreakup.comparison?.clarity?.lucira} mined={priceBreakup.comparison?.clarity?.mined} />
                <ComparisonRow label="Color" lucira={priceBreakup.comparison?.color?.lucira} mined={priceBreakup.comparison?.color?.mined} />

                <div className="grid grid-cols-3 gap-4 pt-4 mt-2 bg-[#F0F7F4] -mx-5 px-5 py-4 border-t border-[#D5E6DE]">
                  <div className="text-sm font-bold text-gray-900 uppercase pt-0.5">Total Saving</div>
                  <div className="text-base font-bold text-[#1E7D4E] text-center">{priceBreakup.comparison?.savings}</div>
                  <div className="text-base font-bold text-gray-400 text-center">₹ 0</div>
                </div>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
    </div>
  );
}

function ComparisonRow({ label, lucira, mined, isPrice }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <div className="text-sm font-semibold text-gray-500">{label}</div>
      <div className={`text-sm font-bold text-center ${isPrice ? 'text-gray-900' : 'text-gray-900'}`}>{lucira}</div>
      <div className={`text-sm font-bold text-center ${isPrice ? 'text-gray-900' : 'text-gray-900'}`}>{mined}</div>
    </div>
  );
}

function PriceRow({ label, value, oldValue, isSaving, discount }) {
  return (
    <div className="flex justify-between items-center text-[13px] border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span className="text-gray-600 font-medium">{label}</span>
        {discount && (
          <span className="bg-[#E3F5E0] text-[#1E7D4E] text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap uppercase">
            {discount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {oldValue && (
          <span className="text-gray-400 line-through font-bold">{oldValue}</span>
        )}
        <span className={`font-bold ${isSaving ? 'text-[#1E7D4E]' : 'text-gray-900'}`}>{value}</span>
      </div>
    </div>
  );
}
