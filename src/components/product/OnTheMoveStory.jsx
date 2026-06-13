"use client";

import Image from "next/image";

export default function OnTheMoveStory({ tags }) {
  if (!tags?.includes("Sports Collection")) return null;

  return (
    <section className="w-full pt-10 md:py-20 bg-white overflow-hidden">
      <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17 grid lg:grid-cols-[50%_50%] gap-10 md:gap-12 items-center">
        {/* LEFT VIDEO */}
        <div className="relative w-full h-[400px] md:h-[400px] rounded-xl overflow-hidden bg-gray-100 order-1 lg:order-1">
          <video
            src="https://cdn.shopify.com/videos/c/o/v/02284af528f44a6ba415cf7dd80b661d.mp4"
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="max-w-[500px] space-y-6 md:space-y-8 order-2 lg:order-2">
          <div className="space-y-2 md:space-y-3">
            <p className="text-12px md:text-14px font-semibold uppercase tracking-[0.2em] text-tertiary">
              ON THE MOVE
            </p>

            <h2 className="text-28px md:text-42px font-bold leading-tight text-black">
              For Them Who Wanna Stay in Motion
            </h2>
          </div>

          <div className="space-y-4 md:space-y-6">
            <p className="text-15px md:text-18px text-gray-700 leading-relaxed font-figtree">
              Across time and empire, movement has defined life's most powerful
              forms. The bezel, once worn as armour, is now reimagined in gold
              and light, a tribute to those who lead with strength and grace.
            </p>
          </div>

          {/*
      <div className="pt-2 md:pt-4">
        <div className="inline-flex items-center gap-2 border-b-2 border-primary pb-1 cursor-default">
          <span className="text-14px md:text-16px font-bold uppercase tracking-wider text-primary">
            Explore Sports Collection
          </span>
        </div>
      </div>
      */}
        </div>
      </div>
    </section>
  );
}
