import React from 'react';
import { Search, X } from 'lucide-react';

const PublicSearchBar = ({
  value,
  onChange,
  placeholder,
  label = 'Pesquisar',
  containerClassName = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
}) => (
  <div className={containerClassName}>
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="relative">
        <Search className="absolute left-4 sm:left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" strokeWidth={1.8} />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-none border border-gray-200 bg-white py-3.5 sm:py-4 pl-11 sm:pl-12 pr-11 sm:pr-12 text-sm text-charcoal shadow-premium-sm outline-none transition-all duration-200 placeholder:text-stone/70 focus:border-royal-blue focus:ring-2 focus:ring-royal-blue/10"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Limpar pesquisa"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        ) : null}
      </div>
    </label>
  </div>
);

export default PublicSearchBar;
