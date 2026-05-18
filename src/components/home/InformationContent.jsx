"use client";

import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { informationContentData } from '@/data/informationContent';

const InformationContent = () => {
  const { settings, blocks, block_order } = informationContentData;

  // Filter blocks by type
  const storeLocations = block_order
    .map(id => blocks[id])
    .filter(block => block && block.type === 'store_location');

  const contentBlocks = block_order
    .map(id => blocks[id])
    .filter(block => block && (block.type === 'richtext' || block.type === 'heading'));

  return (
    <section className="information-content-section bg-white pt-12 pb-4 lg:pt-16 lg:pb-16 border-t border-zinc-100">
      <div className="container-main">
        {/* Stores Section */}
        {storeLocations.length > 0 && (
          <div className="address-locations-footer mb-2 lg:mb-4">
            <h3 className="text-lg lg:text-2xl font-bold font-abhaya text-zinc-900 mb-6 lg:mb-8 pb-4 border-b border-zinc-100 tracking-tight uppercase">
              {settings.stores_heading}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-y-10 lg:gap-x-0">
              {storeLocations.map((block, index) => (
                <div
                  key={index}
                  className={`store-location-item lg:px-8 ${index % 4 !== 3 && index !== storeLocations.length - 1
                    ? 'lg:border-r lg:border-zinc-100'
                    : ''
                    } ${index % 4 === 0 ? 'lg:pl-0' : ''}`}
                >
                  <h4 className="text-sm lg:text-base font-bold font-figtree text-zinc-800 mb-4 lg:mb-5 leading-tight tracking-tight uppercase">
                    {block.settings.store_name}
                  </h4>
                  <ul className="space-y-4 lg:space-y-4">
                    <li className="flex items-start gap-3 text-xs lg:text-sm text-zinc-600">
                      <Phone size={14} className="mt-1 shrink-0 text-[#5A413F] opacity-80" />
                      <a href={`tel:${block.settings.phone}`} className="hover:text-[#5A413F] transition-colors leading-normal font-medium">
                        {block.settings.phone}
                      </a>
                    </li>
                    <li className="flex items-start gap-3 text-xs lg:text-sm text-zinc-600">
                      <Mail size={14} className="mt-1 shrink-0 text-[#5A413F] opacity-80" />
                      <a href={`mailto:${block.settings.email}`} className="hover:text-[#5A413F] transition-colors leading-normal font-medium break-all">
                        {block.settings.email}
                      </a>
                    </li>
                    <li className="flex items-start gap-3 text-xs lg:text-sm text-zinc-600 font-medium">
                      <MapPin size={14} className="mt-1 shrink-0 text-[#5A413F] opacity-80" />
                      {block.settings.map_url ? (
                        <a
                          href={block.settings.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#5A413F] transition-colors leading-relaxed"
                        >
                          {block.settings.address}
                        </a>
                      ) : (
                        <span className="leading-relaxed">{block.settings.address}</span>
                      )}
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rich Text Content Wrapper */}
        <div className="information-content-wrapper footer-pages border-t border-zinc-100 pt-0 lg:pt-4 !text-xs lg:!text-sm">
          {contentBlocks.map((block, index) => (
            <div key={index} className="mb-4 lg:mb-2 last:mb-0">
              {block.type === 'heading' ? (
                <h2 className="text-base lg:text-xl font-bold text-zinc-900 mt-6 lg:mt-9 mb-4 pb-2 border-b border-zinc-200 font-abhaya tracking-tight">
                  {block.settings.text}
                </h2>
              ) : (
                <div
                  className="richtext-content [&_p]:!text-xs lg:[&_p]:!text-sm [&_h3]:!text-sm lg:[&_h3]:!text-base [&_p]:mb-4 last:[&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: block.settings.content }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InformationContent;
