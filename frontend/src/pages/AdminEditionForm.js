import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import AdminImageField from '../components/AdminImageField';
import AdminImageGalleryField from '../components/AdminImageGalleryField';

const AdminEditionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const token = 'cookie-session';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_image: '',
    edition_number: '',
    pdf_url: '',
    page_count: '',
    pages_base_path: '',
    reader_pages: [],
    preview_pages: [],
    published: true
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    if (!isEdit) {
      setInitialLoading(false);
      return;
    }

    const fetchEdition = async () => {
      try {
        const response = await axios.get(apiUrl('/api/editions'), {
          headers: {  }
        });
        const edition = response.data.find((item) => item.id === id);
        if (edition) {
          setFormData({
            title: edition.title || '',
            description: edition.description || '',
            cover_image: edition.cover_image || '',
            edition_number: String(edition.edition_number || ''),
            pdf_url: edition.pdf_url || '',
            page_count: edition.page_count ? String(edition.page_count) : '',
            pages_base_path: edition.pages_base_path || '',
            reader_pages: Array.isArray(edition.reader_pages) ? edition.reader_pages : [],
            preview_pages: Array.isArray(edition.preview_pages) ? edition.preview_pages : [],
            published: typeof edition.published === 'boolean' ? edition.published : true
          });
        }
      } catch (fetchError) {
        console.error('Error fetching edition:', fetchError);
        setError('Nao foi possivel carregar a edicao.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchEdition();
  }, [token, navigate, id, isEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      ...formData,
      edition_number: Number(formData.edition_number),
      page_count: formData.page_count ? Number(formData.page_count) : null,
      pdf_url: String(formData.pdf_url || '').trim() || null,
      pages_base_path: String(formData.pages_base_path || '').trim() || null,
      reader_pages: Array.isArray(formData.reader_pages)
        ? formData.reader_pages.map((item) => String(item || '').trim()).filter(Boolean)
        : [],
      preview_pages: Array.isArray(formData.preview_pages)
        ? formData.preview_pages.map((item) => String(item || '').trim()).filter(Boolean)
        : []
    };

    try {
      if (isEdit) {
        await axios.put(apiUrl(`/api/editions/${id}`), payload, {
          headers: {  }
        });
      } else {
        await axios.post(apiUrl('/api/editions'), payload, {
          headers: {  }
        });
      }
      navigate('/admin/editions');
    } catch (saveError) {
      setError(saveError?.response?.data?.detail || 'Erro ao salvar edicao');
      console.error('Error saving edition:', saveError);
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
          <h1 className="font-display text-4xl font-bold mb-2">
            {isEdit ? 'Editar Edicao' : 'Nova Edicao'}
          </h1>
          <p className="text-stone mb-8">
            Monte a revista com capa, PDF, paginas de previa e paginas completas do leitor.
          </p>

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

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Descricao *</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[160px]"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Numero da edicao *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.edition_number}
                  onChange={(event) => setFormData({ ...formData, edition_number: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  required
                />
              </div>

              <div>
                <AdminImageField
                  label="Capa da edicao"
                  value={formData.cover_image}
                  onChange={(nextValue) => setFormData({ ...formData, cover_image: nextValue })}
                  token={token}
                  placeholder="/assets/revista-capa-real-hq.png"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-charcoal/10 bg-white/55 p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-charcoal">PDF da revista</h2>
                  <p className="text-sm text-stone mt-2">
                    Use apenas uma URL externa para o PDF da edicao. Esse link alimenta o botao
                    "Abrir PDF" do site e evita ocupar o storage de imagens da revista.
                  </p>
                  <p className="text-xs text-stone/90 mt-2">
                    Recomendado: Google Drive, Dropbox, Cloudinary ou outro host dedicado para PDF.
                    O upload direto de PDF pelo admin foi desativado para preservar espaco da midia.
                  </p>
                </div>
                <span className="px-5 py-3 rounded-full border border-charcoal/14 text-charcoal text-sm font-semibold bg-white/70">
                  Use link externo
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">URL externa do PDF</label>
                <input
                  type="text"
                  value={formData.pdf_url}
                  onChange={(event) => setFormData({ ...formData, pdf_url: event.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  placeholder="https://exemplo.com/revista-edicao.pdf"
                />
              </div>

              {formData.pdf_url && (
                <div className="rounded-[20px] border border-charcoal/10 bg-white/70 px-4 py-4 text-sm text-charcoal">
                  PDF pronto para uso: <span className="font-semibold">{formData.pdf_url}</span>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-charcoal/10 bg-white/55 p-6 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-charcoal">Paginas de previa</h2>
                <p className="text-sm text-stone mt-2">
                  Essas paginas aparecem na home e podem servir como amostra rapida da revista.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-royal-blue/15 bg-royal-blue/5 px-3 py-2 text-xs text-royal-blue font-semibold tracking-[0.12em] uppercase">
                  Home e capa
                  <span className="text-charcoal/60 normal-case tracking-normal font-medium">
                    {formData.preview_pages.length} pagina{formData.preview_pages.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <AdminImageGalleryField
                label="Previa da edicao"
                values={formData.preview_pages}
                onChange={(nextValue) => setFormData({ ...formData, preview_pages: nextValue })}
                token={token}
                itemLabel="Pagina"
                emptyLabel="Nenhuma pagina de previa adicionada ainda. Envie as paginas mais importantes para a capa da revista e a home."
              />
            </div>

            <div className="rounded-[28px] border border-charcoal/10 bg-white/55 p-6 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-charcoal">Paginas do leitor</h2>
                <p className="text-sm text-stone mt-2">
                  Se quiser um fluxo facil, envie aqui todas as paginas da revista na ordem.
                  O leitor completo prioriza essa lista automaticamente. Se ela ficar vazia,
                  o leitor abre o PDF enviado acima.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-charcoal/12 bg-charcoal/[0.04] px-3 py-2 text-xs text-charcoal font-semibold tracking-[0.12em] uppercase">
                  Revista completa
                  <span className="text-charcoal/60 normal-case tracking-normal font-medium">
                    {formData.reader_pages.length} pagina{formData.reader_pages.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <AdminImageGalleryField
                label="Leitor completo"
                values={formData.reader_pages}
                onChange={(nextValue) => setFormData({ ...formData, reader_pages: nextValue })}
                token={token}
                itemLabel="Pagina"
                emptyLabel="Nenhuma pagina completa adicionada ainda. Se preferir, voce ainda pode usar o modo avancado com base de pasta."
              />
            </div>

            <div className="rounded-[28px] border border-charcoal/10 bg-white/55 p-6 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-charcoal">Modo avancado do leitor</h2>
                <p className="text-sm text-stone mt-2">
                  Use estes campos apenas se voce ja tiver as paginas hospedadas em uma pasta. Se a
                  lista "Paginas do leitor" estiver preenchida, ela tem prioridade.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Quantidade de paginas</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.page_count}
                    onChange={(event) => setFormData({ ...formData, page_count: event.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                    placeholder="Ex.: 48"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Base das paginas</label>
                  <input
                    type="text"
                    value={formData.pages_base_path}
                    onChange={(event) => setFormData({ ...formData, pages_base_path: event.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                    placeholder="/assets/revista-pages"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-charcoal/10 bg-porcelain/70 px-5 py-5 text-sm text-stone">
              Fluxo recomendado: 1. envie a capa, 2. envie o PDF. O sistema ja tenta preencher
              automaticamente as paginas do leitor e as paginas de previa para deixar a revista no
              mesmo formato da edicao 6. Se quiser, depois voce ainda pode ajustar manualmente.
            </div>

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
                onClick={() => navigate('/admin/editions')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : isEdit ? 'Salvar alteracoes' : 'Criar edicao'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEditionForm;


