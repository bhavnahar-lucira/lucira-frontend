// Single source of truth for the free-gift-with-purchase ladder shown in the
// cart's "Saving Zone" area (FreeGiftReward). Mirrors the pattern in
// lib/coupons.js — one config array plus small pure helpers — so a new tier
// (or a new gift product on the same tier) is a one-line edit here rather
// than a change in every file that touches cart totals.
//
// Callers must pass the DIAMOND value of the cart (same qualifying value used
// for the coupon ladder), not the full subtotal: plain gold does not count
// toward these tiers.

let dynamicTiers = null;

export const setCachedFreeGiftTiers = (tiers) => {
  if (Array.isArray(tiers)) {
    dynamicTiers = mapRemoteFreeGiftTiers(tiers);
  }
};

export const getCachedFreeGiftTiers = () => dynamicTiers;

export const FREE_GIFTS = [
  {
    id: "silver-diamond-bracelet",
    threshold: 30000,
    variantId: "gid://shopify/ProductVariant/48414958715098",
    productId: "gid://shopify/Product/9438188896474",
    title: "Diamond Bracelet",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Bracelet_PNG_1.png",
    worthValue: 15000,
    worthLabel: "₹15,000",
    scaleQuantityWithSpend: false,
    allocationLimit: null,
  },
];

export const cleanId = (id) => String(id || "").replace(/^gid:\/\/shopify\/ProductVariant\//i, "").trim().toLowerCase();
export const cleanProdId = (id) => String(id || "").replace(/^gid:\/\/shopify\/Product\//i, "").trim().toLowerCase();

/**
 * True for any configured free-gift variant.
 * Normalizes Shopify GID vs numeric ID so matches always succeed.
 * Checks dynamic tiers from dashboard first, then static FREE_GIFTS.
 */
export const isFreeGiftVariant = (variantId, gifts = null) => {
  if (!variantId) return false;
  const target = cleanId(variantId);
  const list = gifts || dynamicTiers || FREE_GIFTS;
  return list.some((g) => {
    const v = cleanId(g.variantId);
    return v === target || (v && target && (v.includes(target) || target.includes(v)));
  });
};

/**
 * True for any configured free-gift product ID.
 */
export const isFreeGiftProduct = (productId, gifts = null) => {
  if (!productId) return false;
  const target = cleanProdId(productId);
  const list = gifts || dynamicTiers || FREE_GIFTS;
  return list.some((g) => {
    const p = cleanProdId(g.productId);
    return p && target && (p === target || p.includes(target) || target.includes(p));
  });
};

/**
 * Comprehensive check to identify any free gift item from the dashboard or cart.
 * Guarantees that free gifts NEVER leak into the regular cart item list.
 */
export const isFreeGiftItem = (item, gifts = null) => {
  if (!item) return false;
  if (item.isFreeGift === true) return true;
  if (item.properties?.['_is_free_gift'] === 'true' || item.properties?.['is_free_gift'] === 'true') return true;
  if (item.variantId && isFreeGiftVariant(item.variantId, gifts)) return true;
  if (item.productId && isFreeGiftProduct(item.productId, gifts)) return true;
  if (String(item.title || "").toLowerCase().startsWith("free ")) return true;
  if (String(item.variantTitle || "").toLowerCase().includes("free gift")) return true;
  return false;
};

/**
 * Maps the backend's /api/settings/silver-bracelet tier shape
 * onto the shape expected across the storefront.
 */
export const mapRemoteFreeGiftTiers = (tiers) => {
  if (!Array.isArray(tiers)) return FREE_GIFTS;
  return tiers
    .map((t) => ({
      id: t.id,
      enabled: t.enabled !== false,
      startsAt: t.startsAt || null,
      endsAt: t.endsAt || null,
      threshold: Number(t.min) || 0,
      variantId: t.giftVariantId,
      productId: t.giftProductId,
      title: t.giftTitle,
      image: t.giftImage,
      bannerImage: t.bannerImage,
      bannerText: t.bannerText,
      worthValue: Number(t.giftWorthValue) || 0,
      worthLabel: `₹${(Number(t.giftWorthValue) || 0).toLocaleString("en-IN")}`,
      combineCoupons: t.combineCoupons === true,
      scaleQuantityWithSpend: t.scaleQuantityWithSpend === true,
      allocationLimit: t.allocationLimit ? Number(t.allocationLimit) : null,
    }))
    .filter((t) => t.variantId)
    .sort((a, b) => a.threshold - b.threshold);
};

export const isTierLive = (tier, now = Date.now()) => {
  if (tier.startsAt && new Date(tier.startsAt).getTime() > now) return false;
  if (tier.endsAt && new Date(tier.endsAt).getTime() < now) return false;
  return true;
};

/**
 * Calculates the eligible free gift quantity for a given diamond spend.
 * If scaleQuantityWithSpend is enabled, scales linearly with spend (1 per threshold).
 * e.g., 30k -> 1, 60k -> 2, 90k -> 3.
 */
export const getEligibleGiftQuantity = (diamondValue, tier) => {
  if (!tier) return 0;
  const value = Number(diamondValue) || 0;
  const threshold = Number(tier.threshold) || 0;
  if (threshold <= 0 || value < threshold) return 0;
  if (!tier.scaleQuantityWithSpend) return 1;

  const count = Math.floor(value / threshold);
  const capped = tier.allocationLimit ? Math.min(tier.allocationLimit, count) : count;
  return Math.max(1, capped);
};

/**
 * The best tier a cart of this diamond value qualifies for.
 */
export const getApplicableFreeGift = (diamondValue, gifts = null) => {
  const tierList = gifts || dynamicTiers || FREE_GIFTS;
  const value = Number(diamondValue) || 0;
  let applicable = null;
  for (const gift of tierList) {
    if (value >= gift.threshold) applicable = gift;
  }
  return applicable;
};

/**
 * The next not-yet-unlocked tier, for "add ₹X more to unlock" messaging.
 */
export const getNextFreeGift = (diamondValue, gifts = null) => {
  const tierList = gifts || dynamicTiers || FREE_GIFTS;
  const value = Number(diamondValue) || 0;
  return tierList.find((gift) => value < gift.threshold) || null;
};

/**
 * Computes next unlock milestone, including spend multiplier steps (e.g. ₹60k -> 2, ₹90k -> 3).
 */
export const getNextGiftMilestone = (diamondValue, gifts = null, currentTier = null) => {
  const value = Number(diamondValue) || 0;
  const tierList = gifts || dynamicTiers || FREE_GIFTS;

  const nextHigherTier = tierList.find((g) => value < g.threshold);

  if (currentTier?.scaleQuantityWithSpend && currentTier.threshold > 0) {
    const currentQty = Math.floor(value / currentTier.threshold);
    const nextQty = Math.max(1, currentQty + 1);
    const nextMultipleThreshold = nextQty * currentTier.threshold;

    if (!currentTier.allocationLimit || nextQty <= currentTier.allocationLimit) {
      if (!nextHigherTier || nextMultipleThreshold <= nextHigherTier.threshold) {
        return {
          threshold: nextMultipleThreshold,
          remaining: Math.max(0, nextMultipleThreshold - value),
          title: currentTier.title,
          worthLabel: currentTier.worthLabel,
          worthValue: currentTier.worthValue,
          targetQuantity: nextQty,
          isMultiplier: true,
        };
      }
    }
  }

  if (nextHigherTier) {
    return {
      threshold: nextHigherTier.threshold,
      remaining: Math.max(0, nextHigherTier.threshold - value),
      title: nextHigherTier.title,
      worthLabel: nextHigherTier.worthLabel,
      worthValue: nextHigherTier.worthValue,
      targetQuantity: 1,
      isMultiplier: false,
    };
  }

  return null;
};
