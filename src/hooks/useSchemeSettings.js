"use client";

import { useState, useEffect } from "react";
import { fetchSchemeOfferSettings } from "@/lib/api";

const DEFAULT_SETTINGS = {
  enabled: true,
  intervals: [
    { min: 3000, max: 4500, giftValue: 5000, label: "Free Gift Worth 5k" },
    { min: 5000, max: 19000, giftValue: 10000, label: "Free Gift Worth 10k" }
  ]
};

export function useSchemeSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSchemeOfferSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load scheme settings:", error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const calculateGift = (amount) => {
    if (!settings || !settings.enabled) return 0;
    const interval = settings.intervals.find(inv => amount >= inv.min && amount <= inv.max);
    return interval ? interval.giftValue : 0;
  };

  const getActiveIntervals = () => {
    if (!settings || !settings.enabled) return [];
    return settings.intervals;
  };

  return { settings, loading, calculateGift, getActiveIntervals };
}
