import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HAS_BACKEND, apiUrl, resolveAssetUrl } from '../lib/api';
import { siteContent } from '../data/siteContent';
import { fallbackEditions } from '../data/initialContent';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';

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

const EditionsPage = () => {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEditions = async () => {
      if (!HAS_BACKEND) {
        setEditions(fallbackEditions);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl('/api/editions?published=true'));
        setEditions(Array.isArray(response.data) && response.data.length ? response.data : fallbackEditions);
      } catch (error) {
        console.error('Error fetching editions:', error);
        setEditions(fallbackEditions);
      } finally {
        setLoading(false);
      }
    };

    fetchEditions();
  }, []);

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

  const latestEdition = editions[0];
  const archiveEditions = editions.slice(1);

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title="Revista"
        description="Explore as edições publicadas da Revista Enfoco e acesse o acervo digital."
        canonicalPath="/revista"
        image={latestEdition?.cover_image || editions[0]?.cover_image}
      />
      <div className="border-b border-gray-200 py-24 bg-porcelain animate-slide-down">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="label-premium mb-6">Acervo Digital</p>
          <h1 className="font-display text-6xl lg:text-7xl font-bold text-charcoal mb-8">
            Edições da
            <br />
            <em className="font-serif italic font-normal">Revista</em>
          </h1>
          <p className="text-lg text-stone max-w-2xl font-light">
            Explore as edições publicadas da Revista Enfoco. Agora você pode folhear a revista no site ou abrir o PDF completo.
          </p>
        </div>
      </div>

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
                {latestEdition.pdf_url ? (
                  <a
                    href={resolveAssetUrl(latestEdition.pdf_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-premium-primary rounded-none inline-flex items-center gap-2"
                  >
                    Abrir PDF
                  </a>
                ) : (
                  <span className="text-sm text-stone font-light">{sanitizeText(siteContent.cta.editionsMessage)}</span>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 animate-slide-up">
              <Link to={`/revista/${latestEdition.slug}`} className="block max-w-[430px] mx-auto group">
                {latestEdition.cover_image ? (
                  <div className="rounded-[30px] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-black/6 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_30px_90px_rgba(15,23,42,0.2)]">
                    <div className="overflow-hidden rounded-[22px] bg-stone-100">
                      <SafeImage
                        src={latestEdition.cover_image}
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
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {archiveEditions.map((edition, index) => (
                <div key={edition.id} className="group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Link to={`/revista/${edition.slug}`} className="block bg-white mb-6 overflow-hidden shadow-premium-sm group-hover:shadow-premium transition-all duration-500">
                    {edition.cover_image ? (
                      <SafeImage
                        src={edition.cover_image}
                        alt={sanitizeText(edition.title)}
                        className="block w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
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
                  <p className="text-xs font-sans tracking-[0.15em] uppercase text-stone mb-3 font-semibold">
                    Edição #{edition.edition_number}
                  </p>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-3 group-hover:text-royal-blue transition-colors duration-300">
                    {sanitizeText(edition.title)}
                  </h3>
                  <p className="text-sm text-stone mb-4 line-clamp-2 font-light">{sanitizeText(edition.description)}</p>
                  <div className="flex gap-4 flex-wrap">
                    <Link
                      to={`/revista/${edition.slug}`}
                      className="text-sm text-charcoal hover:text-royal-blue font-semibold transition-colors duration-300 inline-flex items-center gap-1"
                    >
                      Folhear
                    </Link>
                    {edition.pdf_url && (
                      <a
                        href={resolveAssetUrl(edition.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-royal-blue hover:text-royal-blue-dark font-semibold transition-colors duration-300 inline-flex items-center gap-1"
                      >
                        Abrir PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editions.length === 0 && (
        <div className="text-center py-28">
          <p className="text-stone text-lg font-light">Nenhuma edição disponível no momento.</p>
        </div>
      )}

      <div className="py-28">
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
      </div>
    </div>
  );
};

export default EditionsPage;
