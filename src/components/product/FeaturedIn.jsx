"use client";

import Image from "next/image";
import Marquee from "react-fast-marquee";

export default function FeaturedIn() {

  const logos = [
    "/images/feature/MediaBrief.svg",
    "/images/feature/Inc42.svg",
    "/images/feature/IndiaRetailing.svg",
    "/images/feature/BQF.svg",
    "/images/feature/Entrepreneur.svg",
    "/images/feature/JewelBuzz.svg",
    "/images/feature/MadeInMedia.svg",
    "/images/feature/Disrupt.svg",
    "/images/feature/ET.svg",
  ];

  return (
    <section className="w-full py-6 bg-gray-50">

      <div className="w-full text-center">
        <div className="max-w-480 mx-auto px-5 md:px-17 min-[1440px]:px-17 space-y-8 mb-5">
          <h2 className="text-28px font-bold">
            Featured In
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            “Lucira Jewelry focuses on modern fine jewellery, featuring
            lab-grown diamonds and expert craftsmanship.”
          </p>
        </div>

        {/* Marquee */}

        <div className="relative overflow-hidden">

          {/* edge fade */}

          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-linear-to-r from-gray-50 to-transparent z-10"></div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-linear-to-l from-gray-50 to-transparent z-10"></div>

          <Marquee
            speed={60}
            pauseOnHover={true}
            gradient={false}
          >

            <div className="flex items-center gap-16 px-8">

              {logos.map((logo, index) => (
                <Image
                  key={index}
                  src={logo}
                  alt="media logo"
                  width={120}
                  height={40}
                  className="object-contain opacity-70 hover:opacity-100 transition"
                />
              ))}

              {/* duplicate for seamless loop */}

              {logos.map((logo, index) => (
                <Image
                  key={`dup-${index}`}
                  src={logo}
                  alt="media logo 2"
                  width={120}
                  height={40}
                  className="object-contain opacity-70 hover:opacity-100 transition"
                />
              ))}

            </div>

          </Marquee>

        </div>

      </div>

    </section>
  );
}