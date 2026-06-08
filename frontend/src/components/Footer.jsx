import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Megaphone,
  Phone
} from 'lucide-react';
import Logo from './Logo';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { PRIVACY_PREFERENCES_EVENT } from '../lib/privacyConsent';
import { siteContent } from '../data/siteContent';

const getValue = (value) => (typeof value === 'string' ? value.trim() : '');
const COMMERCIAL_EMAIL = 'Comercial@revistaenfoco.com.br';

const normalizeInstagramUrl = (value) => {
  const rawValue = getValue(value);
  if (!rawValue) {
    return '';
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  const handle = rawValue.replace(/^@/, '').replace(/^instagram\.com\//i, '');
  return handle ? `https://www.instagram.com/${handle}` : '';
};

const normalizeSocialUrl = (value) => {
  const rawValue = getValue(value);
  if (!rawValue) {
    return '';
  }

  return /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;
};

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

const buildFallbackFooterData = () => ({
  contact_email: getValue(import.meta.env.VITE_CONTACT_EMAIL) || siteContent.contact.email || '',
  contact_phone:
    getValue(import.meta.env.VITE_CONTACT_PHONE) || siteContent.contact.phone || '',
  contact_city:
    getValue(import.meta.env.VITE_CONTACT_CITY) ||
    siteContent.contact.city ||
    siteContent.location,
  social: {
    instagram:
      getValue(import.meta.env.VITE_INSTAGRAM_URL) ||
      siteContent.contact.social?.instagram ||
      '',
    whatsapp:
      getValue(import.meta.env.VITE_WHATSAPP_URL) ||
      getValue(import.meta.env.VITE_WHATSAPP_NUMBER) ||
      siteContent.contact.social?.whatsapp ||
      '',
    facebook:
      getValue(import.meta.env.VITE_FACEBOOK_URL) ||
      siteContent.contact.social?.facebook ||
      '',
    linkedin:
      getValue(import.meta.env.VITE_LINKEDIN_URL) ||
      siteContent.contact.social?.linkedin ||
      ''
  }
});

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

const Footer = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [footerData, setFooterData] = useState(buildFallbackFooterData);

  useEffect(() => {
    if (!HAS_BACKEND || isAdmin) {
      return;
    }

    const fetchFooterContact = async () => {
      try {
        const response = await axios.get(apiUrl('/api/about'));
        const about = response.data || {};

        setFooterData((current) => ({
          contact_email: getValue(about.contact_email) || current.contact_email,
          contact_phone: getValue(about.contact_phone) || current.contact_phone,
          contact_city: getValue(about.contact_city) || current.contact_city,
          social: {
            instagram: getValue(about.social?.instagram) || current.social.instagram,
            whatsapp: getValue(about.social?.whatsapp) || current.social.whatsapp,
            facebook: getValue(about.social?.facebook) || current.social.facebook,
            linkedin: getValue(about.social?.linkedin) || current.social.linkedin
          }
        }));
      } catch (error) {
        console.warn('Footer contact data unavailable:', error);
      }
    };

    fetchFooterContact();
  }, [isAdmin]);

  const contactEmail = getValue(footerData.contact_email);
  const shouldShowCommercialEmail = contactEmail.toLowerCase() !== COMMERCIAL_EMAIL.toLowerCase();
  const contactPhone = getValue(footerData.contact_phone);
  const contactCity = getValue(footerData.contact_city) || 'Santa Maria - RS';
  const instagramUrl = normalizeInstagramUrl(footerData.social?.instagram);
  const whatsappUrl = buildWhatsappUrl(footerData.social?.whatsapp || contactPhone);
  const facebookUrl = normalizeSocialUrl(footerData.social?.facebook);
  const linkedinUrl = normalizeSocialUrl(footerData.social?.linkedin);
  const contactDescription =
    'Publicidade, parcerias e pautas editoriais podem ser direcionadas pelos canais oficiais da revista.';

  const openPrivacyPreferences = () => {
    window.dispatchEvent(new Event(PRIVACY_PREFERENCES_EVENT));
  };

  const socialLinks = useMemo(
    () =>
      [
        { label: 'Instagram', href: instagramUrl, Icon: Instagram },
        { label: 'WhatsApp', href: whatsappUrl, Icon: WhatsAppLogo },
        { label: 'Facebook', href: facebookUrl, Icon: ArrowUpRight },
        { label: 'LinkedIn', href: linkedinUrl, Icon: Linkedin }
      ].filter((item) => item.href),
    [facebookUrl, instagramUrl, linkedinUrl, whatsappUrl]
  );

  if (isAdmin) {
    return null;
  }

  return (
    <footer className="bg-charcoal text-white pt-16 sm:pt-20 lg:pt-24 pb-10 lg:pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-14 mb-14 lg:mb-20">
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="mb-7">
              <Logo variant="footer" />
            </div>
            <p className="text-white/70 leading-relaxed max-w-md text-sm font-light">
              Publicação digital com olhar editorial para Santa Maria e região, reunindo reportagens,
              colunas, agenda e projetos especiais com apresentação premium.
            </p>

            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-8 flex-wrap">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center border border-white/12 bg-white/[0.06] text-white/72 hover:bg-white hover:text-charcoal transition-all duration-300"
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-sans tracking-[0.2em] uppercase mb-6 text-white/90 font-semibold">
              Navegação
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/" className="text-white/70 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/quem-somos" className="text-white/70 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link to="/noticias" className="text-white/70 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Reportagens
                </Link>
              </li>
              <li>
                <Link to="/colunas" className="text-white/70 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Colunas
                </Link>
              </li>
              <li>
                <Link to="/eventos" className="text-white/70 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Eventos
                </Link>
              </li>
              <li>
                <Link to="/revista" className="text-white/70 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Revista
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-xs font-sans tracking-[0.2em] uppercase mb-6 text-white/90 font-semibold">
              Contato
            </h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-white/45 flex-shrink-0" aria-hidden="true" />
                <span>{contactCity}</span>
              </li>
              {contactEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-white/45 flex-shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-white transition-colors duration-300 break-all"
                  >
                    {contactEmail}
                  </a>
                </li>
              )}
              {shouldShowCommercialEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-white/45 flex-shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${COMMERCIAL_EMAIL}`}
                    className="hover:text-white transition-colors duration-300 break-all"
                  >
                    {COMMERCIAL_EMAIL}
                  </a>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-white/45 flex-shrink-0" aria-hidden="true" />
                  <span>{contactPhone}</span>
                </li>
              )}
              {!contactEmail && !contactPhone && (
                <li className="text-white/50 text-xs leading-relaxed">
                  Canais oficiais em atualização. Os contatos editoriais serão publicados com o
                  conteúdo institucional definitivo.
                </li>
              )}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <div className="border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex h-9 w-9 items-center justify-center bg-royal-blue text-white">
                  <Megaphone className="h-4 w-4" aria-hidden="true" />
                </span>
                <h4 className="text-xs font-sans tracking-[0.2em] uppercase text-white/90 font-semibold">
                  Anuncie
                </h4>
              </div>
              <p className="text-sm leading-relaxed text-white/64 mb-6">
                {contactDescription}
              </p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 bg-white text-charcoal px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:bg-royal-blue hover:text-white transition-colors duration-300"
                >
                  <WhatsAppLogo className="h-4 w-4" />
                  WhatsApp
                </a>
              ) : (
                <a
                  href={`mailto:${COMMERCIAL_EMAIL}`}
                  className="inline-flex w-full items-center justify-center gap-2 bg-white text-charcoal px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:bg-royal-blue hover:text-white transition-colors duration-300"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Enviar e-mail
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 lg:pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <p>&copy; {siteContent.copyrightLabel}</p>
              <span className="hidden sm:inline text-white/20" aria-hidden="true">|</span>
              <p>CNPJ 61.432.454/0001-26</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
              <Link
                to="/politica-de-privacidade"
                className="text-white/45 hover:text-white transition-colors duration-200"
              >
                Privacidade
              </Link>
              <Link
                to="/politica-de-cookies"
                className="text-white/45 hover:text-white transition-colors duration-200"
              >
                Cookies
              </Link>
              <button
                type="button"
                onClick={openPrivacyPreferences}
                className="text-white/45 hover:text-white transition-colors duration-200"
              >
                Preferências de privacidade
              </button>
              <a
                href="https://nodix.site/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Desenvolvido por Nodix"
                className="inline-flex items-center gap-2 text-white/65 hover:text-white transition-colors duration-200"
              >
                <img
                  src="/assets/nodix-icon.png"
                  alt=""
                  className="block h-[18px] w-[18px] object-contain bg-transparent"
                  aria-hidden="true"
                  draggable="false"
                />
                <span>Desenvolvido por Nodix</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
