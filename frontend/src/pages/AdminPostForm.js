import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import RichTextEditor from '../components/RichTextEditor';
import AdminImageField from '../components/AdminImageField';
import PostPreview from '../components/PostPreview';
import {
  normalizeRichTextForEditor,
  normalizeRichTextForStorage,
  richTextToPlainText
} from '../lib/richText';

const AdminPostForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    category: '',
    author_name: '',
    featured_image: '',
    image_position: '',
    destaque_principal_home: false,
    destaque_secundario_home: false,
    ordem_destaque: 0,
    published: true
  });
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorView, setEditorView] = useState('edit');

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === formData.category_id) || null,
    [categories, formData.category_id]
  );
  const hasCategories = categories.length > 0;
  const previewPost = useMemo(
    () => ({
      ...formData,
      category: selectedCategory?.name || formData.category
    }),
    [formData, selectedCategory]
  );

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const loadData = async () => {
      try {
        const [categoriesResponse, postsResponse] = await Promise.all([
          axios.get(apiUrl('/api/categories'), {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(apiUrl('/api/posts'), {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setCategories(categoriesResponse.data);

        if (Array.isArray(postsResponse.data)) {
          setPosts(postsResponse.data);
        }

        if (isEdit) {
          const post = postsResponse.data.find((item) => item.id === id);
          if (post) {
            const matchedCategory =
              categoriesResponse.data.find((item) => item.id === post.category_id) ||
              categoriesResponse.data.find((item) => item.slug === post.category_slug) ||
              categoriesResponse.data.find((item) => item.name === post.category);

            setFormData({
              title: post.title || '',
              content: normalizeRichTextForEditor(post.content),
              excerpt: post.excerpt || '',
              category_id: matchedCategory?.id || '',
              category: matchedCategory?.name || post.category || '',
              author_name: post.author_name || '',
              featured_image: post.featured_image || '',
              image_position: post.image_position || '',
              destaque_principal_home: Boolean(post.destaque_principal_home),
              destaque_secundario_home: Boolean(post.destaque_secundario_home),
              ordem_destaque: Number(post.ordem_destaque || 0),
              published: typeof post.published === 'boolean' ? post.published : true
            });
          }
        }
      } catch (fetchError) {
        console.error('Error loading post form data:', fetchError);
        setError('Nao foi possivel carregar as categorias ou a noticia.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [token, navigate, id, isEdit]);

  const handleCategoryChange = (event) => {
    const nextCategoryId = event.target.value;
    const nextCategory = categories.find((item) => item.id === nextCategoryId);

    setFormData((current) => ({
      ...current,
      category_id: nextCategoryId,
      category: nextCategory?.name || ''
    }));
  };

  const currentFeaturedPost = useMemo(
    () => posts.find((item) => item.destaque_principal_home && item.id !== id) || null,
    [posts, id]
  );
  const highlightOrderDisabled = !formData.destaque_secundario_home;

  const handleHighlightToggle = (field, checked) => {
    if (field === 'destaque_principal_home') {
      setFormData((current) => ({
        ...current,
        destaque_principal_home: checked,
        destaque_secundario_home: checked ? false : current.destaque_secundario_home
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      destaque_secundario_home: checked,
      destaque_principal_home: checked ? false : current.destaque_principal_home
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.category_id) {
      setError('Selecione uma categoria para a noticia.');
      return;
    }

    const normalizedContent = normalizeRichTextForStorage(formData.content);
    if (!richTextToPlainText(normalizedContent)) {
      setError('Adicione o conteudo da noticia antes de salvar.');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      content: normalizedContent,
      category: selectedCategory?.name || formData.category
    };

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/posts/${id}`), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(apiUrl('/api/posts'), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin/posts');
    } catch (saveError) {
      const message = saveError?.response?.data?.detail || 'Erro ao salvar noticia';
      setError(message);
      console.error('Error saving post:', saveError);
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
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10">
          <h1 className="font-display text-4xl font-bold mb-2">
            {isEdit ? 'Editar Noticia' : 'Nova Noticia'}
          </h1>
          <p className="text-stone mb-8">Preencha os campos abaixo</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Titulo *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Categoria *</label>
                <select
                  value={formData.category_id}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  disabled={!hasCategories}
                  required
                >
                  <option value="">
                    {hasCategories ? 'Selecione uma categoria' : 'Cadastre uma categoria antes'}
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      disabled={!category.active && category.id !== formData.category_id}
                    >
                      {category.name}
                      {category.active ? '' : ' (inativa)'}
                    </option>
                  ))}
                </select>
                {!hasCategories && (
                  <p className="mt-2 text-xs text-stone">
                    Nenhuma categoria encontrada. Crie em <strong>/admin/categories</strong> antes de publicar a noticia.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Autor exibido</label>
                <input
                  type="text"
                  value={formData.author_name}
                  onChange={(event) => setFormData({ ...formData, author_name: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  placeholder="Ex.: Mariana Rodrigues"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-charcoal/10 bg-white/60 px-5 py-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-charcoal mb-1">Destaques da home</p>
                <p className="text-sm text-stone">
                  Escolha se esta noticia aparece como destaque principal ou secundario na pagina inicial.
                </p>
              </div>

              {currentFeaturedPost && !formData.destaque_principal_home && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Ja existe um destaque principal ativo: <strong>{currentFeaturedPost.title}</strong>. Se voce marcar esta noticia como principal, a atual sera desmarcada automaticamente.
                </div>
              )}

              <div className="grid md:grid-cols-[1fr_1fr_180px] gap-4 items-start">
                <label className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-white/70 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={formData.destaque_principal_home}
                    onChange={(event) => handleHighlightToggle('destaque_principal_home', event.target.checked)}
                    className="w-5 h-5 rounded border-charcoal/20 mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-charcoal">Destaque principal da home</span>
                    <span className="block text-xs text-stone mt-1">A home aceita somente uma noticia nessa posicao.</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-white/70 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={formData.destaque_secundario_home}
                    onChange={(event) => handleHighlightToggle('destaque_secundario_home', event.target.checked)}
                    className="w-5 h-5 rounded border-charcoal/20 mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-charcoal">Destaque secundario</span>
                    <span className="block text-xs text-stone mt-1">Voce pode usar varios destaques secundarios na home.</span>
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Ordem do destaque</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ordem_destaque}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        ordem_destaque: Number(event.target.value || 0)
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/70 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                    disabled={highlightOrderDisabled}
                  />
                  <p className="mt-2 text-xs text-stone">
                    {highlightOrderDisabled
                      ? 'Ative o destaque secundario para definir uma ordem.'
                      : 'Usado para ordenar os destaques secundarios.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Resumo *</label>
              <textarea
                value={formData.excerpt}
                onChange={(event) => setFormData({ ...formData, excerpt: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[100px]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <label className="block text-sm font-medium text-charcoal">Conteudo *</label>
                <div className="inline-flex rounded-full border border-charcoal/10 bg-white/60 p-1">
                  <button
                    type="button"
                    onClick={() => setEditorView('edit')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                      editorView === 'edit'
                        ? 'bg-charcoal text-white'
                        : 'text-charcoal hover:bg-charcoal/5'
                    }`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorView('preview')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                      editorView === 'preview'
                        ? 'bg-charcoal text-white'
                        : 'text-charcoal hover:bg-charcoal/5'
                    }`}
                  >
                    Previa
                  </button>
                </div>
              </div>

              {editorView === 'edit' ? (
                <>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(nextValue) => setFormData({ ...formData, content: nextValue })}
                    placeholder="Estruture a materia com titulos, subtitulos, paragrafos e links."
                    minHeight={420}
                    token={token}
                  />
                  <p className="mt-3 text-xs text-stone">
                    Use a barra superior para construir hierarquia de leitura, ajustar o tamanho do texto e o respiro entre paragrafos sem perder o padrao editorial.
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <PostPreview post={previewPost} previewLabel="Previa da materia" />
                  <p className="text-xs text-stone">
                    Esta visualizacao usa a mesma tipografia editorial e a mesma hierarquia da materia publicada no frontend.
                  </p>
                </div>
              )}
            </div>

            <div>
              <AdminImageField
                label="Imagem principal"
                value={formData.featured_image}
                onChange={(nextValue) => setFormData({ ...formData, featured_image: nextValue })}
                token={token}
                placeholder="/media/exemplo.jpg"
                positionValue={formData.image_position}
                onPositionChange={(nextValue) =>
                  setFormData({ ...formData, image_position: nextValue })
                }
              />
            </div>

            <div className="rounded-[24px] border border-charcoal/10 bg-white/60 px-4 py-4">
              <p className="text-sm font-medium text-charcoal mb-1">Categoria selecionada</p>
              <p className="text-sm text-stone">
                {selectedCategory
                  ? `${selectedCategory.name} (${selectedCategory.slug})`
                  : 'Nenhuma categoria selecionada'}
              </p>
            </div>

            {editorView === 'edit' && (
              <div className="rounded-[24px] border border-charcoal/10 bg-white/55 px-5 py-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal mb-1">Preview da materia</p>
                    <p className="text-sm text-stone">
                      Alterne para a aba de previa para revisar a materia com o mesmo estilo editorial do site antes de publicar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditorView('preview')}
                    className="px-5 py-3 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors text-sm font-semibold"
                  >
                    Abrir previa
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(event) => setFormData({ ...formData, published: event.target.checked })}
                className="w-5 h-5 rounded border-charcoal/20"
              />
              <label htmlFor="published" className="text-sm text-charcoal">
                Publicar imediatamente
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/posts')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar alteracoes' : 'Criar noticia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPostForm;
