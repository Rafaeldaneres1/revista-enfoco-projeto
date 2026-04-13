import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { fallbackPosts } from '../data/initialContent';
import CategoryLabel from '../components/CategoryLabel';
import { normalizeRichTextForRender } from '../lib/richText';
import SafeImage from '../components/SafeImage';
import ScrollReveal from '../components/ScrollReveal';
import ReadingProgress from '../components/ReadingProgress';
import RichTextContent from '../components/RichTextContent';

const SinglePost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setPost(null);

      if (!HAS_BACKEND) {
        setPost(fallbackPosts.find((item) => item.slug === slug) || null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl(`/api/posts/${slug}`));
        setPost(
          response.data && typeof response.data === 'object' && !Array.isArray(response.data)
            ? response.data
            : fallbackPosts.find((item) => item.slug === slug) || null
        );
      } catch (error) {
        console.error('Error fetching post:', error);
        setPost(fallbackPosts.find((item) => item.slug === slug) || null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  const renderedContent = useMemo(
    () => normalizeRichTextForRender(post?.content || ''),
    [post?.content]
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

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Matéria não encontrada</h2>
          <Link to="/noticias" className="text-royal-blue hover:underline">
            Voltar para notícias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white">
      <ReadingProgress />

      {post.featured_image && (
        <div key={`${post.slug}-${post.featured_image}`} className="relative h-[70vh] bg-gray-100">
          <SafeImage
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
            style={post.image_position ? { objectPosition: post.image_position } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-32 relative z-10">
        <div className="bg-white pt-12">
          <div className="max-w-2xl mx-auto">
            <ScrollReveal animation="fadeIn">
              <Link
                to="/noticias"
                className="inline-flex items-center text-sm text-stone hover:text-charcoal mb-12 transition-colors uppercase tracking-wide"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Link>
            </ScrollReveal>

            <ScrollReveal animation="slideUp" delay={0.05}>
              <CategoryLabel
                as="p"
                category={post.category}
                categoryId={post.category_id}
                categorySlug={post.category_slug}
                className="text-xs font-sans tracking-[0.15em] uppercase mb-6"
              />
            </ScrollReveal>

            <ScrollReveal animation="slideUp" delay={0.1}>
              <h1 className="font-display text-5xl lg:text-6xl font-bold text-charcoal mb-8 leading-[1.1]">
                {post.title}
              </h1>
            </ScrollReveal>

            <ScrollReveal animation="slideUp" delay={0.15}>
              <p className="text-xl text-stone mb-12 leading-relaxed">{post.excerpt}</p>
            </ScrollReveal>

            <ScrollReveal animation="slideUp" delay={0.2}>
              <div className="flex items-center gap-4 pb-12 mb-12 border-b border-gray-200">
                <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-white font-bold">
                  {(post.author_name || 'R').charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-charcoal">{post.author_name || 'Redacao Enfoco'}</div>
                  <div className="text-sm text-stone">
                    {new Date(post.created_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fadeIn" delay={0.1}>
              <RichTextContent
                className="article-rich-content max-w-none"
                html={renderedContent}
              />
            </ScrollReveal>

            <ScrollReveal animation="slideUp" delay={0.1}>
              <div className="mt-16 pt-12 border-t border-gray-200">
                <p className="text-xs font-sans tracking-[0.15em] uppercase text-stone mb-6">
                  Continue na Revista Enfoco
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Link
                    to="/noticias"
                    className="border border-gray-200 px-5 py-3 text-sm uppercase tracking-[0.12em] hover:border-charcoal transition-colors"
                  >
                    Mais notícias
                  </Link>
                  <Link
                    to="/colunas"
                    className="border border-gray-200 px-5 py-3 text-sm uppercase tracking-[0.12em] hover:border-charcoal transition-colors"
                  >
                    Ver colunas
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div className="mt-24 py-20 bg-porcelain">
        <ScrollReveal animation="slideUp" className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h3 className="font-display text-3xl lg:text-4xl font-bold text-charcoal mb-6">
            Continue acompanhando
          </h3>
          <p className="text-stone mb-8">
            Novos conteudos, colunas e edicoes serao organizados aqui conforme a base editorial da revista for sendo preenchida.
          </p>
          <Link
            to="/noticias"
            className="inline-flex bg-royal-blue hover:bg-royal-blue-dark text-white px-8 py-4 text-sm font-semibold tracking-wide uppercase transition-colors"
          >
            Voltar para notícias
          </Link>
        </ScrollReveal>
      </div>
    </article>
  );
};

export default SinglePost;
