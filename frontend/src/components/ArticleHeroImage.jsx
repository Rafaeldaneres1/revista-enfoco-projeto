import React from 'react';
import SafeImage from './SafeImage';

const ArticleHeroImage = ({
  src,
  alt,
  imagePosition,
  heightClassName = 'h-[70vh]',
}) => {
  const objectPosition = imagePosition || 'center center';

  return (
    <div className={`relative ${heightClassName} bg-gray-100 overflow-hidden`}>
      <SafeImage
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        className="w-full h-full object-cover"
        style={{ objectPosition }}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        sizes="100vw"
        cloudinaryVariant="hero"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
    </div>
  );
};

export default ArticleHeroImage;
