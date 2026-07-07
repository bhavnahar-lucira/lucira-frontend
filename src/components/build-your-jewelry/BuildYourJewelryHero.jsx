import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const BuildYourJewelryHero = () => {
  const categories = [
    { 
      title: 'Bracelets', 
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437257999.jpg?v=1783336168',
      href: '/build-your-jewelry?type=bracelets'
    },
    { 
      title: 'Necklaces', 
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Frame_1437258000.jpg?v=1783336252',
      href: '/build-your-jewelry?type=necklaces'
    },
    // { 
    //   title: 'Anklets', 
    //   image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/3dd9e9ad-9062-4fb1-95e2-25e8cd6c10f7_2.png',
    //   href: '/build-your-jewelry?type=anklets'
    // },
  ];

  const bgImageUrl = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/4298bdee-8fdd-49be-859e-300dc1a1c7aew.png?v=1780381414";

  return (
    <section className="bg-[#FEF5F1] w-full">
      <div 
        className="pt-0 pb-[60px] md:py-[60px] md:bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/4298bdee-8fdd-49be-859e-300dc1a1c7aew.png?v=1780381414')] bg-no-repeat bg-left-top bg-contain h-[100vh] min-[1024px]:max-[1600px]:h-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-[45%_55%] max-w-[1440px] mx-auto h-full items-center min-[1024px]:max-[1600px]:px-12">
          {/* Image Column - Hidden on desktop (using background instead), visible on mobile */}
          <div className="md:hidden w-full">
            <Image 
              src={bgImageUrl}
              alt="Build Your Jewelry Hero"
              width={800}
              height={1080}
              priority
              className="w-full h-auto block"
            />
          </div>

          {/* Placeholder for desktop grid layout */}
          <div className="hidden md:block"></div>

          {/* Content Column */}
          <div className="flex flex-col text-center px-5 md:px-0 pt-[50px] md:pt-0">
            <div className="subtitle text-[#5A413F] font-medium text-[14px] leading-[100%] uppercase mb-3">
              Your Story, Your Sparkle
            </div>
            <h1 className="font-abhaya font-bold text-[32px] md:text-[60px] leading-[0.9] text-[#481a19] max-w-[350px] md:max-w-[415px] mx-auto mt-3 md:mt-5">
              For Every Chapter of You
            </h1>
            <p className="font-figtree text-[14px] md:text-[16px] leading-[1.5] text-[#1A1A1A] max-w-[655px] mx-auto mt-3 md:mt-4 mb-7">
              Design your own personalized lab-grown diamond chain — whether it’s a necklace or bracelet — with our online builder, and celebrate every chapter of your journey with timeless brilliance and meaningful charms.
            </p>
            
            <div className="grid grid-cols-2 gap-3 md:gap-5 mt-0 px-5 md:px-0 max-w-[400px] md:max-w-[550px] min-[1024px]:max-[1600px]:max-w-[400px] mx-auto">
              {categories.map((cat, index) => (
                <Link key={index} href={cat.href} className="flex flex-col items-center group w-full">
                  <div className="w-full relative overflow-hidden rounded-[5px]">
                    <Image 
                      src={cat.image} 
                      alt={cat.title} 
                      width={600}
                      height={646}
                      sizes="(max-width: 768px) 50vw, 50vw"
                      className="w-full h-auto object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2 text-[16px] font-medium text-black">{cat.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuildYourJewelryHero;
