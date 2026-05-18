"use client";

import { useMemo } from "react";
import { Phone, Mail, MapPin } from "lucide-react";

export default function PlatinumInformationContent({ cityName, stateName, sectionData, currentDate, todayRate }) {
  const { settings, blocks, block_order } = sectionData || {};

  const replaceShortcodes = (text) => {
    if (!text || typeof text !== 'string') return text;
    let processed = text
      .replaceAll('{{ page.metafields.custom.city_name.value }}', cityName)
      .replaceAll('{{ page.metafields.custom.state_name.value }}', stateName)
      .replaceAll('{cityName}', cityName)
      .replaceAll('{stateName}', stateName);

    if (currentDate) {
      processed = processed.replaceAll('[current_date]', currentDate);
    }

    if (todayRate) {
      const ratePerGram = todayRate / 10;

      // Shortcodes defined in liquid
      processed = processed.replaceAll('[platinum_rate_999]', `₹${Math.round(ratePerGram).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[platinum_rate_950]', `₹${Math.round(ratePerGram * (950 / 1000)).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[platinum_rate_900]', `₹${Math.round(ratePerGram * (900 / 1000)).toLocaleString('en-IN')}`);

      processed = processed.replaceAll('[platinum_rate_999_10gm]', `₹${Math.round(ratePerGram * 10).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[platinum_rate_950_10gm]', `₹${Math.round(ratePerGram * 10 * (950 / 1000)).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[platinum_rate_900_10gm]', `₹${Math.round(ratePerGram * 10 * (900 / 1000)).toLocaleString('en-IN')}`);

      // Placeholder replacements from JSON
      processed = processed.replaceAll('<platinum rate>', `₹${Math.round(ratePerGram).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('&lt;platinum rate&gt;', `₹${Math.round(ratePerGram).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('<10* platinum rate>', `₹${Math.round(ratePerGram * 10).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('&lt;10* platinum rate&gt;', `₹${Math.round(ratePerGram * 10).toLocaleString('en-IN')}`);
      processed = processed.replaceAll('[platinum_price_1g]', `₹${Math.round(ratePerGram).toLocaleString('en-IN')}`);
    }

    return processed;
  };

  const storeBlocks = useMemo(() => {
    if (!blocks) return [];
    return Object.values(blocks).filter(b => b.type === 'store_location');
  }, [blocks]);

  const contentBlocks = useMemo(() => {
    if (!blocks || !block_order) return [];
    return block_order
      .map(id => blocks[id])
      .filter(b => b.type === 'heading' || b.type === 'richtext');
  }, [blocks, block_order]);

  return (
    <section className="information-content-section py-2 md:py-4 bg-white">
      <div className="container-main">
        {/* Store Locations Header */}
        {storeBlocks.length > 0 && (
          <div className="address-locations-footer mb-20 border-b border-zinc-50 pb-20">
            <div className="max-w-xl mb-12">
              <h3 className="text-[18px] md:text-[28px] font-medium text-zinc-900 mb-4 uppercase tracking-tight font-abhaya">
                {settings?.stores_heading || "Lucira's Experience Stores"}
              </h3>
              <div className="h-1 w-16 bg-primary rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {storeBlocks.map((block, idx) => (
                <div key={idx} className="store-location-item space-y-6">
                  <h4 className="text-[16px] md:text-[20px] font-bold text-zinc-900 uppercase tracking-widest font-abhaya">
                    {block.settings.store_name}
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-4 text-[14px] md:text-[18px] text-zinc-500 font-figtree">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-primary">
                        <Phone size={16} />
                      </div>
                      <a href={`tel:${block.settings.phone}`} className="hover:text-primary transition-colors">{block.settings.phone}</a>
                    </li>
                    <li className="flex items-center gap-4 text-[14px] md:text-[18px] text-zinc-500 font-figtree">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-primary">
                        <Mail size={16} />
                      </div>
                      <a href={`mailto:${block.settings.email}`} className="hover:text-primary transition-colors">{block.settings.email}</a>
                    </li>
                    <li className="flex items-start gap-4 text-[14px] md:text-[18px] text-zinc-500 font-figtree">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-primary flex-shrink-0">
                        <MapPin size={16} />
                      </div>
                      <a href={block.settings.map_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors leading-relaxed">
                        {block.settings.address}
                      </a>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Blocks (Headings & RichText) */}
        <div className="information-content-wrapper prose prose-zinc max-w-6xl mx-auto prose-headings:font-abhaya prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-zinc-900 prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:font-figtree prose-li:text-zinc-600 prose-li:font-figtree prose-strong:text-zinc-900 prose-a:text-primary prose-a:underline">
          {contentBlocks.map((block, idx) => {
            if (block.type === 'heading') {
              const Tag = block.settings.heading_level || 'h2';
              return (
                <Tag
                  key={idx}
                  id={block.settings.heading_id}
                  className={`text-${block.settings.alignment || 'left'} text-[18px] md:text-[28px] mt-0 mb-8`}
                >
                  {replaceShortcodes(block.settings.text)}
                </Tag>
              );
            }
            if (block.type === 'richtext') {
              return (
                <div
                  key={idx}
                  className="information-content-richtext mb-4 text-[14px] md:text-[18px]"
                  dangerouslySetInnerHTML={{ __html: replaceShortcodes(block.settings.content) }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>
      <style jsx>{`
        .font-abhaya { font-family: var(--font-abhaya), serif; }
        .font-figtree { font-family: var(--font-figtree), sans-serif; }
      `}</style>
    </section>
  );
}
