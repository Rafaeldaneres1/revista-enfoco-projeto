import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import SeoHelmet from '../components/SeoHelmet';

const formatEventDate = (value) => {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString('pt-BR', { day: '2-digit' }),
    month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
    year: date.getFullYear(),
    full: date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
};

const splitDescription = (value) => {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const SingleEvent = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!HAS_BACKEND) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl(`/api/events/${slug}`));
        setEvent(response.data);
        setActiveImageIndex(0);
      } catch (error) {
        console.error('Error fetching event:', error);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  const eventImages = useMemo(
    () => (Array.isArray(event?.event_images) ? event.event_images.filter(Boolean) : []),
    [event]
  );
  const paragraphs = useMemo(() => splitDescription(event?.description), [event?.description]);
  const formattedDate = event ? formatEventDate(event.event_date) : null;
  const activeImage = eventImages[activeImageIndex] || null;

  const goToPreviousImage = () => {
    if (!eventImages.length) {
      return;
    }

    setActiveImageIndex((current) => (current === 0 ? eventImages.length - 1 : current - 1));
  };

  const goToNextImage = () => {
    if (!eventImages.length) {
      return;
    }

    setActiveImageIndex((current) => (current === eventImages.length - 1 ? 0 : current + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone text-sm">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-24">
        <div className="enfoco-glass rounded-[36px] p-10 text-center">
          <p className="text-sm tracking-[0.18em] uppercase text-stone mb-4">Eventos</p>
          <h1 className="font-display text-4xl font-bold text-charcoal mb-4">Evento não encontrado</h1>
          <p className="text-stone mb-8">Este evento não está disponível no momento.</p>
          <Link
            to="/eventos"
            className="inline-flex items-center rounded-full bg-charcoal px-6 py-3 text-white font-semibold hover:bg-charcoal-light transition-colors"
          >
            Voltar para Eventos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title={event.title}
        description={paragraphs[0] || event.description}
        canonicalPath={`/eventos/${event.slug}`}
        image={eventImages[0]}
        type="article"
      />
      <div className="border-b border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <Link
            to="/eventos"
            className="inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-stone hover:text-charcoal transition-colors mb-8"
          >
            <span aria-hidden="true">←</span>
            Voltar para eventos
          </Link>

          <div className="grid lg:grid-cols-[140px_1fr] gap-10 items-start">
            <div className="bg-charcoal text-white rounded-[28px] p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
              <div className="text-5xl font-bold leading-none mb-3">{formattedDate.day}</div>
              <div className="text-sm tracking-[0.2em] uppercase">{formattedDate.month}</div>
              <div className="text-xs text-white/60 mt-2">{formattedDate.year}</div>
            </div>

            <div>
              <p className="text-xs font-sans tracking-[0.2em] uppercase text-royal-blue mb-4">Evento publicado</p>
              <h1 className="font-display text-5xl lg:text-6xl font-bold text-charcoal leading-[0.98] mb-5">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-stone mb-5">
                <span>{formattedDate.full}</span>
                <span aria-hidden="true">•</span>
                <span>{formattedDate.time}</span>
                {event.location && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{event.location}</span>
                  </>
                )}
              </div>
              <p className="text-lg text-stone max-w-3xl leading-relaxed">
                {paragraphs[0] || event.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <section className="grid lg:grid-cols-[1.1fr_320px] gap-12 items-start mb-16">
          <article className="enfoco-glass rounded-[36px] p-8 md:p-10">
            <p className="text-xs tracking-[0.18em] uppercase text-stone mb-4">Texto completo</p>
            <div className="space-y-6 text-charcoal/88 leading-[1.95] text-[1.04rem]">
              {paragraphs.map((paragraph, index) => (
                <p key={`${event.id}-paragraph-${index}`}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="enfoco-glass rounded-[36px] p-8">
            <p className="text-xs tracking-[0.18em] uppercase text-stone mb-4">Resumo</p>
            <dl className="space-y-5 text-sm text-stone">
              <div>
                <dt className="text-charcoal font-semibold mb-1">Quando</dt>
                <dd>{formattedDate.full}</dd>
                <dd>{formattedDate.time}</dd>
              </div>
              {event.location && (
                <div>
                  <dt className="text-charcoal font-semibold mb-1">Local</dt>
                  <dd>{event.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-charcoal font-semibold mb-1">Fotos</dt>
                <dd>{eventImages.length} {eventImages.length === 1 ? 'imagem' : 'imagens'} cadastradas</dd>
              </div>
            </dl>
          </aside>
        </section>

        {eventImages.length > 0 && (
          <section>
            <div className="enfoco-glass rounded-[38px] p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs tracking-[0.18em] uppercase text-stone mb-2">Galeria do evento</p>
                  <h2 className="font-display text-3xl font-bold text-charcoal">Momentos registrados</h2>
                </div>

                {eventImages.length > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={goToPreviousImage}
                      className="w-12 h-12 rounded-full border border-charcoal/12 bg-white hover:bg-charcoal hover:text-white transition-colors"
                      aria-label="Foto anterior"
                    >
                      ‹
                    </button>
                    <span className="text-sm text-stone min-w-[72px] text-center">
                      {activeImageIndex + 1} / {eventImages.length}
                    </span>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      className="w-12 h-12 rounded-full border border-charcoal/12 bg-white hover:bg-charcoal hover:text-white transition-colors"
                      aria-label="Próxima foto"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-[28px] overflow-hidden border border-charcoal/8 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.10)]">
                <SafeImage
                  src={activeImage}
                  alt={`${event.title} - foto ${activeImageIndex + 1}`}
                  className="w-full h-auto object-contain bg-white"
                />
              </div>

              {eventImages.length > 1 && (
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-5">
                  {eventImages.map((image, index) => (
                    <button
                      key={`${event.id}-thumb-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`rounded-[20px] overflow-hidden border transition-all ${
                        index === activeImageIndex
                          ? 'border-royal-blue shadow-[0_14px_32px_rgba(37,99,235,0.16)]'
                          : 'border-charcoal/10 hover:border-charcoal/25'
                      }`}
                      aria-label={`Abrir foto ${index + 1}`}
                    >
                      <SafeImage
                        src={image}
                        alt={`${event.title} miniatura ${index + 1}`}
                        className="w-full aspect-[4/5] object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SingleEvent;
