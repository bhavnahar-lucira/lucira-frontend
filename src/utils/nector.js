const reviewCache = new Map();

export const fetchNectorReviews = async (productId) => {
  if (!productId) return { count: 0, average: 0, list: [], items: [], stats: [], isProductView: false, usedFallback: false };

  // Detect environment
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("Error fetching reviews via local API:", e.message);
      return { count: 0, average: 0, list: [], items: [], stats: [], isProductView: true, usedFallback: false };
    }
  }

  // Convert shopify ID to simple ID
  const id = productId.split("/").pop();

  if (reviewCache.has(id)) {
    return reviewCache.get(id);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(
      `https://cachefront.nector.io/api/v2/merchant/reviews?page=1&limit=10&sort=image_count&sort_op=DESC&reference_product_id=${id}&reference_product_source=shopify`,
      {
        headers: {
          "x-apikey": process.env.NECTOR_API_KEY,
          "x-workspaceid": process.env.NECTOR_WORKSPACE_ID,
          "x-source": "web",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    const json = await res.json();
    if (!res.ok) {
      console.error(`Nector API Error for ${id}:`, res.status, json);
      return { count: 0, average: 0, list: [], stats: [] };
    }

    const data = json?.data || {};
    const stats = data.stats || [];
    const count = data.count || 0;
    const items = data.items || []; // The API uses 'items'

    let total = 0;
    let ratingCount = 0;

    stats.forEach(s => {
      total += Number(s.rating) * Number(s.count);
      ratingCount += Number(s.count);
    });

    const reviews = {
      count,
      average: ratingCount ? Number((total / ratingCount).toFixed(1)) : 0,
      stats: stats.map(s => ({ rating: Number(s.rating), count: Number(s.count) })),
      items: items.map(r => ({
        id: r._id,
        name: r.name || "Verified Buyer",
        rating: r.rating,
        text: r.description, // API uses 'description'
        date: r.posted_at || r.created_at,
        images: r.uploads?.filter(u => u.type === "image" && u.link).map(u => u.link) || [],
        videos: r.uploads?.filter(u => u.type === "video" && u.link).map(u => u.link) || [],
        image_count: r.image_count || 0,
        video_count: r.video_count || 0,
        title: r.title || r.reference_product_name || "",
        uploads: r.uploads
      })),
      isProductView: !!id,
      usedFallback: false
    };

    reviews.list = reviews.items;

    reviewCache.set(id, reviews);
    setTimeout(() => reviewCache.delete(id), 5 * 60 * 1000);

    return reviews;
  } catch (e) {
    console.error(`Error fetching Nector reviews for ${id}:`, e.message);
    return { count: 0, average: 0, list: [], items: [], stats: [], isProductView: !!id, usedFallback: false };
  }
};

export const loadNectorReviews = fetchNectorReviews;

