"use client";

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full bg-gray-200" />

      {/* Info Skeleton */}
      <div className="flex flex-col gap-3 px-1">
        {/* Color Swatches Skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-gray-200" />
          ))}
        </div>

        {/* Title Skeleton */}
        <div className="h-6 bg-gray-200 rounded w-11/12" />

        {/* Rating Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-8" />
        </div>

        {/* Metadata Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-full" />

        {/* Offer Badge Skeleton */}
        <div className="h-6 bg-gray-100 rounded-full w-40" />

        {/* Price Skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
