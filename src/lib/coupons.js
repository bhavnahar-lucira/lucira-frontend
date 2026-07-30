// Single source of truth for the promotional coupon ladder shown on the PDP
// (UnlockCoupon) and in the cart's Saving Zone drawer. Both surfaces render the
// same list through the shared CouponCard, so edits here reach every surface.
export const COUPONS = [
  {
    code: "GRAND250",
    title: "Flat ₹250 off*",
    condition: "On Purchase below ₹15000/-",
  },
  {
    code: "GRAND500",
    title: "Flat ₹500 off*",
    condition: "On Purchase ₹15001 - ₹30000/-",
  },
  {
    code: "GRAND750",
    title: "Flat ₹750 off*",
    condition: "On Purchase ₹30001 - ₹50000/-",
  },
  {
    code: "GRAND1000",
    title: "Flat ₹1000 off*",
    condition: "On Purchase ₹50001 - ₹100000/-",
  },
  {
    code: "GRAND1500",
    title: "Flat ₹1500 off*",
    condition: "On Purchase ₹1 Lakh & Above",
  },
];

export const COUPON_DISCLAIMER = "*This coupons applicable for Diamond products";

export const parsePrice = (price) => {
  if (price === undefined || price === null) return 0;
  if (typeof price === "number") return price;
  const clean = String(price).replace(/[^0-9.]/g, "");
  return parseFloat(clean) || 0;
};

// Index of the first coupon whose tier the given cart/product value clears.
export const getCouponIndexForPrice = (price) => {
  const numericPrice = parsePrice(price);
  if (numericPrice <= 15000) return 0;
  if (numericPrice <= 30000) return 1;
  if (numericPrice <= 50000) return 2;
  if (numericPrice <= 100000) return 3;
  return 4;
};

/**
 * The one coupon a cart of this value qualifies for. The tiers are exclusive
 * bands ("below ₹15000", "₹15001 - ₹30000", …), so exactly one code applies at
 * any value — every other card in the drawer is dead weight and gets disabled.
 *
 * Callers must pass the DIAMOND value of the cart, not the full subtotal: these
 * coupons do not apply to plain gold, so an all-gold cart passes 0 here and
 * gets null back, disabling every coupon.
 *
 * The backend remains the final authority — /api/cart/coupon/validate can still
 * reject a code this check allowed. This only spares the user from clicking a
 * coupon that cannot win.
 */
export const getApplicableCouponCode = (cartValue) => {
  const value = parsePrice(cartValue);
  if (value <= 0) return null;
  return COUPONS[getCouponIndexForPrice(value)]?.code ?? null;
};

/**
 * Returns an array of all coupon codes that the cart qualifies for.
 * This includes the highest tier achieved and all lower tiers.
 */
export const getApplicableCouponCodes = (cartValue) => {
  const value = parsePrice(cartValue);
  if (value <= 0) return [];
  const maxIndex = getCouponIndexForPrice(value);
  return COUPONS.slice(0, maxIndex + 1).map(c => c.code);
};
