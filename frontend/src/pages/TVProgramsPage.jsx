import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdBanner from '../components/AdBanner';
import PublicSearchBar from '../components/PublicSearchBar';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';
import { matchesSearch } from '../lib/search';

const CACHE_KEY = 'tv-programs-index-v1';

const getVideoImage = (program) => {
  if (program?.thumbnail_url) {
    return program.thumbnail_url;
  }

  if (program?.youtube_video_id) {
    return `https://img.youtube.com/vi/${program.youtube_video_id}/hqdefault.jpg`;
  }

  return '';
};

const TVProgramsPage = () => {
  const [programs, setPrograms] = useState(() => {
    const cachedPrograms = readPublicCache(CACHE_KEY);
    return Array.isArray(cachedPrograms) ? cachedPrograms : [];
  });
  const [loading, setLoading] = useState(() => programs.length === 0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!HAS_BACKEND) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const fetchPrograms = async () => {
      try {
        const response = await axios.get(apiUrl('/api/tv-programs'));
        const nextPrograms = Array.isArray(response.data) ? response.data : [];

        if (isMounted) {
          setPrograms(nextPrograms);
          writePublicCache(CACHE_KEY, nextPrograms);
        }
      } catch (error) {
        console.error('Error fetching TV programs:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrograms();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPrograms = useMemo(
    () =>
      programs.filter((program) =>
        matchesSearch(
          program,
          [
            (item) => item.title,
            (item) => item.youtube_url
          ],
          searchQuery
        )
      ),
    [programs, searchQuery]
  );

  return (
    <>
      <SeoHelmet
        title="Programas de TV | Revista Enfoco"
        description="Assista aos programas e entrevistas da Revista Enfoco no YouTube."
      />

      <section className="relative overflow-hidden bg-charcoal text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_8%,rgba(37,99,235,0.32),transparent_34%),linear-gradient(120deg,#070707_0%,#111827_46%,#070707_100%)]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 sm:py-28 lg:py-32">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/54 mb-6">
              Conteúdo audiovisual
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.94] mb-8">
              Programas de TV
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed text-white/78 max-w-2xl mb-10">
              Entrevistas, conversas e conteúdos especiais da Revista Enfoco reunidos para assistir no YouTube.
            </p>
            <div className="max-w-3xl">
              <PublicSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Pesquisar programas por título"
                containerClassName=""
              />
            </div>
          </div>
        </div>
      </section>

      <AdBanner position="tv_programs_top" className="py-8 sm:py-10 bg-white" />

      <section className="bg-porcelain py-14 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="bg-white border border-charcoal/8 shadow-premium-sm animate-pulse">
                  <div className="aspect-video bg-charcoal/8" />
                  <div className="p-6 space-y-4">
                    <div className="h-5 bg-charcoal/10 rounded w-5/6" />
                    <div className="h-4 bg-charcoal/8 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPrograms.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program) => (
                <a
                  key={program.id}
                  href={program.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-charcoal/8 shadow-premium-sm hover:shadow-premium transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-video overflow-hidden bg-charcoal/8">
                    <SafeImage
                      src={getVideoImage(program)}
                      alt={program.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6">
                    <h2 className="font-display text-2xl font-bold leading-tight text-charcoal group-hover:text-royal-blue transition-colors">
                      {program.title}
                    </h2>
                    <span className="mt-5 inline-flex items-center text-xs font-bold uppercase tracking-[0.18em] text-royal-blue">
                      Assistir no YouTube
                      <span className="ml-2 transition-transform group-hover:translate-x-1" aria-hidden="true">
                        →
                      </span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-charcoal/8 p-10 text-center shadow-premium-sm">
              <h2 className="font-display text-3xl font-bold text-charcoal mb-3">
                Nenhum programa disponível no momento.
              </h2>
              <p className="text-stone">
                Novos conteúdos de vídeo serão publicados aqui assim que forem cadastrados.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default TVProgramsPage;
