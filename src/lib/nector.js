import { fetchWithRetry } from "@/utils/helpers";

const reviewCache = new Map();
const REVIEW_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

/**
 * Main function to fetch Nector reviews using Direct API
 */
export const fetchNectorReviews = async (productId, options = {}) => {
  // If running in the browser, call the local API route to protect keys
  if (typeof window !== 'undefined') {
    try {
      const url = productId 
        ? `/api/reviews?productId=${encodeURIComponent(productId)}`
        : `/api/reviews/list?limit=1000`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("Error fetching reviews via local API:", e.message);
      return { count: 0, average: 0, list: [], items: [], stats: [], isProductView: !!productId, usedFallback: false };
    }
  }

  // Convert shopify ID to simple ID
  const id = productId ? String(productId).split("/").pop() : null;
  const cacheId = id || "global";

  if (reviewCache.has(cacheId)) {
    const cached = reviewCache.get(cacheId);
    if (cached?.expiresAt > Date.now()) {
      return cached.data;
    }
    reviewCache.delete(cacheId);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    // Try cachefront first
    const baseUrl = `https://cachefront.nector.io/api/v2/merchant/reviews`;
    let url = id 
      ? `${baseUrl}?page=1&limit=20&sort=image_count&sort_op=DESC&reference_product_id=${id}&reference_product_source=shopify`
      : `${baseUrl}?page=1&limit=200&sort=created_at&sort_op=DESC`;

    let res = await fetch(url, {
      headers: {
        "x-apikey": process.env.NECTOR_API_KEY,
        "x-workspaceid": process.env.NECTOR_WORKSPACE_ID,
        "x-source": "web",
      },
      signal: controller.signal,
      cache: "force-cache",
      next: { revalidate: REVIEW_CACHE_TTL_MS / 1000 }
    });

    let json = await res.json();
    
    // If global fetch returned nothing, try the main API endpoint
    if (!id && (!json?.data?.items || json.data.items.length === 0)) {
       const mainApiUrl = `https://api.nector.io/v1/merchant/reviews?page=1&limit=100`;
       const res2 = await fetch(mainApiUrl, {
         headers: {
           "x-apikey": process.env.NECTOR_API_KEY,
           "x-workspaceid": process.env.NECTOR_WORKSPACE_ID,
         },
         cache: "force-cache",
         next: { revalidate: REVIEW_CACHE_TTL_MS / 1000 }
       });
       if (res2.ok) {
         const json2 = await res2.json();
         if (json2?.data?.items?.length > 0) {
           json = json2;
         }
       }
    }

    clearTimeout(timeoutId);

    const data = json?.data || {};
    const stats = data.stats || [];
    const count = data.count || (data.items?.length || 0);
    const items = data.items || [];

    let total = 0;
    let ratingCount = 0;

    if (Array.isArray(stats)) {
      stats.forEach(s => {
        total += Number(s.rating) * Number(s.count);
        ratingCount += Number(s.count);
      });
    }

    const reviews = {
      count,
      average: ratingCount ? Number((total / ratingCount).toFixed(1)) : (data.average_rating || 0),
      stats: Array.isArray(stats) ? stats.map(s => ({ rating: Number(s.rating), count: Number(s.count) })) : [],
      items: items.map(r => ({
        id: r._id || r.id,
        name: r.name || "Verified Buyer",
        rating: r.rating,
        text: r.description || r.body || "",
        date: r.posted_at || r.created_at,
        posted_at: r.posted_at,
        created_at: r.created_at,
        is_verified: r.is_verified || r.verified,
        images: r.uploads?.filter(u => u.type === "image" && u.link).map(u => u.link) || [],
        videos: r.uploads?.filter(u => u.type === "video" && u.link).map(u => u.link) || [],
        image_count: r.image_count || 0,
        video_count: r.video_count || 0,
        title: r.title || r.reference_product_name || "",
        uploads: r.uploads,
        reference_product_name: r.reference_product_name,
        reference_product_handle: r.reference_product_handle,
        reference_product_image: r.reference_product_image
      })),
      isProductView: !!id,
      usedFallback: false
    };

    reviews.list = reviews.items;
    reviewCache.set(cacheId, {
      data: reviews,
      expiresAt: Date.now() + REVIEW_CACHE_TTL_MS,
    });
    setTimeout(() => reviewCache.delete(cacheId), REVIEW_CACHE_TTL_MS);

    return reviews;
  } catch (e) {
    console.error(`Error fetching Nector reviews:`, e.message);
    return { count: 0, average: 0, list: [], items: [], stats: [], isProductView: !!id, usedFallback: false };
  }
};

export const loadNectorReviews = fetchNectorReviews;

/**
 * Submission logic - Direct API implementation
 */
export async function submitReview(payload) {
  // If running in the browser, proxy through local API
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  }

  try {
    const res = await fetch(`https://api.nector.io/v1/merchant/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-apikey": process.env.NECTOR_API_KEY,
        "x-workspaceid": process.env.NECTOR_WORKSPACE_ID,
      },
      body: JSON.stringify(payload),
    });
    
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  } catch (error) {
    console.error("Nector Submit Review Error:", error);
    throw error;
  }
}

/**
 * Upload single image - Direct API implementation
 */
export async function uploadSingleImage(file, reviewId) {
  // If running in the browser, proxy through local API
  if (typeof window !== 'undefined') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parent_type', 'reviews');
    formData.append('parent_id', reviewId);

    const res = await fetch(`/api/reviews?action=upload`, {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Upload HTTP ${res.status}`);
    return json;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parent_type', 'reviews');
    formData.append('parent_id', reviewId);

    const res = await fetch(`https://api.nector.io/v1/merchant/uploads`, {
      method: 'POST',
      headers: {
        "x-apikey": process.env.NECTOR_API_KEY,
        "x-workspaceid": process.env.NECTOR_WORKSPACE_ID,
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Upload HTTP ${res.status}`);
    return json;
  } catch (error) {
    console.error("Nector Upload Error:", error);
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
