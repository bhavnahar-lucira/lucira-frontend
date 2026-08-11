import { apiFetch } from './api';

const CONTEXT_KEY = 'lucira_active_search_id';
const EXPIRY_KEY = 'lucira_active_search_expiry';
const EXPIRY_MINUTES = 30;

function setContext(searchId) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CONTEXT_KEY, searchId);
  sessionStorage.setItem(EXPIRY_KEY, (Date.now() + EXPIRY_MINUTES * 60 * 1000).toString());
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const expiry = sessionStorage.getItem(EXPIRY_KEY);
  if (!expiry || Date.now() > parseInt(expiry, 10)) {
    sessionStorage.removeItem(CONTEXT_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
    return null;
  }
  return sessionStorage.getItem(CONTEXT_KEY);
}

function getUserId() {
  if (typeof window === 'undefined') return null;
  try {
    const persistRoot = localStorage.getItem("persist:root");
    if (persistRoot) {
      const rootState = JSON.parse(persistRoot);
      const userState = rootState.user ? JSON.parse(rootState.user) : null;
      return userState?.user?.id || null;
    }
  } catch (e) {}
  return null;
}

function getAnonymousId() {
  if (typeof window === 'undefined') return null;
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
}

export const startSearch = async (query, resultsCount) => {
  if (!query) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    const data = await apiFetch('/api/analytics/search/start', {
      method: 'POST',
      body: JSON.stringify({ query, resultsCount, customerId, anonymousId })
    });
    if (data && data.searchId) {
      setContext(data.searchId);
      return data.searchId;
    }
  } catch (error) {
    console.error("Failed to start search analytics", error);
  }
};

export const trackSearchResultsView = async (resultsCount) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'RESULTS_VIEW', metadata: { resultsCount }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track results view", error);
  }
};

export const trackProductClick = async (productId, position) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'PRODUCT_CLICK', productId, metadata: { position }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track product click", error);
  }
};

export const trackProductView = async (productId) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'PRODUCT_VIEW', productId, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track product view", error);
  }
};

export const trackAddToCart = async (productId, quantity = 1) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'ADD_TO_CART', productId, metadata: { quantity }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track add to cart", error);
  }
};

export const trackCheckout = async (cartItems) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    // We only trigger BEGIN_CHECKOUT for products in the cart that match the active search context.
    // If the checkout has multiple products, this triggers for the context if valid.
    // We don't have a single product ID if multiple items are bought, but we can pass the items.
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'BEGIN_CHECKOUT', metadata: { items: cartItems }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track checkout", error);
  }
};

export const trackPurchase = async (orderId, cartItems) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'PURCHASE', metadata: { orderId, items: cartItems }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track purchase", error);
  }
};

export const trackShippingStep = async (cartItems) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'SHIPPING_STEP', metadata: { itemsCount: cartItems?.length || 0 }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track shipping step", error);
  }
};

export const trackPaymentStep = async (cartItems) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'PAYMENT_STEP', metadata: { itemsCount: cartItems?.length || 0 }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track payment step", error);
  }
};

export const trackPaymentFailed = async (errorMessage) => {
  const searchId = getContext();
  if (!searchId) return;
  try {
    const customerId = getUserId();
    const anonymousId = getAnonymousId();
    await apiFetch('/api/analytics/search/event', {
      method: 'POST',
      body: JSON.stringify({ searchId, eventType: 'PAYMENT_FAILED', metadata: { error: errorMessage }, customerId, anonymousId })
    });
  } catch (error) {
    console.error("Failed to track payment failure", error);
  }
};
