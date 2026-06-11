import { fetchWithRetry } from "@/utils/helpers";
import { logout } from "@/redux/features/user/userSlice";

/* ================= GENERIC API FETCH ================= */

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL.trim() !== "") 
  ? process.env.NEXT_PUBLIC_BACKEND_URL 
  : "http://localhost:8080";

export const apiFetch = async (url, options = {}) => {
  // All /api calls now go to the external backend since the local app/api is removed
  // We ensure the URL is absolute to avoid hitting the Next.js server on port 3000
  let finalUrl = url;
  if (url.startsWith("/api") && !url.startsWith("/api/proxy/")) {
    const base = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
    finalUrl = `${base}${url}`;
    
    // Debug log to confirm where requests are actually going
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
       console.log(`[apiFetch] Redirecting ${url} to ${finalUrl}`);
    }
  }

  let token = null;
  if (typeof window !== "undefined") {
    try {
      const persistRoot = localStorage.getItem("persist:root");
      if (persistRoot) {
        const rootState = JSON.parse(persistRoot);
        const userState = rootState.user ? JSON.parse(rootState.user) : null;
        if (userState?.accessToken) {
          token = `Bearer ${userState.accessToken}`;
        }
      }
    } catch (e) {
      console.warn("[apiFetch] Failed to retrieve token from localStorage:", e);
    }
  }

  try {
    const res = await fetch(finalUrl, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "Authorization": token } : {}),
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
      // Handle Unauthorized (Session Expired)
      if (res.status === 401) {
        console.warn("[apiFetch] Unauthorized request. Triggering global logout.", finalUrl);
        if (typeof window !== "undefined") {
          const { store } = await import("@/redux/store");
          store.dispatch(logout());
        }
      }

      // Improve error reporting
      const errorMsg = data?.error || data?.message || `HTTP ${res.status}`;
      
      // Downgrade "not found" errors to warnings to prevent console pollution
      if (res.status === 404 || errorMsg.toLowerCase().includes("not found")) {
        console.warn(`[apiFetch Resource Not Found] ${finalUrl}: ${errorMsg}`);
      } else if (res.status === 401 || res.status === 403) {
        console.warn(`[apiFetch Unauthorized] ${finalUrl}: ${errorMsg}`);
      } else if (!options.suppressErrorLog) {
        console.error(`[apiFetch Error] ${finalUrl}: ${errorMsg}`, data);
      }
      
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

export const fetchCustomerProfile = (accessToken) =>
  apiFetch("/api/customer/profile", {
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}
  });

export const fetchCustomerOrders = (accessToken) =>
  apiFetch("/api/customer/orders", {
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}
  });

export const fetchCustomerDashboardStats = (accessToken) =>
  apiFetch("/api/customer/dashboard-stats", {
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}
  });

export const fetchCustomerAddresses = (accessToken) => {
  if (!accessToken || accessToken.startsWith('simulated_')) return Promise.resolve({ addresses: [], customer: null, defaultAddressId: null });
  return apiFetch("/api/customer/addresses", {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
};

export const createCustomerAddress = ({ address, makeDefault = false }, accessToken) =>
  apiFetch("/api/customer/addresses", {
    method: "POST",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
    body: JSON.stringify({ address, makeDefault }),
  });

export const updateCustomerAddress = ({ addressId, address, makeDefault = false }, accessToken) =>
  apiFetch("/api/customer/addresses", {
    method: "PATCH",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
    body: JSON.stringify({ addressId, address, makeDefault, mode: "update" }),
  });

export const selectDefaultCustomerAddress = (addressId, accessToken) =>
  apiFetch("/api/customer/addresses", {
    method: "PATCH",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
    body: JSON.stringify({ addressId, mode: "default" }),
  });

export const deleteCustomerAddress = (addressId, accessToken) =>
  apiFetch(`/api/customer/addresses?addressId=${encodeURIComponent(addressId)}`, {
    method: "DELETE",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
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

export const fetchCheckoutAddressSelection = (accessToken) =>
  apiFetch("/api/checkout/address-selection", {
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}
  });

export const saveCheckoutAddressSelection = ({ billingAddressMode, billingAddressId = "" }, accessToken) =>
  apiFetch("/api/checkout/address-selection", {
    method: "PATCH",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
    body: JSON.stringify({ billingAddressMode, billingAddressId }),
  });

export const createRazorpayOrder = (payload, accessToken) =>
  apiFetch("/api/payment/razorpay/order", {
    method: "POST",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
    body: JSON.stringify(payload),
  });

export const completeRazorpayPayment = (payload, accessToken) =>
  apiFetch("/api/payment/razorpay/complete", {
    method: "POST",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
    body: JSON.stringify(payload),
  });

/* ================= ATTACH CART ================= */

export const attachCartApi = ({ cartId }, accessToken) =>
  apiFetch("/api/cart/attach", {
    method: "POST",
    headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
    body: JSON.stringify({ cartId }),
  });

/* ================= CREATE CART ================= */

export const createCartApi = () =>
  apiFetch("/api/cart/create", {
    method: "POST",
    body: JSON.stringify({}),
  });

/* ================= SEARCH RESULTS ================= */

export const fetchSearchResults = async (query) => {
  if (!query) return { results: [] };
  try {
    const data = await apiFetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=6`);
    const formatPrice = (num) => {
      if (!num && num !== 0) return '';
      return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(Number(num)));
    };
    // Map products → results shape expected by SearchPopup
    const productResults = (data.products || []).map(p => ({
      id: p.shopifyId || p.id,
      title: p.title,
      url: `/products/${p.handle}`,
      image: p.image || p.variants?.[0]?.image || '',
      price: formatPrice(p.price_breakup?.total || p.price),
      isCollection: false,
    }));
    const collectionResults = (data.matchedCollections || []).map(c => ({
      id: c.shopifyId || c.id || c._id,
      title: c.title,
      url: `/collections/${c.handle}`,
      image: c.image || '',
      isCollection: true,
    }));
    return { results: [...collectionResults, ...productResults] };
  } catch (err) {
    console.error('[fetchSearchResults] Error:', err);
    return { results: [] };
  }
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

/* ================= LOCAL RATES ================= */

export const fetchLocalRates = () => apiFetch("/api/local-rates");

/* ================= ORNAVERSE SCHEMES ================= */

export const fetchOrnaverseCustomer = (mobile) =>
  apiFetch("/api/schemes/customer/get", {
    method: "POST",
    body: JSON.stringify({ mobile }),
  });

export const updateOrnaverseCustomer = (payload) =>
  apiFetch("/api/schemes/customer/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createOrnaverseCustomer = (payload) =>
  apiFetch("/api/schemes/customer/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createOrnaverseEnrollment = (payload) =>
  apiFetch("/api/schemes/enrollments/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchOrnaverseEnrollments = (partyId) =>
  apiFetch(`/api/schemes/enrollments?party_id=${partyId}`);

export const createOrnaverseReceipt = (payload) =>
  apiFetch("/api/schemes/receipt/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createSchemeRazorpayPlan = (amount, tenure) =>
  apiFetch("/api/schemes/razorpay/plan", {
    method: "POST",
    body: JSON.stringify({ amount, tenure }),
  });

