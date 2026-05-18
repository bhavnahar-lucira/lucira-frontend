import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function FeaturedInPage() {
  const articles = [
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/MediaBrief_1.png?v=1752238829",
      date: "24 APRIL 2025",
      heading: "LUCIRA UNVEILS LAB GROWN COLLECTION",
      text: "Digital jewelry pioneer Rupesh Jain returns with Lucira, focusing on meaningful, ethical and personalized lab grown diamond experiences.",
      link: "https://mediabrief.com/candere-founder-rupesh-jain-launches-lab-grown-diamond-brand-lucira/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/jewelbuzz_1.png?v=1752238830",
      date: "24 APRIL 2025",
      heading: "TIMELESS CRAFTSMANSHIP EMBRACES MODERN RESPONSIBILITY",
      text: "Lucira blends ethical sourcing, heritage craftsmanship and digital innovation for modern consumers.",
      link: "https://jewelbuzz.in/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewelry-brand-lucira-taps-into-booming-industry-potential/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/BQF_1.png?v=1752238829",
      date: "24 APRIL 2025",
      heading: "CRAFTED TO HONOR MOMENTS THAT MATTER",
      text: "Lucira combines lab grown brilliance with emotional storytelling and sustainable luxury.",
      link: "https://www.imagesbof.in/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewellery-brand-lucira/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/ET_1.png?v=1752238830",
      date: "24 APRIL 2025",
      heading: "RUPESH JAIN RETURNS WITH A SPARKLING VISION",
      text: "Lucira positions itself as a leader in lab grown diamond jewellery with modern design and ethical values.",
      link: "https://retail.economictimes.indiatimes.com/news/apparel-fashion/jewellery/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewelry-brand-lucira/120573620"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Made_in_Media.png?v=1752238830",
      date: "24 APRIL 2025",
      heading: "AT THE FOREFRONT OF A GROWING MARKET",
      text: "Lucira is reshaping luxury through sustainability, AI-led customization and digital-first innovation.",
      link: "https://madeinmedia.in/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewellery-brand-lucira-taps-into-booming-industry-potential/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Startup_Talky.png?v=1752238830",
      date: "24 APRIL 2025",
      heading: "TECH-POWERED SPARKLE FOR TODAY’S WORLD",
      text: "Lucira blends sustainability, design and innovation to redefine modern jewellery.",
      link: "https://madeinmedia.in/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewellery-brand-lucira-taps-into-booming-industry-potential/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Entreprneur_India_1.png?v=1752238830",
      date: "25 APRIL 2025",
      heading: "BRILLIANCE WITH A LIGHTER FOOTPRINT",
      text: "Lucira delivers ethical luxury with certified diamonds and digital-first experiences.",
      link: "https://www.entrepreneur.com/en-in/news-and-trends/from-candere-to-lucira-jains-new-chapter-in-purposeful/490616"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/inc_42_1.png?v=1752238830",
      date: "28 APRIL 2025",
      heading: "SUSTAINABLE LUXURY TAKES CENTER STAGE",
      text: "Lucira targets millennials with eco-conscious and design-first jewellery offerings.",
      link: "https://inc42.com/startups/how-rupesh-jains-lucira-wants-to-redefine-luxury-with-lab-grown-diamonds/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Disrupt_1.png?v=1752238829",
      date: "16 MAY 2025",
      heading: "COLLECTIVE STRENGTH DRIVES INDUSTRY FORWARD",
      text: "Lucira focuses on coexistence between legacy brands and startups.",
      link: "https://www.bwdisrupt.com/article/lucira-founder-rupesh-jain-believes-indias-jewellery-sector-will-be-defined-by-co-existence-not-competition-556873"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/India_Retailing.png?v=1752238829",
      date: "26 MAY 2025",
      heading: "SHAPING A SUSTAINABLE FUTURE IN JEWELLERY",
      text: "Lucira blends design, technology and sustainability for modern consumers.",
      link: "https://www.indiaretailing.com/2025/05/26/rupesh-jains-new-venture-lucira-bets-on-solitaires-targets-offline-launch-global-entry/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/indulge_logo.png?v=1763032406",
      date: "29 MAY 2025",
      heading: "A REFINED COLLECTION FOR MEANINGFUL MOMENTS",
      text: "Lucira’s debut collection celebrates modern elegance and conscious luxury.",
      link: "https://www.indulgexpress.com/fashion/new-launches/2025/May/29/lucira-redefines-fine-jewellery-with-lab-grown-diamonds-and-sustainable-luxury"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/jewelbuzz_1.png?v=1752238830",
      date: "20 JUNE 2025",
      heading: "FOR WOMEN WHO STYLE LIFE ON THE MOVE",
      text: "Lucira’s “On The Move” collection celebrates strength, motion and modern femininity.",
      link: "https://jewelbuzz.in/lucira-launches-on-the-move-collection-a-tribute-to-modern-women/"
    },
    {
      logo: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Indian_Jeweller.png?v=1752322362",
      date: "18 JUNE 2025",
      heading: "JEWELLERY THAT MOVES WITH MODERN FEMININITY",
      text: "Lucira’s debut collection reflects strength, elegance and everyday versatility.",
      link: "https://indianjeweller.in/Indian-Jewellery-News/15493/lucira-launches-with-debut-collection-celebrating-modern-womanhood-and-motion"
    }
  ];

  return (
    <section className="w-full bg-white font-figtree py-10 md:py-16">
      <div className="container mx-auto px-5 ">

        {/* Header Section */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-abhaya text-3xl md:text-[40px] leading-tight mb-2 uppercase">AS SEEN ON</h2>
          <p className="text-sm md:text-[18px] text-gray-600">
            Lucira in the spotlight across leading media platforms.
          </p>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {articles.map((article, index) => (
            <div key={index} className="flex flex-col border border-border p-5 rounded-md hover:shadow-md transition-shadow duration-300">

              {/* Logo Wrapper */}
              <div className="h-14 md:h-16 mb-6 flex items-center justify-start">
                <img
                  src={article.logo}
                  alt={article.heading}
                  className="max-h-full max-w-[120px] md:max-w-[150px] object-contain"
                  loading="lazy"
                />
              </div>

              {/* Card Content */}
              <p className="text-muted-foreground text-[10px] tracking-widest uppercase mb-2">
                {article.date}
              </p>

              <h3 className="font-figtree text-lg md:text-[22px] font-semibold leading-tight uppercase mb-3 text-foreground">
                {article.heading}
              </h3>

              <p className="text-[14px] md:text-[15px] leading-relaxed text-muted-foreground flex-grow mb-6">
                {article.text}
              </p>

              {/* Read More Link */}
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] md:text-[14px] text-primary underline underline-offset-4 tracking-wider uppercase font-semibold mt-auto inline-block w-fit hover:text-accent transition-colors"
              >
                READ MORE.
              </a>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}