'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import FeatureBar from '@/components/home/FeatureBar';
import { apiFetch } from '@/lib/api';

const DEFAULT_SETTINGS = {
  heroBanner: {
    enabled: true,
    title: 'Something Special Awaits',
    desktopImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/offer-banner.png?v=1792042018',
    mobileImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Offer-Mobile_ded4c971-bc21-412a-bf4a-7f0ac3c045a3.jpg?v=1792042015',
    link: '/collections/all',
    alt: 'Something Special Awaits - Lucira Offers',
  },
  offerCards: [
    {
      id: 'offer_1',
      title: '100% Making Charges + 30% Diamond Discount',
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_studs.jpg?v=1792042017',
      mobileImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_studs.jpg?v=1792042017',
      link: '/collections/100-making-discount',
      alt: '100% + 30% Making Charges & Diamond Discount',
      enabled: true,
    },
    {
      id: 'offer_2',
      title: '50% Making Charges + 20% Diamond Discount',
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_ring_2.jpg?v=1792043272',
      mobileImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/diamond_ring_2.jpg?v=1792043272',
      link: '/collections/50-making-discount',
      alt: '50% + 20% Making Charges & Diamond Discount',
      enabled: true,
    },
    {
      id: 'offer_3',
      title: '50% Making Charges on Pendants',
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pendant_2.jpg?v=1792043272',
      mobileImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Pendant_2.jpg?v=1792043272',
      link: '/collections/50-making-discount',
      alt: '50% Making Charges on Pendants',
      enabled: true,
    },
    {
      id: 'offer_4',
      title: '20% Making Discount - Spin & Win',
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/spinthewheel.png?v=1792042017',
      mobileImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/spinthewheel.png?v=1792042017',
      link: '/collections/20-making-discount',
      alt: '20% Making Discount - Register & Unlock Rewards',
      enabled: true,
    },
    {
      id: 'offer_5',
      title: '20% Making on Gold Products',
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/gold_jewelry.jpg?v=1792042017',
      mobileImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/gold_jewelry.jpg?v=1792042017',
      link: '/collections/gold-jewelry',
      alt: '20% Making on Gold Products',
      enabled: true,
    },
  ],
};

function OfferCardItem({ card, index }) {
  const cardHref = card.link || '/collections/all';

  return (
    <Link
      href={cardHref}
      className="group relative block w-full aspect-[4/5] overflow-hidden rounded-[4px] shadow-2xs hover:shadow-md transition-all duration-300"
    >
      {/* Card Background Creative Image (Exact same dimensions for all, 4px radius) */}
      <picture className="block w-full h-full">
        {card.mobileImage && (
          <source media="(max-width: 767px)" srcSet={card.mobileImage} />
        )}
        <img
          src={card.image}
          alt={card.alt || card.title || 'Offer Creative'}
          className="w-full h-full object-cover object-center rounded-[4px] transition-transform duration-700 ease-out group-hover:scale-105"
          loading={index < 5 ? 'eager' : 'lazy'}
        />
      </picture>
    </Link>
  );
}

export default function OffersPage({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await apiFetch('/api/settings/offers-page');
        if (data && (data.heroBanner || Array.isArray(data.offerCards))) {
          setSettings(data);
        }
      } catch (err) {
        console.warn('Failed to fetch offers page settings, using defaults', err);
      }
    }
    loadSettings();
  }, []);

  const heroBanner = settings.heroBanner || DEFAULT_SETTINGS.heroBanner;
  const offerCards = (settings.offerCards || DEFAULT_SETTINGS.offerCards).filter(
    (c) => c.enabled !== false
  );

  return (
    <div className="w-full bg-white min-h-screen">
      {/* ─── Hero Banner ────────────────────────────────────────── */}
      {heroBanner.enabled !== false && (
        <section className="w-full relative overflow-hidden bg-[#C5A07E]">
          {heroBanner.link ? (
            <Link href={heroBanner.link} className="block group">
              <picture>
                {heroBanner.mobileImage && (
                  <source media="(max-width: 767px)" srcSet={heroBanner.mobileImage} />
                )}
                <img
                  src={heroBanner.desktopImage}
                  alt={heroBanner.alt || 'Something Special Awaits'}
                  className="w-full h-auto object-cover max-h-[460px] md:max-h-[500px] transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  loading="eager"
                  fetchPriority="high"
                />
              </picture>
            </Link>
          ) : (
            <picture>
              {heroBanner.mobileImage && (
                <source media="(max-width: 767px)" srcSet={heroBanner.mobileImage} />
              )}
              <img
                src={heroBanner.desktopImage}
                alt={heroBanner.alt || 'Something Special Awaits'}
                className="w-full h-auto object-cover max-h-[460px] md:max-h-[500px]"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          )}
        </section>
      )}

      {/* ─── 5 Offer Cards Section ──── */}
      <section className="w-full pt-6 sm:pt-8 md:pt-10 pb-0 bg-white">
        <div className="container-main">
          {/* Desktop Layout: 5-column balanced grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-5">
            {offerCards.map((card, index) => (
              <div key={card.id || index} className="w-full">
                <OfferCardItem card={card} index={index} />
              </div>
            ))}
          </div>

          {/* Mobile Layout: Swiper Slider with loop={true} */}
          <div className="block md:hidden -mx-4 px-4 overflow-hidden">
            <Swiper
              loop={true}
              spaceBetween={12}
              slidesPerView={1.25}
              className="w-full"
            >
              {offerCards.map((card, index) => (
                <SwiperSlide key={card.id || index}>
                  <OfferCardItem card={card} index={index} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* ─── Trust Badges (Equal Top & Bottom Spacing) ── */}
      <FeatureBar className="py-6 sm:py-8 md:py-10" />
    </div>
  );
}
