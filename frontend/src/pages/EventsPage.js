import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { siteContent } from '../data/siteContent';
import SafeImage from '../components/SafeImage';

const splitDescription = (value) => {
  if (!value) {
    return '';
  }

  return String(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join(' ');
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!HAS_BACKEND) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(apiUrl('/api/events?published=true'));
        setEvents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const upcomingEvents = events.filter((event) => new Date(event.event_date) >= new Date());
  const pastEvents = events.filter((event) => new Date(event.event_date) < new Date());

  if (loading) {
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
      <div className="border-b border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-xs font-sans tracking-[0.2em] uppercase text-stone mb-4">Agenda Cultural</p>
          <h1 className="font-display text-6xl lg:text-7xl font-bold text-charcoal mb-6">
            Eventos e
            <br />
            <em className="font-serif italic font-normal">Experiências</em>
          </h1>
          <p className="text-lg text-stone max-w-2xl">
            Agenda preparada para divulgar encontros, lançamentos, experiências e ações ligadas à
            Revista Enfoco.
          </p>
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <h2 className="font-display text-3xl font-bold text-charcoal mb-12">Próximos Eventos</h2>
          <div className="space-y-8">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.event_date);
              return (
                <Link
                  key={event.id}
                  to={`/eventos/${event.slug}`}
                  className="block border border-gray-200 hover:border-charcoal transition-colors group"
                >
                  <div className="grid md:grid-cols-[200px_1fr] gap-0">
                    <div className="bg-charcoal text-white p-8 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold mb-2">{eventDate.getDate()}</div>
                      <div className="text-sm uppercase tracking-wide">
                        {eventDate.toLocaleDateString('pt-BR', { month: 'short' })}
                      </div>
                      <div className="text-xs opacity-60 mt-1">{eventDate.getFullYear()}</div>
                    </div>
                    <div className="p-8">
                      <p className="text-xs font-sans tracking-[0.15em] uppercase text-royal-blue mb-3">
                        {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <h3 className="font-display text-3xl font-bold text-charcoal mb-3 group-hover:text-royal-blue transition-colors">
                        {event.title}
                      </h3>
                      {event.location && <p className="text-sm text-stone mb-4">{event.location}</p>}
                      <p className="text-base text-stone leading-relaxed mb-4">{splitDescription(event.description)}</p>
                      {Array.isArray(event.event_images) && event.event_images.length > 0 && (
                        <div className="mb-5">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {event.event_images.slice(0, 6).map((image, index) => (
                              <div
                                key={`${event.id}-upcoming-${index}`}
                                className="aspect-[4/3] overflow-hidden rounded-[18px] bg-gray-100 border border-charcoal/8 shadow-sm"
                              >
                                <SafeImage
                                  src={image}
                                  alt={`${event.title} - foto ${index + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-stone">{siteContent.cta.eventsMessage}</p>
                        <span className="text-xs tracking-[0.15em] uppercase text-royal-blue font-semibold">
                          Abrir evento
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {pastEvents.length > 0 && (
        <div className="bg-porcelain py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-charcoal mb-12">Eventos Anteriores</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event) => {
                const eventDate = new Date(event.event_date);
                return (
                  <Link to={`/eventos/${event.slug}`} key={event.id} className="block bg-white p-6 group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-charcoal text-white w-16 h-16 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold">{eventDate.getDate()}</div>
                        <div className="text-xs uppercase">
                          {eventDate.toLocaleDateString('pt-BR', { month: 'short' })}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-charcoal group-hover:text-royal-blue transition-colors">
                          {event.title}
                        </h3>
                        {event.location && <p className="text-xs text-stone">{event.location}</p>}
                      </div>
                    </div>
                    {Array.isArray(event.event_images) && event.event_images.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {event.event_images.slice(0, 4).map((image, index) => (
                          <div
                            key={`${event.id}-past-${index}`}
                            className="aspect-[4/3] overflow-hidden rounded-[18px] bg-gray-100 border border-charcoal/8 shadow-sm"
                          >
                            <SafeImage
                              src={image}
                              alt={`${event.title} - foto ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-stone line-clamp-3 mb-4">{splitDescription(event.description)}</p>
                    <span className="text-xs tracking-[0.15em] uppercase text-royal-blue font-semibold">
                      Ver evento completo
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-24">
          <p className="text-stone text-lg">Nenhum evento disponível no momento.</p>
        </div>
      )}

      <div className="py-20 bg-charcoal text-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h3 className="font-display text-3xl lg:text-4xl font-bold mb-6">
            Agenda editorial em atualização
          </h3>
          <p className="text-white/70 mb-8">{siteContent.cta.eventsMessage}</p>
          <Link
            to="/noticias"
            className="inline-flex bg-royal-blue hover:bg-royal-blue-dark text-white px-8 py-4 text-sm font-semibold tracking-wide uppercase transition-colors"
          >
            Ver notícias
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
