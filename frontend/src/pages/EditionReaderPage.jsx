import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { HAS_BACKEND, apiUrl, resolveAssetUrl } from '../lib/api';
import { fallbackEditions } from '../data/initialContent';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';
import ShareActions from '../components/ShareActions';

const sanitizeText = (value = '') =>
  value
    .replaceAll('ÃƒÆ’Ã‚Â¡', 'ÃƒÂ¡')
    .replaceAll('ÃƒÆ’Ã‚Â ', 'ÃƒÂ ')
    .replaceAll('ÃƒÆ’Ã‚Â¢', 'ÃƒÂ¢')
    .replaceAll('ÃƒÆ’Ã‚Â£', 'ÃƒÂ£')
    .replaceAll('ÃƒÆ’Ã‚Â©', 'ÃƒÂ©')
    .replaceAll('ÃƒÆ’Ã‚Âª', 'ÃƒÂª')
    .replaceAll('ÃƒÆ’Ã‚Â­', 'ÃƒÂ­')
    .replaceAll('ÃƒÆ’Ã‚Â³', 'ÃƒÂ³')
    .replaceAll('ÃƒÆ’Ã‚Â´', 'ÃƒÂ´')
    .replaceAll('ÃƒÆ’Ã‚Âµ', 'ÃƒÂµ')
    .replaceAll('ÃƒÆ’Ã‚Âº', 'ÃƒÂº')
    .replaceAll('ÃƒÆ’Ã‚Â§', 'ÃƒÂ§')
    .replaceAll('ÃƒÆ’Ã¢â‚¬Â°', 'Ãƒâ€°')
    .replaceAll('ÃƒÆ’Ã¢â‚¬Å“', 'Ãƒâ€œ')
    .replaceAll('ÃƒÆ’Ã…Â¡', 'ÃƒÅ¡')
    .replaceAll('ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢', 'Ã¢â‚¬Â¢');

const getEditionPreviewPages = (edition) => {
  if (edition?.preview_pages?.length) {
    return edition.preview_pages;
  }

  if (edition?.reader_pages?.length) {
    return edition.reader_pages;
  }

  if (edition?.cover_image) {
    return [edition.cover_image];
  }

  return [];
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
  edition?.heyzine_url || /heyzine\.com/i.test(edition?.pdf_url || '')
    ? 'Abrir Revista no Heyzine'
    : 'Abrir PDF em nova aba';

const EditionReaderPage = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [edition, setEdition] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchEdition = async () => {
      if (!HAS_BACKEND) {
        setEdition(fallbackEditions.find((item) => item.slug === slug) || null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl('/api/editions?published=true'));
        const source = Array.isArray(response.data) && response.data.length ? response.data : fallbackEditions;

        setEdition(
          source.find((item) => item.slug === slug) ||
            fallbackEditions.find((item) => item.slug === slug) ||
            null
        );
      } catch (error) {
        console.error('Error fetching edition reader data:', error);
        setEdition(fallbackEditions.find((item) => item.slug === slug) || null);
      } finally {
        setLoading(false);
      }
    };

    fetchEdition();
  }, [slug]);

  const readerContent = useMemo(() => {
    if (!edition) {
      return {
        mode: 'images',
        pageImages: [],
        externalUrl: null
      };
    }

    return {
      mode: 'images',
      pageImages: getEditionPreviewPages(edition),
      externalUrl: getEditionExternalUrl(edition)
    };
  }, [edition]);

  const { pageImages, externalUrl } = readerContent;
  const externalLabel = getEditionExternalLabel(edition);

  useEffect(() => {
    setCurrentPage(0);
  }, [slug, edition?.id]);

  const goPreviousPage = () => {
    if (pageImages.length <= 1) {
      return;
    }

    setCurrentPage((current) => (current === 0 ? pageImages.length - 1 : current - 1));
  };

  const goNextPage = () => {
    if (pageImages.length <= 1) {
      return;
    }

    setCurrentPage((current) => (current === pageImages.length - 1 ? 0 : current + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone text-sm">Carregando revista...</p>
        </div>
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-28 text-center">
        <h1 className="font-display text-5xl font-bold text-charcoal mb-6">Edição não encontrada</h1>
        <p className="text-stone text-lg mb-10">
          Essa revista ainda não está disponível para leitura no acervo.
        </p>
        <Link
          to="/revista"
          className="inline-flex border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-10 py-4 text-sm font-semibold tracking-wide uppercase transition-all duration-300 rounded-none"
        >
          Voltar para Revista
        </Link>
      </div>
    );
  }

  const currentImage = pageImages[currentPage] || edition.cover_image;
  const canNavigatePages = pageImages.length > 1;

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title={sanitizeText(edition.title)}
        description={sanitizeText(edition.description || 'Leitura da edição da Revista Enfoco.')}
        canonicalPath={`/revista/${edition.slug}`}
        image={edition.cover_image || pageImages[0]}
      />
      <div className="border-b border-gray-200 py-20 bg-porcelain">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Link
            to="/revista"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em] text-stone hover:text-charcoal transition-colors duration-300 mb-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao Acervo
          </Link>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-end">
            <div>
              <p className="label-premium mb-5">Leitor da Revista</p>
              <h1 className="font-display text-5xl lg:text-7xl font-bold text-charcoal leading-[0.98] mb-8">
                {sanitizeText(edition.title)}
              </h1>
              <p className="text-lg text-stone leading-relaxed max-w-3xl font-light">
                {sanitizeText(
                  edition.description || 'Veja a prévia da edição abaixo e, quando disponível, abra a revista completa em uma nova aba.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 lg:justify-end">
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium-primary rounded-none inline-flex"
                >
                  {externalLabel}
                </a>
              )}
            </div>
          </div>

          <ShareActions
            title={sanitizeText(edition.title)}
            description={sanitizeText(edition.description || 'Leitura da edição da Revista Enfoco.')}
            canonicalPath={`/revista/${edition.slug}`}
            className="mt-12"
            compact
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-sans tracking-[0.18em] uppercase text-royal-blue mb-2 font-semibold">
              Edição #{edition.edition_number || 1}
            </p>
            <p className="text-sm text-stone">
              {pageImages.length
                ? `Prévia ${currentPage + 1} de ${pageImages.length || 1}`
                : externalUrl
                  ? 'Revista externa disponível por link'
                  : 'Link externo indisponível'}
            </p>
          </div>

          {pageImages.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPreviousPage}
                disabled={!canNavigatePages}
                className="w-12 h-12 border border-charcoal/15 text-charcoal hover:bg-charcoal hover:text-white transition-colors duration-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNextPage}
                disabled={!canNavigatePages}
                className="w-12 h-12 border border-charcoal/15 text-charcoal hover:bg-charcoal hover:text-white transition-colors duration-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Próxima página"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="bg-porcelain border border-black/5 shadow-premium-sm p-5 lg:p-8">
          {pageImages.length ? (
            <div className="grid lg:grid-cols-[120px_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
              <div className="order-2 lg:order-1">
                <div className="grid grid-cols-4 lg:grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto pr-1">
                  {pageImages.map((page, index) => (
                    <button
                      key={`${page}-${index}`}
                      type="button"
                      onClick={() => setCurrentPage(index)}
                      className={`overflow-hidden border transition-all duration-300 ${
                        index === currentPage
                          ? 'border-charcoal shadow-premium-sm'
                          : 'border-black/10 hover:border-charcoal/40'
                      }`}
                      aria-label={`Ir para página ${index + 1}`}
                    >
                      <SafeImage
                        src={page}
                        alt={`Miniatura página ${index + 1}`}
                        className="w-full h-auto block"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative">
                  {canNavigatePages && (
                    <>
                      <button
                        type="button"
                        onClick={goPreviousPage}
                        className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/92 border border-charcoal/10 shadow-premium-sm items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                        aria-label="Página anterior"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={goNextPage}
                        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/92 border border-charcoal/10 shadow-premium-sm items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                        aria-label="Próxima página"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  <div className="bg-white rounded-[30px] p-4 lg:p-6 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-black/6">
                    <div className="overflow-hidden rounded-[22px] bg-stone-100 flex justify-center">
                      <SafeImage
                        src={currentImage}
                        alt={`Página ${currentPage + 1} da ${sanitizeText(edition.title)}`}
                        className="block w-full h-auto max-w-[980px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[30px] p-10 lg:p-16 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-black/6">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-charcoal font-semibold text-xl mb-4">Prévia indisponível</p>
                <p className="text-stone text-sm leading-relaxed mb-8">
                  Esta edição não possui páginas de prévia cadastradas no momento. Se houver um link externo,
                  a revista pode ser aberta em uma nova aba.
                </p>
                {externalUrl ? (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-premium-primary rounded-none inline-flex"
                  >
                    {externalLabel}
                  </a>
                ) : (
                  <p className="text-stone text-sm">Nenhum link externo foi cadastrado para esta edição.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <ShareActions
          title={sanitizeText(edition.title)}
          description={sanitizeText(edition.description || 'Leitura da edição da Revista Enfoco.')}
          canonicalPath={`/revista/${edition.slug}`}
          className="mt-12"
          compact
        />
      </div>
    </div>
  );
};

export default EditionReaderPage;
