"use client";

// Mirrors ProductCard row for row, at the same heights, so the grid does not
// jump when the real cards land: image, then price, title, the deals row (one
// pill: the offer, or the overall % OFF) and the Try At Home / video-call row.
// No swatch or rating rows — the card dropped the swatches, and the rating now
// sits on the image.
export default function ProductCardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      {/* Image */}
      <div className="aspect-square w-full bg-gray-200 rounded-sm" />

      <div className="@container flex flex-col gap-1.5 px-1">
        {/* Price and compare-at price */}
        <div className="flex items-center gap-2 h-6 lg:h-7">
          <div className="h-5 lg:h-6 w-20 lg:w-24 bg-gray-200 rounded" />
          <div className="h-4 lg:h-5 w-14 lg:w-16 bg-gray-100 rounded" />
        </div>

        {/* Title — one line */}
        <div className="h-4 lg:h-5 w-4/5 bg-gray-200 rounded my-0.5" />

        {/* Deals row: one pill (the offer, or the overall % OFF), sized by the
            card's width as on ProductCard */}
        <div className="flex items-center mt-1">
          <div className="h-[22px] @[13rem]:h-6 @[19rem]:h-7 w-28 @[13rem]:w-36 @[19rem]:w-44 bg-gray-100 rounded-full" />
        </div>

        {/* Try At Home + video call */}
        <div className="flex items-stretch gap-2 mt-2.5">
          <div className="flex-1 h-10 lg:h-11 bg-gray-100 rounded-sm" />
          <div className="w-11 h-10 lg:h-11 bg-gray-100 rounded-sm shrink-0" />
        </div>
      </div>
    </div>
  );
}
