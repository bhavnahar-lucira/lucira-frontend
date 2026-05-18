// "use client";

// import { useState, useEffect, useMemo } from "react";
// import Link from "next/link";
// import { ChevronDown, ArrowRight, ShoppingBag } from "lucide-react";
// import FAQSection from "./FAQSection";
// import GoldCalculator from "./GoldCalculator";
// import InvestmentSection from "./InvestmentSection";
// import PriceTable from "./PriceTable";
// import InformationContent from "./InformationContent";
// import { GOLD_RATE_TEMPLATE } from "@/data/goldRateTemplate";

// const stateCityMap = {
//     'andaman-and-nicobar-islands': ['Port Blair'],
//     'andhra-pradesh': ['Chirala', 'Guntur', 'Hindupur', 'Kagaznagar', 'Kakinada', 'Kurnool', 'Machilipatnam', 'Nandyal', 'Nellore', 'Ongole', 'Proddatur', 'Rajahmundry', 'Tirupati', 'Vishakhapatnam', 'Vizianagaram'],
//     'arunachal-pradesh': ['Itanagar'],
//     assam: ['Dibrugarh', 'Dispur', 'Guwahati', 'Jorhat', 'Silchar', 'Tezpur'],
//     bihar: ['Aurangabad', 'Bhagalpur', 'Gaya', 'Muzaffarpur', 'Patna', 'Purnea'],
//     chandigarh: ['Chandigarh'],
//     chhattisgarh: ['Bhilai', 'Bilaspur', 'Raipur'],
//     'dadra-and-nagar-haveli': ['Silvassa'],
//     'daman-and-diu': ['Daman', 'Diu'],
//     delhi: ['Delhi', 'New Delhi'],
//     goa: ['Panaji'],
//     gujarat: ['Ahmedabad', 'Bhavnagar', 'Bhuj', 'Ghandinagar', 'Navsari', 'Porbandar', 'Rajkot', 'Surat', 'Vadodara'],
//     haryana: ['Ambala', 'Bhiwani', 'Faridabad', 'Gurugram', 'Hisar', 'Karnal', 'Panchkula', 'Panipat', 'Rohtak', 'Sirsa', 'Sonipat'],
//     'himachal-pradesh': ['Shimla'],
//     'jammu-and-kashmir': ['Baramula', 'Jammu', 'Saidpur', 'Srinagar'],
//     jharkhand: ['Dhanbad', 'Jamshedpur', 'Ranchi', 'Jorapokhar'],
//     karnataka: ['Belgaum', 'Bellary', 'Bengaluru', 'Bidar', 'Bijapur', 'Chikka Mandya', 'Davangere', 'Gulbarga', 'Hospet', 'Hubli', 'Kolar', 'Mangalore', 'Mysore', 'Raichur', 'Shimoga'],
//     kerala: ['Alappuzha', 'Calicut', 'Kochi', 'Kollam', 'Thiruvananthapuram'],
//     lakshadweep: ['Kavaratti'],
//     'madhya-pradesh': ['Bhopal', 'Gwalior', 'Indore', 'Jabalpur', 'Ratlam', 'Saugor', 'Ujjain'],
//     maharashtra: ['Ahmadnagar', 'Akola', 'Amaravati', 'Aurangabad', 'Bhiwandi', 'Bhusaval', 'Chanda', 'Kalyan', 'Khanapur', 'Kolhapur', 'Latur', 'Malegaon Camp', 'Mumbai', 'Nanded', 'Nasik', 'Parbhani', 'Pune', 'Sangli'],
//     manipur: ['Imphal'],
//     meghalaya: ['Shillong'],
//     mizoram: ['Aizawl'],
//     nagaland: ['Kohima'],
//     odisha: ['Bhubaneshwar', 'Brahmapur', 'Cuttack', 'Puri', 'Raurkela', 'Samlaipadar', 'Brajrajnagar', 'Talcher'],
//     puducherry: ['Puducherry'],
//     punjab: ['Abohar', 'Amritsar', 'Haripur', 'Ludhiana', 'Pathankot', 'Patiala'],
//     rajasthan: ['Ajmer', 'Alwar', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Jaipur', 'Jodhpur', 'Kota', 'Pali', 'Rampura', 'Sikar', 'Tonk', 'Udaipur'],
//     sikkim: ['Gangtok'],
//     'tamil-nadu': ['Chennai', 'Coimbatore', 'Cuddalore', 'Dindigul', 'Karur', 'Krishnapuram', 'Kumbakonam', 'Madurai', 'Nagercoil', 'Rajapalaiyam', 'Salem', 'Thanjavur', 'Tiruchchirappalli', 'Tirunelveli', 'Tiruvannamalai', 'Tuticorin', 'Valparai', 'Vellore'],
//     telangana: ['Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahabubnagar', 'Nalgonda', 'Nizamabad', 'Ramagundam', 'Warangal'],
//     tripura: ['Agartala'],
//     'uttar-pradesh': ['Agra', 'Aligarh', 'Allahabad', 'Bakshpur', 'Bamanpuri', 'Bareilly', 'Bharauri', 'Budaun', 'Bulandshahr', 'Firozabad', 'Fyzabad', 'Ghaziabad', 'Gopalpur', 'Hapur', 'Hata', 'Jhansi', 'Lucknow', 'Mathura', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Saharanpur', 'Saidapur', 'Shahbazpur', 'Tharati Etawah', 'Varanasi'],
//     uttarakhand: ['DehraDun'],
//     'west-bengal': ['Alipurduar', 'Asansol', 'Barddhaman', 'Bhatpara', 'Haldia', 'Haora', 'Kolkata', 'Krishnanagar', 'Shiliguri'],
// };

// export default function GoldRatePage({ page }) {
//     const [isFlipped, setIsFlipped] = useState(false);
//     const [selectedState, setSelectedState] = useState(page?.state?.value?.toLowerCase().replace(/\s+/g, '-') || 'maharashtra');
//     const [selectedCity, setSelectedCity] = useState(page?.city?.value?.toLowerCase().replace(/\s+/g, '-') || 'mumbai');
//     const [currentDate, setCurrentDate] = useState("");
//     const [rates, setRates] = useState(null);

//     const cityName = page?.city?.value || "Mumbai";
//     const stateName = page?.state?.value || "Maharashtra";

//     useEffect(() => {
//         const today = new Date();
//         const day = today.getDate();
//         const getDaySuffix = (d) => {
//             if (d > 3 && d < 21) return 'th';
//             switch (d % 10) {
//                 case 1: return 'st';
//                 case 2: return 'nd';
//                 case 3: return 'rd';
//                 default: return 'th';
//             }
//         };
//         const formattedDate = `${day}${getDaySuffix(day)} ${today.toLocaleString('en-IN', { month: 'short' })}, ${today.getFullYear()}`;
//         setCurrentDate(formattedDate);

//         async function fetchRates() {
//             try {
//                 const res = await fetch("/api/gold-rates");
//                 if (res.ok) {
//                     const data = await res.json();
//                     setRates(data);
//                 }
//             } catch (err) {
//                 console.error("Failed to fetch rates:", err);
//             }
//         }
//         fetchRates();
//     }, []);

//     const goldWidgetSettings = useMemo(() => {
//         const base = GOLD_RATE_TEMPLATE.sections.gold_calculate_widget_HCyUVc.settings;
//         if (!rates) return base;
//         return {
//             ...base,
//             rate_today: `₹ ${(Number(rates.gold_price_24k) || 154002).toLocaleString('en-IN')}`,
//             rate_yesterday: `₹ ${(Number(rates.gold_price_24k_yesterday) || 155053).toLocaleString('en-IN')}`,
//             rate_avg: `₹ ${(Number(rates.gold_price_22k) || 141682).toLocaleString('en-IN')}`,
//         };
//     }, [rates]);

//     const handleStateChange = (e) => {
//         const newState = e.target.value;
//         setSelectedState(newState);
//         if (stateCityMap[newState] && stateCityMap[newState].length > 0) {
//             setSelectedCity(stateCityMap[newState][0].toLowerCase().replace(/\s+/g, '-'));
//         }
//     };

//     const handleNavigate = () => {
//         window.location.href = `/pages/${selectedCity}-gold-rate-today`;
//     };

//     const todayRateNum = parseInt(goldWidgetSettings.rate_today.replace(/[₹, ]/g, '')) || 0;
//     const yesterdayRateNum = parseInt(goldWidgetSettings.rate_yesterday.replace(/[₹, ]/g, '')) || 0;
//     const diff = todayRateNum - yesterdayRateNum;
//     const THRESHOLD = 500;

//     return (
//         <div className="gold-rate-page bg-white min-h-screen font-figtree overflow-x-hidden">
//             {/* Hero Section */}
//             <section className="relative w-full flex flex-col justify-center overflow-hidden pt-8 pb-12 lg:pt-10 lg:pb-10 min-h-[600px] lg:min-h-[600px]">
//                 <div
//                     className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
//                     style={{ backgroundImage: "url('https://luciraonline.myshopify.com/cdn/shop/files/baneer-gold.jpg')" }}
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 z-[1]" />

//                 <div className="container-main relative z-10 w-full px-4 lg:px-8 xl:px-12 flex flex-col items-start max-w-7xl mx-auto">
//                     <div className="w-full lg:w-[500px] xl:w-[550px] space-y-5 lg:space-y-6">
//                         {/* Header Row */}
//                         <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
//                             <h1 className="text-white text-[18px] md:text-[24px] lg:text-[26px] font-medium tracking-tight font-abhaya uppercase">
//                                 TODAYS GOLD RATE IN {cityName}
//                             </h1>
//                             <button onClick={() => setIsFlipped(!isFlipped)} className="text-white/80 hover:text-white text-[12px] md:text-[14px] underline underline-offset-4 tracking-wide font-figtree transition-colors text-left">
//                                 {isFlipped ? "View Todays Gold Rate" : "Is Gold A Wise Investment?"}
//                             </button>
//                         </div>

//                         {/* Flip Container */}
//                         <div className="perspective-2000 w-full group relative h-[140px] md:h-[180px]">
//                             <div
//                                 className={`relative w-full h-full transition-all duration-1000 preserve-3d cursor-pointer hover:scale-[1.02] ${isFlipped ? 'rotate-x-180' : ''}`}
//                                 style={{ transformStyle: 'preserve-3d' }}
//                                 onClick={() => setIsFlipped(!isFlipped)}
//                             >

//                                 {/* FRONT FACE: Rates Card */}
//                                 <div className="absolute inset-0 bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col justify-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}>
//                                     <div className="grid grid-cols-2 gap-2 md:gap-4 divide-x divide-zinc-100 md:pt-4">
//                                         <div className="space-y-1 md:space-y-2 pr-2">
//                                             <p className="text-[10px] md:text-[12px] text-zinc-600 uppercase tracking-widest font-figtree">GOLD RATE: 24 KT</p>
//                                             <p className="text-[24px] md:text-[32px] font-bold text-black font-figtree leading-none">
//                                                 <span className="text-[18px] md:text-[22px] mr-0.5">₹</span>{goldWidgetSettings.rate_today.replace('₹ ', '')}
//                                                 <span className="text-[10px] md:text-[12px] text-zinc-500 font-normal ml-1">/10 gm</span>
//                                             </p>
//                                         </div>
//                                         <div className="space-y-1 md:space-y-2 pl-4">
//                                             <p className="text-[10px] md:text-[12px] text-zinc-600 uppercase tracking-widest font-figtree">GOLD RATE: 22 KT</p>
//                                             <p className="text-[24px] md:text-[32px] font-bold text-black font-figtree leading-none">
//                                                 <span className="text-[18px] md:text-[22px] mr-0.5">₹</span>{goldWidgetSettings.rate_avg.replace('₹ ', '')}
//                                                 <span className="text-[10px] md:text-[12px] text-zinc-500 font-normal ml-1">/10 gm</span>
//                                             </p>
//                                         </div>
//                                     </div>
//                                     <div className="mt-2 pt-2 md:pt-3 border-t border-zinc-100">
//                                         <p className="text-[9px] md:text-[11px] text-zinc-500 font-figtree">Last Updated - {currentDate}, 10:00 AM</p>
//                                     </div>
//                                 </div>

//                                 {/* BACK FACE: Founder Quote */}
//                                 <div className="absolute inset-0 bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-2xl flex items-center justify-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg) translateZ(1px)' }}>
//                                     <div className="flex gap-3 md:gap-5 items-center w-full h-full">
//                                         {goldWidgetSettings.flip_founder_image && (
//                                             <img
//                                                 src={goldWidgetSettings.flip_founder_image.startsWith('shopify://')
//                                                     ? goldWidgetSettings.flip_founder_image.replace('shopify://shop_images/', 'https://luciraonline.myshopify.com/cdn/shop/files/')
//                                                     : goldWidgetSettings.flip_founder_image
//                                                 }
//                                                 alt={goldWidgetSettings.flip_founder_name}
//                                                 className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-full shadow-md border-2 md:border-4 border-zinc-50 shrink-0"
//                                             />
//                                         )}
//                                         <div className="flex-1 flex flex-col h-full overflow-hidden justify-center">
//                                             <h3 className="text-[12px] md:text-[15px] font-bold text-zinc-900 mb-0.5 md:mb-1 uppercase tracking-tight font-abhaya leading-tight truncate">
//                                                 {goldWidgetSettings.flip_card_title}
//                                             </h3>
//                                             <p className="text-zinc-500 text-[9px] md:text-[12px] leading-snug font-figtree italic mb-1 md:mb-2 md:mt-2 line-clamp-none md:line-clamp-none">
//                                                 "{goldWidgetSettings.flip_card_description}"
//                                             </p>
//                                             <div className="flex items-end justify-between mt-auto">
//                                                 <div className="flex flex-col">
//                                                     <span className="text-[9px] md:text-[12px] font-bold text-zinc-900 uppercase tracking-widest">{goldWidgetSettings.flip_founder_name}</span>
//                                                     <span className="text-[7px] md:text-[10px] text-primary uppercase tracking-widest">{goldWidgetSettings.flip_founder_designation}</span>
//                                                 </div>
//                                                 {goldWidgetSettings.flip_card_link_label && (
//                                                     <Link href={goldWidgetSettings.flip_card_link_url || "#"} className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1">
//                                                         KNOW MORE <ArrowRight size={12} />
//                                                     </Link>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Selectors and Buttons */}
//                         <div className="space-y-3 md:space-y-4 pt-2">
//                             {/* Selectors */}
//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                 <div className="relative group">
//                                     <label className="absolute -top-2 left-3 px-1 bg-transparent text-[10px] text-white/80 font-figtree z-10 backdrop-blur-[2px]">State</label>
//                                     <select
//                                         value={selectedState}
//                                         onChange={handleStateChange}
//                                         className="w-full h-12 border border-white/30 bg-white/5 hover:bg-white/10 rounded-lg px-4 text-white text-[13px] font-figtree font-medium uppercase appearance-none focus:outline-none focus:ring-1 focus:ring-white focus:bg-white/10 transition-all cursor-pointer shadow-inner backdrop-blur-sm"
//                                     >
//                                         <option value="" className="text-black">Select State</option>
//                                         {Object.keys(stateCityMap).map(state => (
//                                             <option key={state} value={state} className="text-black">{state.replace(/-/g, ' ')}</option>
//                                         ))}
//                                     </select>
//                                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none group-hover:text-white transition-colors" size={16} />
//                                 </div>
//                                 <div className="relative group">
//                                     <label className="absolute -top-2 left-3 px-1 bg-transparent text-[10px] text-white/80 font-figtree z-10 backdrop-blur-[2px]">City</label>
//                                     <select
//                                         value={selectedCity}
//                                         onChange={(e) => setSelectedCity(e.target.value)}
//                                         disabled={!selectedState}
//                                         className="w-full h-12 border border-white/30 bg-white/5 hover:bg-white/10 rounded-lg px-4 text-white text-[13px] font-figtree font-medium uppercase appearance-none focus:outline-none focus:ring-1 focus:ring-white focus:bg-white/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-inner backdrop-blur-sm"
//                                     >
//                                         <option value="" className="text-black">Select City</option>
//                                         {(stateCityMap[selectedState] || []).map(city => (
//                                             <option key={city} value={city.toLowerCase().replace(/\s+/g, '-')} className="text-black">{city}</option>
//                                         ))}
//                                     </select>
//                                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none group-hover:text-white transition-colors" size={16} />
//                                 </div>
//                             </div>

//                             {/* Buttons */}
//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                                 <button onClick={handleNavigate} className="group h-12 bg-white text-zinc-900 font-figtree font-bold text-[12px] md:text-[13px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-zinc-100 hover:shadow-xl transition-all shadow-lg active:scale-95">
//                                     CHECK GOLD RATE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
//                                 </button>
//                                 <Link href="/collections/all" className="group h-12 bg-white text-zinc-900 font-figtree font-bold text-[12px] md:text-[13px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-zinc-100 hover:shadow-xl transition-all shadow-lg active:scale-95">
//                                     <ShoppingBag size={16} className="group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform" /> EXPLORE LUCIRA
//                                 </Link>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </section>

//             {/* Calculator Section */}
//             <GoldCalculator cityName={cityName} baseRate={todayRateNum} />

//             {/* Loop through all sections from template JSON in exact order */}
//             <div className="sections-wrapper">
//                 {GOLD_RATE_TEMPLATE.order.map((sectionId) => {
//                     const section = GOLD_RATE_TEMPLATE.sections[sectionId];
//                     if (!section) return null;

//                     switch (section.type) {
//                         case 'gold-calculate-widget':
//                             return (
//                                 <div key={sectionId}>
//                                     <InvestmentSection
//                                         cityName={cityName}
//                                         settings={section.settings}
//                                     />
//                                     {/* Moving PriceTable right after the InvestmentSection as requested */}
//                                     <PriceTable baseRate={todayRateNum} />

//                                     {/* Market Analysis / Stable/Rise/Fall Info moved here so it is directly below the table */}
//                                     <section className="py-12 md:py-15 bg-zinc-50 border-t border-zinc-100 mb-12">
//                                         <div className="container-main">
//                                             <h2 className="text-[18px] md:text-[28px] font-medium text-zinc-900 mb-12 uppercase tracking-tight font-abhaya text-center px-4">
//                                                 Market Analysis: {cityName} – {currentDate}
//                                             </h2>

//                                             <div className="max-w-4xl mx-auto prose prose-zinc prose-lg prose-p:text-[14px] md:prose-p:text-[18px] prose-p:font-figtree prose-headings:font-abhaya prose-headings:uppercase px-2 md:px-0">
//                                                 {diff > THRESHOLD && (
//                                                     <div className="mb-10 md:mb-0 p-8 md:p-12 bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-zinc-100 relative overflow-hidden">
//                                                         <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-green-50/50 rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24 blur-3xl" />
//                                                         <h3 className="text-[18px] md:text-[28px] font-bold mb-6 md:mb-8 text-zinc-900 flex items-center gap-4 font-abhaya">
//                                                             <span className="w-2 md:w-2.5 h-8 md:h-10 bg-green-500 rounded-full" />
//                                                             Gold Rate Rises
//                                                         </h3>
//                                                         <p className="text-zinc-600 leading-relaxed text-[14px] md:text-[18px] font-figtree">
//                                                             In {cityName} on {currentDate}, 24-carat gold is priced at ₹{(todayRateNum).toLocaleString('en-IN')} per 10 grams,
//                                                             while 22-carat gold stands at ₹{Math.round(todayRateNum * (22 / 24)).toLocaleString('en-IN')} per 10 grams.
//                                                         </p>
//                                                     </div>
//                                                 )}
//                                                 {diff < -THRESHOLD && (
//                                                     <div className="mb-10 md:mb-16 p-8 md:p-12 bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-zinc-100 relative overflow-hidden">
//                                                         <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-red-50/50 rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24 blur-3xl" />
//                                                         <h3 className="text-[18px] md:text-[28px] font-bold mb-6 md:mb-8 text-zinc-900 flex items-center gap-4 font-abhaya">
//                                                             <span className="w-2 md:w-2.5 h-8 md:h-10 bg-red-500 rounded-full" />
//                                                             Gold Rate Falls
//                                                         </h3>
//                                                         <p className="text-zinc-600 leading-relaxed text-[14px] md:text-[18px] font-figtree">
//                                                             In {cityName} on {currentDate}, 24-carat gold is available at ₹{(todayRateNum).toLocaleString('en-IN')} per 10 grams,
//                                                             with 22-carat gold priced at ₹{Math.round(todayRateNum * (22 / 24)).toLocaleString('en-IN')} per 10 grams.
//                                                         </p>
//                                                     </div>
//                                                 )}
//                                                 {(diff <= THRESHOLD && diff >= -THRESHOLD) && (
//                                                     <div className="mb-10 md:mb-16 p-8 md:p-12 bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-zinc-100 relative overflow-hidden">
//                                                         <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-blue-50/50 rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24 blur-3xl" />
//                                                         <h3 className="text-[18px] md:text-[28px] font-bold mb-6 md:mb-8 text-zinc-900 flex items-center gap-4 font-abhaya">
//                                                             <span className="w-2 md:w-2.5 h-8 md:h-10 bg-blue-500 rounded-full" />
//                                                             Gold Rate Remains Stable
//                                                         </h3>
//                                                         <p className="text-zinc-600 leading-relaxed text-[14px] md:text-[18px] font-figtree">
//                                                             In {cityName} on {currentDate}, gold prices remain steady with 24-carat gold at ₹{(todayRateNum).toLocaleString('en-IN')} per 10 grams
//                                                             and 22-carat gold at ₹{Math.round(todayRateNum * (22 / 24)).toLocaleString('en-IN')} per 10 grams.
//                                                         </p>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </section>
//                                 </div>
//                             );
//                         case 'information-content-info':
//                             return (
//                                 <InformationContent
//                                     key={sectionId}
//                                     cityName={cityName}
//                                     stateName={stateName}
//                                     sectionData={section}
//                                 />
//                             );
//                         case 'faq-section':
//                             return (
//                                 <FAQSection
//                                     key={sectionId}
//                                     cityName={cityName}
//                                     stateName={stateName}
//                                     todayRate={todayRateNum}
//                                     sectionData={section}
//                                 />
//                             );
//                         default:
//                             return null;
//                     }
//                 })}
//             </div>

//             {/* Shopify Page Body (if any) */}
//             {page.body && (
//                 <section className="py-12 md:py-15 bg-white">
//                     <div className="container-main">
//                         <div className="max-w-4xl mx-auto prose prose-zinc prose-lg prose-p:text-[14px] md:prose-p:text-[18px] prose-p:font-figtree prose-headings:font-abhaya prose-headings:uppercase px-2 md:px-0">
//                             <div
//                                 className="mt-12 md:mt-24 footer-pages pt-12 md:pt-24 border-t border-zinc-100 prose-headings:text-[18px] md:prose-headings:text-[28px] prose-p:text-[14px] md:prose-p:text-[18px] prose-p:leading-relaxed"
//                                 dangerouslySetInnerHTML={{ __html: page.body.replaceAll('[current_date]', currentDate) }}
//                             />
//                         </div>
//                     </div>
//                 </section>
//             )}

//             <style jsx>{`
//                 .perspective-2000 { perspective: 2000px; }
//                 .preserve-3d { transform-style: preserve-3d; }
//                 .backface-hidden { 
//                   backface-visibility: hidden; 
//                   -webkit-backface-visibility: hidden;
//                   -webkit-transform-style: preserve-3d;
//                 }
//                 .rotate-x-180 { transform: rotateX(180deg); }
//                 .font-abhaya { font-family: var(--font-abhaya), serif; }
//                 .font-figtree { font-family: var(--font-figtree), sans-serif; }
                
//                 .gold-flip-back {
//                   transform: rotateX(180deg) translateZ(2px);
//                   backface-visibility: hidden;
//                   -webkit-backface-visibility: hidden;
//                 }
//             `}</style>
//         </div>
//     );
// }
