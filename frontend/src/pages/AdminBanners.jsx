import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { getBannerPositionLabel } from '../lib/bannerPositions';
import SafeImage from '../components/SafeImage';

const AdminBanners = () => {
  const navigate = useNavigate();
  const token = 'cookie-session';
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchBanners = async () => {
      try {
        const response = await axios.get(apiUrl('/api/admin/banners'), {
          headers: {}
        });
        setBanners(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [token, navigate]);

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Tem certeza que deseja excluir este banner?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/admin/banners/${bannerId}`), {
        headers: {}
      });
      setBanners((current) => current.filter((banner) => banner.id !== bannerId));
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert(error?.response?.data?.detail || 'Erro ao excluir banner');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-charcoal font-display text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl font-bold">Banners / Publicidade</h1>
              <p className="text-stone mt-2">Gerencie peças publicitárias exibidas em pontos editoriais do site.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
              >
                Voltar
              </Link>
              <Link
                to="/admin/banners/new"
                className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors"
              >
                Novo Banner
              </Link>
            </div>
          </div>
        </div>

        {banners.length > 0 ? (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="grid lg:grid-cols-[260px_1fr_auto] gap-6 items-start">
                  <div className="rounded-[20px] border border-charcoal/10 bg-white/70 p-3">
                    <SafeImage
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-28 object-contain rounded-[14px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                          banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {banner.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white/70 border border-charcoal/10 text-charcoal">
                        Ordem {banner.display_order ?? 0}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl font-bold">{banner.title}</h2>
                    {banner.link_url ? (
                      <p className="text-sm text-stone break-all">Link: {banner.link_url}</p>
                    ) : (
                      <p className="text-sm text-stone">Sem link de destino.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(banner.positions || []).map((position) => (
                        <span
                          key={position}
                          className="px-3 py-1 rounded-full bg-royal-blue/10 text-royal-blue text-xs font-semibold"
                        >
                          {getBannerPositionLabel(position)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 lg:flex-col">
                    <Link
                      to={`/admin/banners/edit/${banner.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors text-center"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="px-4 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="enfoco-glass rounded-[42px] p-10 text-center">
            <p className="text-stone mb-4">Nenhum banner cadastrado ainda.</p>
            <Link
              to="/admin/banners/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeiro Banner
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;
