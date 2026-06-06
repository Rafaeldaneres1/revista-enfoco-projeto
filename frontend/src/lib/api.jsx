import axios from 'axios';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const HAS_BACKEND = Boolean(BACKEND_URL);
const IS_NGROK_BACKEND = /ngrok-(free\.app|free\.dev)|ngrok\.io/i.test(BACKEND_URL);
const AUTH_TOKEN_KEY = 'revista_enfoco_admin_token';

axios.defaults.withCredentials = true;

if (IS_NGROK_BACKEND) {
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
}

export const getStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
};

export const setStoredAuthToken = (token) => {
  if (typeof window === 'undefined') {
    return;
  }

  const cleanToken = String(token || '').trim();
  if (cleanToken) {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, cleanToken);
    axios.defaults.headers.common.Authorization = `Bearer ${cleanToken}`;
  } else {
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    delete axios.defaults.headers.common.Authorization;
  }
};

const initialAuthToken = getStoredAuthToken();
if (initialAuthToken) {
  axios.defaults.headers.common.Authorization = `Bearer ${initialAuthToken}`;
}

axios.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

const normalizePath = (value) => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim().replace(/\\/g, '/');
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const isPublicFrontendAsset = (value) =>
  value.startsWith('/media/') || value.startsWith('/assets/');

const isBackendServedMedia = (value) =>
  value.startsWith('/uploads/') || value.startsWith('/api/media/');

export const resolveAssetUrl = (value) => {
  if (!value) {
    return null;
  }

  const normalizedValue = String(value).trim();

  if (
    /^https?:\/\//i.test(normalizedValue) ||
    normalizedValue.startsWith('data:') ||
    normalizedValue.startsWith('blob:')
  ) {
    return normalizedValue;
  }

  const normalizedPath = normalizePath(normalizedValue);
  if (!normalizedPath) {
    return null;
  }

  if (isPublicFrontendAsset(normalizedPath)) {
    return normalizedPath;
  }

  if (isBackendServedMedia(normalizedPath)) {
    return BACKEND_URL ? `${BACKEND_URL}${normalizedPath}` : normalizedPath;
  }

  if (!BACKEND_URL) {
    return normalizedPath;
  }

  return `${BACKEND_URL}${normalizedPath}`;
};

export const isStoredImagePath = (value) => {
  const normalizedPath = normalizePath(value);
  if (!normalizedPath) {
    return false;
  }

  return isPublicFrontendAsset(normalizedPath) || isBackendServedMedia(normalizedPath);
};

export const normalizeUploadedImageUrl = (value) => {
  if (!value) {
    return '';
  }

  const normalizedValue = String(value).trim();
  if (
    /^https?:\/\//i.test(normalizedValue) ||
    normalizedValue.startsWith('data:') ||
    normalizedValue.startsWith('blob:')
  ) {
    return normalizedValue;
  }

  const normalizedPath = normalizePath(normalizedValue);
  if (!normalizedPath) {
    return '';
  }

  if (isBackendServedMedia(normalizedPath) || isPublicFrontendAsset(normalizedPath)) {
    return normalizedPath;
  }

  return normalizedPath;
};

export {
  AUTH_TOKEN_KEY,
  BACKEND_URL,
  HAS_BACKEND,
  normalizePath
};
