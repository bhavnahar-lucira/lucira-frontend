"use client";

import Link from "next/link";
import { RefreshCcw, Truck } from "lucide-react";
import LazyImage from "../common/LazyImage";

const features = [
  {
    icon: Truck,
    text: "Free and secure shipping",
    type: "lucide",
  },
  {
    icon: "/images/award.svg",
    text: "100% value guarantee",
    type: "image",
  },
  {
    icon: RefreshCcw,
    text: "Lifetime buy back or exchange",
    type: "lucide",
  },
  {
    icon: "/images/return.svg",
    text: "15-day free returns",
    type: "image",
  },
];

export default function WeAreLucira() {
  return (
    <section className="mt-15 w-full bg-[#FEF5F1]">
      <div className="grid w-full grid-cols-1 overflow-hidden xl:grid-cols-[400px_minmax(0,1fr)_400px] lg:grid-cols-[300px_minmax(0,1fr)_300px]">
        {/* Left Image Grid */}
        <div className="grid grid-rows-2">
          <div className="grid h-full grid-cols-[30%_70%]">
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/1.jpg"
                alt="Lucira store product display"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/2.jpg"
                alt="Lucira store interior"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid h-full grid-cols-[70%_30%]">
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/3.jpg"
                alt="Jewelry lifestyle portrait"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/4.jpg"
                alt="Jewelry close-up on hands"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex items-center justify-center px-6 py-6 text-center lg:px-12">
          <div className="max-w-135">
            <div className="mb-2.5 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center">
                <LazyImage
                  src="/images/icons/small-logo.svg"
                  alt="Lucira Jewelry"
                  width={20}
                  height={40}
                  priority
                />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold font-abhaya mb-2 text-black">We are Lucira</h2>

            <p className="text-base font-normal text-black">
              Lucira reimagine diamonds for the modern India. A design-first
              fine jewelry brand, that turns everyday moments into timeless
              expressions of self.
            </p>

            <div className="mx-auto mt-8 grid max-w-130 grid-cols-1 gap-x-10 gap-y-4 text-left sm:grid-cols-2">
                {features.map((item) => {
                    return (
                        <div key={item.text} className="flex items-center gap-3">
                        {item.type === "image" ? (
                            <LazyImage
                              src={item.icon}
                              alt={item.text}
                              width={22}
                              height={22}
                              className="shrink-0"
                            />
                        ) : (
                            <item.icon size={22} className="shrink-0" />
                        )}

                        <span className="text-sm font-medium text-black">
                            {item.text}
                        </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6.5 flex justify-center">
              <Link
                href="/pages/about-our-company"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-8 text-base font-bold uppercase tracking-wide text-white transition hover:opacity-90"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Right Image Grid */}
        <div className="hidden grid-rows-2 lg:grid">
          <div className="grid h-full grid-cols-[70%_30%]">
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/5.jpg"
                alt="Jewelry close-up portrait"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/6.jpg"
                alt="Lucira gift box"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid h-full grid-cols-[30%_70%]">
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/7.jpg"
                alt="Two women wearing jewelry"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative min-h-40 overflow-hidden">
              <LazyImage
                src="/images/we-are-lucira/8.jpg"
                alt="Lucira store display"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
