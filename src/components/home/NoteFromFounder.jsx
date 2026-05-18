"use client";

import LazyImage from "../common/LazyImage";

export default function NoteFromFounder() {
  return (
    <section className="w-full mt-15 bg-white overflow-hidden">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 bg-[#FAF5F2] shadow-sm rounded-sm overflow-hidden min-h-112.5">
          {/* Left Column: Image */}
          <div className="relative aspect-4/3 md:aspect-auto">
            <LazyImage
              src="/images/founder.jpg" // Using existing founder placeholder image
              alt="Rupesh Jain - Founder & CEO"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Right Column: Text Content */}
          <div className="p-8 md:p-12 lg:p-20 flex flex-col justify-center relative bg-[#FAF5F2]">
            <h2 className="text-3xl md:text-4xl font-extrabold font-abhaya mb-6 text-black">A Note from Our Founder</h2>
            
            <p className="text-sm md:text-base lg:text-lg text-black mb-3 italic font-normal">"Jewelry runs in my blood—it's who I am. After building brands in India, I created Lucira to go beyond tradition and craft pieces that reflect elegance and meaning. For me, jewelry isn’t just adornment—it’s a celebration of moments, love, and legacy. Every piece we make is a promise."</p>

            <div className="flex flex-col">
              <span className="text-base font-bold text-black">-Rupesh Jain</span>
              <span className="text-sm text-gray-500 font-medium mt-1">
                Founder & CEO
              </span>
            </div>

            {/* Signature Image */}
            <div className="absolute bottom-2 right-6 xl:bottom-12 xl:right-16 opacity-90">
               <LazyImage 
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_3146.png" 
                alt="Rupesh Jain Signature" 
                width={70} 
                height={90} 
                className="object-contain"
               />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
