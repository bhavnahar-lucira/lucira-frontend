"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { IndianRupee, Gem, Search, Palette } from "lucide-react";

export default function PriceSavingsDetails({ priceBreakup, onTabChange }) {
  if (!priceBreakup) return null;

  return (
    <div className="mt-6">
      <div className="bg-[#FAF7F5] rounded-2xl p-5 border border-gray-100">
        <Tabs 
          defaultValue="price" 
          className="w-full"
          onValueChange={(value) => onTabChange?.(value)}
        >
          <TabsList className={`grid ${priceBreakup.comparison ? 'grid-cols-2' : 'grid-cols-1'} bg-white p-1 rounded-full mb-6 w-full h-auto!`}>
            <TabsTrigger 
              value="price" 
              className="flex items-center justify-center py-2.5 px-4 text-sm font-medium text-gray-500 data-[state=active]:bg-[#A87E6D] data-[state=active]:text-white rounded-full transition-all cursor-pointer"
            >
              Price Breakup
            </TabsTrigger>
            {priceBreakup.comparison && (
              <TabsTrigger 
                value="comparison" 
                className="flex items-center justify-center py-2.5 px-4 text-sm font-medium text-gray-500 data-[state=active]:bg-[#A87E6D] data-[state=active]:text-white rounded-full transition-all cursor-pointer"
              >
                Price Comparison
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="price" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
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
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-2">
                <span className="text-[15px] font-bold text-gray-900">Total</span>
                <span className="text-[15px] font-bold text-gray-900">{priceBreakup.grand_total}</span>
              </div>
            </motion.div>
          </TabsContent>

          {priceBreakup.comparison && (
            <TabsContent value="comparison" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-4">
                  
                  {/* Column 1: Labels */}
                  <div className="flex flex-col space-y-4">
                    <div className="text-[13px] font-medium text-gray-600 leading-tight border-b border-gray-200 pb-3">Diamond<br/>Comparison</div>
                    <div className="flex items-center gap-2 text-[13px] text-gray-600"><IndianRupee size={14} className="text-gray-400" /><span>Price</span></div>
                    <div className="flex items-center gap-2 text-[13px] text-gray-600"><Gem size={14} className="text-gray-400" /><span>Carat</span></div>
                    <div className="flex items-center gap-2 text-[13px] text-gray-600"><Search size={14} className="text-gray-400" /><span>Clarity</span></div>
                    <div className="flex items-center gap-2 text-[13px] text-gray-600"><Palette size={14} className="text-gray-400" /><span>Color</span></div>
                    <div className="text-[13px] font-bold text-gray-900 pt-4 mt-2 border-t border-gray-200">Total Saving</div>
                  </div>

                  {/* Column 2: Lucira Grown */}
                  <div className="flex flex-col space-y-4">
                    <div className="text-[13px] font-medium text-gray-600 leading-tight border-b border-gray-200 pb-3">Lucira Grown<br/>Diamond</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.price?.lucira}</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.carat}</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.clarity?.lucira}</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.color?.lucira}</div>
                    <div className="text-[13px] font-bold text-[#1E7D4E] pt-4 mt-2 border-t border-gray-200">{priceBreakup.comparison?.savings}</div>
                  </div>

                  {/* Column 3: Mined Diamond */}
                  <div className="flex flex-col space-y-4">
                    <div className="text-[13px] font-medium text-gray-600 leading-tight border-b border-gray-200 pb-3">Mined<br/>Diamond</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.price?.mined}</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.carat}</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.clarity?.mined}</div>
                    <div className="text-[13px] text-gray-900">{priceBreakup.comparison?.color?.mined}</div>
                    <div className="text-[13px] font-bold text-red-500 pt-4 mt-2 border-t border-gray-200">₹ 0</div>
                  </div>

                </div>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
    </div>
  );
}

function PriceRow({ label, value, oldValue, discount }) {
  return (
    <div className="flex justify-between items-center text-[13px] pb-1 gap-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-600 font-medium">{label}</span>
        {discount && (
          <span className="bg-[#1E7D4E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider">
            {discount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {oldValue && (
          <span className="text-gray-400 line-through">{oldValue}</span>
        )}
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
