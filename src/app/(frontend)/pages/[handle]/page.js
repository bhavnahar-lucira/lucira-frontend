import { getPageByHandle, getAllPages } from "@/lib/pages";
import { getGoldRateCityMeta, getGoldRateHistory } from "@/lib/goldRate";
import { notFound } from "next/navigation";
import "@/styles/gold-rate.css";

import ContactSection from "@/components/common/ContactSection";
import SitemapPage from "@/components/sitemap/SitemapPage";
import FooterPageContent from "@/components/FooterPageContent";
import GoldRatePage from "@/components/pages/gold-rate/GoldRatePage";
import SilverRatePage from "@/components/pages/silver-rate/SilverRatePage";
import PlatinumRatePage from "@/components/pages/platinum-rate/PlatinumRatePage";

// Static pages (About, Careers, T&C, etc.) stay fully static — force-cache at the fetch
// level means they never re-render after build.
//
// Metal rate pages stay 'no-store': the rates team updates the gold_rate_history
// metaobject every morning and the pages must show the new rate the moment it is
// written — an ISR window would keep serving yesterday's rate for up to an hour.
// no-store also makes the rate routes bail out of static generation at the FIRST
// Storefront fetch, so the Admin-REST and live-site-scrape fallback tiers in
// getPageByHandle never run for the ~637 city pages (switching to ISR made every
// empty-body silver/platinum page crawl those tiers on each build/regeneration).
// The DynamicServerError this throws during `next build` is expected control flow;
// fetchWithRetry/shopifyStorefrontFetch recognize and rethrow it silently.
export const revalidate = 3600;
const RATE_PAGE_CACHE = 'no-store';
export const dynamicParams = true;

// ─── Locally-rendered pages ──────────────────────────────────────────────────
// These handles render a local component instead of the Shopify page body (see
// Page below). Their metadata has to be authored here too: falling through to the
// Shopify record produced a description sliced out of raw body text, which mixed
// Title Case prose with the ALL-CAPS field labels ("CALL US", "MAIL US") and cut
// off mid-value. Title Case title, sentence-case description, no shouting.
const LOCAL_PAGE_META = {
  "contact-us": {
    title: "Contact Us - Lucira Jewelry",
    description:
      "Get in touch with Lucira Jewelry for bespoke assistance and jewelry consultations. Call, email or visit our Mumbai head office — our concierge will reply soon.",
  },
};

// ─── City / State lookup (shared by all rate-page types) ─────────────────────
const STATE_CITY_MAP = {
  'andaman-and-nicobar-islands': ['Port Blair'],
  'andhra-pradesh': ['Chirala', 'Guntur', 'Hindupur', 'Kagaznagar', 'Kakinada', 'Kurnool', 'Machilipatnam', 'Nandyal', 'Nellore', 'Ongole', 'Proddatur', 'Rajahmundry', 'Tirupati', 'Vishakhapatnam', 'Vizianagaram'],
  'arunachal-pradesh': ['Itanagar'],
  'assam': ['Dibrugarh', 'Dispur', 'Guwahati', 'Jorhat', 'Silchar', 'Tezpur'],
  'bihar': ['Aurangabad', 'Bhagalpur', 'Gaya', 'Muzaffarpur', 'Patna', 'Purnea'],
  'chandigarh': ['Chandigarh'],
  'chhattisgarh': ['Bhilai', 'Bilaspur', 'Raipur'],
  'dadra-and-nagar-haveli': ['Silvassa'],
  'daman-and-diu': ['Daman', 'Diu'],
  'delhi': ['Delhi', 'New Delhi'],
  'goa': ['Panaji'],
  'gujarat': ['Ahmedabad', 'Bhavnagar', 'Bhuj', 'Ghandinagar', 'Navsari', 'Porbandar', 'Rajkot', 'Surat', 'Vadodara'],
  'haryana': ['Ambala', 'Bhiwani', 'Faridabad', 'Gurugram', 'Hisar', 'Karnal', 'Panchkula', 'Panipat', 'Rohtak', 'Sirsa', 'Sonipat'],
  'himachal-pradesh': ['Shimla'],
  'jammu-and-kashmir': ['Baramula', 'Jammu', 'Saidpur', 'Srinagar'],
  'jharkhand': ['Dhanbad', 'Jamshedpur', 'Ranchi', 'Jorapokhar'],
  'karnataka': ['Belgaum', 'Bellary', 'Bengaluru', 'Bidar', 'Bijapur', 'Chikka Mandya', 'Davangere', 'Gulbarga', 'Hospet', 'Hubli', 'Kolar', 'Mangalore', 'Mysore', 'Raichur', 'Shimoga'],
  'kerala': ['Alappuzha', 'Calicut', 'Kochi', 'Kollam', 'Thiruvananthapuram'],
  'lakshadweep': ['Kavaratti'],
  'madhya-pradesh': ['Bhopal', 'Gwalior', 'Indore', 'Jabalpur', 'Ratlam', 'Saugor', 'Ujjain'],
  'maharashtra': ['Ahmadnagar', 'Akola', 'Amaravati', 'Aurangabad', 'Bhiwandi', 'Bhusaval', 'Chanda', 'Kalyan', 'Khanapur', 'Kolhapur', 'Latur', 'Malegaon Camp', 'Mumbai', 'Nanded', 'Nasik', 'Parbhani', 'Pune', 'Sangli'],
  'manipur': ['Imphal'],
  'meghalaya': ['Shillong'],
  'mizoram': ['Aizawl'],
  'nagaland': ['Kohima'],
  'odisha': ['Bhubaneshwar', 'Brahmapur', 'Cuttack', 'Puri', 'Raurkela', 'Samlaipadar', 'Brajrajnagar', 'Talcher'],
  'puducherry': ['Puducherry'],
  'punjab': ['Abohar', 'Amritsar', 'Haripur', 'Ludhiana', 'Pathankot', 'Patiala'],
  'rajasthan': ['Ajmer', 'Alwar', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Jaipur', 'Jodhpur', 'Kota', 'Pali', 'Rampura', 'Sikar', 'Tonk', 'Udaipur'],
  'sikkim': ['Gangtok'],
  'tamil-nadu': ['Chennai', 'Coimbatore', 'Cuddalore', 'Dindigul', 'Karur', 'Krishnapuram', 'Kumbakonam', 'Madurai', 'Nagercoil', 'Rajapalaiyam', 'Salem', 'Thanjavur', 'Tiruchchirappalli', 'Tirunelveli', 'Tiruvannamalai', 'Tuticorin', 'Valparai', 'Vellore'],
  'telangana': ['Adilabad', 'Hyderabad', 'Karimnagar', 'Khammam', 'Mahabubnagar', 'Nalgonda', 'Nizamabad', 'Ramagundam', 'Warangal'],
  'tripura': ['Agartala'],
  'uttar-pradesh': ['Agra', 'Aligarh', 'Allahabad', 'Bakshpur', 'Bamanpuri', 'Bareilly', 'Bharauri', 'Budaun', 'Bulandshahr', 'Firozabad', 'Fyzabad', 'Ghaziabad', 'Gopalpur', 'Hapur', 'Hata', 'Jhansi', 'Lucknow', 'Mathura', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Saharanpur', 'Saidapur', 'Shahbazpur', 'Tharati Etawah', 'Varanasi'],
  'uttarakhand': ['DehraDun'],
  'west-bengal': ['Alipurduar', 'Asansol', 'Barddhaman', 'Bhatpara', 'Haldia', 'Haora', 'Kolkata', 'Krishnanagar', 'Shiliguri'],
};

function resolveCityState(handle, rateType) {
  // Fold the case before matching: middleware redirects Caps-Lock URLs, but this
  // also runs for direct/internal calls it never sees, and an unfolded "MYSORE"
  // misses STATE_CITY_MAP silently (→ wrong state, city echoed back in caps).
  const citySlug = handle.toLowerCase().replace(rateType, '');
  const cityCapitalized = citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  for (const [stateKey, cities] of Object.entries(STATE_CITY_MAP)) {
    const match = cities.find(c => c.toLowerCase().replace(/\s+/g, '-') === citySlug);
    if (match) {
      const resolvedState = stateKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { cityCapitalized, resolvedState, matched: true };
    }
  }

  // citySlug isn't a real city we know about — caller decides whether to 404
  // instead of fabricating a page for it (e.g. "/pages/hyde-gold-rate-today").
  return { cityCapitalized, resolvedState: null, matched: false };
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Gold rate title date stamp ──────────────────────────────────────────────
// Gold rate pages carry the current day + date in the title tag as a freshness
// signal. Asia/Kolkata is pinned deliberately: the production server clock runs
// in UTC, so without it the title would show the previous day's date until
// 05:30 IST every morning.
const GOLD_TITLE_DATE_FORMAT = {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

// The base title comes from a Shopify metaobject the marketing team edits, so
// skip the stamp when a date has already been written into it by hand rather
// than ending up with two.
const ALREADY_DATED = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i;

function withRateDate(title) {
  if (!title || ALREADY_DATED.test(title)) return title;

  const stamp = new Intl.DateTimeFormat("en-IN", GOLD_TITLE_DATE_FORMAT).format(new Date());

  // Insert ahead of the trailing brand segment so "| Lucira" stays last.
  const lastPipe = title.lastIndexOf("|");
  if (lastPipe > 0) {
    return `${title.slice(0, lastPipe).trim()} (${stamp}) ${title.slice(lastPipe)}`;
  }
  return `${title} (${stamp})`;
}

// ─── Gold rate city meta (competitor-style) ──────────────────────────────────
// "Todays Gold Rate in Mumbai for 14, 18, 22 & 24 Carat - 18 Aug 2026, 11 AM"
// Short month keeps the title near the SERP character limit while still
// carrying the date + current IST time as a freshness signal. Rate pages
// render with no-store, so the stamp is the actual request time.
function goldRateCityMeta(city) {
  const now = new Date();
  const ist = (opts) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...opts }).format(now);

  const fullDate = ist({ day: "numeric", month: "short", year: "numeric" });  // "18 Aug 2026"
  const time = ist({ hour: "numeric", hour12: true }).toUpperCase();          // "11 AM"

  return {
    title: `Todays Gold Rate in ${city} for 14, 18, 22 & 24 Carat - ${fullDate}, ${time}`,
    description: `Gold Rate Today in ${city} - ${fullDate}, ${time} IST. Get live gold rates for 14K, 18K, 22K & 24K in ${city} and yesterday's gold rate per gram.`,
  };
}
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const pages = await getAllPages();
  return pages.map((page) => ({
    handle: page.handle,
  }));
}

export async function generateMetadata({ params }) {
  const { handle: rawHandle } = await params;
  // Shopify handles are always lowercase, and so is every link we emit — fold the
  // param so a Caps-Lock URL resolves the same page instead of falling through
  // the rate-page detection below and 404ing.
  const handle = rawHandle.toLowerCase();

  const isSilverRatePage = handle.includes("silver-rate-today");
  const isPlatinumRatePage = handle.includes("platinum-rate-today");
  const isGoldRatePage = handle.includes("gold-rate-today");
  const isRatePage = isSilverRatePage || isPlatinumRatePage || isGoldRatePage;
  const cacheStrategy = isRatePage ? RATE_PAGE_CACHE : 'force-cache';

  let title;
  let description;

  const localMeta = LOCAL_PAGE_META[handle];
  if (localMeta) {
    // Body comes from a local component, so the Shopify record is not the source
    // of truth here — skip the fetch entirely.
    ({ title, description } = localMeta);
  } else {
    const page = await getPageByHandle(handle, cacheStrategy);
    if (!page) return {};

    title = page.seo?.title || page.title || "Lucira Jewelry";
    description = page.seo?.description || page.bodySummary || page.body?.replace(/<[^>]*>?/gm, "").slice(0, 160);

    // Gold rate pages: known city pages get the generated competitor-style
    // title/description (uniform format, fresh date + IST time). Anything else
    // ("gold-rate-today" itself, cities missing from STATE_CITY_MAP) keeps the
    // curated metaobject seo_title / seo_description with the date stamp.
    if (isGoldRatePage) {
      const { cityCapitalized, matched } = resolveCityState(handle, "-gold-rate-today");
      if (matched) {
        ({ title, description } = goldRateCityMeta(cityCapitalized));
      } else {
        try {
          const goldMeta = await getGoldRateCityMeta(handle, RATE_PAGE_CACHE);
          if (goldMeta?.seoTitle) title = goldMeta.seoTitle;
          if (goldMeta?.seoDescription) description = goldMeta.seoDescription;
        } catch {
          // fall back to page SEO fields
        }
        title = withRateDate(title);
      }
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/pages/${handle}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/pages/${handle}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }) {
  const { handle: rawHandle } = await params;
  const handle = rawHandle.toLowerCase();

  if (handle === "contact-us") {
    return <ContactSection />;
  }

  if (handle === "sitemap") {
    return <SitemapPage />;
  }

  // ── Rate page detection ──────────────────────────────────────────────────
  const isSilverRatePage = handle.includes("silver-rate-today");
  const isPlatinumRatePage = handle.includes("platinum-rate-today");
  const isGoldRatePage = handle.includes("gold-rate-today");
  const isRatePage = isSilverRatePage || isPlatinumRatePage || isGoldRatePage;

  // Rate pages: ISR so Shopify body edits appear after the revalidate window (1 hour).
  // All other pages: force-cache (permanent SSG, never re-fetched after build).
  // This mirrors exactly how blogs.js handles article content.
  const cacheStrategy = isRatePage ? RATE_PAGE_CACHE : 'force-cache';

  // 3-tier fetch: Storefront API → Admin REST API → Live site scraping
  // (same strategy as getArticleByBlogAndHandle in blogs.js)
  let page = await getPageByHandle(handle, cacheStrategy);

  // ── For rate pages, always attach city/state derived from the URL handle ──
  if (isRatePage) {
    let rateType = '';
    if (isGoldRatePage) rateType = '-gold-rate-today';
    else if (isSilverRatePage) rateType = '-silver-rate-today';
    else if (isPlatinumRatePage) rateType = '-platinum-rate-today';

    const { cityCapitalized, resolvedState, matched } = resolveCityState(handle, rateType);

    if (!page) {
      // No real Shopify page for this handle. Only fabricate a stub for cities
      // we actually recognize (STATE_CITY_MAP) — otherwise any random slug like
      // "hyde-gold-rate-today" or "mum-gold-rate-today" would silently render a
      // fake city page instead of 404ing.
      if (!matched) return notFound();

      page = {
        title: handle.replace(/-/g, ' ').toUpperCase(),
        body: "",
      };
    }

    // Always stamp city/state from the URL — Shopify page has no city metafield.
    // If the page is real but the city isn't in our map (unmatched), fall back
    // to Maharashtra rather than leaving state blank.
    page.city = { value: cityCapitalized };
    page.state = { value: resolvedState || 'Maharashtra' };
  }

  if (!page) return notFound();

  // ── Gold rate pages: pull content straight from the Shopify metaobject via the
  // Storefront API (same pattern as blogs) — no Liquid scraping. Fail-safe: if the
  // metaobject is missing the page falls back to page.body below.
  if (isGoldRatePage) {
    try {
      const goldMeta = await getGoldRateCityMeta(handle, RATE_PAGE_CACHE);
      if (goldMeta) {
        try {
          goldMeta.history = await getGoldRateHistory(RATE_PAGE_CACHE);
        } catch {
          goldMeta.history = [];
        }
        page.goldMeta = goldMeta;
      }
    } catch (e) {
      console.warn("gold metaobject fetch failed:", e?.message);
    }
  }

  // Serialize for Client Components (removes BSON ObjectId, etc.)
  page = JSON.parse(JSON.stringify(page));

  // ── Route to the correct rate page component ─────────────────────────────
  if (isSilverRatePage) {
    return <SilverRatePage page={page} />;
  }

  if (isPlatinumRatePage) {
    return <PlatinumRatePage page={page} />;
  }

  if (isGoldRatePage) {
    return <GoldRatePage page={page} />;
  }

  // ── Legacy city/state gold-rate pages (no "-gold-rate-today" in handle) ──
  if (page.city && page.state) {
    return <GoldRatePage page={page} />;
  }

  // ── Generic page rendering ───────────────────────────────────────────────
  const hasBody = typeof page.body === "string" && page.body.trim() !== "";

  if (handle === "exclusive-promotions-page") {
    return (
      <div className="w-full bg-white min-h-screen">
        <section
          id="promo-banner"
          className="relative flex items-center justify-center w-full"
          style={{
            backgroundImage: `url('https://luciraonline.myshopify.com/cdn/shop/files/Offer-T-_-C-Desktop.jpg?v=1754045882&width=2000')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            minHeight: "400px",
          }}
        >
          <style>{`
            @media screen and (max-width: 749px) {
                #promo-banner {
                    background-image: url('https://luciraonline.myshopify.com/cdn/shop/files/Offer-T-_-C-Mobile.jpg?v=1754045881&width=1000') !important;
                    min-height: 400px !important;
                }
            }
          `}</style>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "rgba(0,0,0,0.8)", opacity: 0.7 }}
          />
          <div className="relative z-10 text-center max-w-5xl mx-auto px-8 py-8">
            <h1 className="font-figtree font-medium text-[32px] md:text-[42px] text-white tracking-tight leading-tight mb-3">
              OFFERS T&C
            </h1>
          </div>
        </section>

        <section className="container-main py-10">
          <div
            className="footer-pages max-w-none font-figtree text-zinc-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </section>
      </div>
    );
  }

  if (handle === "accessibility-statement") {
    return (
      <div className="w-full bg-white min-h-screen">
        <section
          id="accessibility-banner"
          className="relative flex items-center justify-center w-full"
          style={{
            backgroundImage: `url('https://luciraonline.myshopify.com/cdn/shop/files/Accesiblity_20Page_20Banner_201920_20600.png?v=1768908054&width=2000')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            minHeight: "400px",
          }}
        >
          <style>{`
            @media screen and (max-width: 749px) {
              #accessibility-banner {
                background-image: url('https://luciraonline.myshopify.com/cdn/shop/files/Accesiblity_20Page_20Banner_201920_20600.png?v=1768908054&width=1000') !important;
                min-height: 400px !important;
              }
            }
          `}</style>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "rgba(0,0,0,0.8)", opacity: 0.6 }}
          />
          <div className="relative z-10 text-center max-w-5xl mx-auto px-8 py-8">
            <h1 className="font-figtree font-medium text-[32px] md:text-[42px] text-white tracking-tight leading-tight mb-3">
              ACCESSIBILITY STATEMENT
            </h1>
          </div>
        </section>

        <section className="container-main py-10">
          <div
            className="footer-pages max-w-none font-figtree text-zinc-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </section>
      </div>
    );
  }

  const isAccordionPage = hasBody && page.body.includes("data-toggle");

  return (
    <>
      <h1 className="hidden">{page.title}</h1>
      <div className="container mx-auto py-7 px-4">
        {hasBody ? (
          isAccordionPage ? (
            <FooterPageContent html={page.body} />
          ) : (
            <div
              className="footer-pages"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          )
        ) : (
          <p className="text-center text-zinc-500 py-20">No Content Available</p>
        )}
      </div>
    </>
  );
}