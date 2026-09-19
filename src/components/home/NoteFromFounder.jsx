"use client";

import LazyImage from "../common/LazyImage";

export default function NoteFromFounder() {
  return (
    <section className="w-full my-10 md:my-16 bg-[#FAF5F0] overflow-hidden">
      <div className="container-main py-8 sm:py-10 md:py-12 lg:py-14 xl:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12 xl:gap-16 items-center">
          {/* Left: Founder Portrait Image */}
          <div className="md:col-span-5 flex justify-center md:justify-end">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] aspect-[4/4.8] overflow-hidden bg-white/40">
              <LazyImage
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/rupesh-jain.jpg?v=1789814650"
                alt="Rupesh Jain - Founder & CEO"
                fill
                sizes="(max-width: 768px) 90vw, 40vw"
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Right: Content */}
          <div className="md:col-span-7 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-abhaya mb-4 lg:mb-6 text-black tracking-tight">
              A Note from Our Founder
            </h2>

            <p className="font-figtree font-normal italic text-[14px] leading-[160%] tracking-normal align-middle text-neutral-800 mb-[12px]" style={{ fontSize: "14px", marginBottom: "12px" }}>
              &ldquo;Jewelry runs in my blood, it&apos;s who I am. After building brands in India, I created Lucira to go beyond tradition and craft pieces that reflect elegance and meaning. For me, jewelry isn&apos;t just adornment, it&apos;s a celebration of moments, love, and legacy. Every piece we make is a promise.&rdquo;
            </p>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-figtree font-semibold text-[1rem] leading-[161%] tracking-normal align-middle text-black">
                  -Rupesh Jain
                </span>
                <span className="font-figtree font-medium text-[0.875rem] leading-[161%] tracking-normal align-middle text-[#858585] mt-0.5">
                  Founder &amp; CEO
                </span>
              </div>

              {/* Signature Image */}
              <div className="relative w-24 sm:w-28 md:w-32 lg:w-36 h-16 sm:h-20 md:h-24 lg:h-28 shrink-0">
                <LazyImage
                  src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/image_3146.png"
                  alt="Rupesh Jain Signature"
                  fill
                  className="object-contain object-right"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
