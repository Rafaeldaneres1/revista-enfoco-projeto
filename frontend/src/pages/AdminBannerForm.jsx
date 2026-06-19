import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { BANNER_POSITIONS } from '../lib/bannerPositions';
import AdminImageField from '../components/AdminImageField';

const AdminBannerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = 'cookie-session';

  const [formData, setFormData] = useState({
    title: '',
    image: '',
    mobile_image: '',
    link_url: '',
    active: true,
    display_order: 0,
    positions: []
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

    const fetchBanner = async () => {
      try {
        const response = await axios.get(apiUrl(`/api/admin/banners/${id}`), {
          headers: {}
        });
        const banner = response.data || {};
        setFormData({
          title: banner.title || '',
          image: banner.image || '',
          mobile_image: banner.mobile_image || '',
          link_url: banner.link_url || '',
          active: banner.active ?? true,
          display_order: Number(banner.display_order || 0),
          positions: Array.isArray(banner.positions) ? banner.positions : []
        });
      } catch (fetchError) {
        console.error('Error fetching banner:', fetchError);
        setError('Não foi possível carregar o banner.');
      }
    };

    fetchBanner();
  }, [token, navigate, id, isEdit]);

  const togglePosition = (position) => {
    setFormData((current) => {
      const exists = current.positions.includes(position);
      return {
        ...current,
        positions: exists
          ? current.positions.filter((item) => item !== position)
          : [...current.positions, position]
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Informe um título interno para o banner.');
      return;
    }

    if (!formData.image.trim()) {
      setError('Envie ou cole a imagem do banner.');
      return;
    }

    if (!formData.positions.length) {
      setError('Escolha pelo menos uma posição para exibir o banner.');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      title: formData.title.trim(),
      image: formData.image.trim(),
      mobile_image: formData.mobile_image.trim() || null,
      link_url: formData.link_url.trim() || null,
      display_order: Number(formData.display_order || 0)
    };

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/admin/banners/${id}`), payload, {
          headers: {}
        });
      } else {
        await axios.post(apiUrl('/api/admin/banners'), payload, {
          headers: {}
        });
      }
      navigate('/admin/banners');
    } catch (saveError) {
      const message = saveError?.response?.data?.detail || 'Erro ao salvar banner';
      setError(message);
      console.error('Error saving banner:', saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10">
          <h1 className="font-display text-4xl font-bold mb-2">
            {isEdit ? 'Editar Banner' : 'Novo Banner'}
          </h1>
          <p className="text-stone mb-8">
            Cadastre peças publicitárias para pontos editoriais do site. Formato recomendado:
            1200x250 ou 1400x300.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Título interno *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                placeholder="Ex.: Campanha Revista Enfoco Maio"
                required
              />
            </div>

            <AdminImageField
              label="Imagem do banner *"
              value={formData.image}
              onChange={(value) => setFormData({ ...formData, image: value })}
              token={token}
              placeholder="/uploads/banner-publicidade.jpg"
              helperText="Use uma peça horizontal larga para desktop, como 1200x250 ou 1400x300."
            />

            <AdminImageField
              label="Imagem mobile opcional"
              value={formData.mobile_image}
              onChange={(value) => setFormData({ ...formData, mobile_image: value })}
              token={token}
              placeholder="/uploads/banner-publicidade-mobile.jpg"
              helperText="Use uma peça própria para celular, como 1080x1080 ou 1080x1350, com texto grande e legível."
            />

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Link de destino opcional</label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(event) => setFormData({ ...formData, link_url: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                placeholder="https://exemplo.com.br"
              />
            </div>

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
                  Banner ativo
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">Posições onde aparece *</label>
              <div className="grid gap-3">
                {BANNER_POSITIONS.map((position) => {
                  const checked = formData.positions.includes(position.value);
                  return (
                    <label
                      key={position.value}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ${
                        checked
                          ? 'border-royal-blue bg-royal-blue/5'
                          : 'border-charcoal/10 bg-white/45 hover:bg-white/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePosition(position.value)}
                        className="w-5 h-5 rounded border-charcoal/20"
                      />
                      <span className="text-sm text-charcoal">{position.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/banners')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Banner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerForm;
