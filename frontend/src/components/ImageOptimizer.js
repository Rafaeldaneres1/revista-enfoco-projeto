import React, { useState, useEffect } from 'react';

const ImageOptimizer = ({ src, alt, className, width, height, priority = false }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if browser supports WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const webpSupported = canvas.toDataURL('image/webp').indexOf('image/webp') === 5;

    if (src && webpSupported) {
      // Convert to WebP if supported
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      setImageSrc(webpSrc);
    } else {
      setImageSrc(src);
    }
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setError(true);
    setIsLoading(false);
    // Fallback to original image if WebP fails
    if (imageSrc !== src) {
      setImageSrc(src);
    }
  };

  return (
    <picture>
      {/* WebP format for modern browsers */}
      <source srcSet={imageSrc} type="image/webp" />
      
      {/* Fallback for older browsers */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'animate-pulse' : ''}`}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleImageLoad}
        onError={handleImageError}
        decoding="async"
      />
    </picture>
  );
};

export default ImageOptimizer;
