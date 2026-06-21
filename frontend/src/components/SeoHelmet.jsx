import React from 'react';
import { Helmet } from 'react-helmet';
import { resolveAssetUrl } from '../lib/mediaUrls';

const SITE_NAME = 'Revista Enfoco';
const SITE_LOCALE = 'pt_BR';
const DEFAULT_TITLE = `${SITE_NAME} | Santa Maria RS`;
const DEFAULT_DESCRIPTION =
  'Revista Enfoco com reportagens, colunas, eventos e edições especiais em Santa Maria e região.';

const stripHtml = (value = '') =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const limitText = (value = '', maxLength = 160) => {
  const cleanValue = stripHtml(value);
  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength - 1).trim()}...`;
};

const buildCanonicalUrl = (canonicalPath) => {
  if (canonicalPath && /^https?:\/\//i.test(canonicalPath)) {
    return canonicalPath;
  }

  if (typeof window === 'undefined') {
    return canonicalPath || '';
  }

  if (!canonicalPath) {
    return window.location.href;
  }

  return `${window.location.origin}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
};

const removeEmptySchemaValues = (_, value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return value;
};

const SeoHelmet = ({
  title,
  description,
  image,
  canonicalPath,
  type = 'website',
  publishedTime,
  modifiedTime,
  authorName,
  sectionName
}) => {
  const titleText = stripHtml(title);
  const seoTitle = titleText ? `${titleText} | ${SITE_NAME}` : DEFAULT_TITLE;
  const seoDescription = limitText(description || DEFAULT_DESCRIPTION);
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const imageUrl = resolveAssetUrl(image);
  const isArticle = type === 'article';
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': isArticle ? 'NewsArticle' : 'WebPage',
    headline: titleText || DEFAULT_TITLE,
    description: seoDescription,
    url: canonicalUrl,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    articleSection: sectionName,
    author: authorName
      ? {
          '@type': 'Person',
          name: stripHtml(authorName)
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME
    }
  };

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:type" content={type} />
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      {imageUrl ? <meta property="og:image:alt" content={titleText || SITE_NAME} /> : null}
      {isArticle && publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {isArticle && (modifiedTime || publishedTime) ? (
        <meta property="article:modified_time" content={modifiedTime || publishedTime} />
      ) : null}
      {isArticle && authorName ? <meta property="article:author" content={stripHtml(authorName)} /> : null}
      {isArticle && sectionName ? <meta property="article:section" content={stripHtml(sectionName)} /> : null}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      <script type="application/ld+json">
        {JSON.stringify(schemaData, removeEmptySchemaValues)}
      </script>
    </Helmet>
  );
};

export default SeoHelmet;
