"use client";

import Image from "next/image";
import Link from "next/link";
import shopifyLoader from "@/utils/shopifyLoader";

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
              className="relative block w-full overflow-hidden group rounded-md aspect-[343/236] md:aspect-[642/442]"
            >
              {/* Desktop Image */}
              <div className="hidden md:block relative w-full h-full">
                <Image
                  loader={shopifyLoader}
                  src={banner.desktopSrc}
                  alt={banner.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
              {/* Mobile Image */}
              <div className="block md:hidden relative w-full h-full">
                <Image
                  loader={shopifyLoader}
                  src={banner.mobileSrc}
                  alt={banner.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="100vw"
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
