import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import Image from "next/image";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      {/* Desktop Banner Skeleton (matches actual banner) */}
      <div className="hidden md:block bg-[#FFF5F1] overflow-hidden">
        <div className="container-main flex flex-col md:flex-row items-center">
          <div className="flex-1 py-12">
            {/* Title Skeleton */}
            <div className="h-10 bg-gray-200/60 rounded animate-pulse w-3/4 mb-4"></div>
            {/* Description Skeleton */}
            <div className="h-4 bg-gray-200/60 rounded animate-pulse w-full mb-2"></div>
            <div className="h-4 bg-gray-200/60 rounded animate-pulse w-5/6 mb-8"></div>
            
            {/* Static Features (these don't change between collections) */}
            <div className="flex flex-wrap gap-6 text-xs md:text-sm font-medium">
              <div className="flex items-center gap-2">
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Group_f573cba5-716e-47c9-baeb-8303cf3ba2e8.png" alt="Shipping" width={20} height={20} className="md:w-6" unoptimized />
                <span>Free & secure shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/streamline_star-badge_1.png" alt="Certified" width={20} height={20} className="md:w-6" unoptimized />
                <span>100% value guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/hugeicons_delivery-return-01.png" alt="Return" width={20} height={20} className="md:w-6" unoptimized />
                <span>15-day free returns</span>
              </div>
            </div>
          </div>
          {/* Static Image */}
          <div className="flex-1 relative w-full h-[230px]">
            <Image 
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/category-banner-05062026.jpg" 
              alt="Loading" 
              fill 
              className="object-cover" 
              unoptimized 
            />
          </div>
        </div>
      </div>

      {/* Mobile Banner Skeleton */}
      <div className="md:hidden w-full relative h-40">
        <Image src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/category-banner-05062026.jpg" alt="Loading" fill className="object-cover" priority unoptimized />
        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
      </div>

      <div className="container-main py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 shrink-0 space-y-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </aside>
          <section className="flex-1">
            <div className="mb-6 h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
                <ProductCardSkeleton key={item} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
