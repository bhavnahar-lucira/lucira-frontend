export const resolveShopifyImage = (url) => {
  if (!url) return "";
  if (url.startsWith("shopify://shop_images/")) {
    const filename = url.replace("shopify://shop_images/", "");
    return `https://luciraonline.myshopify.com/cdn/shop/files/${filename}`;
  }
  return url;
};

export const resolveShopifyLink = (url) => {
  if (!url) return "#";
  if (url.startsWith("shopify://collections/")) {
    return `/collections/${url.replace("shopify://collections/", "")}`;
  }
  if (url.startsWith("shopify://products/")) {
    return `/products/${url.replace("shopify://products/", "")}`;
  }
  return url;
};

/**
 * Fetch with basic retry logic for network errors and an explicit timeout
 */
export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  // Add a 60-second timeout to the fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    // If it's a 5xx error or 429 (Too Many Requests), we might want to retry as well
    if (!res.ok && (res.status >= 500 || res.status === 429) && retries > 0) {
      console.warn(`Fetch failed with ${res.status} for ${url}. Retrying... (${retries} left)`);
      
      let currentBackoff = backoff;
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds)) currentBackoff = seconds * 1000;
          else currentBackoff = backoff * 2; // Default to larger backoff if header present but not numeric
        }
      }

      await new Promise(resolve => setTimeout(resolve, currentBackoff));
      return fetchWithRetry(url, options, retries - 1, currentBackoff * 2);
    }
    return res;
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    if (isTimeout) {
      console.error(`Fetch TIMEOUT (60s) for ${url}`);
    }

    if (retries > 0) {
      if (!isTimeout) console.warn(`Fetch error for ${url}: ${err.message}. Retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}