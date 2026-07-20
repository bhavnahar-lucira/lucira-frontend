import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero skeleton.
          loading.js can't read the route handle, so it can't tell a default-hero
          collection (jewelry, rings, earrings, …) from a custom full-width banner.
          We size the skeleton to the DEFAULT hero — that's the vast majority of
          collections and the one users land on most. Matching its real height keeps
          the pink banner colour confined to the hero (instead of filling the whole
          viewport) and removes the large upward content shift when the real page
          mounts. The split is at `lg` to line up with the page's isMobile
          (max-width: 1023px) breakpoint. */}

      {/* Desktop (lg+) default hero: pink band, title/features on the left, offer
          image on the right. The image placeholder uses the real image's 640×223
          aspect at half-container width, so the band height matches the real hero. */}
      <div className="hidden lg:block w-full bg-[#FFF5F1] overflow-hidden">
        <div className="container-main flex flex-row items-center">
          <div className="flex-1 space-y-4">
            <div className="h-9 w-56 bg-black/5 rounded animate-pulse" />
            <div className="flex flex-wrap gap-6">
              <div className="h-5 w-40 bg-black/5 rounded animate-pulse" />
              <div className="h-5 w-40 bg-black/5 rounded animate-pulse" />
              <div className="h-5 w-40 bg-black/5 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex-1">
            <div className="w-full aspect-[640/223] bg-black/5 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Mobile (<lg) default hero: breadcrumb line + full-width offer image. */}
      <div className="lg:hidden w-full">
        <div className="container-main pt-2 px-4 py-3">
          <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="w-full aspect-[768/480] bg-gray-100 animate-pulse" />
      </div>

      {/* Filters sidebar + product grid — mirrors the real collection layout. */}
      <div className="flex xl:gap-12 lg:gap-6 py-6 container-main mx-auto">
        <aside className="hidden lg:block xl:w-78 lg:w-60 shrink-0 space-y-5">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </aside>
        <section className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
              <ProductCardSkeleton key={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
