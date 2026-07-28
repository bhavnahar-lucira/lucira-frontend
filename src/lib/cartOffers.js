// Shared math for the two collection-level cart offers — the Eterna 3% (EMBRACE3%) and
// the Additional Offers slabs (ADDITIONALRS*). Only one coupon can be applied to a cart,
// so both the cart page and the checkout summary read from here to surface whichever
// offer is actually worth more to the shopper.

const INSURANCE_VARIANT_ID = "gid://shopify/ProductVariant/47709366026458";
const SILVER_PENDANT_VARIANT_ID = "gid://shopify/ProductVariant/48052809498842";
// Both ids in circulation for the gold coin — the current one and the legacy variant.
const GOLD_COIN_VARIANT_IDS = [
  "gid://shopify/ProductVariant/47661824082138",
  "gid://shopify/ProductVariant/47753346973914",
];

// Product tag marking an item as part of the "Additional Offers - Diamond Jewelry"
// Shopify collection the ADDITIONALRS* codes are entitled to.
export const ADDITIONAL_OFFER_TAG = "diamond jewelry";

// Eterna Collection products carry the "embrace" tag and have their own EMBRACE3% offer.
export const ETERNA_TAG = "embrace";
export const ETERNA_DISCOUNT_PERCENT = 3;

// Mirrors the ADDITIONALRS* discount codes in Shopify. `min` is the Shopify
// "minimum purchase" on each code, so the tier boundaries must stay in sync with it.
export const ADDITIONAL_OFFER_SLABS = [
  { min: 15000, max: 25000, amount: 250, code: "ADDITIONALRS250" },
  { min: 25001, max: 50000, amount: 500, code: "ADDITIONALRS500" },
  { min: 50001, max: 75000, amount: 750, code: "ADDITIONALRS750" },
  { min: 75001, max: 100000, amount: 1000, code: "ADDITIONALRS1000" },
  { min: 100001, max: Infinity, amount: 1500, code: "ADDITIONALRS1500" },
];

export const isAdditionalOfferCode = (code) => /^ADDITIONALRS\d+$/i.test(String(code || ""));

// Shoppers see the benefit, never the raw code — "Additional ₹500", not "ADDITIONALRS500".
export const getAdditionalOfferLabel = (code) => {
  const slab = ADDITIONAL_OFFER_SLABS.find((s) => s.code === String(code || "").toUpperCase());
  return slab ? `Additional ₹${slab.amount.toLocaleString("en-IN")}` : "Additional Offer";
};

export const formatInr = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const itemTags = (item) => (item?.tags || []).map((tag) => String(tag).trim().toLowerCase());

const lineTotal = (item) => Number(item?.price || 0) * Number(item?.quantity || item?.qty || 1);

// Add-ons and gifts are never part of either offer.
const isDiscountableItem = (item) => {
  if (!item) return false;
  if (item.isFreeGift) return false;
  if (item.variantId === INSURANCE_VARIANT_ID) return false;
  if (item.variantId === SILVER_PENDANT_VARIANT_ID) return false;
  return !GOLD_COIN_VARIANT_IDS.includes(item.variantId);
};

export const isEternaItem = (item) => isDiscountableItem(item) && itemTags(item).includes(ETERNA_TAG);

// Eterna products are carved out of the Additional Offers slab entirely — the two offers
// never draw on the same item.
export const isAdditionalOfferItem = (item) =>
  isDiscountableItem(item) &&
  !itemTags(item).includes(ETERNA_TAG) &&
  itemTags(item).includes(ADDITIONAL_OFFER_TAG);

const sumBy = (items, predicate) =>
  (items || []).filter(predicate).reduce((acc, item) => acc + lineTotal(item), 0);

// What the Additional Offers slabs are worth on this cart: { subtotal, slab, amount }.
export const getAdditionalOfferBenefit = (items) => {
  const subtotal = sumBy(items, isAdditionalOfferItem);
  const slab = ADDITIONAL_OFFER_SLABS.find((s) => subtotal >= s.min && subtotal <= s.max) || null;
  return { subtotal, slab, amount: slab ? slab.amount : 0 };
};

// What the Eterna 3% is worth on this cart: { subtotal, amount }.
export const getEternaBenefit = (items) => {
  const subtotal = sumBy(items, isEternaItem);
  return { subtotal, amount: (subtotal * ETERNA_DISCOUNT_PERCENT) / 100 };
};
