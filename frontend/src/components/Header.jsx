import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { HAS_BACKEND, apiUrl } from '../lib/publicApi';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';
import { prefetchPublicRoute, prefetchPublicRoutesOnIdle, PUBLIC_PREFETCH_ROUTES } from '../lib/publicPrefetch';

const LATEST_EDITION_CACHE_KEY = 'latest-edition-link-v1';

const Header = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [latestEditionPath, setLatestEditionPath] = useState('/revista');

  useEffect(() => {
    if (isAdmin || !HAS_BACKEND) {
      return undefined;
    }

    let isMounted = true;
    const cachedLatestEditionPath = readPublicCache(LATEST_EDITION_CACHE_KEY);

    if (typeof cachedLatestEditionPath === 'string' && cachedLatestEditionPath) {
      setLatestEditionPath(cachedLatestEditionPath);
    }

    const fetchLatestEdition = async () => {
      try {
        const response = await fetch(apiUrl('/api/editions?published=true&compact=true&limit=1'));
        if (!response.ok) {
          throw new Error('Latest edition unavailable');
        }
        const payload = await response.json();
        const editions = Array.isArray(payload) ? payload : [];
        const latestEdition = editions.find((edition) => edition?.slug);

        if (isMounted && latestEdition) {
          const nextPath = `/revista/${latestEdition.slug}`;
          setLatestEditionPath(nextPath);
          writePublicCache(LATEST_EDITION_CACHE_KEY, nextPath);
        }
      } catch (error) {
        if (isMounted) {
          setLatestEditionPath('/revista');
        }
      }
    };

    fetchLatestEdition();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      return undefined;
    }

    return prefetchPublicRoutesOnIdle();
  }, [isAdmin]);

  if (isAdmin) {
    return null;
  }

  const navItems = [
    { name: 'Início', path: '/' },
    { name: 'Reportagens', path: '/noticias' },
    { name: 'Colunas', path: '/colunas' },
    { name: 'Eventos', path: '/eventos' },
    { name: 'Programas de TV', path: '/programas-de-tv' },
    { name: 'Revista', path: '/revista' },
    { name: 'Quem Somos', path: '/quem-somos' }
  ];

  const isActive = (path) => location.pathname === path;
  const warmRoute = (path) => {
    if (PUBLIC_PREFETCH_ROUTES[path]) {
      prefetchPublicRoute(path);
    }
  };

  return (
    <header className="bg-white/98 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-premium-sm">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-6">
          <Link to="/" className="hover:opacity-80 transition-opacity duration-300 flex-shrink-0">
            <Logo animationKey={location.pathname} />
          </Link>

          <div className="hidden md:flex items-center gap-5 lg:gap-7">
            <ul className="flex items-center space-x-5 lg:space-x-8">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onMouseEnter={() => warmRoute(item.path)}
                    onFocus={() => warmRoute(item.path)}
                    className={`text-sm font-medium tracking-[0.08em] uppercase whitespace-nowrap transition-all duration-300 ease-out relative group ${
                      isActive(item.path) ? 'text-royal-blue' : 'text-charcoal hover:text-royal-blue'
                    }`}
                  >
                    {item.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-royal-blue transition-all duration-300 group-hover:w-full ${
                        isActive(item.path) ? 'w-full' : 'w-0'
                      }`}
                    ></span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={latestEditionPath}
              className="inline-flex items-center justify-center bg-royal-blue text-white px-4 lg:px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] shadow-premium hover:bg-blue-700 transition-all duration-300 whitespace-nowrap"
            >
              Leia a última edição
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="md:hidden p-2 text-charcoal hover:text-royal-blue transition-colors duration-300"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 animate-slide-down">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onTouchStart={() => warmRoute(item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3.5 text-sm font-medium tracking-[0.08em] uppercase transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-royal-blue bg-blue-50/50'
                        : 'text-charcoal hover:text-royal-blue hover:bg-gray-50/50'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  to={latestEditionPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block mx-4 px-4 py-4 bg-royal-blue text-center text-white text-xs font-bold tracking-[0.14em] uppercase shadow-premium hover:bg-blue-700 transition-all duration-300"
                >
                  Leia a última edição
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
