// Single source of truth for the free-gift-with-purchase ladder shown in the
// cart's "Saving Zone" area (FreeGiftReward). Mirrors the pattern in
// lib/coupons.js — one config array plus small pure helpers — so a new tier
// (or a new gift product on the same tier) is a one-line edit here rather
// than a change in every file that touches cart totals.
//
// Callers must pass the DIAMOND value of the cart (same qualifying value used
// for the coupon ladder), not the full subtotal: plain gold does not count
// toward these tiers. Each file already computes its own local diamondTotal
// (CartSummary/GoldCoinOption use a diamondCharges-based sum, CheckoutSummary
// uses a different product-type heuristic for its own purposes) — this module
// deliberately does not unify those, it just accepts whatever number a caller
// hands it.
export const FREE_GIFTS = [
  {
    id: "silver-diamond-bracelet",
    threshold: 30000,
    variantId: "gid://shopify/ProductVariant/48414958715098",
    productId: "gid://shopify/Product/9438188896474",
    // Short noun phrase — used in-line as "a FREE {title} worth {worthLabel}".
    // The cart-line/breakdown label is derived from this ("Free " + title)
    // rather than stored separately, so the two never drift out of sync.
    title: "Diamond Bracelet",
    image: "https://cdn.shopify.com/s/files/1/0739/8516/3482/files/Bracelet_PNG_1.png",
    worthValue: 15000,
    worthLabel: "₹15,000",
  },
];

// True for any configured free-gift variant — use this instead of comparing
// against a single hardcoded variant ID so new tiers are picked up everywhere
// (subtotal/savings/insurance-quantity/item-list exclusions) automatically.
// Accepts the current gift list so a dashboard-added tier is recognized
// immediately, not just the two variants baked into this file at build time.
export const isFreeGiftVariant = (variantId, gifts = FREE_GIFTS) =>
  gifts.some((g) => g.variantId === variantId);

/**
 * Maps the backend's /api/settings/silver-bracelet tier shape
 * ({ min, giftVariantId, giftProductId, giftTitle, giftWorthValue, giftImage })
 * onto the shape the functions below expect.
 *
 * Falls back to the static FREE_GIFTS list only when `tiers` is missing
 * entirely (the settings doc hasn't been saved even once yet) — NOT when it's
 * an empty array. An empty array is a deliberate staff choice ("no gifts
 * configured right now") and must render as no gift, not silently resurrect
 * the old hardcoded bracelet.
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
    }))
    .filter((t) => t.variantId)
    // getApplicableFreeGift/getNextFreeGift assume ascending order.
    .sort((a, b) => a.threshold - b.threshold);
};

// Mirrors the backend's isTierLive (cartPricing.js) — a scheduled-but-not-
// yet-started or already-ended tier can't be newly claimed, even though its
// variant still needs to be recognized elsewhere (isFreeGiftVariant) so an
// already-claimed line from while it was live keeps pricing at ₹0.
export const isTierLive = (tier, now = Date.now()) => {
  if (tier.startsAt && new Date(tier.startsAt).getTime() > now) return false;
  if (tier.endsAt && new Date(tier.endsAt).getTime() < now) return false;
  return true;
};

/**
 * The single best gift a cart of this diamond value currently qualifies for.
 * Tiers are assumed ascending by threshold; the highest one cleared wins (a
 * shopper who clears a later, better tier isn't stuck with an earlier one).
 *
 * `gifts` defaults to the static FREE_GIFTS list but callers may pass the
 * live tier list instead — see FreeGiftReward, which fetches and maps
 * /api/settings/silver-bracelet via mapRemoteFreeGiftTiers so staff can add,
 * edit, or disable tiers from the dashboard without a code deploy.
 */
export const getApplicableFreeGift = (diamondValue, gifts = FREE_GIFTS) => {
  const value = Number(diamondValue) || 0;
  let applicable = null;
  for (const gift of gifts) {
    if (value >= gift.threshold) applicable = gift;
  }
  return applicable;
};

/**
 * The next not-yet-unlocked gift, for "add ₹X more to unlock" messaging.
 * Returns null once every configured tier has been cleared.
 */
export const getNextFreeGift = (diamondValue, gifts = FREE_GIFTS) => {
  const value = Number(diamondValue) || 0;
  return gifts.find((gift) => value < gift.threshold) || null;
};
