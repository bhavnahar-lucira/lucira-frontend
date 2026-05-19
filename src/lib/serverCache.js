const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 500;

const store = globalThis.__luciraServerCache || new Map();
globalThis.__luciraServerCache = store;

const pruneCache = (maxEntries) => {
  if (store.size <= maxEntries) return;

  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now && !entry.promise) {
      store.delete(key);
    }
  }

  while (store.size > maxEntries) {
    const firstKey = store.keys().next().value;
    store.delete(firstKey);
  }
};

export const stableCacheKey = (parts) => JSON.stringify(parts);

export async function getServerCache(key, loader, options = {}) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const now = Date.now();
  const cached = store.get(key);

  if (cached?.value !== undefined && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = Promise.resolve()
    .then(loader)
    .then((value) => {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      pruneCache(maxEntries);
      return value;
    })
    .catch((error) => {
      store.delete(key);
      throw error;
    });

  store.set(key, {
    promise,
    expiresAt: now + ttlMs,
  });

  return promise;
}
