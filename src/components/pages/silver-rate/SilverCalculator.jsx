"use client";

import { useState, useMemo } from "react";

const PURITIES = [
  { label: "999", value: 999 },
  { label: "958", value: 958 },
  { label: "925", value: 925 },
];

export default function SilverCalculator({ cityName, baseRate }) {
  const [activePurity, setActivePurity] = useState(999);
  const [weight, setWeight] = useState(1);
  const [includeGST, setIncludeGST] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const perGramRate = useMemo(() => {
    const rate999 = baseRate / 10;
    if (activePurity === 999) return rate999;
    return rate999 * (activePurity / 999);
  }, [baseRate, activePurity]);

  const silverPrice = perGramRate * weight;
  const cgst = silverPrice * 0.015;
  const sgst = silverPrice * 0.015;
  const totalGST = cgst + sgst;
  const finalAmount = includeGST ? silverPrice + totalGST : silverPrice;

  return (
    <section className="py-8 md:py-10 bg-[#FAF3EC]/30">
      <div className="container-main">
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-[18px] md:text-[28px] font-medium text-zinc-900 uppercase tracking-tight font-abhaya">
            Silver Price Calculator
          </h2>
          <p className="text-zinc-500 font-figtree tracking-wider uppercase text-[14px] md:text-[18px]">
            Real-time Estimates for {cityName}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-stretch">
          <div className="flex-1 w-full bg-white p-6 md:p-12 rounded-[2rem] shadow-sm border border-zinc-100">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-4 md:mb-6 font-figtree">1. Choose Purity</p>
            <div className="flex bg-zinc-50 p-1 rounded-2xl gap-1 mb-8 md:mb-10">
              {PURITIES.map((k) => (
                <button
                  key={k.value}
                  onClick={() => setActivePurity(k.value)}
                  className={`flex-1 py-3 md:py-4 text-[10px] md:text-sm rounded-xl transition-all font-figtree tracking-widest uppercase ${activePurity === k.value
                    ? "bg-primary text-white shadow-md font-bold"
                    : "text-zinc-400 hover:text-zinc-600"
                    }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 font-figtree">2. Weight in Grams</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    placeholder="Enter Weight"
                    className="w-full h-14 md:h-16 border-2 border-zinc-100 rounded-2xl px-5 md:px-6 text-zinc-900 font-bold font-figtree focus:outline-none focus:border-primary transition-all text-lg md:text-xl"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 font-figtree">Current {activePurity} Rate</label>
                <div className="w-full h-16 bg-zinc-50 border-2 border-zinc-50 rounded-2xl px-6 flex items-center text-zinc-500 font-bold font-figtree text-xl tracking-tight">
                  ₹ {perGramRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowResults(true)}
              className="w-full h-14 md:h-16 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 active:scale-[0.99] transition-all uppercase tracking-[0.2em] text-xs md:text-sm font-figtree"
            >
              Calculate Value
            </button>

            <div className="mt-10 flex bg-zinc-100/50 p-1.5 rounded-2xl gap-1.5">
              <button
                onClick={() => setIncludeGST(false)}
                className={`flex-1 py-4 text-[10px] md:text-xs rounded-xl transition-all uppercase tracking-widest font-bold font-figtree ${!includeGST
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
                  }`}
              >
                Excluding GST
              </button>
              <button
                onClick={() => setIncludeGST(true)}
                className={`flex-1 py-4 text-[10px] md:text-xs rounded-xl transition-all uppercase tracking-widest font-bold font-figtree ${includeGST
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
                  }`}
              >
                Including GST
              </button>
            </div>
          </div>

          <div className={`w-full lg:w-[450px] bg-white p-6 md:p-12 rounded-[2rem] shadow-sm border border-zinc-100 flex flex-col justify-center transition-all duration-700 ${showResults ? 'opacity-100' : 'opacity-50 blur-sm'}`}>
            <div className="space-y-8">
              <div className="text-center pb-8 border-b border-zinc-50">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400 mb-2 font-figtree">Estimated Value</p>
                <div className="h-1 w-12 bg-primary/20 mx-auto rounded-full" />
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold font-figtree">Silver Value</span>
                  <span className="font-bold text-zinc-900 font-figtree text-lg tracking-tight">₹{silverPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {includeGST && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold font-figtree">GST (3%)</span>
                      <span className="text-zinc-900 font-bold font-figtree">₹{totalGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-10 mt-10 border-t-2 border-primary/5 text-center space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold font-figtree">Final Amount {includeGST ? '(Incl. GST)' : '(Excl. GST)'}</p>
                <p className="text-[32px] md:text-[48px] font-bold text-primary font-figtree tracking-tighter">₹{Math.round(finalAmount).toLocaleString('en-IN')}</p>
              </div>

              <p className="text-[10px] text-zinc-300 uppercase tracking-widest text-center font-bold font-figtree">
                *Rates are subject to daily market changes*
              </p>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .font-abhaya { font-family: var(--font-abhaya), serif; }
        .font-figtree { font-family: var(--font-figtree), sans-serif; }
      `}</style>
    </section>
  );
}
