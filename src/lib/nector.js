import { apiFetch } from "./api";

const reviewCache = new Map();
const browserReviewCache = new Map();
const REVIEW_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

/**
 * Main function to fetch Nector reviews using Backend Proxy
 */
export const fetchNectorReviews = async (productId, options = {}) => {
  // Convert shopify ID to simple ID
  const id = productId ? String(productId).split("/").pop() : null;
  const cacheId = id || "global";

  // Check browser cache
  if (typeof window !== 'undefined') {
    if (browserReviewCache.has(cacheId)) {
      return browserReviewCache.get(cacheId);
    }
  }

  // Check server cache if applicable
  if (reviewCache.has(cacheId)) {
    const cached = reviewCache.get(cacheId);
    if (cached?.expiresAt > Date.now()) {
      return cached.data;
    }
    reviewCache.delete(cacheId);
  }

  const fetchReviewsInternal = async () => {
    try {
      const url = id ? `/api/reviews?productId=${id}` : `/api/reviews`;
      
      const reviews = await apiFetch(url);

      if (typeof window === 'undefined') {
        reviewCache.set(cacheId, {
          data: reviews,
          expiresAt: Date.now() + REVIEW_CACHE_TTL_MS,
        });
        setTimeout(() => reviewCache.delete(cacheId), REVIEW_CACHE_TTL_MS);
      }

      return reviews;
    } catch (e) {
      console.error(`Error fetching Nector reviews via proxy:`, e.message);
      return { count: 0, average: 0, list: [], items: [], stats: [], isProductView: !!id, usedFallback: false };
    }
  };

  if (typeof window !== 'undefined') {
    const fetchPromise = fetchReviewsInternal();
    browserReviewCache.set(cacheId, fetchPromise);
    return fetchPromise;
  }

  return fetchReviewsInternal();
};

export const loadNectorReviews = fetchNectorReviews;

/**
 * Submission logic - Proxied to backend
 */
export async function submitReview(payload) {
  try {
    const res = await apiFetch(`/api/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  } catch (error) {
    console.error("Nector Submit Review Error via proxy:", error);
    throw error;
  }
}

/**
 * Upload single image - Proxied to backend
 */
export async function uploadSingleImage(file, reviewId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parent_type', 'reviews');
    formData.append('parent_id', reviewId);

    const res = await apiFetch(`/api/reviews/uploads`, {
      method: 'POST',
      body: formData, // apiFetch handles FormData natively by omitting Content-Type
    });

    return res;
  } catch (error) {
    console.error("Nector Upload Error via proxy:", error);
    throw error;
  }
}

export function extractReviewId(result) {
  return (
    result?.data?.review?._id ||
    result?.data?.item?._id   ||
    result?.data?._id         ||
    result?.data?.id          ||
    result?.review?._id       ||
    result?._id               ||
    null
  );
}
