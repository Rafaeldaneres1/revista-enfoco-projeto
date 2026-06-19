import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const BackToTopButton = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setIsVisible(false);
      return undefined;
    }

    const handleScroll = () => {
      setIsVisible(window.scrollY > 420);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isAdmin]);

  if (isAdmin) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      className={`fixed bottom-4 right-4 z-[69] inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/92 text-charcoal shadow-[0_14px_34px_rgba(0,0,0,0.16)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-charcoal hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-royal-blue sm:bottom-[6.25rem] sm:right-7 sm:h-12 sm:w-12 ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
    </button>
  );
};

export default BackToTopButton;
