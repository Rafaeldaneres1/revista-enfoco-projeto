import React, { useState, useEffect } from 'react';

const AdminSEOPanel = ({ title = '', description = '', slug = '', onUpdate }) => {
  const [seoData, setSeoData] = useState({
    metaTitle: title || '',
    metaDescription: description || '',
    slug: slug || '',
    ogTitle: title || '',
    ogDescription: description || '',
    ogImage: '',
    focusKeyword: ''
  });

  const [seoScore, setSeoScore] = useState(0);

  useEffect(() => {
    calculateSEOScore();
  }, [seoData]);

  const calculateSEOScore = () => {
    let score = 0;
    
    // Meta Title (20 points)
    if (seoData.metaTitle.length > 0) score += 10;
    if (seoData.metaTitle.length >= 30 && seoData.metaTitle.length <= 60) score += 10;
    
    // Meta Description (20 points)
    if (seoData.metaDescription.length > 0) score += 10;
    if (seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160) score += 10;
    
    // Slug (15 points)
    if (seoData.slug.length > 0 && seoData.slug.match(/^[a-z0-9-]+$/)) score += 15;
    
    // Focus Keyword (20 points)
    if (seoData.focusKeyword.length > 0) score += 10;
    if (seoData.metaTitle.toLowerCase().includes(seoData.focusKeyword.toLowerCase())) score += 10;
    
    // OG Image (15 points)
    if (seoData.ogImage.length > 0) score += 15;
    
    // OG Title & Description (10 points)
    if (seoData.ogTitle.length > 0 && seoData.ogDescription.length > 0) score += 10;
    
    setSeoScore(Math.min(score, 100));
  };

  const handleChange = (field, value) => {
    setSeoData(prev => ({
      ...prev,
      [field]: value
    }));
    onUpdate && onUpdate({ ...seoData, [field]: value });
  };

  const generateSlug = () => {
    const slug = seoData.metaTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    handleChange('slug', slug);
  };

  const getSEOColor = () => {
    if (seoScore >= 80) return 'text-green-600';
    if (seoScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSEOBgColor = () => {
    if (seoScore >= 80) return 'bg-green-100';
    if (seoScore >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="enfoco-glass rounded-xl p-6 shadow-premium">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold text-charcoal">SEO & Metadados</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getSEOBgColor()}`}>
          <span className={`text-sm font-bold ${getSEOColor()}`}>{seoScore}</span>
          <span className={`text-xs font-semibold ${getSEOColor()}`}>
            {seoScore >= 80 ? 'Excelente' : seoScore >= 60 ? 'Bom' : 'Precisa melhorar'}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Meta Title */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Meta Title
            <span className={`text-xs ml-2 ${seoData.metaTitle.length >= 30 && seoData.metaTitle.length <= 60 ? 'text-green-600' : 'text-orange-600'}`}>
              ({seoData.metaTitle.length}/60)
            </span>
          </label>
          <input
            type="text"
            value={seoData.metaTitle}
            onChange={(e) => handleChange('metaTitle', e.target.value.slice(0, 60))}
            placeholder="Título para mecanismos de busca"
            className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
            maxLength="60"
          />
          <p className="text-xs text-stone mt-1">Ideal: 30-60 caracteres</p>
        </div>

        {/* Meta Description */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Meta Description
            <span className={`text-xs ml-2 ${seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160 ? 'text-green-600' : 'text-orange-600'}`}>
              ({seoData.metaDescription.length}/160)
            </span>
          </label>
          <textarea
            value={seoData.metaDescription}
            onChange={(e) => handleChange('metaDescription', e.target.value.slice(0, 160))}
            placeholder="Descrição para mecanismos de busca"
            rows="3"
            className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors resize-none"
            maxLength="160"
          />
          <p className="text-xs text-stone mt-1">Ideal: 120-160 caracteres</p>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">URL Slug</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={seoData.slug}
              onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="url-amigavel"
              className="flex-1 px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
            />
            <button
              onClick={generateSlug}
              className="px-4 py-2 rounded-lg bg-royal-blue text-white text-sm font-medium hover:bg-royal-blue/90 transition-colors"
            >
              Gerar
            </button>
          </div>
          <p className="text-xs text-stone mt-1">Apenas letras, números e hífens</p>
        </div>

        {/* Focus Keyword */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">Palavra-chave Principal</label>
          <input
            type="text"
            value={seoData.focusKeyword}
            onChange={(e) => handleChange('focusKeyword', e.target.value)}
            placeholder="Ex: revista de santa maria"
            className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
          />
          <p className="text-xs text-stone mt-1">Use esta palavra no título e descrição</p>
        </div>

        {/* Open Graph */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-charcoal mb-4 text-sm">Open Graph (Compartilhamento)</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">OG Title</label>
              <input
                type="text"
                value={seoData.ogTitle}
                onChange={(e) => handleChange('ogTitle', e.target.value)}
                placeholder="Título para compartilhamento"
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">OG Description</label>
              <textarea
                value={seoData.ogDescription}
                onChange={(e) => handleChange('ogDescription', e.target.value)}
                placeholder="Descrição para compartilhamento"
                rows="2"
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">OG Image URL</label>
              <input
                type="url"
                value={seoData.ogImage}
                onChange={(e) => handleChange('ogImage', e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs font-semibold text-charcoal mb-3">Preview no Google:</p>
        <div className="bg-white border border-gray-300 rounded-lg p-4 text-sm">
          <p className="text-blue-600 font-medium">{seoData.metaTitle || 'Seu título aqui'}</p>
          <p className="text-green-700 text-xs">https://revista-enfoco.com.br/{seoData.slug || 'seu-slug'}</p>
          <p className="text-gray-600 text-xs mt-2">{seoData.metaDescription || 'Sua descrição aparecerá aqui'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSEOPanel;
