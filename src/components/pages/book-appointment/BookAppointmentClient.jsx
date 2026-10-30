"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /pages/book-an-appointment
//
// One landing page for all three ways to book: a store visit, a video call, or
// a home trial. The copy and card treatment come from the homepage "More Ways
// To Explore" section (src/components/home/WaysToExplore.jsx), which now runs
// the very same cards — the flows themselves live in AppointmentCards, so this
// file is only the page around them.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import AppointmentCards from "./AppointmentCards";

export default function BookAppointmentClient() {
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

        <AppointmentCards>
          {(cards) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
              {cards.store}
              {cards.video}
              {cards.home}
            </div>
          )}
        </AppointmentCards>
      </div>
    </main>
  );
}
