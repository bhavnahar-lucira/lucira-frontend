"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ArrowRight, ShoppingBag } from "lucide-react";
import PlatinumFAQSection from "./PlatinumFAQSection";
import PlatinumCalculator from "./PlatinumCalculator";
import PlatinumInvestmentSection from "./PlatinumInvestmentSection";
import PlatinumPriceTable from "./PlatinumPriceTable";
import PlatinumInformationContent from "./PlatinumInformationContent";
import PlatinumMetaContent from "./PlatinumMetaContent";
import OnThisPage from "../gold-rate/OnThisPage";
import { PLATINUM_RATE_TEMPLATE } from "@/data/platinumRateTemplate";
import { buildPlatinumRateSections } from "@/lib/platinumRateSections";
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

// "new-delhi" → "New Delhi". Lowercased first so a Caps-Lock URL that reached us
// without a redirect can't leak "MYSORE" into the headings.
function titleCaseSlug(slug) {
    return String(slug || '')
        .toLowerCase()
        .split('-')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// Mirror of GoldRatePage for the platinum rate city pages: content-first fold,
// calculator, "On this page" jump links, then the platinum_rate_city metaobject
// content (PlatinumMetaContent). Cities whose page has no linked metaobject fall
// back to the hardcoded PLATINUM_RATE_TEMPLATE sections, exactly like gold falls
// back to its template when the metaobject is missing.
export default function PlatinumRatePage({ page }) {
    const router = useRouter();

    // The city this page is *about*, resolved server-side from the URL handle.
    // Read it from the prop rather than window.location so SSR and hydration
    // agree, and so it stays put while the visitor browses the dropdowns.
    const pageCitySlug = (page?.city?.value || 'Mumbai').toLowerCase().replace(/\s+/g, '-');

    const [selectedState, setSelectedState] = useState(page?.state?.value?.toLowerCase().replace(/\s+/g, '-') || 'maharashtra');
    const [selectedCity, setSelectedCity] = useState(pageCitySlug);
    const [currentDate, setCurrentDate] = useState("");
    const [rates, setRates] = useState(null);

    const cityName = page?.city?.value || "Mumbai";
    const stateName = page?.state?.value || "Maharashtra";

    // Shopify Platinum Rate City metaobject content (fetched via Storefront API in page.js).
    const platinumMeta = page?.platinumMeta || null;

    // Display name for the city, used in the breadcrumb, H1, direct-answer
    // paragraph and every child section. The metaobject's city_name wins over
    // the URL slug (same reasoning as gold: slugs keep legacy spellings for
    // SEO/backlink continuity while the authored copy uses the current one).
    const cityNameDisplay = useMemo(() => {
        return (platinumMeta?.cityName || '').trim() || titleCaseSlug(pageCitySlug);
    }, [platinumMeta, pageCitySlug]);

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

    const platinumWidgetSettings = useMemo(() => {
        const base = PLATINUM_RATE_TEMPLATE.sections.platinum_calculate_widget_PRDzWq.settings;
        const founderDefaults = {
            flip_founder_image: base.flip_founder_image || "shopify://shop_images/612a521c6534a80708c03812f6a24fb301fc6dfa_1.png",
            flip_founder_name: base.flip_founder_name || "Rupesh Jain",
            flip_founder_designation: base.flip_founder_designation || "Founder",
        };
        if (!rates) return { ...base, ...founderDefaults };
        return {
            ...base,
            ...founderDefaults,
            rate_today: `₹ ${(Number(rates.platinum_price) * 10 || parseInt(base.rate_today.replace(/[^\d]/g, ''))).toLocaleString('en-IN')}`,
            rate_avg: `₹ ${(Number(rates.platinum_price) * 1000 || parseInt(base.rate_avg.replace(/[^\d]/g, ''))).toLocaleString('en-IN')}`,
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
        window.location.href = `/pages/${selectedCity}-platinum-rate-today`;
    };

    // Fallback per-gram 950 rate: /api/local-rates (new per-gram key first, then
    // the legacy per-gram dashboard key), else the template's per-10g figure.
    const templateRate10g = parseInt((PLATINUM_RATE_TEMPLATE.sections.platinum_calculate_widget_PRDzWq.settings.rate_today || '').replace(/[^\d]/g, '')) || 0;
    const localR950 = (rates && (Number(rates.platinum_price_950) || Number(rates.platinum_price) || 0)) || 0;
    const todayRateNum = Math.round(localR950 || templateRate10g / 10) || 0;
    const yesterdayRateNum = Math.round((rates && Number(rates.platinum_price_950_yesterday)) || 0);

    // ── First-fold rates: prefer the server-fetched platinum_rate_history entry
    // so the direct-answer paragraph and rate strip are present in the SSR HTML
    // (crawlers and AI engines read real numbers without waiting for JS).
    const heroHistory = Array.isArray(platinumMeta?.history) ? platinumMeta.history : [];
    const heroCur = heroHistory.find((e) => e.cur === "true") || heroHistory[0] || null;
    const heroR950 = Math.round((heroCur && heroCur.r950) || todayRateNum || 0);
    const heroR900 = Math.round((heroCur && heroCur.r900) || (rates && Number(rates.platinum_price_900)) || Math.round(heroR950 * 90 / 95));
    // platinum_rate_history values are per gram; multiply for the /10g line.
    const perGram = (v) => Math.round(v).toLocaleString("en-IN");
    const per10g = (v) => Math.round(v * 10).toLocaleString("en-IN");
    let heroDateStr = "";
    try {
        if (heroCur && heroCur.date) {
            heroDateStr = new Date(heroCur.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        }
    } catch { heroDateStr = ""; }

    // Jump links for the "On this page" widget. The has* flags mirror
    // PlatinumMetaContent's own render conditions so the list never links to a
    // section that got conditionally skipped.
    const tocSections = useMemo(() => {
        if (!platinumMeta) return [];
        const hist = Array.isArray(platinumMeta.history) ? platinumMeta.history : [];
        const cur = hist.find((e) => e.cur === "true") || hist[0] || null;
        const yEntry = hist.find((e) => e !== cur) || null;
        const y950 = Math.round((yEntry && yEntry.r950) || yesterdayRateNum || 0);
        return buildPlatinumRateSections(platinumMeta, {
            city: cityNameDisplay,
            hasTodayVsYesterday: y950 > 0,
            hasWeekly: hist.length > 0,
            hasMonthly: hist.length > 0,
        });
    }, [platinumMeta, cityNameDisplay, yesterdayRateNum]);

    return (
        <div className="platinum-rate-page bg-white min-h-screen font-figtree overflow-x-hidden">
            {/* First fold: content-first, SEO/AEO optimised. Breadcrumb, H1,
                direct-answer paragraph and rate strip are all server-rendered. */}
            <section className="relative w-full bg-[#FFFDF9] border-b border-[#F2E3C6]/70 pt-6 md:pt-10 pb-8 md:pb-12">
                <div className="container-main max-w-6xl mx-auto px-4 md:px-6">
                    <nav aria-label="Breadcrumb" className="text-[11px] md:text-xs text-zinc-400 font-figtree mb-3">
                        <Link prefetch={false} href="/" className="hover:text-zinc-600 transition-colors">Home</Link>
                        <span className="mx-1.5">/</span>
                        <span className="text-zinc-600">Platinum Rate in {cityNameDisplay}</span>
                    </nav>

                    <h1 className="font-abhaya text-[30px] md:text-[44px] leading-tight text-zinc-900 font-semibold">
                        {(platinumMeta && platinumMeta.heroTitle) || `Platinum Rate in ${cityNameDisplay} Today`}
                        {" "}
                        {platinumMeta?.heroStamp ? (
                            <span className="block md:inline font-figtree font-normal text-[14px] md:text-[18px] text-zinc-500 whitespace-nowrap">
                                &ndash; {platinumMeta.heroStamp} IST
                            </span>
                        ) : null}
                    </h1>

                    <p className="font-figtree text-[15px] md:text-[17px] text-zinc-700 leading-relaxed mt-3 md:mt-4 max-w-3xl">
                        The platinum rate in {cityNameDisplay} today is <strong>₹{perGram(heroR950)} per gram for 950 platinum (Pt 950)</strong> and{" "}
                        <strong>₹{perGram(heroR900)} per gram for 900 platinum</strong>. The 10 gram rate for 950 platinum is ₹{per10g(heroR950)}
                        {" "}and for 900 platinum ₹{per10g(heroR900)}. Rates are indicative bullion rates updated every business day from international
                        bullion (LPPM) benchmarks, and exclude GST and making charges.{heroDateStr ? ` Last updated ${heroDateStr}.` : ""}
                    </p>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mt-5 md:mt-7 max-w-2xl">
                        {[["Pt 950 · 95%", heroR950], ["Pt 900 · 90%", heroR900]].map(([k, v]) => (
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
                        <button onClick={handleNavigate} className="group h-11 px-5 bg-[#B77767] text-white font-figtree font-bold text-[12px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-[#A36455] transition-all active:scale-95">
                            CHECK RATE <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link prefetch={false} href="/collections/jewelry" className="group h-11 px-5 bg-white border border-[#E8D5B5] text-zinc-800 font-figtree font-bold text-[12px] tracking-widest uppercase rounded-lg flex justify-center items-center gap-2 hover:bg-[#FAF3EC] transition-all active:scale-95">
                            <ShoppingBag size={15} className="group-hover:-translate-y-0.5 transition-transform" /> EXPLORE LUCIRA
                        </Link>
                    </div>
                </div>
            </section>

            {/* Calculator Section — prefer server-fetched history rate over the
                client-fetched widget rate so the calculator is correct on first paint */}
            <PlatinumCalculator cityName={cityNameDisplay} baseRate={heroR950 || todayRateNum} />

            {/* Jump links, directly under the calculator. Ids are city-independent,
                so #platinum-purity is the same fragment on every city page. */}
            <OnThisPage sections={tocSections} />

            {/* Metaobject content first (same pattern as gold). Cities without a
                linked platinum_rate_city metaobject keep rendering the hardcoded
                template sections below — the platinum pages' equivalent of gold's
                page.body fallback (their Shopify page bodies are empty). */}
            {platinumMeta ? (
                <PlatinumMetaContent
                    platinumMeta={platinumMeta}
                    cityName={cityNameDisplay}
                    stateName={stateName}
                    rate950={todayRateNum}
                    rate900={rates ? Number(rates.platinum_price_900) : 0}
                    rate950Yesterday={yesterdayRateNum}
                    currentDate={currentDate}
                />
            ) : (
                <div className="sections-wrapper">
                    {PLATINUM_RATE_TEMPLATE.order.map((sectionId) => {
                        const section = PLATINUM_RATE_TEMPLATE.sections[sectionId];
                        if (!section) return null;

                        switch (section.type) {
                            case 'platinum-calculate-widget':
                                return (
                                    <div key={sectionId}>
                                        <PlatinumInvestmentSection
                                            cityName={cityNameDisplay}
                                            settings={section.settings}
                                        />
                                        {/* PriceTable right after the InvestmentSection, as before */}
                                        <PlatinumPriceTable baseRate={parseInt(platinumWidgetSettings.rate_today.replace(/[₹, ]/g, '')) || 0} />
                                    </div>
                                );
                            case 'information-content-info':
                                return (
                                    <PlatinumInformationContent
                                        key={sectionId}
                                        cityName={cityNameDisplay}
                                        stateName={stateName}
                                        sectionData={section}
                                    />
                                );
                            case 'faq-section':
                                return (
                                    <PlatinumFAQSection
                                        key={sectionId}
                                        cityName={cityNameDisplay}
                                        stateName={stateName}
                                        todayRate={parseInt(platinumWidgetSettings.rate_today.replace(/[₹, ]/g, '')) || 0}
                                        sectionData={section}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            )}

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
                }
                /* The bullet is the branded dot gold-rate.css draws via
                   .footer-pages ul li::before — the native disc marker is
                   disabled here so the two don't render as double bullets. */
                .footer-pages ul { list-style-type: none; padding-left: 0; }
                .footer-pages ol { list-style-type: decimal; padding-left: 1.625em; }
                /* Match the paragraph size above (1.25rem). The shared
                   .footer-pages ul li rule (gold-rate.css) is text-sm, which
                   left bullets smaller than the surrounding prose — the ul/ol
                   in this selector out-specifies it. */
                .footer-pages ul li, .footer-pages ol li {
                  margin-top: 0.5em;
                  margin-bottom: 0.5em;
                  font-family: var(--font-figtree), sans-serif;
                  font-size: 1.25rem;
                  line-height: 1.75;
                }
                /* Re-centre the dot for the larger text (gold-rate.css tuned
                   its top for text-sm). */
                .footer-pages ul li::before { top: 0.7em; }
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
