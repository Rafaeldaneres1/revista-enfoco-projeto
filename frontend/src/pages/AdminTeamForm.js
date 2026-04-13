import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import AdminImageField from '../components/AdminImageField';

const AdminTeamForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    image: '',
    bio: '',
    display_order: 0,
    published: true
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

    const fetchTeamMember = async () => {
      try {
        const response = await axios.get(apiUrl(`/api/team/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const member = response.data;
        setFormData({
          name: member.name || '',
          role: member.role || '',
          image: member.image || '',
          bio: member.bio || '',
          display_order: member.display_order ?? 0,
          published: member.published
        });
      } catch (fetchError) {
        console.error('Error fetching team member:', fetchError);
        setError('Não foi possível carregar este perfil da equipe.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTeamMember();
  }, [token, navigate, id, isEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      ...formData,
      display_order: Number(formData.display_order || 0)
    };

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/team/${id}`), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(apiUrl('/api/team'), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin/team');
    } catch (saveError) {
      console.error('Error saving team member:', saveError);
      setError('Erro ao salvar perfil da equipe');
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
            {isEdit ? 'Editar Perfil da Equipe' : 'Novo Perfil da Equipe'}
          </h1>
          <p className="text-stone mb-8">Preencha nome, cargo, foto, bio e ordem de exibição.</p>

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
                <label className="block text-sm font-medium text-charcoal mb-2">Cargo *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <AdminImageField
                  label="Foto"
                  value={formData.image}
                  onChange={(nextValue) => setFormData({ ...formData, image: nextValue })}
                  token={token}
                  placeholder="/media/mariana-rodrigues.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Ordem de exibição</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(event) => setFormData({ ...formData, display_order: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Bio *</label>
              <textarea
                value={formData.bio}
                onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[140px]"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(event) => setFormData({ ...formData, published: event.target.checked })}
                className="w-5 h-5 rounded border-charcoal/20"
              />
              <label htmlFor="published" className="text-sm text-charcoal">
                Exibir no site
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/team')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminTeamForm;
