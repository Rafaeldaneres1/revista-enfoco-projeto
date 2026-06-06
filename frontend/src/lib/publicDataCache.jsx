const CACHE_PREFIX = 'revista_enfoco_public_cache:';
const DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const testKey = `${CACHE_PREFIX}storage-test`;
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
};

export const readPublicCache = (key, maxAgeMs = DEFAULT_MAX_AGE_MS) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = getStorage();
    const raw = storage?.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);
    if (!cached?.createdAt || Date.now() - cached.createdAt > maxAgeMs) {
      storage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return cached.data ?? null;
  } catch {
    return null;
  }
};

export const writePublicCache = (key, data) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storage = getStorage();
    storage?.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        createdAt: Date.now(),
        data
      })
    );
  } catch {
    // Storage can fail in private mode or when quota is full. The site still works without cache.
  }
};
