"use client";

import { useState } from "react";

// Full React port of the Shopify Liquid `gold-rate-city-page` section.
// Content (intro, karat/hallmark/buying/investment/factors/festival/market blocks,
// FAQs, nearby city) comes from the Gold Rate City metaobject (Storefront API).
// Rate tables are computed from the live rates; trend tables from gold_rate_history.
// Styling reuses the global `.footer-pages` rules defined in GoldRatePage, so the
// look matches the previous (scraped) page.
export default function GoldMetaContent({
  goldMeta,
  cityName,
  stateName,
  rate24k, // per 10g
  rate22k, // per 10g
  rate24kYesterday, // per 10g
  currentDate,
}) {
  const [openFaq, setOpenFaq] = useState(null);

  const city = goldMeta.cityName || cityName || "Mumbai";
  const state = goldMeta.state || stateName || "";
  const nearby = goldMeta.nearbyCityName || "";
  const nearbyNote = goldMeta.nearbyCityNote || "";
  const history = Array.isArray(goldMeta.history) ? goldMeta.history : [];

  // Current rate = the gold_rate_history entry flagged is_current (else newest by date),
  // so gold_rate_history is the single source of truth for these rate tables. Props are fallback.
  const curEntry = history.find((e) => e.cur === "true") || history[0] || null;
  const yEntry = history.find((e) => e !== curEntry) || null;

  // All rate values are per 10 gram; divide by 10 for per-gram.
  const r24 = Math.round((curEntry && curEntry.r24) || Number(rate24k) || 0);
  const r22 = Math.round((curEntry && curEntry.r22) || Number(rate22k) || Math.round(r24 * 22 / 24));
  const r18 = Math.round((curEntry && curEntry.r18) || Math.round(r24 * 18 / 24));
  const r14 = Math.round((curEntry && curEntry.r14) || Math.round(r24 * 14 / 24));
  const per10 = { "24": r24, "22": r22, "18": r18, "14": r14 };
  const g = (k) => Math.round(per10[k] / 10); // per gram
  const fmt = (v) => "₹" + Math.round(v).toLocaleString("en-IN");
  const wt = (k, grams) => fmt(g(k) * grams);

  const y24 = Math.round((yEntry && yEntry.r24) || Number(rate24kYesterday) || 0);
  const y22 = Math.round((yEntry && yEntry.r22) || (y24 * 22 / 24));
  const y18 = Math.round((yEntry && yEntry.r18) || (y24 * 18 / 24));

  // Content blocks keyed by slug
  const bySlug = {};
  (goldMeta.blocks || []).forEach((b) => { if (b.slug) bySlug[b.slug] = b; });
  const factorsBlock = bySlug["factors-affecting-gold-prices"] || bySlug["factors-affecting-gold-price"];

  const renderBlockJsx = (block) =>
    block ? (
      <>
        {block.heading && <h2>{block.heading}</h2>}
        {block.html && <div dangerouslySetInnerHTML={{ __html: block.html }} />}
      </>
    ) : null;

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
            {goldMeta.introHtml && (
              <div dangerouslySetInnerHTML={{ __html: goldMeta.introHtml }} />
            )}

            {/* At a glance */}
            <h2>Today&apos;s Gold Rate in {city} at a Glance</h2>
            <p>Updated {currentDate} | All prices include 3% GST | Hallmark and making charges are additional.</p>
            <table>
              <thead><tr><th>Gold Type</th><th>Per Gram</th><th>Per 8g</th><th>Per 10g</th><th>Per 100g</th></tr></thead>
              <tbody>
                <tr><th scope="row">24 Carat (99.9%)</th><td>{fmt(g("24"))}</td><td>{wt("24", 8)}</td><td>{fmt(r24)}</td><td>{wt("24", 100)}</td></tr>
                <tr><th scope="row">22 Carat (91.6%)</th><td>{fmt(g("22"))}</td><td>{wt("22", 8)}</td><td>{fmt(r22)}</td><td>{wt("22", 100)}</td></tr>
                <tr><th scope="row">18 Carat (75%)</th><td>{fmt(g("18"))}</td><td>{wt("18", 8)}</td><td>{fmt(r18)}</td><td>{wt("18", 100)}</td></tr>
                <tr><th scope="row">14 Carat (58.5%)</th><td>{fmt(g("14"))}</td><td>{wt("14", 8)}</td><td>{fmt(r14)}</td><td>{wt("14", 100)}</td></tr>
              </tbody>
            </table>
            <p>Prices shown are indicative base rates. Actual jewellery prices will include making charges, GST, and stone setting costs.</p>

            {/* Today vs Yesterday */}
            {y24 > 0 && (
              <>
                <h2>Today vs Yesterday &mdash; Gold Rate Change in {city}</h2>
                <table>
                  <thead><tr><th>Karat</th><th>Today (₹/g)</th><th>Yesterday (₹/g)</th><th>Change</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">24 Carat (24K)</th><td>{fmt(g("24"))}</td><td>{fmt(Math.round(y24 / 10))}</td><td>{changeCell(g("24"), Math.round(y24 / 10))}</td></tr>
                    <tr><th scope="row">22 Carat (22K)</th><td>{fmt(g("22"))}</td><td>{fmt(Math.round(y22 / 10))}</td><td>{changeCell(g("22"), Math.round(y22 / 10))}</td></tr>
                    <tr><th scope="row">18 Carat (18K)</th><td>{fmt(g("18"))}</td><td>{fmt(Math.round(y18 / 10))}</td><td>{changeCell(g("18"), Math.round(y18 / 10))}</td></tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Karat breakdown block */}
            {renderBlockJsx(bySlug["gold-purity"])}

            {/* Weight tables */}
            <h3>24 Carat Gold Rate in {city} Today</h3>
            <table>
              <thead><tr><th>Weight</th><th>24K Gold Price in {city}</th></tr></thead>
              <tbody>
                {[1, 2, 5, 8, 10, 20, 50, 100, 1000].map((n) => (
                  <tr key={n}><th scope="row">{n === 8 ? "8 grams (Tola)" : n === 1000 ? "1 kilogram" : n + " grams"}</th><td>{wt("24", n)}</td></tr>
                ))}
              </tbody>
            </table>
            <h3>22 Carat Gold Rate in {city} Today (916 Gold)</h3>
            <table>
              <thead><tr><th>Weight</th><th>22K / 916 Gold Price in {city}</th></tr></thead>
              <tbody>
                {[1, 2, 5, 8, 10, 20, 50, 100, 1000].map((n) => (
                  <tr key={n}><th scope="row">{n === 8 ? "8 grams (Tola)" : n === 1000 ? "1 kilogram" : n + " grams"}</th><td>{wt("22", n)}</td></tr>
                ))}
              </tbody>
            </table>
            <h3>18 Carat Gold Rate in {city} Today</h3>
            <table>
              <thead><tr><th>Weight</th><th>18K Gold Price in {city}</th></tr></thead>
              <tbody>
                {[1, 5, 8, 10, 20, 100].map((n) => (
                  <tr key={n}><th scope="row">{n + " grams"}</th><td>{wt("18", n)}</td></tr>
                ))}
              </tbody>
            </table>
            <h3>14 Carat Gold Rate in {city} Today</h3>
            <table>
              <thead><tr><th>Weight</th><th>14K Gold Price in {city}</th></tr></thead>
              <tbody>
                {[1, 10, 100].map((n) => (
                  <tr key={n}><th scope="row">{n + " grams"}</th><td>{wt("14", n)}</td></tr>
                ))}
              </tbody>
            </table>

            {/* Purity comparison */}
            <h2>Gold Karat Purity Comparison &mdash; {city} Buying Guide</h2>
            <table>
              <thead><tr><th>Karat</th><th>Purity</th><th>Hallmark</th><th>Best For</th><th>Relative Price</th></tr></thead>
              <tbody>
                <tr><th scope="row">24K</th><td>99.9%</td><td>999</td><td>Investment, coins, bars</td><td>Highest</td></tr>
                <tr><th scope="row">22K</th><td>91.6%</td><td>916</td><td>Traditional jewellery</td><td>High</td></tr>
                <tr><th scope="row">18K</th><td>75%</td><td>750</td><td>Diamond jewellery, modern designs</td><td>Moderate</td></tr>
                <tr><th scope="row">14K</th><td>58.5%</td><td>585</td><td>Lightweight, fashion jewellery</td><td>Lower</td></tr>
              </tbody>
            </table>

            {/* Hallmark block + code table */}
            {renderBlockJsx(bySlug["hallmark-guide"])}
            <table>
              <thead><tr><th>Hallmark Code</th><th>Purity</th><th>Karat</th><th>Usage</th></tr></thead>
              <tbody>
                <tr><th scope="row">999</th><td>99.9%</td><td>24K</td><td>Gold bars, coins, investment-grade gold</td></tr>
                <tr><th scope="row">958</th><td>95.8%</td><td>23K</td><td>Rarely used in Indian jewellery market</td></tr>
                <tr><th scope="row">916</th><td>91.6%</td><td>22K</td><td>Traditional jewellery &mdash; most common in {city}</td></tr>
                <tr><th scope="row">875</th><td>87.5%</td><td>21K</td><td>Used in select Middle Eastern designs</td></tr>
                <tr><th scope="row">750</th><td>75%</td><td>18K</td><td>Diamond and designer jewellery</td></tr>
                <tr><th scope="row">585</th><td>58.5%</td><td>14K</td><td>Fashion and export jewellery</td></tr>
              </tbody>
            </table>

            {/* Weekly trend */}
            {weekly.length > 0 && (
              <>
                <h2>Weekly Gold Price Trend in {city} (Last 7 Days)</h2>
                <table>
                  <thead><tr><th>Date</th><th>22K (₹/g)</th><th>24K (₹/g)</th><th>18K (₹/g)</th><th>Market Note</th></tr></thead>
                  <tbody>
                    {weekly.map((e, i) => (
                      <tr key={i}>
                        <th scope="row">{dayName(e.date)}</th>
                        <td>{fmt(Math.round(e.r22 / 10))}</td>
                        <td>{fmt(Math.round(e.r24 / 10))}</td>
                        <td>{fmt(Math.round(e.r18 / 10))}</td>
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
                <h2>Monthly Gold Rate Trend in {city} &mdash; Last 12 Months</h2>
                <table>
                  <thead><tr><th>Month</th><th>22K (₹/g)</th><th>24K (₹/g)</th><th>18K (₹/g)</th></tr></thead>
                  <tbody>
                    {monthly.map((e, i) => (
                      <tr key={i}>
                        <th scope="row">{monthName(e.date)}</th>
                        <td>{fmt(Math.round(e.r22 / 10))}</td>
                        <td>{fmt(Math.round(e.r24 / 10))}</td>
                        <td>{fmt(Math.round(e.r18 / 10))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Nearby city */}
            {nearby && (
              <>
                <h2>Today&apos;s Gold Rate in {nearby}</h2>
                <p>{nearbyNote || ("Gold rates in " + nearby + " are the same as " + city + ".")}</p>
                <table>
                  <thead><tr><th>Karat / Purity</th><th>Per Gram</th><th>Per 10 Gram</th><th>Notes</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">24K (999 purity)</th><td>{fmt(g("24"))}</td><td>{fmt(r24)}</td><td>Investment gold</td></tr>
                    <tr><th scope="row">22K / 916</th><td>{fmt(g("22"))}</td><td>{fmt(r22)}</td><td>Jewellery gold</td></tr>
                    <tr><th scope="row">18K (750 purity)</th><td>{fmt(g("18"))}</td><td>{fmt(r18)}</td><td>Diamond jewellery</td></tr>
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
                <tr><th scope="row">Base Gold Rate</th><td>MCX / IBJA rate</td><td>Published daily &mdash; forms the base of your jewellery cost</td></tr>
                <tr><th scope="row">Making Charges</th><td>₹300 – ₹1,500/g</td><td>Higher for handcrafted, designer, and intricate pieces</td></tr>
                <tr><th scope="row">GST</th><td>3%</td><td>On gold value + making charges</td></tr>
                <tr><th scope="row">Wastage / Karigar</th><td>0–5%</td><td>Applies to handmade jewellery, charged by some retailers</td></tr>
                <tr><th scope="row">Stone / Diamond Cost</th><td>Market rate</td><td>Additional for gemstone-set jewellery</td></tr>
                <tr><th scope="row">Hallmarking Fee</th><td>₹35–₹45/piece</td><td>Mandatory BIS hallmarking charge</td></tr>
              </tbody>
            </table>

            {/* Investment guide + comparison */}
            {renderBlockJsx(bySlug["investment-guide"])}
            <h3>Gold vs Other Investments &mdash; {city} Perspective</h3>
            <table>
              <thead><tr><th>Factor</th><th>Gold</th><th>Fixed Deposit</th><th>Equity MF</th><th>SGBs</th><th>PPF</th></tr></thead>
              <tbody>
                <tr><th scope="row">Liquidity</th><td>High</td><td>Medium</td><td>Low</td><td>Low</td><td>High</td></tr>
                <tr><th scope="row">Inflation Hedge</th><td>Strong</td><td>Weak</td><td>Variable</td><td>Strong</td><td>Moderate</td></tr>
                <tr><th scope="row">Returns (10yr avg)</th><td>10–13%</td><td>6–7%</td><td>12–15%</td><td>10–13%</td><td>7–8%</td></tr>
                <tr><th scope="row">Risk Level</th><td>Moderate</td><td>Low</td><td>High</td><td>Moderate</td><td>Low</td></tr>
                <tr><th scope="row">Tax on Returns</th><td>LTCG 20%</td><td>Taxable</td><td>LTCG 10%</td><td>Tax-free</td><td>Tax-free</td></tr>
                <tr><th scope="row">Storage Cost</th><td>Yes (locker)</td><td>None</td><td>None</td><td>None (Demat)</td><td>None</td></tr>
                <tr><th scope="row">Jewellery Utility</th><td>Yes</td><td>No</td><td>No</td><td>No</td><td>No</td></tr>
              </tbody>
            </table>

            {/* Factors + table */}
            {renderBlockJsx(factorsBlock)}
            <h3>Key Factors &mdash; How They Influence the {city} Gold Rate</h3>
            <table>
              <thead><tr><th>Factor</th><th>How It Influences {city} Gold Rate</th></tr></thead>
              <tbody>
                <tr><th scope="row">International Spot Price</th><td>The LBMA sets the global USD price per troy ounce.</td></tr>
                <tr><th scope="row">USD-INR Exchange Rate</th><td>As gold is imported, a weaker rupee directly raises the {city} gold rate.</td></tr>
                <tr><th scope="row">Import Duty</th><td>India levies import duty on gold. Budget changes affect rates immediately.</td></tr>
                <tr><th scope="row">MCX Rates</th><td>Multi Commodity Exchange futures prices serve as the daily benchmark in India.</td></tr>
                <tr><th scope="row">IBJA Rates</th><td>India Bullion and Jewellers Association announces standard daily reference rates.</td></tr>
                <tr><th scope="row">State Taxes &amp; Levies</th><td>{state || "State"} applies its own levies; rates may differ marginally.</td></tr>
                <tr><th scope="row">GST</th><td>3% GST applies on gold value and making charges at point of purchase.</td></tr>
                <tr><th scope="row">Local Demand</th><td>Festival season can add a 1–3% premium.</td></tr>
              </tbody>
            </table>

            {/* Festival + calendar */}
            {renderBlockJsx(bySlug["festival-calendar"])}
            <h3>{city} Gold Buying Calendar</h3>
            <table>
              <thead><tr><th>Month/Period</th><th>Occasion</th><th>Demand Level</th><th>Buying Note</th></tr></thead>
              <tbody>
                <tr><th scope="row">October/November</th><td>Dhanteras</td><td>Very High</td><td>Highest gold sales day in India &mdash; prices may carry a 1–3% premium</td></tr>
                <tr><th scope="row">April/May</th><td>Akshaya Tritiya</td><td>Very High</td><td>Considered most auspicious; advance booking recommended</td></tr>
                <tr><th scope="row">November–February</th><td>Wedding Season</td><td>Very High</td><td>Trousseau and gift buying peaks; plan 30–60 days in advance</td></tr>
                <tr><th scope="row">January 14</th><td>Makar Sankranti</td><td>Moderate</td><td>Gifting gold is customary</td></tr>
                <tr><th scope="row">June–August (Monsoon)</th><td>Slow Season</td><td>Low</td><td>Historically lower prices and demand &mdash; good buying window for investors</td></tr>
              </tbody>
            </table>

            {/* Market guide */}
            {renderBlockJsx(bySlug["market-guide"])}
          </div>

          {/* Karat rate cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-4">
            {[["24K", r24], ["22K", r22], ["18K", r18], ["14K", r14]].map(([k, v]) => (
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

      {/* FAQ */}
      {(goldMeta.faqs || []).length > 0 && (
        <div className="container-main">
          <div className="max-w-6xl mx-auto px-4 md:px-0">
            <div className="footer-pages border-t border-zinc-200 pt-4 md:pt-6">
              <h2>Frequently Asked Questions &mdash; Gold Rate in {city}</h2>
              {goldMeta.faqs.map((f, i) => (
                <details key={i} open={openFaq === i} onToggle={(e) => { if (e.target.open) setOpenFaq(i); else if (openFaq === i) setOpenFaq(null); }}>
                  <summary>{f.question}</summary>
                  <div dangerouslySetInnerHTML={{ __html: f.answerHtml }} />
                </details>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
