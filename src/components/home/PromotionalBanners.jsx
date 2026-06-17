"use client";

import Link from "next/link";

const PromotionalBanners = () => {
  const banners = [
    {
      id: 1,
      desktopSrc: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Father_27s-Day-Desktop-1_1.jpg?v=1781589362",
      mobileSrc: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Father_27s-Day-Mobile-1_1.jpg?v=1781589667",
      alt: "Father's Day Gifts",
      link: "/collections/gifts-for-father", 
    },
    {
      id: 2,
      desktopSrc: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Baarish-Desktop-1_1.jpg?v=1781589362",
      mobileSrc: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Baarish-Mobile-1_1.jpg?v=1781589667",
      alt: "Baarish Collection",
      link: "/collections/jewelry", 
    },
  ];

  return (
    <div className="w-full bg-white pb-8 md:pb-12">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.link}
              className="relative block w-full overflow-hidden group rounded-md"
            >
              {/* Desktop Image */}
              <div className="hidden md:block">
                <img
                  src={banner.desktopSrc}
                  alt={banner.alt}
                  width={642}
                  height={442}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              {/* Mobile Image */}
              <div className="block md:hidden">
                <img
                  src={banner.mobileSrc}
                  alt={banner.alt}
                  width={343}
                  height={236}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanners;
