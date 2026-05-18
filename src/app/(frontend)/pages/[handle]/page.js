import { getPageByHandle, getPageByHandleStorefront } from "@/lib/pages";
import { notFound } from "next/navigation";
import ContactSection from "@/components/common/ContactSection";
import SitemapPage from "@/components/sitemap/SitemapPage";
import FooterPageContent from "@/components/FooterPageContent";
import GoldRatePage from "@/components/pages/gold-rate/GoldRatePage";
import SilverRatePage from "@/components/pages/silver-rate/SilverRatePage";
import PlatinumRatePage from "@/components/pages/platinum-rate/PlatinumRatePage";

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

  if (!page) return notFound();
  
  // Serialize page object for Client Components (removes BSON ObjectId)
  page = JSON.parse(JSON.stringify(page));

  // Handle Gold, Silver, and Platinum Rate pages
  const isSilverRatePage = handle.includes("silver-rate-today");
  const isPlatinumRatePage = handle.includes("platinum-rate-today");
  const isGoldRatePage = handle.includes("gold-rate-today") || (page.city && page.state && !isSilverRatePage && !isPlatinumRatePage);

  if (isSilverRatePage) {
    return <SilverRatePage page={page} />;
  }

  if (isPlatinumRatePage) {
    return <PlatinumRatePage page={page} />;
  }

  if (isGoldRatePage) {
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