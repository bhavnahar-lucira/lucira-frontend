"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Gem,
  FlaskConical,
  Hourglass,
  TrendingUp,
  Crown,
  Fingerprint,
  Search,
  Scissors,
  Leaf,
  DollarSign,
} from "lucide-react";

export default function DiamondEducation() {
  const [activeTab, setActiveTab] = useState("nz");

  const tabs = [
    { key: "df", label: "D-F", desc: "Colorless" },
    { key: "gj", label: "G-J", desc: "Near Colorless" },
    { key: "km", label: "K-M", desc: "Faint" },
    { key: "nz", label: "N-Z", desc: "Very Light" },
  ];

  const colorImages = {
    df: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Screenshot_2025-04-02_180426.png",
    gj: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_x.jpg",
    km: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_y.png",
    nz: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_xyz.png",
  };

  return (
    <div className="container mx-auto font-figtree text-gray-900">

      {/* HERO */}
    <section className="flex flex-col lg:flex-row items-center gap-8 px-4 md:px-16 py-10 md:py-16">
        <div className="lg:w-1/2">
            <h1 className="font-abhaya text-3xl lg:text-5xl mb-6 text-black">
                How To Know The Quality of Your Diamond: The 4C's
            </h1>

            <p className="text-base mb-4">
                If you ever wonder how the quality of your diamonds is determined and if you are getting them at the right price, then you are at the right place. There was once a time when a goldsmith could define the quality of diamond through only descriptive words.
            </p>

            <p className="text-base mb-4">
                Did you know the transparency was described with phrases such as 'shiny as water', 'first water', and 'milky.' You had to take the word of the jeweller when they scratch-tested your diamond against other stones.
            </p>
            <p className="text-base">
                In this guide, we will cover all the 4Cs of diamonds and how to perform some basic tests at home, which are not as precise as professional evaluations but can still give you valuable insights into your diamond's quality. Keep reading to discover how you can assess your gem with simple at-home methods!
            </p>
            </div>

            <div className="lg:w-1/2">
            <Image
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_image.png?v=1743589351"
                alt="Diamond"
                width={600}
                height={500}
                className="w-full h-auto rounded-lg"
            />
        </div>
    </section>

      {/* INTRO */}
      <section className="text-center px-4 mb-2 lg:mb-6">
        <h2 className="font-abhaya text-3xl lg:text-5xl mb-3">
          The 4C's of Diamond Quality
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Understanding these four characteristics will help you make an informed decision
        </p>
      </section>

      {/* CUT */}
      <section className="flex flex-col lg:flex-row items-center gap-8 px-4 md:px-16 py-8 md:py-12">
        <div className="lg:w-1/2 space-y-4">
            <h3 className="font-abhaya text-3xl lg:text-5xl">Cut</h3>

            <p className="text-lg mb-6">
                The cut of a diamond refers to how wonderfully is the diamond able to reflect light. The cut looks at the proportions and arrangement of the diamond's facets, which influence its brilliance, sparkle, and fire. The grading scale ranges from Excellent to Poor.
            </p>

            <p className="text-lg mb-3">
                How to Test The Cut of Your Diamond at Home?
            </p>

          <ul className="list-disc ml-5 space-y-2 text-sm md:text-base">
            <li>Hold the diamond under a bright light and observe its sparkle.</li>
            <li>A well-cut diamond will reflect light brilliantly.</li>
            <li>A poorly-cut diamond will appear dull or have dark spots.</li>
          </ul>
        </div>

        <div className="lg:w-1/2">
          <Image
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_image_1.jpg?v=1743515231"
            alt="Cut"
            width={500}
            height={400}
            className="w-full rounded-lg"
          />
        </div>
      </section>

      {/* COLOR */}
      <section className="px-4 md:px-16 py-8 md:py-12">
        <h3 className="font-abhaya text-3xl lg:text-5xl mb-2">Color</h3>
        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative w-full h-75 md:h-112.5">
            <Image
                key={activeTab} // 🔥 forces rerender for smooth swap
                src={colorImages[activeTab]}
                alt={`Diamond ${activeTab}`}
                fill
                className="object-contain transition-opacity duration-300"
                priority
            />
            </div>

            <div>
                <p className="text-lg mb-6">
                    Interestingly, the color in this grading system is for the lack of color. The more the absence of color, the better the quality. The scale ranges from D to Z with D being the most colorless. Any color beyond Z are termed as fancy colors.
                </p>

                <p className="text-lg mb-3">
                    How to Test The Color of Your Diamond at Home?
                </p>
            <ul className="list-disc ml-5 space-y-2 text-sm md:text-base">
                <li>Place the diamond on a white piece of paper and compare it to another diamond or a cubic zirconia.</li>
                <li>High-quality diamonds appear colorless.</li>
                <li>Lower-grade diamonds may have a yellow or brownish tint.</li>
            </ul>

            {/* Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`border rounded-lg px-4 py-3 transition-all duration-200 ${
                        activeTab === tab.key
                            ? "border-accent bg-accent/10 scale-105"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <div className="font-semibold">{tab.label}</div>
                        <div className="text-xs text-gray-500">{tab.desc}</div>
                    </button>
                    ))}
                </div>
            </div>
        </div>
    </section>

      {/* CLARITY */}
      <section className="flex flex-col lg:flex-row items-center gap-8 px-4 md:px-16 py-8 md:py-12">
        <div className="lg:w-1/2 space-y-4">
          <h3 className="font-abhaya text-3xl lg:text-5xl mb-2">Clarity</h3>
            <p className="text-lg mb-6">
                A diamond inclusion is an imperfection or flaw inside. These are caused during the making of the diamond due to extreme heat or pressure. The Clarity in the 4C's check these flaws and the lesser the inclusions, the more the clarity and hence, better the quality of your diamond.
            </p>
          <p className="text-lg mb-3">
            How to Test the Clarity of your Diamond at Home?
        </p>

          <ul className="list-disc ml-5 space-y-2 text-sm md:text-base">
            <li>Use a 10x magnifying glass (loupe) to look for tiny spots, cracks, or cloudiness.</li>
            <li>Flawless diamonds have no visible inclusions.</li>
            <li>Lower clarity diamonds have visible imperfections (black spots, cloudy areas).</li>
          </ul>
        </div>

        <div className="lg:w-1/2">
          <Image
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_image_6.png?v=1743599059"
            alt="Clarity"
            width={500}
            height={400}
            className="w-full rounded-lg"
          />
        </div>
      </section>

      {/* CARAT */}
      <section className="flex flex-col lg:flex-row items-center gap-8 px-4 md:px-16 py-8 md:py-12">
        <div className="lg:w-1/2 lg:order-0 order-1">
          <Image
            src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_image_4_739efea4-71fb-42e1-bb1f-cf6ba09466ac.jpg?v=1743516234"
            alt="Carat"
            width={500}
            height={400}
            className="w-full rounded-lg"
          />
        </div>

        <div className="lg:w-1/2 space-y-4 lg:order-1 order-0">
          <h3 className="font-abhaya text-3xl lg:text-5xl mb-2">Carat</h3>

          <p className="text-lg mb-6">
            The carat of a diamond is often mistaken with the size of the diamond. The carat measures the weight. Each carat is subdivided into 100 points. One point is one hundredth of a carat. One carat weighs just as much as a standard paperclip. Diamonds are weighed in carats to give you a more precise measurement as the size may vary based on cuts and shape.
        </p>

        <p className="text-lg mb-3">
            How to Test the Carat of Your diamond at Home?
        </p>

          <ul className="list-disc ml-5 space-y-2 text-sm md:text-base">
            <li>Place the diamond on a digital scale (to the hundredth of a gram).</li>
            <li>1 carat = 0.2 grams.</li>
          </ul>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="bg-accent/30 px-4 md:px-16 py-10 md:py-16">
        <div className="text-center mb-6">
            <h2 className="font-abhaya text-3xl lg:text-5xl mb-2">
            Natural vs Lab Grown Diamonds
            </h2>
            <p className="text-sm md:text-base text-gray-600">
            Understanding your options for making the best choice
            </p>
        </div>
        <div className="w-full lg:w-[70%] mx-auto grid md:grid-cols-2 gap-6">

          {/* Natural */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <Gem size={20} />
              <h4 className="font-abhaya text-xl">Natural Diamonds</h4>
            </div>

            <ul className="space-y-3 text-sm md:text-base ml-6">
              <li className="flex items-center gap-4"><Hourglass size={16}/> Billions of years old</li>
              <li className="flex items-center gap-4"><TrendingUp size={16}/> Higher value</li>
              <li className="flex items-center gap-4"><Crown size={16}/> Luxury appeal</li>
              <li className="flex items-center gap-4"><Fingerprint size={16}/> Unique</li>
            </ul>
          </div>

          {/* Lab */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <FlaskConical size={20} />
              <h4 className="font-abhaya text-xl">Lab Grown Diamonds</h4>
            </div>

            <ul className="space-y-3 text-sm md:text-base ml-6">
              <li className="flex items-center gap-4"><Search size={16}/> Better clarity</li>
              <li className="flex items-center gap-4"><Scissors size={16}/> Precision cut</li>
              <li className="flex items-center gap-4"><Leaf size={16}/> Ethical</li>
              <li className="flex items-center gap-4"><DollarSign size={16}/> Affordable</li>
            </ul>
          </div>

        </div>
      </section>

    </div>
  );
}