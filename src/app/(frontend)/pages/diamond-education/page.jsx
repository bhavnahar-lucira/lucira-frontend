"use client"

import Image from "next/image";
import { RotateCw, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useState, Suspense } from "react"
import FAQ from "@/components/common/FAQ";

export default function DiamondEducation() {
  const [activeAnatomy, setActiveAnatomy] = useState("table");
  const [showRealCutDiamond, setShowRealCutDiamond] = useState(false);
  const [showRealClarityDiamond, setShowRealClarityDiamond] = useState(false);
  const [clarityIndex, setClarityIndex] = useState(0);
  const [showRealColorDiamond, setShowRealColorDiamond] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [showRealCaratDiamond, setShowRealCaratDiamond] = useState(false);
  const [caratIndex, setCaratIndex] = useState(0);

  const anatomySections = [
    {
      key: "table",
      label: "Table",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond-table.png",
      text: "Every part matters crown, girdle, pavilion, facets, and culet work together to shape light, enhance brilliance, and turn a diamond into a masterpiece of sparkle and precision",
    },
    {
      key: "crown",
      label: "Crown",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond-crown.png",
      text: "The crown is the top part of a diamond above the girdle, shaping its brilliance by controlling how light enters and reflects",
    },
    {
      key: "girdle",
      label: "Girdle",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond-girdle.png",
      text: "The girdle is the thin outer edge of a diamond where the crown meets the pavilion. It provides structure, helps set the stone securely, and can affect how light interacts with the diamond",
    },
    {
      key: "pavilion",
      label: "Pavilion",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond-pavilion.png",
      text: "The pavilion’s precise angles and depth control how light reflects, enhancing the diamond’s brilliance and creating its signature sparkle.",
    },
    {
      key: "facet",
      label: "Facet",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond-facet.png",
      text: "Facets are the flat, polished surfaces on a diamond that catch and reflect light. Their arrangement and precision create brilliance, fire, and the diamond’s overall sparkle.  ",
    },
    {
      key: "culet",
      label: "Culet",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond-culet.png",
      text: "The culet is the tiny tip at the bottom of a diamond. A well-proportioned culet prevents chipping and ensures light reflects properly for maximum brilliance.",
    },
  ];

  const comparisonRows = [
    { label: "Real Diamond (100% Carbon)", lgd: true, mined: true },
    { label: "Visually Identical Sparkle", lgd: true, mined: true },
    { label: "Certified (IGI / GIA / SGL)", lgd: true, mined: true },
    { label: "Resilience (Mohs 10)", lgd: true, mined: true },
    { label: "Conflict-Free", lgd: true, mined: false },
    { label: "Ethically Sourced", lgd: true, mined: false },
    { label: "Sustainable Choice", lgd: true, mined: false },
    { label: "Modern & Future-Ready Luxury", lgd: true, mined: false },
  ];

  const diamond4Cs = [
    {
      key: "cut",
      label: "Cut",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cut_48fc3b00-7b47-4059-a4a4-d5dc1fab871f.jpg?v=1786444903",
    },
    {
      key: "clarity",
      label: "Clarity",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_effe4bc9-24e6-4a4a-844e-ee6e24c25d9d.jpg?v=1786444903",
    },
    {
      key: "color",
      label: "Color",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_5abf6cae-8c02-4c18-bec3-3a0abbc7c41b.jpg?v=1786444904",
    },
    {
      key: "carat",
      label: "Carat",
      image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Carat_9dfac57e-c5d7-45d2-83b3-c8ff0e456df5.jpg?v=1786444902",
    },
  ];

  const cutTypes = [
    {
      key: "ideal",
      label: "Ideal Cut",
      desc: "Expertly angled for superior shine",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cut_1.jpg_1.jpg?v=1786445249",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cut_r1.jpg_1.jpg?v=1786445825",
      highlight: true,
    },
    {
      key: "deep",
      label: "Deep Cut",
      desc: "Depth that enhances brilliance",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cut_2.jpg_1.jpg?v=1786445250",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cut_r2.jpg_1.jpg?v=1786445823",
      highlight: false,
    },
    {
      key: "shallow",
      label: "Shallow Cut",
      desc: "Light escapes, subtle sparkle",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cut_3.jpg_1.jpg?v=1786445249",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Cut_r3.jpg_1.jpg?v=1786445823",
      highlight: false,
    },
  ];

  const clarityGrades = [
    {
      key: "if",
      label: "IF",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Vector_29_201_1.jpg?v=1786446394",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Real_29_201_1.jpg?v=1786446623",
    },
    {
      key: "vvs",
      label: "VVS",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Vector_29_202_1.jpg?v=1786446393",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Real_29_202_2.jpg?v=1786447340",
    },
    {
      key: "vs",
      label: "VS",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Vector_29_203_1.jpg?v=1786446393",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Real_29_203_4.jpg?v=1786450721",
    },
    {
      key: "si",
      label: "SI",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Vector_29_204_1.jpg?v=1786446393",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Real_29_204_1.jpg?v=1786450181",
    },
    {
      key: "i",
      label: "I",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Vector_29_205_1.jpg?v=1786446394",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Clarity_20Desktop_201720x715_20_28Real_29_205_2.jpg?v=1786450014",
    },
  ];

  const colorGrades = [
    {
      key: "df",
      label: "D-F",
      desc: "Colorless",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Vector_29_201_1.jpg?v=1786965194",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Real_29_201.jpg?v=1786964441",
    },
    {
      key: "gj",
      label: "G-J",
      desc: "Near Colorless",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Vector_29_202_1.jpg?v=1786965234",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Real_29_202.jpg?v=1786964568",
    },
    {
      key: "km",
      label: "K-M",
      desc: "Yellowish",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Vector_29_203_1.jpg?v=1786965282",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Real_29_203.jpg?v=1786964613",
    },
    {
      key: "nz",
      label: "S-Z",
      desc: "Dark Yellow",
      diagramImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Vector_29_204_1.jpg?v=1786965286",
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Color_20Desktop_201720x715_20_28Real_29_203.jpg?v=1786964613",
    },
  ];

  const caratOptions = [
    {
      key: "025",
      label: "0.25",
      size: 34,
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/4mm_200.25ct.png?v=1786968106",
    },
    {
      key: "05",
      label: "0.5",
      size: 42,
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/5.10mm_200.50ct.png?v=1786968215",
    },
    {
      key: "075",
      label: "0.75",
      size: 50,
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/5.80mm_200.75ct.png?v=1786968144",
    },
    {
      key: "1",
      label: "1",
      size: 58,
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/6.50mm_201.00ct.png?v=1786968131",
    },
    {
      key: "125",
      label: "1.25",
      size: 66,
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/6.95mm_201.25ct.png?v=1786968250",
    },
    {
      key: "15",
      label: "1.5",
      size: 74,
      realImage: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/1.50cm_201.50ct.png?v=1786968273",
    },
  ];

  const faqData = [
    {
      question: "Which of the 4Cs is most important for sparkle?",
      answer:
        "Cut is the most vital. Even with perfect color/clarity, a poor cut looks dull. Prioritize 'Ideal' or 'Excellent' cuts for maximum brilliance.",
    },
    {
      question: "How can I get a larger diamond on a fixed budget?",
      answer:
        "Consider Lab-Grown Diamonds or 'Near Colorless' grades (G-J). Choosing shapes like Oval or Pear also creates the illusion of a larger stone.",
    },
    {
      question: "Are lab-grown diamonds as durable as mined?",
      answer:
        "Yes. They are chemically and physically identical, with a Mohs hardness of 10/10. Both are perfect for daily wear and lifelong durability.",
    },
    {
      question: "Which diamond shape offers the best value?",
      answer:
        "Oval and Cushion cuts typically cost less per carat than Round Brilliant cuts while offering a large surface area and magnificent light return",
    },
    {
      question: "Do all your diamonds come with a GIA report?",
      answer:
        "Yes. Every center stone is GIA or IGI certified, ensuring the 4Cs—Cut, Color, Clarity, and Carat—are independently verified for your peace of mind.",
    },
    {
      question: "Do lab-grown diamonds have resale value?",
      answer:
        "While lab diamonds offer more \"size for your spend,\" natural diamonds generally retain higher long-term resale value due to their inherent rarity. ",
    },
  ];

  return (
    <>
      <section className="relative w-full">
        <div
          className="
            relative w-full
            h-[535px] md:h-[605px] lg:h-[725px]
            bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/B anner_20428x535_20_28Mobile_29_699adcc2-b2ce-4af4-8d56-fbf6fb687bdb.jpg?v=1785237804')]
            md:bg-[url('https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Banner_201920x823_20_28Desktop_29_a1e8019b-7252-42ca-93b4-6827c5fc5e4c.jpg?v=1785237800')]
            bg-cover bg-center
            flex items-end justify-center
          "
        >
          <div className="absolute inset-0 bg-black/20 z-10" />
          <div className="relative z-20 text-center text-white px-5 pb-4 max-w-[800px] mb-3 md:mb-5">
            <h2 className="text-[18px] md:text-[28px] mb-3">
              DIAMOND EDUCATION
            </h2>
            <p className="text-[12px] md:text-[18px]">
              A diamond is more than sparkle; it's precision and choice
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
              DIAMOND ANATOMY
            </h2>
            <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
              Every facet measured, every proportion balanced; this is what gives a diamond its unmatched sparkle and timeless allure. Cut, clarity, and symmetry transform each stone into a masterpiece.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 bg-[#fafafa] rounded-md overflow-hidden">
            {/* Part 1: Image */}
            <div className="relative w-full lg:w-1/2 h-[320px] md:h-[420px] lg:h-auto">
              <Image
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/2c5e0a15c3a914905eaf3c13f52a45a406f2c6e8.png?v=1785238285"
                alt="Diamond anatomy diagram"
                fill
                className="object-contain"
              />
            </div>

            {/* Part 2: Accordion */}
            <div className="w-full lg:w-1/2 border border-blue-400">
              {anatomySections.map((item, index) => {
                const isOpen = activeAnatomy === item.key;
                return (
                  <div
                    key={item.key}
                    className={`border-b border-dashed border-blue-300 ${
                      index === anatomySections.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveAnatomy(isOpen ? "" : item.key)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left bg-[#efefef] hover:bg-[#e9e9e9] transition-colors"
                    >
                      <span className="uppercase text-[16px] md:text-[18px] tracking-wide">
                        {item.label}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 bg-[#efefef] flex items-start gap-5">
                        {/* <div className="relative w-[100px] h-[100px] shrink-0">
                          <Image
                            src={item.image}
                            alt={item.label}
                            fill
                            className="object-contain"
                          />
                        </div> */}
                        <p className="text-[13px] md:text-[14px] text-gray-500 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
              Modern Sparkle vs Classic Heritage
            </h2>
            <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
              Both sparkle, but lab-grown diamonds offer precision, ethical sourcing, and sustainable luxury while mined diamonds carry tradition and timeless allure.
            </p>
          </div>

          <div className="relative">
            {/* Highlighted column background (LGD) */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/3 w-1/3 bg-[#f4f4f4] rounded-md" />

            <div className="relative grid grid-cols-3">
              {/* Header row */}
              <div className="col-span-1" />
              <div className="col-span-1 flex flex-col items-center text-center px-2 pt-6 pb-6">
                <div className="relative w-[90px] h-[90px] md:w-[110px] md:h-[110px] mb-3">
                  <Image
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/lab-grown-diamond.png"
                    alt="Lab Grown Diamond"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="uppercase text-[13px] md:text-[16px] tracking-wide font-medium">
                  Lab Grown Diamond
                </span>
              </div>
              <div className="col-span-1 flex flex-col items-center text-center px-2 pt-6 pb-6">
                <div className="relative w-[90px] h-[90px] md:w-[110px] md:h-[110px] mb-3">
                  <Image
                    src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/mined-diamond.png"
                    alt="Mined Diamond"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="uppercase text-[13px] md:text-[16px] tracking-wide font-medium">
                  Mined Diamond
                </span>
              </div>

              {/* Rows */}
              {comparisonRows.map((row, index) => (
                <div key={row.label} className="contents">
                  <div
                    className="col-span-1 flex items-center px-2 md:px-4 py-4 md:py-5 border-t border-gray-200 text-[11px] md:text-[14px] uppercase tracking-wide"
                  >
                    {row.label}
                  </div>
                  <div className="col-span-1 flex items-center justify-center px-2 py-4 md:py-5 border-t border-gray-200">
                    {row.lgd ? (
                      <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-700 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-red-700 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-center px-2 py-4 md:py-5 border-t border-gray-200">
                    {row.mined ? (
                      <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-green-700 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-red-700 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Bottom border under last row, matching the highlighted column height */}
              <div className="col-span-1" />
              <div className="col-span-1 border-b border-gray-200 md:border-b-0" />
              <div className="col-span-1" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
              Diamonds Decoded
            </h2>
            <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
              Cut, Clarity, Color, and Carat the 4Cs define every diamond’s brilliance, beauty, and value. Understanding them ensures a choice that’s both dazzling and informed
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {diamond4Cs.map((item) => (
              <div
                key={item.key}
                className="relative w-full aspect-square rounded-md overflow-hidden"
              >
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/25" />
                <span className="absolute bottom-4 left-0 right-0 text-center text-white uppercase text-[13px] md:text-[15px] tracking-wide">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
              CUT
            </h2>
            <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, ut alconsequat.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-end items-center gap-3 mb-6">
            <span className="text-[13px] md:text-[14px] text-gray-700">
              Show in Real Diamond
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showRealCutDiamond}
              onClick={() => setShowRealCutDiamond((prev) => !prev)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                showRealCutDiamond ? "bg-gray-800" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  showRealCutDiamond ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Cut cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {cutTypes.map((cut, index) => (
              <div
                key={cut.key}
                className={`flex flex-col items-center text-center px-6 py-10 rounded-md ${index === 0 ? "col-span-2 md:col-span-1" : "col-span-1"}`}
              >
                <div className="relative w-full h-[220px] mb-6">
                  <Image
                    src={showRealCutDiamond ? cut.realImage : cut.diagramImage}
                    alt={cut.label}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="uppercase text-[16px] md:text-[18px] tracking-wide mb-2">
                  {cut.label}
                </h3>
                <p className="text-[12px] md:text-[13px] text-gray-500">
                  {cut.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
              Flawless Beauty Revealed
            </h2>
            <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
              Diamond clarity shows internal flaws. Fewer inclusions mean more sparkle, brilliance, and value. Checked via loupe or certificate, clarity ensures light reflects perfectly for unmatched elegance.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center md:justify-end items-center gap-3 mb-8">
            <span className="text-[13px] md:text-[14px] text-gray-700">
              Show in Real Diamond
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showRealClarityDiamond}
              onClick={() => setShowRealClarityDiamond((prev) => !prev)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                showRealClarityDiamond ? "bg-gray-800" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  showRealClarityDiamond ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Diamond image */}
          <div className="relative w-full h-[380px] md:h-[460px] mb-10">
            <Image
              src={
                showRealClarityDiamond
                  ? clarityGrades[clarityIndex].realImage
                  : clarityGrades[clarityIndex].diagramImage
              }
              alt={`Clarity grade ${clarityGrades[clarityIndex].label}`}
              fill
              className="object-contain"
            />
          </div>

          {/* Slider */}
          <div className="px-2">
            <input
              type="range"
              min={0}
              max={clarityGrades.length - 1}
              step={1}
              value={clarityIndex}
              onChange={(e) => setClarityIndex(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none bg-gray-200 accent-[#8a6a5c] cursor-pointer"
            />
            <div className="flex justify-between mt-3">
              {clarityGrades.map((grade, index) => (
                <button
                  key={grade.key}
                  type="button"
                  onClick={() => setClarityIndex(index)}
                  className={`text-[13px] md:text-[15px] tracking-wide transition-colors ${
                    index === clarityIndex
                      ? "text-black font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {grade.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
              The Hue & Tint Guide
            </h2>
            <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
              From icy colorless to warm honey tones, a diamond’s color grade significantly impacts its value. Choose the perfect hue that balances pure brilliance in your budget.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center md:justify-end items-center gap-3 mb-8">
            <span className="text-[13px] md:text-[14px] text-gray-700">
              Show in Real Diamond
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showRealColorDiamond}
              onClick={() => setShowRealColorDiamond((prev) => !prev)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                showRealColorDiamond ? "bg-gray-800" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  showRealColorDiamond ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Diamond image */}
          <div className="relative w-full h-[380px] md:h-[460px] mb-6">
            <Image
              src={
                showRealColorDiamond
                  ? colorGrades[colorIndex].realImage
                  : colorGrades[colorIndex].diagramImage
              }
              alt={`Color grade ${colorGrades[colorIndex].label} - ${colorGrades[colorIndex].desc}`}
              fill
              className="object-contain"
            />
          </div>

          {/* Active grade description */}
          <p className="text-center text-[13px] md:text-[14px] text-gray-500 mb-6">
            <span className="font-medium text-black">{colorGrades[colorIndex].label}</span>
            {" — "}
            {colorGrades[colorIndex].desc}
          </p>

          {/* Slider */}
          <div className="px-2">
            <input
              type="range"
              min={0}
              max={colorGrades.length - 1}
              step={1}
              value={colorIndex}
              onChange={(e) => setColorIndex(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none bg-gray-200 accent-[#8a6a5c] cursor-pointer"
            />
            <div className="flex justify-between mt-3">
              {colorGrades.map((grade, index) => (
                <button
                  key={grade.key}
                  type="button"
                  onClick={() => setColorIndex(index)}
                  className={`flex flex-col items-center text-[13px] md:text-[15px] tracking-wide transition-colors ${
                    index === colorIndex
                      ? "text-black font-medium"
                      : "text-gray-400"
                  }`}
                >
                  <span className={index === colorIndex ? "text-[16px] md:text-[18px]" : ""}>
                    {grade.label}
                  </span>
                  <span className="text-[10px] md:text-[11px] uppercase tracking-wide">
                    {grade.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-[18px] md:text-[24px] font-medium tracking-wide">
              Understanding Carats
            </h2>
            <p className="text-[12px] md:text-[15px] text-gray-500 mt-2 max-w-xl mx-auto">
              Carat measures a diamond's weight, not its physical size. Discover how the right cut can make a smaller carat appear larger, and find the perfect balance.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center md:justify-end items-center gap-3 mb-8">
            <span className="text-[13px] md:text-[14px] text-gray-700">
              Show in Real Diamond
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showRealCaratDiamond}
              onClick={() => setShowRealCaratDiamond((prev) => !prev)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                showRealCaratDiamond ? "bg-gray-800" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  showRealCaratDiamond ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Hand + ring overlay */}
          <div className="relative w-full h-[420px] md:h-[520px] mb-10">
            {/* Hand image: stays fixed regardless of carat size or toggle */}
            <Image
              src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Carat_20Mobile_20776x1260_fa64709c-c180-49e0-b5a9-f05671aec17e.jpg?v=1786965408"
              alt="Hand with ring finger"
              fill
              className="object-none"
            />

            {/* Diamond overlay: swaps image + size as carat / toggle change */}
            <div
              className="absolute object-none"
              style={{
                top: "48%",
                left: "37%",
                width: caratOptions[caratIndex].size,
                height: caratOptions[caratIndex].size,
                transform: "translate(-50%, -50%)",
                transition: "width 0.2s ease, height 0.2s ease",
              }}
            >
              <Image
                src={
                  showRealCaratDiamond
                    ? caratOptions[caratIndex].realImage
                    : caratOptions[caratIndex].diagramImage
                }
                alt={`${caratOptions[caratIndex].label} carat diamond`}
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Slider */}
          <div className="px-2">
            <input
              type="range"
              min={0}
              max={caratOptions.length - 1}
              step={1}
              value={caratIndex}
              onChange={(e) => setCaratIndex(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none bg-gray-200 accent-[#8a6a5c] cursor-pointer"
            />
            <div className="flex justify-between mt-3">
              {caratOptions.map((carat, index) => (
                <button
                  key={carat.key}
                  type="button"
                  onClick={() => setCaratIndex(index)}
                  className={`flex flex-col items-center text-[13px] md:text-[15px] tracking-wide transition-colors ${
                    index === caratIndex
                      ? "text-black font-medium"
                      : "text-gray-400"
                  }`}
                >
                  <span className={index === caratIndex ? "text-[18px] md:text-[20px]" : ""}>
                    {carat.label}
                  </span>
                  <span className="text-[11px] md:text-[12px]">CT</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse"></div>}>
        <FAQ
          title="Your Jewelry Questions"
          description="Quick answers to help you choose the perfect diamond"
          faqs={faqData}
        />
      </Suspense>
    </>
  );
}