"use client";

/**
 * CategoryCarousel — a premium, mobile-only "shop by …" row for the PLP.
 *
 * The PLP renders ONE carousel per menu group that exists for the current
 * collection's category (e.g. "Shop By Style", "Shop By Shape", "Gifts",
 * "Shop For"), distributed individually through the product grid. Categories
 * whose menu has no such groups get none.
 *
 * The groups (heading + image tiles) are built on the server by
 * `buildCategoryGroups` in lib/categoryGroups.js and passed to the page as a
 * prop. This component renders a single group. It must not import the menu:
 * that would pull the 811 KB menu JSON into the browser bundle.
 */

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { pushPromoClick } from "@/lib/gtm";

export default function CategoryCarousel({ heading, tiles }) {
  const pathname = usePathname();

  if (!tiles?.length) return null;

  return (
    <section className="rounded-[14px] bg-gradient-to-b from-[#FBF1F1] to-[#F7ECEC] px-4 pb-4 pt-4">
      <h3 className="mb-3 font-figtree text-[13px] font-semibold uppercase tracking-[0.08em] text-[#3d2a1e]">
        {heading}
      </h3>

      <div
        className="flex snap-x gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tiles.map((t) => (
          <Link
            key={t.handle}
            href={t.href}
            prefetch={false}
            onClick={() => {
              pushPromoClick({
                creative_name: `Plp Mobile - ${heading} Carousel`,
                location_id: pathname,
                promo_id: t.handle,
                promo_name: t.title,
              });
            }}
            className="w-[142px] shrink-0 snap-start overflow-hidden rounded-[8px] bg-white/70 shadow-[0_2px_10px_rgba(90,65,63,0.08)] transition-transform active:scale-[0.98]"
          >
            {/* Image plate — a skewed box behind + a bordered card in front */}
            <div className="p-5 pb-2">
              <div className="relative">
                {/* skewed box on the back */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -rotate-[6deg] rounded-[8px] border border-[#D8BBB4] bg-[#FBF1F1]"
                />
                {/* bordered card in front */}
                <div className="relative rounded-[8px] border border-[#E7D5D1] bg-white px-6 pb-[38px] pt-[18px]">
                  <div className="relative aspect-square">
                    <Image
                      src={t.image}
                      alt={t.title}
                      fill
                      sizes="142px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  {t.count > 0 && (
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#f4f0f0] px-2.5 py-1 text-[10px] font-semibold text-[#5A413F] shadow-sm">
                      {t.count}+ Designs
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Name bar */}
            <div className="mt-2.5 bg-[#5A413F] px-3 py-2.5">
              <p className="truncate text-center font-figtree text-xs font-semibold text-white">
                {t.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
