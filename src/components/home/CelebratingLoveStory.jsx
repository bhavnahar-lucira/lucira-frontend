"use client";

import LazyImage from "../common/LazyImage";

const ITEMS = [
  "/images/product/1.jpg",
  "/images/product/2.jpg",
  "/images/product/3.jpg",
  "/images/product/4.jpg",
  "/images/product/5.jpg",
  "/images/product/6.jpg",
];

export default function CelebratingLoveStory() {
  return (
    <section className="w-full py-16 bg-white overflow-hidden">
      <div className="max-w-480 mx-auto px-6 md:px-17 text-center mb-12">
         <h2 className="text-3xl md:text-4xl font-medium mb-3">Celebrating Your Love Story, with Lucira</h2>
         <p className="text-gray-500">Real stories from our beloved community.</p>
      </div>

      <div className="max-w-480 mx-auto px-6 md:px-17">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {ITEMS.map((img, index) => (
            <div key={index} className="relative overflow-hidden rounded-sm group">
              <LazyImage 
                src={img} 
                alt={`Love Story ${index + 1}`} 
                width={400} 
                height={500} 
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
