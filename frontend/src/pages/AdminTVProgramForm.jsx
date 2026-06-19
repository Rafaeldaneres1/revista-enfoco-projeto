import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import AdminImageField from '../components/AdminImageField';

const isLikelyYoutubeUrl = (value) => {
  try {
    const url = new URL(value);
    return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'].includes(url.hostname);
  } catch (error) {
    return false;
  }
};

const AdminTVProgramForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = 'cookie-session';

  const [formData, setFormData] = useState({
    title: '',
    youtube_url: '',
    thumbnail_url: '',
    active: true,
    display_order: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    if (!isEdit) {
      return;
    }

    const fetchProgram = async () => {
      try {
        const response = await axios.get(apiUrl(`/api/admin/tv-programs/${id}`), {
          headers: {}
        });
        const program = response.data || {};
        setFormData({
          title: program.title || '',
          youtube_url: program.youtube_url || '',
          thumbnail_url: program.thumbnail_url || '',
          active: program.active ?? true,
          display_order: Number(program.display_order || 0)
        });
      } catch (fetchError) {
        console.error('Error fetching TV program:', fetchError);
        setError('Não foi possível carregar o programa.');
      }
    };

    fetchProgram();
  }, [token, navigate, id, isEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Informe o título do programa.');
      return;
    }

    if (!formData.youtube_url.trim() || !isLikelyYoutubeUrl(formData.youtube_url.trim())) {
      setError('Informe um link válido do YouTube.');
      return;
    }

    setLoading(true);

    const payload = {
      title: formData.title.trim(),
      youtube_url: formData.youtube_url.trim(),
      thumbnail_url: formData.thumbnail_url.trim() || null,
      active: Boolean(formData.active),
      display_order: Number(formData.display_order || 0)
    };

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/admin/tv-programs/${id}`), payload, {
          headers: {}
        });
      } else {
        await axios.post(apiUrl('/api/admin/tv-programs'), payload, {
          headers: {}
        });
      }
      navigate('/admin/tv-programs');
    } catch (saveError) {
      const message = saveError?.response?.data?.detail || 'Erro ao salvar programa';
      setError(message);
      console.error('Error saving TV program:', saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold mb-2">
                {isEdit ? 'Editar Programa' : 'Novo Programa'}
              </h1>
              <p className="text-stone">
                Cadastre um link do YouTube para exibir na aba Programas de TV.
              </p>
            </div>
            <Link
              to="/admin/tv-programs"
              className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
            >
              Voltar
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                placeholder="Ex.: Entrevista com..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Link do YouTube *</label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(event) => setFormData({ ...formData, youtube_url: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-stone mt-2">
                O card abrirá este link diretamente no YouTube em uma nova aba.
              </p>
            </div>

            <AdminImageField
              label="Imagem/thumbnail opcional"
              value={formData.thumbnail_url}
              onChange={(value) => setFormData({ ...formData, thumbnail_url: value })}
              token={token}
              placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
              helperText="Se não enviar uma imagem, o site tenta usar a miniatura automática do YouTube."
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Ordem de exibição</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(event) => setFormData({ ...formData, display_order: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-3 pt-8">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(event) => setFormData({ ...formData, active: event.target.checked })}
                  className="w-5 h-5 rounded border-charcoal/20"
                />
                <label htmlFor="active" className="text-sm text-charcoal">
                  Programa ativo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                to="/admin/tv-programs"
                className="px-6 py-3 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white text-sm font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Programa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminTVProgramForm;
