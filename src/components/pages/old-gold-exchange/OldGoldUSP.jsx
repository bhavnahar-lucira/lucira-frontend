"use client";

import LazyImage from "@/components/common/LazyImage";

export default function OldGoldUSP({ data }) {
  const { heading, subheading, features } = data;

  return (
    <section className="old-gold-usp py-10 bg-[#fef5f1]">
      <div className="container-main mx-auto px-4 max-w-[1200px]">

        <div className="text-center mb-16">
          <h2 className="text-[18px] md:text-[28px] font-abhaya font-semibold uppercase tracking-[2px] mb-3 text-primary">
            {heading}
          </h2>
          <p className="text-gray-600 text-[14px] md:text-[18px] max-w-[600px] mx-auto">
            {subheading}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="usp-card text-center flex flex-col items-center">
              <div className="icon-wrapper mb-6 w-20 h-20 relative">
                <LazyImage
                  src={feature.icon}
                  alt={feature.title}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-base md:text-lg font-semibold uppercase tracking-wider mb-3 text-[#1a1a1a]">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[250px]">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
