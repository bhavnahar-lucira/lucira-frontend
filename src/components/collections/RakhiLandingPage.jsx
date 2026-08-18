"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
    desktop: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Middle-Banner-Desktop_fb3ee746-ecd8-442f-8aa6-2a7b9ede5ae7.jpg?v=1787032488",
    mobile: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Middle-Banner-Mobile_28162d30-8c0c-4e13-8fb1-a485ec6fe2eb.jpg?v=1787032488",
  },
};

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

      {/* ============ 5. GIFTS FOR SISTERS ROW ============ */}
      {(sistersLoading || sisterProducts.length > 0) && (
        <section className="w-full overflow-hidden pb-10 md:pb-16">
          <div className="container-main">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya text-black">
                Return Gift For Her
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
