import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';

const emptyForm = {
  author_name: '',
  author_email: '',
  body: '',
  website: '',
  privacy_consent: false
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

const CommentSection = ({ contentType, contentSlug, className = '' }) => {
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canFetch = HAS_BACKEND && contentType && contentSlug;

  useEffect(() => {
    let isMounted = true;

    const fetchComments = async () => {
      if (!canFetch) {
        setComments([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          apiUrl(`/api/comments?content_type=${encodeURIComponent(contentType)}&content_slug=${encodeURIComponent(contentSlug)}`)
        );
        if (isMounted) {
          setComments(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (isMounted) {
          setComments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [canFetch, contentSlug, contentType]);

  const title = useMemo(() => {
    if (comments.length === 1) return '1 comentário';
    return `${comments.length} comentários`;
  }, [comments.length]);

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }));
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!form.author_name.trim() || !form.author_email.trim() || !form.body.trim()) {
      setError('Preencha nome, e-mail e comentário.');
      return;
    }

    if (!form.privacy_consent) {
      setError('Você precisa aceitar o armazenamento dos dados para moderação do comentário.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(apiUrl('/api/comments'), {
        content_type: contentType,
        content_slug: contentSlug,
        ...form
      });
      setForm(emptyForm);
      setMessage('Comentário enviado para aprovação.');
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'Não foi possível enviar o comentário agora.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!HAS_BACKEND) {
    return null;
  }

  return (
    <section className={`border-t border-gray-200 pt-10 ${className}`}>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-royal-blue font-semibold mb-3">
            Comentários
          </p>
          <h2 className="font-display text-3xl font-bold text-charcoal">{title}</h2>
        </div>
      </div>

      <div className="space-y-5 mb-10">
        {loading ? (
          <p className="text-sm text-stone">Carregando comentários...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.id} className="border border-gray-100 bg-porcelain/50 p-5">
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h3 className="font-semibold text-charcoal">{comment.author_name}</h3>
                <time className="text-xs text-stone whitespace-nowrap">{formatDate(comment.created_at)}</time>
              </div>
              <p className="text-stone leading-relaxed whitespace-pre-line">{comment.body}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-stone">Seja o primeiro a comentar.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-5 md:p-6 shadow-sm">
        <h3 className="font-display text-2xl font-bold text-charcoal mb-2">Deixe seu comentário</h3>
        <p className="text-sm text-stone mb-6">
          Seu comentário será enviado para aprovação. O e-mail não aparece publicamente.
        </p>

        <input
          type="text"
          name="website"
          value={form.website}
          onChange={updateField('website')}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Nome *</span>
            <input
              type="text"
              value={form.author_name}
              onChange={updateField('author_name')}
              maxLength={80}
              className="mt-2 w-full rounded-none border border-gray-200 px-4 py-3 text-sm outline-none focus:border-charcoal"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-charcoal">E-mail *</span>
            <input
              type="email"
              value={form.author_email}
              onChange={updateField('author_email')}
              className="mt-2 w-full rounded-none border border-gray-200 px-4 py-3 text-sm outline-none focus:border-charcoal"
              required
            />
          </label>
        </div>

        <label className="block mb-4">
          <span className="text-sm font-medium text-charcoal">Comentário *</span>
          <textarea
            value={form.body}
            onChange={updateField('body')}
            maxLength={1200}
            rows={5}
            className="mt-2 w-full rounded-none border border-gray-200 px-4 py-3 text-sm outline-none focus:border-charcoal resize-y"
            required
          />
        </label>

        <label className="mb-4 flex items-start gap-3 border border-gray-200 bg-porcelain/50 p-4 text-sm text-stone">
          <input
            type="checkbox"
            checked={form.privacy_consent}
            onChange={updateField('privacy_consent')}
            className="mt-1 h-4 w-4 accent-charcoal"
            required
          />
          <span>
            Aceito que a Revista Enfoco armazene meu nome, e-mail e comentário para moderação,
            conforme a Política de Privacidade.
          </span>
        </label>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-xs text-stone">{form.body.length}/1200</span>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-charcoal text-white text-sm font-semibold uppercase tracking-[0.12em] hover:bg-charcoal-light transition-colors disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Enviar comentário'}
          </button>
        </div>

        {message && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 px-4 py-3">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3">{error}</p>
        )}
      </form>
    </section>
  );
};

export default CommentSection;
