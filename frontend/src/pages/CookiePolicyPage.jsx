import React, { useEffect, useState } from 'react';
import { defaultPrivacySettings, fetchPrivacySettings } from '../lib/privacyConsent';

const renderParagraphs = (text) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const CookiePolicyPage = () => {
  const [settings, setSettings] = useState(defaultPrivacySettings);

  useEffect(() => {
    let isMounted = true;

    fetchPrivacySettings()
      .then((data) => {
        if (isMounted) {
          setSettings({ ...defaultPrivacySettings, ...data });
        }
      })
      .catch(() => {
        if (isMounted) {
          setSettings(defaultPrivacySettings);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white">
      <section className="bg-charcoal text-white">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-28">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            Cookies
          </p>
          <h1 className="font-display text-5xl font-bold md:text-6xl">
            Política de Cookies
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/72">
            Entenda quais categorias podem ser usadas e como alterar suas preferências.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14 md:py-18">
        <div className="mb-10 border border-charcoal/10 bg-porcelain p-6 text-sm text-stone">
          <p><strong className="text-charcoal">Necessários:</strong> sempre ativos.</p>
          <p><strong className="text-charcoal">Analytics:</strong> {settings.analytics_enabled ? 'configurável pelo leitor.' : 'desativado no momento.'}</p>
          <p><strong className="text-charcoal">Marketing:</strong> {settings.marketing_enabled ? 'configurável pelo leitor.' : 'desativado no momento.'}</p>
          <p><strong className="text-charcoal">Versão:</strong> {settings.policy_version}</p>
        </div>

        <div className="prose prose-stone max-w-none">
          {renderParagraphs(settings.cookie_policy_text).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CookiePolicyPage;
