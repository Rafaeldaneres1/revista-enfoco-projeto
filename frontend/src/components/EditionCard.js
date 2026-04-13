import React from 'react';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';

const EditionCard = ({ edition }) => {
  return (
    <div className="enfoco-glass rounded-[42px] overflow-hidden group">
      {edition.cover_image && (
        <div className="aspect-[5/4] overflow-hidden">
          <SafeImage
            src={edition.cover_image}
            alt={edition.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <Link to={`/revista/${edition.slug}`}>
          <h3 className="font-display text-xl md:text-2xl font-bold leading-tight mb-2 hover:text-stone transition-colors" style={{ letterSpacing: '-0.04em' }}>
            {edition.title}
          </h3>
        </Link>
        <p className="text-stone text-sm leading-relaxed mb-3">
          {edition.description}
        </p>
        <span className="inline-flex items-center px-3 py-1 rounded-full border border-charcoal/8 bg-white/86 text-xs text-charcoal-light">
          Edição #{edition.edition_number}
        </span>
      </div>
    </div>
  );
};

export default EditionCard;
