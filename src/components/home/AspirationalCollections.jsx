"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import shopifyLoader from "@/utils/shopifyLoader";
import { pushPromoClick } from "@/lib/gtm";

// Eterna is a 1:1 crop and the other two are 1200x580, so on desktop two stacked
// wide cards plus the gap land level with Eterna's square in a 50/50 grid. The
// stretch flag closes the few px that the fixed gap leaves over at wide viewports.
const ETERNA = {
  id: "eterna",
  href: "/collections/eterna",
  image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Eterna_jpg.jpg?v=1786516956",
  alt: "Eterna - Embrace Who You Are",
  width: 1200,
  height: 1200,
};

const HEXA = {
  id: "hexa",
  href: "/collections/hexa",
  image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Hexa_jpg_8ecd3784-feb4-43aa-8b2c-4b765dd201fd.jpg?v=1786516955",
  alt: "Hexa Cut - An ode to transformation",
  width: 1200,
  height: 580,
};

const PORTUGUESE = {
  id: "portuguese",
  href: "/collections/portuguese",
  image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Portuguese_jpg.jpg?v=1786516955",
  alt: "Portuguese - 3x facets, 3x sparkle",
  width: 1200,
  height: 580,
};

const CARD_SIZES = "(max-width: 1024px) 100vw, 50vw";

export default function AspirationalCollections() {
  const sectionRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  // The section sits just below the first fold on every breakpoint, so the cards
  // rise into place as the shopper scrolls down to them.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    // Trigger at 85% of the viewport height: the cards animate while rising into
    // the screen rather than when the section is still a sliver at the bottom edge.
    const isPastTriggerLine = () =>
      node.getBoundingClientRect().top <= window.innerHeight * 0.85;

    if (isPastTriggerLine()) {
      setRevealed(true);
      return;
    }

    // A plain passive listener, not IntersectionObserver: the cards start hidden,
    // so a callback that never arrives would leave the section blank. This can
    // only fail closed - if it is scrollable, it reveals.
    const onScroll = () => {
      if (!isPastTriggerLine()) return;
      setRevealed(true);
      window.removeEventListener("scroll", onScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="w-full pt-1 lg:pt-5 bg-white overflow-hidden">
      <div className="container-main">
        {/* Same heading block as Explore Our Range / Diamond Cuts / Shop By Occasion */}
        <div className="text-left lg:text-center mb-6 px-1 lg:px-0">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Collections You’ll Love
          </h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">
            Pick a collection. Your next obsession awaits.
          </p>
        </div>

        <div className="grid gap-3 lg:gap-4 lg:grid-cols-2">
          {/* Eterna fills the left half and sets the row height */}
          <AspirationCard card={ETERNA} revealed={revealed} order={0} />

          {/* Hexa over Portuguese in the right half, stretched to match Eterna */}
          <div className="grid gap-3 lg:gap-4 lg:grid-rows-2">
            <AspirationCard card={HEXA} revealed={revealed} order={1} stretch />
            <AspirationCard card={PORTUGUESE} revealed={revealed} order={2} stretch />
          </div>
        </div>
      </div>
    </section>
  );
}

function AspirationCard({ card, revealed, order, stretch = false }) {
  const handleClick = () => {
    pushPromoClick({
      creative_name: "aspirational section homepage",
      location_id: "homepage",
      // Which of the three banners was clicked: eterna | hexa | portuguese
      promo_id: card.id,
    });
  };

  return (
    <Link
      prefetch={false}
      href={card.href}
      onClick={handleClick}
      // Cards land one after another rather than all at once
      style={{ transitionDelay: `${order * 90}ms` }}
      className={[
        "block overflow-hidden rounded-card bg-gray-50",
        "transition duration-700 ease-out motion-reduce:transition-none",
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        "motion-reduce:opacity-100 motion-reduce:translate-y-0",
        stretch ? "lg:h-full" : "",
      ].join(" ")}
    >
      <Image
        loader={shopifyLoader}
        src={card.image}
        alt={card.alt}
        width={card.width}
        height={card.height}
        loading="lazy"
        className={`w-full h-auto object-cover object-center ${stretch ? "lg:h-full" : ""}`}
        sizes={CARD_SIZES}
        draggable={false}
      />
    </Link>
  );
}
