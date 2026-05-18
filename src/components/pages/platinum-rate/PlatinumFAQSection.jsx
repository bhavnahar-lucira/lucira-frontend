"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function PlatinumFAQSection({ cityName, stateName, todayRate, sectionData }) {
  const [openIndex, setOpenIndex] = useState(null);

  const { settings, blocks, block_order } = sectionData || {};
  const faqBlocks = block_order ? block_order.map(id => blocks[id]) : [];

  const replaceShortcodes = (text) => {
    if (!text || typeof text !== 'string') return text;
    let processed = text
      .replaceAll('{{ page.metafields.custom.city_name.value }}', cityName)
      .replaceAll('{{ page.metafields.custom.state_name.value }}', stateName)
      .replaceAll('{cityName}', cityName)
      .replaceAll('{stateName}', stateName);

    if (todayRate) {
      const ratePerGram = todayRate / 10;
      processed = processed.replaceAll('[platinum_rate_999]', `₹${Math.round(ratePerGram).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[platinum_rate_950]', `₹${Math.round(ratePerGram * (950 / 1000)).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[platinum_rate_900]', `₹${Math.round(ratePerGram * (900 / 1000)).toLocaleString('en-IN')}`);

      // JSON specific ones
      processed = processed.replaceAll('[platinum_price_1g]', `₹${Math.round(ratePerGram).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[current_date_timestamp]', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
      processed = processed.replaceAll('[current_date]', new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
    }

    return processed;
  };

  return (
    <section className="py-12 md:py-20 bg-[#FAF3EC]/30">
      <div className="container-main max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[18px] md:text-[28px] font-medium text-zinc-900 uppercase tracking-tight font-abhaya">
            {settings?.faq_heading || "FAQ'S"}
          </h2>
          <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
        </div>

        <div className="space-y-6">
          {faqBlocks.map((block, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-2 md:p-4 text-left flex justify-between items-center group"
              >
                <span className={`text-[14px] md:text-[18px]  capitalize tracking-tight font-figtree transition-colors duration-300 ${openIndex === index ? 'text-primary' : 'text-zinc-800'
                  }`}>
                  {replaceShortcodes(block.settings.faq_question)}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openIndex === index ? 'bg-primary text-white' : 'bg-zinc-50 text-zinc-400'
                  }`}>
                  {openIndex === index ? (
                    <Minus size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="p-2 md:p-4 pt-0 text-zinc-500 leading-relaxed text-[14px] md:text-[18px] font-figtree border-t border-zinc-50 pt-8">
                  <div dangerouslySetInnerHTML={{ __html: replaceShortcodes(block.settings.faq_answer) }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .font-abhaya { font-family: var(--font-abhaya), serif; }
        .font-figtree { font-family: var(--font-figtree), sans-serif; }
      `}</style>
    </section>
  );
}
