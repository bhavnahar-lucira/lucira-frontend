// src/lib/gtm.js

// Cache for deduplicating rapid events
const lastPushedEvents = new Map();
const MIN_EVENT_INTERVAL_MS = 1000; // 1 second between identical events

export const pushToDataLayer = (data) => {
  if (typeof window !== "undefined") {
    // Basic throttling for identical event types to prevent infinite loops from trackers
    if (data.event) {
      const now = Date.now();
      const lastPush = lastPushedEvents.get(data.event);

      if (lastPush && (now - lastPush < MIN_EVENT_INTERVAL_MS)) {
        // For some high-frequency events, we might want to skip or merge
        // But for things like 'addToCart', we should probably allow them if the data is different
        // Here we just log for debugging in dev
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[GTM] Throttling rapid event: ${data.event}`);
        }
        // If it's a pageView, we definitely want to throttle
        if (data.event === 'pageView') return;
      }
      lastPushedEvents.set(data.event, now);
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
};

export const pushPageView = (pageData) => {
  pushToDataLayer({
    event: 'pageView',
    pageData: pageData
  });
};

export const pushPromoClick = (promoClickData) => {
  const sanitizedData = { ...promoClickData };
  if (sanitizedData.location_id !== undefined && sanitizedData.location_id !== null) sanitizedData.location_id = String(sanitizedData.location_id);
  if (sanitizedData.offer_price !== undefined && sanitizedData.offer_price !== null) sanitizedData.offer_price = String(sanitizedData.offer_price);
  if (sanitizedData.price !== undefined && sanitizedData.price !== null) sanitizedData.price = String(sanitizedData.price);
  if (sanitizedData.product_id !== undefined && sanitizedData.product_id !== null) sanitizedData.product_id = String(sanitizedData.product_id);
  if (sanitizedData.promo_id !== undefined && sanitizedData.promo_id !== null) sanitizedData.promo_id = String(sanitizedData.promo_id);
  if (sanitizedData.promo_position !== undefined && sanitizedData.promo_position !== null) sanitizedData.promo_position = String(sanitizedData.promo_position);
  if (sanitizedData.variant_id !== undefined && sanitizedData.variant_id !== null) sanitizedData.variant_id = String(sanitizedData.variant_id);

  pushToDataLayer({
    event: 'promoClick',
    promoClick: sanitizedData
  });
};

export const pushPromoView = (promoViewData) => {
  pushToDataLayer({
    event: 'promoView',
    promoView: promoViewData
  });
};

export const pushProductImpression = (products) => {
  pushToDataLayer({
    event: 'productImpression',
    products: products
  });
};

export const pushProductClick = (data) => {
  pushToDataLayer({
    event: "productClick",
    products: data
  });
};

export const pushProductView = (productData) => {
  pushToDataLayer({
    event: "productView",
    products: productData
  });
};

export const pushAddToCart = (data) => {
  pushToDataLayer({
    event: "addToCart",
    eventId: data.eventId,
    products: data.products
  });
};

export const getNumericId = (gid) => {
  if (!gid) return 0;
  if (typeof gid === 'number') return gid;
  const match = String(gid).match(/\d+$/);
  return match ? Number(match[0]) : 0;
};

export const getStandardWishlistPayload = (product, variant, currentOrigin, thumbnailImage) => {
  const getNumeric = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Robust SKU resolution
  const sku =
    variant?.sku ||
    product?.sku ||
    variant?.variantSku ||
    product?.variantSku ||
    variant?.item_sku ||
    product?.item_sku ||
    (product?.variants && product?.variants[0]?.sku) ||
    (product?.variantOptions && product?.variantOptions[0]?.sku) ||
    "";

  // Robust Product ID resolution
  const rawProductId = product?.shopifyId || product?.id || product?.productId || "";
  const productId = String(getNumericId(rawProductId)) === "0" ? String(rawProductId) : String(getNumericId(rawProductId));

  // Robust Category/Type resolution
  const productType = product?.type || product?.productType || "";
  const productCategory = product?.category || product?.productCategory || productType || "";

  const imageUrl = thumbnailImage || variant?.image || product?.image?.url || product?.image || "";
  const finalPrice = variant?.price || product?.price || 0;
  const comparePrice = variant?.compare_price || variant?.compareAtPrice || product?.compare_price || product?.compareAtPrice || finalPrice;
  const resolvedVariantId = String(getNumericId(variant?.id || variant?.shopifyId || variant?.variantId || 0));

  return {
    sku: sku,
    productId: productId,
    variantId: resolvedVariantId,
    variant_id: resolvedVariantId,
    productName: product?.title || product?.productName || "",
    brand: 'LuciraJewelry',
    productCategory: productCategory,
    productType: productType,
    price: String(finalPrice),
    offerPrice: String(comparePrice),
    quantity: 1,
    productUrl: `${currentOrigin}/products/${product?.handle || ""}?variant=${variant?.id || variant?.shopifyId || variant?.variantId || ""}`,
    image: imageUrl ? [imageUrl] : [],
    thumbnailImage: imageUrl,
    currency: "INR"
  };
};

export const getStandardCartItem = (item, idx = 0) => {
  const prodId = String(getNumericId(item.productId || item.shopifyId || item.id));
  const lowerTitle = (item.title || "").toLowerCase();

  let category = item.type || item.productType || "";
  if (!category) {
    if (lowerTitle.includes("ring")) category = "Rings";
    else if (lowerTitle.includes("earring") || lowerTitle.includes("bali")) category = "Earrings";
    else if (lowerTitle.includes("pendant")) category = "Pendants";
    else if (lowerTitle.includes("bracelet")) category = "Bracelets";
  }

  // Robust SKU resolution for cart items
  const variantId = item.variantId || item.id || item.shopifyId || "";
  const currentVariant = item.variantOptions?.find(v =>
    String(getNumericId(v.variantId || v.id || v.shopifyId)) === String(getNumericId(variantId))
  );

  const sku =
    item.sku ||
    currentVariant?.sku ||
    item.variantSku ||
    item.item_sku ||
    (item.variantOptions && item.variantOptions[0]?.sku) ||
    "";

  return {
    id: prodId,
    sku: sku,
    variant_id: String(getNumericId(item.variantId)),
    product_name: item.title,
    product_type: category,
    category: "Lucira Jewelry",
    sub_category: item.variantTitle || category,
    price: Number(item.price || 0),
    offer_price: Number(item.comparePrice || item.price || 0),
    quantity: item.quantity,
    thumbnail_image: item.image,
    index_position: idx + 1
  };
};

export const getStandardImpressionProducts = (products, currentOrigin = "") => {
  return products.map((product, idx) => {
    const getNumeric = (val) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    // Robust SKU resolution
    const sku =
      product?.sku ||
      product?.variantSku ||
      product?.item_sku ||
      (product?.variants && product?.variants[0]?.sku) ||
      (product?.variantOptions && product?.variantOptions[0]?.sku) ||
      "";

    // Robust Product ID resolution
    const rawProductId = product?.shopifyId || product?.id || product?.productId || "";
    const itemId = String(getNumericId(rawProductId)) === "0" ? String(rawProductId) : String(getNumericId(rawProductId));

    // Robust Category resolution
    const category = product?.type || product?.productType || "Jewelry";

    // Build product URL
    const baseUrl = currentOrigin || (typeof window !== "undefined" ? window.location.origin : "");
    const handle = product?.handle || "";
    const variantId = product?.variants?.[0]?.id || product?.variantId || "";
    const itemUrl = variantId
      ? `${baseUrl}/products/${handle}?variant=${variantId}`
      : `${baseUrl}/products/${handle}`;

    // Price resolution (price is original, offer_price is discounted)
    const originalPrice = getNumeric(product?.price || 0);
    const comparePrice = getNumeric(product?.comparePrice || product?.originalPrice || product?.price || 0);

    return {
      item_id: itemId,
      item_name: product?.title || "",
      item_sku: sku,
      category: category,
      item_url: itemUrl,
      price: String(originalPrice),
      offer_price: String(comparePrice),
      index: idx + 1
    };
  });
};

export const pushAddToWishlist = (data) => {
  pushToDataLayer({
    event: "addToWishlist",
    products: Array.isArray(data) ? data : [data]
  });
};

export const pushViewCart = (cartData) => {
  pushToDataLayer({
    event: "viewCart",
    cart: cartData
  });
};

const pushEventModel = (event, data) => {
  pushToDataLayer({
    event,
    eventModel: data
  });
};

const pushEcommerceEvent = (event, data) => {
  pushToDataLayer({
    event,
    ecommerce: data
  });
};

export const pushBeginCheckout = (checkoutData) => pushEventModel("begin_checkout", checkoutData);
export const pushAddShippingInfo = (shippingData) => pushEventModel("add_shipping_info", shippingData);
export const pushAddPaymentInfo = (paymentData) => pushEventModel("add_payment_info", paymentData);

export const pushPurchase = (purchaseData) => pushEventModel("purchase", purchaseData);
export const pushPaymentFailure = (failureData) => pushEcommerceEvent("Payment failure", failureData);

export const pushRemoveFromCart = (data) => {
  pushEcommerceEvent("removeFromCart", { product: data });
};

export const pushRemoveFromWishlist = (data) => {
  pushToDataLayer({
    event: "removeFromWishlist",
    products: Array.isArray(data) ? data : [data]
  });
};

export const pushCustomerData = (customerData) => {
  pushToDataLayer({
    event: 'customerData',
    customer: customerData
  });
};

export const pushMarketingData = (marketingData) => {
  pushToDataLayer({
    event: 'marketingData',
    marketing: marketingData
  });
};

export const pushNewsletterSubscription = (email) => {
  pushToDataLayer({
    event: 'newsletterSubscription',
    newsletter: {
      email: email
    }
  });
};

export const pushSignup = (userData) => {
  pushToDataLayer({
    event: "signup",
    user: userData
  });
};

export const pushLogout = (userData) => {
  pushToDataLayer({
    event: 'logout',
    user: userData // Standardized to lowercase 'user'
  });
};

export const pushLogin = (userData) => {
  pushToDataLayer({
    event: 'login',
    user: userData // Standardized to lowercase 'user'
  });
};

// Helper for formatting price safely
export const formatGtmPrice = (price) => {
  const p = parseFloat(price);
  return isNaN(p) ? 0.00 : parseFloat(p.toFixed(2));
};
