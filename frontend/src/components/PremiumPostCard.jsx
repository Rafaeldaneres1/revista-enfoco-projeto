import React from 'react';
import ScrollReveal from './ScrollReveal';
import Parallax from './Parallax';

const PremiumPostCard = ({ 
  post, 
  size = 'medium', // small, medium, large
  featured = false,
  parallaxEnabled = true,
  animationDelay = 0
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 md:col-span-2 row-span-1',
    large: 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2'
  };

  const imageSizeClasses = {
    small: 'h-48',
    medium: 'h-64',
    large: 'h-96'
  };

  const titleSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  const ImageComponent = parallaxEnabled ? (
    <Parallax speed={0.3} className="overflow-hidden rounded-lg">
      <img
        src={post.image}
        alt={post.title}
        className={`w-full ${imageSizeClasses[size]} object-cover hover:scale-105 transition-transform duration-500`}
      />
    </Parallax>
  ) : (
    <img
      src={post.image}
      alt={post.title}
      className={`w-full ${imageSizeClasses[size]} object-cover rounded-lg hover:scale-105 transition-transform duration-500`}
    />
  );

  return (
    <ScrollReveal 
      animation={featured ? 'zoomIn' : 'slideUp'} 
      delay={animationDelay}
      className={`${sizeClasses[size]} group cursor-pointer`}
    >
      <div className="h-full enfoco-glass rounded-lg overflow-hidden shadow-premium hover:shadow-lg transition-all duration-300">
        {/* Image Container */}
        <div className="relative overflow-hidden">
          {ImageComponent}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category Badge */}
          {post.category && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-royal-blue/90 text-white text-xs font-semibold rounded-full">
              {post.category}
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="p-6 flex flex-col justify-between h-full">
          {/* Title */}
          <h3 className={`${titleSizeClasses[size]} font-display font-bold text-charcoal leading-tight mb-3 group-hover:text-royal-blue transition-colors duration-300`}>
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-stone text-sm leading-relaxed mb-4 line-clamp-2">
            {post.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between pt-4 border-t border-charcoal/10">
            <div className="flex items-center gap-2">
              {post.author && (
                <span className="text-xs text-stone font-semibold">
                  Por {post.author}
                </span>
              )}
            </div>
            {post.date && (
              <span className="text-xs text-stone/60">
                {new Date(post.date).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Read More Link */}
          <div className="mt-4 pt-4 border-t border-charcoal/10">
            <a href={`/noticias/${post.id}`} className="text-royal-blue text-sm font-semibold hover:text-royal-blue/80 transition-colors flex items-center gap-2">
              Ler mais
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};

export default PremiumPostCard;
