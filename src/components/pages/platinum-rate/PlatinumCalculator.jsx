"use client";

import SophisticatedMetalCalculator from "../SophisticatedMetalCalculator";

export default function PlatinumCalculator({ cityName, stateName, isStatePage }) {
  return <SophisticatedMetalCalculator initialMetal="platinum" initialCity={cityName} initialState={stateName} isStatePage={isStatePage} />;
}
