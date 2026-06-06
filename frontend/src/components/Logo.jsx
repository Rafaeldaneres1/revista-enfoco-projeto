import React from 'react';

const BRAND_LOGOS = {
  default: '/assets/enfoco-logo-preta-transparente.png?v=7',
  footer: '/assets/enfoco-logo-branca-transparente.png?v=7'
};

const Logo = ({ className = '', variant = 'default', animationKey = '' }) => {
  const variants = {
    default: 'h-[38px] sm:h-[42px]',
    footer: 'h-[42px] sm:h-[46px]',
    hero: 'h-[54px] sm:h-[64px]',
    login: 'h-[58px] sm:h-[68px]'
  };

  const logoHeightClass = variants[variant] || variants.default;
  const logoSrc = BRAND_LOGOS[variant] || BRAND_LOGOS.default;

  return (
    <img
      key={animationKey || variant}
      src={logoSrc}
      alt="Revista Enfoco"
      className={`block w-auto max-w-full object-contain bg-transparent ${logoHeightClass} ${className}`}
    />
  );
};

export default Logo;
