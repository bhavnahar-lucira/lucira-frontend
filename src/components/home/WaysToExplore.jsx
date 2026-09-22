"use client";

// Homepage "More Ways To Explore".
//
// The same three booking journeys as /pages/book-an-appointment, running the
// same cards from AppointmentCards — pincode gate, OTP, lead webhook and all.
// They used to be WhatsApp links, which handed the shopper to a chat and left
// the booking to be arranged by hand; the flows now complete on the site, and
// the leads reach the store teams verified.
//
// The layout stays the homepage's own: a carousel on mobile, a grid on desktop.
// That is the whole reason AppointmentCards takes a render prop rather than
// owning its wrapper — the behaviour is shared, the presentation is not.

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import AppointmentCards from "@/components/pages/book-appointment/AppointmentCards";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// The homepage's own wording, which is longer and more inviting than the
// appointment page's — that page has already been chosen, this section is still
// selling the idea.
const CARDS = {
  video: {
    title: "Virtual Shop",
    desc: "Shop live over video call view designs up close, compare pieces, and get expert guidance.",
    cta: "Schedule Video Call",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_VirtualTryOn.jpg",
  },
  home: {
    title: "Try At Home",
    desc: "Select your favorite pieces & try them at home before you decide, see the fit, finish in your own space.",
    cta: "Book Home Trial",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_TryAtHome.jpg",
  },
  store: {
    title: "Visit Our Store",
    desc: "Explore and try your favorite designs in person, with expert guidance from our in-store team.",
    cta: "Book Appointment",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_LuciraStore.jpg",
  },
};

function SectionHeader() {
  return (
    <div className="text-left lg:text-center mb-8 px-0">
      <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">More Ways To Explore</h2>
      <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">
        Experience Lucira your way, online or at our showrooms.
      </p>
    </div>
  );
}

export default function WaysToExplore() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const swiperRef = useRef(null);

  return (
    <section className={`w-full ${isMobile ? "mt-12 bg-[#FEF5F1] py-12" : "mt-0 bg-[#FEF5F1] py-16"} overflow-hidden`}>
      <div className="container-main mx-auto">
        <SectionHeader />

        <AppointmentCards locationId="homepage" cards={CARDS}>
          {(cards) =>
            isMobile ? (
              <div className="relative group">
                <Swiper
                  modules={[Pagination]}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  pagination={{ clickable: true, el: ".explore-pagination" }}
                  slidesPerView={1.1}
                  spaceBetween={12}
                  centeredSlides={false}
                  loop={false}
                  // A card expanding into a form must not be clipped by the
                  // slide that holds it.
                  autoHeight
                  className="explore-swiper overflow-visible!"
                >
                  {[cards.video, cards.home, cards.store].map((card, index) => (
                    <SwiperSlide key={index} className="h-auto">
                      {card}
                    </SwiperSlide>
                  ))}
                </Swiper>

                <div className="flex items-center justify-between mt-8">
                  <div className="explore-pagination flex gap-2" />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      aria-label="Previous"
                      onClick={() => swiperRef.current?.slidePrev()}
                      className="w-11 h-11 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-900 bg-white shadow-sm active:scale-90 transition-all"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next"
                      onClick={() => swiperRef.current?.slideNext()}
                      className="w-11 h-11 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-900 bg-white shadow-sm active:scale-90 transition-all"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 items-start">
                {cards.video}
                {cards.home}
                {cards.store}
              </div>
            )
          }
        </AppointmentCards>
      </div>

      <style jsx global>{`
        .explore-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #D1D1D1;
          opacity: 1;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        .explore-pagination .swiper-pagination-bullet-active {
          width: 24px;
          background: #000;
        }
        @media (min-width: 768px) {
          .explore-pagination .swiper-pagination-bullet-active {
            width: 24px;
          }
        }
      `}</style>
    </section>
  );
}
