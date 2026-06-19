import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HAS_BACKEND, apiUrl, resolveAssetUrl } from '../lib/api';
import { siteContent } from '../data/siteContent';
import { fallbackEditions } from '../data/initialContent';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';
import PublicSearchBar from '../components/PublicSearchBar';
import AdBanner from '../components/AdBanner';
import { matchesSearch } from '../lib/search';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';

const EDITIONS_CACHE_KEY = 'editions-index-v2';
const EDITIONS_PAGE_SIZE = 24;

const sanitizeText = (value = '') =>
  value
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã ', 'à')
    .replaceAll('Ã¢', 'â')
    .replaceAll('Ã£', 'ã')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ãª', 'ê')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ã´', 'ô')
    .replaceAll('Ãµ', 'õ')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã§', 'ç')
    .replaceAll('Ã‰', 'É')
    .replaceAll('Ã“', 'Ó')
    .replaceAll('Ãš', 'Ú')
    .replaceAll('â€¢', '•');

const getEditionPreviewImage = (edition) => {
  if (edition?.preview_pages?.length) {
    return edition.preview_pages[0];
  }

  if (edition?.reader_pages?.length) {
    return edition.reader_pages[0];
  }

  return edition?.cover_image || '';
};

const getEditionExternalUrl = (edition) => {
  if (edition?.heyzine_url) {
    return resolveAssetUrl(edition.heyzine_url);
  }

  if (edition?.pdf_url) {
    return resolveAssetUrl(edition.pdf_url);
  }

  return null;
};

const getEditionExternalLabel = (edition) =>
  edition?.heyzine_url || /heyzine\.com/i.test(edition?.pdf_url || '') ? 'Abrir revista' : 'Abrir PDF';

const EditionsPage = () => {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreEditions, setHasMoreEditions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEditions = useCallback(async ({ skip = 0, append = false } = {}) => {
      if (!HAS_BACKEND) {
        setEditions(fallbackEditions);
        setLoading(false);
        return;
      }

      try {
        if (!append) {
          const cachedEditions = readPublicCache(EDITIONS_CACHE_KEY);
          if (Array.isArray(cachedEditions) && cachedEditions.length) {
            setEditions(cachedEditions);
            setLoading(false);
          }
        }

        const response = await axios.get(apiUrl(`/api/editions?published=true&compact=true&limit=${EDITIONS_PAGE_SIZE}&skip=${skip}`));
        const responseEditions = Array.isArray(response.data) ? response.data : [];
        const nextEditions = responseEditions.length ? responseEditions : append ? [] : fallbackEditions;
        setHasMoreEditions(responseEditions.length === EDITIONS_PAGE_SIZE);
        setEditions((currentEditions) => {
          const mergedEditions = append ? [...currentEditions, ...nextEditions] : nextEditions;
          const uniqueEditions = mergedEditions.filter(
            (edition, index, list) =>
              list.findIndex((candidate) => (candidate.id || candidate.slug) === (edition.id || edition.slug)) === index
          );
          if (!append) {
            writePublicCache(EDITIONS_CACHE_KEY, uniqueEditions);
          }
          return uniqueEditions;
        });
      } catch (error) {
        console.error('Error fetching editions:', error);
        if (!append) {
          setEditions(fallbackEditions);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
  }, []);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  const filteredEditions = editions.filter((edition) =>
    matchesSearch(
      edition,
      [
        (item) => item.title,
        (item) => item.description,
        (item) => item.edition_number ? `edicao ${item.edition_number} edição ${item.edition_number}` : '',
        (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''
      ],
      searchQuery
    )
  );
  const latestEdition = filteredEditions[0];
  const archiveEditions = filteredEditions.slice(1);
  const latestEditionExternalUrl = getEditionExternalUrl(latestEdition);

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title="Revista"
        description="Explore as edições publicadas da Revista Enfoco e acesse o acervo digital."
        canonicalPath="/revista"
        image={getEditionPreviewImage(latestEdition) || getEditionPreviewImage(editions[0])}
      />
      <div className="relative overflow-hidden text-white animate-slide-down">
        <div className="absolute inset-0 bg-charcoal"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.04),_transparent_55%)]"></div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <p className="label-premium text-white/70 mb-6">Acervo Digital</p>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-7 sm:mb-8 leading-[1.06] sm:leading-tight">
            Edições da
            <br />
            <em className="font-serif italic font-normal">Revista</em>
          </h1>
          <p className="text-sm sm:text-lg text-white/78 max-w-2xl font-light mb-8 sm:mb-10 leading-relaxed">
            Explore as edições publicadas da Revista Enfoco. Agora você pode folhear a revista no site ou abrir o PDF completo.
          </p>

          <PublicSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar edições por título, número ou descrição"
            label="Pesquisar edições da revista"
          />
        </div>
      </div>

      {loading && editions.length === 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center animate-pulse">
            <div className="order-2 lg:order-1">
              <div className="h-3 w-40 bg-gray-200 mb-8"></div>
              <div className="h-10 w-4/5 bg-gray-200 mb-4"></div>
              <div className="h-10 w-3/5 bg-gray-200 mb-8"></div>
              <div className="h-4 w-full bg-gray-100 mb-3"></div>
              <div className="h-4 w-3/4 bg-gray-100"></div>
            </div>
            <div className="order-1 lg:order-2 max-w-[430px] mx-auto w-full">
              <div className="aspect-[3/4] rounded-[30px] bg-gray-100"></div>
            </div>
          </div>
        </div>
      )}

      {latestEdition && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-28">
          <p className="text-xs font-sans tracking-[0.2em] uppercase text-royal-blue mb-12 text-center font-semibold animate-slide-up">
            Edição Mais Recente
          </p>
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">
            <div className="order-2 lg:order-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <p className="text-xs font-sans tracking-[0.2em] uppercase text-stone mb-6 font-semibold">
                Edição #{latestEdition.edition_number}
                {latestEdition.created_at && (
                  <>
                    {' '}
                    •{' '}
                    {new Date(latestEdition.created_at).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </>
                )}
              </p>
              <h2 className="font-display text-5xl lg:text-6xl font-bold text-charcoal mb-8 leading-tight">
                {sanitizeText(latestEdition.title)}
              </h2>
              <p className="text-lg text-stone leading-relaxed mb-10 font-light">
                {sanitizeText(latestEdition.description)}
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link
                  to={`/revista/${latestEdition.slug}`}
                  className="inline-flex border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-8 py-4 text-sm font-semibold tracking-wide uppercase transition-all duration-300 rounded-none"
                >
                  Folhear Edição
                </Link>
                {latestEditionExternalUrl ? (
                  <a
                    href={latestEditionExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-premium-primary rounded-none inline-flex items-center gap-2"
                  >
                    {getEditionExternalLabel(latestEdition)}
                  </a>
                ) : (
                  <span className="text-sm text-stone font-light">{sanitizeText(siteContent.cta.editionsMessage)}</span>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 animate-slide-up">
              <Link to={`/revista/${latestEdition.slug}`} className="block max-w-[430px] mx-auto group">
                {getEditionPreviewImage(latestEdition) ? (
                  <div className="rounded-[30px] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-black/6 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
                    <div className="overflow-hidden rounded-[22px] bg-stone-100">
                      <SafeImage
                        src={getEditionPreviewImage(latestEdition)}
                        alt={sanitizeText(latestEdition.title)}
                        className="block w-full h-auto transition-transform duration-700 group-hover:scale-[1.01]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-charcoal text-white shadow-premium-lg p-12 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-sans tracking-[0.25em] uppercase text-white/60 mb-8 font-semibold">
                        Edição em PDF
                      </p>
                      <h3 className="font-display text-4xl font-bold leading-tight mb-6">
                        {sanitizeText(latestEdition.title)}
                      </h3>
                    </div>
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}

      {archiveEditions.length > 0 && (
        <div className="bg-porcelain py-28">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-charcoal mb-16 animate-slide-up">Edições Anteriores</h2>
            <div className="grid lg:grid-cols-2 gap-10">
              {archiveEditions.map((edition, index) => (
                <article key={edition.id} className="bg-porcelain p-5 sm:p-8 border border-black/5 shadow-premium-sm transition-all duration-500 hover:shadow-premium group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="grid sm:grid-cols-[minmax(0,220px)_1fr] gap-7 items-center">
                  <Link to={`/revista/${edition.slug}`} className="bg-white rounded-[24px] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.09)] w-full max-w-[320px] mx-auto">
                    {getEditionPreviewImage(edition) ? (
                      <SafeImage
                        src={getEditionPreviewImage(edition)}
                        alt={sanitizeText(edition.title)}
                        className="w-full h-auto rounded-[20px] transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full aspect-[11/15] bg-charcoal text-white p-6 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-4 font-semibold">
                            PDF da revista
                          </p>
                          <h4 className="font-display text-2xl font-bold leading-tight">{sanitizeText(edition.title)}</h4>
                        </div>
                        <p className="text-xs uppercase tracking-[0.15em] text-white/45 font-semibold">
                          Edição #{edition.edition_number}
                        </p>
                      </div>
                    )}
                  </Link>
                  <div>
                  <p className="text-xs font-sans tracking-[0.2em] uppercase text-royal-blue mb-4 font-semibold">
                    Edição #{edition.edition_number}
                  </p>
                  <Link to={`/revista/${edition.slug}`}>
                    <h3 className="font-display text-3xl font-bold text-charcoal mb-5 leading-tight group-hover:text-royal-blue transition-colors duration-300">
                      {sanitizeText(edition.title)}
                    </h3>
                  </Link>
                  <p className="text-base text-stone leading-relaxed mb-8 line-clamp-3 font-light">{sanitizeText(edition.description || '')}</p>
                  <div className="flex gap-4 flex-wrap">
                    <Link
                      to={`/revista/${edition.slug}`}
                      className="btn-premium-primary rounded-none inline-flex items-center gap-2"
                    >
                      Ver prévia
                    </Link>
                    {getEditionExternalUrl(edition) && (
                      <a
                        href={getEditionExternalUrl(edition)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-all duration-300 rounded-none"
                      >
                        {getEditionExternalLabel(edition)}
                      </a>
                    )}
                  </div>
                  </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasMoreEditions && !searchQuery && (
        <div className="text-center py-12">
          <button
            type="button"
            onClick={() => {
              setLoadingMore(true);
              fetchEditions({ skip: editions.length, append: true });
            }}
            disabled={loadingMore}
            className="px-7 py-3 rounded-full border border-charcoal/16 text-sm uppercase tracking-[0.12em] font-semibold text-charcoal hover:bg-charcoal hover:text-white transition-colors disabled:opacity-60"
          >
            {loadingMore ? 'Carregando...' : 'Ver mais edições'}
          </button>
        </div>
      )}

      {!loading && filteredEditions.length === 0 && (
        <div className="text-center py-28">
          <p className="text-stone text-lg font-light">
            {searchQuery ? 'Nenhuma edição encontrada.' : 'Nenhuma edição disponível no momento.'}
          </p>
        </div>
      )}

      <AdBanner position="editions_after_hero" className="py-16 sm:py-20" />
      <>
        {false && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center animate-slide-up">
          <h3 className="font-display text-4xl lg:text-5xl font-bold text-charcoal mb-8">Acervo em expansão</h3>
          <p className="text-lg text-stone mb-10 font-light">{sanitizeText(siteContent.cta.editionsMessage)}</p>
          <Link
            to="/quem-somos"
            className="inline-flex border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-10 py-4 text-sm font-semibold tracking-wide uppercase transition-all duration-300 rounded-none"
          >
            Conhecer a revista
          </Link>
        </div>
        )}
      </>
    </div>
  );
};

export default EditionsPage;
