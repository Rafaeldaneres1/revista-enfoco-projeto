import React, { useEffect, useState } from 'react';

const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = window.scrollY;
      const scrollPercent = windowHeight > 0 ? (scrolled / windowHeight) * 100 : 0;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-royal-blue via-purple-500 to-royal-blue z-50 transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  );
};

export default ReadingProgress;
