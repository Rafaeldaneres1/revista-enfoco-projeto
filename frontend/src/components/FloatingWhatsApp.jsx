import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchJson, HAS_BACKEND } from '../lib/publicApi';
import { siteContent } from '../data/siteContent';

const getValue = (value) => (typeof value === 'string' ? value.trim() : '');

const buildWhatsappUrl = (value) => {
  const rawValue = getValue(value);
  if (!rawValue) {
    return '';
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  const digits = rawValue.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const number = digits.startsWith('55') ? digits : `55${digits}`;
  const message =
    getValue(import.meta.env.VITE_WHATSAPP_MESSAGE) ||
    'Ola, vim pelo site da Revista Enfoco.';

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
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

const FloatingWhatsApp = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const fallbackContact = useMemo(
    () =>
      getValue(import.meta.env.VITE_WHATSAPP_URL) ||
      getValue(import.meta.env.VITE_WHATSAPP_NUMBER) ||
      siteContent.contact.social?.whatsapp ||
      getValue(import.meta.env.VITE_CONTACT_PHONE) ||
      siteContent.contact.phone ||
      '',
    []
  );
  const [whatsappContact, setWhatsappContact] = useState(fallbackContact);

  useEffect(() => {
    if (!HAS_BACKEND || isAdmin) {
      return;
    }

    const fetchContact = async () => {
      try {
        const about = (await fetchJson('/api/about')) || {};
        const nextContact = getValue(about.social?.whatsapp) || getValue(about.contact_phone);
        if (nextContact) {
          setWhatsappContact(nextContact);
        }
      } catch (error) {
        console.warn('Floating WhatsApp contact unavailable:', error);
      }
    };

    fetchContact();
  }, [isAdmin]);

  const whatsappUrl = buildWhatsappUrl(whatsappContact);

  if (isAdmin || !whatsappUrl) {
    return null;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Revista Enfoco no WhatsApp"
      title="Falar no WhatsApp"
      className="fixed bottom-4 left-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-1 hover:bg-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-royal-blue sm:bottom-7 sm:left-7 sm:h-16 sm:w-16"
    >
      <WhatsAppLogo className="h-6 w-6 sm:h-8 sm:w-8" />
    </a>
  );
};

export default FloatingWhatsApp;
