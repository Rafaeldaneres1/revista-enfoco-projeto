import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import SafeImage from './SafeImage';
import { apiUrl, normalizeUploadedImageUrl } from '../lib/api';

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/jpg'
]);

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const IMAGE_UPLOAD_TIMEOUT_MS = 3 * 60 * 1000;

const buildUploadId = (index) => `pending-${index}-${Date.now()}`;

const AdminImageGalleryField = ({
  label,
  values,
  onChange,
  token,
  emptyLabel = 'Nenhuma foto adicionada ainda.',
  itemLabel = 'Foto'
}) => {
  const normalizedValues = Array.isArray(values) ? values : [];
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingUploads, setPendingUploads] = useState([]);
  const [uploadSummary, setUploadSummary] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSuccessMessage(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    return () => {
      pendingUploads.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [pendingUploads]);

  const previewItems = useMemo(
    () => [
      ...normalizedValues.map((image, index) => ({
        kind: 'stored',
        key: `stored-${index}-${image}`,
        image,
        index
      })),
      ...pendingUploads.map((upload, index) => ({
        kind: 'pending',
        key: upload.id,
        image: upload.previewUrl,
        index: normalizedValues.length + index,
        status: upload.status
      }))
    ],
    [normalizedValues, pendingUploads]
  );

  const updateImage = (index, nextValue) => {
    const nextImages = [...normalizedValues];
    nextImages[index] = normalizeUploadedImageUrl(nextValue);
    onChange(nextImages.filter((value) => String(value || '').trim()));
  };

  const removeImage = (index) => {
    setError('');
    setSuccessMessage('');
    onChange(normalizedValues.filter((_, currentIndex) => currentIndex !== index));
  };

  const addImage = () => {
    setError('');
    setSuccessMessage('');
    onChange([...normalizedValues, '']);
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= normalizedValues.length) {
      return;
    }

    setError('');
    setSuccessMessage('');

    const nextImages = [...normalizedValues];
    const [movedItem] = nextImages.splice(index, 1);
    nextImages.splice(targetIndex, 0, movedItem);
    onChange(nextImages);
  };

  const clearAllImages = () => {
    setError('');
    setSuccessMessage('');
    onChange([]);
  };

  const openMultiUpload = () => {
    setError('');
    setSuccessMessage('');
    fileInputRef.current?.click();
  };

  const validateFiles = (files) => {
    if (!files.length) {
      return 'Nenhuma imagem foi selecionada.';
    }

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.has((file.type || '').toLowerCase())) {
        return 'Escolha imagens JPG, PNG, WEBP, GIF ou SVG.';
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return `Cada imagem deve ter no maximo ${MAX_FILE_SIZE_MB} MB.`;
      }
    }

    return '';
  };

  const cleanupPendingUrls = (uploads) => {
    uploads.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  };

  const handleMultipleFilesChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    setError('');
    setSuccessMessage('');

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    const queuedUploads = files.map((file, index) => ({
      id: buildUploadId(index),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'Enviando...'
    }));

    setPendingUploads(queuedUploads);
    setUploadSummary({ done: 0, total: files.length });
    setUploading(true);

    try {
      const uploadedUrls = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const payload = new FormData();
        payload.append('file', file);

        const response = await axios.post(apiUrl('/api/media/upload'), payload, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: IMAGE_UPLOAD_TIMEOUT_MS
        });

        uploadedUrls.push(normalizeUploadedImageUrl(response.data?.url || ''));
        setUploadSummary({ done: index + 1, total: files.length });
        setPendingUploads((current) =>
          current.map((item, currentIndex) =>
            currentIndex === index
              ? {
                  ...item,
                  status: 'Concluida'
                }
              : item
          )
        );
      }

      onChange([...normalizedValues, ...uploadedUrls].filter((value) => String(value || '').trim()));
      setSuccessMessage(
        `${uploadedUrls.length} ${uploadedUrls.length === 1 ? itemLabel.toLowerCase() : `${itemLabel.toLowerCase()}s`} adicionada${uploadedUrls.length === 1 ? '' : 's'} com sucesso.`
      );
    } catch (uploadError) {
      console.error('Error uploading gallery images:', uploadError);
      if (uploadError.code === 'ECONNABORTED') {
        setError('O envio demorou demais. Tente novamente ou reduza o tamanho das imagens.');
      } else {
        setError(uploadError?.response?.data?.detail || 'Nao foi possivel enviar as imagens selecionadas.');
      }
    } finally {
      cleanupPendingUrls(queuedUploads);
      setPendingUploads([]);
      setUploading(false);
      setUploadSummary({ done: 0, total: 0 });
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-medium text-charcoal">{label}</h3>
          <p className="text-xs text-stone mt-1">
            Selecione varias imagens de uma vez. Elas aparecem na ordem em que forem adicionadas.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={openMultiUpload}
            disabled={uploading}
            className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors disabled:opacity-60"
          >
            {uploading ? 'Enviando imagens...' : 'Enviar varias fotos'}
          </button>
          <button
            type="button"
            onClick={addImage}
            className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
          >
            Adicionar manualmente
          </button>
          {normalizedValues.length > 0 ? (
            <button
              type="button"
              onClick={clearAllImages}
              className="px-4 py-2 rounded-full border border-red-200 text-red-700 text-sm hover:bg-red-50 transition-colors"
            >
              Limpar tudo
            </button>
          ) : null}
        </div>
      </div>

      {normalizedValues.length > 0 ? (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-[20px] border border-charcoal/10 bg-white/55 px-4 py-3 text-sm text-charcoal">
          <span className="font-medium">
            {normalizedValues.length} {itemLabel.toLowerCase()}
            {normalizedValues.length === 1 ? '' : 's'} adicionada{normalizedValues.length === 1 ? '' : 's'}
          </span>
          <span className="text-xs text-stone">
            Reordene com as setas. A numeracao e atualizada automaticamente.
          </span>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleMultipleFilesChange}
        className="hidden"
      />

      {uploading ? (
        <div className="rounded-[24px] border border-charcoal/10 bg-white/70 px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-4 text-sm text-charcoal">
            <span>Enviando imagens...</span>
            <span className="font-semibold">
              {uploadSummary.done}/{uploadSummary.total}
            </span>
          </div>
          <div className="h-2 rounded-full bg-charcoal/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-royal-blue transition-all duration-300"
              style={{
                width: `${
                  uploadSummary.total
                    ? Math.round((uploadSummary.done / uploadSummary.total) * 100)
                    : 0
                }%`
              }}
            />
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="p-3 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      ) : null}

      {previewItems.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-charcoal/12 bg-white/40 p-5 text-sm text-stone">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {previewItems.map((item) => {
            const isStored = item.kind === 'stored';
            const pageNumber = item.index + 1;

            return (
              <div
                key={item.key}
                className="rounded-[24px] border border-charcoal/10 bg-white/65 overflow-hidden shadow-premium-sm"
              >
                {item.image ? (
                  <SafeImage
                    src={item.image}
                    alt={`${itemLabel} ${pageNumber}`}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="h-40 bg-porcelain flex items-center justify-center px-4 text-center text-stone text-sm">
                    URL manual da imagem
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-charcoal">
                        {itemLabel} {pageNumber}
                      </p>
                      <p className="text-xs text-stone">
                        {isStored ? `Posicao ${pageNumber} na lista` : item.status}
                      </p>
                    </div>

                    {isStored ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveImage(item.index, -1)}
                          disabled={item.index === 0}
                          className="w-9 h-9 rounded-full border border-charcoal/12 text-charcoal hover:bg-charcoal hover:text-white transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                          aria-label={`Subir ${itemLabel.toLowerCase()} ${pageNumber}`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(item.index, 1)}
                          disabled={item.index === normalizedValues.length - 1}
                          className="w-9 h-9 rounded-full border border-charcoal/12 text-charcoal hover:bg-charcoal hover:text-white transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                          aria-label={`Descer ${itemLabel.toLowerCase()} ${pageNumber}`}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(item.index)}
                          className="px-3 py-2 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-2 rounded-full bg-charcoal text-white text-[11px] uppercase tracking-[0.14em]">
                        {item.status}
                      </span>
                    )}
                  </div>

                  {isStored ? (
                    <input
                      type="text"
                      value={normalizedValues[item.index]}
                      onChange={(event) => updateImage(item.index, event.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-charcoal/10 bg-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                      placeholder="/uploads/pagina-revista.jpg"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminImageGalleryField;
