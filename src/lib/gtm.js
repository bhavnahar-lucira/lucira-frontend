// src/lib/gtm.js

export const pushToDataLayer = (data) => {
  if (typeof window !== "undefined") {
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
  pushToDataLayer({
    event: 'promoClick',
    promoClick: promoClickData
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

  return {
    sku: sku,
    productId: productId,
    productName: product?.title || product?.productName || "",
    brand: 'LuciraJewelry',
    productCategory: productCategory,
    productType: productType,
    price: getNumeric(variant?.price || product?.price || 0),
    quantity: 1,
    productUrl: `${currentOrigin}/products/${product?.handle || ""}?variant=${variant?.id || variant?.shopifyId || variant?.variantId || ""}`,
    thumbnailImage: thumbnailImage || variant?.image || product?.image?.url || product?.image || "",
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

export const pushAddToWishlist = (data) => {
  pushToDataLayer({
    event: "addToWishlist",
    products: data
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
    products: data
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