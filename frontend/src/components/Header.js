import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

const Header = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isAdmin) {
    return null;
  }

  const navItems = [
    { name: 'Início', path: '/' },
    { name: 'Quem Somos', path: '/quem-somos' },
    { name: 'Notícias', path: '/noticias' },
    { name: 'Colunas', path: '/colunas' },
    { name: 'Eventos', path: '/eventos' },
    { name: 'Revista', path: '/revista' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/98 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-premium-sm">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-6">
          <Link to="/" className="hover:opacity-80 transition-opacity duration-300 flex-shrink-0">
            <Logo animationKey={location.pathname} />
          </Link>

          <ul className="hidden md:flex items-center space-x-10 lg:space-x-12">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`text-sm font-medium tracking-[0.08em] uppercase transition-all duration-300 ease-out relative group ${
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
            <li>
              <Link to="/quem-somos#contato" className="btn-premium-primary rounded-none">
                Editorial
              </Link>
            </li>
          </ul>

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
          <div className="md:hidden border-t border-gray-200 py-4 animate-slide-down">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-sm font-medium tracking-[0.08em] uppercase transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-royal-blue bg-blue-50/50'
                        : 'text-charcoal hover:text-royal-blue hover:bg-gray-50/50'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="px-4 pt-2">
                <Link
                  to="/quem-somos#contato"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full btn-premium-primary rounded-none text-center"
                >
                  Editorial
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
