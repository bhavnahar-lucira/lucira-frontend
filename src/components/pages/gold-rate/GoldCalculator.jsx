"use client";

import SophisticatedMetalCalculator from "../SophisticatedMetalCalculator";

export default function GoldCalculator({ cityName, stateName, isStatePage }) {
  return <SophisticatedMetalCalculator initialMetal="gold" initialCity={cityName} initialState={stateName} isStatePage={isStatePage} />;
}
