import { Suspense } from "react";
import dynamic from "next/dynamic";

export const revalidate = 86400; // 24 hours

import HeroSliderImage from "@/components/home/HeroSliderImage";
import ExploreRange from "@/components/home/ExploreRange";
import FeatureBar from "@/components/home/FeatureBar";
import PromotionalBanners from "@/components/home/PromotionalBanners";
import DiamondCuts from "@/components/home/DiamondCuts"
import ShopByCategory from "@/components/home/ShopByCategory";
import JewelryBlogContainer from "@/components/home/JewelryBlogContainer";

// Lazy load below-the-fold components
const StyledByLucira = dynamic(() => import("@/components/home/StyledByLucira"), { suspense: true });
const BuildYourJewelry = dynamic(() => import("@/components/home/buildYourJewelry"), { suspense: true });
const LuxuryMarquee = dynamic(() => import("@/components/product/LuxuryMarquee"), { suspense: true });
const ShopByOccasion = dynamic(() => import("@/components/home/ShopByOccasion"), { suspense: true });
const FeaturedIn = dynamic(() => import("@/components/home/FeaturedIn"), { suspense: true });
const WaysToExplore = dynamic(() => import("@/components/home/WaysToExplore"), { suspense: true });
const EveryoneYouLove = dynamic(() => import("@/components/home/EveryoneYouLove"), { suspense: true });
const CuratedLooks = dynamic(() => import("@/components/home/CuratedLooks"), { suspense: true });
const StoreLocatorSection = dynamic(() => import("@/components/home/StoreLocatorSection"), { suspense: true });
const CustomerReview = dynamic(() => import("@/components/home/CustomerReview"), { suspense: true });
const WeAreLucira = dynamic(() => import("@/components/home/WeAreLucira"), { suspense: true });
const NoteFromFounder = dynamic(() => import("@/components/home/NoteFromFounder"), { suspense: true });
const InstagramFeed = dynamic(() => import("@/components/home/InstagramFeed"), { suspense: true });
const JoinLuciraCommunity = dynamic(() => import("@/components/product/JoinLuciraCommunity").then(mod => ({ default: mod.JoinLuciraCommunity })), { suspense: true });
const HomeFAQSection = dynamic(() => import("@/components/home/HomeFAQSection"), { suspense: true });

// Refactored Sections
import BestsellerSection from "@/components/home/homeCollection/BestsellerSection";
import GemstoneSection from "@/components/home/homeCollection/GemstoneSection";
import ExploreCollectionSection from "@/components/home/homeCollection/ExploreCollectionSection";
import MobileCategorySlider from "@/components/home/MobileCategorySlider";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== "")
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : "http://127.0.0.1:8080";
  const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

  let bestsellersInitial = null;
  let gemstoneInitial = null;
  let gemstoneCategoriesInitial = null;
  let exploreInitial = null;
  let bannersInitial = [];

  try {
    // Use force-cache so these fetches inherit the page-level revalidate=21600
    const [bestsellersRes, gemstoneRes, gemstoneCatRes, exploreRes, bannersRes] = await Promise.all([
      fetch(`${base}/api/collection?handle=bestsellers&limit=15`, { cache: 'force-cache' }),
      fetch(`${base}/api/collection?handle=gemstone-jewelry&limit=15`, { cache: 'force-cache' }),
      fetch(`${base}/api/products/filters?q=gemstone`, { cache: 'force-cache' }),
      fetch(`${base}/api/collection?handle=sports-collection&limit=15`, { cache: 'force-cache' }),
      fetch(`${base}/api/settings/hero-banners`, { cache: 'force-cache' })
    ]);

    if (bestsellersRes.ok) bestsellersInitial = await bestsellersRes.json();
    if (gemstoneRes.ok) gemstoneInitial = await gemstoneRes.json();
    if (gemstoneCatRes.ok) gemstoneCategoriesInitial = await gemstoneCatRes.json();
    if (exploreRes.ok) exploreInitial = await exploreRes.json();

    if (bannersRes.ok) {
      const bData = await bannersRes.json();
      bannersInitial = bData.banners || [];
    }

    // Helper to strip heavy fields and save Vercel bandwidth
    const stripData = (data) => {
      if (!data) return;
      if (data.collection) {
        delete data.collection.descriptionHtml;
        if (data.collection.metafields?.custom) {
          delete data.collection.metafields.custom.bestsellers_html;
          delete data.collection.metafields.custom.seo_content_data;
        }
      }
      if (data.products) {
        data.products.forEach(p => {
          delete p.descriptionHtml;
        });
      }
    };

    stripData(bestsellersInitial);
    stripData(gemstoneInitial);
    stripData(exploreInitial);

  } catch (e) {
    console.error("Failed to fetch initial data for Home SSG", e);
  }
  return (
    <div className="w-full">
      <MobileCategorySlider />
      <HeroSliderImage initialData={bannersInitial} />
      <FeatureBar />
      <PromotionalBanners />
      <ExploreRange />

      <BestsellerSection initialData={bestsellersInitial} />

      <DiamondCuts />
      {/* <ShopByCategory /> */}
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <StyledByLucira />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <BuildYourJewelry />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <LuxuryMarquee prop={["bg-[#FEF5F1]", "text-[#000000]", "icon-[#5A413F]", "mt-5", "lg:mt-15", "text-lg", "font-semibold"]} />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <ShopByOccasion />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <FeaturedIn />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <WaysToExplore />
      </Suspense>

      <GemstoneSection initialProducts={gemstoneInitial} initialCategories={gemstoneCategoriesInitial} />

      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <EveryoneYouLove />
      </Suspense>

      <ExploreCollectionSection initialData={exploreInitial} />

      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <CuratedLooks />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <StoreLocatorSection />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <CustomerReview />
      </Suspense>
      {/* <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <WeAreLucira />
      </Suspense> */}

      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <NoteFromFounder />
      </Suspense>
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <InstagramFeed />
      </Suspense>

      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse"></div>}>
        <JewelryBlogContainer />
      </Suspense>


      <Suspense fallback={<div className="h-20 bg-gray-50 animate-pulse"></div>}>
        <HomeFAQSection />
      </Suspense>

      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <JoinLuciraCommunity />
      </Suspense>


    </div>
  );
}

