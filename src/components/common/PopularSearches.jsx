"use client";

import React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const SEARCH_DATA = [
  {
    title: "Visit our stores:",
    links: [
      { label: "Lab Grown Diamond Jewellery in Pune", href: "https://www.lucirajewelry.com/collections/pune-store" },
      { label: "Lab Grown Diamond in Noida", href: "https://www.lucirajewelry.com/collections/noida-store" },
      { label: "Lab Grown Diamonds in Borivali", href: "https://www.lucirajewelry.com/collections/sky-city-borivali-store" },
      { label: "Lab Grown Diamond Jewellery in Chembur", href: "https://www.lucirajewelry.com/collections/chembur-store" },
      { label: "Lab Grown Diamond Jewellery in Mumbai", href: "https://www.lucirajewelry.com/collections/lab-grown-diamonds-in-mumbai" },
    ],
  },
  {
    title: "Rings",
    links: [
      { label: "Lab Grown Diamond Engagement Rings", href: "/collections/engagement-rings" },
      { label: "Diamond Engagement Rings for Women", href: "/collections/engagement-rings-for-women" },
      { label: "Mens Engagement Rings", href: "/collections/mens-engagement-rings" },
      { label: "Lab Grown Men’s Diamond Rings", href: "/collections/mens-rings" },
    ],
  },
  {
    title: "By Cut",
    links: [
      { label: "Halo Rings", href: "/collections/halo-engagement-rings" },
      { label: "Side Stone Rings", href: "/collections/side-stone-engagement-rings" },
      { label: "Stacking Rings", href: "/collections/stackable-rings" },
      { label: "Oval Cut Engagement Rings", href: "/collections/engagement-rings-oval" },
      { label: "Pear Shaped Diamond Ring", href: "/collections/pear-rings" },
      { label: "Heart Shaped Diamond Ring", href: "/collections/heart-rings" },
      { label: "Cushion Cut Diamond Ring", href: "/collections/cushion-rings" },
    ],
  },
  {
    title: "By Price",
    links: [
      { label: "Lab Grown Diamond Rings Under ₹50K", href: "/collections/engagement-rings-below-rs-50k" },
      { label: "Lab Grown Diamond Ring Under 1 Lakh", href: "/collections/engagement-rings-between-rs-50k-to-rs-100k" },
      { label: "1 Carat Diamond Ring", href: "/collections/1-carat-lab-grown-diamond-price-in-india" },
      { label: "Diamond Ring Under 20000", href: "/collections/rings-between-rs-10k-to-rs-20k" },
      { label: "Diamond Cocktail Rings", href: "/collections/cocktail-rings-diamond" },
      { label: "Diamond Gemstone Ring", href: "/collections/gemstone-rings" },
      { label: "Diamond Couple Rings & Bands", href: "/collections/couple-bands" },
      { label: "Emerald Cut Diamond Ring", href: "/collections/emerald-cut-diamond-earrings" },
      { label: "Platinum Rings for Couples", href: "/collections/platinum-rings" },
    ],
  },
  {
    title: "Wedding Rings",
    links: [
      { label: "Diamond Wedding Rings", href: "/collections/wedding-rings" },
      { label: "Eternity Wedding Rings", href: "/collections/eternity-wedding-rings" },
      { label: "Stackable Wedding Rings", href: "/collections/stackable-wedding-rings" },
      { label: "Gemstone Wedding Rings", href: "/collections/gemstone-wedding-rings" },
      { label: "Women's Wedding Rings", href: "/collections/womens-wedding-rings" },
      { label: "Men's Wedding Rings", href: "/collections/mens-wedding-rings" },
      { label: "Wedding Rings Under ₹50K", href: "/collections/wedding-rings-below-rs-50k" },
      { label: "Wedding Rings Under 1 Lakh", href: "/collections/wedding-rings-between-rs-50k-to-rs-100k" },
    ],
  },
  {
    title: "Solitaire",
    links: [
      { label: "Solitaire Engagement Rings", href: "/collections/solitaire-engagement-rings" },
      { label: "Lab Grown Solitaire Diamond Ring", href: "/collections/solitaire-rings" },
      { label: "Solitaire Earrings", href: "/collections/solitaire-earrings" },
      { label: "Solitaire Pendants", href: "/collections/solitaires-pendants" },
      { label: "Solitaire Bracelets", href: "/collections/solitaires-bracelets" },
      { label: "Solitaire Necklaces", href: "/collections/solitaires-necklaces" },
      { label: "Solitaire Chain Pendants", href: "/collections/solitaires-chain-pendants" },
    ],
  },
  {
    title: "Earrings",
    links: [
      { label: "Lab Grown Diamond Earrings", href: "/collections/earrings" },
      { label: "Lab Grown Diamond Stud Earrings", href: "/collections/stud-earrings" },
      { label: "Diamond Studs For Men", href: "/collections/mens-stud" },
      { label: "Diamond Earrings For Men", href: "/collections/earrings-for-men" },
      { label: "Diamond Hoop Earrings", href: "/collections/diamond-hoop-earrings" },
      { label: "Lab Grown Dangle Earrings", href: "/collections/dangles" },
    ],
  },
  {
    title: "Necklaces & Bracelets",
    links: [
      { label: "Diamond Tennis Bracelet", href: "/collections/diamond-tennis-bracelets" },
      { label: "Lab Grown Diamond Necklace", href: "/collections/necklaces" },
      { label: "Pendants For Women", href: "/collections/pendant-necklaces" },
      { label: "Diamond Bracelet", href: "/collections/bracelets" },
      { label: "Mens Diamond Tennis Bracelet", href: "/collections/mens-bracelets" },
      { label: "Diamond Bracelet For Women", href: "/collections/diamond-bracelet-for-women" },
      { label: "Lab Grown Solitaire Bracelet", href: "/collections/solitaires-bracelets" },
    ],
  },
  {
    title: "Mangalsutra",
    links: [
      { label: "Diamond Mangalsutra Design", href: "/collections/mangalsutra-design" },
      { label: "Lab Grown Diamond Mangalsutra", href: "/collections/diamond-mangalsutra" },
      { label: "Lucira Jewelry", href: "https://lucirajewelry.com/" },
    ],
  },
];

export default function PopularSearches() {
  const isMobile = useMediaQuery("(max-width: 1024px)");

  return (
    <div className="w-full bg-white pb-12 lg:pb-16 lg:pt-4 pt-2">
      <div className="container-main">
        <h2 className="text-lg lg:text-2xl font-bold font-abhaya text-zinc-900 mb-6 lg:mb-8 pb-4 border-b border-zinc-100 tracking-tight uppercase">
          Popular Searches
        </h2>

        {isMobile ? (
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {SEARCH_DATA.map((section, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-gray-200">
                <AccordionTrigger className="font-abhaya text-sm font-bold py-4 hover:no-underline text-primary">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-4">
                    {section.links.map((link, lIdx) => (
                      <React.Fragment key={lIdx}>
                        <Link
                          href={link.href}
                          className="font-figtree text-xs text-gray-600 hover:text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                        {lIdx < section.links.length - 1 && (
                          <span className="text-gray-300">|</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col gap-6 lg:gap-8">
            {SEARCH_DATA.map((section, idx) => (
              <div key={idx} className="search-section">
                <h3 className="font-abhaya text-base font-bold text-primary mb-2">
                  {section.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {section.links.map((link, lIdx) => (
                    <React.Fragment key={lIdx}>
                      <Link
                        href={link.href}
                        className="font-figtree text-sm text-gray-600 hover:text-primary transition-colors leading-normal"
                      >
                        {link.label}
                      </Link>
                      {lIdx < section.links.length - 1 && (
                        <span className="text-gray-300 text-xs">|</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
