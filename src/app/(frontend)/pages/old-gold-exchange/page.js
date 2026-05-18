"use client";

import { PAGE_DATA } from "./data";
import LazyImage from "@/components/common/LazyImage";
import OldGoldCalculator from "@/components/pages/old-gold-exchange/OldGoldCalculator";
import HowItWorks from "@/components/pages/old-gold-exchange/HowItWorks";
import StoreLocator from "@/components/pages/old-gold-exchange/StoreLocator";
import OldGoldUSP from "@/components/pages/old-gold-exchange/OldGoldUSP";
import OtherStores from "@/components/pages/old-gold-exchange/OtherStores";
import FAQSection from "@/components/pages/old-gold-exchange/FAQSection";

export default function OldGoldExchangePage() {
  const { banner, calculator, how_it_works, store_locator, other_stores, usp, faq } = PAGE_DATA.sections;

  return (
    <div className="w-full bg-[#f8f8f8] font-figtree">
      {/* ─────── BANNER SECTION ─────── */}
      <section className="relative w-full h-[535px] md:h-[605px] flex items-end justify-center overflow-hidden">
        {/* Desktop Image */}
        <div className="hidden md:block absolute inset-0">
          <LazyImage
            src={banner.desktop_image}
            alt={banner.heading}
            fill
            priority
            className="object-cover"
          />
        </div>
        {/* Mobile Image */}
        <div className="block md:hidden absolute inset-0">
          <LazyImage
            src={banner.mobile_image}
            alt={banner.heading}
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-black/40 z-10" />

        <div className="relative z-20 text-center text-white p-5 pb-[10px] max-w-[800px] mb-[30px] md:mb-[50px]">
          <h1 className="font-abhaya text-[18px] md:text-[28px] font-bold leading-tight mb-4 uppercase tracking-widest drop-shadow-lg">
            {banner.heading}
          </h1>
          <p className="font-figtree text-[14px] md:text-[18px] leading-relaxed opacity-95 max-w-[600px] mx-auto drop-shadow-md">
            {banner.subheading}
          </p>
        </div>
      </section>

      {/* ─────── PAGE SECTIONS ─────── */}
      <div className="page-sections flex flex-col gap-0 font-figtree">
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
