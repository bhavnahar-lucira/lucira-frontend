"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function CollectionSection ({ title, subtitle, tabs = [], children, page, colCat, colLink, onTabChange, loading }) {
  const [activeTab, setActiveTab] = useState(tabs[0] || "");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <section className="w-full bg-white overflow-hidden pt-6 md:pt-15">
      <div className="container-main">
        {(title || subtitle) && (
          <div className="mb-1">
            {title && <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">{title}</h2>}
            {subtitle && <p className="text-sm md:text-base text-zinc-600">{subtitle}</p>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 md:gap-8 mb-6 md:mb-4.5 text-sm md:text-base overflow-x-auto no-scrollbar border-b border-zinc-50 md:border-none pb-2 md:pb-0 mt-4">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => handleTabClick(tab)}
              className={`relative pb-2 whitespace-nowrap capitalize font-normal cursor-pointer transition-all ${
                activeTab === tab ? "text-black" : "text-black hover:text-zinc-800"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-900"></div>
              )}
            </button>
          ))}
        </div>
        <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          {children}
        </div>

        {page === "home" && colCat && colLink && (
          <Link href={colLink} className="flex justify-center mt-4 md:mt-2">
            <Button className="w-fit md:w-auto px-7 py-3 h-auto text-sm md:text-base font-bold uppercase rounded-sm bg-primary hover:bg-[#4A3934] text-white transition-colors">
              {colCat}
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
