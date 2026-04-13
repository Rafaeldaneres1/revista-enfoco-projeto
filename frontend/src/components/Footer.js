import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { siteContent } from '../data/siteContent';

const socialLinks = [
  { label: 'Instagram', href: siteContent.contact.social.instagram },
  { label: 'Facebook', href: siteContent.contact.social.facebook },
  { label: 'LinkedIn', href: siteContent.contact.social.linkedin }
].filter((item) => item.href);

const Footer = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return null;
  }

  return (
    <footer className="bg-charcoal text-white pt-24 lg:pt-28 pb-12 lg:pb-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-14 lg:gap-20 mb-20 lg:mb-24">
          <div className="md:col-span-5">
            <div className="mb-8">
              <Logo variant="footer" />
            </div>
            <p className="text-white/70 leading-relaxed max-w-md text-sm font-light">
              Publicação digital com olhar editorial para Santa Maria e região, reunindo notícias,
              colunas, agenda e projetos especiais com apresentação premium.
            </p>

            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-10 flex-wrap">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 hover:bg-white/20 px-5 py-2.5 text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:shadow-lg"
                    aria-label={item.label}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-sans tracking-[0.2em] uppercase mb-8 text-white/90 font-semibold">
              Navegação
            </h4>
            <ul className="space-y-5 text-sm">
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
                  Notícias
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

          <div className="md:col-span-4">
            <h4 className="text-xs font-sans tracking-[0.2em] uppercase mb-8 text-white/90 font-semibold">
              Contato
            </h4>
            <ul className="space-y-5 text-sm text-white/70">
              {siteContent.contact.email && (
                <li>
                  <a
                    href={`mailto:${siteContent.contact.email}`}
                    className="hover:text-white transition-colors duration-300"
                  >
                    {siteContent.contact.email}
                  </a>
                </li>
              )}
              {siteContent.contact.phone && <li>{siteContent.contact.phone}</li>}
              <li>{siteContent.contact.city}</li>
              {!siteContent.contact.email && !siteContent.contact.phone && (
                <li className="text-white/50 text-xs leading-relaxed">
                  Canais oficiais em atualização. Os contatos editoriais serão publicados com o
                  conteúdo institucional definitivo.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-10 lg:pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>&copy; {siteContent.copyrightLabel}</p>
            <p className="uppercase tracking-[0.15em]">Santa Maria - RS</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
