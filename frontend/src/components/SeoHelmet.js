import React from 'react';
import { Helmet } from 'react-helmet';
import { resolveAssetUrl } from '../lib/api';

const DEFAULT_TITLE = 'Revista Enfoco | Santa Maria RS';
const DEFAULT_DESCRIPTION =
  'Revista Enfoco com notícias, colunas, eventos e edições especiais em Santa Maria e região.';

const stripHtml = (value = '') =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

const SeoHelmet = ({
  title,
  description,
  image,
  canonicalPath,
  type = 'website'
}) => {
  const seoTitle = title ? `${stripHtml(title)} | Revista Enfoco` : DEFAULT_TITLE;
  const seoDescription = stripHtml(description) || DEFAULT_DESCRIPTION;
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const imageUrl = resolveAssetUrl(image);

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:type" content={type} />
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
    </Helmet>
  );
};

export default SeoHelmet;
