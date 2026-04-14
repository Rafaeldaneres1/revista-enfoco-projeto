import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { siteContent } from '../data/siteContent';
import AdminImageField from '../components/AdminImageField';

const buildFallbackForm = () => ({
  location: siteContent.location || 'Santa Maria - RS',
  cover_image: siteContent.about.coverImage || '',
  eyebrow: siteContent.about.eyebrow || '',
  hero_title: siteContent.about.heroTitle || '',
  intro: siteContent.about.intro || '',
  paragraphs: (siteContent.about.paragraphs || []).join('\n\n'),
  mission: siteContent.about.mission || '',
  value_1_title: siteContent.about.values?.[0]?.title || '',
  value_1_description: siteContent.about.values?.[0]?.description || '',
  value_2_title: siteContent.about.values?.[1]?.title || '',
  value_2_description: siteContent.about.values?.[1]?.description || '',
  value_3_title: siteContent.about.values?.[2]?.title || '',
  value_3_description: siteContent.about.values?.[2]?.description || '',
  value_4_title: siteContent.about.values?.[3]?.title || '',
  value_4_description: siteContent.about.values?.[3]?.description || '',
  team_title: siteContent.about.teamTitle || 'Equipe Editorial',
  team_description:
    siteContent.about.teamDescription ||
    'Rostos e vozes que ajudam a construir a presença editorial da EnFoco com sensibilidade e identidade.',
  contact_title: siteContent.about.contactTitle || 'Entre em Contato',
  contact_description:
    siteContent.about.contactDescription ||
    'Os canais oficiais serão publicados assim que o material institucional definitivo for enviado.',
  contact_email: siteContent.contact.email || '',
  contact_phone: siteContent.contact.phone || '',
  contact_city: siteContent.contact.city || siteContent.location || 'Santa Maria - RS',
  instagram: siteContent.contact.social?.instagram || '',
  facebook: siteContent.contact.social?.facebook || '',
  linkedin: siteContent.contact.social?.linkedin || ''
});

const AdminAboutForm = () => {
  const navigate = useNavigate();
  const token = 'cookie-session';
  const [formData, setFormData] = useState(buildFallbackForm);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchAbout = async () => {
      try {
        const response = await axios.get(apiUrl('/api/about'), {
          headers: {  }
        });

        const about = response.data;
        setFormData({
          location: about.location || '',
          cover_image: about.cover_image || '',
          eyebrow: about.eyebrow || '',
          hero_title: about.hero_title || '',
          intro: about.intro || '',
          paragraphs: Array.isArray(about.paragraphs) ? about.paragraphs.join('\n\n') : '',
          mission: about.mission || '',
          value_1_title: about.values?.[0]?.title || '',
          value_1_description: about.values?.[0]?.description || '',
          value_2_title: about.values?.[1]?.title || '',
          value_2_description: about.values?.[1]?.description || '',
          value_3_title: about.values?.[2]?.title || '',
          value_3_description: about.values?.[2]?.description || '',
          value_4_title: about.values?.[3]?.title || '',
          value_4_description: about.values?.[3]?.description || '',
          team_title: about.team_title || 'Equipe Editorial',
          team_description: about.team_description || '',
          contact_title: about.contact_title || 'Entre em Contato',
          contact_description: about.contact_description || '',
          contact_email: about.contact_email || '',
          contact_phone: about.contact_phone || '',
          contact_city: about.contact_city || '',
          instagram: about.social?.instagram || '',
          facebook: about.social?.facebook || '',
          linkedin: about.social?.linkedin || ''
        });
      } catch (fetchError) {
        console.error('Error fetching about settings:', fetchError);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAbout();
  }, [token, navigate]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const values = [
      { title: formData.value_1_title, description: formData.value_1_description },
      { title: formData.value_2_title, description: formData.value_2_description },
      { title: formData.value_3_title, description: formData.value_3_description },
      { title: formData.value_4_title, description: formData.value_4_description }
    ].filter((item) => item.title || item.description);

    const payload = {
      location: formData.location,
      cover_image: formData.cover_image || '',
      eyebrow: formData.eyebrow,
      hero_title: formData.hero_title,
      intro: formData.intro,
      paragraphs: formData.paragraphs
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean),
      mission: formData.mission,
      values,
      team_title: formData.team_title,
      team_description: formData.team_description,
      contact_title: formData.contact_title,
      contact_description: formData.contact_description,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,
      contact_city: formData.contact_city,
      social: {
        instagram: formData.instagram,
        facebook: formData.facebook,
        linkedin: formData.linkedin
      }
    };

    try {
      await axios.put(apiUrl('/api/about'), payload, {
        headers: {  }
      });
      navigate('/admin/dashboard');
    } catch (saveError) {
      console.error('Error saving about settings:', saveError);
      setError('Erro ao salvar a página Quem Somos');
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
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold mb-2">Editar Quem Somos</h1>
              <p className="text-stone">Aqui você controla a capa, os textos institucionais, valores e contatos da página.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-5 py-3 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
            >
              Voltar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Hero / Capa</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Localização</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(event) => handleChange('location', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <AdminImageField
                    label="Imagem de capa"
                    value={formData.cover_image}
                    onChange={(nextValue) => handleChange('cover_image', nextValue)}
                    token={token}
                    placeholder="/media/capa-quem-somos.jpg"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Sobretítulo</label>
                  <input
                    type="text"
                    value={formData.eyebrow}
                    onChange={(event) => handleChange('eyebrow', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Título principal</label>
                  <input
                    type="text"
                    value={formData.hero_title}
                    onChange={(event) => handleChange('hero_title', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Texto de introdução</label>
                <textarea
                  value={formData.intro}
                  onChange={(event) => handleChange('intro', event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[120px]"
                />
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Corpo do texto</h2>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Parágrafos</label>
                <textarea
                  value={formData.paragraphs}
                  onChange={(event) => handleChange('paragraphs', event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[280px]"
                />
                <p className="text-xs text-stone mt-2">Separe os parágrafos com uma linha em branco.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Missão</label>
                <textarea
                  value={formData.mission}
                  onChange={(event) => handleChange('mission', event.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20 min-h-[110px]"
                />
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Valores</h2>
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Título do valor {index}</label>
                    <input
                      type="text"
                      value={formData[`value_${index}_title`]}
                      onChange={(event) => handleChange(`value_${index}_title`, event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Descrição do valor {index}</label>
                    <input
                      type="text"
                      value={formData[`value_${index}_description`]}
                      onChange={(event) => handleChange(`value_${index}_description`, event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                    />
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Equipe Editorial</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Título da seção</label>
                  <input
                    type="text"
                    value={formData.team_title}
                    onChange={(event) => handleChange('team_title', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Descrição da seção</label>
                  <input
                    type="text"
                    value={formData.team_description}
                    onChange={(event) => handleChange('team_description', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">Contato</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Título da seção</label>
                  <input
                    type="text"
                    value={formData.contact_title}
                    onChange={(event) => handleChange('contact_title', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Descrição da seção</label>
                  <input
                    type="text"
                    value={formData.contact_description}
                    onChange={(event) => handleChange('contact_description', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Email</label>
                  <input
                    type="text"
                    value={formData.contact_email}
                    onChange={(event) => handleChange('contact_email', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Telefone</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(event) => handleChange('contact_phone', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Cidade / base editorial</label>
                  <input
                    type="text"
                    value={formData.contact_city}
                    onChange={(event) => handleChange('contact_city', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(event) => handleChange('instagram', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Facebook</label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(event) => handleChange('facebook', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">LinkedIn</label>
                  <input
                    type="text"
                    value={formData.linkedin}
                    onChange={(event) => handleChange('linkedin', event.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                  />
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 py-3 rounded-full border border-charcoal/16 text-charcoal hover:bg-white/78 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Quem Somos'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAboutForm;


