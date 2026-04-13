import React from 'react';

const DropCap = ({ text, className = '' }) => {
  if (!text || text.length === 0) return <p className={className}>{text}</p>;

  const firstLetter = text[0];
  const restOfText = text.slice(1);

  return (
    <p className={`${className} leading-relaxed`}>
      <span className="float-left font-display text-6xl font-bold text-royal-blue leading-none pr-2 pt-1">
        {firstLetter}
      </span>
      {restOfText}
    </p>
  );
};

export default DropCap;
