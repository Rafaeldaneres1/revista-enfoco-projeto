import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import SafeImage from '../components/SafeImage';

const getProgramImage = (program) => {
  if (program?.thumbnail_url) {
    return program.thumbnail_url;
  }

  if (program?.youtube_video_id) {
    return `https://img.youtube.com/vi/${program.youtube_video_id}/hqdefault.jpg`;
  }

  return '';
};

const AdminTVPrograms = () => {
  const navigate = useNavigate();
  const token = 'cookie-session';
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchPrograms = async () => {
      try {
        const response = await axios.get(apiUrl('/api/admin/tv-programs'), {
          headers: {}
        });
        setPrograms(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching TV programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [token, navigate]);

  const handleDelete = async (programId) => {
    if (!window.confirm('Tem certeza que deseja excluir este programa?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/admin/tv-programs/${programId}`), {
        headers: {}
      });
      setPrograms((current) => current.filter((program) => program.id !== programId));
    } catch (error) {
      console.error('Error deleting TV program:', error);
      alert(error?.response?.data?.detail || 'Erro ao excluir programa');
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
              <h1 className="font-display text-4xl font-bold">Programas de TV</h1>
              <p className="text-stone mt-2">
                Cadastre links do YouTube para aparecerem na nova aba pública do site.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
              >
                Voltar
              </Link>
              <Link
                to="/admin/tv-programs/new"
                className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors"
              >
                Novo Programa
              </Link>
            </div>
          </div>
        </div>

        {programs.length > 0 ? (
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="grid lg:grid-cols-[260px_1fr_auto] gap-6 items-start">
                  <div className="rounded-[20px] border border-charcoal/10 bg-white/70 p-3">
                    <SafeImage
                      src={getProgramImage(program)}
                      alt={program.title}
                      className="w-full aspect-video object-cover rounded-[14px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                          program.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {program.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white/70 border border-charcoal/10 text-charcoal">
                        Ordem {program.display_order ?? 0}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl font-bold">{program.title}</h2>
                    <p className="text-sm text-stone break-all">YouTube: {program.youtube_url}</p>
                  </div>

                  <div className="flex gap-2 lg:flex-col">
                    <Link
                      to={`/admin/tv-programs/edit/${program.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors text-center"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(program.id)}
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
            <p className="text-stone mb-4">Nenhum programa cadastrado ainda.</p>
            <Link
              to="/admin/tv-programs/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeiro Programa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTVPrograms;
