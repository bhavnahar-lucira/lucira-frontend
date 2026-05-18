import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function StorePackagingPage() {
  return (
    <div className="w-full">
      {/* HERO BANNER SECTION */}
      <section className="relative w-full h-[535px] md:h-[605px] flex items-end justify-center mb-5 md:mb-20 bg-cover bg-center bg-no-repeat bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Packaging_Mobile_banner_Website.png?v=1763450336')] md:bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Packaging_Desktop_banner_Website.png?v=1763450337')]">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>

        {/* Content */}
        <div className="relative z-20 text-center text-white max-w-[800px] p-5 pb-2 md:pb-5 mb-2 md:mb-5">
          <h2 className="font-abhaya text-lg md:text-[28px] font-medium leading-tight mb-3">
            The Lucira Unboxing Experience
          </h2>
          <p className="font-figtree text-xs md:text-[18px] m-0">
            Designed to protect, crafted to shine, created to be remembered.
          </p>
        </div>
      </section>

      {/* CONTENT BLOCKS CONTAINER */}
      <div className="w-full md:w-[65%] mx-auto px-5 py-5 md:py-10 space-y-10 md:space-y-0">

        {/* BLOCK 1 - Image First */}
        <section className="flex flex-col md:flex-row items-center gap-6 md:gap-[60px] md:py-10">
          <div className="flex-1 w-full relative">
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/DSC08486_1.png?v=1776420792"
              alt="Story begins here"
              className="max-w-full block object-cover mx-auto"
              loading="lazy"
            />
          </div>
          <div className="flex-1 text-center">
            <h2 className="font-abhaya text-[20px] md:text-[28px] uppercase mb-3 mt-0">Story begins here</h2>
            <div className="font-figtree text-[12px] md:text-[18px] mb-3 md:mb-8 leading-[18px] md:leading-[24px]">
              <p>
                Every piece you choose becomes part of your journey - a celebration, a memory, a promise.
                Our packaging is designed to hold that emotion, making every reveal deeply personal.
              </p>
            </div>
            {/* <Link href="#" className="underline text-[14px] md:text-[18px] text-inherit">BOOK AN APPOINTMENT</Link> */}
          </div>
        </section>

        {/* BLOCK 2 - Text First (Desktop), Image First on Mobile (Tailwind handles col & row-reverse) */}
        <section className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-[60px] md:py-10">
          <div className="flex-1 w-full relative">
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/DSC00325_1.png?v=1776420792"
              alt="Sealed with trust"
              className="max-w-full block object-cover mx-auto"
              loading="lazy"
            />
          </div>
          <div className="flex-1 text-center">
            <h2 className="font-abhaya text-[20px] md:text-[28px] uppercase mb-3 mt-0">Sealed with trust</h2>
            <div className="font-figtree text-[12px] md:text-[18px] mb-3 md:mb-8 leading-[18px] md:leading-[24px]">
              <p>
                Our jewelry reaches you exactly as it was meant to - untouched and uncompromised.
                With our secure, tamper-evident packaging, every unboxing carries the assurance
                of authenticity and care.
              </p>
            </div>
            {/* <Link href="#" className="underline text-[14px] md:text-[18px] text-inherit">BOOK AN APPOINTMENT</Link> */}
          </div>
        </section>

        {/* BLOCK 3 - Image First */}
        <section className="flex flex-col md:flex-row items-center gap-6 md:gap-[60px] md:py-10">
          <div className="flex-1 w-full relative">
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/DSC08455_1.png?v=1776420792"
              alt="The impression that matters"
              className="max-w-full block object-cover mx-auto"
              loading="lazy"
            />
          </div>
          <div className="flex-1 text-center">
            <h2 className="font-abhaya text-[20px] md:text-[28px] uppercase mb-3 mt-0">The impression that matters</h2>
            <div className="font-figtree text-[12px] md:text-[18px] mb-3 md:mb-8 leading-[18px] md:leading-[24px]">
              <p>
                Before the sparkle reveals itself, there’s a moment of anticipation.
                Our signature Lucira box is designed to make that moment unforgettable -
                elegant, refined, and made to feel as special as what lies inside.
              </p>
            </div>
            {/* <Link href="#" className="underline text-[14px] md:text-[18px] text-inherit">BOOK AN APPOINTMENT</Link> */}
          </div>
        </section>

        {/* BLOCK 4 - Text First */}
        <section className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-[60px] md:py-10">
          <div className="flex-1 w-full relative">
            <img
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/DSC09505_3.png?v=1776420792"
              alt="Crafted for Moments"
              className="max-w-full block object-cover mx-auto"
              loading="lazy"
            />
          </div>
          <div className="flex-1 text-center">
            <h2 className="font-abhaya text-[20px] md:text-[28px] uppercase mb-3 mt-0">Crafted for Moments</h2>
            <div className="font-figtree text-[12px] md:text-[18px] mb-3 md:mb-8 leading-[18px] md:leading-[24px]">
              <p>
                From the texture of the box to the way it opens, every detail is thoughtfully designed.
                Because extraordinary moments deserve an experience that feels just as special.
              </p>
            </div>
            {/* <Link href="#" className="underline text-[14px] md:text-[18px] text-inherit">BOOK AN APPOINTMENT</Link> */}
          </div>
        </section>

      </div>
    </div>
  );
}