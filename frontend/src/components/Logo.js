import React from 'react';

const Logo = ({ className = '', variant = 'default', animationKey = '' }) => {
  const variants = {
    default: "text-charcoal",
    footer: "text-white",
    hero: "text-white"
  };

  const revistaToneClass =
    variant === 'default' ? 'text-charcoal/65' : 'opacity-70';
  const animateRevista = variant === 'default' && animationKey;

  return (
    <div className={`inline-flex items-start gap-0.5 ${variants[variant]} ${className}`}>
      <span 
        key={animateRevista ? animationKey : variant}
        className={`text-[11px] uppercase tracking-[0.28em] font-sans font-light mt-0.5 ${revistaToneClass} ${
          animateRevista ? 'animate-logo-revista-slide' : ''
        }`}
        style={{ letterSpacing: '0.28em' }}
      >
        REVISTA
      </span>
      <span 
        className="text-[32px] font-bold lowercase leading-none"
        style={{ 
          fontFamily: "'Nunito', 'Rounded Mplus', 'Varela Round', sans-serif",
          letterSpacing: '-0.02em',
          fontWeight: 800
        }}
      >
        enfoco
      </span>
    </div>
  );
};

export default Logo;
