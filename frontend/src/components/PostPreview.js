import React, { useMemo } from 'react';
import CategoryLabel from './CategoryLabel';
import { normalizeRichTextForRender } from '../lib/richText';
import SafeImage from './SafeImage';
import RichTextContent from './RichTextContent';

const PostPreview = ({ post, previewLabel = 'Previa do site' }) => {
  const renderedContent = useMemo(
    () => normalizeRichTextForRender(post?.content || ''),
    [post?.content]
  );

  const previewDate = useMemo(
    () =>
      new Date().toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
    []
  );

  return (
    <div className="rounded-[32px] overflow-hidden border border-charcoal/10 bg-white shadow-premium-sm">
      {post?.featured_image ? (
        <div className="relative h-[300px] md:h-[420px] bg-gray-100">
          <SafeImage
            src={post.featured_image}
            alt={post.title || 'Capa da materia'}
            className="w-full h-full object-cover"
            style={post.image_position ? { objectPosition: post.image_position } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
        </div>
      ) : null}

      <div className={`relative z-10 px-6 md:px-10 ${post?.featured_image ? '-mt-16 md:-mt-24' : 'pt-10'} pb-10`}>
        <div className="bg-white md:max-w-3xl mx-auto rounded-[24px] md:rounded-[28px] px-6 md:px-10 pt-8 md:pt-10 pb-8 shadow-premium-sm border border-charcoal/6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mb-5">{previewLabel}</p>

          <CategoryLabel
            as="p"
            category={post?.category}
            categoryId={post?.category_id}
            categorySlug={post?.category_slug}
            className="text-xs font-sans tracking-[0.15em] uppercase mb-5"
          />

          <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal leading-[1.08] mb-6">
            {post?.title || 'Titulo da materia'}
          </h1>

          <p className="text-lg md:text-xl text-stone leading-relaxed mb-8">
            {post?.excerpt || 'O resumo da materia aparecerá aqui para você revisar antes de publicar.'}
          </p>

          <div className="flex items-center gap-4 pb-8 mb-8 border-b border-gray-200">
            <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-white font-bold">
              {(post?.author_name || 'R').charAt(0)}
            </div>
            <div>
              <div className="font-medium text-charcoal">{post?.author_name || 'Redacao Enfoco'}</div>
              <div className="text-sm text-stone">{previewDate}</div>
            </div>
          </div>

          <RichTextContent
            className="article-rich-content max-w-none"
            html={
              renderedContent ||
              '<p>Comece a escrever o conteudo da materia para ver a previa editorial aqui.</p>'
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PostPreview;
