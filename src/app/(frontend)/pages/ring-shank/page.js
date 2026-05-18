"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Rating Circle Component
const RatingCircle = ({ rating, label }) => {
  const [isVisible, setIsVisible] = useState(false);
  const circleRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    if (circleRef.current) {
      observer.observe(circleRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const total = 251; // length of stroke dash array
  const offset = isVisible ? total - (rating / 5) * total : total;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-[90px] h-[90px] flex items-center justify-center mx-auto"
        ref={circleRef}
      >
        <svg width="90" height="90" className="-rotate-90">
          {/* Background circle */}
          <circle cx="45" cy="45" r="40" className="fill-none stroke-[#e6e6e6] stroke-[7]" />
          {/* Progress circle */}
          <circle
            cx="45"
            cy="45"
            r="40"
            className="fill-none stroke-[#666] stroke-[7] transition-all duration-[1200ms] ease-out"
            style={{ strokeDasharray: total, strokeDashoffset: offset }}
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-bold text-[22px] md:text-[24px] text-[#444]">
          {rating}
          <span className="block text-[9px] text-[#999] font-normal leading-none mt-1 uppercase tracking-wider">out of 5</span>
        </div>
      </div>
      {label && (
        <span className="text-[13px] md:text-[14px] text-center text-[#555] w-full max-w-[110px] leading-snug">
          {label}
        </span>
      )}
    </div>
  );
};

// Section Component
const RingSection = ({ item, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const isReverse = index % 2 !== 0;

  return (
    <section
      ref={sectionRef}
      className={`grid grid-cols-1 md:grid-cols-2 items-center gap-10 lg:gap-24 max-w-[1300px] mx-auto my-8 md:my-16 px-6 md:px-10 transition-all duration-[800ms] ease-in-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[40px]"
        }`}
    >
      {/* Image Block */}
      <div className={`w-full flex justify-center ${isReverse ? "md:order-last" : ""}`}>
        <Link href={item.url || "#"} className="cursor-pointer block relative w-full">
          <img
            src={item.img}
            alt={item.title}
            className="w-full max-w-[500px] mx-auto object-contain hover:scale-[1.03] transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Content Block */}
      <div className="w-full flex flex-col justify-center text-center font-figtree items-center mx-auto">
        <h2 className="font-abhaya text-[26px] md:text-[36px] tracking-wide uppercase mb-4 text-[#222]">
          {item.title}
        </h2>
        <p className="text-[15px] md:text-[18px] leading-relaxed mb-6 md:mb-10 text-[#666] w-full max-w-[700px]">
          {item.text}
        </p>

        {/* Rating Circles */}
        <div className="w-full">
          <h3 className="uppercase tracking-[0.1em] text-[#333] mb-6 md:mb-8 font-medium text-[16px] md:text-[18px]">
            RECOMMENDED FOR
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:justify-center gap-x-4 gap-y-8 md:gap-6 lg:gap-[40px] items-start">
            {item.ratings.map((r, i) => {
              const labels = ["Bridal / Engagement", "Everyday Wear", "Statement / Occasion", "Fashion / Modern"];
              return <RatingCircle key={i} rating={r} label={labels[i]} />;
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default function RingShankPage() {
  const defaultImg = "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_1601.png?v=1773148414";

  const blocks = [
    {
      title: "ETERNITY",
      text: "Diamonds encircle the entire band, symbolizing everlasting love. This shank offers uninterrupted sparkle from every angle and makes a striking, premium statement.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_1599.png?v=1773148391",
      url: "/products/diamond-eternity-wedding-band?variant=46552455250138",
      ratings: [4.9, 3.8, 4.6, 3.9]
    },
    {
      title: "HALF ETERNITY",
      text: "Diamonds adorn the top half of the band, delivering sparkle where it matters most. Comfortable for daily wear while retaining the elegance of an eternity style.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_1601.png?v=1773148414",
      url: "/products/0-59ct-round-half-eternity-diamond-band",
      ratings: [4.6, 4.5, 4.2, 3.9]
    },
    {
      title: "BYPASS",
      text: "A modern shank where the band gracefully curves around the center stone. Fluid, dynamic, and contemporary, this design adds movement and visual interest.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Bypass.png?v=1767940139",
      url: "/products/round-cut-bypass-solitaire-engagement-ring",
      ratings: [3.8, 4.0, 4.5, 4.6]
    },
    {
      title: "CRISS CROSS",
      text: "Intertwining bands cross over each other, creating a layered, dimensional look. This shank style adds texture, depth, and a fashionable edge to the ring.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Criss_Cross.png?v=1773295494",
      url: "/products/round-and-baguette-diamond-halo-ring?variant=46442413752538",
      ratings: [3.6, 4.5, 4.5, 4.7]
    },
    {
      title: "FREEFORM",
      text: "An artistic shank with an organic, asymmetrical flow. Designed for those who love unique, expressive jewelry that breaks away from traditional ring structures.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Freeform_20Female.png?v=1768542640",
      url: "/products/two-tone-marquise-and-round-diamond-wave-ring",
      ratings: [2.8, 4.5, 4.6, 4.9]
    },
    {
      title: "TWISTED",
      text: "Bands twist together elegantly, symbolizing unity and connection. This shank adds dimension and softness while maintaining a refined, graceful appearance.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Twisted_787198cb-a014-401a-8629-be21242b336a.png?v=1773295582",
      url: "/products/emerald-cut-twisted-solitaire-engagement-ring",
      ratings: [4.4, 4.3, 4.1, 4.2]
    },
    {
      title: "EURO",
      text: "A flat-edged shank designed to prevent spinning and enhance comfort. Practical and sleek, it offers a secure fit with a contemporary European-inspired profile.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Euro.png?v=1767940324",
      url: "/products/signature-euro-solitaire-mens-ring?variant=46895859794138",
      ratings: [4.0, 4.8, 3.6, 3.8]
    },
    {
      title: "REVERSE TAPERED",
      text: "A pure and timeless choice that centers attention completely on the main diamond. Ideal for those who value tradition and elegant simplicity.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_1600.png?v=1773148503",
      url: "/products/0-25-cts-classic-solitaire-diamond-ring",
      ratings: [4.5, 4.6, 4.2, 4.0]
    },
    {
      title: "STRAIGHT",
      text: "A clean, uniform-width band that delivers timeless appeal. Minimal and versatile, this shank pairs effortlessly with any stone shape or setting style.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Straight_f11a4b2d-2f7e-42b8-ac1e-26e3f49af3d8.png?v=1773295680",
      url: "/products/round-solitaire-engagement-ring-6-50-mm?variant=46346903519450",
      ratings: [4.2, 4.7, 3.8, 4.0]
    },
    {
      title: "TRADITIONAL",
      text: "A classic, gently rounded shank that never goes out of style. Designed for comfort and longevity, it’s perfect for everyday wear and heirloom designs.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Traditional_192073ed-1b9b-4d35-bae0-0967da200388.png?v=1773295785",
      url: "/products/elegant-round-center-stone-ring-with-diamond-shoulders?variant=46349320323290",
      ratings: [4.8, 4.6, 3.9, 3.7]
    },
    {
      title: "SPLIT",
      text: "The band divides into two or more strands near the center stone, adding openness and drama. A striking design that enhances sparkle and visual width.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Split.png?v=1767940403",
      url: "/products/oval-halo-split-shank-engagement-ring",
      ratings: [4.3, 3.7, 4.8, 4.4]
    },
    {
      title: "CATHEDRAL",
      text: "Arched shoulders rise to support the center stone, offering height and grandeur. A regal, architectural design that adds drama and timeless sophistication.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cathedral_ea80b1c7-2009-4fa1-b169-7d1e646d3d4c.png?v=1773295946",
      url: "/products/classic-round-diamond-ring",
      ratings: [4.9, 3.7, 4.6, 3.6]
    },
    {
      title: "KNIFE EDGE",
      text: "A sharp, defined ridge runs along the center of the band for a sleek profile. This shank offers a modern, structured look with subtle brilliance.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Knife_Edge.png?v=1773296008",
      url: "/products/round-cut-diamond-engagement-ring?variant=46349324583130",
      ratings: [4.3, 4.5, 4.0, 4.2]
    },
    {
      title: "TAPERED",
      text: "The shank gently narrows as it approaches the center stone, making it appear larger and more prominent. A refined design that naturally draws attention.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Normal_20Tapered.png?v=1767940533",
      url: "/products/the-everlasting-round-diamond-ring?variant=46896090153178",
      ratings: [4.7, 4.2, 4.1, 3.9]
    },
    {
      title: "BANDS",
      text: "A versatile, minimalist design crafted for everyday comfort and timeless appeal. Whether plain or accented with diamonds, bands offer effortless elegance and lasting style.",
      img: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Bands_20Female.png?v=1768542639",
      url: "/products/the-horizon-diamond-ring",
      ratings: [4.3, 4.9, 3.6, 4.0]
    }
  ];

  return (
    <div className="w-full bg-white font-figtree">
      {/* BANNER SECTION */}
      <section className="relative w-full h-[535px] md:h-[605px] flex items-end justify-center bg-cover bg-center bg-no-repeat bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Ring_20Shank_20Mobile_20Banner.png?v=1767938372')] md:bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Ring_20Shank_20Banner.png?v=1767938373')]">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        {/* Content */}
        <div className="relative z-20 text-center text-white p-5 mb-[20px]">
          <h2 className="font-abhaya text-[28px] font-medium leading-tight mb-2">
            Types of Ring Shanks
          </h2>
          <p className="text-[18px]">
            Discover how different shank designs shape comfort and fit.
          </p>
        </div>
      </section>

      {/* BLOCKS SECTION */}
      <div className="w-full py-2 overflow-hidden">
        {blocks.map((item, index) => (
          <RingSection key={index} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}