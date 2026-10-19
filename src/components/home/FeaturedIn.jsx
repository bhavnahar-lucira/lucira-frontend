"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Homepage "Featured In".
//
// A press video sits on the left (395x222 on desktop, 343x193 full-width on
// mobile) with two rows of media logos scrolling past it in opposite
// directions. The video follows the same desktop/mobile media shape the hero
// and promotional banners use — desktopVideo / mobileVideo with optional
// posters — so swapping the asset later is a one-line change.
//
// The section sits well below the first fold, so the video must not compete
// with the hero for bandwidth: like the styled-video cards, it gets no src
// until it is about to scroll into view, is never preloaded, and pauses once
// it leaves the viewport. Only one <video> is rendered per breakpoint so the
// file is fetched once, not twice.
const MEDIA = {
  desktopVideo: "https://cdn.shopify.com/videos/c/o/v/c600c8a6f2f840068164fd2a5d4d6213.mp4",
  mobileVideo: "https://cdn.shopify.com/videos/c/o/v/c600c8a6f2f840068164fd2a5d4d6213.mp4",
  desktopPoster: "",
  mobilePoster: "",
  alt: "Lucira featured in the media",
};

const LOGOS = [
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

// Two rows, each starting from a different point in the list so the same
// logo is never stacked above itself.
const ROW_ONE = LOGOS;
const ROW_TWO = [...LOGOS.slice(5), ...LOGOS.slice(0, 5)];

function LogoRow({ logos, direction, rowKey }) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Gradient overlays */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-10 md:w-20 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 md:w-20 bg-gradient-to-l from-white to-transparent z-10" />

      <Marquee
        speed={40}
        direction={direction}
        pauseOnHover={true}
        gradient={false}
        autoFill={true}
      >
        {logos.map((logo, index) => (
          <div className="px-5 md:px-8" key={`${rowKey}-${index}`}>
            <Link prefetch={false} href={logo.url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={logo.image}
                alt={logo.alt}
                loading="lazy"
                className="max-w-[110px] h-11 md:max-w-[130px] md:h-[52px] object-contain"
              />
            </Link>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

function FeaturedVideo() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const videoRef = useRef(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const desktopVideoSrc = MEDIA.desktopVideo;
  const mobileVideoSrc = MEDIA.mobileVideo || desktopVideoSrc;
  const desktopPoster = MEDIA.desktopPoster || "";
  const mobilePoster = MEDIA.mobilePoster || desktopPoster || "";

  const videoSrc = isDesktop ? desktopVideoSrc : mobileVideoSrc;
  const poster = isDesktop ? desktopPoster : mobilePoster;

  // Start fetching a little before the section is actually on screen so the
  // first frame is ready by the time the shopper scrolls to it.
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasBeenInView(true);
        } else {
          setIsInView(false);
          node.pause();
        }
      },
      { threshold: 0.1, rootMargin: "200px 0px" }
    );

    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  useEffect(() => {
    if (isInView && hasBeenInView && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked by the browser; the poster stays visible.
      });
    }
  }, [isInView, hasBeenInView, videoSrc]);

  return (
    <div className="relative w-full md:w-[395px] md:shrink-0 overflow-hidden rounded-md bg-black/5 aspect-[343/193] md:aspect-[395/222]">
      <video
        ref={videoRef}
        // Only set src once the section has been in view so the file is not
        // downloaded on page load; keep it afterwards to avoid re-fetching.
        src={hasBeenInView ? videoSrc : null}
        poster={poster || undefined}
        aria-label={MEDIA.alt}
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover object-center block"
      />
    </div>
  );
}

export default function FeaturedIn() {
  return (
    <section className="featured-in-section bg-white overflow-hidden py-8 md:py-12">
      <div className="text-center mb-8 md:mb-10 px-4">
        <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">Featured In</h2>
        <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">Trusted by Leading Brands and Media</p>
      </div>

      <div className="container-main">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          <FeaturedVideo />

          <div className="flex flex-col gap-4 md:gap-6 w-full min-w-0">
            <LogoRow logos={ROW_ONE} direction="left" rowKey="row-1" />
            <LogoRow logos={ROW_TWO} direction="right" rowKey="row-2" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .font-abhaya { font-family: var(--font-abhaya), serif; }
        .font-figtree { font-family: var(--font-figtree), sans-serif; }
      `}</style>
    </section>
  );
}
