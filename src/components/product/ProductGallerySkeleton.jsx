"use client";

export default function ProductGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sticky top-5 animate-pulse w-full">
      {/* Skeleton for 6 items (similar to typical gallery) */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div 
          key={i}
          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          {/* Tag Skeletons for the first item */}
          {i === 1 && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-gray-200 h-6 w-20 rounded-sm" />
              <div className="bg-gray-200 h-6 w-24 rounded-sm" />
            </div>
          )}
          
          {/* Placeholder for video icon or "Similar items" button */}
          {i === 2 && (
            <div className="absolute bottom-4 left-4 bg-gray-200 w-8 h-8 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
}
