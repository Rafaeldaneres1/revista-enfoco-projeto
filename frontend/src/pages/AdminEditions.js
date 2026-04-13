import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';

const AdminEditions = () => {
  const navigate = useNavigate();
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchEditions = async () => {
      try {
        const response = await axios.get(apiUrl('/api/editions'));
        setEditions(response.data);
      } catch (error) {
        console.error('Error fetching editions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEditions();
  }, [token, navigate]);

  const handleDelete = async (editionId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta edição?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/editions/${editionId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditions((current) => current.filter((item) => item.id !== editionId));
    } catch (error) {
      console.error('Error deleting edition:', error);
      alert('Erro ao deletar edição');
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold">Edições</h1>
              <p className="text-stone mt-2">Gerenciar capas, descrições e PDFs</p>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/dashboard" className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors">
                Voltar
              </Link>
              <Link to="/admin/editions/new" className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors">
                Nova Edição
              </Link>
            </div>
          </div>
        </div>

        {editions.length > 0 ? (
          <div className="space-y-4">
            {editions.map((edition) => (
              <div key={edition.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full border border-charcoal/8 bg-white/86 text-xs text-charcoal-light">
                        Edição #{edition.edition_number}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                        edition.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {edition.published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">{edition.title}</h2>
                    <p className="text-stone text-sm mb-3">{edition.description}</p>
                    <div className="flex items-center gap-3 text-xs text-stone flex-wrap">
                      {edition.pdf_url && <span>PDF configurado</span>}
                      {edition.cover_image && (
                        <>
                          <span>•</span>
                          <span>Capa configurada</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/editions/edit/${edition.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(edition.id)}
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
            <p className="text-stone mb-4">Nenhuma edição criada ainda.</p>
            <Link
              to="/admin/editions/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeira Edição
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEditions;
