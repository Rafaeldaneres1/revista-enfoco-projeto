import { resolveAssetUrl, BACKEND_URL } from './api';

const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI', 'A', 'SPAN', 'IMG', 'FIGURE']);
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'UL', 'OL', 'FIGURE']);

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const sanitizeUrl = (value = '') => {
  const href = String(value).trim();
  if (!href) return '';

  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('/') ||
    href.startsWith('#')
  ) {
    return href;
  }

  return `https://${href}`;
};

const sanitizeImageUrl = (value = '') => {
  const src = String(value).trim();
  if (!src) return '';

  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:image/') ||
    src.startsWith('/') ||
    src.startsWith('#')
  ) {
    return src;
  }

  return '';
};

const toStoredImageUrl = (value = '') => {
  const src = String(value).trim();
  if (!src) {
    return '';
  }

  if (BACKEND_URL && src.startsWith(BACKEND_URL)) {
    const nextPath = src.slice(BACKEND_URL.length);
    return nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  }

  return src;
};

const sanitizeStyle = (styleValue = '') => {
  const styleMap = {};

  styleValue
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((rule) => {
      const [propertyRaw, valueRaw] = rule.split(':');
      const property = propertyRaw?.trim().toLowerCase();
      const value = valueRaw?.trim().toLowerCase();

      if (!property || !value) {
        return;
      }

      if (property === 'font-size') {
        const match = value.match(/^(\d{1,2})px$/);
        if (!match) return;
        const size = Number(match[1]);
        if (size >= 12 && size <= 40) {
          styleMap['font-size'] = `${size}px`;
        }
      }

      if (property === 'margin-bottom') {
        const match = value.match(/^(\d{1,2})px$/);
        if (!match) return;
        const size = Number(match[1]);
        if (size >= 0 && size <= 48) {
          styleMap['margin-bottom'] = `${size}px`;
        }
      }

      if (property === 'line-height') {
        const match = value.match(/^(\d(?:\.\d{1,2})?)$/);
        if (!match) return;
        const lineHeight = Number(match[1]);
        if (lineHeight >= 1 && lineHeight <= 2.4) {
          styleMap['line-height'] = String(lineHeight);
        }
      }
    });

  return Object.entries(styleMap)
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ');
};

const unwrapElement = (element) => {
  const parent = element.parentNode;
  if (!parent) return;

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
};

const sanitizeNode = (node, document) => {
  if (node.nodeType === 3) {
    return;
  }

  if (node.nodeType !== 1) {
    node.parentNode?.removeChild(node);
    return;
  }

  const tag = node.tagName.toUpperCase();

  Array.from(node.childNodes).forEach((child) => sanitizeNode(child, document));

  if (!ALLOWED_TAGS.has(tag)) {
    unwrapElement(node);
    return;
  }

  if (tag === 'B') {
    const strong = document.createElement('strong');
    strong.innerHTML = node.innerHTML;
    node.replaceWith(strong);
    return;
  }

  if (tag === 'I') {
    const em = document.createElement('em');
    em.innerHTML = node.innerHTML;
    node.replaceWith(em);
    return;
  }

  const preservedHref = node.dataset?.href || node.getAttribute('href') || '';
  const preservedSrc = node.dataset?.src || node.getAttribute('src') || '';
  const preservedAlt = node.getAttribute('alt') || '';
  const preservedStyle = node.getAttribute('style') || node.dataset?.style || '';

  Array.from(node.attributes).forEach((attribute) => {
    node.removeAttribute(attribute.name);
  });

  if (tag === 'A') {
    const href = sanitizeUrl(preservedHref);
    if (!href) {
      unwrapElement(node);
      return;
    }
    node.setAttribute('href', href);
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }

  if (tag === 'IMG') {
    const src = sanitizeImageUrl(toStoredImageUrl(preservedSrc));
    if (!src) {
      node.remove();
      return;
    }

    node.setAttribute('src', src);
    node.setAttribute('data-src', src);
    if (preservedAlt) {
      node.setAttribute('alt', preservedAlt.trim());
    } else {
      node.setAttribute('alt', '');
    }
  }

  if (tag === 'FIGURE') {
    const hasGalleryImages = Boolean(node.querySelector('img'));
    if (!hasGalleryImages) {
      node.remove();
      return;
    }

    node.setAttribute('data-gallery', 'true');
  }

  const allowedStyle = sanitizeStyle(preservedStyle);
  if (allowedStyle && (tag === 'SPAN' || BLOCK_TAGS.has(tag))) {
    node.setAttribute('style', allowedStyle);
  }

  if (tag === 'SPAN' && !node.getAttribute('style') && !node.textContent?.trim()) {
    node.remove();
  }
};

export const plainTextToRichHtml = (value = '') => {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return '';
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br />')}</p>`)
    .join('');
};

export const sanitizeRichTextHtml = (value = '') => {
  const content = String(value ?? '').trim();

  if (!content) {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return content;
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  const html = looksLikeHtml ? content : plainTextToRichHtml(content);
  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');

  Array.from(document.body.childNodes).forEach((child) => sanitizeNode(child, document));

  Array.from(document.body.querySelectorAll('*')).forEach((element) => {
    if (
      BLOCK_TAGS.has(element.tagName) &&
      !element.textContent?.trim() &&
      !element.querySelector('br') &&
      !element.querySelector('img')
    ) {
      element.remove();
    }
  });

  return document.body.innerHTML.trim();
};

export const normalizeRichTextForEditor = (value = '') => {
  const sanitized = sanitizeRichTextHtml(value);
  if (!sanitized) {
    return '<p><br /></p>';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return sanitized;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(sanitized, 'text/html');
  Array.from(document.body.querySelectorAll('img')).forEach((image) => {
    const storedSrc = image.getAttribute('data-src') || image.getAttribute('src') || '';
    const resolvedSrc = resolveAssetUrl(storedSrc) || storedSrc;
    image.setAttribute('src', resolvedSrc);
    image.setAttribute('data-src', storedSrc);
  });

  return document.body.innerHTML.trim() || '<p><br /></p>';
};

export const normalizeRichTextForRender = (value = '') => {
  const sanitized = sanitizeRichTextHtml(value);
  if (!sanitized) {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return sanitized;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(sanitized, 'text/html');

  Array.from(document.body.querySelectorAll('img')).forEach((image) => {
    const storedSrc = image.getAttribute('data-src') || image.getAttribute('src') || '';
    const resolvedSrc = resolveAssetUrl(storedSrc) || storedSrc;

    if (!resolvedSrc) {
      image.remove();
      return;
    }

    image.setAttribute('src', resolvedSrc);
    image.setAttribute('data-src', storedSrc);
  });

  Array.from(document.body.querySelectorAll("figure[data-gallery='true']")).forEach((figure) => {
    const galleryImages = Array.from(figure.querySelectorAll('img'));
    if (!galleryImages.length) {
      figure.remove();
      return;
    }
  });

  return document.body.innerHTML.trim();
};

export const normalizeRichTextForStorage = (value = '') => sanitizeRichTextHtml(value);

export const richTextToPlainText = (value = '') => {
  const content = String(value ?? '').trim();

  if (!content) {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const sanitized = sanitizeRichTextHtml(content);
  const parser = new DOMParser();
  const document = parser.parseFromString(sanitized, 'text/html');
  return document.body.textContent?.replace(/\s+/g, ' ').trim() || '';
};
