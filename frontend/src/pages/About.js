import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { normalizeEditorialText } from '../lib/text';
import { siteContent } from '../data/siteContent';
import SafeImage from '../components/SafeImage';

const buildFallbackAboutSettings = () => ({
  location: siteContent.location,
  cover_image: siteContent.about.coverImage || '',
  eyebrow: siteContent.about.eyebrow,
  hero_title: siteContent.about.heroTitle,
  intro: siteContent.about.intro,
  paragraphs: siteContent.about.paragraphs,
  mission: siteContent.about.mission,
  values: siteContent.about.values,
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
  contact_city: siteContent.contact.city || siteContent.location,
  social: siteContent.contact.social || {}
});

const About = () => {
  const [aboutSettings, setAboutSettings] = useState(buildFallbackAboutSettings());
  const [teamMembers, setTeamMembers] = useState(siteContent.team || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutData = async () => {
      if (!HAS_BACKEND) {
        setLoading(false);
        return;
      }

      try {
        const [aboutResponse, teamResponse] = await Promise.allSettled([
          axios.get(apiUrl('/api/about')),
          axios.get(apiUrl('/api/team?published=true'))
        ]);

        if (
          aboutResponse.status === 'fulfilled' &&
          aboutResponse.value.data &&
          typeof aboutResponse.value.data === 'object' &&
          !Array.isArray(aboutResponse.value.data)
        ) {
          setAboutSettings(aboutResponse.value.data);
        }

        if (teamResponse.status === 'fulfilled' && Array.isArray(teamResponse.value.data) && teamResponse.value.data.length) {
          setTeamMembers(teamResponse.value.data);
        }
      } catch (error) {
        console.error('Error fetching about page content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  const socialLinks = useMemo(
    () =>
      [
        { label: 'Instagram', href: aboutSettings.social?.instagram },
        { label: 'Facebook', href: aboutSettings.social?.facebook },
        { label: 'LinkedIn', href: aboutSettings.social?.linkedin }
      ].filter((item) => item.href),
    [aboutSettings.social]
  );

  const leadMember = teamMembers[0] || null;
  const secondaryMembers = teamMembers.slice(1);

  if (loading && !leadMember) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden text-white">
        {aboutSettings.cover_image ? (
          <>
            <SafeImage
              src={aboutSettings.cover_image}
              alt={normalizeEditorialText(aboutSettings.hero_title)}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.58),rgba(17,24,39,0.84))]"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-charcoal"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.04),_transparent_55%)]"></div>
          </>
        )}

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 py-32 lg:py-44">
          <p className="text-xs font-sans tracking-[0.25em] uppercase text-white/70 mb-8 font-semibold animate-slide-down">
            {normalizeEditorialText(aboutSettings.location)}
          </p>
          <p className="label-premium text-white/70 mb-6 animate-slide-up">
            {normalizeEditorialText(aboutSettings.eyebrow)}
          </p>
          <h1 className="font-display text-5xl lg:text-7xl font-bold leading-[1.1] whitespace-pre-line mb-10 animate-slide-up">
            {normalizeEditorialText(aboutSettings.hero_title)}
          </h1>
          <p className="text-lg lg:text-xl text-white/85 max-w-3xl leading-relaxed font-light">
            {normalizeEditorialText(aboutSettings.intro)}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-28 lg:py-32">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-12 text-lg text-stone leading-relaxed">
            {(aboutSettings.paragraphs || []).map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} className="animate-slide-up text-opacity-90" style={{ animationDelay: `${index * 0.08}s` }}>
                {normalizeEditorialText(paragraph)}
              </p>
            ))}

            <div className="py-20 my-20 border-y border-gray-200 animate-slide-up">
              <h2 className="font-display text-4xl font-bold text-charcoal mb-8 text-center">
                Nossa Missão
              </h2>
              <p className="text-center text-xl text-charcoal font-light leading-relaxed">
                {normalizeEditorialText(aboutSettings.mission)}
              </p>
            </div>

            <h2 className="font-display text-3xl font-bold text-charcoal mt-24 mb-12 animate-slide-up">
              Nossos Valores
            </h2>
            <ul className="space-y-7">
              {(aboutSettings.values || []).map((value, index) => (
                <li key={`${value.title}-${index}`} className="flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${index * 0.08}s` }}>
                  <svg className="w-6 h-6 text-royal-blue flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong className="text-charcoal font-semibold">{normalizeEditorialText(value.title)}:</strong>{' '}
                    <span className="text-opacity-90">{normalizeEditorialText(value.description)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-porcelain py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24 animate-slide-up">
            <h2 className="font-display text-4xl font-bold text-charcoal mb-6">
              {normalizeEditorialText(aboutSettings.team_title)}
            </h2>
            <p className="text-lg text-stone max-w-2xl mx-auto font-light">
              {normalizeEditorialText(aboutSettings.team_description)}
            </p>
          </div>

          {leadMember ? (
            <div className="space-y-16">
              <div className="max-w-5xl mx-auto animate-scale-in">
                <div className="grid lg:grid-cols-[340px_1fr] bg-white border border-gray-200 overflow-hidden shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
                  <div className="relative min-h-[420px] bg-stone-100">
                    <SafeImage
                      src={leadMember.image}
                      alt={normalizeEditorialText(leadMember.name)}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: 'center 20%' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent"></div>
                  </div>

                  <div className="p-10 lg:p-14 flex flex-col justify-center">
                    <p className="text-xs font-sans tracking-[0.22em] uppercase text-royal-blue mb-5 font-semibold">
                      {normalizeEditorialText(aboutSettings.team_title)}
                    </p>
                    <h3 className="font-display text-4xl lg:text-5xl font-bold text-charcoal leading-[1.15] mb-5">
                      {normalizeEditorialText(leadMember.name)}
                    </h3>
                    <p className="text-lg text-charcoal/75 font-medium mb-8">
                      {normalizeEditorialText(leadMember.role)}
                    </p>
                    <p className="text-lg text-stone leading-relaxed font-light max-w-2xl">
                      {normalizeEditorialText(leadMember.bio)}
                    </p>
                  </div>
                </div>
              </div>

              {secondaryMembers.length > 0 && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
                  {secondaryMembers.map((member) => (
                    <article key={member.id || member.name} className="bg-white border border-gray-200 shadow-premium-sm overflow-hidden animate-slide-up">
                      {member.image && (
                        <div className="aspect-[4/3] bg-stone-100">
                          <SafeImage
                            src={member.image}
                            alt={normalizeEditorialText(member.name)}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: 'center 20%' }}
                          />
                        </div>
                      )}
                      <div className="p-8">
                        <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                          {normalizeEditorialText(member.name)}
                        </h3>
                        <p className="text-sm uppercase tracking-[0.14em] text-royal-blue font-semibold mb-5">
                          {normalizeEditorialText(member.role)}
                        </p>
                        <p className="text-stone leading-relaxed font-light">
                          {normalizeEditorialText(member.bio)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto bg-white shadow-premium-sm border border-gray-200 p-14 text-center animate-scale-in">
              <p className="text-stone leading-relaxed font-light">
                Esta área foi deixada pronta para receber os perfis reais da equipe da Revista Enfoco.
              </p>
            </div>
          )}
        </div>
      </div>

      <div id="contato" className="py-28 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="font-display text-4xl font-bold text-charcoal mb-8">
              {normalizeEditorialText(aboutSettings.contact_title)}
            </h2>
            <p className="text-lg text-stone font-light">
              {normalizeEditorialText(aboutSettings.contact_description)}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 max-w-2xl mx-auto">
            <div className="bg-porcelain p-10 text-center animate-slide-up shadow-premium-sm border border-gray-200/50 hover:shadow-premium transition-all duration-300">
              <svg className="w-12 h-12 text-royal-blue mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xs font-sans tracking-[0.15em] uppercase text-stone mb-4 font-semibold">Email</h3>
              <p className="text-lg text-charcoal font-light">
                {normalizeEditorialText(aboutSettings.contact_email || 'Em atualização')}
              </p>
            </div>

            <div className="bg-porcelain p-10 text-center animate-slide-up shadow-premium-sm border border-gray-200/50 hover:shadow-premium transition-all duration-300" style={{ animationDelay: '0.1s' }}>
              <svg className="w-12 h-12 text-royal-blue mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="text-xs font-sans tracking-[0.15em] uppercase text-stone mb-4 font-semibold">Telefone</h3>
              <p className="text-lg text-charcoal font-light">
                {normalizeEditorialText(aboutSettings.contact_phone || 'Em atualização')}
              </p>
            </div>
          </div>

          <div className="mt-16 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xs font-sans tracking-[0.15em] uppercase text-stone mb-3 font-semibold">Base Editorial</h3>
            <p className="text-charcoal mb-8 font-light">{normalizeEditorialText(aboutSettings.contact_city)}</p>
            {socialLinks.length > 0 && (
              <div className="flex justify-center gap-4 flex-wrap">
                {socialLinks.map((item, index) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-charcoal px-6 py-3 text-xs uppercase tracking-[0.12em] hover:bg-charcoal hover:text-white transition-all duration-300 font-medium"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
