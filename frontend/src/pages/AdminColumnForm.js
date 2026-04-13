import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import AdminImageField from '../components/AdminImageField';
import SafeImage from '../components/SafeImage';
import RichTextEditor from '../components/RichTextEditor';
import ColumnPreview from '../components/ColumnPreview';
import {
  normalizeRichTextForEditor,
  normalizeRichTextForStorage,
  richTextToPlainText
} from '../lib/richText';

const emptyFormData = {
  title: '',
  content: '',
  excerpt: '',
  columnist_id: '',
  author_name: '',
  author_role: '',
  author_bio: '',
  author_image: '',
  featured_image: '',
  image_position: '',
  published: true
};

const AdminColumnForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState(emptyFormData);
  const [columnists, setColumnists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorView, setEditorView] = useState('edit');

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
        return Array.isArray(response.data) ? response.data : [];
      } catch (fetchError) {
        console.error('Error fetching columnists:', fetchError);
        return [];
      }
    };

    const fetchColumn = async () => {
      if (!isEdit) {
        return null;
      }

      try {
        const response = await axios.get(apiUrl('/api/columns'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.find((item) => item.id === id) || null;
      } catch (fetchError) {
        console.error('Error fetching column:', fetchError);
        setError('Nao foi possivel carregar esta coluna.');
        return null;
      }
    };

    const loadData = async () => {
      const [nextColumnists, column] = await Promise.all([fetchColumnists(), fetchColumn()]);
      setColumnists(nextColumnists);

      if (column) {
        setFormData({
          title: column.title || '',
          content: normalizeRichTextForEditor(column.content || ''),
          excerpt: column.excerpt || '',
          columnist_id: column.columnist_id || '',
          author_name: column.author_name || '',
          author_role: column.author_role || '',
          author_bio: column.author_bio || '',
          author_image: column.author_image || '',
          featured_image: column.featured_image || '',
          image_position: column.image_position || '',
          published: column.published ?? true
        });
      }

      setInitialLoading(false);
    };

    loadData();
  }, [token, navigate, id, isEdit]);

  const selectedColumnist = useMemo(
    () => columnists.find((columnist) => columnist.id === formData.columnist_id) || null,
    [columnists, formData.columnist_id]
  );

  const isLinkedToColumnist = Boolean(formData.columnist_id && selectedColumnist);
  const previewColumn = useMemo(() => ({ ...formData }), [formData]);

  useEffect(() => {
    if (!selectedColumnist) {
      return;
    }

    setFormData((current) => ({
      ...current,
      author_name: selectedColumnist.name || '',
      author_role: selectedColumnist.role || '',
      author_bio: selectedColumnist.bio || '',
      author_image: selectedColumnist.image || ''
    }));
  }, [selectedColumnist]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const normalizedContent = normalizeRichTextForStorage(formData.content);
    if (!richTextToPlainText(normalizedContent)) {
      setError('Adicione o conteudo da coluna antes de salvar.');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      content: normalizedContent
    };

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/columns/${id}`), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(apiUrl('/api/columns'), payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin/columns');
    } catch (saveError) {
      setError(saveError?.response?.data?.detail || 'Erro ao salvar coluna');
      console.error('Error saving column:', saveError);
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
          <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold mb-2">
                {isEdit ? 'Editar Coluna' : 'Nova Coluna'}
              </h1>
              <p className="text-stone">Preencha os campos abaixo.</p>
            </div>
            <Link
              to="/admin/columns/columnists"
              className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
            >
              Gerenciar Colunistas
            </Link>
          </div>

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

            <div className="rounded-[28px] border border-charcoal/10 bg-white/60 p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold">Colunista</h2>
                  <p className="text-stone text-sm mt-1">
                    Escolha um perfil cadastrado para preencher automaticamente nome, cargo, bio e foto.
                  </p>
                </div>
                <Link
                  to="/admin/columns/columnists/new"
                  className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
                >
                  Novo Colunista
                </Link>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Perfil vinculado</label>
                <select
                  value={formData.columnist_id}
                  onChange={(event) => setFormData({ ...formData, columnist_id: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                >
                  <option value="">Nenhum colunista selecionado</option>
                  {columnists.map((columnist) => (
                    <option key={columnist.id} value={columnist.id}>
                      {columnist.name} - {columnist.role}
                    </option>
                  ))}
                </select>
              </div>

              {selectedColumnist ? (
                <div className="mt-5 rounded-[24px] border border-charcoal/10 bg-porcelain/80 p-5">
                  <div className="flex items-start gap-4">
                    {selectedColumnist.image ? (
                      <SafeImage
                        src={selectedColumnist.image}
                        alt={selectedColumnist.name}
                        className="w-20 h-20 rounded-full object-cover object-top shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
                        {selectedColumnist.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-royal-blue font-semibold mb-2">
                        Perfil ativo na coluna
                      </p>
                      <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                        {selectedColumnist.name}
                      </h3>
                      <p className="text-charcoal/70 text-sm font-medium mb-3">{selectedColumnist.role}</p>
                      <p className="text-stone text-sm leading-relaxed">{selectedColumnist.bio}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-charcoal/12 bg-white/40 p-5">
                  <p className="text-stone text-sm">
                    Sem vinculo: esta coluna continua no modo manual para preservar colunas antigas enquanto voce migra os perfis aos poucos.
                  </p>
                </div>
              )}
            </div>

            {!isLinkedToColumnist && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Nome do colunista</label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(event) => setFormData({ ...formData, author_name: event.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                      placeholder="Ex.: Volmar Zanini"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Cargo / assinatura</label>
                    <input
                      type="text"
                      value={formData.author_role}
                      onChange={(event) => setFormData({ ...formData, author_role: event.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                      placeholder="Ex.: Advogado criminalista em Santa Maria"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Bio do colunista</label>
                  <textarea
                    value={formData.author_bio}
                    onChange={(event) => setFormData({ ...formData, author_bio: event.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[110px]"
                  />
                </div>

                <AdminImageField
                  label="Foto do colunista"
                  value={formData.author_image}
                  onChange={(nextValue) => setFormData({ ...formData, author_image: nextValue })}
                  token={token}
                  placeholder="/media/volmar-zanini.jpg"
                />
              </>
            )}

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
                    placeholder="Estruture a coluna com titulos, subtitulos, paragrafos, links, imagens e galerias."
                    minHeight={420}
                    token={token}
                  />
                  <p className="mt-3 text-xs text-stone">
                    Este editor segue o mesmo padrao de Noticias, com estrutura, tipografia, espacamento, imagens e galerias no meio do conteudo.
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <ColumnPreview column={previewColumn} previewLabel="Previa da coluna" />
                  <p className="text-xs text-stone">
                    Esta visualizacao usa a mesma hierarquia editorial da coluna publicada no frontend.
                  </p>
                </div>
              )}
            </div>

            <AdminImageField
              label="Imagem principal"
              value={formData.featured_image}
              onChange={(nextValue) => setFormData({ ...formData, featured_image: nextValue })}
              token={token}
              placeholder="/media/volmar-zanini.jpg"
              positionValue={formData.image_position}
              onPositionChange={(nextValue) =>
                setFormData({ ...formData, image_position: nextValue })
              }
            />

            {editorView === 'edit' && (
              <div className="rounded-[24px] border border-charcoal/10 bg-white/55 px-5 py-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal mb-1">Preview da coluna</p>
                    <p className="text-sm text-stone">
                      Alterne para a aba de previa para revisar a coluna com o mesmo estilo do frontend antes de publicar.
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
                onClick={() => navigate('/admin/columns')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Criar Coluna'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminColumnForm;
