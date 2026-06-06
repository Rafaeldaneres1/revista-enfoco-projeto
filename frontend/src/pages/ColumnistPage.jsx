import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { fallbackColumns } from '../data/initialContent';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';
import { createColumnistSlug } from '../components/ColumnistCard';
import ShareActions from '../components/ShareActions';

const normalizeText = (value = '') => String(value || '');
const INITIAL_VISIBLE_COLUMNS = 6;

const buildColumnistFromColumn = (column) => {
  if (!column) {
    return null;
  }

  const name = column.author_name || 'Colunista Enfoco';

  return {
    id: column.columnist_id || name || column.id,
    slug: column.columnist_slug || createColumnistSlug(name),
    name,
    role: column.author_role || 'Colunista',
    bio: column.author_bio || column.excerpt || '',
    image: column.author_image || column.featured_image || ''
  };
};

const getFallbackColumnist = (slug) => {
  const column = fallbackColumns.find(
    (item) =>
      item.columnist_slug === slug ||
      item.slug === slug ||
      createColumnistSlug(item.author_name) === slug
  );

  return buildColumnistFromColumn(column);
};

const findColumnistBySlug = (columnists = [], slug = '') =>
  columnists.find(
    (columnist) =>
      columnist.slug === slug ||
      columnist.id === slug ||
      createColumnistSlug(columnist.name) === slug
  ) || null;

const getColumnsForColumnist = async (columnist, slug) => {
  const matchesColumnist = (column) => {
    const authorSlug = createColumnistSlug(columnist?.name);
    return (
      column.columnist_id === columnist?.id ||
      column.columnist_slug === slug ||
      createColumnistSlug(column.author_name) === slug ||
      createColumnistSlug(column.author_name) === authorSlug
    );
  };

  if (columnist?.id) {
    try {
      const columnsResponse = await axios.get(
        apiUrl(`/api/columns/by-columnist/${encodeURIComponent(columnist.id)}?published=true&limit=24`)
      );
      const linkedColumns = Array.isArray(columnsResponse.data) ? columnsResponse.data : [];
      const filteredLinkedColumns = linkedColumns.filter(matchesColumnist);
      if (filteredLinkedColumns.length) {
        return filteredLinkedColumns;
      }
    } catch (summaryError) {
      const columnsResponse = await axios.get(
        apiUrl(`/api/columns?published=true&columnist_id=${encodeURIComponent(columnist.id)}`)
      );
      const linkedColumns = Array.isArray(columnsResponse.data) ? columnsResponse.data : [];
      const filteredLinkedColumns = linkedColumns.filter(matchesColumnist);
      if (filteredLinkedColumns.length) {
        return filteredLinkedColumns;
      }
    }
  }

  const allColumnsResponse = await axios.get(apiUrl('/api/columns?published=true'));
  const allColumns = Array.isArray(allColumnsResponse.data) ? allColumnsResponse.data : [];
  return allColumns.filter(matchesColumnist);
};

const ColumnistPage = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [columnist, setColumnist] = useState(null);
  const [columns, setColumns] = useState([]);
  const [visibleColumnsCount, setVisibleColumnsCount] = useState(INITIAL_VISIBLE_COLUMNS);

  useEffect(() => {
    const fetchColumnistPage = async () => {
      if (!HAS_BACKEND) {
        const fallbackColumnist = getFallbackColumnist(slug);
        setColumnist(fallbackColumnist);
        setColumns(
          fallbackColumns.filter(
            (column) =>
              column.columnist_slug === slug ||
              column.slug === slug ||
              (fallbackColumnist?.name && column.author_name === fallbackColumnist.name)
          )
        );
        setLoading(false);
        return;
      }

      try {
        let nextColumnist = null;

        try {
          const columnistResponse = await axios.get(apiUrl(`/api/columnists/slug/${slug}`));
          nextColumnist = columnistResponse.data;
        } catch (slugError) {
          const columnistsResponse = await axios.get(apiUrl('/api/columnists'));
          const columnists = Array.isArray(columnistsResponse.data) ? columnistsResponse.data : [];
          nextColumnist = findColumnistBySlug(columnists, slug);
        }

        if (!nextColumnist) {
          const legacyColumnResponse = await axios.get(apiUrl(`/api/columns/${slug}`));
          const legacyColumn =
            legacyColumnResponse.data &&
            typeof legacyColumnResponse.data === 'object' &&
            !Array.isArray(legacyColumnResponse.data)
              ? legacyColumnResponse.data
              : null;
          nextColumnist = buildColumnistFromColumn(legacyColumn);
          setColumns(legacyColumn ? [legacyColumn] : []);
        } else {
          setColumns(await getColumnsForColumnist(nextColumnist, slug));
        }

        setColumnist(nextColumnist);
      } catch (error) {
        console.error('Error fetching columnist page:', error);
        const fallbackColumnist = getFallbackColumnist(slug);
        setColumnist(fallbackColumnist);
        setColumns(
          fallbackColumns.filter(
            (column) =>
              column.slug === slug ||
              column.columnist_slug === slug ||
              createColumnistSlug(column.author_name) === slug ||
              (fallbackColumnist?.name && column.author_name === fallbackColumnist.name)
          )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchColumnistPage();
  }, [slug]);

  useEffect(() => {
    setVisibleColumnsCount(INITIAL_VISIBLE_COLUMNS);
  }, [slug, columns.length]);

  const pageTitle = useMemo(
    () => normalizeText(columnist?.name || 'Colunista'),
    [columnist?.name]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!columnist) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Colunista nao encontrado</h2>
          <Link to="/colunas" className="text-royal-blue hover:underline">
            Voltar para colunas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title={pageTitle}
        description={normalizeText(columnist.bio || columnist.role || '')}
        canonicalPath={`/colunas/autor/${columnist.slug || slug}`}
        image={columnist.image}
      />

      <section className="bg-porcelain border-b border-gray-200 py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <Link
            to="/colunas"
            className="inline-flex items-center text-sm text-stone hover:text-charcoal mb-12 transition-colors uppercase tracking-wide"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para colunas
          </Link>

          <div className="grid md:grid-cols-[280px_1fr] gap-10 md:gap-14 items-center">
            <div className="bg-white border border-black/6 shadow-premium-sm overflow-hidden">
              {columnist.image ? (
                <SafeImage
                  src={columnist.image}
                  alt={pageTitle}
                  className="w-full aspect-[4/3] md:aspect-[1/1.18] object-cover object-[center_24%]"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(min-width: 768px) 280px, 100vw"
                />
              ) : (
                <div className="aspect-[4/3] md:aspect-[1/1.18] bg-charcoal text-white flex items-center justify-center">
                  <span className="font-display text-7xl font-bold">{pageTitle.charAt(0)}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-sans tracking-[0.25em] uppercase text-royal-blue mb-5 font-semibold">
                Colunista
              </p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-charcoal mb-5 leading-tight">
                {pageTitle}
              </h1>
              <p className="text-sm uppercase tracking-[0.18em] text-royal-blue font-semibold mb-6">
                {normalizeText(columnist.role || 'Colunista')}
              </p>
              <p className="text-base lg:text-lg text-stone max-w-2xl leading-relaxed">
                {normalizeText(columnist.bio || '')}
              </p>
              <ShareActions
                title={pageTitle}
                description={normalizeText(columnist.bio || columnist.role || '')}
                canonicalPath={`/colunas/autor/${columnist.slug || slug}`}
                className="mt-8 max-w-2xl"
                compact
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-sans tracking-[0.2em] uppercase text-stone mb-3 font-semibold">
              Publicações
            </p>
            <h2 className="font-display text-4xl font-bold text-charcoal">
              Matérias de {pageTitle}
            </h2>
          </div>
        </div>

        {columns.length === 0 ? (
          <div className="border border-gray-200 bg-porcelain py-20 px-6 text-center">
            <p className="text-stone text-lg">Nenhuma coluna publicada por este autor no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-10">
            {columns.slice(0, visibleColumnsCount).map((column) => (
              <Link
                key={column.id || column.slug}
                to={`/colunas/${column.slug}`}
                className="group block"
                style={{ contentVisibility: 'auto', containIntrinsicSize: '420px' }}
              >
                {column.featured_image ? (
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100 mb-6 shadow-md">
                    <SafeImage
                      src={column.featured_image}
                      alt={normalizeText(column.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={column.image_position ? { objectPosition: column.image_position } : undefined}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      sizes="(min-width: 768px) 50vw, 92vw"
                    />
                  </div>
                ) : null}

                <p className="text-xs font-sans tracking-[0.18em] uppercase text-royal-blue font-semibold mb-4">
                  Coluna
                </p>
                <h3 className="font-display text-2xl lg:text-3xl font-bold text-charcoal mb-4 leading-tight group-hover:text-royal-blue transition-colors">
                  {normalizeText(column.title)}
                </h3>
                <p className="text-base text-stone leading-relaxed mb-5 line-clamp-3">
                  {normalizeText(column.excerpt)}
                </p>
                <p className="text-sm text-stone">
                  {new Date(column.created_at).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}

        {columns.length > visibleColumnsCount ? (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setVisibleColumnsCount((current) => current + INITIAL_VISIBLE_COLUMNS)}
              className="px-6 py-3 rounded-full border border-charcoal/16 text-sm uppercase tracking-[0.12em] font-semibold text-charcoal hover:bg-charcoal hover:text-white transition-colors"
            >
              Ver mais colunas
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default ColumnistPage;
