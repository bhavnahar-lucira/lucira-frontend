"use client";

import { useState } from "react";
import { ProductSlider } from "./ProductSlider";
import { Button } from "@/components/ui/button";

const DEFAULT_TABS = [
  "All", "Ring", "Earrings", "Pendant", "Bracelet", "Necklace", "Nosepins", "Bangles", "Men's Ring", "Men's Stud", "Men's Bracelet"
];

export default function TabbedProductSlider({ title, subtitle, tabs = DEFAULT_TABS, products }) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  // In a real app, we would filter products based on the activeTab
  // For now, we'll just show the same products for all tabs
  const filteredProducts = products; 

  return (
    <section className="w-full bg-white pt-16">
      <div className="max-w-480 mx-auto px-6 md:px-17">
        <div className="mb-8">
          {title && <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-gray-500 text-lg">{subtitle}</p>}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-10 overflow-x-auto no-scrollbar pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <ProductSlider products={filteredProducts} />

      <div className="flex justify-center mt-12 mb-16">
        <Button 
          variant="outline" 
          className="h-12 px-10 rounded-sm border-[#5C453F] text-[#5C453F] text-xs font-bold tracking-widest hover:bg-[#5C453F] hover:text-white transition-all uppercase"
        >
          VIEW ALL {title?.toUpperCase()}
        </Button>
      </div>
    </section>
  );
}
