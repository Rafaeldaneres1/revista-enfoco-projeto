import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { fallbackColumns } from '../data/initialContent';
import SafeImage from '../components/SafeImage';
import ArticleHeroImage from '../components/ArticleHeroImage';
import RichTextContent from '../components/RichTextContent';
import { normalizeRichTextForRender } from '../lib/richText';
import SeoHelmet from '../components/SeoHelmet';
import ShareActions from '../components/ShareActions';
import AdBanner from '../components/AdBanner';
import CommentSection from '../components/CommentSection';

const normalizeText = (value = '') =>
  String(value)
    .replaceAll('\u00c3\u00a1', '\u00e1')
    .replaceAll('\u00c3\u00a0', '\u00e0')
    .replaceAll('\u00c3\u00a2', '\u00e2')
    .replaceAll('\u00c3\u00a3', '\u00e3')
    .replaceAll('\u00c3\u00a9', '\u00e9')
    .replaceAll('\u00c3\u00aa', '\u00ea')
    .replaceAll('\u00c3\u00ad', '\u00ed')
    .replaceAll('\u00c3\u00b3', '\u00f3')
    .replaceAll('\u00c3\u00b4', '\u00f4')
    .replaceAll('\u00c3\u00b5', '\u00f5')
    .replaceAll('\u00c3\u00ba', '\u00fa')
    .replaceAll('\u00c3\u00a7', '\u00e7')
    .replaceAll('\u00e2\u20ac\u00a2', '\u2022');

const SingleColumn = () => {
  const { slug } = useParams();
  const [column, setColumn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColumn = async () => {
      if (!HAS_BACKEND) {
        setColumn(fallbackColumns.find((item) => item.slug === slug) || null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl(`/api/columns/${slug}`));
        setColumn(response.data && typeof response.data === 'object' && !Array.isArray(response.data) ? response.data : fallbackColumns.find((item) => item.slug === slug) || null);
      } catch (error) {
        console.error('Error fetching column:', error);
        setColumn(fallbackColumns.find((item) => item.slug === slug) || null);
      } finally {
        setLoading(false);
      }
    };

    fetchColumn();
  }, [slug]);

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

  if (!column) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">Coluna não encontrada</h2>
          <Link to="/colunas" className="text-royal-blue hover:underline">
            Voltar para colunas
          </Link>
        </div>
      </div>
    );
  }

  const renderedContent = normalizeRichTextForRender(column.content || '');

  return (
    <article className="min-h-screen bg-white">
      <SeoHelmet
        title={normalizeText(column.title)}
        description={normalizeText(column.excerpt || column.author_bio || '')}
        canonicalPath={`/colunas/${column.slug}`}
        image={column.featured_image || column.author_image}
        type="article"
        publishedTime={column.created_at}
        modifiedTime={column.updated_at}
        authorName={normalizeText(column.author_name)}
        sectionName="Colunas"
      />
      {column.featured_image && (
        <ArticleHeroImage
            src={column.featured_image}
            alt={normalizeText(column.title)}
            imagePosition={column.image_position}
            heightClassName="h-[60vh]"
        />
      )}

      <div className={`max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 ${column.featured_image ? '-mt-32' : 'pt-8 sm:pt-12'}`}>
        <div className="bg-white pt-8 sm:pt-12">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/colunas"
              className="inline-flex items-center text-sm text-stone hover:text-charcoal mb-8 sm:mb-12 transition-colors uppercase tracking-wide"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>

            <p className="text-xs font-sans tracking-[0.15em] uppercase text-royal-blue mb-4 sm:mb-6">
              Coluna de opinião
            </p>

            <h1 className="font-display text-[2.05rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal mb-5 sm:mb-8 leading-[1.06] sm:leading-[1.1] break-words">
              {normalizeText(column.title)}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-stone mb-8 sm:mb-12 leading-relaxed">{normalizeText(column.excerpt)}</p>

            <div className="flex items-center gap-4 pb-8 sm:pb-12 mb-8 sm:mb-12 border-b border-gray-200">
              {column.author_image ? (
                <SafeImage
                  src={column.author_image}
                  alt={normalizeText(column.author_name)}
                  className="w-14 h-14 rounded-full object-cover object-[center_30%] shadow-md ring-2 ring-white flex-shrink-0"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="128px" cloudinaryVariant="avatar"
                />
              ) : (
                <div className="w-14 h-14 bg-charcoal rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {normalizeText(column.author_name).charAt(0)}
                </div>
              )}
              <div>
                <div className="font-medium text-charcoal text-lg">
                  {normalizeText(column.author_name)}
                </div>
                <div className="text-sm text-stone">
                  {normalizeText(column.author_role || 'Colunista')} •{' '}
                  {new Date(column.created_at).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <ShareActions
              title={normalizeText(column.title)}
              description={normalizeText(column.excerpt)}
              canonicalPath={`/colunas/${column.slug}`}
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
              title={normalizeText(column.title)}
              description={normalizeText(column.excerpt)}
              canonicalPath={`/colunas/${column.slug}`}
              className="mt-10"
              compact
            />

            <CommentSection
              contentType="column"
              contentSlug={column.slug}
              className="mt-14"
            />

            <div className="mt-16 p-8 bg-porcelain border border-gray-100 shadow-sm">
              <div className="flex items-start gap-6">
                {column.author_image ? (
                  <SafeImage
                    src={column.author_image}
                    alt={normalizeText(column.author_name)}
                    className="w-24 h-24 rounded-full object-cover object-[center_30%] shadow-md flex-shrink-0 ring-2 ring-white"
                    loading="lazy"
                    decoding="async"
                    sizes="192px" cloudinaryVariant="avatar"
                  />
                ) : (
                  <div className="w-24 h-24 bg-charcoal rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {normalizeText(column.author_name).charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    {normalizeText(column.author_name)}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-royal-blue font-semibold mb-3">
                    {normalizeText(column.author_role || 'Colunista')}
                  </p>
                  <p className="text-sm text-stone leading-relaxed">
                    {normalizeText(
                      column.author_bio ||
                        'Perfil biográfico do colunista será refinado assim que a apresentação oficial da equipe editorial for enviada.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default SingleColumn;
