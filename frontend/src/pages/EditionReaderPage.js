import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { HAS_BACKEND, apiUrl, resolveAssetUrl } from '../lib/api';
import { fallbackEditions } from '../data/initialContent';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';

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

const EditionReaderPage = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [edition, setEdition] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

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
        pdfUrl: null
      };
    }

    if (edition.reader_pages?.length) {
      return {
        mode: 'images',
        pageImages: edition.reader_pages,
        pdfUrl: edition.pdf_url ? resolveAssetUrl(edition.pdf_url) : null
      };
    }

    if (edition.page_count && edition.pages_base_path) {
      return {
        mode: 'images',
        pageImages: Array.from(
          { length: edition.page_count },
          (_, index) => `${edition.pages_base_path}/page-${index + 1}.png`
        ),
        pdfUrl: edition.pdf_url ? resolveAssetUrl(edition.pdf_url) : null
      };
    }

    if (edition.pdf_url) {
      return {
        mode: 'pdf',
        pageImages: [],
        pdfUrl: resolveAssetUrl(edition.pdf_url)
      };
    }

    if (edition.preview_pages?.length) {
      return {
        mode: 'images',
        pageImages: edition.preview_pages,
        pdfUrl: null
      };
    }

    return {
      mode: 'images',
      pageImages: edition.cover_image ? [edition.cover_image] : [],
      pdfUrl: null
    };
  }, [edition]);

  const { mode: readerMode, pageImages, pdfUrl } = readerContent;
  const usePdfReader = readerMode === 'pdf' && Boolean(pdfUrl);

  useEffect(() => {
    setCurrentPage(0);
  }, [slug, edition?.id]);

  useEffect(() => {
    let objectUrl = null;

    const loadPdfForViewer = async () => {
      if (!usePdfReader || !pdfUrl) {
        setPdfViewerUrl(null);
        setPdfLoading(false);
        setPdfError('');
        return;
      }

      setPdfLoading(true);
      setPdfError('');

      try {
        const response = await axios.get(pdfUrl, {
          responseType: 'blob',
          timeout: 120000
        });

        objectUrl = URL.createObjectURL(response.data);
        setPdfViewerUrl(objectUrl);
      } catch (error) {
        console.error('Error preparing PDF reader view:', error);
        setPdfViewerUrl(null);
        setPdfError('Nao foi possivel carregar o PDF dentro do leitor. Use o botao "Abrir PDF Completo".');
      } finally {
        setPdfLoading(false);
      }
    };

    loadPdfForViewer();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [usePdfReader, pdfUrl]);

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
        <h1 className="font-display text-5xl font-bold text-charcoal mb-6">Edicao nao encontrada</h1>
        <p className="text-stone text-lg mb-10">
          Essa revista ainda nao esta disponivel para leitura no acervo.
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
  const canNavigatePages = !usePdfReader && pageImages.length > 1;

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
                  edition.description || 'Folheie a edicao em tela cheia no leitor abaixo ou abra o PDF completo.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 lg:justify-end">
              {edition.pdf_url && (
                <a
                  href={resolveAssetUrl(edition.pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium-primary rounded-none inline-flex"
                >
                  Abrir PDF Completo
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-sans tracking-[0.18em] uppercase text-royal-blue mb-2 font-semibold">
              Edicao #{edition.edition_number || 1}
            </p>
            <p className="text-sm text-stone">
              {usePdfReader
                ? 'Leitura completa em PDF integrada'
                : `Pagina ${currentPage + 1} de ${pageImages.length || 1}`}
            </p>
          </div>

          {!usePdfReader && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPreviousPage}
                disabled={!canNavigatePages}
                className="w-12 h-12 border border-charcoal/15 text-charcoal hover:bg-charcoal hover:text-white transition-colors duration-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Pagina anterior"
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
                aria-label="Proxima pagina"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="bg-porcelain border border-black/5 shadow-premium-sm p-5 lg:p-8">
          {usePdfReader ? (
            <div className="bg-white rounded-[30px] p-4 lg:p-6 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-black/6">
              <div className="overflow-hidden rounded-[22px] bg-stone-100">
                {pdfLoading ? (
                  <div className="w-full h-[80vh] bg-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-stone text-sm">Preparando PDF para leitura...</p>
                    </div>
                  </div>
                ) : pdfViewerUrl ? (
                  <iframe
                    title={`Leitor PDF ${sanitizeText(edition.title)}`}
                    src={pdfViewerUrl}
                    className="w-full h-[80vh] bg-white"
                  />
                ) : (
                  <div className="w-full h-[80vh] bg-white flex items-center justify-center px-8">
                    <div className="max-w-xl text-center">
                      <p className="text-charcoal font-semibold text-lg mb-3">Nao foi possivel abrir o PDF dentro do leitor.</p>
                      <p className="text-stone text-sm leading-relaxed mb-6">
                        {pdfError || 'Abra o arquivo completo em uma nova aba para visualizar todas as paginas da revista.'}
                      </p>
                      {edition.pdf_url && (
                        <a
                          href={resolveAssetUrl(edition.pdf_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-premium-primary rounded-none inline-flex"
                        >
                          Abrir PDF Completo
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
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
                      aria-label={`Ir para pagina ${index + 1}`}
                    >
                      <SafeImage
                        src={page}
                        alt={`Miniatura pagina ${index + 1}`}
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
                        aria-label="Pagina anterior"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={goNextPage}
                        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white/92 border border-charcoal/10 shadow-premium-sm items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                        aria-label="Proxima pagina"
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
                        alt={`Pagina ${currentPage + 1} da ${sanitizeText(edition.title)}`}
                        className="block w-full h-auto max-w-[980px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditionReaderPage;
