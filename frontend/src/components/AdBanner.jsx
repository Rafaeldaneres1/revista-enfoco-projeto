import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';
import SafeImage from './SafeImage';

const bannerCache = new Map();
const getBannerCacheKey = (position) => `ad-banner:${position}:v2`;

const AdBanner = ({ position, className = '', containerClassName = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' }) => {
  const [banner, setBanner] = useState(() => {
    if (bannerCache.has(position)) {
      return bannerCache.get(position);
    }

    return readPublicCache(getBannerCacheKey(position));
  });
  const [loaded, setLoaded] = useState(() => bannerCache.has(position) || Boolean(readPublicCache(getBannerCacheKey(position))));

  useEffect(() => {
    let isMounted = true;
    let idleId;
    let timeoutId;

    const fetchBanner = async () => {
      if (!HAS_BACKEND || !position) {
        setLoaded(true);
        return;
      }

      if (bannerCache.has(position)) {
        setBanner(bannerCache.get(position));
        setLoaded(true);
        return;
      }

      const cachedBanner = readPublicCache(getBannerCacheKey(position));
      if (cachedBanner) {
        bannerCache.set(position, cachedBanner);
        setBanner(cachedBanner);
        setLoaded(true);
      }

      try {
        const response = await axios.get(
          apiUrl(`/api/banners?position=${encodeURIComponent(position)}`)
        );
        const banners = Array.isArray(response.data) ? response.data : [];
        const firstBanner = banners[0] || null;
        bannerCache.set(position, firstBanner);
        writePublicCache(getBannerCacheKey(position), firstBanner);

        if (isMounted) {
          setBanner(firstBanner);
        }
      } catch (error) {
        if (isMounted) {
          setBanner(null);
        }
      } finally {
        if (isMounted) {
          setLoaded(true);
        }
      }
    };

    const scheduleFetch = () => {
      if (typeof window === 'undefined') {
        fetchBanner();
        return;
      }

      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(fetchBanner, { timeout: 1800 });
      } else {
        timeoutId = window.setTimeout(fetchBanner, 500);
      }
    };

    scheduleFetch();

    return () => {
      isMounted = false;
      if (idleId && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [position]);

  if (!loaded || !banner?.image) {
    return null;
  }

  const hasMobileImage = Boolean(banner.mobile_image);
  const image = (
    <>
      {hasMobileImage ? (
        <SafeImage
          src={banner.mobile_image}
          alt={banner.title || 'Publicidade'}
          className="block w-full max-h-[240px] object-contain sm:hidden"
          loading="lazy"
          decoding="async"
          sizes="calc(100vw - 32px)"
          cloudinaryVariant="article"
        />
      ) : null}
      <SafeImage
        src={banner.image}
        alt={banner.title || 'Publicidade'}
        className={`${hasMobileImage ? 'hidden sm:block' : 'block'} w-full max-h-[160px] object-contain sm:max-h-[220px] lg:max-h-[280px]`}
        loading="lazy"
        decoding="async"
        sizes="(min-width: 1280px) 1180px, calc(100vw - 48px)"
        cloudinaryVariant="article"
      />
    </>
  );

  return (
    <div className={`${containerClassName} ${className}`}>
      <div className="mx-auto w-full overflow-hidden bg-white">
        {banner.link_url ? (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={banner.title || 'Abrir publicidade'}
            className="block transition-opacity duration-200 hover:opacity-95"
          >
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    </div>
  );
};

export default AdBanner;
