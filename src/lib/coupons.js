
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


/**
 * Whether a cart may hold these offers at the same time.
 *
 * The only gate is the dashboard's own "Combine coupons" toggle — every offer
 * involved has to have it on, and each has to independently qualify (its own
 * category is in the cart and clears its own minimum). Two offers landing on
 * the same lines (e.g. two Diamond-scoped rules) are allowed to combine too
 * if staff opted both in — calculateCouponDiscount already sums each coupon's
 * discount independently regardless of category, so a flat-amount and a
 * percentage rule both applying to the same Diamond Jewelry lines is exactly
 * what "Combine coupons" is meant to produce; Shopify enforces this the same
 * way via combinesWith, which the dashboard sets from the same toggle.
 *
 * Anything else (any offer without the toggle on, or one that doesn't
 * currently qualify) falls back to one-coupon-at-a-time.
 */
export const canCombineOffers = (offers, totals) => {
  const list = (offers || []).filter(Boolean);
  if (list.length < 2) return false;
  if (!list.every((o) => o.combineCoupons)) return false;

  return list.every((o) => {
    const base = getCategoryBase(getOfferCategory(o), totals);
    return base > 0 && base >= Number(o.minAmount || 0);
  });
};

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";

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

  // A combined cart carries a list. The offers are category-restricted over
  // disjoint lines (see canCombineOffers), so their discounts add up —
  // recursing per coupon keeps the restricted/unrestricted branching below
  // as the single place that knows how one coupon is priced.
  if (Array.isArray(appliedCoupon)) {
    return appliedCoupon.reduce(
      (acc, c) => acc + calculateCouponDiscount(c, items, subtotalValue),
      0
    );
  }

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
        item.isFreeGift
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

/* ------------------------------------------------------------------ *
 * Offer categories
 *
 * The current offer structure is split by metal: diamond products carry
 * one "additional % off" rule and plain gold products carry a smaller
 * one, and the two never stack — a mixed cart shows whichever single
 * offer is worth more. Nothing in the dashboard payload states which
 * category a rule belongs to, so it's inferred from the words staff
 * already put in the code/title/condition ("5PERCENTDIAMOND",
 * "2PERCENTGOLD", "…on plain gold"). A rule that names both metals, or
 * neither, is treated as cart-wide.
 * ------------------------------------------------------------------ */
export const OFFER_CATEGORY = {
  DIAMOND: "diamond",
  GOLD: "gold",
  ALL: "all",
};

export const OFFER_CATEGORY_LABEL = {
  [OFFER_CATEGORY.DIAMOND]: "Diamond Products",
  [OFFER_CATEGORY.GOLD]: "Plain Gold Products",
  [OFFER_CATEGORY.ALL]: "Your Entire Order",
};

const DIAMOND_KEYWORDS = /(diamond|solitaire|gemstone)/;
const GOLD_KEYWORDS = /(gold)/;

export const getOfferCategory = (coupon) => {
  // Tier 1: staff-authored text (code/title/condition/description) — the
  // rule's own words about itself, checked first so a rule that already
  // names its metal is never second-guessed by what it happens to apply to
  // (e.g. a collection named "Rose Gold Collection" scoping an otherwise
  // diamond-titled rule shouldn't flip it to gold).
  const primaryHaystack = [coupon?.code, coupon?.title, coupon?.condition, coupon?.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const primaryIsDiamond = DIAMOND_KEYWORDS.test(primaryHaystack);
  const primaryIsGold = GOLD_KEYWORDS.test(primaryHaystack);

  if (primaryIsDiamond && !primaryIsGold) return OFFER_CATEGORY.DIAMOND;
  if (primaryIsGold && !primaryIsDiamond) return OFFER_CATEGORY.GOLD;

  // Tier 2: what the rule actually applies to. A code like "GRAND750" names
  // no metal at all, but can still be scoped to a Diamond Jewelry collection
  // — without this fallback that rule reads as category-less ("ALL"), which
  // silently blocks it from ever combining with another offer (canCombineOffers
  // refuses to combine anything touching OFFER_CATEGORY.ALL) regardless of
  // its own "Combine coupons" toggle in the dashboard.
  const scopeHaystack = [
    ...(Array.isArray(coupon?.collectionTitles) ? coupon.collectionTitles : []),
    ...(Array.isArray(coupon?.productTitles) ? coupon.productTitles : []),
  ]
    .join(" ")
    .toLowerCase();

  const scopeIsDiamond = DIAMOND_KEYWORDS.test(scopeHaystack);
  const scopeIsGold = GOLD_KEYWORDS.test(scopeHaystack);

  if (scopeIsDiamond && !scopeIsGold) return OFFER_CATEGORY.DIAMOND;
  if (scopeIsGold && !scopeIsDiamond) return OFFER_CATEGORY.GOLD;

  // A featured/bank-offer rule landing here has lost its metal-specific
  // banner, icon, and combine-eligibility with no visible error anywhere —
  // this is the only signal a misclassified rule gets, so surface it in dev.
  if (process.env.NODE_ENV === "development" && (coupon?.isFeatured || coupon?.isBankOffer)) {
    console.warn(
      `[getOfferCategory] "${coupon?.code || coupon?.title || "unknown coupon"}" did not match a single diamond/gold keyword ` +
      `in its own text or in what it applies to — falling back to OFFER_CATEGORY.ALL, which loses its metal-specific theme and combine eligibility.`
    );
  }

  return OFFER_CATEGORY.ALL;
};

const STONE_KEYWORDS = /(diamond|solitaire|gemstone)/;

/**
 * Which category a cart line belongs to, for offer purposes.
 *
 * Order matters, and the first rule is the one that was missing: an explicit
 * "plain gold" tag wins outright. This catalogue tags most gold products
 * "Gold & Diamond" as a merchandising label, so any keyword sweep across tags
 * reads a plain gold chain as diamond — which is how a ₹54,943 gold chain
 * ended up advertising the 5% diamond offer.
 *
 * After that the authority is the price breakup: `diamondCharges` is
 * price_breakup.diamond.final, carried onto the line when it was added, so a
 * value above zero means the item genuinely has stones in it. The fuzzy
 * title/type fallbacks only run when neither of those resolved, and tags that
 * name both metals are ignored there for the same reason as above.
 */
export const getItemOfferCategory = (item) => {
  const tags = Array.isArray(item?.tags) ? item.tags.map((t) => String(t).toLowerCase()) : [];
  if (tags.some((t) => t.replace(/[-_]/g, " ").includes("plain gold"))) return OFFER_CATEGORY.GOLD;

  let charges = Number(item?.diamondCharges || 0);

  // The line was added before diamondCharges resolved — recover it from the
  // variant config the same way the PDP does on add-to-cart.
  if (charges === 0 && item?.metafields?.variant_config) {
    try {
      const config = JSON.parse(item.metafields.variant_config);
      if (config.advanced_stone_config) {
        charges = config.advanced_stone_config.reduce((acc, s) => acc + (s.stone_weight * 50000), 0);
      } else if (config.diamond_charges) {
        charges = config.diamond_charges;
      }
    } catch (e) {
      /* malformed config — fall through to the keyword checks */
    }
  }
  if (charges > 0) return OFFER_CATEGORY.DIAMOND;

  const title = (item?.title || "").toLowerCase();
  const handle = (item?.handle || "").toLowerCase();
  const type = (item?.type || item?.category || item?.productType || item?.product_type || "").toLowerCase();
  if (STONE_KEYWORDS.test(title) || STONE_KEYWORDS.test(handle) || STONE_KEYWORDS.test(type)) {
    return OFFER_CATEGORY.DIAMOND;
  }
  // A tag naming both metals ("Gold & Diamond") says nothing about which of
  // the two this particular product is, so it can't decide the category.
  if (tags.some((t) => STONE_KEYWORDS.test(t) && !t.includes("gold"))) return OFFER_CATEGORY.DIAMOND;

  return OFFER_CATEGORY.GOLD;
};

/**
 * The slice of the cart an offer of this category can actually discount.
 * Ranking two offers against each other is only meaningful on their own
 * base — a diamond rule measured against a gold-only cart reads as ₹0,
 * which is exactly what should disqualify it from the banner.
 */
export const getCategoryBase = (category, { diamondTotal = 0, goldTotal = 0, productTotal = 0 } = {}) => {
  if (category === OFFER_CATEGORY.DIAMOND) return diamondTotal;
  if (category === OFFER_CATEGORY.GOLD) return goldTotal;
  return productTotal;
};
