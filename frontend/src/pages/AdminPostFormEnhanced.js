import React, { useState } from 'react';
import ScrollReveal from '../components/ScrollReveal';

const AdminPostFormEnhanced = ({ post = {}, onSave = () => {} }) => {
  const [formData, setFormData] = useState({
    title: post.title || '',
    excerpt: post.excerpt || '',
    content: post.content || '',
    image: post.image || '',
    category: post.category || '',
    author: post.author || '',
    date: post.date || new Date().toISOString().split('T')[0],
    // Novas opções visuais
    cardSize: post.cardSize || 'medium', // small, medium, large
    enableParallax: post.enableParallax !== false,
    enableScrollReveal: post.enableScrollReveal !== false,
    featured: post.featured || false,
    pullQuotes: post.pullQuotes || [],
    useDropCap: post.useDropCap || false,
    animationDelay: post.animationDelay || 0
  });

  const [pullQuoteInput, setPullQuoteInput] = useState({ text: '', author: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addPullQuote = () => {
    if (pullQuoteInput.text.trim()) {
      setFormData(prev => ({
        ...prev,
        pullQuotes: [...prev.pullQuotes, { ...pullQuoteInput }]
      }));
      setPullQuoteInput({ text: '', author: '' });
    }
  };

  const removePullQuote = (index) => {
    setFormData(prev => ({
      ...prev,
      pullQuotes: prev.pullQuotes.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-8">
      {/* Informações Básicas */}
      <ScrollReveal animation="slideUp">
        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <h3 className="font-display text-xl font-bold text-charcoal mb-6">Informações Básicas</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
                placeholder="Título da notícia"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Excerpt/Resumo</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
                placeholder="Resumo da notícia"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Autor</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
                  placeholder="Nome do autor"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Categoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Política">Política</option>
                  <option value="Cultura">Cultura</option>
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Esportes">Esportes</option>
                  <option value="Saúde">Saúde</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Data</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Conteúdo */}
      <ScrollReveal animation="slideUp" delay={0.1}>
        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <h3 className="font-display text-xl font-bold text-charcoal mb-6">Conteúdo</h3>
          
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Imagem Principal</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors mb-2"
              placeholder="URL da imagem"
            />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-charcoal mb-2">Conteúdo Principal</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="10"
              className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors font-mono text-sm"
              placeholder="Conteúdo da notícia (Markdown suportado)"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Opções Visuais Premium */}
      <ScrollReveal animation="slideUp" delay={0.2}>
        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <h3 className="font-display text-xl font-bold text-charcoal mb-6">✨ Opções Visuais Premium</h3>
          
          <div className="space-y-6">
            {/* Tamanho do Card */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-3">Tamanho do Card</label>
              <div className="grid md:grid-cols-3 gap-3">
                {['small', 'medium', 'large'].map(size => (
                  <label key={size} className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                    style={{ borderColor: formData.cardSize === size ? '#0066cc' : '#e5e7eb' }}
                  >
                    <input
                      type="radio"
                      name="cardSize"
                      value={size}
                      checked={formData.cardSize === size}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold text-charcoal capitalize">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Animações */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enableScrollReveal"
                  checked={formData.enableScrollReveal}
                  onChange={handleChange}
                  className="w-4 h-4 rounded"
                />
                <span className="font-semibold text-charcoal">Ativar Scroll Reveal (Revelação ao rolar)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enableParallax"
                  checked={formData.enableParallax}
                  onChange={handleChange}
                  className="w-4 h-4 rounded"
                />
                <span className="font-semibold text-charcoal">Ativar Parallax na Imagem</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded"
                />
                <span className="font-semibold text-charcoal">Destacar como Notícia Principal</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="useDropCap"
                  checked={formData.useDropCap}
                  onChange={handleChange}
                  className="w-4 h-4 rounded"
                />
                <span className="font-semibold text-charcoal">Usar Capitular (Drop Cap) no início</span>
              </label>
            </div>

            {/* Delay de Animação */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Delay de Animação (segundos)</label>
              <input
                type="number"
                name="animationDelay"
                value={formData.animationDelay}
                onChange={handleChange}
                min="0"
                max="2"
                step="0.1"
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Pull Quotes */}
      <ScrollReveal animation="slideUp" delay={0.3}>
        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <h3 className="font-display text-xl font-bold text-charcoal mb-6">💬 Citações em Destaque</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Citação</label>
              <textarea
                value={pullQuoteInput.text}
                onChange={(e) => setPullQuoteInput(prev => ({ ...prev, text: e.target.value }))}
                rows="2"
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
                placeholder="Digite a citação marcante"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Autor (opcional)</label>
              <input
                type="text"
                value={pullQuoteInput.author}
                onChange={(e) => setPullQuoteInput(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
                placeholder="Nome do autor"
              />
            </div>

            <button
              onClick={addPullQuote}
              className="w-full px-4 py-2 rounded-lg bg-royal-blue text-white font-semibold hover:bg-royal-blue/90 transition-colors"
            >
              + Adicionar Citação
            </button>
          </div>

          {/* Lista de Pull Quotes */}
          {formData.pullQuotes.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-charcoal">Citações Adicionadas:</p>
              {formData.pullQuotes.map((quote, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="italic text-charcoal">"{quote.text}"</p>
                    {quote.author && <p className="text-xs text-stone mt-2">— {quote.author}</p>}
                  </div>
                  <button
                    onClick={() => removePullQuote(index)}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm ml-4"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-royal-blue to-purple-600 text-white font-semibold hover:shadow-premium transition-all"
        >
          💾 Salvar Notícia
        </button>
        <button
          className="flex-1 px-6 py-3 rounded-lg border-2 border-charcoal/20 text-charcoal font-semibold hover:bg-charcoal/5 transition-colors"
        >
          👁️ Preview
        </button>
      </div>
    </div>
  );
};

export default AdminPostFormEnhanced;
