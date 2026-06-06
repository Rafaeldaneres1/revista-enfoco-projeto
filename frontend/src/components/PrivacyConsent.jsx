import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import {
  PRIVACY_PREFERENCES_EVENT,
  applyPrivacyConsent,
  defaultPrivacySettings,
  fetchPrivacySettings,
  readPrivacyConsent,
  savePrivacyConsent
} from '../lib/privacyConsent';

const buildPreferences = (settings, consent) => ({
  analytics: Boolean(consent?.analytics) && Boolean(settings.analytics_enabled),
  marketing: Boolean(consent?.marketing) && Boolean(settings.marketing_enabled)
});

const PrivacyConsent = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [settings, setSettings] = useState(defaultPrivacySettings);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [preferences, setPreferences] = useState(() => buildPreferences(defaultPrivacySettings, null));

  useEffect(() => {
    if (isAdmin) return;

    let isMounted = true;

    const loadSettings = async () => {
      try {
        const remoteSettings = await fetchPrivacySettings();
        if (!isMounted) return;

        const mergedSettings = { ...defaultPrivacySettings, ...remoteSettings };
        const storedConsent = readPrivacyConsent(mergedSettings.policy_version);
        setSettings(mergedSettings);
        setPreferences(buildPreferences(mergedSettings, storedConsent));
        if (storedConsent) {
          applyPrivacyConsent(mergedSettings, storedConsent);
          setVisible(false);
        } else {
          setVisible(true);
        }
      } catch {
        if (!isMounted) return;
        const storedConsent = readPrivacyConsent(defaultPrivacySettings.policy_version);
        setPreferences(buildPreferences(defaultPrivacySettings, storedConsent));
        setVisible(!storedConsent);
      } finally {
        if (isMounted) {
          setReady(true);
        }
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return undefined;

    const openPreferences = () => {
      const storedConsent = readPrivacyConsent(settings.policy_version);
      setPreferences(buildPreferences(settings, storedConsent));
      setModalOpen(true);
      setVisible(false);
    };

    window.addEventListener(PRIVACY_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(PRIVACY_PREFERENCES_EVENT, openPreferences);
  }, [isAdmin, settings]);

  const categories = useMemo(
    () => [
      {
        key: 'analytics',
        title: 'Analytics',
        description: 'Ajuda a medir audiência, desempenho das páginas e origem dos acessos.',
        enabled: settings.analytics_enabled
      },
      {
        key: 'marketing',
        title: 'Marketing',
        description: 'Permite Meta Pixel, Google Ads e remarketing para campanhas de tráfego pago.',
        enabled: settings.marketing_enabled
      }
    ],
    [settings]
  );

  const commitConsent = (nextPreferences) => {
    const consent = savePrivacyConsent({
      policyVersion: settings.policy_version,
      analytics: nextPreferences.analytics && settings.analytics_enabled,
      marketing: nextPreferences.marketing && settings.marketing_enabled
    });

    setPreferences(buildPreferences(settings, consent));
    applyPrivacyConsent(settings, consent);
    setVisible(false);
    setModalOpen(false);
  };

  if (isAdmin || !ready) {
    return null;
  }

  return (
    <>
      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 sm:px-6">
          <div className="mx-auto max-w-5xl border border-charcoal/10 bg-white shadow-2xl">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-3 w-32">
                  <Logo />
                </div>
                <h2 className="font-display text-2xl font-bold text-charcoal">
                  {settings.consent_banner_title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  {settings.consent_banner_text}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone">
                  <Link to="/politica-de-privacidade" className="underline hover:text-charcoal">
                    Política de Privacidade
                  </Link>
                  <Link to="/politica-de-cookies" className="underline hover:text-charcoal">
                    Política de Cookies
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => commitConsent({ analytics: true, marketing: true })}
                  className="bg-charcoal px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-charcoal-light"
                >
                  Aceitar todos
                </button>
                <button
                  type="button"
                  onClick={() => commitConsent({ analytics: false, marketing: false })}
                  className="border border-charcoal/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-charcoal transition-colors hover:bg-porcelain"
                >
                  Rejeitar não essenciais
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(true);
                    setVisible(false);
                  }}
                  className="px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-charcoal underline underline-offset-4"
                >
                  Gerenciar preferências
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 px-4 py-5 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-royal-blue">
                  LGPD
                </p>
                <h2 className="font-display text-3xl font-bold text-charcoal">
                  Preferências de privacidade
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  Escolha quais categorias podem ser usadas neste navegador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-10 w-10 border border-charcoal/10 text-xl leading-none text-charcoal hover:bg-porcelain"
                aria-label="Fechar preferências"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="border border-charcoal/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-charcoal">Necessários</h3>
                    <p className="mt-1 text-sm text-stone">
                      Login, segurança, funcionamento básico e preferências essenciais.
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/60">
                    Sempre ativo
                  </span>
                </div>
              </div>

              {categories.map((category) => (
                <label
                  key={category.key}
                  className={`block border p-4 ${
                    category.enabled ? 'border-charcoal/10' : 'border-charcoal/5 bg-porcelain/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-charcoal">{category.title}</h3>
                      <p className="mt-1 text-sm text-stone">{category.description}</p>
                      {!category.enabled && (
                        <p className="mt-2 text-xs text-stone">Categoria desativada no painel.</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(preferences[category.key])}
                      disabled={!category.enabled}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          [category.key]: event.target.checked
                        }))
                      }
                      className="mt-1 h-5 w-5 accent-charcoal"
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => commitConsent({ analytics: false, marketing: false })}
                className="border border-charcoal/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-charcoal hover:bg-porcelain"
              >
                Rejeitar não essenciais
              </button>
              <button
                type="button"
                onClick={() => commitConsent(preferences)}
                className="bg-charcoal px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-charcoal-light"
              >
                Salvar preferências
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrivacyConsent;
