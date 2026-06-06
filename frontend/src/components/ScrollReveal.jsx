import React, { useEffect, useRef, useState } from 'react';

const ScrollReveal = ({ 
  children, 
  animation = 'slideUp', 
  delay = 0, 
  duration = 0.6,
  threshold = 0.1,
  className = ''
}) => {
  const ref = useRef(null);
  const shouldSkipReveal =
    typeof window !== 'undefined' &&
    (window.matchMedia('(max-width: 767px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [isVisible, setIsVisible] = useState(shouldSkipReveal);

  useEffect(() => {
    if (shouldSkipReveal) {
      setIsVisible(true);
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const fallbackTimeout = window.setTimeout(() => {
      setIsVisible(true);
    }, 900);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.clearTimeout(fallbackTimeout);
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      window.clearTimeout(fallbackTimeout);
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [shouldSkipReveal, threshold]);

  const animationClasses = {
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    slideLeft: 'animate-slide-left',
    slideRight: 'animate-slide-right',
    fadeIn: 'animate-fade-in',
    zoomIn: 'animate-zoom-in',
    blurIn: 'animate-blur-in',
    rotateIn: 'animate-rotate-in'
  };

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animationClasses[animation] : 'opacity-0'}`}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
