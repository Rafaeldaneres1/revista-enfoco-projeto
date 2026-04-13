import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import SafeImage from '../components/SafeImage';

const AdminColumnists = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [columnists, setColumnists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchColumnists = async () => {
      try {
        const response = await axios.get(apiUrl('/api/columnists'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setColumnists(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching columnists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColumnists();
  }, [token, navigate]);

  const handleDelete = async (columnistId) => {
    if (!window.confirm('Tem certeza que deseja remover este colunista?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/columnists/${columnistId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColumnists((current) => current.filter((columnist) => columnist.id !== columnistId));
    } catch (error) {
      console.error('Error deleting columnist:', error);
      const detail = error?.response?.data?.detail;
      alert(detail || 'Erro ao deletar colunista');
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
              <h1 className="font-display text-4xl font-bold">Colunistas</h1>
              <p className="text-stone mt-2">
                Cadastre perfis reutilizáveis para usar nas colunas sem repetir nome, cargo, bio e foto.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/columns"
                className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
              >
                Voltar para Colunas
              </Link>
              <Link
                to="/admin/columns/columnists/new"
                className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors"
              >
                Novo Colunista
              </Link>
            </div>
          </div>
        </div>

        {columnists.length > 0 ? (
          <div className="space-y-4">
            {columnists.map((columnist) => (
              <div key={columnist.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {columnist.image ? (
                      <SafeImage
                        src={columnist.image}
                        alt={columnist.name}
                        className="w-16 h-16 rounded-full object-cover object-top shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                        {columnist.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="font-display text-2xl font-bold mb-2">{columnist.name}</h2>
                      <p className="text-charcoal/70 text-sm font-medium mb-3">{columnist.role}</p>
                      <p className="text-stone text-sm line-clamp-2">{columnist.bio}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/admin/columns/columnists/edit/${columnist.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(columnist.id)}
                      className="px-4 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="enfoco-glass rounded-[42px] p-10 text-center">
            <p className="text-stone mb-4">Nenhum colunista cadastrado ainda.</p>
            <Link
              to="/admin/columns/columnists/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeiro Colunista
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminColumnists;
