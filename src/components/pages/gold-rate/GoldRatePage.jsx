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
import GoldMetaContent from "./GoldMetaContent";
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

    // Shopify Gold Rate City metaobject content (fetched via Storefront API in page.js).
    const goldMeta = page?.goldMeta || null;

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

    // ── First-fold rates: prefer the server-fetched gold_rate_history entry so
    // the direct-answer paragraph and rate strip are present in the SSR HTML
    // (crawlers and AI engines read real numbers without waiting for JS).
    const heroHistory = Array.isArray(goldMeta?.history) ? goldMeta.history : [];
    const heroCur = heroHistory.find((e) => e.cur === "true") || heroHistory[0] || null;
    const heroR24 = Math.round((heroCur && heroCur.r24) || todayRateNum || 0);
    const heroR22 = Math.round((heroCur && heroCur.r22) || parseInt((goldWidgetSettings.rate_avg || "").replace(/[₹, ]/g, "")) || Math.round(heroR24 * 22 / 24));
    const heroR18 = Math.round((heroCur && heroCur.r18) || Math.round(heroR24 * 18 / 24));
    const heroR14 = Math.round((heroCur && heroCur.r14) || Math.round(heroR24 * 14 / 24));
    // gold_rate_history values are per gram; multiply for the /10g line.
    const perGram = (v) => Math.round(v).toLocaleString("en-IN");
    const per10g = (v) => Math.round(v * 10).toLocaleString("en-IN");
    let heroDateStr = "";
    try {
        if (heroCur && heroCur.date) {
            heroDateStr = new Date(heroCur.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        }
    } catch { heroDateStr = ""; }

    return (
        <div className="gold-rate-page bg-white min-h-screen font-figtree overflow-x-hidden">
            {/* First fold: content-first, SEO/AEO optimised. Breadcrumb, H1,
                direct-answer paragraph and rate strip are all server-rendered. */}
            <section className="relative w-full bg-[#FFFDF9] border-b border-[#F2E3C6]/70 pt-6 md:pt-10 pb-8 md:pb-12">
                <div className="container-main max-w-6xl mx-auto px-4 md:px-6">
                    <nav aria-label="Breadcrumb" className="text-[11px] md:text-xs text-zinc-400 font-figtree mb-3">
                        <Link prefetch={false} href="/" className="hover:text-zinc-600 transition-colors">Home</Link>
                        <span className="mx-1.5">/</span>
                        <span className="text-zinc-600">Gold Rate in {cityNameDisplay}</span>
                    </nav>

                    <h1 className="font-abhaya text-[30px] md:text-[44px] leading-tight text-zinc-900 font-semibold">
                        {(goldMeta && goldMeta.heroTitle) || `Gold Rate in ${cityNameDisplay} Today`}
                    </h1>

                    <p className="font-figtree text-[15px] md:text-[17px] text-zinc-700 leading-relaxed mt-3 md:mt-4 max-w-3xl">
                        The gold rate in {cityNameDisplay} today is <strong>₹{perGram(heroR22)} per gram for 22 karat gold (916)</strong> and{" "}
                        <strong>₹{perGram(heroR24)} per gram for 24 karat gold (999)</strong>. 18 karat gold is priced at ₹{perGram(heroR18)} per gram
                        and 14 karat at ₹{perGram(heroR14)} per gram. Rates are indicative bullion rates updated every business day from MCX and IBJA
                        benchmarks, and exclude GST and making charges.{heroDateStr ? ` Last updated ${heroDateStr}.` : ""}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-5 md:mt-7">
                        {[["24K · 999", heroR24], ["22K · 916", heroR22], ["18K · 750", heroR18], ["14K · 585", heroR14]].map(([k, v]) => (
                            <div key={k} className="bg-white border border-[#F2E3C6] rounded-xl p-3.5 md:p-4 shadow-[0_2px_10px_rgba(163,130,113,0.06)]">
                                <span className="block text-[10px] md:text-[11px] uppercase tracking-widest text-zinc-400 font-figtree">{k}</span>
                                <span className="block text-zinc-900 text-lg md:text-2xl font-bold font-figtree mt-1">
                                    ₹{perGram(v)}<span className="text-[11px] md:text-xs font-normal text-zinc-400 ml-0.5">/g</span>
                                </span>
                                <span className="block text-[11px] md:text-xs text-zinc-500 font-figtree mt-0.5">₹{per10g(v)} /10g</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end max-w-4xl">
                        <div className="relative group">
                            <label className="block text-[11px] text-zinc-500 font-figtree mb-1">State</label>
                            <select
                                value={selectedState}
                                onChange={handleStateChange}
                                className="w-full h-11 border border-[#E8D5B5] bg-white rounded-lg px-3 pr-8 text-zinc-800 text-[13px] font-figtree font-medium uppercase appearance-none focus:outline-none focus:ring-1 focus:ring-[#D4B392] transition-all cursor-pointer"
                            >
                                <option value="">Select State</option>
                                {Object.keys(stateCityMap).map(state => (
                                    <option key={state} value={state}>{state.replace(/-/g, " ")}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 bottom-3.5 text-zinc-400 pointer-events-none" size={15} />
                        </div>
                        <div className="relative group">
                            <label className="block text-[11px] text-zinc-500 font-figtree mb-1">City</label>
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                disabled={!selectedState}
                                className="w-full h-11 border border-[#E8D5B5] bg-white rounded-lg px-3 pr-8 text-zinc-800 text-[13px] font-figtree font-medium uppercase appearance-none focus:outline-none focus:ring-1 focus:ring-[#D4B392] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select City</option>
                                {(stateCityMap[selectedState] || []).map(city => (
                                    <option key={city} value={city.toLowerCase().replace(/\s+/g, "-")}>{city}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 bottom-3.5 text-zinc-400 pointer-events-none" size={15} />
                        </div>
                        <button onClick={handleNavigate} className="group h-11 px-5 bg-zinc-900 text-white font-figtree font-bold text-[12px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-zinc-700 transition-all active:scale-95">
                            CHECK RATE <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link prefetch={false} href="/collections/gold-jewelry" className="group h-11 px-5 bg-white border border-[#E8D5B5] text-zinc-800 font-figtree font-bold text-[12px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-[#FAF3EC] transition-all active:scale-95">
                            <ShoppingBag size={15} className="group-hover:-translate-y-0.5 transition-transform" /> SHOP GOLD
                        </Link>
                    </div>
                </div>
            </section>

            {/* Calculator Section — prefer server-fetched history rate over the
                client-fetched widget rate so the calculator is correct on first paint */}
            <GoldCalculator cityName={cityNameDisplay} baseRate={heroR24 || todayRateNum} />

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
                                    <PriceTable baseRate={heroR24 || todayRateNum} />

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

            {/* Gold content: metaobject (Storefront API) first, scraped page.body as fallback */}
            {goldMeta ? (
                <GoldMetaContent
                    goldMeta={goldMeta}
                    cityName={cityNameDisplay}
                    stateName={stateName}
                    rate24k={todayRateNum}
                    rate22k={parseInt((goldWidgetSettings.rate_avg || '').replace(/[₹, ]/g, '')) || 0}
                    rate24kYesterday={yesterdayRateNum}
                    currentDate={currentDate}
                />
            ) : page.body && (() => {
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

            <style jsx global>{`
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
                @media (max-width: 768px) {
                  /* Wide tables exceed the phone viewport; scroll them
                     horizontally instead of clipping the right columns. */
                  .footer-pages table {
                    display: block;
                    max-width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                  }
                  .footer-pages table thead,
                  .footer-pages table tbody {
                    width: max-content;
                    min-width: 100%;
                  }
                  .footer-pages th,
                  .footer-pages td {
                    padding: 0.75rem;
                  }
                  .footer-pages th {
                    font-size: 0.75rem;
                  }
                  .footer-pages td {
                    font-size: 0.8125rem;
                  }
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
