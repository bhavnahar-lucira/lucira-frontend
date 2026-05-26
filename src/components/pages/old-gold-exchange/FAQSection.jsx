"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function FAQSection({ data }) {
  const { heading, description, items } = data;
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="faq-section py-20 bg-white">
      <div className="container-main mx-auto px-4 max-w-[1000px]">
        
        <div className="text-center mb-12">
          {heading && (
            <h2 className="text-[18px] md:text-[28px] font-abhaya font-semibold uppercase tracking-[2px] mb-4 text-primary">
              {heading}
            </h2>
          )}
          {description && (
            <p className="text-gray-500 text-[14px] md:text-[18px] max-w-[700px] mx-auto font-figtree">
              {description}
            </p>
          )}
        </div>

        <div className="accordion-wrapper divide-y divide-gray-200">
          {items.map((item, index) => (
            <div key={index} className="accordion-item py-6">
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center text-left focus:outline-none group"
              >
                <h3 className="text-lg md:text-xl font-medium text-[#1a1a1a] group-hover:text-[#b76f79] transition-colors pr-8">
                  {item.question}
                </h3>
                <span className="flex-shrink-0 text-gray-400">
                  {openIndex === index ? <Minus size={24} /> : <Plus size={24} />}
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-[500px] opacity-100 mt-6" : "max-h-0 opacity-0"
                }`}
              >
                <div className="text-gray-600 leading-relaxed text-base prose prose-sm max-w-none">
                  {/* Assuming answer might be plain text since no HTML is in JSON but RichText is mentioned in schema */}
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": items.map((item) => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
