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

const SafeImage = ({ src, fallbackSrc = FALLBACK_IMAGE, alt = '', onError, ...props }) => {
  const resolvedSource = useMemo(() => resolveAssetUrl(src), [src]);
  const resolvedFallback = useMemo(
    () => resolveAssetUrl(fallbackSrc) || FALLBACK_IMAGE,
    [fallbackSrc]
  );
  const [currentSource, setCurrentSource] = useState(resolvedSource || resolvedFallback);

  useEffect(() => {
    setCurrentSource(resolvedSource || resolvedFallback);
  }, [resolvedSource, resolvedFallback]);

  if (!currentSource) {
    return null;
  }

  return (
    <img
      {...props}
      src={currentSource}
      alt={alt}
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
