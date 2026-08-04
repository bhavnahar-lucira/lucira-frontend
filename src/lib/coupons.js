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

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const GOLDCOIN_VARIANT_ID = "gid://shopify/ProductVariant/47753346973914";

/**
 * The one place the coupon discount is computed. Every surface that shows or
 * charges a total — cart page, cart drawer, shipping, payment, order creation —
 * must call this, otherwise the summary and the amount charged drift apart.
 *
 * A PERCENTAGE coupon can be restricted to specific products or collections in
 * Shopify. The backend reports that as `restricted` plus the `applicableItemIds`
 * it resolved; a restricted coupon discounts only those lines, never the whole
 * subtotal. No coupon code is special-cased here — eligibility comes entirely
 * from what the backend resolved.
 *
 * @param appliedCoupon  the coupon from the cart (object, or a bare code string)
 * @param items          cart line items
 * @param subtotalValue  subtotal the caller already computed (insurance excluded)
 */
export const calculateCouponDiscount = (appliedCoupon, items, subtotalValue) => {
  if (!appliedCoupon) return 0;

  const couponDetails =
    typeof appliedCoupon === "object"
      ? appliedCoupon
      : { code: appliedCoupon, value: 0, valueType: "FIXED_AMOUNT" };

  if (couponDetails.valueType === "FIXED_AMOUNT") {
    return Number(couponDetails.value || 0);
  }

  if (couponDetails.valueType !== "PERCENTAGE") return 0;

  const applicableItemIds = couponDetails.applicableItemIds || [];
  // `restricted` is authoritative. Older cart entries persisted before the flag
  // existed only carry applicableItemIds, so treat a non-empty list as
  // restricted too — otherwise a product-limited coupon silently discounts the
  // whole cart.
  const isRestricted = couponDetails.restricted ?? applicableItemIds.length > 0;

  if (!isRestricted) {
    return (Number(subtotalValue || 0) * couponDetails.value) / 100;
  }

  const applicableSubtotal = (items || [])
    .filter((item) => {
      if (
        item.variantId === INSURANCE_VARIANT_ID ||
        (item.variantId === GOLDCOIN_VARIANT_ID && item.isFreeGift)
      )
        return false;
      const rawId = item.shopifyId || item.productId || item.id;
      const gid = (rawId && rawId.toString().includes("gid://"))
        ? rawId
        : `gid://shopify/Product/${rawId}`;
      return applicableItemIds.includes(gid);
    })
    .reduce(
      (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

  return (applicableSubtotal * couponDetails.value) / 100;
};
