import React, { useMemo, useState } from 'react';
import SafeImage from './SafeImage';

const parseInlineStyle = (styleText = '') =>
  styleText
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .reduce((accumulator, rule) => {
      const [propertyRaw, valueRaw] = rule.split(':');
      const property = propertyRaw?.trim();
      const value = valueRaw?.trim();

      if (!property || !value) {
        return accumulator;
      }

      const reactProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      accumulator[reactProperty] = value;
      return accumulator;
    }, {});

const getElementProps = (element, key) => {
  const props = { key };
  const href = element.getAttribute('href');
  const target = element.getAttribute('target');
  const rel = element.getAttribute('rel');
  const style = element.getAttribute('style');
  const className = element.getAttribute('class');

  if (href) {
    props.href = href;
  }

  if (target) {
    props.target = target;
  }

  if (rel) {
    props.rel = rel;
  }

  if (style) {
    props.style = parseInlineStyle(style);
  }

  if (className) {
    props.className = className;
  }

  return props;
};

const RichGallery = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images.length) {
    return null;
  }

  const activeImage = images[currentIndex] || images[0];
  const hasMultipleImages = images.length > 1;

  const goToPrevious = () => {
    if (!hasMultipleImages) {
      return;
    }

    setCurrentIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const goToNext = () => {
    if (!hasMultipleImages) {
      return;
    }

    setCurrentIndex((current) => (current + 1) % images.length);
  };

  return (
    <figure data-gallery="true" className="rich-gallery-frame">
      <div className="rich-gallery-stage">
        <SafeImage
          src={activeImage.src}
          alt={activeImage.alt}
          className="rich-gallery-image"
        />
      </div>

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            className="rich-gallery-button rich-gallery-button-prev"
            onClick={goToPrevious}
            aria-label="Imagem anterior"
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          <button
            type="button"
            className="rich-gallery-button rich-gallery-button-next"
            onClick={goToNext}
            aria-label="Próxima imagem"
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
          <figcaption className="rich-gallery-counter">
            {currentIndex + 1} / {images.length}
          </figcaption>
        </>
      ) : null}
    </figure>
  );
};

const renderNode = (node, key) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node;
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'br') {
    return <br key={key} />;
  }

  if (tagName === 'img') {
    const src = element.getAttribute('data-src') || element.getAttribute('src') || '';
    if (!src) {
      return null;
    }

    return (
      <SafeImage
        key={key}
        src={src}
        alt={element.getAttribute('alt') || ''}
        className="article-rich-inline-image"
      />
    );
  }

  if (tagName === 'figure' && element.getAttribute('data-gallery') === 'true') {
    const images = Array.from(element.querySelectorAll(':scope > img, img')).map((image) => ({
      src: image.getAttribute('data-src') || image.getAttribute('src') || '',
      alt: image.getAttribute('alt') || ''
    }))
      .filter((image) => image.src);

    return <RichGallery key={key} images={images} />;
  }

  const children = Array.from(element.childNodes)
    .map((child, index) => renderNode(child, `${key}-${index}`))
    .filter((child) => child !== null && child !== undefined);

  return React.createElement(tagName, getElementProps(element, key), children);
};

const RichTextContent = ({ html, className = '' }) => {
  const content = useMemo(() => {
    if (!html || typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return null;
    }

    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');

    return Array.from(document.body.childNodes)
      .map((node, index) => renderNode(node, `rich-node-${index}`))
      .filter((node) => node !== null && node !== undefined);
  }, [html]);

  return <div className={className}>{content}</div>;
};

export default RichTextContent;
