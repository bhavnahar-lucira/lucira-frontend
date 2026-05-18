"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";

export default function OurProcess() {
  const steps = [
    {
      title: "Ideation & Sketching",
      desc: "We shape the initial design concept.",
      img: "/images/process/IdeationSketching.jpg",
    },
    {
      title: "3D Designing",
      desc: "Digital model is created in 3D.",
      img: "/images/process/3DDesigning.jpg",
    },
    {
      title: "Modeling & Casting",
      desc: "Metal is cast into the base form.",
      img: "/images/process/ModelingCasting.jpg",
    },
    {
      title: "Filing & Polishing",
      desc: "Piece is refined and polished smooth.",
      img: "/images/process/FilingPolishing.jpg",
    },
    {
      title: "Diamond Setting",
      desc: "Stones are carefully set by hand.",
      img: "/images/process/DiamondSetting.jpg",
    },
    {
      title: "Quality Check",
      desc: "Each piece is thoroughly inspected.",
      img: "/images/process/QualityCheck.jpg",
    },
    {
      title: "Packaging",
      desc: "Packed securely for a premium unboxing.",
      img: "/images/process/Packaging.jpg",
    },
  ];

  return (
    <section className="w-full bg-white overflow-hidden">
      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17">
        <h2 className="text-28px font-bold mb-6 text-black">
          Our Process
        </h2>

        <Swiper
          modules={[FreeMode, Mousewheel]}
          spaceBetween={24}
          slidesPerView={1.2}
          freeMode={true}
          mousewheel={{
            forceToAxis: true,
            sensitivity: 1,
            releaseOnEdges: true,
          }}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.2 },
            1280: { slidesPerView: 4.2 },
          }}
          className="w-full overflow-visible!"
        >
          {steps.map((step, i) => (
            <SwiperSlide key={i}>
              <div className="flex flex-col gap-4 group">
                {/* Image Container with Taller Aspect Ratio */}
                <div className="relative aspect-3/4 w-full bg-gray-50 overflow-hidden rounded-sm">
                  <Image
                    src={step.img}
                    alt={step.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Placeholder overlay if image fails */}
                  <div className="absolute inset-0 bg-gray-50 -z-10" />
                </div>

                {/* Text Content */}
                <div className="space-y-2 pr-4">
                  <h3 className="text-xl font-semibold text-black tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-base leading-1.4">
                    {step.desc}
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
