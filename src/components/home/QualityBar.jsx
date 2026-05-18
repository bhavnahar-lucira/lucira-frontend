"use client";

import { Plus } from "lucide-react";

const ITEMS = [
  "Free & Secure Shipping",
  "Quality Control & Assurance",
  "Bespoke Excellence",
  "Personalized Jewelry, Made For You",
];

export default function QualityBar() {
  return (
    <section className="w-full bg-[#F5F5F5] py-5 border-y border-gray-100">
      <div className="max-w-480 mx-auto px-6 md:px-17">
        <div className="flex flex-wrap justify-between items-center gap-6">
          {ITEMS.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Plus size={16} className="text-[#b67665]" />
              <span className="text-sm uppercase font-bold tracking-widest text-gray-900">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
