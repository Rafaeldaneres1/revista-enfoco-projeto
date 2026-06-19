import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { normalizeEditorialText } from '../lib/text';
import { fallbackPosts } from '../data/initialContent';
import CategoryLabel, { getCategoryMeta, useCategoryCatalog } from '../components/CategoryLabel';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';
import PublicSearchBar from '../components/PublicSearchBar';
import AdBanner from '../components/AdBanner';
import { matchesSearch } from '../lib/search';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';

const POSTS_CACHE_KEY = 'posts-index-v2';
const POSTS_PAGE_SIZE = 24;

const PostsPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const categoryScrollerRef = useRef(null);
  const [categoryScrollState, setCategoryScrollState] = useState({
    canScroll: false,
    canScrollLeft: false,
    canScrollRight: false
  });
  const categoryCatalog = useCategoryCatalog();

  const updateCategoryScrollState = useCallback(() => {
    const scroller = categoryScrollerRef.current;

    if (!scroller) {
      return;
    }

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    const canScroll = maxScrollLeft > 1;

    setCategoryScrollState({
      canScroll,
      canScrollLeft: canScroll && scroller.scrollLeft > 1,
      canScrollRight: canScroll && scroller.scrollLeft < maxScrollLeft - 1
    });
  }, []);

  const scrollCategories = (direction) => {
    const scroller = categoryScrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.65, 220),
      behavior: 'smooth'
    });
  };

  const fetchPosts = useCallback(async ({ skip = 0, append = false } = {}) => {
      if (!HAS_BACKEND) {
        setPosts(fallbackPosts);
        setLoading(false);
        return;
      }

      try {
        if (!append) {
          const cachedPosts = readPublicCache(POSTS_CACHE_KEY);
          if (Array.isArray(cachedPosts) && cachedPosts.length) {
            setPosts(cachedPosts);
            setLoading(false);
          }
        }

        const response = await axios.get(apiUrl(`/api/posts?published=true&compact=true&limit=${POSTS_PAGE_SIZE}&skip=${skip}`));
        const responsePosts = Array.isArray(response.data) ? response.data : [];
        const nextPosts = responsePosts.length ? responsePosts : append ? [] : fallbackPosts;
        setHasMorePosts(responsePosts.length === POSTS_PAGE_SIZE);
        setPosts((currentPosts) => {
          const mergedPosts = append ? [...currentPosts, ...nextPosts] : nextPosts;
          const uniquePosts = mergedPosts.filter(
            (post, index, list) =>
              list.findIndex((candidate) => (candidate.id || candidate.slug) === (post.id || post.slug)) === index
          );
          if (!append) {
            writePublicCache(POSTS_CACHE_KEY, uniquePosts);
          }
          return uniquePosts;
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
        if (!append) {
          setPosts(fallbackPosts);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLoadMorePosts = () => {
    setLoadingMore(true);
    fetchPosts({ skip: posts.length, append: true });
  };

  const categories = useMemo(() => {
    const mapped = categoryCatalog.length
      ? categoryCatalog.map((category) => ({
          key: category.id || category.slug || category.name,
          label: category.name
        }))
      : posts
          .map((post) =>
            getCategoryMeta(post.category, categoryCatalog, {
              categoryId: post.category_id,
              categorySlug: post.category_slug
            })
          )
          .filter((item) => item.key);

    const unique = mapped.filter(
      (item, index, list) => list.findIndex((candidate) => candidate.key === item.key) === index
    );

    return [{ key: 'Todas', label: 'Todas' }, ...unique];
  }, [posts, categoryCatalog]);

  useEffect(() => {
    updateCategoryScrollState();

    const handleResize = () => updateCategoryScrollState();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [categories.length, updateCategoryScrollState]);

  const categoryFilteredPosts =
    selectedCategory === 'Todas'
      ? posts
      : posts.filter((post) => {
          const meta = getCategoryMeta(post.category, categoryCatalog, {
            categoryId: post.category_id,
            categorySlug: post.category_slug
          });

          return meta.key === selectedCategory;
        });

  const filteredPosts = categoryFilteredPosts.filter((post) =>
    matchesSearch(
      post,
      [
        (item) => item.title,
        (item) => item.excerpt,
        (item) => item.category,
        (item) => item.author_name
      ],
      searchQuery
    )
  );

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title="Reportagens"
        description="Acompanhe as reportagens e artigos publicados pela Revista Enfoco."
        canonicalPath="/noticias"
        image={filteredPosts[0]?.featured_image || posts[0]?.featured_image}
      />
      <div className="relative overflow-hidden text-white animate-slide-down">
        <div className="absolute inset-0 bg-charcoal"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.04),_transparent_55%)]"></div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <p className="label-premium text-white/70 mb-6">Leitura Recomendada</p>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-7 sm:mb-8 leading-[1.06] sm:leading-[1.1] text-balance max-w-4xl">
            Reportagens e
            <br />
            <em className="font-serif italic font-normal">Artigos</em>
          </h1>
          <div className="mt-10 max-w-2xl">
            <PublicSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Pesquisar reportagens por título, autor ou categoria"
              label="Pesquisar reportagens"
              containerClassName="w-full"
            />
          </div>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="border-b border-gray-200 sticky top-20 bg-white/98 backdrop-blur-md z-40 shadow-premium-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
            {categoryScrollState.canScroll && (
              <button
                type="button"
                onClick={() => scrollCategories(-1)}
                disabled={!categoryScrollState.canScrollLeft}
                className={`absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 border border-gray-200 bg-white/95 shadow-premium-sm flex items-center justify-center transition-all duration-200 ${
                  categoryScrollState.canScrollLeft
                    ? 'text-charcoal hover:border-royal-blue hover:text-royal-blue'
                    : 'text-gray-300 cursor-default opacity-60'
                }`}
                aria-label="Ver categorias anteriores"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}

            <div
              ref={categoryScrollerRef}
              onScroll={updateCategoryScrollState}
              className={`flex gap-6 sm:gap-8 overflow-x-auto py-6 scrollbar-hide scroll-smooth ${
                categoryScrollState.canScroll ? 'px-12 sm:px-14' : ''
              }`}
            >
              {categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setSelectedCategory(category.key)}
                  className={`text-sm font-sans tracking-[0.12em] uppercase whitespace-nowrap transition-all duration-300 pb-3 border-b-2 font-medium ${
                    selectedCategory === category.key
                      ? 'text-charcoal border-royal-blue'
                      : 'text-stone border-transparent hover:text-charcoal hover:border-gray-300'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {categoryScrollState.canScroll && (
              <button
                type="button"
                onClick={() => scrollCategories(1)}
                disabled={!categoryScrollState.canScrollRight}
                className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 h-9 w-9 sm:h-10 sm:w-10 border border-gray-200 bg-white/95 shadow-premium-sm flex items-center justify-center transition-all duration-200 ${
                  categoryScrollState.canScrollRight
                    ? 'text-charcoal hover:border-royal-blue hover:text-royal-blue'
                    : 'text-gray-300 cursor-default opacity-60'
                }`}
                aria-label="Ver proximas categorias"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      )}

      <AdBanner position="posts_after_filters" className="pt-10 sm:pt-12" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        {loading && posts.length === 0 ? (
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center animate-pulse">
            <div className="aspect-[4/3] bg-gray-100 rounded-sm"></div>
            <div>
              <div className="h-3 w-32 bg-gray-200 mb-6"></div>
              <div className="h-10 w-4/5 bg-gray-200 mb-4"></div>
              <div className="h-10 w-3/5 bg-gray-200 mb-8"></div>
              <div className="h-4 w-full bg-gray-100 mb-3"></div>
              <div className="h-4 w-4/5 bg-gray-100"></div>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 sm:py-24 border border-gray-200 bg-porcelain/50">
            <p className="text-stone text-lg font-light">
              {searchQuery ? 'Nenhuma reportagem encontrada.' : 'Nenhuma reportagem publicada nesta categoria no momento.'}
            </p>
          </div>
        ) : (
          <div className="space-y-20 sm:space-y-24 lg:space-y-32">
            {filteredPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/noticias/${post.slug}`}
                className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-center group animate-slide-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100 shadow-premium-sm group-hover:shadow-premium transition-all duration-500 rounded-sm">
                    {post.featured_image ? (
                      <SafeImage
                        src={post.featured_image}
                        alt={normalizeEditorialText(post.title)}
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                        style={post.image_position ? { objectPosition: post.image_position } : undefined}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                    )}
                  </div>
                </div>

                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <CategoryLabel
                    as="p"
                    category={post.category}
                    categoryId={post.category_id}
                    categorySlug={post.category_slug}
                    className="text-xs font-sans tracking-[0.2em] uppercase mb-5 sm:mb-6 font-semibold"
                  />
                  <h2 className="font-display text-3xl lg:text-4xl xl:text-5xl font-bold text-charcoal mb-6 sm:mb-8 leading-[1.14] group-hover:text-royal-blue transition-colors duration-200 text-balance">
                    {normalizeEditorialText(post.title)}
                  </h2>
                  <p className="text-base text-stone leading-relaxed mb-8 sm:mb-10 text-opacity-90 max-w-2xl">
                    {normalizeEditorialText(post.excerpt)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone border-t border-gray-200/50 pt-6 sm:pt-8">
                    <span className="font-medium text-charcoal/80">
                      {normalizeEditorialText(post.author_name || 'Redação')}
                    </span>
                    <span className="text-stone/60">•</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {hasMorePosts && !searchQuery && selectedCategory === 'Todas' && (
          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={handleLoadMorePosts}
              disabled={loadingMore}
              className="px-7 py-3 rounded-full border border-charcoal/16 text-sm uppercase tracking-[0.12em] font-semibold text-charcoal hover:bg-charcoal hover:text-white transition-colors disabled:opacity-60"
            >
              {loadingMore ? 'Carregando...' : 'Ver mais reportagens'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsPage;
