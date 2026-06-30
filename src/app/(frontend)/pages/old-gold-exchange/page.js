import { PAGE_DATA } from "./data";
import LazyImage from "@/components/common/LazyImage";
import OldGoldCalculator from "@/components/pages/old-gold-exchange/OldGoldCalculator";
import HowItWorks from "@/components/pages/old-gold-exchange/HowItWorks";
import StoreLocator from "@/components/pages/old-gold-exchange/StoreLocator";
import OldGoldUSP from "@/components/pages/old-gold-exchange/OldGoldUSP";
import OtherStores from "@/components/pages/old-gold-exchange/OtherStores";
import FAQSection from "@/components/pages/old-gold-exchange/FAQSection";
import LuxuryMarquee from "@/components/product/LuxuryMarquee";

export default function OldGoldExchangePage() {
  const { banner, calculator, how_it_works, store_locator, other_stores, usp, faq } = PAGE_DATA.sections;

  const marqueeItems = [
    "Bring in your old jewellery and avail <span class='font-bold not-italic'>5% additional value<span>",
    "Instant Valuation & Payment",
    "Your upgrade starts here",
    "Trusted by Thousands of Customers",
    "Exchange Old Gold for New Jewelry",
  ];

  return (
    <div className="w-full bg-[#f8f8f8] font-figtree">
      {/* ─────── BANNER SECTION ─────── */}


      {/* ─────── PAGE SECTIONS ─────── */}
      <div className="page-sections flex flex-col gap-0 font-figtree">
        <LuxuryMarquee prop={["bg-[#B76F79]", "text-white", "text-md", "font-semibold"]} items={marqueeItems} />
        <OldGoldCalculator config={calculator} />

        <HowItWorks data={how_it_works} />

        <StoreLocator data={store_locator} />

        {/* <OtherStores data={other_stores} /> */}

        <OldGoldUSP data={usp} />

        <FAQSection data={faq} />
      </div>
    </div>
  );
}

