import React from 'react';
import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';

const normalizeText = (value = '') => String(value || '');

export const createColumnistSlug = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getColumnistHref = (columnist) =>
  columnist?.slug || columnist?.name
    ? `/colunas/autor/${columnist.slug || createColumnistSlug(columnist.name)}`
    : '/colunas';

const ColumnistCard = ({ columnist, compact = false, priority = false }) => {
  const name = normalizeText(columnist?.name || 'Colunista Enfoco');
  const role = normalizeText(columnist?.role || 'Colunista');
  const bio = normalizeText(columnist?.bio || '');

  return (
    <Link to={getColumnistHref(columnist)} className="group block h-full">
      <article className="h-full bg-white border border-black/6 shadow-[0_20px_52px_rgba(15,23,42,0.1)] transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:shadow-[0_32px_84px_rgba(15,23,42,0.16)] flex flex-col overflow-hidden">
        <div className="overflow-hidden border-b border-black/6 bg-porcelain">
          {columnist?.image ? (
            <SafeImage
              src={columnist.image}
              alt={name}
              className="w-full aspect-[4/3] object-cover object-[center_24%] transition-transform duration-700 group-hover:scale-[1.05]"
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'low'}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 92vw"
            />
          ) : (
            <div className="aspect-[4/3] bg-charcoal text-white flex items-center justify-center">
              <span className="font-display text-7xl font-bold">{name.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1 min-h-[280px]">
          <p className="text-[11px] font-sans tracking-[0.18em] uppercase text-royal-blue font-semibold mb-4">
            Colunista
          </p>

          <h3 className="font-display text-xl sm:text-2xl font-bold text-charcoal leading-[1.1] mb-3 group-hover:text-royal-blue transition-colors duration-300 line-clamp-2 min-h-[3rem] sm:min-h-[3.3rem]">
            {name}
          </h3>

          <p className="text-xs uppercase tracking-[0.18em] text-royal-blue font-semibold mb-5">
            {role}
          </p>

          {bio ? (
            <p className={`text-sm text-stone leading-relaxed ${compact ? 'line-clamp-3' : 'line-clamp-4'} mb-6 flex-1 min-h-[4.5rem]`}>
              {bio}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <span className="pt-4 border-t border-black/6 text-sm tracking-[0.1em] uppercase text-charcoal group-hover:text-royal-blue transition-colors font-medium">
            Ver colunas
          </span>
        </div>
      </article>
    </Link>
  );
};

export default ColumnistCard;
