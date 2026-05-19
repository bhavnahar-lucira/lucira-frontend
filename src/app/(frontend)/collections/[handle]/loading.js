import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="h-56 bg-[#FFF5F1] animate-pulse" />
      <div className="container-main py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 shrink-0 space-y-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-12 bg-gray-100 animate-pulse" />
            ))}
          </aside>
          <section className="flex-1">
            <div className="mb-6 h-10 w-full bg-gray-100 animate-pulse" />
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
