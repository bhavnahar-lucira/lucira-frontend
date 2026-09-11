"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /pages/book-an-appointment
//
// One landing page for all three ways to book: a video call, a store visit, or
// a home trial. The copy and card treatment come from the homepage "More Ways
// To Explore" section (src/components/home/WaysToExplore.jsx) — the difference
// here is that the CTAs open real, OTP-verified booking flows in place of the
// WhatsApp hand-off.
//
// Only one card is ever expanded. Opening a second collapses the first, which
// both matches the wireframes and keeps a half-filled form from sitting
// forgotten in a neighbouring column.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import VideoCallCard from "./VideoCallCard";
import VisitStoreCard from "./VisitStoreCard";
import TryAtHomeCard from "./TryAtHomeCard";

const CARDS = {
  video: {
    title: "Virtual Shop",
    desc: "Shop live over video call, view designs up close, compare pieces, and get expert guidance.",
    cta: "Book Video Call",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_VirtualTryOn.jpg",
  },
  store: {
    title: "Visit Our Store",
    desc: "Explore and try your favorite designs in person, with expert guidance from our in-store team.",
    cta: "Book Store Visit",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_LuciraStore.jpg",
  },
  home: {
    title: "Try At Home",
    desc: "Select your favorite pieces and try them at home before you decide.",
    cta: "Book Home Trial",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_TryAtHome.jpg",
  },
};

export default function BookAppointmentClient() {
  const [active, setActive] = React.useState(null);

  const close = () => setActive(null);

  // Both pincode-gated journeys fall back to "book video call" when there is no
  // store near the shopper. That hands the page over to the Virtual Shop card
  // rather than duplicating the phone/OTP steps in two more places.
  const switchToVideoCall = () => setActive("video");

  return (
    <main className="w-full bg-[#FEF5F1] py-10 md:py-16">
      <div className="container-main mx-auto">
        <header className="text-left lg:text-center mb-8">
          <h1 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Book Appointment
          </h1>
          <p className="text-black font-normal text-sm md:text-base leading-[1.4]">
            Experience Lucira your way — online, at home, or in-store.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          <VideoCallCard
            card={CARDS.video}
            open={active === "video"}
            onOpen={() => setActive("video")}
            onClose={close}
          />
          <VisitStoreCard
            card={CARDS.store}
            open={active === "store"}
            onOpen={() => setActive("store")}
            onClose={close}
            onBookVideoCall={switchToVideoCall}
          />
          <TryAtHomeCard
            card={CARDS.home}
            open={active === "home"}
            onOpen={() => setActive("home")}
            onClose={close}
            onBookVideoCall={switchToVideoCall}
          />
        </div>
      </div>
    </main>
  );
}
