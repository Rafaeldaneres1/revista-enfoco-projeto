import React, { useEffect, useRef, useState } from 'react';

const Parallax = ({ 
  children, 
  speed = 0.5, 
  className = '',
  offset = 0
}) => {
  const ref = useRef(null);
  const [offset_y, setOffset_y] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const elementPosition = ref.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        // Só aplicar parallax quando o elemento estiver visível
        if (elementPosition < windowHeight && elementPosition > 0) {
          const scrolled = window.scrollY;
          const elementTop = ref.current.offsetTop;
          const distance = scrolled - elementTop;
          const movement = distance * speed;
          
          setOffset_y(movement);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset_y}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  );
};

export default Parallax;
