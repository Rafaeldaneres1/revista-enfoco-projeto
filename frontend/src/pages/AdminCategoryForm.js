import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { resetCategoryCatalogCache } from '../components/CategoryLabel';

const HEX_COLOR_RE = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const buildSlug = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const AdminCategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const slugPreview = useMemo(() => buildSlug(formData.name), [formData.name]);
  const isValidHexColor = HEX_COLOR_RE.test(formData.color);
  const colorPreview = isValidHexColor ? formData.color.toUpperCase() : '#3B82F6';

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    if (!isEdit) {
      return;
    }

    const fetchCategory = async () => {
      try {
        const response = await axios.get(apiUrl('/api/categories'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const category = response.data.find((item) => item.id === id);
        if (category) {
          setFormData({
            name: category.name || '',
            color: category.color || '#3B82F6',
            active: category.active ?? true
          });
        }
      } catch (fetchError) {
        console.error('Error fetching category:', fetchError);
        setError('Não foi possível carregar a categoria.');
      }
    };

    fetchCategory();
  }, [token, navigate, id, isEdit]);

  const handleColorChange = (value) => {
    setFormData((current) => ({
      ...current,
      color: value.toUpperCase()
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isValidHexColor) {
      setError('Digite uma cor HEX válida, como #3B82F6.');
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/categories/${id}`), formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(apiUrl('/api/categories'), formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      resetCategoryCatalogCache();
      navigate('/admin/categories');
    } catch (saveError) {
      const message =
        saveError?.response?.data?.detail || 'Erro ao salvar categoria';
      setError(message);
      console.error('Error saving category:', saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10">
          <h1 className="font-display text-4xl font-bold mb-2">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h1>
          <p className="text-stone mb-8">Preencha os campos abaixo</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                placeholder="Ex.: Cultura"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Slug automático</label>
              <input
                type="text"
                value={slugPreview}
                readOnly
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-stone/10 text-stone focus:outline-none"
                placeholder="slug-gerado-automaticamente"
              />
            </div>

            <div className="grid md:grid-cols-[160px_1fr] gap-6 items-end">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Cor *</label>
                <input
                  type="color"
                  value={colorPreview}
                  onChange={(event) => handleColorChange(event.target.value)}
                  className="w-full h-14 rounded-2xl border border-charcoal/10 bg-white/50 cursor-pointer"
                />
              </div>

              <div className="rounded-[24px] border border-charcoal/10 bg-white/60 px-4 py-4">
                <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-center">
                  <span
                    className="w-6 h-6 rounded-full border border-black/5"
                    style={{ backgroundColor: colorPreview }}
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-charcoal">Prévia da cor</p>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(event) => handleColorChange(event.target.value)}
                      className={`w-full px-3 py-2 rounded-2xl border bg-white/80 focus:outline-none focus:ring-2 ${
                        isValidHexColor
                          ? 'border-charcoal/10 focus:ring-charcoal/20'
                          : 'border-red-200 focus:ring-red-200'
                      }`}
                      placeholder="#3B82F6"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <p className="text-xs text-stone">
                      Você pode escolher no seletor ou digitar o código HEX manualmente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(event) => setFormData({ ...formData, active: event.target.checked })}
                className="w-5 h-5 rounded border-charcoal/20"
              />
              <label htmlFor="active" className="text-sm text-charcoal">
                Categoria ativa
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoryForm;
