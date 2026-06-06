import React, { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { HAS_BACKEND, apiUrl } from '../lib/api';
import { siteContent } from '../data/siteContent';
import SafeImage from '../components/SafeImage';
import SeoHelmet from '../components/SeoHelmet';
import PublicSearchBar from '../components/PublicSearchBar';
import AdBanner from '../components/AdBanner';
import { matchesSearch } from '../lib/search';
import { readPublicCache, writePublicCache } from '../lib/publicDataCache';

const EVENTS_CACHE_KEY = 'events-index-v2';
const EVENTS_PAGE_SIZE = 24;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEvents = useCallback(async ({ skip = 0, append = false } = {}) => {
      if (!HAS_BACKEND) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        if (!append) {
          const cachedEvents = readPublicCache(EVENTS_CACHE_KEY);
          if (Array.isArray(cachedEvents)) {
            setEvents(cachedEvents);
            setLoading(false);
          }
        }

        const response = await axios.get(apiUrl(`/api/events?published=true&compact=true&limit=${EVENTS_PAGE_SIZE}&skip=${skip}`));
        const nextEvents = Array.isArray(response.data) ? response.data : [];
        setHasMoreEvents(nextEvents.length === EVENTS_PAGE_SIZE);
        setEvents((currentEvents) => {
          const mergedEvents = append ? [...currentEvents, ...nextEvents] : nextEvents;
          const uniqueEvents = mergedEvents.filter(
            (event, index, list) =>
              list.findIndex((candidate) => (candidate.id || candidate.slug) === (event.id || event.slug)) === index
          );
          if (!append) {
            writePublicCache(EVENTS_CACHE_KEY, uniqueEvents);
          }
          return uniqueEvents;
        });
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter((event) =>
    matchesSearch(
      event,
      [
        (item) => item.title,
        (item) => item.description,
        (item) => item.location,
        (item) => item.event_date ? new Date(item.event_date).toLocaleDateString('pt-BR') : ''
      ],
      searchQuery
    )
  );
  const upcomingEvents = filteredEvents.filter((event) => new Date(event.event_date) >= new Date());
  const pastEvents = filteredEvents.filter((event) => new Date(event.event_date) < new Date());

  return (
    <div className="min-h-screen bg-white">
      <SeoHelmet
        title="Eventos"
        description="Agenda de eventos e experiências ligadas à Revista Enfoco."
        canonicalPath="/eventos"
        image={events[0]?.event_images?.[0]}
      />
      <div className="relative overflow-hidden text-white animate-slide-down">
        <div className="absolute inset-0 bg-charcoal"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.04),_transparent_55%)]"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 sm:py-28 lg:py-36">
          <p className="text-xs font-sans tracking-[0.2em] uppercase text-white/60 mb-4">Agenda Cultural</p>
          <h1 className="font-display text-6xl lg:text-7xl font-bold text-white mb-6">
            Eventos e
            <br />
            <em className="font-serif italic font-normal">Experiencias</em>
          </h1>
          <p className="text-lg text-white/78 max-w-2xl mb-10">
            Agenda preparada para divulgar encontros, lançamentos, experiências e ações ligadas à Revista Enfoco.
          </p>

          <PublicSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar eventos por titulo, local ou data"
            label="Pesquisar eventos"
          />
        </div>
      </div>

      <AdBanner position="events_after_hero" className="py-8 sm:py-10" />

      {loading && events.length === 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[0, 1, 2].map((item) => (
              <div key={item} className="bg-white border border-gray-100 p-6">
                <div className="h-16 w-16 bg-gray-100 mb-6"></div>
                <div className="h-6 w-3/4 bg-gray-200 mb-4"></div>
                <div className="h-3 w-1/2 bg-gray-100 mb-6"></div>
                <div className="aspect-[4/3] bg-gray-100 rounded-[18px]"></div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {hasMoreEvents && !searchQuery && (
        <div className="text-center pb-16">
          <button
            type="button"
            onClick={() => {
              setLoadingMore(true);
              fetchEvents({ skip: events.length, append: true });
            }}
            disabled={loadingMore}
            className="px-7 py-3 rounded-full border border-charcoal/16 text-sm uppercase tracking-[0.12em] font-semibold text-charcoal hover:bg-charcoal hover:text-white transition-colors disabled:opacity-60"
          >
            {loadingMore ? 'Carregando...' : 'Ver mais eventos'}
          </button>
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-24">
          <p className="text-stone text-lg">
            {searchQuery ? 'Nenhum evento encontrado.' : 'Nenhum evento disponível no momento.'}
          </p>
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
            Ver reportagens
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
