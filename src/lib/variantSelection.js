// Shared between ProductPageClient (initial variant / colour selection) and the
// server product page (hero image preload). Moved verbatim from
// ProductPageClient.jsx so both sides pick the same initial colour.

export const standardizeKarat = (purity) => {
  if (!purity) return "14KT";
  const mp = String(purity).replace(/\s+/g, "").toLowerCase();
  if (mp === "pt950" || mp === "plt" || mp === "platinum") return "PLT";
  const km = mp.match(/^(\d+)(k|kt|ct)$/);
  if (km) return `${km[1]}KT`;
  return purity;
};

export const getVariantSelection = (variant) => {
  if (variant?.metafields?.metal_purity && variant?.metafields?.metal_color) {
    return {
      karat: standardizeKarat(variant.metafields.metal_purity),
      color: variant.metafields.metal_color,
    };
  }

  const fallback = {
    karat: standardizeKarat(variant?.metafields?.metal_purity),
    color: "Yellow Gold",
  };

  if (!variant?.color) {
    return fallback;
  }

  const parts = String(variant.color).trim().split(" ");
  if (parts.length < 2) {
    return {
      karat: fallback.karat,
      color: variant.color || fallback.color,
    };
  }

  return {
    karat: standardizeKarat(parts[0]) || fallback.karat,
    color: parts.slice(1).join(" ") || fallback.color,
  };
};
