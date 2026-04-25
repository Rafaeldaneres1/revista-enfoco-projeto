import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl, normalizeUploadedImageUrl } from '../lib/api';
import SafeImage from './SafeImage';

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
const POSITION_PRESETS = [
  { label: 'Topo', value: 'center top' },
  { label: 'Rosto', value: 'center 18%' },
  { label: 'Centro', value: 'center center' },
  { label: 'Paisagem', value: 'center 42%' },
  { label: 'Base', value: 'center 70%' }
];

const AdminImageField = ({
  label,
  value,
  onChange,
  token,
  placeholder = '/uploads/exemplo.jpg',
  helperText = 'Voce pode colar uma URL ou enviar uma imagem do computador.',
  positionValue = '',
  onPositionChange,
  positionLabel = 'Posicao da imagem',
  positionPlaceholder = 'Ex.: center 20%'
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const openFilePicker = () => {
    setError('');
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');

    if (!ACCEPTED_IMAGE_TYPES.has((file.type || '').toLowerCase())) {
      setError('Escolha uma imagem JPG, PNG, WEBP, GIF ou SVG.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`A imagem deve ter no máximo ${MAX_FILE_SIZE_MB} MB.`);
      event.target.value = '';
      return;
    }

    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setUploading(true);

    const payload = new FormData();
    payload.append('file', file);

    try {
      const response = await axios.post(apiUrl('/api/media/upload'), payload, {
        headers: {}
      });

      onChange(normalizeUploadedImageUrl(response.data?.url || ''));
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      setError(uploadError?.response?.data?.detail || 'Não foi possível enviar a imagem.');
      setLocalPreview('');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const previewSource = localPreview || value;
  const hasPositionControls = typeof onPositionChange === 'function';

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-charcoal">{label}</label>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setError('');
            onChange(normalizeUploadedImageUrl(event.target.value));
          }}
          className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          placeholder={placeholder}
        />

        <button
          type="button"
          onClick={openFilePicker}
          disabled={uploading}
          className="shrink-0 px-5 py-3 rounded-full border border-charcoal/14 text-charcoal hover:bg-white/80 transition-colors disabled:opacity-60"
        >
          {uploading ? 'Enviando...' : 'Enviar imagem'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-stone">
        {helperText} Formatos aceitos: JPG, PNG, WEBP, GIF e SVG.
      </p>

      {hasPositionControls ? (
        <div className="rounded-[24px] border border-charcoal/10 bg-white/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {POSITION_PRESETS.map((preset) => {
              const isActive = positionValue === preset.value;

              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onPositionChange(preset.value)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
                    isActive
                      ? 'bg-charcoal text-white'
                      : 'border border-charcoal/12 text-charcoal hover:bg-white/90'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">{positionLabel}</label>
            <input
              type="text"
              value={positionValue}
              onChange={(event) => onPositionChange(event.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/60 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              placeholder={positionPlaceholder}
            />
            <p className="mt-2 text-xs text-stone">
              Use os atalhos para enquadrar mais rapido. Retratos costumam funcionar bem com{' '}
              <strong>center 18%</strong>; paisagens com <strong>center center</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-charcoal/10 bg-white/35 px-4 py-3 text-xs text-stone">
          Dica de enquadramento: pessoas normalmente ficam melhor com <strong>center 18%</strong> e
          paisagens com <strong>center center</strong>. Nas telas que aceitam posicao de imagem,
          esses atalhos aparecem automaticamente.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {previewSource && (
        <div className="rounded-[24px] border border-charcoal/10 bg-white/60 p-4">
          <SafeImage
            src={previewSource}
            alt={label}
            className="w-full h-52 object-cover rounded-[18px]"
          />
        </div>
      )}
    </div>
  );
};

export default AdminImageField;

