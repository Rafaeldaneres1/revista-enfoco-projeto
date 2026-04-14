import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { normalizeEditorialText } from '../lib/text';
import { fallbackPosts } from '../data/initialContent';
import CategoryLabel, { getCategoryMeta, useCategoryCatalog } from '../components/CategoryLabel';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';

const PostsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [posts, setPosts] = useState([]);
  const categoryCatalog = useCategoryCatalog();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!HAS_BACKEND) {
        setPosts(fallbackPosts);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl('/api/posts?published=true'));
        setPosts(Array.isArray(response.data) && response.data.length ? response.data : fallbackPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts(fallbackPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = useMemo(() => {
    const mapped = posts
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

  const filteredPosts =
    selectedCategory === 'Todas'
      ? posts
      : posts.filter((post) => {
          const meta = getCategoryMeta(post.category, categoryCatalog, {
            categoryId: post.category_id,
            categorySlug: post.category_slug
          });

          return meta.key === selectedCategory;
        });

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

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title="Notícias"
        description="Acompanhe as notícias e artigos publicados pela Revista Enfoco."
        canonicalPath="/noticias"
        image={filteredPosts[0]?.featured_image || posts[0]?.featured_image}
      />
      <div className="border-b border-gray-200 py-24 sm:py-28 lg:py-32 bg-porcelain animate-slide-down">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="label-premium mb-6">Leitura Recomendada</p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-charcoal mb-8 leading-[1.1] text-balance max-w-4xl">
            Notícias e
            <br />
            <em className="font-serif italic font-normal">Artigos</em>
          </h1>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="border-b border-gray-200 sticky top-20 bg-white/98 backdrop-blur-md z-40 shadow-premium-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex gap-6 sm:gap-8 overflow-x-auto py-6 scrollbar-hide">
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
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 sm:py-24 border border-gray-200 bg-porcelain/50">
            <p className="text-stone text-lg font-light">
              Nenhuma notícia publicada nesta categoria no momento.
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
      </div>
    </div>
  );
};

export default PostsPage;
