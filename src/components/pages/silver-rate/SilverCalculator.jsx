"use client";

import SophisticatedMetalCalculator from "../SophisticatedMetalCalculator";

export default function SilverCalculator({ cityName }) {
  return <SophisticatedMetalCalculator initialMetal="silver" initialCity={cityName} />;
}
