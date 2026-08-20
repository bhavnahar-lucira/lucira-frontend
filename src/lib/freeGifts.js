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

const FREE_GIFT_VARIANT_IDS = new Set(FREE_GIFTS.map((g) => g.variantId));

// True for any configured free-gift variant — use this instead of comparing
// against a single hardcoded variant ID so new tiers are picked up everywhere
// (subtotal/savings/insurance-quantity/item-list exclusions) automatically.
export const isFreeGiftVariant = (variantId) => FREE_GIFT_VARIANT_IDS.has(variantId);

/**
 * The single best gift a cart of this diamond value currently qualifies for.
 * Tiers are assumed ascending by threshold; the highest one cleared wins (a
 * shopper who clears a later, better tier isn't stuck with an earlier one).
 *
 * `gifts` defaults to the static FREE_GIFTS list but callers may pass a
 * threshold-overridden copy — see FreeGiftReward, which merges in the live
 * {enabled, threshold} from /api/settings/silver-bracelet the same way
 * GoldCoinOption merges in /api/settings/gold-coin, so an admin can retune
 * the threshold (or switch the offer off) without a code deploy.
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
