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
import { motion, AnimatePresence } from "framer-motion";
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

  // With everything collapsed the cards share a height so their CTAs line up,
  // the way the homepage section reads. The moment one expands into a form that
  // stops being worth it: matching its height would leave the other two with a
  // block of empty space above their buttons, so they drop to their own height.
  const anyOpen = active !== null;

  return (
    <main className="w-full bg-[#FEF5F1] py-10 md:py-16">
      {/*
        Focus scrim. While a card is mid-flow everything else on the page —
        the other two cards, the header, the footer — goes soft behind it, so
        the form the shopper is filling is the only sharp thing on screen.
        Sits above the site header (z-100) on purpose: a crisp, clickable nav
        floating over a blurred page reads as a rendering bug rather than a
        deliberate focus state. Clicking it backs out of the flow.
        The booking drawers live at z-[999], so they still open over the top.
      */}
      <AnimatePresence>
        {anyOpen && (
          <motion.div
            key="focus-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            aria-hidden="true"
            className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[3px]"
          />
        )}
      </AnimatePresence>

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
            fillHeight={!anyOpen}
            onOpen={() => setActive("video")}
            onClose={close}
          />
          <VisitStoreCard
            card={CARDS.store}
            open={active === "store"}
            fillHeight={!anyOpen}
            onOpen={() => setActive("store")}
            onClose={close}
            onBookVideoCall={switchToVideoCall}
          />
          <TryAtHomeCard
            card={CARDS.home}
            open={active === "home"}
            fillHeight={!anyOpen}
            onOpen={() => setActive("home")}
            onClose={close}
            onBookVideoCall={switchToVideoCall}
          />
        </div>
      </div>
    </main>
  );
}
