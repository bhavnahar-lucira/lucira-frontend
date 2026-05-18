"use client";

import { useMemo } from "react";

export default function PlatinumInvestmentSection({ cityName, settings }) {
  const replaceShortcodes = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
      .replaceAll('{{ page.metafields.custom.city_name.value }}', cityName)
      .replaceAll('{cityName}', cityName);
  };

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <h2 className="text-[18px] md:text-[32px] font-medium text-zinc-900 uppercase tracking-tight font-abhaya leading-tight">
                {replaceShortcodes(settings?.investment_heading) || "Why Platinum is a Smart Investment"}
              </h2>
              <div className="h-1.5 w-20 bg-primary rounded-full" />
            </div>

            <div
              className="prose prose-zinc max-w-none prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:text-[14px] md:prose-p:text-[18px] prose-p:font-figtree prose-strong:text-zinc-900 prose-a:text-primary prose-a:underline"
              dangerouslySetInnerHTML={{ __html: replaceShortcodes(settings?.investment_description) }}
            />
          </div>

          {/* Right Column: Table of Contents / Quick Links */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-50 rounded-[2rem] p-8 md:p-10 border border-zinc-100 h-full">
              <h3 className="text-[16px] md:text-[22px] font-bold text-zinc-900 mb-8 uppercase tracking-widest font-abhaya flex items-center gap-3">
                <span className="w-1.5 h-6 bg-primary rounded-full" />
                Table of Contents
              </h3>
              <div
                className="quick-links-wrapper font-figtree"
                dangerouslySetInnerHTML={{ __html: settings?.investment_quick_links }}
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .font-abhaya { font-family: var(--font-abhaya), serif; }
        .font-figtree { font-family: var(--font-figtree), sans-serif; }
        .quick-links-wrapper :global(ul) {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .quick-links-wrapper :global(li) {
          padding-left: 0;
        }
        .quick-links-wrapper :global(a) {
          color: #71717a;
          text-decoration: none;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .quick-links-wrapper :global(a:hover) {
          color: #18181b;
          transform: translateX(4px);
        }
        .quick-links-wrapper :global(a::before) {
          content: "";
          width: 6px;
          height: 6px;
          background: #d4d4d8;
          border-radius: 50%;
          transition: background 0.3s ease;
        }
        .quick-links-wrapper :global(a:hover::before) {
          background: #8094A6;
        }

        @media (min-width: 768px) {
          .quick-links-wrapper :global(a) {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  );
}
