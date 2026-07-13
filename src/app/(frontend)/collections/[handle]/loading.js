import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      {/* Neutral banner-shaped skeleton.
          loading.js can't read the route handle, so it cannot know whether this
          collection uses the default hero or a custom full-width banner. Showing a
          plain shimmer (instead of a specific "old" banner + Offer image) avoids the
          jarring flash of the wrong banner during client-side navigation. */}
      <div className="hidden md:block w-full aspect-[1920/720] bg-[#FFF5F1] animate-pulse" />
      <div className="md:hidden w-full aspect-[768/520] bg-[#FFF5F1] animate-pulse" />

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
