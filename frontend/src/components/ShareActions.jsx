import React, { useMemo, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

const getCleanText = (value = '') =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getShareUrl = (canonicalPath) => {
  if (canonicalPath && /^https?:\/\//i.test(canonicalPath)) {
    return canonicalPath;
  }

  if (typeof window === 'undefined') {
    return canonicalPath || '';
  }

  if (canonicalPath) {
    return `${window.location.origin}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
  }

  return `${window.location.origin}${window.location.pathname}`;
};

const writeClipboardFallback = (value) => {
  if (typeof document === 'undefined') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    return true;
  } finally {
    document.body.removeChild(textarea);
  }
};

const WhatsAppLogo = ({ className = '', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 1.74.46 3.45 1.34 4.95L2.05 22l5.27-1.38a9.9 9.9 0 0 0 4.72 1.2h.01c5.46 0 9.9-4.44 9.9-9.9A9.82 9.82 0 0 0 19.04 4.9 9.86 9.86 0 0 0 12.04 2Zm.01 18.14h-.01a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.23-8.24 8.23Zm4.52-6.17c-.25-.12-1.46-.72-1.69-.8-.23-.08-.4-.12-.56.12-.17.25-.65.8-.8.97-.14.17-.29.19-.54.07-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.24 3.75.59.26 1.06.41 1.42.52.6.19 1.14.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
  </svg>
);

const ShareActions = ({
  title,
  description,
  canonicalPath,
  className = '',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => getShareUrl(canonicalPath), [canonicalPath]);
  const shareTitle = getCleanText(title) || 'Revista Enfoco';
  const shareDescription = getCleanText(description);
  const whatsappText = [shareTitle, shareUrl].filter(Boolean).join(' - ');
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const copyLink = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        writeClipboardFallback(shareUrl);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      writeClipboardFallback(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription || shareTitle,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
      }
    }

    await copyLink();
  };

  return (
    <div
      className={`border-y border-gray-200 py-5 ${compact ? '' : 'my-10'} ${className}`}
      aria-label="Compartilhar conteúdo"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-sans font-semibold uppercase tracking-[0.18em] text-stone">
          Compartilhe
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={shareNative}
            className="inline-flex items-center justify-center gap-2 border border-charcoal/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-white"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-charcoal/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-white"
          >
            <WhatsAppLogo className="h-4 w-4" />
            WhatsApp
          </a>

          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 border border-charcoal/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal transition-colors hover:border-charcoal hover:bg-charcoal hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareActions;
