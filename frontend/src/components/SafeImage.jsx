import React, { useEffect, useMemo, useState } from 'react';
import { resolveAssetUrl } from '../lib/api';

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>" +
      "<rect width='800' height='600' fill='#f5f5f4'/>" +
      "<rect x='60' y='60' width='680' height='480' rx='36' fill='#e7e5e4'/>" +
      "<path d='M210 410l95-115 85 95 70-85 130 105H210z' fill='#d6d3d1'/>" +
      "<circle cx='305' cy='220' r='44' fill='#d6d3d1'/>" +
      "<text x='400' y='500' text-anchor='middle' font-family='Arial, sans-serif' font-size='28' fill='#78716c'>Imagem indisponivel</text>" +
    "</svg>"
  );

const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 960, 1200, 1600, 1920, 2560, 3200];

const isCloudinaryImage = (value = '') =>
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(value);

const getCloudinaryTransformation = (width, variant) => {
  if (variant === 'avatar') {
    return `f_auto,q_auto:best,c_thumb,g_face,w_${width},h_${width},dpr_auto`;
  }

  if (variant === 'hero') {
    return `f_auto,q_95,c_limit,w_${width}`;
  }

  if (variant === 'article') {
    return `f_auto,q_auto:best,c_limit,w_${width}`;
  }

  return `f_auto,q_auto,c_limit,w_${width}`;
};

const buildCloudinaryUrl = (value, width, variant) => {
  if (!isCloudinaryImage(value)) {
    return value;
  }

  const transformation = getCloudinaryTransformation(width, variant);
  return value.replace('/image/upload/', `/image/upload/${transformation}/`);
};

const buildResponsiveSrcSet = (value, variant) => {
  if (!isCloudinaryImage(value)) {
    return undefined;
  }

  return RESPONSIVE_WIDTHS.map((width) => `${buildCloudinaryUrl(value, width, variant)} ${width}w`).join(', ');
};

const SafeImage = ({
  src,
  fallbackSrc = FALLBACK_IMAGE,
  alt = '',
  className = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  sizes,
  cloudinaryVariant,
  preventUpscale = false,
  onError,
  onLoad,
  style,
  ...props
}) => {
  const resolvedSource = useMemo(() => resolveAssetUrl(src), [src]);
  const resolvedFallback = useMemo(
    () => resolveAssetUrl(fallbackSrc) || FALLBACK_IMAGE,
    [fallbackSrc]
  );
  const [currentSource, setCurrentSource] = useState(resolvedSource || resolvedFallback);
  const [naturalSize, setNaturalSize] = useState(null);
  const currentSrcSet = useMemo(
    () => (currentSource === resolvedSource ? buildResponsiveSrcSet(currentSource, cloudinaryVariant) : undefined),
    [cloudinaryVariant, currentSource, resolvedSource]
  );

  useEffect(() => {
    setCurrentSource(resolvedSource || resolvedFallback);
    setNaturalSize(null);
  }, [resolvedSource, resolvedFallback]);

  if (!currentSource) {
    return null;
  }

  return (
    <img
      {...props}
      src={currentSource}
      srcSet={currentSrcSet}
      sizes={currentSrcSet ? sizes : undefined}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      style={{
        ...style,
        ...(preventUpscale && naturalSize?.width
          ? {
              maxWidth: style?.maxWidth || `${naturalSize.width}px`,
              maxHeight: style?.maxHeight || `${naturalSize.height}px`,
            }
          : {}),
      }}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth && naturalHeight) {
          setNaturalSize({ width: naturalWidth, height: naturalHeight });
        }
        onLoad?.(event);
      }}
      onError={(event) => {
        if (currentSource !== resolvedFallback) {
          setCurrentSource(resolvedFallback);
        }

        onError?.(event);
      }}
    />
  );
};

export default SafeImage;
