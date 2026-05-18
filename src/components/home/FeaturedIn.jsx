"use client";

import Link from "next/link";
import Marquee from "react-fast-marquee";

export default function FeaturedIn() {
  const logos = [
    {
      url: "https://www.bwdisrupt.com/article/lucira-founder-rupesh-jain-believes-indias-jewellery-sector-will-be-defined-by-co-existence-not-competition-556873",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/bw-disrupt_250x.png?v=1763032304",
      alt: "BW Disrupt Logo"
    },
    {
      url: "https://mediabrief.com/candere-founder-rupesh-jain-launches-lab-grown-diamond-brand-lucira/",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/Media_Brief_logo_250x.png?v=1763032386",
      alt: "Mediabrief Logo"
    },
    {
      url: "https://jewelbuzz.in/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewelry-brand-lucira-taps-into-booming-industry-potential/",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/jewelbuzz_logo_250x.png?v=1763032468",
      alt: "JewelBuzz"
    },
    {
      url: "https://www.imagesbof.in/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewellery-brand-lucira/",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/bof_logo_250x.png?v=1763032485",
      alt: "BOF Logo"
    },
    {
      url: "https://www.entrepreneur.com/en-in/news-and-trends/from-candere-to-lucira-jains-new-chapter-in-purposeful/490616",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/enterpreneur_250x.png?v=1763032353",
      alt: "Entrepreneur"
    },
    {
      url: "https://retail.economictimes.indiatimes.com/news/apparel-fashion/jewellery/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewelry-brand-lucira/120573620",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/Retail.com_250x.png?v=1763032425",
      alt: "Retail.com"
    },
    {
      url: "https://inc42.com/startups/how-rupesh-jains-lucira-wants-to-redefine-luxury-with-lab-grown-diamonds/",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/Inc_42_250x.png?v=1763032499",
      alt: "Inc_42"
    },
    {
      url: "https://madeinmedia.in/candere-founder-rupesh-jain-launches-lab-grown-diamond-jewellery-brand-lucira-taps-into-booming-industry-potential/",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/MiM_2_250x.png?v=1763032023",
      alt: "madeinmedia"
    },
    {
      url: "https://www.indulgexpress.com/fashion/new-launches/2025/May/29/lucira-redefines-fine-jewellery-with-lab-grown-diamonds-and-sustainable-luxury",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/indulge_logo_250x.png?v=1763032406",
      alt: "Indulge"
    },
    {
      url: "https://startuptalky.com/news/candere-rupesh-jain-launches-lucira-lab-grown-diamond-jewellery/",
      image: "https://luciraonline.myshopify.com/cdn/shop/files/Startup_Talky_2_250x.png?v=1763032023",
      alt: "Startup_Talky"
    }
  ];

  return (
    <section className="featured-in-section bg-white overflow-hidden py-8 md:py-12">
      <div className="text-center mb-10 px-4">
        <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">Featured In</h2>
        <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">Trusted by leading brands and media</p>
      </div>

      <div className="relative w-full overflow-hidden py-4">
        {/* Gradient overlays */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-24 md:w-36 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-24 md:w-36 bg-gradient-to-l from-white to-transparent z-10" />

        <Marquee
          speed={40}
          pauseOnHover={true}
          gradient={false}
          autoFill={true}
        >
          {logos.map((logo, index) => (
            <div className="marquee-item px-6 md:px-10" key={`logo-${index}`}>
              <Link href={logo.url} target="_blank" rel="noopener noreferrer" className="block">
                <img 
                  src={logo.image} 
                  alt={logo.alt} 
                  loading="lazy" 
                  className="marquee-img" 
                />
              </Link>
            </div>
          ))}
        </Marquee>
      </div>

      <style jsx>{`
        .marquee-img {
          max-width: 120px;
          height: 50px;
          object-fit: contain;
          filter: grayscale(1);
          transition: filter 0.3s ease;
        }

        @media (min-width: 768px) {
          .marquee-img {
            max-width: 140px;
            height: 60px;
          }
        }

        .marquee-item:hover .marquee-img {
          filter: grayscale(0);
        }
        
        .font-abhaya { font-family: var(--font-abhaya), serif; }
        .font-figtree { font-family: var(--font-figtree), sans-serif; }
      `}</style>
    </section>
  );
}
``