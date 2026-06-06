import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { defaultPrivacySettings } from '../lib/privacyConsent';

const buildInitialForm = () => ({
  policy_version: defaultPrivacySettings.policy_version,
  company_name: defaultPrivacySettings.company_name,
  cnpj: defaultPrivacySettings.cnpj,
  privacy_contact_email: defaultPrivacySettings.privacy_contact_email,
  privacy_policy_text: defaultPrivacySettings.privacy_policy_text,
  cookie_policy_text: defaultPrivacySettings.cookie_policy_text,
  analytics_enabled: false,
  marketing_enabled: false,
  google_analytics_id: '',
  google_ads_id: '',
  meta_pixel_id: '',
  consent_banner_title: defaultPrivacySettings.consent_banner_title,
  consent_banner_text: defaultPrivacySettings.consent_banner_text
});

const AdminPrivacyForm = () => {
  const navigate = useNavigate();
  const token = 'cookie-session';
  const [formData, setFormData] = useState(buildInitialForm);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchSettings = async () => {
      try {
        const response = await axios.get(apiUrl('/api/privacy-settings'), { headers: {} });
        setFormData({
          ...buildInitialForm(),
          ...(response.data || {})
        });
      } catch (fetchError) {
        console.error('Error fetching privacy settings:', fetchError);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSettings();
  }, [navigate, token]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await axios.put(apiUrl('/api/privacy-settings'), formData, { headers: {} });
      setMessage('Configurações de privacidade salvas com sucesso.');
    } catch (saveError) {
      console.error('Error saving privacy settings:', saveError);
      setError(saveError?.response?.data?.detail || 'Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
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
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl font-bold">LGPD / Privacidade</h1>
              <p className="text-stone mt-2">
                Configure políticas, consentimento e pixels usados em campanhas.
              </p>
            </div>
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
            >
              Voltar
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="enfoco-glass rounded-[32px] p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold mb-5">Identificação e versão</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-charcoal">Versão da política *</span>
                <input
                  value={formData.policy_version}
                  onChange={(event) => handleChange('policy_version', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                  required
                />
                <span className="mt-1 block text-xs text-stone">
                  Ao alterar, o banner de consentimento aparece novamente para os leitores.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-charcoal">Contato LGPD *</span>
                <input
                  type="email"
                  value={formData.privacy_contact_email}
                  onChange={(event) => handleChange('privacy_contact_email', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-charcoal">Nome da empresa *</span>
                <input
                  value={formData.company_name}
                  onChange={(event) => handleChange('company_name', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-charcoal">CNPJ *</span>
                <input
                  value={formData.cnpj}
                  onChange={(event) => handleChange('cnpj', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                  required
                />
              </label>
            </div>
          </div>

          <div className="enfoco-glass rounded-[32px] p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold mb-5">Banner de consentimento</h2>
            <div className="grid gap-4">
              <label className="block">
                <span className="text-sm font-medium text-charcoal">Título do banner *</span>
                <input
                  value={formData.consent_banner_title}
                  onChange={(event) => handleChange('consent_banner_title', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-charcoal">Texto do banner *</span>
                <textarea
                  value={formData.consent_banner_text}
                  onChange={(event) => handleChange('consent_banner_text', event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue resize-y"
                  required
                />
              </label>
            </div>
          </div>

          <div className="enfoco-glass rounded-[32px] p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold mb-5">Pixels e medição</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <label className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-white/70 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(formData.analytics_enabled)}
                  onChange={(event) => handleChange('analytics_enabled', event.target.checked)}
                  className="mt-1 h-4 w-4 accent-charcoal"
                />
                <span>
                  <span className="block font-medium text-charcoal">Ativar Analytics</span>
                  <span className="block text-sm text-stone">
                    Google Analytics só será carregado após consentimento.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-white/70 p-4">
                <input
                  type="checkbox"
                  checked={Boolean(formData.marketing_enabled)}
                  onChange={(event) => handleChange('marketing_enabled', event.target.checked)}
                  className="mt-1 h-4 w-4 accent-charcoal"
                />
                <span>
                  <span className="block font-medium text-charcoal">Ativar Marketing</span>
                  <span className="block text-sm text-stone">
                    Meta Pixel e Google Ads só serão carregados após consentimento.
                  </span>
                </span>
              </label>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-charcoal">Google Analytics ID</span>
                <input
                  placeholder="G-XXXXXXXXXX"
                  value={formData.google_analytics_id || ''}
                  onChange={(event) => handleChange('google_analytics_id', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-charcoal">Google Ads ID</span>
                <input
                  placeholder="AW-XXXXXXXXXX"
                  value={formData.google_ads_id || ''}
                  onChange={(event) => handleChange('google_ads_id', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-charcoal">Meta Pixel ID</span>
                <input
                  placeholder="1234567890"
                  value={formData.meta_pixel_id || ''}
                  onChange={(event) => handleChange('meta_pixel_id', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue"
                />
              </label>
            </div>
          </div>

          <div className="enfoco-glass rounded-[32px] p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold mb-5">Textos legais</h2>
            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm font-medium text-charcoal">Política de Privacidade *</span>
                <textarea
                  value={formData.privacy_policy_text}
                  onChange={(event) => handleChange('privacy_policy_text', event.target.value)}
                  rows={9}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue resize-y"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-charcoal">Política de Cookies *</span>
                <textarea
                  value={formData.cookie_policy_text}
                  onChange={(event) => handleChange('cookie_policy_text', event.target.value)}
                  rows={7}
                  className="mt-2 w-full rounded-2xl border border-charcoal/12 bg-white px-4 py-3 outline-none focus:border-royal-blue resize-y"
                  required
                />
              </label>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-sm text-green-800">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link
              to="/admin/dashboard"
              className="px-6 py-3 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar LGPD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPrivacyForm;
