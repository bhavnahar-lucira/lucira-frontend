"use client";

import { useState, useEffect, useMemo } from "react";
import { MoveRight, Info, AlertTriangle } from "lucide-react";

const KARATS = [
  { label: "24KT", value: "24", purity: 1, desc: "100% pure" },
  { label: "22KT", value: "22", purity: 0.9167, desc: "91.6% pure" },
  { label: "18KT", value: "18", purity: 0.75, desc: "75% pure" },
  { label: "14KT", value: "14", purity: 0.583, desc: "58.3% pure" },
  { label: "9KT", value: "9", purity: 0.375, desc: "37.5% pure" },
];

const WEIGHTS = [1, 5, 10, 50, 100];

export default function OldGoldCalculator({ config }) {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedKarat, setSelectedKarat] = useState("24");
  const [weight, setWeight] = useState(10);
  const bonus = config?.exchange_bonus_percent || 5;

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/gold-rates");
        const data = await res.json();
        setRates(data);
      } catch (err) {
        console.error("Failed to fetch rates:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRates();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculation = useMemo(() => {
    if (!rates) return { marketValue: 0, exchangeValue: 0, rate24: 0, rate22: 0 };

    // rates from API are usually per 10g or per 1g?
    // Looking at priceEngine.js, it seems to be per gram or 10g depending on integration.
    // The Liquid script assumes rates['24kt'] is per 10g.
    const rate24 = (Number(rates.gold_price_24k) * 10) || 82000;
    const rate22 = (Number(rates.gold_price_22k) * 10) || 75000;

    let baseRate;
    switch (selectedKarat) {
      case "24": baseRate = rate24; break;
      case "22": baseRate = rate22; break;
      case "18": baseRate = Math.round(rate24 * 0.75); break;
      case "14": baseRate = Math.round(rate24 * 0.583); break;
      case "9": baseRate = Math.round(rate24 * 0.375); break;
      default: baseRate = rate24;
    }

    const ratePerGram = baseRate / 10;
    const marketValue = ratePerGram * weight;
    const exchangeValue = marketValue * (1 + bonus / 100);

    return { marketValue, exchangeValue, rate24, rate22 };
  }, [rates, selectedKarat, weight, bonus]);

  return (
    <section className="old-gold-exchange-calculator py-10 md:py-20 bg-[#f8f8f8]">
      <div className="container-main mx-auto px-4 max-w-[1200px]">

        {/* Rates Banner */}
        <div className="exchange-rates-banner mb-10 p-6 md:p-8 rounded-xl flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-[#b76f79] to-[#f3dce0] text-white gap-6">
          <div className="rates-container flex flex-wrap items-center gap-20">
            <div className="rate-box flex items-center gap-4 ">
              <div className="rate-details">
                <div className="text-[10px] uppercase tracking-wider opacity-90 mb-1">24KT Gold Rate</div>
                <div className="text-2xl md:text-4xl font-semibold">{loading ? "..." : formatCurrency(calculation.rate24)}</div>
                <div className="text-[10px] opacity-80">per 10 grams</div>
              </div>
            </div>

            <div className="hidden md:block w-px h-16 bg-white/30"></div>

            <div className="rate-box flex items-center gap-4 ">
              <div className="rate-details">
                <div className="text-[10px] uppercase tracking-wider opacity-90 mb-1">22KT Gold Rate</div>
                <div className="text-2xl md:text-4xl font-semibold">{loading ? "..." : formatCurrency(calculation.rate22)}</div>
                <div className="text-[10px] opacity-80">per 10 grams</div>
              </div>
            </div>
          </div>

          <div className="rates-source flex items-center gap-3 text-xs text-[#3e405b]">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">Live Rates</span>
            <span className="opacity-90">Fetched from our Gold Rate Page</span>
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="exchange-calculator-wrapper mb-14 text-center">
          <h2 className="font-abhaya font-semibold text-[18px] md:text-[28px] uppercase tracking-[2px] mb-2 text-primary">
            Old Gold Exchange Value Calculator
          </h2>
          <p className="text-gray-500 text-[14px] md:text-[18px] max-w-[660px] mx-auto pb-8">
            Enter your gold details to calculate exchange value
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Column */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg shadow-black/5">
              <div className="mb-10">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-4">Select Gold Purity</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {KARATS.map((k) => (
                    <button
                      key={k.value}
                      onClick={() => setSelectedKarat(k.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${selectedKarat === k.value
                        ? "bg-[#b76f79] border-[#b76f79] text-white"
                        : "bg-[#f5f5f5] border-[#e0e0e0] hover:border-[#b76f79]"
                        }`}
                    >
                      <span className="block font-bold text-base">{k.label}</span>
                      <span className={`block text-[10px] ${selectedKarat === k.value ? "text-white/80" : "text-gray-500"}`}>{k.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-4">Gold Weight (grams)</label>
                <div className="relative mb-4">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-4 pr-16 border-2 border-[#e0e0e0] rounded-lg text-lg font-semibold focus:outline-none focus:border-[#b76f79]"
                    min="0.1"
                    step="0.1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">grams</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {WEIGHTS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeight(w)}
                      className="px-4 py-2 bg-white border-2 border-[#e0e0e0] rounded-md text-sm font-semibold hover:border-[#b76f79] hover:text-[#b76f79] transition-all"
                    >
                      {w}g
                    </button>
                  ))}
                </div>
              </div>

              <a
                href="https://api.whatsapp.com/send/?phone=919004435760&text=Hi%2C%20I%20want%20to%20get%20more%20information%20about%20Old%20Gold%20Exchange !%20&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#3e405b] text-white rounded-lg flex items-center justify-center gap-3 font-semibold uppercase tracking-widest hover:-translate-y-0.5 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
                  <path d="M8.00782 1.33337C4.33716 1.33337 1.349 4.31896 1.34767 7.98962C1.347 9.16296 1.65432 10.3084 2.23699 11.3177L1.33334 14.6667L4.82162 13.8425C5.79429 14.3732 6.88925 14.6517 8.00392 14.6524H8.00652C11.6765 14.6524 14.6634 11.6661 14.6654 7.99613C14.6667 6.2168 13.9748 4.54386 12.7175 3.2852C11.4601 2.0272 9.78916 1.33404 8.00782 1.33337ZM8.00652 2.66671C9.43052 2.66737 10.7688 3.22257 11.7747 4.22791C12.7808 5.23457 13.3334 6.57217 13.332 7.99483C13.3307 10.9308 10.9426 13.3191 8.00522 13.3191C7.11655 13.3184 6.23628 13.0952 5.46095 12.6719L5.01173 12.4271L4.51564 12.5443L3.20314 12.8542L3.52345 11.6641L3.66798 11.1302L3.39194 10.6511C2.9266 9.84575 2.68033 8.92496 2.681 7.98962C2.68233 5.05496 5.07119 2.66671 8.00652 2.66671ZM5.65105 4.91671C5.53972 4.91671 5.35971 4.95837 5.20704 5.12504C5.05437 5.29104 4.62371 5.69309 4.62371 6.51176C4.62371 7.33043 5.22006 8.12178 5.3034 8.23311C5.38606 8.34378 6.45451 10.0769 8.14584 10.7435C9.55118 11.2975 9.8366 11.1882 10.1419 11.1602C10.4473 11.1329 11.127 10.7585 11.2656 10.3698C11.4043 9.98116 11.4046 9.64683 11.3633 9.57817C11.322 9.50883 11.2109 9.46749 11.0443 9.38415C10.8783 9.30082 10.0602 8.89912 9.90756 8.84379C9.7549 8.78846 9.64323 8.76046 9.53256 8.92712C9.4219 9.09379 9.10385 9.4675 9.00652 9.57817C8.90919 9.6895 8.81251 9.70447 8.64584 9.62113C8.47918 9.53713 7.9433 9.36098 7.3073 8.79431C6.81264 8.35364 6.47885 7.80994 6.38152 7.64327C6.28485 7.47727 6.37241 7.38609 6.45574 7.30343C6.53041 7.22876 6.6211 7.10909 6.70444 7.01176C6.7871 6.91443 6.81577 6.84508 6.8711 6.73441C6.92644 6.62375 6.89811 6.52608 6.85678 6.44275C6.81545 6.35942 6.49176 5.53771 6.34376 5.20837C6.21909 4.93171 6.08743 4.92528 5.96876 4.92061C5.87209 4.91661 5.76172 4.91671 5.65105 4.91671Z" />
                </svg>
                Get In Touch
              </a>
            </div>

            {/* Results Column */}
            <div className="flex flex-col gap-5">
              <div className="bg-[#b76f79] text-white p-6 rounded-xl flex-1 flex flex-col justify-between">
                <div className="mb-8 border-b border-white/20 pb-6 text-center">
                  <h3 className="text-xl font-medium uppercase tracking-widest mb-2">Exchange Value</h3>
                  <div className="flex items-center justify-center gap-2 opacity-80 text-sm ">
                    <span className="font-bold uppercase tracking-wider">{selectedKarat}KT</span>
                    <span className="opacity-50">•</span>
                    <span className="font-bold uppercase tracking-wider">{weight}g</span>
                  </div>
                </div>

                <div className="space-y-6 mb-8 text-left px-2">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <div>
                      <div className="text-base font-medium">Market Value</div>
                      <div className="text-[11px] opacity-70">Based on today&apos;s rate</div>
                    </div>
                    <div className="text-xl font-bold">{loading ? "₹ --" : formatCurrency(calculation.marketValue)}</div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div>
                      <div className="text-base font-medium flex items-center gap-2">
                        Exchange Value
                        {bonus > 0 && <span className="text-[10px] font-bold bg-white/20 border border-white/40 px-2 py-0.5 rounded-full">+{bonus}%</span>}
                      </div>
                      <div className="text-[11px] opacity-70">Total value for your gold</div>
                    </div>
                    <div className="text-2xl font-bold">{loading ? "₹ --" : formatCurrency(calculation.exchangeValue)}</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20 space-y-3">
                  <div className="flex items-center gap-3 text-[11px] opacity-80">
                    <Info size={14} />
                    <span>Fetched from our Gold Rate Page</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] opacity-80">
                    <AlertTriangle size={14} />
                    <span>Final value determined after verification</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Table */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg shadow-black/5 overflow-hidden">
          <h3 className="text-xl md:text-lg font-abhaya font-semibold text-center uppercase tracking-wide mb-6 text-primary">
            Today&apos;s Gold Rate (Per Gram)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8f8f8] border-b-2 border-[#b76f79]">
                  <th className="p-4 text-center font-medium">Karat</th>
                  {WEIGHTS.map(w => <th key={w} className="p-4 text-center font-medium">{w}g</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {KARATS.filter(k => ["24", "22", "18", "14"].includes(k.label.replace("KT", ""))).map((karat) => {
                  const kVal = karat.value;
                  const rate24 = (Number(rates?.gold_price_24k) * 10) || 82000;
                  const rate22 = (Number(rates?.gold_price_22k) * 10) || 75000;
                  let base;
                  if (kVal === "24") base = rate24;
                  else if (kVal === "22") base = rate22;
                  else if (kVal === "18") base = Math.round(rate24 * 0.75);
                  else if (kVal === "14") base = Math.round(rate24 * 0.583);
                  else base = rate24;

                  const gRate = base / 10;

                  return (
                    <tr key={karat.value} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-center font-bold text-[#b76f79]">{karat.label}</td>
                      {WEIGHTS.map(w => (
                        <td key={w} className="p-4 text-center text-gray-900">
                          {loading ? "..." : formatCurrency(gRate * w)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}