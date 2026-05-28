import { getPageByHandle, getPageByHandleStorefront } from "@/lib/pages";
import { notFound } from "next/navigation";

import ContactSection from "@/components/common/ContactSection";
import SitemapPage from "@/components/sitemap/SitemapPage";
import FooterPageContent from "@/components/FooterPageContent";
import GoldRatePage from "@/components/pages/gold-rate/GoldRatePage";
import SilverRatePage from "@/components/pages/silver-rate/SilverRatePage";
import PlatinumRatePage from "@/components/pages/platinum-rate/PlatinumRatePage";

// SSG: Static pages (About, Careers, T&C, etc.) are rendered once at build and cached permanently.
// Zero ISR background writes. Content only changes when an editor manually updates it in Shopify.
export const dynamic = 'force-static';


export async function generateMetadata({ params }) {
  const { handle } = await params;
  let page = await getPageByHandle(handle);

  if (!page) {
    page = await getPageByHandleStorefront(handle);
  }

  if (!page) return {};

  return {
    title: page.title || "Lucira Jewelry",
    description: page.bodySummary || page.body?.replace(/<[^>]*>?/gm, "").slice(0, 160),
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

  let page = await getPageByHandle(handle);

  if (!page) {
    page = await getPageByHandleStorefront(handle);
  }

  // Check for Rate pages before returning notFound
  const isSilverRatePage = handle.includes("silver-rate-today");
  const isPlatinumRatePage = handle.includes("platinum-rate-today");
  const isGoldRatePage = handle.includes("gold-rate-today");

  if (!page && (isSilverRatePage || isPlatinumRatePage || isGoldRatePage)) {
    // Extract city slug from handle: e.g. "baramula-platinum-rate-today" -> "baramula"
    // or "new-delhi-gold-rate-today" -> "new-delhi"
    let rateType = '';
    if (isGoldRatePage) rateType = '-gold-rate-today';
    else if (isSilverRatePage) rateType = '-silver-rate-today';
    else if (isPlatinumRatePage) rateType = '-platinum-rate-today';

    const citySlug = handle.replace(rateType, '');

    // Capitalize city name from slug: "new-delhi" -> "New Delhi"
    const cityCapitalized = citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Look up the state that contains this city using a case-insensitive match
    const stateCityMap = {
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

    // Find the state for this city
    let resolvedState = 'Maharashtra';
    for (const [stateKey, cities] of Object.entries(stateCityMap)) {
      const match = cities.find(c => c.toLowerCase().replace(/\s+/g, '-') === citySlug);
      if (match) {
        resolvedState = stateKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }

    page = {
      title: handle.replace(/-/g, ' ').toUpperCase(),
      city: { value: cityCapitalized },
      state: { value: resolvedState },
      body: ""
    };
  }

  if (!page) return notFound();

  // Serialize page object for Client Components (removes BSON ObjectId)
  page = JSON.parse(JSON.stringify(page));

  // Handle Gold, Silver, and Platinum Rate pages
  // For gold rate page, we check includes or if it's a legacy city/state page
  const isGoldRatePageResolved = isGoldRatePage || (page.city && page.state && !isSilverRatePage && !isPlatinumRatePage);

  if (isSilverRatePage) {
    return <SilverRatePage page={page} />;
  }

  if (isPlatinumRatePage) {
    return <PlatinumRatePage page={page} />;
  }

  if (isGoldRatePageResolved) {
    return <GoldRatePage page={page} />;
  }

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