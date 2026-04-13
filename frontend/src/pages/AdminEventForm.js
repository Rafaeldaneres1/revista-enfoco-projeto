import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import AdminImageGalleryField from '../components/AdminImageGalleryField';

const formatDateTimeLocal = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const AdminEventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    event_images: [],
    published: true
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

    const fetchEvent = async () => {
      try {
        const response = await axios.get(apiUrl('/api/events'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const event = response.data.find((item) => item.id === id);
        if (event) {
          setFormData({
            title: event.title,
            description: event.description,
            event_date: formatDateTimeLocal(event.event_date),
            location: event.location || '',
            event_images: Array.isArray(event.event_images) ? event.event_images : [],
            published: event.published
          });
        }
      } catch (fetchError) {
        console.error('Error fetching event:', fetchError);
      }
    };

    fetchEvent();
  }, [token, navigate, id, isEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      ...formData,
      event_date: new Date(formData.event_date).toISOString()
    };

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/events/${id}`), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(apiUrl('/api/events'), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin/events');
    } catch (saveError) {
      setError('Erro ao salvar evento');
      console.error('Error saving event:', saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10">
          <h1 className="font-display text-4xl font-bold mb-2">
            {isEdit ? 'Editar Evento' : 'Novo Evento'}
          </h1>
          <p className="text-stone mb-8">Preencha os campos abaixo</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Descrição *</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[180px]"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Data e Hora *</label>
                <input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(event) => setFormData({ ...formData, event_date: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Local</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>
            </div>

            <AdminImageGalleryField
              label="Fotos do evento"
              values={formData.event_images}
              onChange={(nextImages) => setFormData({ ...formData, event_images: nextImages })}
              token={token}
              emptyLabel="Nenhuma foto adicionada ainda. Use esse bloco para montar a galeria do evento."
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(event) => setFormData({ ...formData, published: event.target.checked })}
                className="w-5 h-5 rounded border-charcoal/20"
              />
              <label htmlFor="published" className="text-sm text-charcoal">
                Publicar imediatamente
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/events')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEventForm;
