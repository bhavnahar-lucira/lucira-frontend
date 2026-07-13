"use client";

import Image from 'next/image';
import Link from 'next/link';
import shopifyLoader from '@/utils/shopifyLoader';
import { pushPromoClick } from '@/lib/gtm';

// Move data outside the component to prevent re-creation on every render
const SHAPES = [
  { name: 'Emerald', slug: 'solitaires-emerald', imgId: 'Emerald' },
  { name: 'Oval', slug: 'solitaires-oval', imgId: 'Oval' },
  { name: 'Cushion', slug: 'solitaires-cushion', imgId: 'Cushion' },
  { name: 'Round', slug: 'solitaire-round', imgId: 'Round' },
  { name: 'Princess', slug: 'solitaires-princess', imgId: 'Princess' },
  { name: 'Pear', slug: 'solitaires-pear', imgId: 'Pear' },
  { name: 'Marquise', slug: 'solitaires-marquise', imgId: 'Marquise' },
  { name: 'Heart', slug: 'solitaires-heart', imgId: 'Heart' },
];

export default function DiamondShapes() {
  const handleCutClick = (shape) => {
    pushPromoClick({
      creative_name: "Diamond cuts section homepage",
      location_id: "homepage",
      promo_id: shape.name,
      promo_name: shape.name,
    });
  };

  return (
    <section className="w-full bg-[#FEF5F1] py-12 md:py-14 mt-12 md:mt-15 overflow-hidden">
      <div className="container-main">
        <div className="text-left lg:text-center mb-10 px-1 lg:px-0">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Explore Our Diamond Cuts
          </h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">
            Where Geometry Elevates Style
          </p>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-y-10 gap-x-4">
          {SHAPES.map((shape) => (
            <Link prefetch={false}
              key={shape.slug}
              href={`/collections/${shape.slug}`}
              onClick={() => handleCutClick(shape)}
              className="group flex flex-col items-center"
            >
              <div className="w-14 md:w-full lg:w-18 relative aspect-square max-w-24 mb-4">
                <Image
                  loader={shopifyLoader}
                  src={`https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_diamondCuts_${shape.imgId}.png`}
                  alt={`${shape.name} cut diamond shape`}
                  fill
                  sizes="(max-width: 768px) 80px, 100px"
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              
              <span className="text-xs font-semibold text-black uppercase tracking-widest text-center">
                {shape.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
