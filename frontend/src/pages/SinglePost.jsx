import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { fallbackPosts } from '../data/initialContent';
import CategoryLabel from '../components/CategoryLabel';
import { normalizeRichTextForRender } from '../lib/richText';
import SafeImage from '../components/SafeImage';
import ArticleHeroImage from '../components/ArticleHeroImage';
import ScrollReveal from '../components/ScrollReveal';
import ReadingProgress from '../components/ReadingProgress';
import RichTextContent from '../components/RichTextContent';
import SeoHelmet from '../components/SeoHelmet';
import ShareActions from '../components/ShareActions';
import AdBanner from '../components/AdBanner';
import CommentSection from '../components/CommentSection';

const normalizeAuthorLookupKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const hydratePostAuthorFromTeam = async (postData) => {
  if (!postData || postData.author_image) {
    return postData;
  }

  try {
    const response = await axios.get(apiUrl('/api/team?published=true'));
    const teamMembers = Array.isArray(response.data) ? response.data : [];
    const authorKey = normalizeAuthorLookupKey(postData.author_name);

    const matchedMember = teamMembers.find((member) => member.id === postData.author_member_id)
      || teamMembers.find((member) => normalizeAuthorLookupKey(member.name) === authorKey);

    if (!matchedMember?.image) {
      return postData;
    }

    return {
      ...postData,
      author_member_id: postData.author_member_id || matchedMember.id,
      author_name: matchedMember.name || postData.author_name,
      author_image: matchedMember.image,
    };
  } catch (error) {
    return postData;
  }
};

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
        const nextPost =
          response.data && typeof response.data === 'object' && !Array.isArray(response.data)
            ? await hydratePostAuthorFromTeam(response.data)
            : fallbackPosts.find((item) => item.slug === slug) || null;

        setPost(nextPost);
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
            Voltar para reportagens
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white">
      <SeoHelmet
        title={post.title}
        description={post.excerpt}
        canonicalPath={`/noticias/${post.slug}`}
        image={post.featured_image}
        type="article"
        publishedTime={post.created_at}
        modifiedTime={post.updated_at}
        authorName={post.author_name || 'Redação Enfoco'}
        sectionName={post.category}
      />
      <ReadingProgress />

      {post.featured_image && (
        <div key={`${post.slug}-${post.featured_image}`}>
          <ArticleHeroImage
            src={post.featured_image}
            alt={post.title}
            imagePosition={post.image_position}
            heightClassName="h-[70vh]"
          />
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
                {post.author_image ? (
                  <SafeImage
                    src={post.author_image}
                    alt={post.author_name || 'Redação Enfoco'}
                    className="w-14 h-14 rounded-full object-cover object-[center_30%] shadow-md ring-2 ring-white flex-shrink-0"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    sizes="128px" cloudinaryVariant="avatar"
                  />
                ) : (
                  <div className="w-14 h-14 bg-charcoal rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(post.author_name || 'R').charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-medium text-charcoal">{post.author_name || 'Redação Enfoco'}</div>
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

            <ShareActions
              title={post.title}
              description={post.excerpt}
              canonicalPath={`/noticias/${post.slug}`}
              className="-mt-6 mb-12"
              compact
            />

            <RichTextContent
              className="article-rich-content max-w-none"
              html={renderedContent}
              afterParagraphSlot={(
                <AdBanner
                  position="article_middle"
                  className="my-10"
                  containerClassName="w-full"
                />
              )}
            />

            <AdBanner
              position="article_footer"
              className="mt-14"
              containerClassName="w-full"
            />

            <ShareActions
              title={post.title}
              description={post.excerpt}
              canonicalPath={`/noticias/${post.slug}`}
              className="mt-10"
              compact
            />

            <CommentSection
              contentType="post"
              contentSlug={post.slug}
              className="mt-14"
            />
          </div>
        </div>
      </div>

    </article>
  );
};

export default SinglePost;
