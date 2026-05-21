import { Suspense } from "react";
import dynamic from "next/dynamic";
import HeroSliderImage from "@/components/home/HeroSliderImage";
import ExploreRange from "@/components/home/ExploreRange";
import FeatureBar from "@/components/home/FeatureBar";
import DiamondCuts from "@/components/home/DiamondCuts"
import ShopByCategory from "@/components/home/ShopByCategory";
import JewelryBlogContainer from "@/components/home/JewelryBlogContainer";

// Lazy load below-the-fold components
const StyledByLucira = dynamic(() => import("@/components/home/StyledByLucira"), { suspense: true });
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
const BestsellerSection = dynamic(() => import("@/components/home/homeCollection/BestsellerSection"), { suspense: true });
const GemstoneSection = dynamic(() => import("@/components/home/homeCollection/GemstoneSection"), { suspense: true });
const ExploreCollectionSection = dynamic(() => import("@/components/home/homeCollection/ExploreCollectionSection"), { suspense: true });

// Refactored Sections
import MobileCategorySlider from "@/components/home/MobileCategorySlider";
import { getHomepageSectionsData } from "@/lib/homepage-data";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const sectionsData = await getHomepageSectionsData();

  return (
    <div className="w-full">
      <MobileCategorySlider />
      <HeroSliderImage />
      <FeatureBar />
      <ExploreRange />

      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse"></div>}>
        <BestsellerSection initialProducts={sectionsData.bestsellers} />
      </Suspense>

      <DiamondCuts />
      {/* <ShopByCategory /> */}
      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <StyledByLucira />
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

      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse"></div>}>
        <GemstoneSection initialProducts={sectionsData.gemstones} />
      </Suspense>

      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <EveryoneYouLove />
      </Suspense>

      <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse"></div>}>
        <ExploreCollectionSection initialProducts={sectionsData.explore} />
      </Suspense>

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
