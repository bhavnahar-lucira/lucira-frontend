"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// "On this page" jump links for the gold rate city pages.
//
// Uses real <a href="#id"> anchors rather than JS scroll handlers, so the links are
// part of the markup React emits and a crawler that renders the page can follow
// them (goodreturns, by contrast, uses href="javascript:void(0)" + click handlers,
// which are invisible to crawlers). Native anchors also give free keyboard support
// and update the URL fragment, making a section shareable/linkable.
//
// Links come from buildGoldRateSections, which reads the same ids GoldMetaContent
// stamps onto its headings, so the list can't drift from the actual content.
//
// Collapsed to the first `visibleCount` items with a See more/less toggle. Hidden
// items stay in the DOM (display:none, not unmounted) so they're still present in
// the markup for crawlers instead of appearing only after a click.
export default function OnThisPage({ sections = [], visibleCount = 5 }) {
  const [expanded, setExpanded] = useState(false);

  if (!sections.length) return null;

  const hasMore = sections.length > visibleCount;

  return (
    <section className="bg-white py-8 md:py-10" aria-labelledby="on-this-page-title">
      <div className="container-main">
        <div className="max-w-6xl mx-auto px-4 md:px-0">
          <nav
            aria-label="On this page"
            className="bg-white border border-[#F2E3C6] rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(163,130,113,0.06)]"
          >
            <h2
              id="on-this-page-title"
              className="font-abhaya text-lg md:text-xl font-semibold text-zinc-900 px-5 md:px-6 py-4 border-b border-[#F2E3C6] bg-[#FFFDF9] m-0"
            >
              On this page
            </h2>

            <ul className="m-0 p-0 list-none">
              {sections.map((s, i) => {
                const hidden = hasMore && !expanded && i >= visibleCount;
                return (
                  <li
                    key={s.id}
                    className={`border-b border-[#F7ECD9] last:border-b-0 ${hidden ? "hidden" : ""}`}
                  >
                    <a
                      href={`#${s.id}`}
                      className="group flex items-start gap-2.5 px-5 md:px-6 py-3.5 md:py-4 no-underline transition-colors hover:bg-[#FAF3EC]/60"
                    >
                      <span
                        aria-hidden="true"
                        className="text-[#B77767] leading-6 shrink-0 transition-transform group-hover:translate-x-0.5"
                      >
                        &rsaquo;
                      </span>
                      <span className="font-figtree text-[15px] md:text-base text-zinc-700 leading-6 group-hover:text-[#B77767] transition-colors">
                        {s.label}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>

            {hasMore && (
              <div className="flex justify-center px-5 md:px-6 py-4 border-t border-[#F2E3C6] bg-[#FFFDF9]">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8D5B5] bg-white px-4 py-2 font-figtree text-[13px] font-semibold tracking-wide uppercase text-[#B77767] transition-colors hover:bg-[#FAF3EC] active:scale-95"
                >
                  {expanded ? "See less" : `See more (${sections.length - visibleCount})`}
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </section>
  );
}
