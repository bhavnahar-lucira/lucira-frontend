/* ================= GENERIC API FETCH ================= */

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== "") 
  ? process.env.NEXT_PUBLIC_BACKEND_URL 
  : "http://127.0.0.1:8080";

export const apiFetch = async (url, options = {}) => {
  // All /api calls now go to the external backend since the local app/api is removed
  // We ensure the URL is absolute to avoid hitting the Next.js server on port 3000
  let finalUrl = url;
  if (url.startsWith("/api")) {
    const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
    finalUrl = `${base}${url}`;
    
    // Debug log to confirm where requests are actually going
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
       console.log(`[apiFetch] Redirecting ${url} to ${finalUrl}`);
    }
  }

  try {
    const res = await fetch(finalUrl, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    if (res.status === 204 || res.status === 205) return null;

    const contentType = res.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
      try { data = JSON.parse(data); } catch(e) {}
    }

    if (!res.ok) {
      // Improve error reporting
      const errorMsg = data?.error || data?.message || `HTTP ${res.status}`;
      console.error(`[apiFetch Error] ${finalUrl}: ${errorMsg}`, data);
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      console.error(`[apiFetch Network Error] Could not connect to ${finalUrl}. Ensure the Fastify backend is running.`);
    }
    throw err;
  }
};
/* ================= SEND OTP ================= */

export const sendOtpApi = (mobile) =>
  apiFetch("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ mobile }),
  });

/* ================= VERIFY OTP ================= */

export const verifyOtpApi = (mobile, otp) =>
  apiFetch("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ mobile, otp }),
  });

/* ================= REGISTER ================= */

export const checkCustomerApi = (payload) =>
  apiFetch("/api/auth/check-customer", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const registerCustomer = (payload) =>
  apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchCustomerAddresses = () => apiFetch("/api/customer/addresses");

export const createCustomerAddress = ({ address, makeDefault = false }) =>
  apiFetch("/api/customer/addresses", {
    method: "POST",
    body: JSON.stringify({ address, makeDefault }),
  });

export const updateCustomerAddress = ({ addressId, address, makeDefault = false }) =>
  apiFetch("/api/customer/addresses", {
    method: "PATCH",
    body: JSON.stringify({ addressId, address, makeDefault, mode: "update" }),
  });

export const selectDefaultCustomerAddress = (addressId) =>
  apiFetch("/api/customer/addresses", {
    method: "PATCH",
    body: JSON.stringify({ addressId, mode: "default" }),
  });

export const deleteCustomerAddress = (addressId) =>
  apiFetch(`/api/customer/addresses?addressId=${encodeURIComponent(addressId)}`, {
    method: "DELETE",
  });

export const fetchWishlistApi = (userId = "", sessionId = "") => {
  const q = new URLSearchParams();
  if (userId) q.set("userId", userId);
  if (sessionId) q.set("sessionId", sessionId);
  const path = q.toString() ? `/api/wishlist?${q.toString()}` : "/api/wishlist";
  return apiFetch(path);
};

export const addWishlistApi = (payload, userId = "", sessionId = "") => {
  const q = new URLSearchParams();
  if (userId) q.set("userId", userId);
  if (sessionId) q.set("sessionId", sessionId);
  const path = q.toString() ? `/api/wishlist?${q.toString()}` : "/api/wishlist";
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify({ product: payload, userId, sessionId }),
  });
};

export const syncWishlistApi = (items, userId = "", sessionId = "") => {
  const q = new URLSearchParams();
  if (userId) q.set("userId", userId);
  if (sessionId) q.set("sessionId", sessionId);
  const path = q.toString() ? `/api/wishlist?${q.toString()}` : "/api/wishlist";
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify({ items, userId, sessionId }),
  });
};

export const removeWishlistApi = (productId, variantId = "", userId = "", sessionId = "") => {
  const q = new URLSearchParams();
  q.set("productId", productId);
  if (variantId) q.set("variantId", variantId);
  if (userId) q.set("userId", userId);
  if (sessionId) q.set("sessionId", sessionId);
  return apiFetch(`/api/wishlist?${q.toString()}`, {
    method: "DELETE",
  });
};

export const fetchCheckoutAddressSelection = () =>
  apiFetch("/api/checkout/address-selection");

export const saveCheckoutAddressSelection = ({ billingAddressMode, billingAddressId = "" }) =>
  apiFetch("/api/checkout/address-selection", {
    method: "PATCH",
    body: JSON.stringify({ billingAddressMode, billingAddressId }),
  });

export const createRazorpayOrder = (payload) =>
  apiFetch("/api/payment/razorpay/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const completeRazorpayPayment = (payload) =>
  apiFetch("/api/payment/razorpay/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/* ================= ATTACH CART ================= */

export const attachCartApi = ({ cartId }) =>
  apiFetch("/api/cart/attach", {
    method: "POST",
    body: JSON.stringify({ cartId }),
  });

/* ================= CREATE CART ================= */

export const createCartApi = () =>
  apiFetch("/api/cart/create", {
    method: "POST",
    body: JSON.stringify({}),
  });

/* ================= SEARCH RESULTS ================= */

export const fetchSearchResults = (query) => {
  if (!query) return { results: [] };
  return apiFetch(`/api/products/search?q=${encodeURIComponent(query)}`);
};

/* ================= COLLECTION PRODUCTS ================= */

export const fetchCollectionProducts = async (params) => {
  const q = new URLSearchParams();
  q.set("handle", params.handle);
  q.set("limit", params.limit || 20);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.sort) q.set("sort", params.sort);
  if (params.filters !== undefined) {
    q.set("filters", params.filters);
  }
  return apiFetch(`/api/collection?${q.toString()}`);
};

/* ================= COLLECTION FILTERS ================= */

export const fetchCollectionFilters = async (handle) => {
  if (!handle) return { filters: {} };
  return apiFetch(`/api/collection/filters?handle=${handle}`);
};

/* ================= VARIANT PRICING ================= */

export const fetchVariantPricing = async (variantId, productId = "") => {
  if (!variantId) throw new Error("Variant ID required");
  const url = `/api/products/pricing?variantId=${variantId}${productId ? `&productId=${productId}` : ""}`;
  return apiFetch(url);
};

/* ================= PRODUCT REVIEWS ================= */

export const fetchProductReviews = async (productId) => {
  if (!productId) throw new Error("Product ID required");
  return apiFetch(`/api/reviews?productId=${productId}`);
};
