import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SafeImage from './SafeImage';

const ColumnCard = ({ column }) => {
  return (
    <article className="group cursor-pointer">
      {column.featured_image && (
        <Link to={`/colunas/${column.slug}`} className="block">
          <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-5 shadow-md group-hover:shadow-xl transition-shadow duration-300">
            <SafeImage
              src={column.featured_image}
              alt={column.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>
        </Link>
      )}
      <div className="space-y-3">
        <span className="inline-block text-xs font-sans tracking-[0.15em] uppercase text-royal-blue font-semibold">
          Coluna
        </span>
        <Link to={`/colunas/${column.slug}`}>
          <h3 className="font-display text-xl lg:text-2xl font-bold leading-tight text-charcoal group-hover:text-royal-blue transition-colors duration-300" style={{ letterSpacing: '-0.02em' }}>
            {column.title}
          </h3>
        </Link>
        <p className="text-stone text-sm leading-relaxed line-clamp-2">{column.excerpt}</p>
        <div className="flex items-center gap-2 text-xs text-stone pt-2">
          <span className="font-medium">{column.author_name}</span>
          <span>•</span>
          <time>{format(new Date(column.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}</time>
        </div>
      </div>
    </article>
  );
};

export default ColumnCard;
