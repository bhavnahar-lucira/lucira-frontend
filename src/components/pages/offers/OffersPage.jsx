'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import FeatureBar from '@/components/home/FeatureBar';
import { apiFetch } from '@/lib/api';
import { useDispatch, useSelector } from 'react-redux';
import { openAuthModal } from '@/redux/features/user/userSlice';
import { pushPromoClick } from '@/lib/gtm';

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
      title: 'Scratch & Win Rewards',
      image: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/spinthewheel.png?v=1792042017',
      mobileImage: 'https://cdn.shopify.com/s/files/1/0739/8516/3482/files/spinthewheel.png?v=1792042017',
      link: '#scratch-card',
      alt: 'Scratch & Win Rewards - Register & Unlock Rewards',
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

function isPopupTrigger(link, card = {}) {
  const l = String(link || '').trim().toLowerCase();
  if (
    l === '#' ||
    l === '#scratch' ||
    l === '#scratch-card' ||
    l === '#scratch_card' ||
    l === '#scratchcard' ||
    l === 'scratch-card' ||
    l === 'scratch_card' ||
    l === 'scratch' ||
    l.includes('#scratch') ||
    l.endsWith('scratch-card') ||
    l.endsWith('scratch_card') ||
    l === '#spin' ||
    l === '#spin-wheel' ||
    l === '#spin_wheel' ||
    l === '#spinthewheel' ||
    l === '#popup' ||
    l === '#rewards' ||
    l === 'spin-wheel' ||
    l === 'spin_wheel' ||
    l === 'popup' ||
    l.includes('#spin') ||
    l.includes('#popup') ||
    l.includes('#reward') ||
    l.includes('#wheel') ||
    l.endsWith('spin-wheel') ||
    l.endsWith('spin_wheel')
  ) {
    return true;
  }
  const title = String(card.title || '').toLowerCase();
  const alt = String(card.alt || '').toLowerCase();
  return (
    title.includes('scratch') ||
    title.includes('spin') ||
    title.includes('wheel') ||
    title.includes('reward') ||
    alt.includes('scratch') ||
    alt.includes('spin') ||
    alt.includes('wheel')
  );
}

function getFlexibleGridClass(count) {
  switch (count) {
    case 1:
      return 'grid-cols-1 max-w-sm mx-auto';
    case 2:
      return 'grid-cols-2 max-w-2xl mx-auto';
    case 3:
      return 'grid-cols-1 sm:grid-cols-3 max-w-5xl mx-auto';
    case 4:
      return 'grid-cols-2 md:grid-cols-4';
    case 5:
      return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
    default:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
  }
}

function OfferCardItem({ card, index, onOpenPopup }) {
  const isPopup = isPopupTrigger(card.link, card);
  const cardHref = isPopup ? '#scratch-card' : (card.link || '/collections/all');

  const handleClick = (e) => {
    try {
      pushPromoClick({
        creative_name: card.title || card.alt || `Offer Card ${index + 1}`,
        location_id: "offers_page",
        promo_id: card.id || `offer_${index + 1}`,
        promo_name: card.title || card.alt || "Offer Card",
        promo_position: `slot_${index + 1}`,
      });
    } catch (err) {
      console.warn("promoClick push failed", err);
    }

    if (isPopup) {
      e.preventDefault();
      if (onOpenPopup) {
        onOpenPopup();
      }
    }
  };

  return (
    <Link
      href={cardHref}
      onClick={handleClick}
      className="group relative block w-full aspect-[4/5] overflow-hidden rounded-[4px] shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer"
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
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) =>
    Boolean(state.user?.isAuthenticated || state.user?.user)
  );
  const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS);

  const handleOpenPopup = () => {
    dispatch(
      openAuthModal({
        initialStep: 'register',
        forceShowWheel: true,
        rewardSource: 'scratch_card',
      })
    );
  };

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

    const checkHash = () => {
      if (!isAuthenticated && typeof window !== 'undefined') {
        const hash = window.location.hash.toLowerCase();
        if (hash.includes('scratch') || hash.includes('spin') || hash.includes('reward')) {
          handleOpenPopup();
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [dispatch, isAuthenticated]);

  const heroBanner = settings.heroBanner || DEFAULT_SETTINGS.heroBanner;
  const offerCards = (settings.offerCards || DEFAULT_SETTINGS.offerCards).filter((c) => {
    if (c.enabled === false) return false;
    if (isAuthenticated && isPopupTrigger(c.link, c)) {
      return false;
    }
    return true;
  });

  const handleHeroBannerClick = () => {
    try {
      pushPromoClick({
        creative_name: heroBanner.alt || heroBanner.title || "Offers Hero Banner",
        location_id: "offers_page",
        promo_id: "offers_hero_banner",
        promo_name: heroBanner.title || "Something Special Awaits",
        promo_position: "hero_banner",
      });
    } catch (err) {
      console.warn("Hero banner promoClick push failed", err);
    }
  };

  return (
    <div className="w-full bg-white min-h-[auto] md:min-h-screen">
      {/* ─── Hero Banner ────────────────────────────────────────── */}
      {heroBanner.enabled !== false && (
        <section className="w-full relative overflow-hidden bg-[#C5A07E]">
          {heroBanner.link ? (
            <Link href={heroBanner.link} onClick={handleHeroBannerClick} className="block group">
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

      {/* ─── Offer Cards Section (Flexible Dynamic Grid) ──── */}
      <section className="w-full pt-6 sm:pt-8 md:pt-10 pb-0 bg-white">
        <div className="container-main">
          {/* Desktop Layout: Flexible balanced grid based on active card count */}
          <div className={`hidden md:grid ${getFlexibleGridClass(offerCards.length)} gap-3 lg:gap-5 justify-center`}>
            {offerCards.map((card, index) => (
              <div key={card.id || index} className="w-full">
                <OfferCardItem
                  card={card}
                  index={index}
                  onOpenPopup={handleOpenPopup}
                />
              </div>
            ))}
          </div>

          {/* Mobile Layout: Swiper Slider with loop */}
          <div className="block md:hidden -mx-4 px-4 overflow-hidden">
            <Swiper
              loop={offerCards.length > 1}
              spaceBetween={12}
              slidesPerView={1.25}
              className="w-full"
            >
              {offerCards.map((card, index) => (
                <SwiperSlide key={card.id || index}>
                  <OfferCardItem
                    card={card}
                    index={index}
                    onOpenPopup={handleOpenPopup}
                  />
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
