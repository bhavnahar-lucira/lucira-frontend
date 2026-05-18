"use client";
import React from "react";
import { Check, X, RefreshCw, Sparkle } from "lucide-react";

export default function DiamondComparison() {
  const rows = [
    { label: "Chemically and physically a real diamond", lab: true, mined: true },
    { label: "Graded by global certification standards (cut, color, clarity, carat)", lab: true, mined: true },
    { label: "Better value for the same quality (40–70% more affordable)", lab: true, mined: false },
    { label: "Environmentally responsible and conflict-free", lab: true, mined: false },
    { label: "Durable and suitable for everyday, lifetime wear", lab: true, mined: true },
    { label: "Wider flexibility in shapes, sizes, and design options", lab: true, mined: false },
    { label: "Ethically produced without human rights concerns", lab: true, mined: false },
  ];

  const CheckIcon = () => (
    <div className="w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full flex items-center justify-center shrink-0">
      <Check size={12} className="text-white md:hidden" strokeWidth={4} />
      <Check size={14} className="text-white hidden md:block" strokeWidth={4} />
    </div>
  );

  const XIcon = () => (
    <div className="w-5 h-5 md:w-6 md:h-6 bg-primary/40 rounded-full flex items-center justify-center shrink-0">
      <X size={12} className="text-white md:hidden" strokeWidth={4} />
      <X size={14} className="text-white hidden md:block" strokeWidth={4} />
    </div>
  );

  return (
    <section className="w-full py-10 md:py-16 bg-[#FEF5F1] mt-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black text-center mb-10 md:mb-20 font-abhaya">
          Lab Grown Vs. Mined Diamonds
        </h2>

        <div className="relative">
          {/* Highlight Background (Desktop Only for visual focus) */}
          <div className="hidden lg:block absolute -top-6 -bottom-6 left-[47.5%] w-[26%] bg-white rounded-2xl border border-gray-100 shadow-sm z-0" />

          {/* Unified Grid Table */}
          <div className="grid grid-cols-[1.8fr_1fr_1fr] relative z-10 items-stretch">
            
            {/* Header */}
            <div className="pb-6 px-2 text-[11px] md:text-lg font-bold text-black uppercase tracking-wider flex items-start">
              Comparison Basis
            </div>
            <div className="pb-6 text-center text-[12px] md:text-lg font-bold text-black flex items-start justify-center px-1">
              Lab-Grown Diamond
            </div>
            <div className="pb-6 text-center text-[12px] md:text-lg font-bold text-black flex items-start justify-center px-1">
              Mined Diamond
            </div>

            {/* Table Rows */}
            {rows.map((row, i) => (
              <React.Fragment key={i}>
                <div className="py-4 md:py-6 px-2 border-t border-zinc-200 text-[12px] md:text-base lg:text-[17px] font-semibold text-black leading-tight flex items-center">
                  {row.label}
                </div>
                <div className="py-4 md:py-6 border-t border-zinc-200 flex items-center justify-center bg-white/50 lg:bg-transparent">
                  {row.lab ? <CheckIcon /> : <XIcon />}
                </div>
                <div className="py-4 md:py-6 border-t border-zinc-200 flex items-center justify-center">
                  {row.mined ? <CheckIcon /> : <XIcon />}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-9 md:mt-16 space-y-3">
          {[
            { icon: <RefreshCw size={18} />, text: "Every lab-grown diamond jewelry by Lucira comes with lifetime buyback assurance." },
            { icon: <Sparkle size={18} className="fill-black" />, text: "Lab-grown and natural diamonds are optically identical; no visible difference to the naked eye." }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-[#F5E8E2] backdrop-blur-sm rounded-sm px-5 py-4 border border-white/50">
              <div className="shrink-0 text-black">{item.icon}</div>
              <p className="text-[13px] md:text-base text-zinc-800 font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}