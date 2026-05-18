"use client";

import { useState, useEffect } from "react";

const quotes = [
  "Jewelry is like the perfect spice - it always complements what’s already there.",
  "Every piece of jewelry tells a story.",
  "Life is too short to wear boring jewelry.",
  "Jewelry has the power to be the one little thing that makes you feel unique.",
  "A piece of jewelry is often a piece of art. It becomes valuable when cherished.",
  "Jewelry should tell a story about the person who’s wearing it.",
  "Elegance is not standing out, but being remembered.",
  "Diamonds are a girl's best friend.",
  "Beauty is who you are. Jewelry is simply the icing on the cake.",
  "Wear your confidence like jewelry."
];

export default function Loading() {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-6">
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer Ring */}
        <div className="absolute w-16 h-16 border-2 border-zinc-100 dark:border-zinc-800 rounded-full" />
        {/* Spinning Element */}
        <div className="w-16 h-16 border-t-2 border-zinc-900 dark:border-white rounded-full animate-spin" />
      </div>
      
      <div className="max-w-xs text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400 font-medium">
          Loading Luxury
        </p>
        {quote && (
          <p className="text-xl font-serif italic text-zinc-800 dark:text-zinc-200 leading-relaxed">
            "{quote}"
          </p>
        )}
      </div>
    </div>
  );
}
