import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HAS_BACKEND, apiUrl, resolveAssetUrl } from '../lib/api';
import { siteContent } from '../data/siteContent';
import { buildFallbackHomeData } from '../data/initialContent';
import CategoryLabel from '../components/CategoryLabel';
import SafeImage from '../components/SafeImage';
import ScrollReveal from '../components/ScrollReveal';
import Parallax from '../components/Parallax';

const buildFallbackHomeSettings = () => ({
  hero_display_mode: 'fixed',
  hero_primary_cta_label: siteContent.home.heroPrimaryCtaLabel,
  hero_secondary_cta_label: siteContent.home.heroSecondaryCtaLabel,
  hero_secondary_label: siteContent.home.heroSecondaryLabel,
  featured_edition_label: siteContent.home.featuredEditionLabel,
  featured_edition_title: siteContent.home.featuredEditionTitle,
  featured_edition_primary_cta_label: siteContent.home.featuredEditionPrimaryCtaLabel,
  featured_edition_secondary_cta_label: siteContent.home.featuredEditionSecondaryCtaLabel,
  recommended_label: siteContent.home.recommendedLabel,
  recommended_title_prefix: siteContent.home.recommendedTitlePrefix,
  recommended_title_emphasis: siteContent.home.recommendedTitleEmphasis,
  recommended_link_label: siteContent.home.recommendedLinkLabel,
  recommended_empty_message: siteContent.home.recommendedEmptyMessage,
  archive_label: siteContent.home.archiveLabel,
  archive_title: siteContent.home.archiveTitle,
  archive_description: siteContent.home.archiveDescription,
  archive_primary_cta_label: siteContent.home.archivePrimaryCtaLabel,
  archive_secondary_cta_label: siteContent.home.archiveSecondaryCtaLabel,
  archive_empty_message: siteContent.home.archiveEmptyMessage,
  columns_label: siteContent.home.columnsLabel || 'Colunas',
  columns_title: siteContent.home.columnsTitle || 'Vozes em destaque',
  columns_description:
    siteContent.home.columnsDescription ||
    'Textos autorais, leituras de contexto e pontos de vista que ampliam a experiência editorial da Revista Enfoco.',
  columns_link_label: siteContent.home.columnsLinkLabel || 'Ver Colunas',
  columns_empty_message:
    siteContent.home.columnsEmptyMessage ||
    'As colunas publicadas aparecerão aqui automaticamente assim que forem cadastradas no admin.'
});

const sanitizeText = (value = '') =>
  value
    .replaceAll('ÃƒÂ¡', 'á')
    .replaceAll('ÃƒÂ ', 'à')
    .replaceAll('ÃƒÂ¢', 'â')
    .replaceAll('ÃƒÂ£', 'ã')
    .replaceAll('ÃƒÂ©', 'é')
    .replaceAll('ÃƒÂª', 'ê')
    .replaceAll('ÃƒÂ­', 'í')
    .replaceAll('ÃƒÂ³', 'ó')
    .replaceAll('ÃƒÂ´', 'ô')
    .replaceAll('ÃƒÂµ', 'õ')
    .replaceAll('ÃƒÂº', 'ú')
    .replaceAll('ÃƒÂ§', 'ç')
    .replaceAll('Ãƒâ€°', 'É')
    .replaceAll('Ãƒâ€œ', 'Ó')
    .replaceAll('ÃƒÅ¡', 'Ú')
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã ', 'à')
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
    .replaceAll('â€¢', '•');

const getEditionLabel = (edition, index) => {
  if (edition?.edition_number) {
    return `Edição #${edition.edition_number}`;
  }

  return `Edição #${index + 1}`;
};

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState({
    featured_post: null,
    recent_posts: [],
    recommended_posts: [],
    columns: [],
    events: [],
    editions: []
  });
  const [homeSettings, setHomeSettings] = useState(buildFallbackHomeSettings());
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [currentEditionIndex, setCurrentEditionIndex] = useState(0);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      if (!HAS_BACKEND) {
        setHomeData(buildFallbackHomeData());
        setHomeSettings(buildFallbackHomeSettings());
        setLoading(false);
        return;
      }

      try {
        const [homeResponse, settingsResponse] = await Promise.allSettled([
          axios.get(apiUrl('/api/home')),
          axios.get(apiUrl('/api/home-settings'))
        ]);

        if (
          homeResponse.status === 'fulfilled' &&
          homeResponse.value.data &&
          typeof homeResponse.value.data === 'object' &&
          !Array.isArray(homeResponse.value.data)
        ) {
          const data = homeResponse.value.data;
          const hasContent =
            data?.featured_post ||
            data?.recent_posts?.length ||
            data?.columns?.length ||
            data?.events?.length ||
            data?.editions?.length;

          setHomeData(hasContent ? data : buildFallbackHomeData());
        } else {
          setHomeData(buildFallbackHomeData());
        }

        if (
          settingsResponse.status === 'fulfilled' &&
          settingsResponse.value.data &&
          typeof settingsResponse.value.data === 'object' &&
          !Array.isArray(settingsResponse.value.data)
        ) {
          setHomeSettings((current) => ({
            ...current,
            ...settingsResponse.value.data
          }));
        } else {
          setHomeSettings(buildFallbackHomeSettings());
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
        setHomeData(buildFallbackHomeData());
        setHomeSettings(buildFallbackHomeSettings());
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const featuredPost = homeData.featured_post;
  const recentPosts = homeData.recent_posts || [];
  const recommendedPosts =
    homeData.recommended_posts?.length > 0
      ? homeData.recommended_posts
      : recentPosts;
  const homeColumns = (homeData.columns || []).filter(Boolean);
  const visibleHomeColumns =
    homeColumns.length <= 4
      ? homeColumns
      : Array.from({ length: 4 }, (_, offset) => homeColumns[(currentColumnIndex + offset) % homeColumns.length]);
  const featuredEdition = homeData.featured_edition || null;
  const heroDisplayMode = homeSettings.hero_display_mode || 'fixed';
  const heroCarouselPosts = [featuredPost, ...recentPosts]
    .filter(Boolean)
    .filter((post, index, array) => array.findIndex((item) => item.id === post.id) === index);
  const activeHeroPost =
    heroDisplayMode === 'carousel' && heroCarouselPosts.length > 0
      ? heroCarouselPosts[currentHeroIndex] || heroCarouselPosts[0]
      : featuredPost || recentPosts[0] || null;
  const highlightCarouselPosts = (heroDisplayMode === 'carousel'
    ? heroCarouselPosts.filter((post) => post.id !== activeHeroPost?.id)
    : recentPosts
  )
    .filter(Boolean)
    .filter((post, index, array) => array.findIndex((item) => item.id === post.id) === index);
  const activeHighlightPost =
    highlightCarouselPosts.length > 0
      ? highlightCarouselPosts[currentHighlightIndex] || highlightCarouselPosts[0]
      : null;
  const leftHighlightPost =
    highlightCarouselPosts.length > 1
      ? highlightCarouselPosts[
          highlightCarouselPosts.length === 2
            ? (currentHighlightIndex + 1) % highlightCarouselPosts.length
            : (currentHighlightIndex - 1 + highlightCarouselPosts.length) % highlightCarouselPosts.length
        ]
      : null;
  const rightHighlightPost =
    highlightCarouselPosts.length > 2
      ? highlightCarouselPosts[(currentHighlightIndex + 1) % highlightCarouselPosts.length]
      : null;
  const displayedHighlightPosts = [leftHighlightPost, activeHighlightPost, rightHighlightPost]
    .filter(Boolean)
    .filter((post, index, array) => array.findIndex((item) => item.id === post.id) === index);

  const editionsShelf = homeData.editions || [];
  const latestEdition = featuredEdition || editionsShelf[0] || null;
  const visibleEdition = editionsShelf[currentEditionIndex] || editionsShelf[0] || null;
  const canNavigateEditions = editionsShelf.length > 1;
  const previewPages =
    visibleEdition?.preview_pages?.length > 0
      ? visibleEdition.preview_pages
      : visibleEdition?.cover_image
        ? [visibleEdition.cover_image]
        : [];
  const canNavigatePreviewPages = previewPages.length > 1;
  const hasEditionNavigation = canNavigateEditions;
  const currentPreviewImage = previewPages[currentPreviewIndex] || visibleEdition?.cover_image || '';

  useEffect(() => {
    if (heroDisplayMode !== 'carousel' || heroCarouselPosts.length <= 1) {
      setCurrentHeroIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentHeroIndex((current) => (current + 1) % heroCarouselPosts.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [heroDisplayMode, heroCarouselPosts.length]);

  useEffect(() => {
    if (currentHeroIndex >= heroCarouselPosts.length) {
      setCurrentHeroIndex(0);
    }
  }, [currentHeroIndex, heroCarouselPosts.length]);

  useEffect(() => {
    if (currentHighlightIndex >= highlightCarouselPosts.length) {
      setCurrentHighlightIndex(0);
    }
  }, [currentHighlightIndex, highlightCarouselPosts.length]);

  useEffect(() => {
    setCurrentPreviewIndex(0);
  }, [currentEditionIndex]);

  useEffect(() => {
    if (currentEditionIndex >= editionsShelf.length) {
      setCurrentEditionIndex(0);
    }
  }, [currentEditionIndex, editionsShelf.length]);

  useEffect(() => {
    if (currentColumnIndex >= homeColumns.length) {
      setCurrentColumnIndex(0);
    }
  }, [currentColumnIndex, homeColumns.length]);

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

  const goToPreviousEdition = () => {
    if (!canNavigateEditions) {
      return;
    }

    setCurrentEditionIndex((current) => (current === 0 ? editionsShelf.length - 1 : current - 1));
  };

  const goToNextEdition = () => {
    if (!canNavigateEditions) {
      return;
    }

    setCurrentEditionIndex((current) => (current === editionsShelf.length - 1 ? 0 : current + 1));
  };

  const goToPreviousPreview = () => {
    if (!canNavigatePreviewPages) {
      return;
    }

    setCurrentPreviewIndex((current) => (current === 0 ? previewPages.length - 1 : current - 1));
  };

  const goToNextPreview = () => {
    if (!canNavigatePreviewPages) {
      return;
    }

    setCurrentPreviewIndex((current) => (current === previewPages.length - 1 ? 0 : current + 1));
  };

  const goToPreviousHighlight = () => {
    if (highlightCarouselPosts.length <= 1) {
      return;
    }

    setCurrentHighlightIndex((current) =>
      current === 0 ? highlightCarouselPosts.length - 1 : current - 1
    );
  };

  const goToNextHighlight = () => {
    if (highlightCarouselPosts.length <= 1) {
      return;
    }

    setCurrentHighlightIndex((current) => (current + 1) % highlightCarouselPosts.length);
  };

  const goToPreviousColumn = () => {
    if (homeColumns.length <= 4) {
      return;
    }

    setCurrentColumnIndex((current) =>
      current === 0 ? homeColumns.length - 1 : current - 1
    );
  };

  const goToNextColumn = () => {
    if (homeColumns.length <= 4) {
      return;
    }

    setCurrentColumnIndex((current) => (current + 1) % homeColumns.length);
  };

  return (
    <div className="min-h-screen">
      {activeHeroPost ? (
        <section className="relative min-h-screen flex flex-col overflow-hidden bg-charcoal">
          {/* Hero Principal - Capa de Revista Premium */}
          <div className="flex-1 flex items-center relative">
            {/* Background com imagem */}
            <div className="absolute inset-0">
              {activeHeroPost.featured_image ? (
                <Parallax speed={0.08} className="absolute inset-0">
                  <SafeImage
                    src={activeHeroPost.featured_image}
                    alt={sanitizeText(activeHeroPost.title)}
                    className="w-full h-full object-cover"
                    style={activeHeroPost.image_position ? { objectPosition: activeHeroPost.image_position } : undefined}
                  />
                </Parallax>
              ) : (
                <div className="w-full h-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_40%),linear-gradient(135deg,_#111827,_#1f2937)]"></div>
              )}
              <div className="absolute inset-0 hero-overlay"></div>
            </div>

            {/* Conteúdo Principal - Capa de Revista */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-0">
              <div className="max-w-lg">
                {/* Texto Principal - Reduzido e Equilibrado */}
                <div className="animate-slide-up text-white">
                  {/* Label da Categoria - Minimalista */}
                  <CategoryLabel
                    as="p"
                    category={activeHeroPost.category}
                    categoryId={activeHeroPost.category_id}
                    categorySlug={activeHeroPost.category_slug}
                    className="text-xs font-sans tracking-[0.25em] uppercase opacity-90 font-semibold mb-6 animate-slide-down"
                  />

                  {/* Título Principal - Minimalista e Elegante */}
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-8 leading-[1.25] text-balance hero-text-shadow animate-hero-title">
                    {sanitizeText(activeHeroPost.title)}
                  </h1>

                  {/* Excerpt/Descrição - Minimalista */}
                  <p className="text-sm sm:text-base lg:text-base mb-10 max-w-md opacity-90 leading-relaxed font-light animate-hero-excerpt">
                    {sanitizeText(activeHeroPost.excerpt)}
                  </p>

                  {/* Botões CTA - Minimalista */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-12">
                    <Link 
                      to={`/noticias/${activeHeroPost.slug}`} 
                      className="btn-premium-primary rounded-none inline-flex justify-center sm:justify-start items-center gap-2 animate-hero-cta group text-sm py-3 px-6"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      {sanitizeText(homeSettings.hero_primary_cta_label)}
                    </Link>
                    <Link
                      to="/noticias"
                      className="border-2 border-white text-white hover:bg-white hover:text-charcoal px-6 py-3 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 inline-flex items-center justify-center gap-2 backdrop-blur-sm hover:backdrop-blur-none rounded-none animate-hero-cta group"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {sanitizeText(homeSettings.hero_secondary_cta_label)}
                    </Link>
                  </div>

                  {/* Autor e Data - Minimalista */}
                  <div className="flex items-center gap-2 text-white/60 text-xs border-t border-white/15 pt-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                    <span className="font-medium text-white/80">{sanitizeText(activeHeroPost.author_name || 'Redação')}</span>
                    <span className="text-white/40">•</span>
                    <span>{new Date(activeHeroPost.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Destaques Secundários - Hierarquia Clara */}
          {highlightCarouselPosts.length > 0 && (
            <div className="relative z-20 bg-white border-t border-black/5">
              <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
                {/* Label da Seção */}
                <div className="flex items-center gap-2 mb-8 animate-slide-up">
                  <div className="w-1 h-4 bg-royal-blue rounded-full"></div>
                  <p className="text-xs font-sans tracking-[0.2em] uppercase text-charcoal/70 font-semibold">
                    {sanitizeText(homeSettings.hero_secondary_label)}
                  </p>
                </div>

                {/* Grid de Cards Secundários */}
                {highlightCarouselPosts.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousHighlight}
                      className="hidden lg:flex absolute left-0 top-[46%] -translate-x-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white text-charcoal/55 hover:text-charcoal shadow-[0_14px_34px_rgba(15,23,42,0.10)] border border-black/6"
                      aria-label="Noticia anterior"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={goToNextHighlight}
                      className="hidden lg:flex absolute right-0 top-[46%] translate-x-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white text-charcoal/55 hover:text-charcoal shadow-[0_14px_34px_rgba(15,23,42,0.10)] border border-black/6"
                      aria-label="Proxima noticia"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                <div className="grid sm:grid-cols-2 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)_minmax(0,0.92fr)] gap-5 lg:gap-0 items-stretch">
                  {displayedHighlightPosts.map((post, index) => (
                    <Link
                      key={post.id || post.slug}
                      to={`/noticias/${post.slug}`}
                      className={`group hero-secondary-card animate-secondary-card block relative z-10 transition-all duration-700 hover:z-20 hover:-translate-y-7 hover:scale-[1.02] ${
                        index === 0 ? 'lg:translate-x-6' : ''
                      } ${index === displayedHighlightPosts.length - 1 ? 'lg:-translate-x-6' : ''}`}
                      style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                    >
                      <div
                        className="overflow-hidden transition-all duration-700 h-full flex flex-col border border-black/8 bg-white shadow-[0_20px_52px_rgba(15,23,42,0.12)] group-hover:shadow-[0_48px_118px_rgba(15,23,42,0.24)]"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                      >
                        {/* Barra Colorida no Topo */}
                        <div className="h-1 bg-gradient-to-r from-royal-blue to-royal-blue/50"></div>

                        {/* Imagem Secundária */}
                        <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                          {post.featured_image ? (
                            <SafeImage
                              src={post.featured_image}
                              alt={sanitizeText(post.title)}
                              className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                              style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                              style={post.image_position ? { objectPosition: post.image_position } : undefined}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200"></div>
                          )}
                        </div>

                        {/* Conteúdo Secundário */}
                        <div className="flex flex-col flex-1 p-5 lg:p-6">
                          {/* Ícone de Categoria */}
                          <div className="flex items-center gap-2 mb-2">
                            <CategoryLabel
                              as="p"
                              category={post.category}
                              categoryId={post.category_id}
                              categorySlug={post.category_slug}
                              withDot
                              className="text-[11px] font-sans tracking-[0.18em] uppercase font-semibold mb-4"
                            />
                          </div>

                          {/* Título */}
                          <h3 className="font-display font-bold text-charcoal mb-3 leading-tight group-hover:text-royal-blue transition-colors duration-200 text-lg lg:text-xl">
                            {sanitizeText(post.title)}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-sm text-stone leading-relaxed flex-1 mb-5 line-clamp-2">
                            {sanitizeText(post.excerpt)}
                          </p>

                          {/* Link com Ícone */}
                          <div className="mt-auto flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/70 group-hover:text-royal-blue transition-colors duration-200">
                            <span>Leia</span>
                            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {highlightCarouselPosts.length > 1 && (
                  <>
                    <div className="flex lg:hidden items-center justify-center gap-3 mt-6">
                      <button
                        type="button"
                        onClick={goToPreviousHighlight}
                        className="w-11 h-11 flex items-center justify-center bg-white text-charcoal/55 hover:text-charcoal shadow-[0_12px_28px_rgba(15,23,42,0.10)] border border-black/6"
                        aria-label="Noticia anterior"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextHighlight}
                        className="w-11 h-11 flex items-center justify-center bg-white text-charcoal/55 hover:text-charcoal shadow-[0_12px_28px_rgba(15,23,42,0.10)] border border-black/6"
                        aria-label="Proxima noticia"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-8">
                      {highlightCarouselPosts.map((post, index) => (
                        <button
                          key={post.id || post.slug || index}
                          type="button"
                          onClick={() => setCurrentHighlightIndex(index)}
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            index === currentHighlightIndex
                              ? 'w-8 bg-royal-blue'
                              : 'w-2.5 bg-charcoal/18 hover:bg-charcoal/32'
                          }`}
                          aria-label={`Ir para destaque ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </section>
      ) : (
        <section className="relative overflow-hidden bg-charcoal text-white min-h-screen flex items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.05),_transparent_55%)]"></div>
          <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-28 lg:py-40 w-full">
            <p className="text-xs font-sans tracking-[0.25em] uppercase text-white/60 mb-8 font-semibold animate-slide-down">
              {siteContent.location}
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-[0.95] animate-slide-up">
              Revista Enfoco
            </h1>
            <p className="text-base sm:text-lg lg:text-xl mb-12 max-w-2xl text-white/80 leading-relaxed font-light">
              Estrutura editorial pronta para receber as notícias, colunas, eventos e edições reais da revista,
              preservando o visual já aprovado do site.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link to="/quem-somos" className="btn-premium-primary rounded-none inline-flex items-center justify-center gap-2 group">
                <svg className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Conhecer a Revista
              </Link>
              <Link
                to="/revista"
                className="border-2 border-white text-white hover:bg-white hover:text-charcoal px-8 py-4 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 inline-flex items-center justify-center gap-2 rounded-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25m20-11.002c5.5 0 10 4.747 10 11.002M15 6.253v13" />
                </svg>
                Ver Edições
              </Link>
            </div>
          </div>
        </section>
      )}

      {latestEdition && (
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-28">
          <ScrollReveal animation="fadeIn" className="text-center mb-16">
            <p className="label-premium mb-4">{sanitizeText(homeSettings.featured_edition_label)}</p>
            <h2 className="font-display text-5xl lg:text-6xl font-bold text-charcoal">{sanitizeText(homeSettings.featured_edition_title)}</h2>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">
            <ScrollReveal animation="slideLeft">
              <a
                href={latestEdition.pdf_url ? resolveAssetUrl(latestEdition.pdf_url) : '/revista'}
                target={latestEdition.pdf_url ? '_blank' : undefined}
                rel={latestEdition.pdf_url ? 'noopener noreferrer' : undefined}
                className="block max-w-[430px] mx-auto group"
              >
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
                        PDF original da revista
                      </p>
                      <h4 className="font-display text-4xl font-bold leading-tight mb-6">
                        {sanitizeText(latestEdition.title)}
                      </h4>
                      <p className="text-white/75 leading-relaxed text-sm">
                        Arquivo real da edição em andamento enviado pela equipe da Enfoco.
                      </p>
                    </div>
                    <div className="border-t border-white/15 pt-8">
                      <p className="text-xs uppercase tracking-[0.15em] text-white/55 font-semibold">
                        Formato disponível: PDF
                      </p>
                    </div>
                  </div>
                  )}
              </a>
            </ScrollReveal>

            <ScrollReveal animation="slideRight" delay={0.1}>
              <p className="text-xs font-sans tracking-[0.2em] uppercase text-royal-blue mb-6 font-semibold">
                {getEditionLabel(latestEdition, 0)}
              </p>
              <h3 className="font-display text-4xl lg:text-5xl font-bold text-charcoal mb-8 leading-tight">
                {sanitizeText(latestEdition.title)}
              </h3>
              <p className="text-base text-stone leading-relaxed mb-10 text-opacity-90">
                {sanitizeText(latestEdition.description || '')}
              </p>
              {latestEdition.pdf_url ? (
                <a
                  href={resolveAssetUrl(latestEdition.pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium-primary rounded-none inline-flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-9-2m9 2l9-2m-9-8l9 2m-9-2l-9 2m9-2v8" />
                  </svg>
                  {sanitizeText(homeSettings.featured_edition_primary_cta_label)}
                </a>
              ) : (
                <Link to="/revista" className="btn-premium-primary rounded-none inline-flex items-center gap-2 group">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  {sanitizeText(homeSettings.featured_edition_secondary_cta_label)}
                </Link>
              )}
            </ScrollReveal>
          </div>
        </section>
      )}

      <section className="bg-porcelain py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal animation="fadeIn" className="mb-20">
            <p className="label-premium mb-4">{sanitizeText(homeSettings.recommended_label)}</p>
            <div className="flex justify-between items-end gap-6">
              <h2 className="font-display text-5xl lg:text-6xl font-bold text-charcoal">
                {sanitizeText(homeSettings.recommended_title_prefix)}
                <br />
                <em className="font-serif italic font-normal">{sanitizeText(homeSettings.recommended_title_emphasis)}</em>
              </h2>
              <Link
                to="/noticias"
                className="text-sm tracking-[0.1em] uppercase text-charcoal hover:text-royal-blue transition-colors flex items-center gap-2 font-medium"
              >
                {sanitizeText(homeSettings.recommended_link_label)}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>

          {recommendedPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {recommendedPosts.map((post, index) => (
                <ScrollReveal
                  key={post.id}
                  animation="slideUp"
                  delay={index * 0.08}
                >
                  <Link to={`/noticias/${post.slug}`} className="group">
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100 mb-6 shadow-premium-sm group-hover:shadow-premium transition-all duration-500">
                      {post.featured_image ? (
                        <SafeImage
                          src={post.featured_image}
                          alt={sanitizeText(post.title)}
                          className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-700"
                          style={post.image_position ? { objectPosition: post.image_position } : undefined}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                      )}
                    </div>
                    <CategoryLabel
                      as="p"
                      category={post.category}
                      categoryId={post.category_id}
                      categorySlug={post.category_slug}
                      className="text-xs font-sans tracking-[0.2em] uppercase mb-4 font-semibold"
                    />
                    <h3 className="font-display text-xl lg:text-2xl font-bold text-charcoal mb-4 leading-tight group-hover:text-royal-blue transition-colors duration-200">
                      {sanitizeText(post.title)}
                    </h3>
                    <p className="text-sm text-stone leading-relaxed mb-5 line-clamp-2 text-opacity-80">
                      {sanitizeText(post.excerpt)}
                    </p>
                    <div className="flex items-center text-xs text-stone border-t border-gray-200/50 pt-4">
                      <span className="font-medium text-charcoal/80">{sanitizeText(post.author_name || '')}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-12 text-center shadow-premium-sm">
              <p className="text-stone leading-relaxed">
                As chamadas editoriais da home serão exibidas aqui assim que as primeiras notícias forem cadastradas no backend.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-28 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal animation="fadeIn" className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
            <div>
              <p className="label-premium mb-4">{sanitizeText(homeSettings.archive_label)}</p>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-charcoal mb-4">
                {sanitizeText(homeSettings.archive_title)}
              </h2>
              <p className="text-stone max-w-2xl leading-relaxed">
                {sanitizeText(homeSettings.archive_description)}
              </p>
            </div>

            {hasEditionNavigation && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goToPreviousEdition}
                  className="w-12 h-12 border border-charcoal/15 text-charcoal hover:bg-charcoal hover:text-white transition-colors duration-300 flex items-center justify-center"
                  aria-label="Voltar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goToNextEdition}
                  className="w-12 h-12 border border-charcoal/15 text-charcoal hover:bg-charcoal hover:text-white transition-colors duration-300 flex items-center justify-center"
                  aria-label="Avançar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </ScrollReveal>

          {editionsShelf.length > 0 ? (
            <>
              {visibleEdition && (
                <ScrollReveal animation="slideUp" className="relative max-w-6xl mx-auto">
                  {hasEditionNavigation && (
                    <>
                      <button
                        type="button"
                        onClick={goToPreviousEdition}
                        className="hidden lg:flex absolute -left-7 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white border border-charcoal/10 shadow-premium-sm items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                        aria-label="Voltar"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={goToNextEdition}
                        className="hidden lg:flex absolute -right-7 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white border border-charcoal/10 shadow-premium-sm items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                        aria-label="Avançar"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  <a
                    href={visibleEdition.pdf_url ? resolveAssetUrl(visibleEdition.pdf_url) : '/revista'}
                    target={visibleEdition.pdf_url ? '_blank' : undefined}
                    rel={visibleEdition.pdf_url ? 'noopener noreferrer' : undefined}
                    className="block group"
                  >
                    <article className="bg-porcelain p-5 sm:p-8 lg:p-10 border border-black/5 shadow-premium-sm transition-all duration-500 group-hover:shadow-premium">
                      <div className="grid lg:grid-cols-[minmax(0,400px)_1fr] gap-8 lg:gap-12 items-center">
                        <div className="bg-white rounded-[24px] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] mx-auto w-full max-w-[400px]">
                          {currentPreviewImage ? (
                            <SafeImage
                              src={currentPreviewImage}
                              alt={sanitizeText(visibleEdition.title)}
                              className="w-full h-auto rounded-[20px] transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-[20px]"></div>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-sans tracking-[0.2em] uppercase text-royal-blue mb-4 font-semibold">
                            {getEditionLabel(visibleEdition, currentEditionIndex)}
                          </p>
                          <h3 className="font-display text-3xl lg:text-4xl font-bold text-charcoal mb-6 leading-tight">
                            {sanitizeText(visibleEdition.title)}
                          </h3>
                          <p className="text-base text-stone leading-relaxed mb-8">
                            {sanitizeText(visibleEdition.description || '')}
                          </p>

                          {canNavigatePreviewPages && (
                            <div className="flex items-center gap-3 mb-8">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  goToPreviousPreview();
                                }}
                                className="text-sm text-stone hover:text-charcoal transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <span className="text-xs text-stone/60">
                                {currentPreviewIndex + 1} de {previewPages.length}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  goToNextPreview();
                                }}
                                className="text-sm text-stone hover:text-charcoal transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {visibleEdition.pdf_url ? (
                            <a
                              href={resolveAssetUrl(visibleEdition.pdf_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-premium-primary rounded-none inline-flex items-center gap-2 group"
                            >
                              <svg className="w-5 h-5 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-9-2m9 2l9-2m-9-8l9 2m-9-2l-9 2m9-2v8" />
                              </svg>
                              {sanitizeText(homeSettings.archive_primary_cta_label)}
                            </a>
                          ) : (
                            <Link to="/revista" className="btn-premium-primary rounded-none inline-flex items-center gap-2 group">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              {sanitizeText(homeSettings.archive_secondary_cta_label)}
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  </a>
                </ScrollReveal>
              )}
            </>
          ) : (
            <div className="bg-porcelain border border-gray-200 p-12 text-center">
              <p className="text-stone leading-relaxed">
                {sanitizeText(homeSettings.archive_empty_message)}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-porcelain pt-24 pb-36 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal animation="fadeIn" className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
            <div>
              <p className="label-premium mb-4">{sanitizeText(homeSettings.columns_label)}</p>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-charcoal mb-4">
                {sanitizeText(homeSettings.columns_title)}
              </h2>
              <p className="text-stone max-w-2xl leading-relaxed">
                {sanitizeText(homeSettings.columns_description)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {homeColumns.length > 4 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousColumn}
                    className="w-12 h-12 border border-charcoal/12 bg-white text-charcoal/60 hover:text-charcoal hover:shadow-premium-sm transition-all duration-300 flex items-center justify-center"
                    aria-label="Coluna anterior"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextColumn}
                    className="w-12 h-12 border border-charcoal/12 bg-white text-charcoal/60 hover:text-charcoal hover:shadow-premium-sm transition-all duration-300 flex items-center justify-center"
                    aria-label="Próxima coluna"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              <Link
                to="/colunas"
                className="text-sm tracking-[0.1em] uppercase text-charcoal hover:text-royal-blue transition-colors flex items-center gap-2 font-medium"
              >
                {sanitizeText(homeSettings.columns_link_label)}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>

          {homeColumns.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
              {visibleHomeColumns.map((column, index) => (
                <ScrollReveal key={column.id || column.slug} animation="slideUp" delay={index * 0.08} className="h-full">
                  <Link
                    to={`/colunas/${column.slug}`}
                    className="group block h-full"
                  >
                    <article className="h-full bg-white border border-black/6 shadow-[0_20px_52px_rgba(15,23,42,0.1)] transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:shadow-[0_32px_84px_rgba(15,23,42,0.16)] flex flex-col overflow-hidden">
                      <div className="overflow-hidden border-b border-black/6">
                        {column.featured_image ? (
                          <SafeImage
                            src={column.featured_image}
                            alt={sanitizeText(column.title)}
                            className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                            style={column.image_position ? { objectPosition: column.image_position } : undefined}
                          />
                        ) : column.author_image ? (
                          <SafeImage
                            src={column.author_image}
                            alt={sanitizeText(column.author_name || column.title)}
                            className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 to-stone-200" />
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <p className="text-[11px] font-sans tracking-[0.18em] uppercase text-royal-blue font-semibold mb-4">
                          Coluna
                        </p>

                        <h3 className="font-display text-2xl font-bold text-charcoal leading-[1.1] mb-4 group-hover:text-royal-blue transition-colors duration-300">
                          {sanitizeText(column.title)}
                        </h3>

                        <p className="text-sm text-stone leading-relaxed line-clamp-3 mb-6 flex-1">
                          {sanitizeText(column.excerpt || '')}
                        </p>

                        <div className="pt-4 border-t border-black/6">
                          <p className="text-sm font-medium text-charcoal">
                            {sanitizeText(column.author_name || 'Colunista Enfoco')}
                          </p>
                          <p className="text-xs text-stone mt-1">
                            {sanitizeText(column.author_role || 'Colunista')}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Link>
                </ScrollReveal>
              ))}
              </div>

              {homeColumns.length > 4 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {homeColumns.map((column, index) => (
                    <button
                      key={column.id || column.slug || index}
                      type="button"
                      onClick={() => setCurrentColumnIndex(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentColumnIndex
                          ? 'w-8 h-2 bg-royal-blue'
                          : 'w-2.5 h-2.5 bg-charcoal/18 hover:bg-charcoal/32'
                      }`}
                      aria-label={`Ir para grupo de colunas ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-black/6 p-12 text-center shadow-premium-sm">
              <p className="text-stone leading-relaxed max-w-2xl mx-auto">
                {sanitizeText(homeSettings.columns_empty_message)}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
