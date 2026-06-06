import { apiUrl } from './api';

export const PRIVACY_CONSENT_STORAGE_KEY = 'revista_enfoco_lgpd_consent';
export const PRIVACY_PREFERENCES_EVENT = 'revista-enfoco-open-privacy-preferences';

export const defaultPrivacySettings = {
  policy_version: '2026.06.01',
  company_name: 'Revista Enfoco',
  cnpj: '61.432.454/0001-26',
  privacy_contact_email: 'Comercial@revistaenfoco.com.br',
  privacy_policy_text:
    'A Revista Enfoco respeita a privacidade dos leitores e trata dados pessoais apenas quando necessario para funcionamento do site, seguranca, moderacao de comentarios, atendimento, comunicacao institucional e medicao de audiencia autorizada pelo usuario.',
  cookie_policy_text:
    'A Revista Enfoco usa cookies necessarios para funcionamento basico, seguranca, sessao administrativa e preferencias essenciais. Cookies de analytics e marketing so serao carregados apos consentimento do leitor.',
  analytics_enabled: false,
  marketing_enabled: false,
  google_analytics_id: '',
  google_ads_id: '',
  meta_pixel_id: '',
  consent_banner_title: 'Privacidade e cookies',
  consent_banner_text:
    'Usamos cookies necessarios para o site funcionar. Com sua permissao, tambem usamos analytics e marketing para melhorar a experiencia e medir campanhas.'
};

export const readPrivacyConsent = (policyVersion) => {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    if (!parsed || parsed.policy_version !== policyVersion) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const savePrivacyConsent = ({ policyVersion, analytics, marketing }) => {
  const consent = {
    policy_version: policyVersion,
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    saved_at: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  }

  return consent;
};

const appendScriptOnce = ({ id, src, inline }) => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  if (src) {
    script.src = src;
  }
  if (inline) {
    script.text = inline;
  }
  document.head.appendChild(script);
};

const ensureGtag = (trackingId) => {
  const cleanId = String(trackingId || '').trim();
  if (!cleanId || typeof window === 'undefined') return;

  appendScriptOnce({
    id: `enfoco-gtag-loader-${cleanId}`,
    src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cleanId)}`
  });

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  if (!window.__enfocoGtagInitialized) {
    window.gtag('js', new Date());
    window.__enfocoGtagInitialized = true;
  }

  if (!window.__enfocoGtagConfigured) {
    window.__enfocoGtagConfigured = {};
  }

  if (!window.__enfocoGtagConfigured[cleanId]) {
    window.gtag('config', cleanId, { anonymize_ip: true });
    window.__enfocoGtagConfigured[cleanId] = true;
  }
};

const ensureMetaPixel = (pixelId) => {
  const cleanId = String(pixelId || '').trim();
  if (!cleanId || typeof window === 'undefined') return;

  if (!window.fbq) {
    const fbq = function fbq() {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
      } else {
        fbq.queue.push(arguments);
      }
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }

  appendScriptOnce({
    id: 'enfoco-meta-pixel-loader',
    src: 'https://connect.facebook.net/en_US/fbevents.js'
  });

  if (window.fbq && !window.__enfocoMetaPixelInitialized) {
    window.fbq('init', cleanId);
    window.fbq('track', 'PageView');
    window.__enfocoMetaPixelInitialized = true;
  }
};

export const applyPrivacyConsent = (settings, consent) => {
  if (!settings || !consent) return;

  if (settings.analytics_enabled && consent.analytics) {
    ensureGtag(settings.google_analytics_id);
  }

  if (settings.marketing_enabled && consent.marketing) {
    ensureGtag(settings.google_ads_id);
    ensureMetaPixel(settings.meta_pixel_id);
  }
};

export const fetchPrivacySettings = async () => {
  const response = await fetch(apiUrl('/api/privacy-settings'), {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Privacy settings unavailable');
  }

  return response.json();
};
