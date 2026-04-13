import React, { useMemo } from 'react';
import SafeImage from './SafeImage';
import RichTextContent from './RichTextContent';
import { normalizeRichTextForRender } from '../lib/richText';

const ColumnPreview = ({ column, previewLabel = 'Previa da coluna' }) => {
  const renderedContent = useMemo(
    () => normalizeRichTextForRender(column?.content || ''),
    [column?.content]
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
      {column?.featured_image ? (
        <div className="relative h-[280px] md:h-[380px] bg-gray-100">
          <SafeImage
            src={column.featured_image}
            alt={column.title || 'Capa da coluna'}
            className="w-full h-full object-cover"
            style={column.image_position ? { objectPosition: column.image_position } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
        </div>
      ) : null}

      <div className={`relative z-10 px-6 md:px-10 ${column?.featured_image ? '-mt-16 md:-mt-24' : 'pt-10'} pb-10`}>
        <div className="bg-white md:max-w-3xl mx-auto rounded-[24px] md:rounded-[28px] px-6 md:px-10 pt-8 md:pt-10 pb-8 shadow-premium-sm border border-charcoal/6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mb-5">{previewLabel}</p>

          <p className="text-xs font-sans tracking-[0.15em] uppercase text-royal-blue mb-6">
            Coluna de opiniao
          </p>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal leading-[1.08] mb-6">
            {column?.title || 'Titulo da coluna'}
          </h1>

          <p className="text-lg md:text-xl text-stone leading-relaxed mb-8">
            {column?.excerpt || 'O resumo da coluna aparecera aqui para revisar antes de publicar.'}
          </p>

          <div className="flex items-center gap-4 pb-8 mb-8 border-b border-gray-200">
            {column?.author_image ? (
              <SafeImage
                src={column.author_image}
                alt={column.author_name || 'Colunista'}
                className="w-12 h-12 rounded-full object-cover object-top shadow-md"
              />
            ) : (
              <div className="w-12 h-12 bg-charcoal rounded-full flex items-center justify-center text-white font-bold">
                {(column?.author_name || 'C').charAt(0)}
              </div>
            )}
            <div>
              <div className="font-medium text-charcoal">{column?.author_name || 'Colunista Enfoco'}</div>
              <div className="text-sm text-stone">
                {column?.author_role || 'Colunista'} • {previewDate}
              </div>
            </div>
          </div>

          <RichTextContent
            className="article-rich-content max-w-none"
            html={
              renderedContent ||
              '<p>Comece a escrever o conteudo da coluna para ver a previa editorial aqui.</p>'
            }
          />

          <div className="mt-16 p-8 bg-porcelain border border-gray-100 shadow-sm">
            <div className="flex items-start gap-6">
              {column?.author_image ? (
                <SafeImage
                  src={column.author_image}
                  alt={column.author_name || 'Colunista'}
                  className="w-20 h-20 rounded-full object-cover object-top shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 bg-charcoal rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {(column?.author_name || 'C').charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                  {column?.author_name || 'Colunista Enfoco'}
                </h3>
                <p className="text-xs uppercase tracking-[0.2em] text-royal-blue font-semibold mb-3">
                  {column?.author_role || 'Colunista'}
                </p>
                <p className="text-sm text-stone leading-relaxed">
                  {column?.author_bio || 'A bio do colunista aparecera aqui quando preenchida.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnPreview;
