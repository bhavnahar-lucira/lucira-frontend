"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ArrowRight, ShoppingBag } from "lucide-react";
import FAQSection from "./FAQSection";
import GoldCalculator from "./GoldCalculator";
import InvestmentSection from "./InvestmentSection";
import PriceTable from "./PriceTable";
import InformationContent from "./InformationContent";
import { GOLD_RATE_TEMPLATE } from "@/data/goldRateTemplate";
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

export default function GoldRatePage({ page }) {
    const router = useRouter();
    const [isFlipped, setIsFlipped] = useState(false);

    // Extract city from URL handle if available
    const getInitialCity = () => {
        if (typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            // Extract city slug from URL like /pages/kalyan-gold-rate-today
            const match = pathname.match(/\/pages\/(.+?)-gold-rate-today/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return page?.city?.value?.toLowerCase().replace(/\s+/g, '-') || 'mumbai';
    };

    const [selectedState, setSelectedState] = useState(page?.state?.value?.toLowerCase().replace(/\s+/g, '-') || 'maharashtra');
    const [selectedCity, setSelectedCity] = useState(getInitialCity());
    const [currentDate, setCurrentDate] = useState("");
    const [rates, setRates] = useState(null);

    const cityName = page?.city?.value || "Mumbai";
    const stateName = page?.state?.value || "Maharashtra";

    // Compute the current city display name from selectedCity state
    const cityNameDisplay = useMemo(() => {
        return selectedCity.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }, [selectedCity]);

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
                const data = await fetchLocalRates();
                setRates(data);
            } catch (err) {
                console.error("Failed to fetch rates:", err);
            }
        }
        fetchRates();
    }, []);

    const goldWidgetSettings = useMemo(() => {
        const base = GOLD_RATE_TEMPLATE.sections.gold_calculate_widget_HCyUVc.settings;
        if (!rates) return base;
        return {
            ...base,
            rate_today: `₹ ${(Number(rates.gold_price_24k) || 154002).toLocaleString('en-IN')}`,
            rate_yesterday: `₹ ${(Number(rates.gold_price_24k_yesterday) || 155053).toLocaleString('en-IN')}`,
            rate_avg: `₹ ${(Number(rates.gold_price_22k) || 141682).toLocaleString('en-IN')}`,
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
        window.location.href = `/pages/${selectedCity}-gold-rate-today`;
    };

    const todayRateNum = parseInt(goldWidgetSettings.rate_today.replace(/[₹, ]/g, '')) || 0;
    const yesterdayRateNum = parseInt(goldWidgetSettings.rate_yesterday.replace(/[₹, ]/g, '')) || 0;
    const diff = todayRateNum - yesterdayRateNum;
    const THRESHOLD = 500;

    return (
        <div className="gold-rate-page bg-white min-h-screen font-figtree overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative w-full flex flex-col justify-start overflow-hidden pt-6 md:pt-10 lg:pt-12 pb-12 lg:pb-10 min-h-[600px] lg:min-h-[600px]">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-105"
                    style={{ backgroundImage: "url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/qwer.png?v=1781953219')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10 z-[1]" />

                <div className="relative z-10 w-full px-6 md:px-10 lg:px-12 flex flex-col items-start">
                    <div className="w-full lg:w-[600px] xl:w-[650px] space-y-5 lg:space-y-6">
                        {/* Header Row */}
                        <div className="flex flex-row justify-between items-center w-full gap-4">
                            <h1 className="text-white text-[18px] md:text-[24px] lg:text-[26px] font-medium tracking-tight font-abhaya uppercase whitespace-nowrap">
                                TODAYS GOLD RATE IN {cityNameDisplay}
                            </h1>
                            <button onClick={() => setIsFlipped(!isFlipped)} className="text-white/80 hover:text-white text-[12px] md:text-[14px] underline underline-offset-4 tracking-wide font-figtree transition-colors text-right whitespace-nowrap shrink-0">
                                {isFlipped ? "View Todays Gold Rate" : "Is Gold A Wise Investment?"}
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
                                            <p className="text-[10px] md:text-[12px] text-zinc-600 uppercase tracking-widest font-figtree">GOLD RATE: 24 KT</p>
                                            <p className="text-[24px] md:text-[32px] font-bold text-black font-figtree leading-none">
                                                <span className="text-[18px] md:text-[22px] mr-0.5">₹</span>{goldWidgetSettings.rate_today.replace('₹ ', '')}
                                                <span className="text-[10px] md:text-[12px] text-zinc-500 font-normal ml-1">/10 gm</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1 md:space-y-2 pl-4">
                                            <p className="text-[10px] md:text-[12px] text-zinc-600 uppercase tracking-widest font-figtree">GOLD RATE: 22 KT</p>
                                            <p className="text-[24px] md:text-[32px] font-bold text-black font-figtree leading-none">
                                                <span className="text-[18px] md:text-[22px] mr-0.5">₹</span>{goldWidgetSettings.rate_avg.replace('₹ ', '')}
                                                <span className="text-[10px] md:text-[12px] text-zinc-500 font-normal ml-1">/10 gm</span>
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
                                        {goldWidgetSettings.flip_founder_image && (
                                            <img
                                                src={goldWidgetSettings.flip_founder_image.startsWith('shopify://')
                                                    ? goldWidgetSettings.flip_founder_image.replace('shopify://shop_images/', 'https://luciraonline.myshopify.com/cdn/shop/files/')
                                                    : goldWidgetSettings.flip_founder_image
                                                }
                                                alt={goldWidgetSettings.flip_founder_name}
                                                className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-full shadow-md border-2 md:border-4 border-zinc-50 shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 flex flex-col h-full overflow-hidden justify-center">
                                            <h3 className="text-[12px] md:text-[15px] font-bold text-zinc-900 mb-0.5 md:mb-1 uppercase tracking-tight font-abhaya leading-tight truncate">
                                                {goldWidgetSettings.flip_card_title}
                                            </h3>
                                            <p className="text-zinc-500 text-[9px] md:text-[14px] leading-snug font-figtree italic mb-1 md:mb-2 md:mt-2 line-clamp-none md:line-clamp-none">
                                                "{goldWidgetSettings.flip_card_description}"
                                            </p>
                                            <div className="flex items-end justify-between mt-auto">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] md:text-[10px] font-bold text-zinc-900 uppercase tracking-widest">{goldWidgetSettings.flip_founder_name}</span>
                                                    <span className="text-[7px] md:text-[8px] text-primary uppercase tracking-widest">{goldWidgetSettings.flip_founder_designation}</span>
                                                </div>
                                                {goldWidgetSettings.flip_card_link_label && (
                                                    <Link prefetch={false} href={goldWidgetSettings.flip_card_link_url || "#"} className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1">
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
                                    CHECK GOLD RATE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link prefetch={false} href="/collections/jewelry" className="group h-12 bg-white text-zinc-900 font-figtree font-bold text-[12px] md:text-[13px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-zinc-100 hover:shadow-xl transition-all shadow-lg active:scale-95">
                                    <ShoppingBag size={16} className="group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform" /> EXPLORE LUCIRA
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Calculator Section */}
            <GoldCalculator cityName={cityNameDisplay} baseRate={todayRateNum} />

            {/* Loop through all sections from template JSON in exact order */}
            <div className="sections-wrapper">
                {GOLD_RATE_TEMPLATE.order.map((sectionId) => {
                    const section = GOLD_RATE_TEMPLATE.sections[sectionId];
                    if (!section) return null;

                    switch (section.type) {
                        case 'gold-calculate-widget':
                            return (
                                <div key={sectionId}>
                                    <InvestmentSection
                                        cityName={cityNameDisplay}
                                        settings={section.settings}
                                    />
                                    {/* Moving PriceTable right after the InvestmentSection as requested */}
                                    <PriceTable baseRate={todayRateNum} />

                                    {/* Market Analysis / Stable/Rise/Fall Info moved here so it is directly below the table */}

                                </div>
                            );
                        case 'information-content-info':
                            return (
                                <InformationContent
                                    key={sectionId}
                                    cityName={cityNameDisplay}
                                    stateName={stateName}
                                    sectionData={section}
                                />
                            );
                        case 'faq-section':
                            return (
                                <FAQSection
                                    key={sectionId}
                                    cityName={cityNameDisplay}
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
            {page.body && (() => {
                const processedBody = page.body
                    .replaceAll('[current_date]', currentDate)
                    .replaceAll('{{ page.metafields.custom.city_name.value }}', cityNameDisplay)
                    .replaceAll('{{ page.metafields.custom.state_name.value }}', stateName);

                // Extract FAQ section (details elements) from the body
                const faqRegex = /<details[^>]*>[\s\S]*?<\/details>/gi;
                const faqMatches = processedBody.match(faqRegex) || [];
                const mainContent = processedBody.replace(faqRegex, '');

                return (
                    <>
                        {/* Main content without FAQ */}
                        <section className="py-8 md:py-12 bg-[#FAF3EC]/30">
                            <div className="container-main">
                                <div className="max-w-6xl mx-auto px-4 md:px-0">
                                    <div
                                        className="footer-pages border-t border-zinc-200 pt-4 md:pt-6"
                                        dangerouslySetInnerHTML={{ __html: mainContent }}
                                    />

                                    {/* Redesigned Dynamic Rates Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-4">
                                        {[
                                            { karat: '24K', price: Math.round(todayRateNum) },
                                            { karat: '22K', price: Math.round(goldWidgetSettings.rate_avg ? parseInt(goldWidgetSettings.rate_avg.replace(/[₹, ]/g, '')) : (todayRateNum * 22 / 24)) },
                                            { karat: '18K', price: Math.round(todayRateNum * 18 / 24) },
                                            { karat: '14K', price: Math.round(todayRateNum * 14 / 24) }
                                        ].map(rate => (
                                            <div key={rate.karat} className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
                                                <span className="text-zinc-400 text-[11px] md:text-xs font-medium uppercase tracking-wider font-figtree">{rate.karat}</span>
                                                <span className="text-zinc-900 text-xl md:text-2xl font-bold font-figtree">₹{rate.price.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-zinc-500 text-xs md:text-sm font-figtree mb-8">Updated {currentDate}</p>
                                </div>
                            </div>
                        </section>

                        {/* FAQ section at the bottom */}
                        {faqMatches.length > 0 && (
                            <section className="py-8 md:py-12 bg-[#FAF3EC]/30">
                                <div className="container-main">
                                    <div className="max-w-6xl mx-auto px-4 md:px-0">
                                        <div
                                            className="footer-pages border-t border-zinc-200 pt-4 md:pt-6"
                                            dangerouslySetInnerHTML={{ __html: faqMatches.join('') }}
                                        />
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                );
            })()}

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
                
                /* Typography for dynamically injected content (footer-pages) */
                .footer-pages {
                  color: #3f3f46; /* zinc-700 */
                }
                .footer-pages h1, .footer-pages h2, .footer-pages h3, .footer-pages h4, .footer-pages h5, .footer-pages h6 {
                  font-family: var(--font-abhaya), serif;
                  color: #18181b; /* zinc-900 */
                  font-weight: 600;
                  margin-top: 2em;
                  margin-bottom: 1em;
                  line-height: 1.3;
                }
                .footer-pages h1 { font-size: 2.625rem; } /* 42px - matching site standard */
                .footer-pages h2 { font-size: 2.25rem; } /* 36px */
                .footer-pages h3 { font-size: 1.875rem; } /* 30px */
                .footer-pages h4 { font-size: 1.5rem; } /* 24px */
                .footer-pages p {
                  font-family: var(--font-figtree), sans-serif;
                  font-size: 1.25rem; /* 20px - increased from 18px */
                  line-height: 1.75;
                  margin-top: 1.25em;
                  margin-bottom: 1.25em;
                }
                .footer-pages a {
                  color: #000;
                  text-decoration: underline;
                  font-weight: 500;
                }
                .footer-pages strong {
                  font-weight: 700;
                  color: #18181b;
                }
                .footer-pages ul, .footer-pages ol {
                  margin-top: 1.25em;
                  margin-bottom: 1.25em;
                  padding-left: 1.625em;
                }
                .footer-pages ul { list-style-type: disc; }
                .footer-pages ol { list-style-type: decimal; }
                .footer-pages li {
                  margin-top: 0.5em;
                  margin-bottom: 0.5em;
                  font-family: var(--font-figtree), sans-serif;
                  font-size: 1.125rem;
                  line-height: 1.75;
                }
                .footer-pages blockquote {
                  border-left: 4px solid #e4e4e7;
                  padding-left: 1em;
                  font-style: italic;
                  color: #52525b;
                }
                .footer-pages table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 2em;
                  margin-bottom: 2em;
                  font-family: var(--font-figtree), sans-serif;
                  border-radius: 1rem;
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(163, 130, 113, 0.08);
                  border: 2px solid #F2E3C6;
                }
                .footer-pages th {
                  background: linear-gradient(to bottom, #FFFDF9, #FDF4E5);
                  font-weight: 700;
                  color: #3F332A;
                  padding: 1rem 1.25rem;
                  text-align: left;
                  border: 1px solid #F2E3C6;
                  border-bottom: 2px solid #D4B392;
                  font-family: var(--font-abhaya), serif;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  font-size: 0.9rem;
                }
                .footer-pages td {
                  padding: 1rem 1.25rem;
                  text-align: left;
                  border: 1px solid #F2E3C6;
                  color: #5C4A3D;
                  background: white;
                }
                .footer-pages tr:hover td {
                  background: linear-gradient(to bottom, #FFFDF9, #FDF4E5);
                }
                
                /* FAQ Details / Summary styling */
                .footer-pages details {
                  border-bottom: 1px solid #e4e4e7;
                  padding: 1.5rem 0;
                }
                .footer-pages summary {
                  font-family: var(--font-figtree), sans-serif;
                  font-weight: 600;
                  font-size: 1.25rem;
                  cursor: pointer;
                  list-style: none;
                  position: relative;
                  padding-right: 2rem;
                  color: #18181b;
                }
                .footer-pages summary::-webkit-details-marker {
                  display: none;
                }
                .footer-pages summary::after {
                  content: '+';
                  position: absolute;
                  right: 0;
                  top: 50%;
                  transform: translateY(-50%);
                  font-size: 1.5rem;
                  font-weight: 400;
                  color: #71717a;
                }
                .footer-pages details[open] summary::after {
                  content: '−';
                }
                .footer-pages details > p {
                  margin-top: 1rem;
                  margin-bottom: 0;
                  color: #52525b;
                }
            `}</style>
        </div>
    );
}
