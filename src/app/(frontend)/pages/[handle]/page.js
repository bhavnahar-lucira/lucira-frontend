import { getPageByHandle, getAllPages } from "@/lib/pages";
import { getGoldRateCityMeta, getGoldRateHistory } from "@/lib/goldRate";
import { notFound } from "next/navigation";

import ContactSection from "@/components/common/ContactSection";
import SitemapPage from "@/components/sitemap/SitemapPage";
import FooterPageContent from "@/components/FooterPageContent";
import GoldRatePage from "@/components/pages/gold-rate/GoldRatePage";
import SilverRatePage from "@/components/pages/silver-rate/SilverRatePage";
import PlatinumRatePage from "@/components/pages/platinum-rate/PlatinumRatePage";

// Static pages (About, Careers, T&C, etc.) stay fully static — force-cache at the fetch
// level means they never re-render after build.
// Metal rate pages bypass the cache (no-store) and use ISR (revalidate: 3600) so any
// body edits made in Shopify are reflected on the site within one hour — same strategy
// as blog articles.
export const revalidate = 3600;
export const dynamicParams = true;

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
  const citySlug = handle.replace(rateType, '');
  const cityCapitalized = citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  let resolvedState = 'Maharashtra';
  for (const [stateKey, cities] of Object.entries(STATE_CITY_MAP)) {
    const match = cities.find(c => c.toLowerCase().replace(/\s+/g, '-') === citySlug);
    if (match) {
      resolvedState = stateKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  return { cityCapitalized, resolvedState };
}
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const pages = await getAllPages();
  return pages.map((page) => ({
    handle: page.handle,
  }));
}

export async function generateMetadata({ params }) {
  const { handle } = await params;

  const isSilverRatePage = handle.includes("silver-rate-today");
  const isPlatinumRatePage = handle.includes("platinum-rate-today");
  const isGoldRatePage = handle.includes("gold-rate-today");
  const isRatePage = isSilverRatePage || isPlatinumRatePage || isGoldRatePage;
  const cacheStrategy = isRatePage ? 'no-store' : 'force-cache';

  const page = await getPageByHandle(handle, cacheStrategy);
  if (!page) return {};

  return {
    title: page.seo?.title || page.title || "Lucira Jewelry",
    description: page.seo?.description || page.bodySummary || page.body?.replace(/<[^>]*>?/gm, "").slice(0, 160),
    alternates: {
      canonical: `/pages/${handle}`,
    },
  };
}

export default async function Page({ params }) {
  const { handle } = await params;

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

  // Rate pages: no-store so Shopify body edits appear after the ISR window (1 hour).
  // All other pages: force-cache (permanent SSG, never re-fetched after build).
  // This mirrors exactly how blogs.js handles article content.
  const cacheStrategy = isRatePage ? 'no-store' : 'force-cache';

  // 3-tier fetch: Storefront API → Admin REST API → Live site scraping
  // (same strategy as getArticleByBlogAndHandle in blogs.js)
  let page = await getPageByHandle(handle, cacheStrategy);

  // ── For rate pages, always attach city/state derived from the URL handle ──
  if (isRatePage) {
    let rateType = '';
    if (isGoldRatePage) rateType = '-gold-rate-today';
    else if (isSilverRatePage) rateType = '-silver-rate-today';
    else if (isPlatinumRatePage) rateType = '-platinum-rate-today';

    const { cityCapitalized, resolvedState } = resolveCityState(handle, rateType);

    if (!page) {
      // Page doesn't exist in Shopify yet — create a minimal stub so the rate
      // page component still renders with correct city/state
      page = {
        title: handle.replace(/-/g, ' ').toUpperCase(),
        body: "",
      };
    }

    // Always stamp city/state from the URL — Shopify page has no city metafield
    page.city = { value: cityCapitalized };
    page.state = { value: resolvedState };
  }

  if (!page) return notFound();

  // ── Gold rate pages: pull content straight from the Shopify metaobject via the
  // Storefront API (same pattern as blogs) — no Liquid scraping. Fail-safe: if the
  // metaobject is missing the page falls back to page.body below.
  if (isGoldRatePage) {
    try {
      const goldMeta = await getGoldRateCityMeta(handle, "no-store");
      if (goldMeta) {
        try {
          goldMeta.history = await getGoldRateHistory("no-store");
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