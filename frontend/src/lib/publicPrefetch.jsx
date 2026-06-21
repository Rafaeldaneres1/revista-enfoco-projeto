import { HAS_BACKEND, apiUrl } from './publicApi';
import { readPublicCache, writePublicCache } from './publicDataCache';

export const PUBLIC_PREFETCH_ROUTES = {
  '/noticias': {
    cacheKey: 'posts-index-v2',
    endpoint: '/api/posts?published=true&compact=true&limit=24&skip=0'
  },
  '/colunas': {
    cacheKey: 'columnists-index-v2',
    endpoint: '/api/columnists?compact=true&limit=24&skip=0'
  },
  '/eventos': {
    cacheKey: 'events-index-v2',
    endpoint: '/api/events?published=true&compact=true&limit=24&skip=0'
  },
  '/programas-de-tv': {
    cacheKey: 'tv-programs-index-v1',
    endpoint: '/api/tv-programs'
  },
  '/revista': {
    cacheKey: 'editions-index-v2',
    endpoint: '/api/editions?published=true&compact=true&limit=24&skip=0'
  }
};

const pendingPrefetches = new Map();

export const prefetchPublicRoute = async (path) => {
  const config = PUBLIC_PREFETCH_ROUTES[path];

  if (!HAS_BACKEND || !config || readPublicCache(config.cacheKey)) {
    return null;
  }

  if (pendingPrefetches.has(path)) {
    return pendingPrefetches.get(path);
  }

  const request = fetch(apiUrl(config.endpoint))
    .then((response) => {
      if (!response.ok) {
        throw new Error('Prefetch unavailable');
      }
      return response.json();
    })
    .then((payload) => {
      const data = Array.isArray(payload) ? payload : [];
      writePublicCache(config.cacheKey, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      pendingPrefetches.delete(path);
    });

  pendingPrefetches.set(path, request);
  return request;
};

export const prefetchPublicRoutesOnIdle = (paths = Object.keys(PUBLIC_PREFETCH_ROUTES)) => {
  if (typeof window === 'undefined' || !HAS_BACKEND) {
    return undefined;
  }

  let cancelled = false;
  const run = () => {
    if (cancelled) {
      return;
    }

    paths.forEach((path, index) => {
      window.setTimeout(() => {
        if (!cancelled) {
          prefetchPublicRoute(path);
        }
      }, index * 140);
    });
  };

  const idleId =
    'requestIdleCallback' in window
      ? window.requestIdleCallback(run, { timeout: 1200 })
      : window.setTimeout(run, 450);

  return () => {
    cancelled = true;
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId);
    } else {
      window.clearTimeout(idleId);
    }
  };
};
