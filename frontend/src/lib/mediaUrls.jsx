import { BACKEND_URL } from './publicApi';

const normalizePath = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().replace(/\\/g, '/');
  if (!trimmed) return null;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const isPublicFrontendAsset = (value) =>
  value.startsWith('/media/') || value.startsWith('/assets/');

const isBackendServedMedia = (value) =>
  value.startsWith('/uploads/') || value.startsWith('/api/media/');

export const resolveAssetUrl = (value) => {
  if (!value) return null;

  const normalizedValue = String(value).trim();
  if (
    /^https?:\/\//i.test(normalizedValue) ||
    normalizedValue.startsWith('data:') ||
    normalizedValue.startsWith('blob:')
  ) {
    return normalizedValue;
  }

  const normalizedPath = normalizePath(normalizedValue);
  if (!normalizedPath) return null;
  if (isPublicFrontendAsset(normalizedPath)) return normalizedPath;
  if (isBackendServedMedia(normalizedPath)) {
    return BACKEND_URL ? `${BACKEND_URL}${normalizedPath}` : normalizedPath;
  }
  return BACKEND_URL ? `${BACKEND_URL}${normalizedPath}` : normalizedPath;
};

