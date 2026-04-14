import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { fallbackColumns } from '../data/initialContent';
import SafeImage from '../components/SafeImage';
import RichTextContent from '../components/RichTextContent';
import { normalizeRichTextForRender } from '../lib/richText';
import SeoHelmet from '../components/SeoHelmet';

const normalizeText = (value = '') =>
  String(value)
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
      />
      {column.featured_image && (
        <div className="relative h-[60vh] bg-gray-100">
          <SafeImage
            src={column.featured_image}
            alt={normalizeText(column.title)}
            className="w-full h-full object-cover"
            style={column.image_position ? { objectPosition: column.image_position } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-32 relative z-10">
        <div className="bg-white pt-12">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/colunas"
              className="inline-flex items-center text-sm text-stone hover:text-charcoal mb-12 transition-colors uppercase tracking-wide"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>

            <p className="text-xs font-sans tracking-[0.15em] uppercase text-royal-blue mb-6">
              Coluna de opinião
            </p>

            <h1 className="font-display text-5xl lg:text-6xl font-bold text-charcoal mb-8 leading-[1.1]">
              {normalizeText(column.title)}
            </h1>

            <p className="text-xl text-stone mb-12 leading-relaxed">{normalizeText(column.excerpt)}</p>

            <div className="flex items-center gap-4 pb-12 mb-12 border-b border-gray-200">
              {column.author_image ? (
                <SafeImage
                  src={column.author_image}
                  alt={normalizeText(column.author_name)}
                  className="w-12 h-12 rounded-full object-cover object-top shadow-md ring-2 ring-white"
                />
              ) : (
                <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-white font-bold">
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

            <RichTextContent
              className="article-rich-content max-w-none"
              html={renderedContent}
            />

            <div className="mt-16 p-8 bg-porcelain border border-gray-100 shadow-sm">
              <div className="flex items-start gap-6">
                {column.author_image ? (
                  <SafeImage
                    src={column.author_image}
                    alt={normalizeText(column.author_name)}
                    className="w-20 h-20 rounded-full object-cover object-top shadow-md flex-shrink-0 ring-2 ring-white"
                  />
                ) : (
                  <div className="w-20 h-20 bg-charcoal rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
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
