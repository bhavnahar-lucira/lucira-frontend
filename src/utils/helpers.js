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
 * Next throws control-flow errors out of fetch() during `next build` —
 * DynamicServerError ("Dynamic server usage"), redirect, notFound and static
 * generation bailouts. They are signals telling Next how to render the route,
 * not network failures: a retry can never change the outcome, and treating
 * them as one cost ~1.5s of backoff sleep and 6 log lines per prerendered
 * page. Detect them so they propagate untouched and Next still sees them.
 */
export function isNextControlFlowError(err) {
  if (!err) return false;
  const digest = typeof err.digest === "string" ? err.digest : "";
  if (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_")) return true;
  return typeof err.message === "string" && err.message.includes("Dynamic server usage");
}

/**
 * Fetch with basic retry logic for network errors and an explicit timeout
 */
export async function fetchWithRetry(url, options = {}, retries = 2, backoff = 500) {
  const timeoutMs = Number(process.env.UPSTREAM_FETCH_TIMEOUT_MS || 12000);
  const maxBackoffMs = Number(process.env.UPSTREAM_FETCH_MAX_BACKOFF_MS || 5000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

      await new Promise(resolve => setTimeout(resolve, Math.min(currentBackoff, maxBackoffMs)));
      return fetchWithRetry(url, options, retries - 1, currentBackoff * 2);
    }
    return res;
  } catch (err) {
    clearTimeout(timeoutId);

    // Not a fetch failure — rethrow immediately so Next handles the signal.
    if (isNextControlFlowError(err)) throw err;

    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    if (isTimeout) {
      console.error(`Fetch TIMEOUT (${timeoutMs}ms) for ${url}`);
    }

    if (retries > 0) {
      if (!isTimeout) console.warn(`Fetch error for ${url}: ${err.message}. Retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, Math.min(backoff, maxBackoffMs)));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}
