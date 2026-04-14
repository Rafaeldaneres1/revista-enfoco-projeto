import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiUrl } from '../lib/api';
import CategoryLabel from '../components/CategoryLabel';

const safeText = (value = '') => String(value || '').toLowerCase();

const AdminPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const token = 'cookie-session';

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    fetchPosts();
  }, [token, navigate]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(apiUrl('/api/posts'));
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setNotification({ type: 'error', message: 'Erro ao carregar notícias.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(apiUrl(`/api/posts/${postId}`), {
        headers: {  }
      });
      setNotification({ type: 'success', message: 'Notícia deletada com sucesso.' });
      setDeleteConfirm(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      setNotification({ type: 'error', message: 'Erro ao deletar notícia.' });
    }
  };

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        const matchesSearch =
          safeText(post.title).includes(safeText(searchTerm)) ||
          safeText(post.excerpt).includes(safeText(searchTerm)) ||
          safeText(post.author_name).includes(safeText(searchTerm));

        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'published' && post.published) ||
          (filterStatus === 'draft' && !post.published);

        return matchesSearch && matchesStatus;
      }),
    [posts, searchTerm, filterStatus]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-porcelain via-white to-porcelain">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal font-display text-lg">Carregando notícias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-porcelain via-white to-porcelain pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="enfoco-glass rounded-2xl p-8 md:p-12 mb-10 shadow-premium">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Notícias</h1>
              <p className="text-stone text-lg font-light">
                Gerenciar notícias e matérias ({filteredPosts.length})
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-charcoal/20 text-charcoal text-sm font-medium hover:bg-charcoal/5 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Link>
              <Link
                to="/admin/posts/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-royal-blue to-royal-blue/90 text-white text-sm font-medium hover:shadow-premium transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nova Notícia
              </Link>
            </div>
          </div>
        </div>

        {notification && (
          <div
            className={`mb-6 rounded-lg p-4 animate-slide-down flex items-start gap-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <span className="text-lg mt-0.5">{notification.type === 'success' ? '✓' : '✕'}</span>
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-lg hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          </div>
        )}

        <div className="enfoco-glass rounded-xl p-6 mb-8 shadow-premium">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Buscar por título, resumo ou autor..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              >
                <option value="all">Todos</option>
                <option value="published">Publicados</option>
                <option value="draft">Rascunhos</option>
              </select>
            </div>
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className="enfoco-glass rounded-xl p-6 hover:shadow-premium transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <CategoryLabel
                        category={post.category}
                        categoryId={post.category_id}
                        categorySlug={post.category_slug}
                        variant="pill"
                        className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium"
                      />
                      {post.destaque_principal_home && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                          Destaque principal
                        </span>
                      )}
                      {!post.destaque_principal_home && post.destaque_secundario_home && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          Destaque secundario #{Number(post.ordem_destaque || 0)}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          post.published
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {post.published ? '✓ Publicado' : '◯ Rascunho'}
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-charcoal mb-2 line-clamp-2">
                      {post.title || 'Sem título'}
                    </h2>
                    <p className="text-stone text-sm mb-3 line-clamp-2">
                      {post.excerpt || 'Sem resumo informado.'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-stone/70">
                      <span className="font-medium text-charcoal/80">
                        {post.author_name || 'Redação Enfoco'}
                      </span>
                      <span>•</span>
                      <time>
                        {post.created_at
                          ? format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })
                          : 'Data não informada'}
                      </time>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to={`/admin/posts/edit/${post.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-charcoal/20 text-charcoal text-sm font-medium hover:bg-charcoal/5 transition-all duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all duration-300 border border-red-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Deletar
                    </button>
                  </div>
                </div>

                {deleteConfirm === post.id && (
                  <div className="mt-4 pt-4 border-t border-charcoal/10 animate-slide-down">
                    <p className="text-sm text-charcoal mb-3">
                      Tem certeza que deseja deletar esta notícia?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all duration-300"
                      >
                        Confirmar exclusão
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-4 py-2 rounded-lg border border-charcoal/20 text-charcoal text-sm font-medium hover:bg-charcoal/5 transition-all duration-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="enfoco-glass rounded-xl p-12 text-center shadow-premium">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-charcoal/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-stone mb-6 font-light">Nenhuma notícia encontrada.</p>
            <Link
              to="/admin/posts/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-royal-blue to-royal-blue/90 text-white font-semibold hover:shadow-premium transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar primeira notícia
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPosts;


