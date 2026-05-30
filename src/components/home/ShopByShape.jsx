"use client";

import { useState } from "react";
import LazyImage from "../common/LazyImage";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SHAPES = [
  { name: "Round", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Round.png" },
  { name: "Pear", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Pear.png" },
  { name: "Emerald", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Emerald.png" },
  { name: "Cushion", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Cushion.png" },
  { name: "Princess", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Princess.png" },
  { name: "Rose", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Rose.png" },
  { name: "Marquise", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Marquise.png" },
  { name: "Heart", icon: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_Heart.png" },
];

export default function ShopByShape() {
  const [activeTab, setActiveTab] = useState("shape");

  return (
    <section className="w-full py-16 bg-[#FAFAFA]">
      <div className="max-w-480 mx-auto px-6 md:px-17">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-medium mb-8">Shop By</h2>

          <div className="flex justify-center gap-4 mb-12">
            <Button
              variant={activeTab === "shape" ? "default" : "outline"}
              className={`h-12 px-10 rounded-full transition-all duration-300 ${activeTab === "shape" ? "bg-black text-white" : "border-gray-200 text-gray-500 hover:border-black hover:text-black"}`}
              onClick={() => setActiveTab("shape")}
            >
              By Shape
            </Button>
            <Button
              variant={activeTab === "style" ? "default" : "outline"}
              className={`h-12 px-10 rounded-full transition-all duration-300 ${activeTab === "style" ? "bg-black text-white" : "border-gray-200 text-gray-500 hover:border-black hover:text-black"}`}
              onClick={() => setActiveTab("style")}
            >
              By Style
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-8 items-center justify-items-center">
          {SHAPES.map((shape, index) => (
            <Link
              key={index}
              href={`/collections/all?shape=${shape.name.toLowerCase()}`}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-20 h-20 relative flex items-center justify-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                <LazyImage
                  src={shape.icon}
                  alt={shape.name}
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <span className="text-xs uppercase font-bold tracking-widest text-gray-400 group-hover:text-black transition-colors">
                {shape.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
