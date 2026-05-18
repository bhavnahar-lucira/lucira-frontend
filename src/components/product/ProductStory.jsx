"use client";

import Image from "next/image";

export default function ProductStory({ description }) {
  if (!description) return null;

  return (
    <section className="w-full py-15">
      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17 grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT CONTENT */}
        <div className="space-y-9">
          <h2 className="text-28px font-bold">
            Story Behind The Product
          </h2>

          <div 
            className="space-y-5 product-story-content"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative w-full h-70 lg:h-80 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src="/images/story-ring.jpg"
            alt="Story Behind Product"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
