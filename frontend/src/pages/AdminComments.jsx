import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';

const statusOptions = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'all', label: 'Todos' },
];

const statusLabel = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const statusClass = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const typeLabel = {
  post: 'Reportagem',
  column: 'Coluna',
};

const publicPathForComment = (comment) => {
  if (comment.content_type === 'column') {
    return `/colunas/${comment.content_slug}`;
  }
  return `/noticias/${comment.content_slug}`;
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (typeFilter !== 'all') params.set('content_type', typeFilter);
    params.set('limit', '200');
    return params.toString();
  }, [statusFilter, typeFilter]);

  const loadComments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(apiUrl(`/api/admin/comments?${query}`), { headers: {} });
      setComments(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setComments([]);
      setError(requestError?.response?.data?.detail || 'Não foi possível carregar os comentários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateStatus = async (commentId, status) => {
    setActionId(commentId);
    setError('');
    try {
      const response = await axios.patch(
        apiUrl(`/api/admin/comments/${commentId}/status`),
        { status },
        { headers: {} }
      );
      const updated = response.data;
      setComments((current) => {
        if (statusFilter !== 'all' && updated.status !== statusFilter) {
          return current.filter((comment) => comment.id !== commentId);
        }
        return current.map((comment) => (comment.id === commentId ? updated : comment));
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Não foi possível atualizar o comentário.');
    } finally {
      setActionId('');
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;

    setActionId(commentId);
    setError('');
    try {
      await axios.delete(apiUrl(`/api/admin/comments/${commentId}`), { headers: {} });
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Não foi possível excluir o comentário.');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl font-bold">Comentários</h1>
              <p className="text-stone mt-2">
                Aprove, rejeite ou exclua comentários enviados por leitores.
              </p>
            </div>
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
            >
              Voltar
            </Link>
          </div>
        </div>

        <div className="enfoco-glass rounded-[28px] p-4 md:p-5 mb-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    statusFilter === option.value
                      ? 'bg-charcoal text-white border-charcoal'
                      : 'bg-white/70 text-charcoal border-charcoal/12 hover:bg-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="px-4 py-2 rounded-full border border-charcoal/12 bg-white/80 text-sm outline-none"
            >
              <option value="all">Todos os conteúdos</option>
              <option value="post">Reportagens</option>
              <option value="column">Colunas</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-charcoal font-display text-xl">Carregando...</div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <article key={comment.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="grid lg:grid-cols-[1fr_auto] gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${statusClass[comment.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabel[comment.status] || comment.status}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white/70 border border-charcoal/10 text-charcoal">
                        {typeLabel[comment.content_type] || comment.content_type}
                      </span>
                      <span className="text-xs text-stone">{formatDate(comment.created_at)}</span>
                    </div>

                    <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                      {comment.author_name}
                    </h2>
                    <p className="text-sm text-stone mb-4 break-all">{comment.author_email}</p>

                    <p className="text-charcoal leading-relaxed whitespace-pre-line mb-5">
                      {comment.body}
                    </p>

                    <div className="text-sm text-stone">
                      Em:{' '}
                      <Link
                        to={publicPathForComment(comment)}
                        className="text-royal-blue hover:underline"
                      >
                        {comment.content_title || comment.content_slug}
                      </Link>
                    </div>
                  </div>

                  <div className="flex gap-2 lg:flex-col lg:min-w-[140px]">
                    {comment.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={actionId === comment.id}
                        onClick={() => updateStatus(comment.id, 'approved')}
                        className="px-4 py-2 rounded-full bg-green-600 text-white text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
                      >
                        Aprovar
                      </button>
                    )}
                    {comment.status !== 'rejected' && (
                      <button
                        type="button"
                        disabled={actionId === comment.id}
                        onClick={() => updateStatus(comment.id, 'rejected')}
                        className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors disabled:opacity-60"
                      >
                        Rejeitar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionId === comment.id}
                      onClick={() => deleteComment(comment.id)}
                      className="px-4 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="enfoco-glass rounded-[42px] p-10 text-center">
            <p className="text-stone">Nenhum comentario encontrado para este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComments;
