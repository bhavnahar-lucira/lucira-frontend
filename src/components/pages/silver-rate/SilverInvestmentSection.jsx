"use client";

import { useMemo } from "react";

export default function InvestmentSection({ cityName, settings }) {
  const {
    investment_heading = "WHY GOLD IS A SMART INVESTMENT",
    investment_description = "",
    investment_quick_links = ""
  } = settings || {};

  const replaceShortcodes = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
      .replaceAll('{{ page.metafields.custom.city_name.value }}', cityName)
      .replaceAll('{cityName}', cityName);
  };

  // Convert HTML string of <li> tags to an array if possible, or just render as HTML
  const hasQuickLinks = investment_quick_links && investment_quick_links.trim() !== "";

  return (
    <section className="py-8 md:py-10 bg-white">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[18px] md:text-[28px] font-medium text-black uppercase tracking-tight leading-tight">
              {investment_heading}
            </h2>
            <div
              className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed text-[14px] md:text-[18px] prose-a:text-primary prose-a:underline"
              dangerouslySetInnerHTML={{ __html: replaceShortcodes(investment_description) }}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-zinc-50 p-8 rounded-2xl sticky top-24">
              <h3 className="text-xl font-bold text-black mb-6 uppercase tracking-tight border-b border-zinc-200 pb-4">
                Table of Contents
              </h3>
              {hasQuickLinks ? (
                <ul
                  className="space-y-4 custom-quick-links prose-li:list-none prose-li:m-0 prose-a:no-underline prose-a:text-zinc-600 hover:prose-a:text-primary transition-colors"
                  dangerouslySetInnerHTML={{ __html: investment_quick_links }}
                />
              ) : (
                <p className="text-zinc-400 text-sm italic">No links available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-quick-links li {
            position: relative;
            padding-left: 1.5rem;
            margin-bottom: 1rem;
        }
        .custom-quick-links li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.6rem;
            width: 6px;
            height: 6px;
            background-color: #d4d4d8;
            border-radius: 9999px;
            transition: background-color 0.2s;
        }
        .custom-quick-links li:hover::before {
            background-color: var(--color-primary, #A68380);
        }
        .custom-quick-links a {
            color: #52525b;
            font-weight: 500;
            transition: color 0.2s;
        }
        .custom-quick-links a:hover {
            color: var(--color-primary, #A68380);
        }
      `}</style>
    </section>
  );
}
