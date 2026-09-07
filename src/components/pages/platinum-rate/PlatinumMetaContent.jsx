"use client";

import { useState } from "react";
import { PLATINUM_STATIC_SECTION_IDS as S } from "@/lib/platinumRateSections";

// Mirror of GoldMetaContent for the platinum rate city pages.
// Content (intro, purity/hallmark/buying/investment/factors/festival/market blocks,
// FAQs, nearby city) comes from the Platinum Rate City metaobject (Storefront API).
// Rate tables are computed from the live rates; trend tables from platinum_rate_history.
// Styling reuses the global `.footer-pages` rules defined in PlatinumRatePage, so the
// look matches the gold rate pages exactly.
export default function PlatinumMetaContent({
  platinumMeta,
  cityName,
  stateName,
  rate950, // per gram
  rate900, // per gram
  rate950Yesterday, // per gram
  currentDate,
}) {
  const [openFaq, setOpenFaq] = useState(null);

  const city = platinumMeta.cityName || cityName || "Mumbai";
  const state = platinumMeta.state || stateName || "";
  const nearby = platinumMeta.nearbyCityName || "";
  const nearbyNote = platinumMeta.nearbyCityNote || "";
  const history = Array.isArray(platinumMeta.history) ? platinumMeta.history : [];

  // Current rate = the platinum_rate_history entry flagged is_current (else newest
  // by date), so platinum_rate_history is the single source of truth for these
  // rate tables. Props are fallback.
  const curEntry = history.find((e) => e.cur === "true") || history[0] || null;
  const yEntry = history.find((e) => e !== curEntry) || null;

  // All rate values are per gram (platinum_rate_history stores per-gram rates).
  const r950 = Math.round((curEntry && curEntry.r950) || Number(rate950) || 0);
  const r900 = Math.round((curEntry && curEntry.r900) || Number(rate900) || Math.round(r950 * 90 / 95));
  const fmt = (v) => "₹" + Math.round(v).toLocaleString("en-IN");
  const wt = (rate, grams) => fmt(rate * grams);

  const y950 = Math.round((yEntry && yEntry.r950) || Number(rate950Yesterday) || 0);
  const y900 = Math.round((yEntry && yEntry.r900) || (y950 * 90 / 95));

  // Content blocks keyed by slug
  const bySlug = {};
  (platinumMeta.blocks || []).forEach((b) => { if (b.slug) bySlug[b.slug] = b; });
  const factorsBlock = bySlug["factors-affecting-platinum-prices"] || bySlug["factors-affecting-platinum-price"];

  // anchorId is the city-stripped slug, so the same fragment resolves on every
  // city page and the OnThisPage links stay valid.
  const renderBlockJsx = (block) =>
    block ? (
      <>
        {block.heading && (
          <h2 id={block.anchorId || undefined} className="scroll-mt-24">
            {block.heading}
          </h2>
        )}
        {block.html && <div dangerouslySetInnerHTML={{ __html: block.html }} />}
      </>
    ) : null;

  // Named slots above cover a fixed set of slugs, each paired with a hardcoded
  // table. Any other active block authored in Shopify renders here, in
  // sort_order, so every authored block reaches the page.
  const KNOWN_SLUGS = new Set([
    "platinum-purity",
    "hallmark-guide",
    "buying-guide",
    "investment-guide",
    "factors-affecting-platinum-prices",
    "factors-affecting-platinum-price",
    "festival-calendar",
    "market-guide",
  ]);
  const extraBlocks = (platinumMeta.blocks || [])
    .filter((b) => b.slug && !KNOWN_SLUGS.has(b.slug))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));

  // SEO: FAQPage + BreadcrumbList structured data, generated from the same
  // metaobject content the page renders, so schema can never drift from the
  // visible copy. Emitted in the SSR HTML (Next.js pre-renders this component).
  const SITE_URL = "https://www.lucirajewelry.com";
  const citySlugForUrl = (city || "").toLowerCase().replace(/\s+/g, "-");
  const pageUrl = `${SITE_URL}/pages/${citySlugForUrl}-platinum-rate-today`;
  const stripHtml = (h) => (h || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const faqJsonLd = (platinumMeta.faqs || []).length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: platinumMeta.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: stripHtml(f.answerHtml) },
        })),
      }
    : null;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `Platinum Rate Today in ${city}`, item: pageUrl },
    ],
  };

  const changeCell = (today, yday) => {
    if (!yday) return "—";
    const d = today - yday;
    if (d > 0) return "▲ ₹" + Math.abs(d).toLocaleString("en-IN");
    if (d < 0) return "▼ ₹" + Math.abs(d).toLocaleString("en-IN");
    return "— No change";
  };

  const weekly = history.slice(0, 7);
  // Month-end: first entry seen per YYYY-MM
  const monthly = [];
  const seen = new Set();
  for (const e of history) {
    const key = (e.date || "").slice(0, 7);
    if (key && !seen.has(key)) { seen.add(key); monthly.push(e); }
    if (monthly.length >= 12) break;
  }
  const monthName = (d) => {
    try {
      return new Date(d).toLocaleString("en-IN", { month: "long", year: "numeric" });
    } catch { return d; }
  };
  const dayName = (d) => {
    try {
      return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return d; }
  };

  return (
    <section className="py-8 md:py-12 bg-[#FAF3EC]/30">
      <div className="container-main">
        <div className="max-w-6xl mx-auto px-4 md:px-0">
          <div className="footer-pages border-t border-zinc-200 pt-4 md:pt-6">
            {platinumMeta.introHtml && (
              <div dangerouslySetInnerHTML={{ __html: platinumMeta.introHtml }} />
            )}

            {/* At a glance */}
            <h2 id={S.atAGlance} className="scroll-mt-24">Today&apos;s Platinum Rate in {city} at a Glance</h2>
            <p>Updated {currentDate} | All prices include 3% GST | Hallmark and making charges are additional.</p>
            <table>
              <thead><tr><th>Platinum Type</th><th>Per Gram</th><th>Per 8g</th><th>Per 10g</th><th>Per 100g</th></tr></thead>
              <tbody>
                <tr><th scope="row">950 Platinum (95%)</th><td>{fmt(r950)}</td><td>{wt(r950, 8)}</td><td>{wt(r950, 10)}</td><td>{wt(r950, 100)}</td></tr>
                <tr><th scope="row">900 Platinum (90%)</th><td>{fmt(r900)}</td><td>{wt(r900, 8)}</td><td>{wt(r900, 10)}</td><td>{wt(r900, 100)}</td></tr>
              </tbody>
            </table>
            <p>Prices shown are indicative base rates. Actual jewellery prices will include making charges, GST, and stone setting costs.</p>

            {/* Today vs Yesterday */}
            {y950 > 0 && (
              <>
                <h2 id={S.todayVsYesterday} className="scroll-mt-24">Today vs Yesterday - Platinum Rate Change in {city}</h2>
                <table>
                  <thead><tr><th>Purity</th><th>Today (₹/g)</th><th>Yesterday (₹/g)</th><th>Change</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">950 Platinum (Pt 950)</th><td>{fmt(r950)}</td><td>{fmt(y950)}</td><td>{changeCell(r950, y950)}</td></tr>
                    <tr><th scope="row">900 Platinum (Pt 900)</th><td>{fmt(r900)}</td><td>{fmt(y900)}</td><td>{changeCell(r900, y900)}</td></tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Purity breakdown block */}
            {renderBlockJsx(bySlug["platinum-purity"])}

            {/* Weight tables */}
            <h3>950 Platinum Rate in {city} Today (Pt 950)</h3>
            <table>
              <thead><tr><th>Weight</th><th>950 Platinum Price in {city}</th></tr></thead>
              <tbody>
                {[1, 2, 5, 8, 10, 20, 50, 100].map((n) => (
                  <tr key={n}><th scope="row">{n === 8 ? "8 grams (Tola)" : n + " grams"}</th><td>{wt(r950, n)}</td></tr>
                ))}
              </tbody>
            </table>
            <h3>900 Platinum Rate in {city} Today</h3>
            <table>
              <thead><tr><th>Weight</th><th>900 Platinum Price in {city}</th></tr></thead>
              <tbody>
                {[1, 5, 8, 10, 20, 100].map((n) => (
                  <tr key={n}><th scope="row">{n + " grams"}</th><td>{wt(r900, n)}</td></tr>
                ))}
              </tbody>
            </table>

            {/* Purity comparison */}
            <h2 id={S.purityComparison} className="scroll-mt-24">Platinum Purity Comparison - {city} Buying Guide</h2>
            <table>
              <thead><tr><th>Grade</th><th>Purity</th><th>Hallmark</th><th>Best For</th><th>Relative Price</th></tr></thead>
              <tbody>
                <tr><th scope="row">Pt 999</th><td>99.9%</td><td>999</td><td>Investment, coins, bars</td><td>Highest</td></tr>
                <tr><th scope="row">Pt 950</th><td>95%</td><td>950</td><td>Jewellery — most common standard</td><td>High</td></tr>
                <tr><th scope="row">Pt 900</th><td>90%</td><td>900</td><td>Heavier settings, durable designs</td><td>Moderate</td></tr>
                <tr><th scope="row">Pt 850</th><td>85%</td><td>850</td><td>Chains and findings</td><td>Lower</td></tr>
              </tbody>
            </table>

            {/* Hallmark block + code table */}
            {renderBlockJsx(bySlug["hallmark-guide"])}
            <table>
              <thead><tr><th>Hallmark Code</th><th>Purity</th><th>Grade</th><th>Usage</th></tr></thead>
              <tbody>
                <tr><th scope="row">999</th><td>99.9%</td><td>Pt 999</td><td>Platinum bars, coins, investment-grade platinum</td></tr>
                <tr><th scope="row">950</th><td>95%</td><td>Pt 950</td><td>Jewellery, most common in {city}</td></tr>
                <tr><th scope="row">900</th><td>90%</td><td>Pt 900</td><td>Heavier settings and durable designs</td></tr>
                <tr><th scope="row">850</th><td>85%</td><td>Pt 850</td><td>Chains, clasps and findings</td></tr>
              </tbody>
            </table>

            {/* Weekly trend */}
            {weekly.length > 0 && (
              <>
                <h2 id={S.weeklyTrend} className="scroll-mt-24">Weekly Platinum Price Trend in {city} (Last 7 Days)</h2>
                <table>
                  <thead><tr><th>Date</th><th>950 (₹/g)</th><th>900 (₹/g)</th><th>Market Note</th></tr></thead>
                  <tbody>
                    {weekly.map((e, i) => (
                      <tr key={i}>
                        <th scope="row">{dayName(e.date)}</th>
                        <td>{fmt(e.r950)}</td>
                        <td>{fmt(e.r900)}</td>
                        <td>{e.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Monthly trend */}
            {monthly.length > 0 && (
              <>
                <h2 id={S.monthlyTrend} className="scroll-mt-24">Monthly Platinum Rate Trend in {city} - Last 12 Months</h2>
                <table>
                  <thead><tr><th>Month</th><th>950 (₹/g)</th><th>900 (₹/g)</th></tr></thead>
                  <tbody>
                    {monthly.map((e, i) => (
                      <tr key={i}>
                        <th scope="row">{monthName(e.date)}</th>
                        <td>{fmt(e.r950)}</td>
                        <td>{fmt(e.r900)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Nearby city */}
            {nearby && (
              <>
                <h2 id={S.nearbyCity} className="scroll-mt-24">Today&apos;s Platinum Rate in {nearby}</h2>
                <p>{nearbyNote || ("Platinum rates in " + nearby + " are the same as " + city + ".")}</p>
                <table>
                  <thead><tr><th>Purity</th><th>Per Gram</th><th>Per 10 Gram</th><th>Notes</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">950 Platinum (Pt 950)</th><td>{fmt(r950)}</td><td>{wt(r950, 10)}</td><td>Jewellery standard</td></tr>
                    <tr><th scope="row">900 Platinum (Pt 900)</th><td>{fmt(r900)}</td><td>{wt(r900, 10)}</td><td>Durable settings</td></tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Buying guide + cost table */}
            {renderBlockJsx(bySlug["buying-guide"])}
            <h3>How Jewellery Prices Are Calculated in {city}</h3>
            <table>
              <thead><tr><th>Component</th><th>Approximate Range</th><th>Notes</th></tr></thead>
              <tbody>
                <tr><th scope="row">Base Platinum Rate</th><td>International / LPPM rate</td><td>Published daily, forms the base of your jewellery cost</td></tr>
                <tr><th scope="row">Making Charges</th><td>₹500 – ₹1,500/g</td><td>Higher than gold — platinum is harder to craft; intricate pieces cost more</td></tr>
                <tr><th scope="row">GST</th><td>3%</td><td>On platinum value + making charges</td></tr>
                <tr><th scope="row">Wastage / Karigar</th><td>0–5%</td><td>Applies to handmade jewellery, charged by some retailers</td></tr>
                <tr><th scope="row">Stone / Diamond Cost</th><td>Market rate</td><td>Additional for gemstone-set jewellery</td></tr>
                <tr><th scope="row">Hallmarking Fee</th><td>₹45/piece</td><td>BIS hallmarking charge for platinum articles</td></tr>
              </tbody>
            </table>

            {/* Investment guide + comparison */}
            {renderBlockJsx(bySlug["investment-guide"])}
            <h3>Platinum vs Other Investments - {city} Perspective</h3>
            <table>
              <thead><tr><th>Factor</th><th>Platinum</th><th>Fixed Deposit</th><th>Equity MF</th><th>Gold</th><th>PPF</th></tr></thead>
              <tbody>
                <tr><th scope="row">Liquidity</th><td>Moderate</td><td>Medium</td><td>Low</td><td>High</td><td>High</td></tr>
                <tr><th scope="row">Inflation Hedge</th><td>Moderate</td><td>Weak</td><td>Variable</td><td>Strong</td><td>Moderate</td></tr>
                <tr><th scope="row">Returns (10yr avg)</th><td>Variable</td><td>6–7%</td><td>12–15%</td><td>10–13%</td><td>7–8%</td></tr>
                <tr><th scope="row">Risk Level</th><td>Moderate–High</td><td>Low</td><td>High</td><td>Moderate</td><td>Low</td></tr>
                <tr><th scope="row">Tax on Returns</th><td>LTCG 20%</td><td>Taxable</td><td>LTCG 10%</td><td>LTCG 20%</td><td>Tax-free</td></tr>
                <tr><th scope="row">Storage Cost</th><td>Yes (locker)</td><td>None</td><td>None</td><td>Yes (locker)</td><td>None</td></tr>
                <tr><th scope="row">Jewellery Utility</th><td>Yes</td><td>No</td><td>No</td><td>Yes</td><td>No</td></tr>
              </tbody>
            </table>

            {/* Factors + table */}
            {renderBlockJsx(factorsBlock)}
            <h3>Key Factors - How They Influence the {city} Platinum Rate</h3>
            <table>
              <thead><tr><th>Factor</th><th>How It Influences {city} Platinum Rate</th></tr></thead>
              <tbody>
                <tr><th scope="row">International Spot Price</th><td>The London Platinum and Palladium Market (LPPM) sets the global USD price per troy ounce.</td></tr>
                <tr><th scope="row">USD-INR Exchange Rate</th><td>As platinum is imported, a weaker rupee directly raises the {city} platinum rate.</td></tr>
                <tr><th scope="row">Import Duty</th><td>India levies import duty on platinum. Budget changes affect rates immediately.</td></tr>
                <tr><th scope="row">Auto-Catalyst Demand</th><td>Catalytic converters account for a large share of global platinum consumption.</td></tr>
                <tr><th scope="row">Industrial Demand</th><td>Electronics, medical devices and chemical industries consume significant platinum supply.</td></tr>
                <tr><th scope="row">Supply Concentration</th><td>Most platinum is mined in South Africa and Russia — supply disruptions move prices sharply.</td></tr>
                <tr><th scope="row">GST</th><td>3% GST applies on platinum value and making charges at point of purchase.</td></tr>
                <tr><th scope="row">Local Demand</th><td>Wedding season and gifting occasions can add a 1–3% premium.</td></tr>
              </tbody>
            </table>

            {/* Festival + calendar */}
            {renderBlockJsx(bySlug["festival-calendar"])}
            <h3>{city} Platinum Buying Calendar</h3>
            <table>
              <thead><tr><th>Month/Period</th><th>Occasion</th><th>Demand Level</th><th>Buying Note</th></tr></thead>
              <tbody>
                <tr><th scope="row">November–February</th><td>Wedding Season</td><td>Very High</td><td>Platinum engagement rings and wedding bands peak; plan 30–60 days in advance</td></tr>
                <tr><th scope="row">February</th><td>Valentine&apos;s Day</td><td>High</td><td>Platinum love bands and couple rings see strong gifting demand</td></tr>
                <tr><th scope="row">October/November</th><td>Dhanteras</td><td>High</td><td>Precious metal buying is auspicious; platinum increasingly chosen alongside gold</td></tr>
                <tr><th scope="row">April/May</th><td>Akshaya Tritiya</td><td>High</td><td>Considered most auspicious; advance booking recommended</td></tr>
                <tr><th scope="row">June–August (Monsoon)</th><td>Slow Season</td><td>Low</td><td>Historically lower demand, good buying window for investors</td></tr>
              </tbody>
            </table>

            {/* Market guide */}
            {renderBlockJsx(bySlug["market-guide"])}

            {/* Any additional authored content blocks without a named slot above */}
            {extraBlocks.map((b) => (
              <div key={b.slug}>{renderBlockJsx(b)}</div>
            ))}
          </div>

          {/* Purity rate cards */}
          <div className="grid grid-cols-2 gap-4 mt-8 mb-4">
            {[["Pt 950", r950], ["Pt 900", r900]].map(([k, v]) => (
              <div key={k} className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
                <span className="text-zinc-400 text-[11px] md:text-xs font-medium uppercase tracking-wider font-figtree">{k}</span>
                <span className="text-zinc-900 text-xl md:text-2xl font-bold font-figtree">{fmt(v)}</span>
              </div>
            ))}
          </div>
          {currentDate && (
            <p className="text-zinc-500 text-xs md:text-sm font-figtree mb-8">Updated {currentDate}</p>
          )}
        </div>
      </div>

      {/* FAQ — dedicated minimal styling (gold-faq), intentionally NOT inside
          .footer-pages so the heavy card styles in globals.css don't apply. */}
      {(platinumMeta.faqs || []).length > 0 && (
        <div className="container-main">
          <div className="max-w-6xl mx-auto px-4 md:px-0">
            <div className="gold-faq border-t border-zinc-200 pt-8 md:pt-10 pb-2">
              <h2 id={S.faq} className="gold-faq-title scroll-mt-24">Frequently Asked Questions</h2>
              <p className="gold-faq-sub">Platinum rate in {city}: buying, purity, tax and investment, answered briefly.</p>
              <div className="gold-faq-list">
                {platinumMeta.faqs.map((f, i) => (
                  <details key={i} open={openFaq === i} onToggle={(e) => { if (e.target.open) setOpenFaq(i); else if (openFaq === i) setOpenFaq(null); }}>
                    <summary>
                      <span className="gold-faq-q">{f.question}</span>
                      <span className="gold-faq-icon" aria-hidden="true" />
                    </summary>
                    <div className="gold-faq-a" dangerouslySetInnerHTML={{ __html: f.answerHtml }} />
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Structured data (server-rendered into the initial HTML) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <style jsx global>{`
        /* ── Minimal FAQ (gold-faq) — shared look with the gold rate pages ── */
        .gold-faq-title {
          font-family: var(--font-abhaya), serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #18181b;
          line-height: 1.2;
          margin: 0;
        }
        .gold-faq-title::after {
          content: "";
          display: block;
          width: 56px;
          height: 3px;
          margin-top: 0.6rem;
          border-radius: 9999px;
          background: linear-gradient(90deg, #d4b392, #f2e3c6);
        }
        .gold-faq-sub {
          font-family: var(--font-figtree), sans-serif;
          color: #71717a;
          font-size: 0.95rem;
          margin: 0.85rem 0 1.6rem;
        }
        .gold-faq-list {
          background: #fff;
          border: 1px solid #f2e3c6;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(163, 130, 113, 0.06);
        }
        .gold-faq-list details {
          border-bottom: 1px solid #f7ecd9;
        }
        .gold-faq-list details:last-child {
          border-bottom: none;
        }
        .gold-faq-list summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.25rem;
          transition: background-color 0.25s ease;
        }
        .gold-faq-list summary::-webkit-details-marker {
          display: none;
        }
        .gold-faq-list summary::after {
          content: none;
        }
        .gold-faq-list summary:hover {
          background: rgba(250, 243, 236, 0.55);
        }
        .gold-faq-list details[open] summary {
          background: #fffdf9;
        }
        .gold-faq-q {
          font-family: var(--font-figtree), sans-serif;
          font-weight: 500;
          font-size: 1rem;
          color: #27272a;
          line-height: 1.45;
          transition: color 0.25s ease;
        }
        .gold-faq-list details[open] .gold-faq-q {
          color: #3f332a;
          font-weight: 600;
        }
        .gold-faq-icon {
          position: relative;
          flex: 0 0 auto;
          width: 1.65rem;
          height: 1.65rem;
          border-radius: 9999px;
          border: 1px solid #e8d5b5;
          background: #fffdf9;
          transition: transform 0.3s ease, background-color 0.3s ease;
        }
        .gold-faq-icon::before,
        .gold-faq-icon::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0.65rem;
          height: 1.5px;
          background: #a3826f;
          transform: translate(-50%, -50%);
        }
        .gold-faq-icon::after {
          transform: translate(-50%, -50%) rotate(90deg);
        }
        .gold-faq-list details[open] .gold-faq-icon {
          transform: rotate(45deg);
          background: #f2e3c6;
        }
        .gold-faq-a {
          padding: 0.15rem 3.5rem 1.1rem 1.25rem;
          font-family: var(--font-figtree), sans-serif;
          color: #52525b;
          font-size: 0.95rem;
          line-height: 1.7;
          animation: goldFaqIn 0.25s ease;
        }
        .gold-faq-a p {
          margin: 0 0 0.55rem;
        }
        .gold-faq-a p:last-child {
          margin-bottom: 0;
        }
        @keyframes goldFaqIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (min-width: 768px) {
          .gold-faq-title {
            font-size: 2.1rem;
          }
          .gold-faq-list summary {
            padding: 1.15rem 1.5rem;
          }
          .gold-faq-q {
            font-size: 1.08rem;
          }
          .gold-faq-a {
            padding: 0.15rem 4rem 1.25rem 1.5rem;
            font-size: 1rem;
          }
        }
      `}</style>
    </section>
  );
}
