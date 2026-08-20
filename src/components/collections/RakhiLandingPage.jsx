"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import shopifyLoader from "@/utils/shopifyLoader";
import CollectionSlider from "@/components/home/homeCollection/CollectionSlider";
import { apiFetch } from "@/lib/api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Rakhi landing page creatives. All images render through next/image with the
// Shopify CDN loader (multi-width srcset), same structure as the homepage banners.
const RAKHI_BANNERS = {
  header: {
    desktop: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Header-Banner-Desktop.jpg?v=1787032488",
    mobile: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Header-Banner-Mobile.jpg?v=1787032489",
  },
  strip: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/PLP_20Strip.jpg?v=1787032488",
  middle: {
    desktop: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Middle-Banner-Desktop_fb3ee746-ecd8-442f-8aa6-2a7b9ede5ae7.jpg?v=1787146561",
    mobile: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Middle-Banner-Mobile_28162d30-8c0c-4e13-8fb1-a485ec6fe2eb.jpg?v=1787032488",
  },
  // Desktop (1920x1072): couple on the right, blank space on the left for the tiles.
  // Mobile (1080x1920): couple on top, blank space at the bottom for the tiles.
  returnGift: {
    desktop: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_1_71a1e43d-6ee6-4bd7-a05e-4fc6022c6e2a.png?v=1787044227",
    mobile: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_e25767f9-520c-450e-9f6c-9545bd8c9296.png?v=1787044227",
  },
};

// "Return Gift For Her" price-band tiles overlaid on the banner above.
// NOTE: creative filenames don't all match the price bands — mapping follows the
// creative's contents (UNDER_35K.jpg is the rings shot, UNDER_30K.jpg the pendants shot).
const RETURN_GIFT_TILES = [
  {
    label: "Earrings Under 25k",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/UNDER_25K.jpg?v=1787050813",
    href: "/collections/lab-grown-diamond-earrings-under-25k",
  },
  {
    label: "Pendants Under 35k",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/UNDER_30K.jpg?v=1787050813",
    href: "/collections/lab-grown-diamond-pendants-under-35k",
  },
  {
    label: "Rings Under 45k",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/UNDER_35K.jpg?v=1787050813",
    href: "/collections/lab-grown-diamond-rings-under-45k",
  },
  {
    label: "Bracelets Under 55k",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/UNDER_55K.jpg?v=1787050812",
    href: "/collections/lab-grown-diamond-bracelets-under-55k",
  },
];

// Desktop creatives are 1920x823, mobile creatives are 1080x1350.
function ResponsiveBanner({ desktop, mobile, alt, priority = false }) {
  return (
    <div className="relative w-full">
      <div className="hidden lg:block w-full">
        <Image
          loader={shopifyLoader}
          src={desktop}
          alt={alt}
          width={1920}
          height={823}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-auto object-cover object-center"
          sizes="100vw"
          draggable={false}
        />
      </div>
      <div className="block lg:hidden w-full">
        <Image
          loader={shopifyLoader}
          src={mobile}
          alt={alt}
          width={1080}
          height={1350}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-auto object-cover object-center"
          sizes="100vw"
          draggable={false}
        />
      </div>
    </div>
  );
}

function ReturnGiftTile({ tile }) {
  return (
    <Link
      href={tile.href}
      className="group block overflow-hidden rounded-md bg-white shadow-sm"
    >
      <div className="relative aspect-[4/3] lg:aspect-[3/2] w-full overflow-hidden">
        <Image
          loader={shopifyLoader}
          src={tile.image}
          alt={tile.label}
          fill
          sizes="(min-width: 1024px) 21vw, 44vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          draggable={false}
        />
      </div>
      <div className="bg-white py-1.5 md:py-2.5 text-center">
        <span className="font-figtree text-[0.625rem] md:text-sm font-semibold uppercase tracking-wide text-[#2B1F1E]">
          {tile.label}
        </span>
      </div>
    </Link>
  );
}

export default function RakhiLandingPage({ products = [], loading = false }) {
  const [sisterProducts, setSisterProducts] = useState([]);
  const [sistersLoading, setSistersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchSisterGifts() {
      try {
        const data = await apiFetch(`/api/collection?handle=gifts-for-sisters&limit=15`);
        if (!cancelled && data?.products) {
          setSisterProducts(data.products.filter(p => !p.tags?.some(t => t?.toLowerCase() === "hidden")));
        }
      } catch (error) {
        console.error("Failed to fetch gifts-for-sisters products:", error);
      } finally {
        if (!cancelled) setSistersLoading(false);
      }
    }
    fetchSisterGifts();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <h1 className="sr-only">Rakhi Collection</h1>

      {/* Mobile Breadcrumbs */}
      <div className="block lg:hidden">
        <div className="container-main mx-auto pt-2 px-4 py-3">
          <Breadcrumb>
            <BreadcrumbList className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-gray-400">
              <BreadcrumbItem><BreadcrumbLink href="/" className="hover:text-[#5a413f] transition-colors">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="scale-75" />
              <BreadcrumbItem><BreadcrumbLink href="/collections/jewelry" className="hover:text-[#5a413f] transition-colors">Collections</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="scale-75" />
              <BreadcrumbItem className="truncate line-clamp-1 whitespace-nowrap"><BreadcrumbPage className="text-[#5a413f]">Rakhi</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ============ 1. HEADER BANNER ============ */}
      <ResponsiveBanner
        desktop={RAKHI_BANNERS.header.desktop}
        mobile={RAKHI_BANNERS.header.mobile}
        alt="Your Rakhi Gift - Shipping in Just 48 Hrs"
        priority
      />

      {/* ============ 2. RAKHI PRODUCTS ROW ============ */}
      <section className="w-full overflow-hidden py-8 md:py-12">
        <div className="container-main">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya text-black">
              Rakhis That Become Pendants
            </h2>
          </div>
          <CollectionSlider
            products={products}
            loading={loading}
            collectionHandle="rakhi"
            priorityCount={4}
            promoClickMeta={{
              creative_name: "rakhi collection row",
              location_id: "rakhi landing page",
              promo_id: "rakhi",
            }}
          />
        </div>
      </section>

      {/* ============ 3. STRIP ============ */}
      <div className="w-full">
        <Image
          loader={shopifyLoader}
          src={RAKHI_BANNERS.strip}
          alt="Send Rakhis Across India"
          width={1920}
          height={350}
          loading="lazy"
          className="w-full h-auto object-cover object-center"
          sizes="100vw"
          draggable={false}
        />
      </div>

      {/* ============ 4. MIDDLE BANNER ============ */}
      <div className="py-8 md:py-12">
        <ResponsiveBanner
          desktop={RAKHI_BANNERS.middle.desktop}
          mobile={RAKHI_BANNERS.middle.mobile}
          alt="A Rakhi today. A Pendant tomorrow."
        />
      </div>

      {/* ============ 5. RETURN GIFT FOR HER BANNER + PRICE-BAND TILES ============ */}
      <section className="w-full">
        {/* Mobile: title above the banner. On desktop it moves inside the banner's blank area. */}
        <div className="text-center mb-6 lg:hidden">
          <h2 className="text-2xl font-extrabold font-abhaya text-black">
            Gifts She&rsquo;ll Treasure, Under ₹55K
          </h2>
        </div>

        <div className="relative w-full">
          {/* Desktop: couple on the right, tiles overlaid on the blank left side */}
          <div className="hidden lg:block relative w-full">
            <Image
              loader={shopifyLoader}
              src={RAKHI_BANNERS.returnGift.desktop}
              alt="Return Gift For Her"
              width={1920}
              height={1072}
              loading="lazy"
              className="w-full h-auto object-cover object-center"
              sizes="100vw"
              draggable={false}
            />
            <div className="absolute inset-y-0 left-[4%] w-[40%] flex flex-col justify-center">
              <h2 className="text-center text-3xl xl:text-4xl font-extrabold font-abhaya text-black mb-6 xl:mb-8">
                Gifts She&rsquo;ll Treasure, Under ₹55K
              </h2>
              <div className="grid w-full grid-cols-2 gap-4 xl:gap-5">
                {RETURN_GIFT_TILES.map((tile) => (
                  <ReturnGiftTile key={tile.label} tile={tile} />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: couple on top, tiles overlaid on the blank bottom area */}
          <div className="block lg:hidden relative w-full">
            <Image
              loader={shopifyLoader}
              src={RAKHI_BANNERS.returnGift.mobile}
              alt="Return Gift For Her"
              width={1080}
              height={1920}
              loading="lazy"
              className="w-full h-auto object-cover object-center"
              sizes="100vw"
              draggable={false}
            />
            <div className="absolute inset-x-[5%] bottom-[2%]">
              <div className="grid grid-cols-2 gap-2.5">
                {RETURN_GIFT_TILES.map((tile) => (
                  <ReturnGiftTile key={tile.label} tile={tile} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 6. GIFTS FOR SISTERS ROW ============ */}
      {(sistersLoading || sisterProducts.length > 0) && (
        <section className="w-full overflow-hidden py-8 md:py-12 pb-10 md:pb-16">
          <div className="container-main">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya text-black">
                What Are You Getting Her?
              </h2>
            </div>
            <CollectionSlider
              products={sisterProducts}
              loading={sistersLoading}
              collectionHandle="gifts-for-sisters"
              promoClickMeta={{
                creative_name: "gifts for sisters row",
                location_id: "rakhi landing page",
                promo_id: "gifts-for-sisters",
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
