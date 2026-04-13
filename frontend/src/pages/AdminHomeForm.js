import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { siteContent } from '../data/siteContent';
import AdminImageField from '../components/AdminImageField';

const buildFallbackForm = () => ({
  archive_editions: [],
  home_columns: [],
  hero_display_mode: 'fixed',
  hero_featured_post_id: '',
  selected_post_ids: ['', '', ''],
  featured_edition_id: '',
  hero_override_image: '',
  featured_edition_override_image: '',
  hero_primary_cta_label: siteContent.home.heroPrimaryCtaLabel,
  hero_secondary_cta_label: siteContent.home.heroSecondaryCtaLabel,
  hero_secondary_label: siteContent.home.heroSecondaryLabel,
  featured_edition_label: siteContent.home.featuredEditionLabel,
  featured_edition_title: siteContent.home.featuredEditionTitle,
  featured_edition_primary_cta_label: siteContent.home.featuredEditionPrimaryCtaLabel,
  featured_edition_secondary_cta_label: siteContent.home.featuredEditionSecondaryCtaLabel,
  recommended_label: siteContent.home.recommendedLabel,
  recommended_title_prefix: siteContent.home.recommendedTitlePrefix,
  recommended_title_emphasis: siteContent.home.recommendedTitleEmphasis,
  recommended_link_label: siteContent.home.recommendedLinkLabel,
  recommended_empty_message: siteContent.home.recommendedEmptyMessage,
  archive_label: siteContent.home.archiveLabel,
  archive_title: siteContent.home.archiveTitle,
  archive_description: siteContent.home.archiveDescription,
  archive_primary_cta_label: siteContent.home.archivePrimaryCtaLabel,
  archive_secondary_cta_label: siteContent.home.archiveSecondaryCtaLabel,
  archive_empty_message: siteContent.home.archiveEmptyMessage,
  columns_label: siteContent.home.columnsLabel || 'Colunas',
  columns_title: siteContent.home.columnsTitle || 'Vozes em destaque',
  columns_description:
    siteContent.home.columnsDescription ||
    'Textos autorais, leituras de contexto e pontos de vista que ampliam a experiência editorial da Revista Enfoco.',
  columns_link_label: siteContent.home.columnsLinkLabel || 'Ver Colunas',
  columns_empty_message:
    siteContent.home.columnsEmptyMessage ||
    'As colunas publicadas aparecerão aqui assim que a curadoria editorial desta seção for preenchida.'
});

const ensureThreeSlots = (value = []) => [...value, '', '', ''].slice(0, 3);

const normalizeArchiveEditions = (items = []) =>
  items
    .filter(Boolean)
    .map((item) => ({
      edition_id: item?.edition_id || '',
      override_image: item?.override_image || ''
    }));

const normalizeHomeColumns = (items = []) =>
  items
    .filter(Boolean)
    .map((item) => ({
      column_id: item?.column_id || '',
      override_image: item?.override_image || ''
    }));

const AdminHomeForm = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [formData, setFormData] = useState(buildFallbackForm);
  const [posts, setPosts] = useState([]);
  const [editions, setEditions] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchHomeSettings = async () => {
      try {
        const [settingsResponse, postsResponse, editionsResponse, columnsResponse] = await Promise.allSettled([
          axios.get(apiUrl('/api/home-settings'), {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(apiUrl('/api/posts?published=true')),
          axios.get(apiUrl('/api/editions?published=true')),
          axios.get(apiUrl('/api/columns?published=true'))
        ]);

        if (settingsResponse.status === 'fulfilled') {
          setFormData((current) => ({
            ...current,
            ...settingsResponse.value.data,
            archive_editions: normalizeArchiveEditions(settingsResponse.value.data?.archive_editions || []),
            home_columns: normalizeHomeColumns(settingsResponse.value.data?.home_columns || []),
            hero_display_mode: settingsResponse.value.data?.hero_display_mode || 'fixed',
            hero_featured_post_id: settingsResponse.value.data?.hero_featured_post_id || '',
            selected_post_ids: ensureThreeSlots(settingsResponse.value.data?.selected_post_ids || []),
            featured_edition_id: settingsResponse.value.data?.featured_edition_id || '',
            hero_override_image: settingsResponse.value.data?.hero_override_image || '',
            featured_edition_override_image:
              settingsResponse.value.data?.featured_edition_override_image || ''
          }));
        }

        if (postsResponse.status === 'fulfilled' && Array.isArray(postsResponse.value.data)) {
          setPosts(postsResponse.value.data);
        }

        if (editionsResponse.status === 'fulfilled' && Array.isArray(editionsResponse.value.data)) {
          setEditions(editionsResponse.value.data);
        }

        if (columnsResponse.status === 'fulfilled' && Array.isArray(columnsResponse.value.data)) {
          setColumns(columnsResponse.value.data);
        }
      } catch (fetchError) {
        console.error('Error fetching home settings:', fetchError);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchHomeSettings();
  }, [token, navigate]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSelectedPostChange = (index, value) => {
    setFormData((current) => {
      const nextSelected = ensureThreeSlots(current.selected_post_ids);
      nextSelected[index] = value;

      return {
        ...current,
        selected_post_ids: nextSelected
      };
    });
  };

  const handleArchiveEditionChange = (index, field, value) => {
    setFormData((current) => {
      const nextItems = [...normalizeArchiveEditions(current.archive_editions)];
      nextItems[index] = {
        edition_id: nextItems[index]?.edition_id || '',
        override_image: nextItems[index]?.override_image || '',
        [field]: value
      };

      return {
        ...current,
        archive_editions: nextItems
      };
    });
  };

  const addArchiveEdition = () => {
    setFormData((current) => ({
      ...current,
      archive_editions: [...normalizeArchiveEditions(current.archive_editions), { edition_id: '', override_image: '' }]
    }));
  };

  const handleHomeColumnChange = (index, field, value) => {
    setFormData((current) => {
      const nextItems = [...normalizeHomeColumns(current.home_columns)];
      nextItems[index] = {
        column_id: nextItems[index]?.column_id || '',
        override_image: nextItems[index]?.override_image || '',
        [field]: value
      };

      return {
        ...current,
        home_columns: nextItems
      };
    });
  };

  const addHomeColumn = () => {
    setFormData((current) => ({
      ...current,
      home_columns: [...normalizeHomeColumns(current.home_columns), { column_id: '', override_image: '' }]
    }));
  };

  const removeHomeColumn = (index) => {
    setFormData((current) => ({
      ...current,
      home_columns: normalizeHomeColumns(current.home_columns).filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const moveHomeColumn = (index, direction) => {
    setFormData((current) => {
      const nextItems = [...normalizeHomeColumns(current.home_columns)];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= nextItems.length) {
        return current;
      }

      [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];

      return {
        ...current,
        home_columns: nextItems
      };
    });
  };

  const removeArchiveEdition = (index) => {
    setFormData((current) => ({
      ...current,
      archive_editions: normalizeArchiveEditions(current.archive_editions).filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const moveArchiveEdition = (index, direction) => {
    setFormData((current) => {
      const nextItems = [...normalizeArchiveEditions(current.archive_editions)];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= nextItems.length) {
        return current;
      }

      [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];

      return {
        ...current,
        archive_editions: nextItems
      };
    });
  };

  const availableSecondaryPosts = useMemo(
    () => posts.filter((post) => post.id !== formData.hero_featured_post_id),
    [posts, formData.hero_featured_post_id]
  );

  const archiveEditionItems = normalizeArchiveEditions(formData.archive_editions);
  const homeColumnItems = normalizeHomeColumns(formData.home_columns);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const cleanedSelectedPostIds = ensureThreeSlots(formData.selected_post_ids)
      .map((value) => value || '')
      .filter((value, index, array) => value && value !== formData.hero_featured_post_id && array.indexOf(value) === index);

    const cleanedArchiveEditions = archiveEditionItems.filter(
      (item, index, array) =>
        item.edition_id && array.findIndex((candidate) => candidate.edition_id === item.edition_id) === index
    );

    const cleanedHomeColumns = homeColumnItems.filter(
      (item, index, array) =>
        item.column_id && array.findIndex((candidate) => candidate.column_id === item.column_id) === index
    );

    const payload = {
      ...formData,
      archive_editions: cleanedArchiveEditions,
      home_columns: cleanedHomeColumns,
      hero_featured_post_id: formData.hero_featured_post_id || null,
      featured_edition_id: formData.featured_edition_id || null,
      hero_override_image: formData.hero_override_image || null,
      featured_edition_override_image: formData.featured_edition_override_image || null,
      selected_post_ids: cleanedSelectedPostIds
    };

    try {
      await axios.put(apiUrl('/api/home-settings'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/admin/dashboard');
    } catch (saveError) {
      console.error('Error saving home settings:', saveError);
      setError('Erro ao salvar as configuracoes da home.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-charcoal font-display text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold mb-2">Editar Home</h1>
              <p className="text-stone">
                Aqui voce controla textos, materias e imagens que aparecem nas principais secoes da pagina inicial.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-5 py-3 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Destaque principal</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Modo do destaque</label>
                  <select
                    value={formData.hero_display_mode}
                    onChange={(event) => handleChange('hero_display_mode', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  >
                    <option value="fixed">Fixo</option>
                    <option value="carousel">Automatico passando</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Materia principal da home</label>
                  <select
                    value={formData.hero_featured_post_id}
                    onChange={(event) => handleChange('hero_featured_post_id', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  >
                    <option value="">Automatica (mais recente)</option>
                    {posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Botao principal</label>
                  <input
                    type="text"
                    value={formData.hero_primary_cta_label}
                    onChange={(event) => handleChange('hero_primary_cta_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-charcoal/10 bg-white/55 px-5 py-4 text-sm text-stone">
                {formData.hero_display_mode === 'carousel'
                  ? 'No modo automatico, a noticia principal e os destaques secundarios passam no topo da home, mantendo o mesmo layout.'
                  : 'No modo fixo, a home mostra uma unica noticia principal e os secundarios permanecem abaixo, sem rotacao automatica.'}
              </div>

              <AdminImageField
                label="Imagem opcional do destaque principal"
                value={formData.hero_override_image}
                onChange={(value) => handleChange('hero_override_image', value)}
                token={token}
                placeholder="/uploads/home-destaque.jpg"
                helperText="Se preencher, esta imagem substitui a imagem da materia principal somente na home."
              />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Botao secundario</label>
                  <input
                    type="text"
                    value={formData.hero_secondary_cta_label}
                    onChange={(event) => handleChange('hero_secondary_cta_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Titulo dos destaques secundarios</label>
                  <input
                    type="text"
                    value={formData.hero_secondary_label}
                    onChange={(event) => handleChange('hero_secondary_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[0, 1, 2].map((index) => (
                  <div key={`secondary-post-${index}`}>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Noticia secundaria {index + 1}
                    </label>
                    <select
                      value={ensureThreeSlots(formData.selected_post_ids)[index]}
                      onChange={(event) => handleSelectedPostChange(index, event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                    >
                      <option value="">Automatica</option>
                      {availableSecondaryPosts.map((post) => (
                        <option key={post.id} value={post.id}>
                          {post.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Edicao em destaque</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Edicao da secao</label>
                  <select
                    value={formData.featured_edition_id}
                    onChange={(event) => handleChange('featured_edition_id', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  >
                    <option value="">Automatica (mais recente)</option>
                    {editions.map((edition) => (
                      <option key={edition.id} value={edition.id}>
                        Edicao #{edition.edition_number} - {edition.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Sobretitulo da secao</label>
                  <input
                    type="text"
                    value={formData.featured_edition_label}
                    onChange={(event) => handleChange('featured_edition_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <AdminImageField
                label="Imagem opcional da edicao em destaque"
                value={formData.featured_edition_override_image}
                onChange={(value) => handleChange('featured_edition_override_image', value)}
                token={token}
                placeholder="/uploads/home-edicao.jpg"
                helperText="Se preencher, esta imagem substitui a capa da edicao somente na secao destacada da home."
              />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Titulo da secao</label>
                  <input
                    type="text"
                    value={formData.featured_edition_title}
                    onChange={(event) => handleChange('featured_edition_title', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Botao principal</label>
                  <input
                    type="text"
                    value={formData.featured_edition_primary_cta_label}
                    onChange={(event) => handleChange('featured_edition_primary_cta_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Botao alternativo</label>
                <input
                  type="text"
                  value={formData.featured_edition_secondary_cta_label}
                  onChange={(event) => handleChange('featured_edition_secondary_cta_label', event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Leitura recomendada</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Sobretitulo da secao</label>
                  <input
                    type="text"
                    value={formData.recommended_label}
                    onChange={(event) => handleChange('recommended_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Texto do link</label>
                  <input
                    type="text"
                    value={formData.recommended_link_label}
                    onChange={(event) => handleChange('recommended_link_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Titulo principal</label>
                  <input
                    type="text"
                    value={formData.recommended_title_prefix}
                    onChange={(event) => handleChange('recommended_title_prefix', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Palavra em destaque</label>
                  <input
                    type="text"
                    value={formData.recommended_title_emphasis}
                    onChange={(event) => handleChange('recommended_title_emphasis', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Mensagem sem conteudo</label>
                <textarea
                  value={formData.recommended_empty_message}
                  onChange={(event) => handleChange('recommended_empty_message', event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[110px]"
                />
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Acervo da revista</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Sobretitulo da secao</label>
                  <input
                    type="text"
                    value={formData.archive_label}
                    onChange={(event) => handleChange('archive_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Titulo da secao</label>
                  <input
                    type="text"
                    value={formData.archive_title}
                    onChange={(event) => handleChange('archive_title', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Descricao da secao</label>
                <textarea
                  value={formData.archive_description}
                  onChange={(event) => handleChange('archive_description', event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[120px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Botao principal</label>
                  <input
                    type="text"
                    value={formData.archive_primary_cta_label}
                    onChange={(event) => handleChange('archive_primary_cta_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Botao alternativo</label>
                  <input
                    type="text"
                    value={formData.archive_secondary_cta_label}
                    onChange={(event) => handleChange('archive_secondary_cta_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Mensagem sem conteudo</label>
                <textarea
                  value={formData.archive_empty_message}
                  onChange={(event) => handleChange('archive_empty_message', event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[110px]"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-charcoal">Revistas do acervo da home</h3>
                    <p className="text-sm text-stone">
                      Escolha quais revistas aparecem nessa secao, defina a ordem e troque a capa se quiser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addArchiveEdition}
                    className="px-5 py-3 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors"
                  >
                    Adicionar revista
                  </button>
                </div>

                {archiveEditionItems.length > 0 ? (
                  <div className="space-y-6">
                    {archiveEditionItems.map((item, index) => (
                      <div key={`archive-edition-${index}`} className="rounded-[28px] border border-charcoal/10 bg-white/60 p-5 md:p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-royal-blue">
                              Posicao {index + 1}
                            </p>
                            <h4 className="font-display text-xl font-bold text-charcoal">Revista selecionada</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveArchiveEdition(index, -1)}
                              disabled={index === 0}
                              className="w-11 h-11 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors disabled:opacity-40"
                              aria-label="Mover para cima"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveArchiveEdition(index, 1)}
                              disabled={index === archiveEditionItems.length - 1}
                              className="w-11 h-11 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors disabled:opacity-40"
                              aria-label="Mover para baixo"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeArchiveEdition(index)}
                              className="px-4 py-2 rounded-full border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">Edicao</label>
                          <select
                            value={item.edition_id}
                            onChange={(event) => handleArchiveEditionChange(index, 'edition_id', event.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                          >
                            <option value="">Selecione uma revista</option>
                            {editions.map((edition) => (
                              <option key={edition.id} value={edition.id}>
                                Edicao #{edition.edition_number} - {edition.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <AdminImageField
                          label="Capa opcional desta revista na home"
                          value={item.override_image}
                          onChange={(value) => handleArchiveEditionChange(index, 'override_image', value)}
                          token={token}
                          placeholder="/uploads/home-acervo.jpg"
                          helperText="Se preencher, esta imagem substitui a capa dessa revista somente no acervo da home."
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-charcoal/12 bg-white/40 p-6 text-sm text-stone">
                    Nenhuma revista foi escolhida ainda. Se deixar vazio, a home continua exibindo automaticamente as edicoes mais recentes.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Faixa de colunas</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Sobretitulo da secao</label>
                  <input
                    type="text"
                    value={formData.columns_label}
                    onChange={(event) => handleChange('columns_label', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Titulo da secao</label>
                  <input
                    type="text"
                    value={formData.columns_title}
                    onChange={(event) => handleChange('columns_title', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Descricao da secao</label>
                  <textarea
                    value={formData.columns_description}
                    onChange={(event) => handleChange('columns_description', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[120px]"
                  />
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Texto do link</label>
                    <input
                      type="text"
                      value={formData.columns_link_label}
                      onChange={(event) => handleChange('columns_link_label', event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Mensagem sem conteudo</label>
                    <textarea
                      value={formData.columns_empty_message}
                      onChange={(event) => handleChange('columns_empty_message', event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[120px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-charcoal">Colunas da home</h3>
                    <p className="text-sm text-stone">
                      Todas as colunas publicadas aparecem automaticamente nessa faixa. Use esta area apenas se quiser ajustar a ordem das primeiras ou trocar alguma imagem na home.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addHomeColumn}
                    className="px-5 py-3 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors"
                  >
                    Adicionar coluna
                  </button>
                </div>

                {homeColumnItems.length > 0 ? (
                  <div className="space-y-6">
                    {homeColumnItems.map((item, index) => (
                      <div key={`home-column-${index}`} className="rounded-[28px] border border-charcoal/10 bg-white/60 p-5 md:p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-royal-blue">
                              Posicao {index + 1}
                            </p>
                            <h4 className="font-display text-xl font-bold text-charcoal">Coluna selecionada</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveHomeColumn(index, -1)}
                              disabled={index === 0}
                              className="w-11 h-11 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors disabled:opacity-40"
                              aria-label="Mover para cima"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveHomeColumn(index, 1)}
                              disabled={index === homeColumnItems.length - 1}
                              className="w-11 h-11 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors disabled:opacity-40"
                              aria-label="Mover para baixo"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeHomeColumn(index)}
                              className="px-4 py-2 rounded-full border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">Coluna</label>
                          <select
                            value={item.column_id}
                            onChange={(event) => handleHomeColumnChange(index, 'column_id', event.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                          >
                            <option value="">Selecione uma coluna</option>
                            {columns.map((column) => (
                              <option key={column.id} value={column.id}>
                                {column.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <AdminImageField
                          label="Imagem opcional desta coluna na home"
                          value={item.override_image}
                          onChange={(value) => handleHomeColumnChange(index, 'override_image', value)}
                          token={token}
                          placeholder="/uploads/home-coluna.jpg"
                          helperText="Se preencher, esta imagem substitui a imagem dessa coluna somente na home."
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-charcoal/12 bg-white/40 p-6 text-sm text-stone">
                    Nenhuma coluna recebeu ajuste manual ainda. A home continua exibindo automaticamente todas as colunas publicadas.
                  </div>
                )}
              </div>
            </section>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Home'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminHomeForm;
