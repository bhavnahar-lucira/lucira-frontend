// Shared social-proof helpers used by both the checkout cart and the product page,
// so every surface shows the SAME amplified numbers for a product.
//
// Real per-product counts { orders, addToCart, wishlist } come from
// POST /api/products/social-proof. They are amplified per-metric here purely for
// display credibility (e.g. 1 order -> "20+", 2 carts -> "100+", 2 wishlist -> "200+").

export const SOCIAL_PROOF_AMPLIFY = {
  orders: 20,
  cart: 50,
  wishlist: 100,
};

// Default labels (used by the checkout cart). The product page passes its own.
export const DEFAULT_SOCIAL_LABELS = {
  orders: "Orders",
  cart: "in Carts",
  wishlist: "Wishlisted",
};

export function formatSocialCount(n) {
  if (n >= 1000) {
    const k = n / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${String(rounded).replace(/\.0$/, "")}K+`;
  }
  return `${n}+`;
}

// Build the ordered list of available metrics: Orders -> Added to Cart -> Wishlisted.
// A metric is only included when its real count is > 0 (hide when absent).
export function buildSocialMetrics(sp, labels = DEFAULT_SOCIAL_LABELS) {
  if (!sp) return [];
  const metrics = [];
  if (sp.orders > 0) metrics.push({ key: "orders", label: labels.orders, value: sp.orders * SOCIAL_PROOF_AMPLIFY.orders });
  if (sp.addToCart > 0) metrics.push({ key: "cart", label: labels.cart, value: sp.addToCart * SOCIAL_PROOF_AMPLIFY.cart });
  if (sp.wishlist > 0) metrics.push({ key: "wishlist", label: labels.wishlist, value: sp.wishlist * SOCIAL_PROOF_AMPLIFY.wishlist });
  return metrics;
}
