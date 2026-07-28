"use client";

import SophisticatedMetalCalculator from "../SophisticatedMetalCalculator";

export default function GoldCalculator({ cityName }) {
  return <SophisticatedMetalCalculator initialMetal="gold" initialCity={cityName} />;
}
