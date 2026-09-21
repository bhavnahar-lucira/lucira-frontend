"use client";

// The three booking journeys — store visit, video call, home trial — and the
// rules that govern them as a set, independent of how they are laid out.
//
// Two surfaces render these: /pages/book-an-appointment, as a three-column
// grid, and the homepage's "More Ways To Explore", as a grid on desktop and a
// carousel on mobile. They must behave identically — the same OTP, the same
// lead webhook, the same fallbacks — so what differs between them is only the
// wrapper, which is why that is a render prop rather than a `layout` flag.
//
// What lives here rather than in the cards: only ONE card is open at a time,
// and both pincode-gated journeys fall back to the video call, which means one
// card has to be able to open another. Neither is a card's business to know.

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import VisitStoreCard from "./VisitStoreCard";
import VideoCallCard from "./VideoCallCard";
import TryAtHomeCard from "./TryAtHomeCard";

/** Copy for the Book Appointment page. Callers may pass their own. */
export const DEFAULT_CARDS = {
  store: {
    title: "Visit Our Store",
    desc: "Explore and try your favorite designs in person, with expert guidance from our in-store team.",
    cta: "Book Store Visit",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_LuciraStore.jpg",
  },
  video: {
    title: "Virtual Shop",
    desc: "Shop live over video call, view designs up close, compare pieces, and get expert guidance.",
    cta: "Book Video Call",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_VirtualTryOn.jpg",
  },
  home: {
    title: "Try At Home",
    desc: "Select your favorite pieces and try them at home before you decide.",
    cta: "Book Home Trial",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Homepage_Explore_TryAtHome.jpg",
  },
};

/**
 * @param locationId  GTM location for everything these cards report, so a
 *                    booking started on the homepage is not filed under the
 *                    appointment page.
 * @param children    (cards, { anyOpen }) => layout. `cards` is the three
 *                    rendered elements, keyed store / video / home, to place in
 *                    whatever order and wrapper the surface wants.
 */
export default function AppointmentCards({
  locationId = "book-an-appointment",
  cards = DEFAULT_CARDS,
  children,
}) {
  const [active, setActive] = React.useState(null);

  const close = () => setActive(null);

  // Both pincode-gated journeys fall back to "book video call" when there is no
  // store near the shopper. That hands over to the Virtual Shop card rather
  // than duplicating the phone/OTP steps in two more places.
  const switchToVideoCall = () => setActive("video");

  // With everything collapsed the cards share a height so their CTAs line up.
  // The moment one expands into a form that stops being worth it: matching its
  // height would leave the others with a block of empty space above their
  // buttons, so they drop to their own height.
  const anyOpen = active !== null;

  const rendered = {
    store: (
      <VisitStoreCard
        card={cards.store}
        locationId={locationId}
        open={active === "store"}
        fillHeight={!anyOpen}
        onOpen={() => setActive("store")}
        onClose={close}
        onBookVideoCall={switchToVideoCall}
      />
    ),
    video: (
      <VideoCallCard
        card={cards.video}
        locationId={locationId}
        open={active === "video"}
        fillHeight={!anyOpen}
        onOpen={() => setActive("video")}
        onClose={close}
      />
    ),
    home: (
      <TryAtHomeCard
        card={cards.home}
        locationId={locationId}
        open={active === "home"}
        fillHeight={!anyOpen}
        onOpen={() => setActive("home")}
        onClose={close}
        onBookVideoCall={switchToVideoCall}
      />
    ),
  };

  return (
    <>
      {/*
        Focus scrim. While a card is mid-flow everything else — the other two
        cards, the header, the footer — goes soft behind it, so the form the
        shopper is filling is the only sharp thing on screen. Sits above the
        site header (z-100) on purpose: a crisp, clickable nav floating over a
        blurred page reads as a rendering bug rather than a deliberate focus
        state. Clicking it backs out of the flow. The booking drawers live far
        above this, so they still open over the top.
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

      {children(rendered, { anyOpen })}
    </>
  );
}
