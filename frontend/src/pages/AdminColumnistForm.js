import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import AdminImageField from '../components/AdminImageField';

const AdminColumnistForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    image: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    if (!isEdit) {
      setInitialLoading(false);
      return;
    }

    const fetchColumnist = async () => {
      try {
        const response = await axios.get(apiUrl(`/api/columnists/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const columnist = response.data;
        setFormData({
          name: columnist.name || '',
          role: columnist.role || '',
          image: columnist.image || '',
          bio: columnist.bio || ''
        });
      } catch (fetchError) {
        console.error('Error fetching columnist:', fetchError);
        setError('Nao foi possivel carregar este colunista.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchColumnist();
  }, [token, navigate, id, isEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/columnists/${id}`), formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(apiUrl('/api/columnists'), formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin/columns/columnists');
    } catch (saveError) {
      console.error('Error saving columnist:', saveError);
      setError('Erro ao salvar colunista');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-charcoal font-display text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10">
          <h1 className="font-display text-4xl font-bold mb-2">
            {isEdit ? 'Editar Colunista' : 'Novo Colunista'}
          </h1>
          <p className="text-stone mb-8">Cadastre nome, assinatura, foto e bio para reutilizar nas colunas.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Cargo / assinatura *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  placeholder="Ex.: Advogado criminalista em Santa Maria"
                  required
                />
              </div>
            </div>

            <AdminImageField
              label="Foto"
              value={formData.image}
              onChange={(nextValue) => setFormData({ ...formData, image: nextValue })}
              token={token}
              placeholder="/media/volmar-zanini.jpg"
            />

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Bio *</label>
              <textarea
                value={formData.bio}
                onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[140px]"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/columns/columnists')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Criar Colunista'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminColumnistForm;
