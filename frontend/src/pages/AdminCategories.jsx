import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { resetCategoryCatalogCache } from '../components/CategoryLabel';

const AdminCategories = () => {
  const navigate = useNavigate();
  const token = 'cookie-session';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await axios.get(apiUrl('/api/categories'), {
          headers: {  }
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token, navigate]);

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/categories/${categoryId}`), {
        headers: {  }
      });
      resetCategoryCatalogCache();
      setCategories((current) => current.filter((category) => category.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error?.response?.data?.detail || 'Erro ao excluir categoria');
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold">Categorias</h1>
              <p className="text-stone mt-2">Gerenciar editorias, cores e status de publicação</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
              >
                Voltar
              </Link>
              <Link
                to="/admin/categories/new"
                className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors"
              >
                Nova Categoria
              </Link>
            </div>
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-charcoal/10 bg-white/70 text-charcoal"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/5"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.color}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                          category.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl font-bold mb-2">{category.name}</h2>
                    <p className="text-stone text-sm">Slug: {category.slug}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/admin/categories/edit/${category.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id)}
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
            <p className="text-stone mb-4">Nenhuma categoria criada ainda.</p>
            <Link
              to="/admin/categories/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeira Categoria
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;


