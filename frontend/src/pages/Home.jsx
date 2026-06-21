import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson, HAS_BACKEND } from '../lib/publicApi';
import { siteContent } from '../data/siteContent';
import CategoryLabel from '../components/CategoryLabel';
import SafeImage from '../components/SafeImage';
import ScrollReveal from '../components/ScrollReveal';
import Parallax from '../components/Parallax';
import SeoHelmet from '../components/SeoHelmet';
import ColumnistCard from '../components/ColumnistCard';
import Logo from '../components/Logo';
import AdBanner from '../components/AdBanner';

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
  columns_title: siteContent.home.columnsTitle || 'Colunas em destaque',
  columns_description:
    siteContent.home.columnsDescription ||
    'Opiniões, análises e leituras autorais selecionadas pela curadoria editorial da Revista Enfoco.',
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
    .replaceAll('â€¢', '•')
    .replace(/\bNOT\u00cdCIAS\b/g, 'REPORTAGENS')
    .replace(/\bNot\u00edcias\b/g, 'Reportagens')
    .replace(/\bnot\u00edcias\b/g, 'reportagens')
    .replace(/\bMais not\u00edcias\b/g, 'Mais reportagens');

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

const loadFallbackHomeDataWithColumnists = async () => {
  const { buildFallbackHomeData } = await import('../data/initialContent');
  const fallbackHomeData = buildFallbackHomeData();
  return {
    ...fallbackHomeData,
    hero_posts: [fallbackHomeData.featured_post, ...(fallbackHomeData.recent_posts || [])].filter(Boolean),
    columnists: buildColumnistsFromColumns(fallbackHomeData.columns)
  };
};

const normalizeHomePayload = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const hasContent =
    data?.hero_posts?.length ||
    data?.featured_post ||
    data?.recent_posts?.length ||
    data?.columns?.length ||
    data?.columnists?.length ||
    data?.events?.length ||
    data?.editions?.length;

  if (!hasContent) {
    return null;
  }

  return {
    ...data,
    columnists:
      data?.columnists?.length > 0
        ? data.columnists
        : buildColumnistsFromColumns(data?.columns)
  };
};

const getColumnTime = (column) => {
  const rawDate = column?.created_at || column?.updated_at || column?.published_at;
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const EMPTY_HOME_DATA = {
  hero_posts: [],
  featured_post: null,
  recent_posts: [],
  recommended_posts: [],
  columns: [],
  columnists: [],
  events: [],
  editions: []
};

const HOME_CACHE_KEY = 'revista-enfoco-home-cache-v6';
const LEGACY_HOME_CACHE_KEYS = [
  'revista-enfoco-home-cache-v1',
  'revista-enfoco-home-cache-v2',
  'revista-enfoco-home-cache-v3',
  'revista-enfoco-home-cache-v4',
  'revista-enfoco-home-cache-v5'
];

const readHomeCache = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = window.localStorage.getItem(HOME_CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    if (!parsed?.homeData || !parsed?.homeSettings) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
};

const writeHomeCache = (homeData, homeSettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      HOME_CACHE_KEY,
      JSON.stringify({
        cached_at: Date.now(),
        homeData,
        homeSettings
      })
    );
  } catch (error) {
    // Cache is a speed boost only. If the browser blocks storage, the site keeps working.
  }
};

const Home = () => {
  const [homeData, setHomeData] = useState(() => {
    const cachedHome = HAS_BACKEND ? readHomeCache() : null;
    return cachedHome?.homeData || EMPTY_HOME_DATA;
  });
  const [homeSettings, setHomeSettings] = useState(() => {
    const fallbackSettings = buildFallbackHomeSettings();

    if (!HAS_BACKEND) {
      return fallbackSettings;
    }

    const cachedHome = readHomeCache();
    return cachedHome?.homeSettings
      ? {
          ...fallbackSettings,
          ...cachedHome.homeSettings
        }
      : fallbackSettings;
  });
  const [isHomeLoading, setIsHomeLoading] = useState(HAS_BACKEND);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      if (!HAS_BACKEND) {
        setHomeData(await loadFallbackHomeDataWithColumnists());
        setHomeSettings(buildFallbackHomeSettings());
        setIsHomeLoading(false);
        return;
      }

      try {
        LEGACY_HOME_CACHE_KEYS.forEach((key) => window.localStorage.removeItem(key));

        const bootstrapHomePromise = window.__ENFOCO_HOME_BOOTSTRAP_PROMISE__;
        const initialHomeRequest = bootstrapHomePromise
          ? bootstrapHomePromise.then((data) => ({ data }))
          : fetchJson('/api/home-lite', { timeout: 8000 }).then((data) => ({ data }));

        const [homeResponse, settingsResponse] = await Promise.allSettled([
          initialHomeRequest,
          fetchJson('/api/home-settings', { timeout: 15000 }).then((data) => ({ data }))
        ]);

        let nextHomeData = null;
        let nextHomeSettings = homeSettings;
        let hasInitialHomeData = false;

        if (homeResponse.status === 'fulfilled') {
          const normalizedHomeData = normalizeHomePayload(homeResponse.value.data);
          if (normalizedHomeData) {
            nextHomeData = normalizedHomeData;
            hasInitialHomeData = true;
            setHomeData(normalizedHomeData);
          }
        }

        if (
          settingsResponse.status === 'fulfilled' &&
          settingsResponse.value.data &&
          typeof settingsResponse.value.data === 'object' &&
          !Array.isArray(settingsResponse.value.data)
        ) {
          nextHomeSettings = {
            ...homeSettings,
            ...settingsResponse.value.data
          };
          setHomeSettings(nextHomeSettings);
        }

        if (hasInitialHomeData && nextHomeData && nextHomeSettings) {
          writeHomeCache(nextHomeData, nextHomeSettings);
        }

      } catch (error) {
        console.error('Error fetching home data:', error);
        const cachedHome = readHomeCache();
        if (cachedHome?.homeData && cachedHome?.homeSettings) {
          setHomeData(cachedHome.homeData);
          setHomeSettings(cachedHome.homeSettings);
        }
      } finally {
        setIsHomeLoading(false);
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
  const highlightedColumns = (homeData.columns || [])
    .filter(Boolean)
    .sort((a, b) => getColumnTime(b) - getColumnTime(a))
    .slice(0, 3);
  const homeColumnists = (homeData.columnists || []).filter(Boolean);
  const visibleHomeColumnists =
    homeColumnists.length <= 4
      ? homeColumnists
      : Array.from({ length: 4 }, (_, offset) => homeColumnists[(currentColumnIndex + offset) % homeColumnists.length]);
  const automaticHeroPosts = homeData.hero_posts?.length > 0
    ? homeData.hero_posts
    : [featuredPost, ...recentPosts];
  const heroCarouselPosts = automaticHeroPosts
    .filter(Boolean)
    .filter((post, index, array) => {
      const postKey = post.id || post.slug;
      return array.findIndex((item) => (item.id || item.slug) === postKey) === index;
    });
  const shouldRotateHero = heroCarouselPosts.length > 1;
  const activeHeroPost =
    shouldRotateHero
      ? heroCarouselPosts[currentHeroIndex] || heroCarouselPosts[0]
      : heroCarouselPosts[0] || featuredPost || recentPosts[0] || null;
  const highlightCarouselPosts = (shouldRotateHero
    ? heroCarouselPosts.filter((post) => (post.id || post.slug) !== (activeHeroPost?.id || activeHeroPost?.slug))
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

  useEffect(() => {
    if (!shouldRotateHero) {
      setCurrentHeroIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentHeroIndex((current) => (current + 1) % heroCarouselPosts.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [shouldRotateHero, heroCarouselPosts.length]);

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
    if (currentColumnIndex >= homeColumnists.length) {
      setCurrentColumnIndex(0);
    }
  }, [currentColumnIndex, homeColumnists.length]);

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
    if (homeColumnists.length <= 4) {
      return;
    }

    setCurrentColumnIndex((current) =>
      current === 0 ? homeColumnists.length - 1 : current - 1
    );
  };

  const goToNextColumn = () => {
    if (homeColumnists.length <= 4) {
      return;
    }

    setCurrentColumnIndex((current) => (current + 1) % homeColumnists.length);
  };

  if (!activeHeroPost) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <SeoHelmet
          title="Início"
          description="Revista Enfoco com reportagens, colunas, eventos e edições especiais em Santa Maria e região."
          canonicalPath="/"
        />
        <div className="text-center px-6 flex flex-col items-center">
          <Logo className="mb-8" />
          <div className="w-10 h-10 border-[3px] border-charcoal/15 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-stone">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SeoHelmet
        title="Início"
        description="Revista Enfoco com reportagens, colunas, eventos e edições especiais em Santa Maria e região."
        canonicalPath="/"
        image={activeHeroPost?.featured_image || visibleHomeColumnists[0]?.image}
      />
      <section className="relative flex flex-col overflow-hidden bg-charcoal">
          {/* Hero Principal - Capa de Revista Premium */}
          <div className="relative flex items-center h-[76svh] min-h-[500px] max-h-[610px] sm:h-[calc(100svh-88px)] sm:min-h-[600px] sm:max-h-[700px] lg:h-[calc(100svh-80px)] lg:min-h-[560px] lg:max-h-[760px] overflow-hidden">
            {/* Background com imagem */}
            <div className="absolute inset-0">
              {activeHeroPost.featured_image ? (
                <Parallax speed={0.08} className="absolute inset-0">
                  <SafeImage
                    src={activeHeroPost.featured_image}
                    alt={sanitizeText(activeHeroPost.title)}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    sizes="100vw"
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
                  <h1 className="font-hero-cocomat text-[2.35rem] sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-5 sm:mb-8 leading-[1.08] sm:leading-[1.18] lg:leading-[1.25] text-balance hero-text-shadow animate-hero-title line-clamp-3 sm:line-clamp-4">
                    {sanitizeText(activeHeroPost.title)}
                  </h1>

                  {/* Excerpt/Descrição - Minimalista */}
                  <p className="text-sm sm:text-base lg:text-base mb-7 sm:mb-10 max-w-md opacity-90 leading-relaxed font-light animate-hero-excerpt line-clamp-3">
                    {sanitizeText(activeHeroPost.excerpt)}
                  </p>

                  {/* Botões CTA - Minimalista */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
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
                  <div className="flex items-center gap-2 text-white/60 text-xs border-t border-white/15 pt-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
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
                      aria-label="Reportagem anterior"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={goToNextHighlight}
                      className="hidden lg:flex absolute right-0 top-[46%] translate-x-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white text-charcoal/55 hover:text-charcoal shadow-[0_14px_34px_rgba(15,23,42,0.10)] border border-black/6"
                      aria-label="Próxima reportagem"
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
                        <div className="aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-stone-100">
                          {post.featured_image ? (
                            <SafeImage
                              src={post.featured_image}
                              alt={sanitizeText(post.title)}
                              className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                              loading="lazy"
                              fetchPriority="low"
                              sizes="(min-width: 1024px) 31vw, (min-width: 640px) 50vw, 100vw"
                              style={{ 
                                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                                ...(post.image_position ? { objectPosition: post.image_position } : {})
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200"></div>
                          )}
                        </div>

                        {/* Conteúdo Secundário */}
                        <div className="flex flex-col flex-1 p-5 lg:p-6 min-h-[258px] sm:min-h-[278px]">
                          {/* Ícone de Categoria */}
                          <div className="flex items-center gap-2 mb-3">
                            <CategoryLabel
                              as="p"
                              category={post.category}
                              categoryId={post.category_id}
                              categorySlug={post.category_slug}
                              withDot
                              className="text-[11px] font-sans tracking-[0.18em] uppercase font-semibold mb-0"
                            />
                          </div>

                          {/* Título */}
                          <h3 className="font-display font-bold text-charcoal mb-3 leading-tight group-hover:text-royal-blue transition-colors duration-200 text-xl sm:text-lg lg:text-xl line-clamp-2 sm:line-clamp-3 min-h-[3.25rem] sm:min-h-[4.75rem]">
                            {sanitizeText(post.title)}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-sm text-stone leading-relaxed flex-1 mb-5 line-clamp-2 min-h-[2.75rem]">
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
                        aria-label="Reportagem anterior"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextHighlight}
                        className="w-11 h-11 flex items-center justify-center bg-white text-charcoal/55 hover:text-charcoal shadow-[0_12px_28px_rgba(15,23,42,0.10)] border border-black/6"
                        aria-label="Próxima reportagem"
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
      {false && (
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
              Estrutura editorial pronta para receber as reportagens, colunas, eventos e edições reais da revista,
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

      <AdBanner position="home_after_highlights" className="py-3 sm:py-8 lg:py-12" />

      <section className="bg-porcelain py-12 md:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <ScrollReveal animation="fadeIn" className="mb-10 md:mb-20">
            <p className="label-premium mb-3 md:mb-4">{sanitizeText(homeSettings.recommended_label)}</p>
            <div className="flex justify-between items-end gap-6">
              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-charcoal leading-[0.98] sm:leading-none">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 items-stretch">
              {recommendedPosts.map((post, index) => (
                <ScrollReveal
                  key={post.id}
                  animation="slideUp"
                  delay={index * 0.08}
                  className="h-full"
                >
                  <Link to={`/noticias/${post.slug}`} className="group h-full flex flex-col">
                    <div className="aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-gray-100 mb-5 sm:mb-6 shadow-premium-sm group-hover:shadow-premium transition-all duration-500">
                      {post.featured_image ? (
                        <SafeImage
                          src={post.featured_image}
                          alt={sanitizeText(post.title)}
                          className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-700"
                          loading="lazy"
                          fetchPriority="low"
                          sizes="(min-width: 1024px) 31vw, (min-width: 768px) 50vw, 100vw"
                          style={post.image_position ? { objectPosition: post.image_position } : undefined}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <CategoryLabel
                        as="p"
                        category={post.category}
                        categoryId={post.category_id}
                        categorySlug={post.category_slug}
                        className="text-xs font-sans tracking-[0.2em] uppercase mb-4 font-semibold"
                      />
                      <h3 className="font-display text-xl lg:text-2xl font-bold text-charcoal mb-3 md:mb-4 leading-tight group-hover:text-royal-blue transition-colors duration-200 line-clamp-2 sm:line-clamp-3 min-h-[3.25rem] sm:min-h-[4.85rem] md:min-h-[5.4rem]">
                        {sanitizeText(post.title)}
                      </h3>
                      <p className="text-sm text-stone leading-relaxed mb-5 line-clamp-2 text-opacity-80 flex-1 min-h-[2.75rem]">
                        {sanitizeText(post.excerpt)}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center text-xs text-stone border-t border-gray-200/50 pt-3 md:pt-4">
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
                As chamadas editoriais da home serão exibidas aqui assim que as primeiras reportagens forem cadastradas no backend.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-24 lg:py-28 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal animation="fadeIn" className="mb-14">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div>
                <p className="label-premium mb-4">{sanitizeText(homeSettings.columns_label)}</p>
                <h2 className="font-display text-4xl lg:text-5xl font-bold text-charcoal mb-4">
                  {sanitizeText(homeSettings.columns_title)}
                </h2>
                <p className="text-stone max-w-2xl leading-relaxed">
                  {sanitizeText(homeSettings.columns_description)}
                </p>
              </div>

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

          {highlightedColumns.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch">
              {highlightedColumns.map((column, index) => {
                const columnImage = column.featured_image || column.author_image;

                return (
                  <ScrollReveal
                    key={column.id || column.slug}
                    animation="slideUp"
                    delay={index * 0.08}
                    className="h-full"
                  >
                    <Link to={`/colunas/${column.slug}`} className="group block h-full">
                      <article className="h-full bg-porcelain border border-black/6 shadow-premium-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-premium flex flex-col overflow-hidden">
                        <div className="aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-gray-100">
                          {columnImage ? (
                            <SafeImage
                              src={columnImage}
                              alt={sanitizeText(column.title)}
                              className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                              loading="lazy"
                              fetchPriority="low"
                              sizes="(min-width: 1024px) 31vw, (min-width: 768px) 50vw, 100vw"
                              style={column.image_position ? { objectPosition: column.image_position } : undefined}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                          )}
                        </div>

                        <div className="p-6 flex flex-col flex-1 min-h-[286px]">
                          <p className="text-[11px] font-sans tracking-[0.18em] uppercase text-royal-blue font-semibold mb-4">
                            Coluna
                          </p>
                          <h3 className="font-display text-xl sm:text-2xl font-bold text-charcoal leading-tight mb-3 md:mb-4 group-hover:text-royal-blue transition-colors duration-300 line-clamp-2 sm:line-clamp-3 min-h-[3.25rem] sm:min-h-[5.7rem]">
                            {sanitizeText(column.title)}
                          </h3>
                          <p className="text-sm text-stone leading-relaxed line-clamp-3 mb-6 flex-1 min-h-[4rem]">
                            {sanitizeText(column.excerpt || '')}
                          </p>
                          <div className="flex items-center text-xs text-stone border-t border-black/6 pt-4">
                            <span className="font-medium text-charcoal/80">{sanitizeText(column.author_name || 'Colunista')}</span>
                            <span className="mx-2">-</span>
                            <span>{new Date(column.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          ) : (
            <div className="bg-porcelain border border-black/6 p-12 text-center shadow-premium-sm">
              <p className="text-stone leading-relaxed max-w-2xl mx-auto">
                {sanitizeText(homeSettings.columns_empty_message)}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-porcelain pt-24 pb-36 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal animation="fadeIn" className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
            <div>
              <p className="label-premium mb-4">Colunistas</p>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-charcoal mb-4">
                Vozes em destaque
              </h2>
              <p className="text-stone max-w-2xl leading-relaxed">
                Perfis, trajetórias e pontos de vista dos colunistas da Revista Enfoco.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {homeColumnists.length > 4 && (
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
                Ver Colunas
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>

          {homeColumnists.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
                {visibleHomeColumnists.map((columnist, index) => (
                  <ScrollReveal key={columnist.id || columnist.slug} animation="slideUp" delay={index * 0.08} className="h-full">
                    <ColumnistCard columnist={columnist} compact />
                  </ScrollReveal>
                ))}
              </div>

              {homeColumnists.length > 4 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {homeColumnists.map((columnist, index) => (
                    <button
                      key={columnist.id || columnist.slug || index}
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
                Os colunistas publicados aparecerão aqui assim que forem cadastrados no admin.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
