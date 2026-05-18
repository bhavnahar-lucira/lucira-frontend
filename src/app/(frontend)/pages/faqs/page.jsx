"use client";
import { useState } from "react";

export default function FAQPage() {
  const [active, setActive] = useState({
    block: null,
    index: null,
  });

  const toggleFAQ = (blockIndex, index, question) => {
    const isSame =
      active.block === blockIndex && active.index === index;

    setActive({
      block: isSame ? null : blockIndex,
      index: isSame ? null : index,
    });

    // Analytics
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "faq_click",
        faq_question: question,
        location: "faq_section",
      });
    }
  };

  const faqData = [
    {
      heading: "LAB GROWN DIAMONDS",
      description:
        "Everything you need to know about lab grown diamonds.",
      faqs: [
        {
          q: "What are lab grown diamonds?",
          a: "<p>Lab grown diamonds are real diamonds created in controlled environments.</p>",
        },
        {
          q: "Are lab grown diamonds real diamonds?",
          a: "<p>Yes, they are chemically and physically identical to natural diamonds.</p>",
        },
        {
          q: "How are lab grown diamonds different from natural diamonds?",
          a: "<p>The only difference is origin — one is mined, the other is created in a lab.</p>",
        },
        {
          q: "Are lab grown diamonds certified?",
          a: "<p>Yes, they are certified by IGI, GIA etc.</p>",
        },
        {
          q: "Why are lab grown diamonds more affordable?",
          a: "<p>They avoid mining costs and have a shorter supply chain.</p>",
        },
      ],
    },
    {
      heading: "Products & Purchase",
      description:
        "Questions about products or purchase? We’ve got you.",
      faqs: [
        {
          q: "What jewellery products do you offer?",
          a: "<p>We offer a curated range of lab grown diamond jewellery, including rings, earrings, pendants, necklaces, and bracelets. Each piece is thoughtfully designed to balance modern elegance with timeless appeal.</p>",
        },
        {
          q: "Can I customise my jewellery?",
          a: "<p>Yes. You can customise designs, diamond sizes, settings, and metals to create a piece that reflects your personal style. Our team ensures every detail is crafted with precision and care.</p>",
        },
        {
          q: "What payment options are available?",
          a: "<p>We offer multiple secure payment options, including cards, UPI, net banking, and EMI. All transactions are protected to ensure a safe and seamless shopping experience.</p>",
        },
        {
          q: "How long does delivery take?",
          a: "<p>Delivery timelines vary by product and customisation. Ready pieces typically ship faster, while customised designs may take longer. Exact timelines are shared at checkout and order confirmation.</p>",
        },
        {
          q: "What is your return or exchange policy?",
          a: "<p>We offer returns or exchanges as per our policy guidelines. Eligibility depends on product type and condition. For detailed terms, please refer to our returns policy or contact our support team.</p>",
        },
      ],
    },
    {
      heading: "Care & Longevity",
      description:
        "Answers on care, maintenance, and diamond durability.",
      faqs: [
        {
          q: "Are lab grown diamonds durable?",
          a: "<p>Yes. lab grown diamonds are as hard and durable as natural diamonds. They resist scratches and daily wear, making them perfect for everyday elegance.</p>",
        },
        {
          q: "Will my diamond lose its sparkle over time?",
          a: "<p>No. With proper care, lab grown diamonds retain their brilliance indefinitely. Regular cleaning ensures your jewellery continues to shine just like the day you received it.</p>",
        },
        {
          q: "How should I care for my jewellery?",
          a: "<p>Store pieces separately, avoid harsh chemicals, and clean with a soft cloth or mild solution. Occasional professional cleaning keeps your jewellery sparkling and pristine.</p>",
        },
        {
          q: "Can lab grown diamonds be repaired or reset?",
          a: "<p>Yes. lab grown diamonds can be safely reset or repaired by skilled jewellers without affecting their integrity or brilliance, just like natural diamonds.</p>",
        },
        {
          q: "Is maintenance different from natural diamonds?",
          a: "<p>Not at all. lab grown diamonds have identical properties to natural diamonds, so care, cleaning, and maintenance follow the same expert guidelines.</p>",
        },
      ],
    }
  ];

  return (
    <> 
      <div className="w-full bg-white text-[#1a1a1a] font-['Figtree']">
        <section
          className="relative w-full h-[535px] md:h-[605px] flex items-end justify-center bg-cover bg-center bg-no-repeat
            bg-[url('https://luciraonline.myshopify.com/cdn/shop/files/9820f9dcdf6d0bb0c881f219d866707196ee8436_768x.jpg?v=1768888876')]
            md:bg-[url('https://luciraonline.myshopify.com/cdn/shop/files/Desktop-Banner_1920x.jpg?v=1769855955')]"
        >
          <div className="absolute inset-0 bg-black/0 z-10" />

          <div className="relative z-20 text-center text-white p-5 pb-[10px] md:pb-[20px] max-w-[800px] mb-[10px] md:mb-[20px]">
            <h1 className="font-abhaya text-[28px] md:text-[36px] font-medium leading-tight mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-[18px] md:text-[20px]">
                Everything you need to know about lab grown diamonds.Answers to your questions about diamonds, orders, and care.
            </p>
          </div>
        </section>
        {faqData.map((block, blockIndex) => (
          <div
            key={blockIndex}
            className="px-4 sm:px-6 lg:px-10 py-10 md:py-14"
          >
            <div className="max-w-[1400px] mx-auto">

              <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-14">

                {/* LEFT */}
                <div className="flex flex-col gap-4 md:gap-5">
                  <h2 className="text-[18px] md:text-[26px] font-medium uppercase tracking-wide">
                    {block.heading}
                  </h2>
                  <p className="text-[12px] md:text-[13px] text-gray-500 leading-relaxed">
                    {block.description}
                  </p>
                </div>

                {/* RIGHT */}
                <div>
                  {block.faqs.map((faq, index) => {
                    const isOpen =
                      active.block === blockIndex &&
                      active.index === index;

                    return (
                      <div
                        key={index}
                        className="border-t border-gray-300 py-4 md:py-[18px]"
                      >
                        {/* QUESTION */}
                        <div
                          onClick={() =>
                            toggleFAQ(blockIndex, index, faq.q)
                          }
                          className="flex justify-between items-start gap-4 cursor-pointer"
                        >
                          <p className="text-[12px] md:text-[14px] font-medium leading-relaxed flex-1">
                            {faq.q}
                          </p>

                          {/* ICON */}
                          <button
                            aria-expanded={isOpen}
                            className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center relative"
                          >
                            {/* PLUS */}
                            <svg
                              className={`absolute transition-all duration-300 ${
                                isOpen
                                  ? "opacity-0 -rotate-90"
                                  : "opacity-100 rotate-0"
                              }`}
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"
                                fill="#1a1a1a"
                              />
                            </svg>

                            {/* CLOSE */}
                            <svg
                              className={`absolute transition-all duration-300 ${
                                isOpen
                                  ? "opacity-100 rotate-0"
                                  : "opacity-0 rotate-90"
                              }`}
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="#1a1a1a"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* ANSWER */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isOpen
                              ? "max-h-[300px] mt-3"
                              : "max-h-0"
                          }`}
                        >
                          <div
                            className="text-[12px] md:text-[13px] text-gray-500 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: faq.a,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>
          </div>
        ))}
      </div>
    </>
  );
}