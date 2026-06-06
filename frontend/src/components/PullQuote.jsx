import React from 'react';
import ScrollReveal from './ScrollReveal';

const PullQuote = ({ 
  text, 
  author = null, 
  emphasis = false,
  className = ''
}) => {
  return (
    <ScrollReveal animation="slideUp" delay={0.2}>
      <div className={`my-12 py-8 px-8 border-l-4 border-royal-blue bg-gradient-to-r from-royal-blue/5 to-transparent rounded-r-lg ${className}`}>
        <blockquote className={`${emphasis ? 'font-display text-3xl' : 'text-2xl'} font-bold text-charcoal leading-relaxed italic`}>
          "{text}"
        </blockquote>
        {author && (
          <p className="mt-4 text-sm text-stone font-semibold">
            — {author}
          </p>
        )}
      </div>
    </ScrollReveal>
  );
};

export default PullQuote;
