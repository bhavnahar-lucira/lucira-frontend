"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, ShoppingBag } from "lucide-react";
import SilverFAQSection from "./SilverFAQSection";
import SilverCalculator from "./SilverCalculator";
import SilverInvestmentSection from "./SilverInvestmentSection";
import SilverPriceTable from "./SilverPriceTable";
import SilverInformationContent from "./SilverInformationContent";
import { SILVER_RATE_TEMPLATE } from "@/data/silverRateTemplate";

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

export default function SilverRatePage({ page }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedState, setSelectedState] = useState(page?.state?.value?.toLowerCase().replace(/\s+/g, '-') || 'maharashtra');
    const [selectedCity, setSelectedCity] = useState(page?.city?.value?.toLowerCase().replace(/\s+/g, '-') || 'mumbai');
    const [currentDate, setCurrentDate] = useState("");
    const [rates, setRates] = useState(null);

    const cityName = page?.city?.value || "Mumbai";
    const stateName = page?.state?.value || "Maharashtra";

    useEffect(() => {
        const today = new Date();
        const day = today.getDate();
        const getDaySuffix = (d) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
        const formattedDate = `${day}${getDaySuffix(day)} ${today.toLocaleString('en-IN', { month: 'short' })}, ${today.getFullYear()}`;
        setCurrentDate(formattedDate);

        async function fetchRates() {
            try {
                const res = await fetch("/api/silver-rates");
                if (res.ok) {
                    const data = await res.json();
                    setRates(data);
                }
            } catch (err) {
                console.error("Failed to fetch rates:", err);
            }
        }
        fetchRates();
    }, []);

    const silverWidgetSettings = useMemo(() => {
        const base = SILVER_RATE_TEMPLATE.sections.silver_calculate_widget_Y9tR3F.settings;
        if (!rates) return {
            ...base,
            flip_founder_image: base.flip_founder_image || "shopify://shop_images/612a521c6534a80708c03812f6a24fb301fc6dfa_1.png",
            flip_founder_name: base.flip_founder_name || "Rupesh Jain",
            flip_founder_designation: base.flip_founder_designation || "Founder",
        };
        return {
            ...base,
            flip_founder_image: base.flip_founder_image || "shopify://shop_images/612a521c6534a80708c03812f6a24fb301fc6dfa_1.png",
            flip_founder_name: base.flip_founder_name || "Rupesh Jain",
            flip_founder_designation: base.flip_founder_designation || "Founder",
            rate_today: `₹ ${(Number(rates.silver_price) * 10 || parseInt(base.rate_today.replace(/[^\d]/g, ''))).toLocaleString('en-IN')}`,
            rate_avg: `₹ ${(Number(rates.silver_price) * 1000 || parseInt(base.rate_avg.replace(/[^\d]/g, ''))).toLocaleString('en-IN')}`,
        };
    }, [rates]);

    const handleStateChange = (e) => {
        const newState = e.target.value;
        setSelectedState(newState);
        if (stateCityMap[newState] && stateCityMap[newState].length > 0) {
            setSelectedCity(stateCityMap[newState][0].toLowerCase().replace(/\s+/g, '-'));
        }
    };

    const handleNavigate = () => {
        window.location.href = `/pages/${selectedCity}-silver-rate-today`;
    };

    const todayRateNum = parseInt(silverWidgetSettings.rate_today.replace(/[₹, ]/g, '')) || 0;

    return (
        <div className="silver-rate-page bg-white min-h-screen font-figtree overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative w-full flex flex-col justify-start overflow-hidden pt-6 md:pt-10 lg:pt-12 pb-12 lg:pb-10 min-h-[600px] lg:min-h-[600px]">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
                    style={{ backgroundImage: `url(${silverWidgetSettings.background_image?.replace('shopify://shop_images/', 'https://luciraonline.myshopify.com/cdn/shop/files/') || 'https://luciraonline.myshopify.com/cdn/shop/files/baneer-gold.jpg'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 z-[1]" />

                <div className="relative z-10 w-full px-6 md:px-10 lg:px-12 flex flex-col items-start">
                    <div className="w-full lg:w-[600px] xl:w-[650px] space-y-5 lg:space-y-6">
                        {/* Header Row */}
                        <div className="flex flex-row justify-between items-center w-full gap-4">
                            <h1 className="text-white text-[18px] md:text-[24px] lg:text-[26px] font-medium tracking-tight font-abhaya uppercase whitespace-nowrap">
                                TODAYS SILVER RATE IN {cityName}
                            </h1>
                            <button onClick={() => setIsFlipped(!isFlipped)} className="text-white/80 hover:text-white text-[12px] md:text-[14px] underline underline-offset-4 tracking-wide font-figtree transition-colors text-right whitespace-nowrap shrink-0">
                                {isFlipped ? "View Todays Silver Rate" : "Is Silver A Wise Investment?"}
                            </button>
                        </div>

                        {/* Flip Container */}
                        <div className="perspective-2000 w-full group relative h-[140px] md:h-[180px]">
                            <div
                                className={`relative w-full h-full transition-all duration-1000 preserve-3d cursor-pointer hover:scale-[1.02] ${isFlipped ? 'rotate-x-180' : ''}`}
                                style={{ transformStyle: 'preserve-3d' }}
                                onClick={() => setIsFlipped(!isFlipped)}
                            >

                                {/* FRONT FACE: Rates Card */}
                                <div className="absolute inset-0 bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col justify-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}>
                                    <div className="grid grid-cols-2 gap-2 md:gap-4 divide-x divide-zinc-100 md:pt-4">
                                        <div className="space-y-1 md:space-y-2 pr-2">
                                            <p className="text-[10px] md:text-[12px] text-zinc-600 uppercase tracking-widest font-figtree">999 SILVER RATE</p>
                                            <p className="text-[24px] md:text-[32px] font-bold text-black font-figtree leading-none">
                                                <span className="text-[18px] md:text-[22px] mr-0.5">₹</span>{silverWidgetSettings.rate_today.replace('₹', '').trim()}
                                                <span className="text-[10px] md:text-[12px] text-zinc-500 font-normal ml-1">/10 gm</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1 md:space-y-2 pl-4">
                                            <p className="text-[10px] md:text-[12px] text-zinc-600 uppercase tracking-widest font-figtree">999 SILVER RATE</p>
                                            <p className="text-[24px] md:text-[32px] font-bold text-black font-figtree leading-none">
                                                <span className="text-[18px] md:text-[22px] mr-0.5">₹</span>{silverWidgetSettings.rate_avg.replace('₹', '').trim()}
                                                <span className="text-[10px] md:text-[12px] text-zinc-500 font-normal ml-1">/1 Kg</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 md:pt-3 border-t border-zinc-100">
                                        <p className="text-[9px] md:text-[11px] text-zinc-500 font-figtree">Last Updated - {currentDate}, 10:00 AM</p>
                                    </div>
                                </div>

                                {/* BACK FACE: Founder Quote */}
                                <div className="absolute inset-0 bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-2xl flex items-center justify-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg) translateZ(1px)' }}>
                                    <div className="flex gap-3 md:gap-5 items-center w-full h-full">
                                        {silverWidgetSettings.flip_founder_image && (
                                            <img
                                                src={silverWidgetSettings.flip_founder_image.startsWith('shopify://')
                                                    ? silverWidgetSettings.flip_founder_image.replace('shopify://shop_images/', 'https://luciraonline.myshopify.com/cdn/shop/files/')
                                                    : silverWidgetSettings.flip_founder_image
                                                }
                                                alt={silverWidgetSettings.flip_founder_name}
                                                className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-full shadow-md border-2 md:border-4 border-zinc-50 shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 flex flex-col h-full overflow-hidden justify-center">
                                            <h3 className="text-[12px] md:text-[15px] font-bold text-zinc-900 mb-0.5 md:mb-1 uppercase tracking-tight font-abhaya leading-tight truncate">
                                                {silverWidgetSettings.flip_card_title || "Why Invest in Silver?"}
                                            </h3>
                                            <p className="text-zinc-500 text-[9px] md:text-[14px] leading-snug font-figtree italic mb-1 md:mb-2 md:mt-2 line-clamp-none md:line-clamp-none">
                                                "Silver is having its moment—and it’s here to stay. Versatile, accessible, and effortlessly stylish. If you’re building a collection you can actually live in, now is the time to invest in silver."
                                            </p>
                                            <div className="flex items-end justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] md:text-[10px] font-bold text-zinc-900 uppercase tracking-widest">{silverWidgetSettings.flip_founder_name}</span>
                                                    <span className="text-[7px] md:text-[8px] text-primary uppercase tracking-widest">{silverWidgetSettings.flip_founder_designation}</span>
                                                </div>
                                                {silverWidgetSettings.flip_card_link_label && (
                                                    <Link href={silverWidgetSettings.flip_card_link_url || "#"} className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1">
                                                        KNOW MORE <ArrowRight size={12} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selectors and Buttons */}
                        <div className="space-y-3 md:space-y-4 pt-2">
                            {/* Selectors */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <label className="absolute -top-2 left-3 px-1 bg-transparent text-[10px] text-white/80 font-figtree z-10 backdrop-blur-[2px]">State</label>
                                    <select
                                        value={selectedState}
                                        onChange={handleStateChange}
                                        className="w-full h-12 border border-white/30 bg-white/5 hover:bg-white/10 rounded-lg px-4 text-white text-[13px] font-figtree font-medium uppercase appearance-none focus:outline-none focus:ring-1 focus:ring-white focus:bg-white/10 transition-all cursor-pointer shadow-inner backdrop-blur-sm"
                                    >
                                        <option value="" className="text-black">Select State</option>
                                        {Object.keys(stateCityMap).map(state => (
                                            <option key={state} value={state} className="text-black">{state.replace(/-/g, ' ')}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none group-hover:text-white transition-colors" size={16} />
                                </div>
                                <div className="relative group">
                                    <label className="absolute -top-2 left-3 px-1 bg-transparent text-[10px] text-white/80 font-figtree z-10 backdrop-blur-[2px]">City</label>
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        disabled={!selectedState}
                                        className="w-full h-12 border border-white/30 bg-white/5 hover:bg-white/10 rounded-lg px-4 text-white text-[13px] font-figtree font-medium uppercase appearance-none focus:outline-none focus:ring-1 focus:ring-white focus:bg-white/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-inner backdrop-blur-sm"
                                    >
                                        <option value="" className="text-black">Select City</option>
                                        {(stateCityMap[selectedState] || []).map(city => (
                                            <option key={city} value={city.toLowerCase().replace(/\s+/g, '-')} className="text-black">{city}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none group-hover:text-white transition-colors" size={16} />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={handleNavigate} className="group h-12 bg-white text-zinc-900 font-figtree font-bold text-[12px] md:text-[13px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-zinc-100 hover:shadow-xl transition-all shadow-lg active:scale-95">
                                    CHECK SILVER RATE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link href="/collections/all" className="group h-12 bg-white text-zinc-900 font-figtree font-bold text-[12px] md:text-[13px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-zinc-100 hover:shadow-xl transition-all shadow-lg active:scale-95">
                                    <ShoppingBag size={16} className="group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform" /> EXPLORE LUCIRA
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Calculator Section */}
            <SilverCalculator cityName={cityName} baseRate={todayRateNum} />

            {/* Loop through all sections from template JSON in exact order */}
            <div className="sections-wrapper">
                {SILVER_RATE_TEMPLATE.order.map((sectionId) => {
                    const section = SILVER_RATE_TEMPLATE.sections[sectionId];
                    if (!section) return null;

                    switch (section.type) {
                        case 'silver-calculate-widget':
                            return (
                                <div key={sectionId}>
                                    <SilverInvestmentSection
                                        cityName={cityName}
                                        settings={section.settings}
                                    />
                                    {/* Moving PriceTable right after the InvestmentSection as requested */}
                                    <SilverPriceTable baseRate={todayRateNum} />
                                </div>
                            );
                        case 'information-content-info':
                            return (
                                <SilverInformationContent
                                    key={sectionId}
                                    cityName={cityName}
                                    stateName={stateName}
                                    sectionData={section}
                                />
                            );
                        case 'faq-section':
                            return (
                                <SilverFAQSection
                                    key={sectionId}
                                    cityName={cityName}
                                    stateName={stateName}
                                    todayRate={todayRateNum}
                                    sectionData={section}
                                />
                            );
                        default:
                            return null;
                    }
                })}
            </div>

            {/* Shopify Page Body (if any) */}
            {page.body && (
                <section className="py-12 md:py-15 bg-white">
                    <div className="container-main">
                        <div className="max-w-4xl mx-auto prose prose-zinc prose-lg prose-p:text-[14px] md:prose-p:text-[18px] prose-p:font-figtree prose-headings:font-abhaya prose-headings:uppercase px-2 md:px-0">
                            <div
                                className="mt-12 md:mt-24 footer-pages pt-12 md:pt-24 border-t border-zinc-100 prose-headings:text-[18px] md:prose-headings:text-[28px] prose-p:text-[14px] md:prose-p:text-[18px] prose-p:leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: page.body.replaceAll('[current_date]', currentDate) }}
                            />
                        </div>
                    </div>
                </section>
            )}

            <style jsx>{`
                .perspective-2000 { perspective: 2000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { 
                  backface-visibility: hidden; 
                  -webkit-backface-visibility: hidden;
                  -webkit-transform-style: preserve-3d;
                }
                .rotate-x-180 { transform: rotateX(180deg); }
                .font-abhaya { font-family: var(--font-abhaya), serif; }
                .font-figtree { font-family: var(--font-figtree), sans-serif; }
                
                .gold-flip-back {
                  transform: rotateX(180deg) translateZ(2px);
                  backface-visibility: hidden;
                  -webkit-backface-visibility: hidden;
                }
            `}</style>
        </div>
    );
}
