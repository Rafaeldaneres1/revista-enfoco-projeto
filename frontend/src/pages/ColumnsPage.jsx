import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { fallbackColumns } from '../data/initialContent';
import SeoHelmet from '../components/SeoHelmet';
import ColumnistCard from '../components/ColumnistCard';
import PublicSearchBar from '../components/PublicSearchBar';
import AdBanner from '../components/AdBanner';
import { matchesSearch } from '../lib/search';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';

const normalizeText = (value = '') => String(value || '');
const INITIAL_VISIBLE_COLUMNISTS = 24;
const COLUMNISTS_PAGE_SIZE = 24;
const COLUMNISTS_CACHE_KEY = 'columnists-index-v2';

const buildColumnistsFromColumns = (columns = []) => {
  const columnistsMap = new Map();

  columns.filter(Boolean).forEach((column) => {
    const key = column.columnist_id || column.author_name || column.id;
    if (!key || columnistsMap.has(key)) {
      return;
    }

    columnistsMap.set(key, {
      id: column.columnist_id || key,
      slug: column.columnist_slug || column.slug,
      name: column.author_name || 'Colunista Enfoco',
      role: column.author_role || 'Colunista',
      bio: column.author_bio || column.excerpt || '',
      image: column.author_image || column.featured_image || ''
    });
  });

  return Array.from(columnistsMap.values());
};

const ColumnsPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreColumnists, setHasMoreColumnists] = useState(false);
  const [columnists, setColumnists] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COLUMNISTS);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchColumnists = useCallback(async ({ skip = 0, append = false } = {}) => {
      if (!HAS_BACKEND) {
        setColumnists(buildColumnistsFromColumns(fallbackColumns));
        setLoading(false);
        return;
      }

      try {
        if (!append) {
          const cachedColumnists = readPublicCache(COLUMNISTS_CACHE_KEY);
          if (Array.isArray(cachedColumnists) && cachedColumnists.length) {
            setColumnists(cachedColumnists);
            setLoading(false);
          }
        }

        const response = await axios.get(apiUrl(`/api/columnists?compact=true&limit=${COLUMNISTS_PAGE_SIZE}&skip=${skip}`));
        const responseColumnists = Array.isArray(response.data) ? response.data : [];
        const nextColumnists = responseColumnists.length
          ? responseColumnists
          : append ? [] : buildColumnistsFromColumns(fallbackColumns);
        setHasMoreColumnists(responseColumnists.length === COLUMNISTS_PAGE_SIZE);
        setColumnists((currentColumnists) => {
          const mergedColumnists = append ? [...currentColumnists, ...nextColumnists] : nextColumnists;
          const uniqueColumnists = mergedColumnists.filter(
            (columnist, index, list) =>
              list.findIndex((candidate) => (candidate.id || candidate.slug || candidate.name) === (columnist.id || columnist.slug || columnist.name)) === index
          );
          if (!append) {
            writePublicCache(COLUMNISTS_CACHE_KEY, uniqueColumnists);
          }
          return uniqueColumnists;
        });
      } catch (error) {
        console.error('Error fetching columnists:', error);
        if (!append) {
          setColumnists(buildColumnistsFromColumns(fallbackColumns));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
  }, []);

  useEffect(() => {
    fetchColumnists();
  }, [fetchColumnists]);

  const filteredColumnists = columnists.filter((columnist) =>
    matchesSearch(
      columnist,
      [
        (item) => item.name,
        (item) => item.role,
        (item) => item.bio
      ],
      searchQuery
    )
  );

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title="Colunas"
        description="Conheca os colunistas, especialistas e vozes autorais da Revista Enfoco."
        canonicalPath="/colunas"
        image={columnists[0]?.image}
      />

      <div className="relative overflow-hidden text-white animate-slide-down">
        <div className="absolute inset-0 bg-charcoal"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.04),_transparent_55%)]"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 sm:py-28 lg:py-36">
          <p className="text-xs font-sans tracking-[0.25em] uppercase text-white/60 mb-4 font-semibold">
            Vozes Autorais
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Colunistas da
            <br />
            <em className="font-serif italic font-normal">Revista Enfoco</em>
          </h1>
          <p className="text-base lg:text-lg text-white/78 max-w-2xl leading-relaxed mb-10">
            Perfis autorais, especialistas e articulistas que ajudam a ampliar o debate publico com leitura tecnica e sensivel.
          </p>

          <PublicSearchBar
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setVisibleCount(INITIAL_VISIBLE_COLUMNISTS);
            }}
            placeholder="Pesquisar colunistas por nome ou especialidade"
            label="Pesquisar colunistas"
          />
        </div>
      </div>

      <AdBanner position="columns_after_hero" className="py-8 sm:py-10" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {loading && columnists.length === 0 ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-pulse">
            {[0, 1, 2].map((item) => (
              <div key={item} className="border border-gray-100 bg-white shadow-premium-sm">
                <div className="aspect-[4/3] bg-gray-100"></div>
                <div className="p-7">
                  <div className="h-5 w-2/3 bg-gray-200 mb-4"></div>
                  <div className="h-3 w-1/2 bg-gray-100 mb-6"></div>
                  <div className="h-3 w-full bg-gray-100 mb-3"></div>
                  <div className="h-3 w-4/5 bg-gray-100"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredColumnists.length === 0 ? (
          <div className="text-center py-24 border border-gray-200">
            <p className="text-stone text-lg">
              {searchQuery ? 'Nenhum colunista encontrado.' : 'Nenhum colunista publicado no momento.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8" style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}>
              {filteredColumnists.slice(0, visibleCount).map((columnist, index) => (
                <ColumnistCard
                  key={columnist.id || columnist.slug || columnist.name}
                  priority={index === 0}
                  columnist={{
                    ...columnist,
                    name: normalizeText(columnist.name),
                    role: normalizeText(columnist.role),
                    bio: normalizeText(columnist.bio)
                  }}
                />
              ))}
            </div>

            {visibleCount < filteredColumnists.length ? (
              <div className="mt-12 text-center">
                <button
                  type="button"
                onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_COLUMNISTS)}
                  className="px-6 py-3 rounded-full border border-charcoal/16 text-sm uppercase tracking-[0.12em] font-semibold text-charcoal hover:bg-charcoal hover:text-white transition-colors"
                >
                  Ver mais colunistas
                </button>
              </div>
            ) : null}
            {hasMoreColumnists && !searchQuery ? (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoadingMore(true);
                    fetchColumnists({ skip: columnists.length, append: true });
                    setVisibleCount((current) => current + COLUMNISTS_PAGE_SIZE);
                  }}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-full border border-charcoal/16 text-sm uppercase tracking-[0.12em] font-semibold text-charcoal hover:bg-charcoal hover:text-white transition-colors disabled:opacity-60"
                >
                  {loadingMore ? 'Carregando...' : 'Carregar mais colunistas'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default ColumnsPage;
