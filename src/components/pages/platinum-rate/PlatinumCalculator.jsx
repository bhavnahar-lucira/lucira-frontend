"use client";

import SophisticatedMetalCalculator from "../SophisticatedMetalCalculator";

export default function PlatinumCalculator({ cityName }) {
  return <SophisticatedMetalCalculator initialMetal="platinum" initialCity={cityName} />;
}
