import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { fallbackColumns } from '../data/initialContent';
import SafeImage from '../components/SafeImage';

const normalizeText = (value = '') =>
  String(value)
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã ', 'à')
    .replaceAll('Ã¢', 'â')
    .replaceAll('Ã£', 'ã')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ãª', 'ê')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ã´', 'ô')
    .replaceAll('Ãµ', 'õ')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã§', 'ç');

const ColumnsPage = () => {
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const fetchColumns = async () => {
      if (!HAS_BACKEND) {
        setColumns(fallbackColumns);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl('/api/columns?published=true'));
        setColumns(Array.isArray(response.data) && response.data.length ? response.data : fallbackColumns);
      } catch (error) {
        console.error('Error fetching columns:', error);
        setColumns(fallbackColumns);
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 py-20 bg-porcelain">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-xs font-sans tracking-[0.25em] uppercase text-stone mb-4 font-semibold">
            Vozes Autorais
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-charcoal mb-6 leading-tight">
            Colunas de
            <br />
            <em className="font-serif italic font-normal">Opinião</em>
          </h1>
          <p className="text-base lg:text-lg text-stone max-w-2xl leading-relaxed">
            Espaço para articulistas e especialistas que ajudam a ampliar o debate público com
            leitura técnica e autoral.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {columns.length === 0 ? (
          <div className="text-center py-24 border border-gray-200">
            <p className="text-stone text-lg">Nenhuma coluna publicada no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-16">
            {columns.map((column) => (
              <Link key={column.id} to={`/colunas/${column.slug}`} className="group">
                {column.featured_image && (
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100 mb-6 shadow-md">
                    <SafeImage
                      src={column.featured_image}
                      alt={normalizeText(column.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={column.image_position ? { objectPosition: column.image_position } : undefined}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  {column.author_image ? (
                    <SafeImage
                      src={column.author_image}
                      alt={normalizeText(column.author_name)}
                      className="w-12 h-12 rounded-full object-cover object-top shadow-md ring-2 ring-white"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-royal-blue rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                      {normalizeText(column.author_name).charAt(0)}
                    </div>
                  )}
                  <div className="text-sm">
                    <div className="font-semibold text-charcoal">
                      {normalizeText(column.author_name)}
                    </div>
                    <div className="text-stone text-xs">
                      {normalizeText(column.author_role || 'Colunista')}
                    </div>
                  </div>
                </div>

                <h2 className="font-display text-2xl lg:text-3xl xl:text-4xl font-bold text-charcoal mb-4 leading-tight group-hover:text-royal-blue transition-colors duration-200">
                  {normalizeText(column.title)}
                </h2>

                <p className="text-base text-stone leading-relaxed mb-5 line-clamp-3">
                  {normalizeText(column.excerpt)}
                </p>

                <div className="flex items-center text-sm text-stone">
                  <span>
                    {new Date(column.created_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColumnsPage;
