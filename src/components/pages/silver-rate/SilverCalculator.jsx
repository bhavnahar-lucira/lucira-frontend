"use client";

import SophisticatedMetalCalculator from "../SophisticatedMetalCalculator";

export default function SilverCalculator({ cityName, stateName, isStatePage }) {
  return <SophisticatedMetalCalculator initialMetal="silver" initialCity={cityName} initialState={stateName} isStatePage={isStatePage} />;
}
