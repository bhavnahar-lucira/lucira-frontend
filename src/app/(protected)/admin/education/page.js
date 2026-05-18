"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import { GraduationCap, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const educationSlides = [
  {
    title: "22 Carat Gold Hallmark",
    href: "/blogs/stories/22-carat-gold-hallmark",
    desktopImg: "https://luciraonline.myshopify.com/cdn/shop/files/Banner_7ab78e0c-831c-4131-9a38-b6c94ea3a3ae.jpg?v=1757059864&width=1200",
    mobileImg: "https://luciraonline.myshopify.com/cdn/shop/files/Mobile_Banner_08fac4dc-4342-401b-aacb-316eb5d66384.jpg?v=1757059976&width=600",
  },
  {
    title: "The Attitude Shift Towards Lab Grown Diamonds",
    href: "/blogs/stories/the-attitude-shift-towards-lab-grown-diamonds",
    desktopImg: "https://luciraonline.myshopify.com/cdn/shop/files/The_Attitude_Shift_Towards_Lab_Grown_Diamonds.png?v=1750852322&width=1200",
    mobileImg: "https://luciraonline.myshopify.com/cdn/shop/files/The_Attitude_Shift_Towards_Lab_Grown_Diamonds_webp.jpg?v=1751268777&width=600",
  },
  {
    title: "Engagement Ring Hand Guide",
    href: "/blogs/stories/which-hand-engagement-ring-female",
    desktopImg: "https://luciraonline.myshopify.com/cdn/shop/files/Banenr_Old.jpg?v=1765623115&width=1200",
    mobileImg: "https://luciraonline.myshopify.com/cdn/shop/files/Mobile_Baner_Old.jpg?v=1765623133&width=600",
  },
  {
    title: "Is 9KT Gold Real Gold?",
    href: "/blogs/stories/is-9kt-gold-real-gold",
    desktopImg: "https://luciraonline.myshopify.com/cdn/shop/files/Banner_cd7811ca-3813-4ba9-b261-699bfe0a54b9.jpg?v=1759577831&width=1200",
    mobileImg: "https://luciraonline.myshopify.com/cdn/shop/files/Mobile_Banner_205ab6e9-7047-47c1-9406-dcb706a112e8.jpg?v=1759577868&width=600",
  },
  {
    title: "What Is BIS Hallmark?",
    href: "/blogs/stories/what-is-bis-hallmark",
    desktopImg: "https://luciraonline.myshopify.com/cdn/shop/files/Banner_V3_BIS.jpg?v=1753689521&width=1200",
    mobileImg: "https://luciraonline.myshopify.com/cdn/shop/files/Mobile_Banner_1_3a756d42-c6ca-4913-80a5-c581d3f6f873.jpg?v=1753518221&width=600",
  },
];

const guides = [
  {
    title: "Diamond Guide",
    desc: "Understand diamonds beyond the sparkle. Learn about the 4Cs, diamond quality, certifications, and what truly impacts beauty and value.",
    href: "/pages/diamond-education",
    bgClass: "bg-[#FDF8F3]",
  },
  {
    title: "Metal Guide",
    desc: "Explore precious metals used in fine jewellery, from gold purity to finishes and durability, so you can choose a metal that suits your style.",
    href: "/pages/metal-education",
    bgClass: "bg-[#F3E0CF]",
  },
];

const sizeGuides = [
  { title: "Ring Size Guide", href: "/pages/size-guide-1" },
  { title: "Bracelet Size Guide", href: "/pages/size-guide-1" },
  { title: "Bangle Size Guide", href: "/pages/size-guide-1" },
  { title: "Necklace Size Guide", href: "/pages/size-guide-1" },
];

const featureSections = [
  {
    title: "How to wear jewelry",
    desc: "Discover simple styling tips to wear jewellery with confidence. From everyday elegance to special occasions, learn how to layer, pair, and balance your pieces.",
    href: "/pages/how-to-wear-2",
    img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/How-to-Wear-Jewelry.jpg?v=1769077182",
    reverse: false,
  },
  {
    title: "LGD vs Mined",
    desc: "Compare lab grown and mined diamonds clearly. Understand their origins, appearance, value, and impact to decide which diamond aligns with your preferences.",
    href: "/pages/lgd-mine-page",
    img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/LGD-vs-Mined-Diamond.jpg?v=1769077182",
    reverse: true,
  },
  {
    title: "Product Passport",
    desc: "Trace your jewellery's journey. Learn about diamond origin, craftsmanship, and authenticity through transparent details unique to every piece you own.",
    href: "/pages/product-passport",
    img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Product-Passport.jpg?v=1769077182",
    reverse: false,
  },
  {
    title: "Diamond Shapes",
    desc: "Explore popular diamond shapes and their personalities. From classic to modern cuts, find the shape that best reflects your style and sparkle preference.",
    href: "/pages/diamond-shapes",
    img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Rectangle_24049_2.jpg?v=1767961966",
    reverse: true,
  },
];

export default function EducationPage() {
  return (
    <div className="font-figtree w-full relative overflow-x-hidden">
      <style jsx global>{`
        .edu-swiper .swiper-button-next,
        .edu-swiper .swiper-button-prev {
          background-color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #5a413f;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .edu-swiper .swiper-button-next svg,
        .edu-swiper .swiper-button-prev svg {
          max-width: 16px !important;
          max-height: 16px !important;
          width: 16px;
          height: 16px;
        }
        .edu-swiper .swiper-button-next:after,
        .edu-swiper .swiper-button-prev:after {
          font-size: 16px !important;
          font-weight: bold;
        }
        .edu-swiper .swiper-pagination-bullet-active {
          background: #5a413f;
        }
      `}</style>

      <div className="space-y-10 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-16 md:pb-20 px-0.5">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 px-1 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="size-9 md:size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <GraduationCap size={20} />
              </div>
              <h2 className="font-figtree text-xl md:text-2xl font-bold text-primary tracking-tight mb-1">
                Education
              </h2>
            </div>
            <p className="font-figtree text-sm md:text-base text-zinc-500 font-medium leading-relaxed max-w-2xl">
              Learn everything you need to know about jewelry, from gold purity to diamond quality and styling tips.
            </p>
          </div>
        </div>

        {/* ── Swiper Slider ── */}
        <div className="px-1 w-full">
          <div className="rounded-2xl md:rounded-[4px] overflow-hidden shadow-xl shadow-zinc-200/50 bg-white border border-zinc-100 relative w-full">
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              spaceBetween={0}
              slidesPerView={1}
              pagination={{ clickable: true }}
              navigation
              autoplay={{ delay: 5000 }}
              className="w-full h-[220px] md:h-[300px] edu-swiper"
            >
              {educationSlides.map((slide, idx) => (
                <SwiperSlide key={idx}>
                  <Link href={slide.href} className="relative block w-full h-full group">
                    <div className="w-full h-full relative">
                      <picture className="w-full h-full">
                        <source media="(max-width: 767px)" srcSet={slide.mobileImg} />
                        <img
                          src={slide.desktopImg}
                          alt={slide.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </picture>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* ── Guides Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 px-1">
          {guides.map((guide, idx) => (
            <Link
              key={idx}
              href={guide.href}
              className={`${guide.bgClass} rounded-[1.75rem] md:rounded-[4px] p-7 md:p-12 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 border border-zinc-100 w-full`}
            >
              <div>
                <h3 className="font-figtree text-lg md:text-xl font-bold text-primary mb-3 md:mb-4 tracking-tight">
                  {guide.title}
                </h3>
                <p className="font-figtree text-sm md:text-base text-zinc-600 font-normal leading-relaxed max-w-sm">
                  {guide.desc}
                </p>
              </div>
              <div className="mt-6 md:mt-8 flex items-center gap-2 text-primary font-semibold uppercase tracking-[0.13em] text-[10px] group-hover:translate-x-2 transition-transform">
                View Guide <ChevronRight size={15} />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Size Guide ── */}
        <div className="bg-white rounded-[1.75rem] md:rounded-[4px] border border-zinc-100 p-7 md:p-14 text-center shadow-sm mx-1">
          <h2 className="font-figtree text-lg md:text-xl font-bold text-primary mb-3 md:mb-4 tracking-tight">
            Size Guide
          </h2>
          <p className="font-figtree text-sm md:text-base text-zinc-500 font-normal leading-relaxed max-w-2xl mx-auto mb-8 md:mb-12">
            Find the perfect fit with our easy sizing guide. Learn how to measure rings, bracelets, and necklaces accurately for comfort and everyday wear.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {sizeGuides.map((guide, idx) => (
              <Link
                key={idx}
                href={guide.href}
                className="font-figtree bg-zinc-50 border border-zinc-100 rounded-2xl p-4 md:p-6 font-semibold text-[10px] md:text-xs uppercase tracking-[0.13em] text-zinc-800 hover:bg-primary hover:text-white transition-all duration-300"
              >
                {guide.title}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Feature Sections ── */}
        <div className="space-y-8 md:space-y-12 px-1">
          {featureSections.map((section, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                section.reverse ? "md:flex-row-reverse" : "md:flex-row"
              } items-stretch bg-white rounded-[1.75rem] md:rounded-[4px] overflow-hidden border border-zinc-100 shadow-sm w-full`}
            >
              {/* Image */}
              <div className="w-full md:w-1/2 relative min-h-[220px] md:min-h-full overflow-hidden">
                <img
                  src={section.img}
                  alt={section.title}
                  className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Text */}
              <div className="w-full md:w-1/2 p-7 md:p-16 text-left flex flex-col justify-center space-y-4 md:space-y-6">
                <h2 className="font-figtree text-lg md:text-2xl font-bold text-primary uppercase tracking-[0.03em] leading-tight">
                  {section.title}
                </h2>
                <p className="font-figtree text-sm md:text-base text-zinc-500 font-normal leading-relaxed">
                  {section.desc}
                </p>
                <Link
                  href={section.href}
                  className="font-figtree inline-flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-3 bg-primary text-white text-[10px] md:text-xs font-semibold uppercase tracking-[0.13em] rounded-xl hover:opacity-90 transition-opacity w-fit shadow-lg shadow-primary/10"
                >
                  Know More
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}