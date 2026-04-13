import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { importInitialContent } from '../lib/contentImport';
import AdminAdvancedDashboard from '../components/AdminAdvancedDashboard';

const buildRecentActivity = ({ posts, columns, events, editions }) => {
  const allItems = [
    ...posts.map((item) => ({
      title: item.title,
      description: `Notícia ${item.published ? 'publicada' : 'em rascunho'}`,
      time: item.updated_at || item.created_at,
      type: item.updated_at && item.updated_at !== item.created_at ? 'edit' : 'create'
    })),
    ...columns.map((item) => ({
      title: item.title,
      description: `Coluna ${item.published ? 'publicada' : 'em rascunho'}`,
      time: item.updated_at || item.created_at,
      type: item.updated_at && item.updated_at !== item.created_at ? 'edit' : 'create'
    })),
    ...events.map((item) => ({
      title: item.title,
      description: `Evento ${item.published ? 'publicado' : 'em rascunho'}`,
      time: item.updated_at || item.created_at,
      type: item.updated_at && item.updated_at !== item.created_at ? 'edit' : 'create'
    })),
    ...editions.map((item) => ({
      title: item.title,
      description: `Edição ${item.published ? 'publicada' : 'em rascunho'}`,
      time: item.updated_at || item.created_at,
      type: item.updated_at && item.updated_at !== item.created_at ? 'edit' : 'create'
    }))
  ];

  return allItems
    .filter((item) => item.title && item.time)
    .sort((left, right) => new Date(right.time) - new Date(left.time))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      time: new Date(item.time).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }));
};

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const [importing, setImporting] = React.useState(false);
  const [importMessage, setImportMessage] = React.useState('');
  const [showNotification, setShowNotification] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalPosts: 0,
    totalColumns: 0,
    totalEvents: 0,
    totalEditions: 0,
    publishedPosts: 0,
    draftPosts: 0,
    recentActivity: []
  });

  React.useEffect(() => {
    if (!token) {
      window.location.href = '/admin';
      return;
    }

    const loadStats = async () => {
      try {
        const [postsResponse, columnsResponse, eventsResponse, editionsResponse] =
          await Promise.all([
            axios.get(apiUrl('/api/posts')),
            axios.get(apiUrl('/api/columns')),
            axios.get(apiUrl('/api/events')),
            axios.get(apiUrl('/api/editions'))
          ]);

        const posts = Array.isArray(postsResponse.data) ? postsResponse.data : [];
        const columns = Array.isArray(columnsResponse.data) ? columnsResponse.data : [];
        const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
        const editions = Array.isArray(editionsResponse.data) ? editionsResponse.data : [];

        setStats({
          totalPosts: posts.length,
          totalColumns: columns.length,
          totalEvents: events.length,
          totalEditions: editions.length,
          publishedPosts: posts.filter((item) => item.published).length,
          draftPosts: posts.filter((item) => !item.published).length,
          recentActivity: buildRecentActivity({ posts, columns, events, editions })
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    };

    loadStats();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin';
  };

  const handleImport = async () => {
    if (!token) {
      setImportMessage('Faça login novamente para sincronizar o conteúdo editorial.');
      setShowNotification(true);
      return;
    }

    setImporting(true);
    setImportMessage('');

    try {
      const result = await importInitialContent(token);
      setImportMessage(
        `✓ Conteúdo sincronizado: ${result.posts.created + result.posts.updated} notícias, ${result.columns.created + result.columns.updated} colunas, ${result.editions.created + result.editions.updated} edições, ${result.team.created + result.team.updated} perfis da equipe.`
      );
      setShowNotification(true);
    } catch (error) {
      console.error('Error importing initial content:', error);
      setImportMessage('✕ Não foi possível sincronizar o conteúdo agora. Tente novamente em instantes.');
      setShowNotification(true);
    } finally {
      setImporting(false);
    }
  };

  const contentCards = [
    {
      title: 'Notícias',
      description: 'Gerenciar notícias e matérias',
      to: '/admin/posts',
      icon: '📰',
      color: 'from-blue-50 to-blue-100'
    },
    {
      title: 'Colunas',
      description: 'Gerenciar colunas de autores',
      to: '/admin/columns',
      icon: '✍️',
      color: 'from-purple-50 to-purple-100'
    },
    {
      title: 'Eventos',
      description: 'Gerenciar agenda de eventos',
      to: '/admin/events',
      icon: '📅',
      color: 'from-green-50 to-green-100'
    },
    {
      title: 'Edições',
      description: 'Gerenciar edições da revista',
      to: '/admin/editions',
      icon: '📑',
      color: 'from-orange-50 to-orange-100'
    }
  ];

  const settingsCards = [
    {
      title: 'Home',
      description: 'Editar textos e rótulos da página inicial',
      to: '/admin/home',
      icon: '🏠'
    },
    {
      title: 'Categorias',
      description: 'Gerenciar nomes, cores e status das categorias',
      to: '/admin/categories',
      icon: '🏷️'
    },
    {
      title: 'Quem Somos',
      description: 'Editar capa, textos, missão e contatos',
      to: '/admin/about',
      icon: '👥'
    },
    {
      title: 'Equipe',
      description: 'Gerenciar equipe editorial',
      to: '/admin/team',
      icon: '👨‍💼'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-porcelain via-white to-porcelain pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="enfoco-glass rounded-2xl p-8 md:p-12 mb-10 shadow-premium">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Dashboard</h1>
              <p className="text-stone text-lg font-light">
                Bem-vindo, <span className="font-semibold text-charcoal">{user.name}</span>!
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-charcoal/20 text-charcoal text-sm font-medium hover:bg-charcoal/5 transition-all duration-300 hover:border-charcoal/40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver Site
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90 transition-all duration-300 shadow-premium-sm hover:shadow-premium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>

        {showNotification && importMessage && (
          <div
            className={`mb-6 rounded-lg p-4 animate-slide-down ${
              importMessage.startsWith('✓')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{importMessage.startsWith('✓') ? '✓' : '✕'}</span>
              <p className="text-sm font-medium flex-1">{importMessage}</p>
              <button
                onClick={() => setShowNotification(false)}
                className="text-lg hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="space-y-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">Gerenciar Conteúdo</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {contentCards.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="group enfoco-glass rounded-xl p-6 hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-xl">{card.icon}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-charcoal mb-2 group-hover:text-royal-blue transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-stone text-sm font-light">{card.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <AdminAdvancedDashboard stats={stats} />

          <div>
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">Configurações</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {settingsCards.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="group enfoco-glass rounded-xl p-6 hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl">{card.icon}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-charcoal mb-2 group-hover:text-royal-blue transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-stone text-sm font-light">{card.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="enfoco-glass rounded-xl p-8 shadow-premium">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-royal-blue to-royal-blue/50 rounded-full"></div>
                  <h2 className="font-display text-2xl font-bold text-charcoal">Sincronizar Conteúdo</h2>
                </div>
                <p className="text-stone font-light">
                  Importa para o painel as notícias, colunas, edições e perfis da equipe que já foram montados no site, para que tudo fique editável no admin.
                </p>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="px-8 py-4 rounded-lg bg-gradient-to-r from-royal-blue to-royal-blue/90 text-white font-semibold hover:shadow-premium transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 whitespace-nowrap"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Migrar Conteúdo
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="enfoco-glass rounded-xl p-8 shadow-premium">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-500/50 rounded-full"></div>
              <h2 className="font-display text-2xl font-bold text-charcoal">Início Rápido</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-royal-blue text-white font-semibold text-sm flex-shrink-0">1</div>
                  <div>
                    <p className="text-stone font-medium">Crie sua primeira notícia</p>
                    <Link to="/admin/posts/new" className="text-royal-blue text-sm font-semibold hover:underline">
                      Ir para Notícias →
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-royal-blue text-white font-semibold text-sm flex-shrink-0">2</div>
                  <div>
                    <p className="text-stone font-medium">Adicione uma coluna</p>
                    <Link to="/admin/columns/new" className="text-royal-blue text-sm font-semibold hover:underline">
                      Ir para Colunas →
                    </Link>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-royal-blue text-white font-semibold text-sm flex-shrink-0">3</div>
                  <div>
                    <p className="text-stone font-medium">Organize as categorias</p>
                    <Link to="/admin/categories" className="text-royal-blue text-sm font-semibold hover:underline">
                      Ir para Categorias →
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-royal-blue text-white font-semibold text-sm flex-shrink-0">4</div>
                  <div>
                    <p className="text-stone font-medium">Publique uma edição</p>
                    <Link to="/admin/editions/new" className="text-royal-blue text-sm font-semibold hover:underline">
                      Ir para Edições →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
