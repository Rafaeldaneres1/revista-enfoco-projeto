import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiUrl } from '../lib/api';

const AdminColumns = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchColumns = async () => {
      try {
        const response = await axios.get(apiUrl('/api/columns'));
        setColumns(response.data);
      } catch (error) {
        console.error('Error fetching columns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, [token, navigate]);

  const handleDelete = async (columnId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta coluna?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/columns/${columnId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColumns((current) => current.filter((column) => column.id !== columnId));
    } catch (error) {
      console.error('Error deleting column:', error);
      alert('Erro ao deletar coluna');
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
              <h1 className="font-display text-4xl font-bold">Colunas</h1>
              <p className="text-stone mt-2">Gerenciar colunas e autores</p>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/dashboard" className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors">
                Voltar
              </Link>
              <Link to="/admin/columns/columnists" className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors">
                Colunistas
              </Link>
              <Link to="/admin/columns/new" className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors">
                Nova Coluna
              </Link>
            </div>
          </div>
        </div>

        {columns.length > 0 ? (
          <div className="space-y-4">
            {columns.map((column) => (
              <div key={column.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                        column.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {column.published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">{column.title}</h2>
                    <p className="text-stone text-sm mb-3">{column.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-stone">
                      <span>{column.author_name}</span>
                      <span>•</span>
                      <time>{format(new Date(column.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}</time>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/columns/edit/${column.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(column.id)}
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
            <p className="text-stone mb-4">Nenhuma coluna criada ainda.</p>
            <Link
              to="/admin/columns/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeira Coluna
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminColumns;
