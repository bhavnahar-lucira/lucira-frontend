"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, Search, X, ChevronDown, Check } from "lucide-react";
import { fetchLocalRates } from "@/lib/api";

const stateCityMap = {
    'andaman-and-nicobar-islands': ['Port Blair'],
    'andhra-pradesh': ['Chirala', 'Guntur', 'Hindupur', 'Kagaznagar', 'Kakinada', 'Kurnool', 'Machilipatnam', 'Nandyal', 'Nellore', 'Ongole', 'Proddatur', 'Rajahmundry', 'Tirupati', 'Vishakhapatnam', 'Vizianagaram'],
    'arunachal-pradesh': ['Itanagar'],
    assam: ['Dibrugarh', 'Dispur', 'Guwahati', 'Jorhat', 'Silchar', 'Tezpur'],
    bihar: ['Aurangabad', 'Bhagalpur', 'Gaya', 'Muzaffarpur', 'Patna', 'Purnea'],
    chandigarh: ['Chandigarh'],
    chhattisgarh: ['Bhilai', 'Bilaspur', 'Raipur'],
    'dadra-and-nagar-haveli': ['Silvassa'],
    'daman-and-diu': ['Daman', 'Diu'],
    delhi: ['Delhi', 'New Delhi'],
    goa: ['Panaji'],
    gujarat: ['Ahmedabad', 'Bhavnagar', 'Bhuj', 'Ghandinagar', 'Navsari', 'Porbandar', 'Rajkot', 'Surat', 'Vadodara'],
    haryana: ['Ambala', 'Bhiwani', 'Faridabad', 'Gurugram', 'Hisar', 'Karnal', 'Panchkula', 'Panipat', 'Rohtak', 'Sirsa', 'Sonipat'],
    'himachal-pradesh': ['Shimla'],
    'jammu-and-kashmir': ['Baramula', 'Jammu', 'Saidpur', 'Srinagar'],
    jharkhand: ['Dhanbad', 'Jamshedpur', 'Ranchi', 'Jorapokhar'],
    karnataka: ['Belgaum', 'Bellary', 'Bengaluru', 'Bidar', 'Bijapur', 'Chikka Mandya', 'Davangere', 'Gulbarga', 'Hospet', 'Hubli', 'Kolar', 'Mangalore', 'Mysore', 'Raichur', 'Shimoga'],
    kerala: ['Alappuzha', 'Calicut', 'Kochi', 'Kollam', 'Thiruvananthapuram'],
    lakshadweep: ['Kavaratti'],
    'madhya-pradesh': ['Bhopal', 'Gwalior', 'Indore', 'Jabalpur', 'Ratlam', 'Saugor', 'Ujjain'],
    maharashtra: ['Ahmadnagar', 'Akola', 'Amaravati', 'Aurangabad', 'Bhiwandi', 'Bhusaval', 'Chanda', 'Kalyan', 'Khanapur', 'Kolhapur', 'Latur', 'Malegaon Camp', 'Mumbai', 'Nanded', 'Nasik', 'Parbhani', 'Pune', 'Sangli'],
    manipur: ['Imphal'],
    meghalaya: ['Shillong'],
    mizoram: ['Aizawl'],
    nagaland: ['Kohima'],
    odisha: ['Bhubaneshwar', 'Brahmapur', 'Cuttack', 'Puri', 'Raurkela', 'Samlaipadar', 'Brajrajnagar', 'Talcher'],
    puducherry: ['Puducherry'],
    punjab: ['Abohar', 'Amritsar', 'Haripur', 'Ludhiana', 'Pathankot', 'Patiala'],
    rajasthan: ['Ajmer', 'Alwar', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Jaipur', 'Jodhpur', 'Kota', 'Pali', 'Rampura', 'Sikar', 'Tonk', 'Udaipur'],
    sikkim: ['Gangtok'],
    'tamil-nadu': ['Chennai', 'Coimbatore', 'Cuddalore', 'Dindigul', 'Karur', 'Krishnapuram', 'Kumbakonam', 'Madurai', 'Nagercoil', 'Rajapalaiyam', 'Salem', 'Thanjavur', 'Tiruchchirappalli', 'Tirunelveli', 'Tiruvannamalai', 'Tuticorin', 'Valparai', 'Vellore'],
    telangana: ['Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahabubnagar', 'Nalgonda', 'Nizamabad', 'Ramagundam', 'Warangal'],
    tripura: ['Agartala'],
    'uttar-pradesh': ['Agra', 'Aligarh', 'Allahabad', 'Bakshpur', 'Bamanpuri', 'Bareilly', 'Bharauri', 'Budaun', 'Bulandshahr', 'Firozabad', 'Fyzabad', 'Ghaziabad', 'Gopalpur', 'Hapur', 'Hata', 'Jhansi', 'Lucknow', 'Mathura', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Saharanpur', 'Saidapur', 'Shahbazpur', 'Tharati Etawah', 'Varanasi'],
    uttarakhand: ['DehraDun'],
    'west-bengal': ['Alipurduar', 'Asansol', 'Barddhaman', 'Bhatpara', 'Haldia', 'Haora', 'Kolkata', 'Krishnanagar', 'Shiliguri'],
};

const defaultRates = {
  gold_price_24k: 155169,
  gold_price_22k: 142756,
  platinum_price: 7485,
  silver_price_10g: 3051,
  silver_price_1kg: 305001,
};

export default function SophisticatedMetalCalculator({ initialMetal = "gold", initialCity = "mumbai" }) {
  const [activeMetal, setActiveMetal] = useState(initialMetal); // 'gold' | 'silver' | 'platinum'
  const [calcMode, setCalcMode] = useState("weight"); // 'weight' | 'amount'
  const [rates, setRates] = useState(null);
  
  // City states
  const [currentCitySlug, setCurrentCitySlug] = useState(initialCity.toLowerCase().replace(/\s+/g, '-'));
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Weight mode inputs
  const [goldPurity, setGoldPurity] = useState(22); // 24 | 22 | 18
  const [weight, setWeight] = useState(10);
  const [making, setMaking] = useState(12);
  const [gstType, setGstType] = useState("incl"); // 'incl' | 'excl'

  // Amount mode inputs
  const [amountInput, setAmountInput] = useState(10000);
  const [amountMaking, setAmountMaking] = useState(10);
  const [includeGstAmount, setIncludeGstAmount] = useState(true);

  // Know your money's worth try input
  const [tryAmountInput, setTryAmountInput] = useState("10,000");

  const modalRef = useRef(null);

  // Load rates
  useEffect(() => {
    async function loadRates() {
      try {
        const data = await fetchLocalRates();
        if (data && Object.keys(data).length > 0) {
          setRates(data);
        }
      } catch (err) {
        console.error("Failed to fetch local rates inside SophisticatedMetalCalculator:", err);
      }
    }
    loadRates();
  }, []);

  // Format date: "20 June 2026"
  const formattedDate = useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('en-IN', { month: 'long' });
    const year = today.getFullYear();
    return `${day} ${month} ${year}`;
  }, []);

  // List of all cities flattened
  const allCitiesList = useMemo(() => {
    const list = [];
    const seen = new Set();
    Object.values(stateCityMap).forEach((cities) => {
      cities.forEach((city) => {
        const slug = city.toLowerCase().replace(/\s+/g, '-');
        if (!seen.has(slug)) {
          seen.add(slug);
          list.push({ name: city, slug });
        }
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return allCitiesList;
    const query = searchQuery.toLowerCase().trim();
    return allCitiesList.filter(c => c.name.toLowerCase().includes(query));
  }, [searchQuery, allCitiesList]);

  // Current display city name
  const currentCityName = useMemo(() => {
    const match = allCitiesList.find(c => c.slug === currentCitySlug);
    return match ? match.name : currentCitySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [currentCitySlug, allCitiesList]);

  // Active Rate per gram calculation
  const ratePerGram = useMemo(() => {
    const activeRates = rates || defaultRates;
    if (activeMetal === "gold") {
      if (goldPurity === 24) return Number(activeRates.gold_price_24k) / 10;
      if (goldPurity === 22) return Number(activeRates.gold_price_22k) / 10;
      if (goldPurity === 18) {
        return activeRates.gold_price_18k
          ? Number(activeRates.gold_price_18k) / 10
          : (Number(activeRates.gold_price_24k) / 10) * 18 / 24;
      }
    } else if (activeMetal === "silver") {
      return Number(activeRates.silver_price_10g) / 10;
    } else if (activeMetal === "platinum") {
      return Number(activeRates.platinum_price);
    }
    return 0;
  }, [rates, activeMetal, goldPurity]);

  // Metal Prices for cards
  const metalRatesList = useMemo(() => {
    const activeRates = rates || defaultRates;
    const yesterday24 = Number(activeRates.gold_price_24k_yesterday) || (Number(activeRates.gold_price_24k) - 220);
    const yesterday22 = Number(activeRates.gold_price_22k_yesterday) || (Number(activeRates.gold_price_22k) - 200);

    const diff24 = Math.round((Number(activeRates.gold_price_24k) - yesterday24) / 10);
    const diff22 = Math.round((Number(activeRates.gold_price_22k) - yesterday22) / 10);
    const diff18 = Math.round(diff24 * 18 / 24);

    return {
      gold: [
        {
          label: "24K Gold /g",
          price: Math.round(Number(activeRates.gold_price_24k) / 10),
          change: diff24,
        },
        {
          label: "22K Gold /g",
          price: Math.round(Number(activeRates.gold_price_22k) / 10),
          change: diff22,
        },
        {
          label: "18K Gold /g",
          price: Math.round(
            activeRates.gold_price_18k
              ? Number(activeRates.gold_price_18k) / 10
              : (Number(activeRates.gold_price_24k) / 10) * 18 / 24
          ),
          change: diff18,
        },
      ],
      silver: [
        {
          label: "Silver /g",
          price: Math.round(Number(activeRates.silver_price_10g) / 10),
        },
        {
          label: "Silver /kg",
          price: Math.round(Number(activeRates.silver_price_1kg)),
        }
      ],
      platinum: [
        {
          label: "Platinum /g",
          price: Math.round(Number(activeRates.platinum_price)),
        },
        {
          label: "Platinum /10g",
          price: Math.round(Number(activeRates.platinum_price) * 10),
        }
      ]
    };
  }, [rates]);

  // Navigate when active metal or city changes
  const navigateToPage = (metal, citySlug) => {
    window.location.href = `/pages/${citySlug}-${metal}-rate-today`;
  };

  // Close modal on escape or outer click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsCityModalOpen(false);
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsCityModalOpen(false);
      }
    };
    if (isCityModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCityModalOpen]);

  // Weight Mode Math
  const weightCalcResults = useMemo(() => {
    const baseVal = Math.round(weight * ratePerGram);
    const makingChg = Math.round(baseVal * (making / 100));
    const sub = baseVal + makingChg;
    const gstVal = gstType === "incl" ? Math.round(sub * 0.03) : 0;
    const total = sub + gstVal;

    return {
      baseValue: baseVal,
      makingCharges: makingChg,
      gst: gstVal,
      totalAmount: total
    };
  }, [weight, ratePerGram, making, gstType]);

  // Amount Mode Math
  const amountCalcResults = useMemo(() => {
    const amountVal = Number(amountInput) || 0;
    const makingPct = Number(amountMaking) || 0;

    let baseVal = 0;
    let makingChg = 0;
    let sub = 0;
    let gstVal = 0;
    let computedWeight = 0;

    if (amountVal > 0 && ratePerGram > 0) {
      if (includeGstAmount) {
        // Amount = Base * (1 + M/100) * 1.03
        baseVal = Math.round(amountVal / ((1 + makingPct / 100) * 1.03));
        makingChg = Math.round(baseVal * (makingPct / 100));
        sub = baseVal + makingChg;
        gstVal = amountVal - sub;
      } else {
        // Amount = Base * (1 + M/100)
        baseVal = Math.round(amountVal / (1 + makingPct / 100));
        makingChg = amountVal - baseVal;
        sub = amountVal;
        gstVal = 0;
      }
      computedWeight = baseVal / ratePerGram;
    }

    return {
      amountAvailable: amountVal,
      baseValue: baseVal,
      makingCharges: makingChg,
      subtotal: sub,
      gst: gstVal,
      weight: computedWeight
    };
  }, [amountInput, amountMaking, includeGstAmount, ratePerGram]);

  // Handle "Try now" from weight mode card
  const handleTryNow = () => {
    const amt = parseFloat(tryAmountInput.replace(/[^\d.]/g, "")) || 10000;
    setAmountInput(amt);
    setCalcMode("amount");
  };

  return (
    <section className="py-12 md:py-16 bg-[#FAF3EC]/30 flex justify-center items-center px-4 md:px-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl p-6 md:p-8 shadow-[0_10px_40px_rgba(163,130,113,0.15)] border border-[#F2E3C6] relative overflow-hidden font-figtree">
        {/* Top Control Row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
          
          <div className="flex items-center gap-4 flex-wrap">
            {/* Date Box */}
            <div className="flex items-center gap-2 border border-[#F2E3C6] bg-[#FAF3EC]/50 px-4 py-2.5 rounded-xl text-zinc-700 text-sm font-medium">
              <Calendar className="text-[#B77767] w-4.5 h-4.5" />
              <span>{formattedDate}</span>
            </div>

            {/* Metal Tabs Selector */}
            <div className="flex bg-[#FAF3EC]/50 border border-[#F2E3C6] p-1 rounded-xl">
              {["gold", "silver", "platinum"].map((metal) => (
                <button
                  key={metal}
                  onClick={() => {
                    setActiveMetal(metal);
                    navigateToPage(metal, currentCitySlug);
                  }}
                  className={`px-6 py-1.5 text-sm font-semibold rounded-lg transition-all capitalize ${
                    activeMetal === metal
                      ? "bg-[#B77767] text-zinc-900 shadow-md"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {metal}
                </button>
              ))}
            </div>
          </div>

          {/* City Selection Trigger */}
          <button
            onClick={() => setIsCityModalOpen(true)}
            className="flex items-center justify-between gap-2 border border-[#F2E3C6] bg-[#FAF3EC]/50 px-5 py-2.5 rounded-xl text-zinc-900 text-sm font-medium hover:bg-white transition-all text-left"
          >
            <span>{currentCityName}</span>
            <ChevronDown className="text-[#B77767] w-4 h-4" />
          </button>
        </div>

        {/* Karat Wise Rates Cards Row */}
        <div className="mb-8">
          <div className={`grid grid-cols-1 gap-4 ${
            activeMetal === "gold" ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}>
            {metalRatesList[activeMetal].map((card, i) => (
              <div
                key={i}
                className="bg-[#FAF3EC]/50 rounded-2xl p-5 border border-[#F2E3C6] flex justify-between items-center shadow-inner hover:border-[#D4B392] transition-colors"
              >
                <div>
                  <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                    {card.label}
                  </p>
                  <p className="text-zinc-900 text-2xl md:text-3xl font-extrabold tracking-tight">
                    ₹{card.price.toLocaleString("en-IN")}
                  </p>
                </div>
                {card.change !== undefined && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    card.change >= 0 
                      ? "bg-[#189351]/15 text-[#189351]" 
                      : "bg-[#F83E50]/15 text-[#F83E50]"
                  }`}>
                    {card.change >= 0 ? `+ ${card.change}` : `- ${Math.abs(card.change)}`}
                    <span>{card.change >= 0 ? "▲" : "▼"}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calculator Header Row */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-zinc-900 text-lg font-bold">Calculator</h2>
          {/* Mode Tabs */}
          <div className="flex bg-[#FAF3EC]/50 border border-[#F2E3C6] p-1 rounded-xl w-fit">
            <button
              onClick={() => setCalcMode("weight")}
              className={`px-5 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                calcMode === "weight"
                  ? "bg-[#B77767] text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Calculate By Weight
            </button>
            <button
              onClick={() => setCalcMode("amount")}
              className={`px-5 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                calcMode === "amount"
                  ? "bg-[#B77767] text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Calculate By Amount
            </button>
          </div>
        </div>

        {/* Calculator Main Section */}
        <div className="bg-white border border-[#F2E3C6] rounded-2xl p-6 shadow-inner">
          {calcMode === "weight" ? (
            /* WEIGHT-BASED CALCULATOR */
            <div className="space-y-8">
              {/* Horizontal Inputs Bar */}
              <div className={`grid grid-cols-1 gap-6 items-end ${
                activeMetal === "gold" ? "md:grid-cols-4" : "md:grid-cols-3"
              }`}>
                {activeMetal === "gold" && (
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                      Purity
                    </label>
                    <div className="flex bg-[#FAF3EC]/50 border border-[#F2E3C6] p-1 rounded-xl w-full gap-1">
                      {[24, 22, 18].map((karat) => (
                        <button
                          key={karat}
                          onClick={() => setGoldPurity(karat)}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            goldPurity === karat
                              ? "bg-[#B77767] text-zinc-900 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-900"
                          }`}
                        >
                          {karat}K
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weight (gm) */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                    Weight (gm)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="bg-white border border-[#F2E3C6] rounded-xl px-4 py-3 text-zinc-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-base"
                  />
                </div>

                {/* Making (%) */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                    Making (%)
                  </label>
                  <input
                    type="number"
                    value={making}
                    onChange={(e) => setMaking(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="bg-white border border-[#F2E3C6] rounded-xl px-4 py-3 text-zinc-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-base"
                  />
                </div>

                {/* GST Selector */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                    GST
                  </label>
                  <div className="relative">
                    <select
                      value={gstType}
                      onChange={(e) => setGstType(e.target.value)}
                      className="w-full bg-white border border-[#F2E3C6] rounded-xl px-4 py-3 text-zinc-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-base appearance-none cursor-pointer"
                    >
                      <option value="incl">Incl. 3%</option>
                      <option value="excl">Excl. 3%</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Horizontal Results Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Wide values breakdown & total amount split card */}
                <div className="lg:col-span-2 bg-[#FAF3EC]/50 rounded-2xl border border-[#F2E3C6] grid grid-cols-1 md:grid-cols-5 overflow-hidden shadow-md">
                  
                  {/* Left Side: Table Breakdown */}
                  <div className="md:col-span-3 p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-[#F2E3C6]/40 pb-3">
                        <span className="text-zinc-500 text-sm">Base value</span>
                        <span className="text-zinc-900 font-bold">₹{weightCalcResults.baseValue.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#F2E3C6]/40 pb-3">
                        <span className="text-zinc-500 text-sm">Making charges</span>
                        <span className="text-zinc-900 font-bold">₹{weightCalcResults.makingCharges.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">GST (3%)</span>
                        <span className="text-zinc-900 font-bold">
                          {gstType === "incl" ? `₹${weightCalcResults.gst.toLocaleString("en-IN")}` : "₹0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Total Amount Box */}
                  <div className="md:col-span-2 bg-[#F2E3C6]/20 p-6 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-[#F2E3C6] text-center">
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Amount</p>
                    <p className="text-[#B77767] text-3xl md:text-4xl font-extrabold tracking-tight">
                      ₹{weightCalcResults.totalAmount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">
                      {gstType === "incl" ? "Incl. all charges" : "Excl. GST"}
                    </p>
                  </div>
                </div>

                {/* Know your money's worth! card */}
                <div className="bg-[#FAF3EC]/50 rounded-2xl p-6 border border-[#F2E3C6] flex flex-col justify-between shadow-md">
                  <div>
                    <h4 className="text-zinc-900 font-bold text-base mb-1">Know your money's worth!</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-4">
                      Enter any amount to see how much {activeMetal} you can get
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tryAmountInput}
                      onChange={(e) => setTryAmountInput(e.target.value)}
                      className="bg-white border border-[#F2E3C6] rounded-xl px-3 py-2 text-zinc-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-xs w-full"
                    />
                    <button
                      onClick={handleTryNow}
                      className="bg-[#B77767] hover:bg-[#A36455] text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
                    >
                      Try now
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* AMOUNT-BASED CALCULATOR */
            <div className="flex flex-col lg:flex-row gap-8 items-stretch">
              
              {/* Left Column Form */}
              <div className="flex-1 space-y-6">
                {activeMetal === "gold" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      Gold Purity
                    </label>
                    <div className="flex bg-[#FAF3EC]/50 border border-[#F2E3C6] p-1 rounded-xl w-fit gap-1">
                      {[24, 22, 18].map((karat) => (
                        <button
                          key={karat}
                          onClick={() => setGoldPurity(karat)}
                          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                            goldPurity === karat
                              ? "bg-[#B77767] text-zinc-900 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-900"
                          }`}
                        >
                          {karat}K
                        </button>
                      ))}
                    </div>
                    <span className="text-zinc-500 text-xs font-medium mt-2 block italic">
                      Rate: ₹{Math.round(ratePerGram).toLocaleString("en-IN")} /gram
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount (₹) */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900 font-bold text-base">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={amountInput}
                        onChange={(e) => setAmountInput(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-[#F2E3C6] rounded-xl pl-8 pr-4 py-3.5 text-zinc-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-base"
                      />
                    </div>
                  </div>

                  {/* Making (%) */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                      Making (%)
                    </label>
                    <input
                      type="number"
                      value={amountMaking}
                      onChange={(e) => setAmountMaking(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-white border border-[#F2E3C6] rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Include GST (3%) Slider Toggle */}
                  <div className="flex flex-col justify-center">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      Include GST (3%)
                    </label>
                    <div className="flex items-center gap-3">
                      {/* Toggle Track */}
                      <button
                        onClick={() => setIncludeGstAmount(!includeGstAmount)}
                        className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 focus:outline-none relative flex items-center ${
                          includeGstAmount ? "bg-[#B77767]" : "bg-white border border-[#F2E3C6]"
                        }`}
                      >
                        {/* Toggle Circle */}
                        <div
                          className={`w-4.5 h-4.5 bg-white rounded-full shadow-md border border-zinc-200 transition-transform duration-300 transform ${
                            includeGstAmount ? "translate-x-5.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-zinc-900 text-sm font-bold capitalize">
                        {includeGstAmount ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>

                  {/* Select City Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5">
                      Select City
                    </label>
                    <div className="relative">
                      <select
                        value={currentCitySlug}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setCurrentCitySlug(newCity);
                          navigateToPage(activeMetal, newCity);
                        }}
                        className="w-full bg-white border border-[#F2E3C6] rounded-xl px-4 py-3.5 text-zinc-900 font-bold focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-base appearance-none cursor-pointer"
                      >
                        {allCitiesList.map((city) => (
                          <option key={city.slug} value={city.slug}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Result Cards */}
              <div className="w-full lg:w-[420px] bg-[#FAF3EC]/50 rounded-2xl p-6 border border-[#F2E3C6] shadow-md flex flex-col justify-between">
                
                {/* Result Weight Display */}
                <div className="text-center py-4 border-b border-[#F2E3C6]">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">
                    {activeMetal} you can buy
                  </p>
                  <p className="text-[#B77767] text-2xl md:text-3xl font-extrabold tracking-tight">
                    {amountCalcResults.weight.toFixed(4)} g
                  </p>
                </div>

                {/* Math Details Row-wise */}
                <div className="space-y-4 my-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Amount Available</span>
                    <span className="text-zinc-900 font-bold">₹{amountCalcResults.amountAvailable.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Base Value</span>
                    <span className="text-zinc-900 font-bold">₹{amountCalcResults.baseValue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Making Charges ({amountMaking}%)</span>
                    <span className="text-zinc-900 font-bold">₹{amountCalcResults.makingCharges.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-[#F2E3C6] pt-3">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-900 font-bold">₹{amountCalcResults.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-1">
                    <span className="text-zinc-500">GST (3%)</span>
                    <span className="text-zinc-900 font-bold">
                      {includeGstAmount ? `₹${amountCalcResults.gst.toLocaleString("en-IN")}` : "₹0"}
                    </span>
                  </div>
                </div>

                {/* Gold/Silver/Platinum Weight summary row */}
                <div className="pt-4 border-t border-[#F2E3C6] flex items-center justify-between">
                  <span className="text-zinc-500 text-sm font-semibold capitalize">{activeMetal} Weight</span>
                  <span className="text-[#B77767] font-bold text-lg">{amountCalcResults.weight.toFixed(4)} g</span>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* CITY SELECTION POPUP MODAL (portaled to body so it never gets clipped by page transforms/overflow) */}
      {isCityModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in font-figtree">
          <div
            ref={modalRef}
            className="w-full max-w-xl bg-white rounded-2xl border border-[#F2E3C6] shadow-2xl flex flex-col h-[80vh] md:h-[600px] overflow-hidden animate-scale-up"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#F2E3C6]">
              <h3 className="text-zinc-900 text-lg font-bold">Select Your City or Country</h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Container */}
            <div className="px-6 py-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B77767] w-4.5 h-4.5" />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#F2E3C6] rounded-xl pl-11 pr-4 py-3 text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#B77767] focus:border-[#B77767] transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Scrollable list of cities */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-1 custom-scrollbar">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.slug}
                    onClick={() => {
                      setIsCityModalOpen(false);
                      setCurrentCitySlug(city.slug);
                      navigateToPage(activeMetal, city.slug);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                      currentCitySlug === city.slug
                        ? "bg-[#FAF3EC]/50 border border-[#F2E3C6] text-zinc-900 font-bold"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-[#FAF3EC]/50/50 border border-transparent"
                    }`}
                  >
                    <span className="text-sm font-medium">{city.name}</span>
                    {currentCitySlug === city.slug && (
                      <Check className="w-4 h-4 text-[#B77767]" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center text-zinc-500 py-10">No cities matching search</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Embedded Animations and Custom Scrollbar Styling */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #FAF3EC;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D4B392;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B77767;
        }
      `}</style>
    </section>
  );
}
