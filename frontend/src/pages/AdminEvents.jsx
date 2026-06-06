import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiUrl } from '../lib/api';

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = 'cookie-session';

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchEvents = async () => {
      try {
        const response = await axios.get(apiUrl('/api/events'));
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [token, navigate]);

  const handleDelete = async (eventId) => {
    if (!window.confirm('Tem certeza que deseja deletar este evento?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/events/${eventId}`), {
        headers: {  }
      });
      setEvents((current) => current.filter((item) => item.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Erro ao deletar evento');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-charcoal font-display text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="enfoco-glass rounded-[42px] p-8 md:p-10 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold">Eventos</h1>
              <p className="text-stone mt-2">Gerenciar agenda e experiências</p>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/dashboard" className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors">
                Voltar
              </Link>
              <Link to="/admin/events/new" className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors">
                Novo Evento
              </Link>
            </div>
          </div>
        </div>

        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                        event.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.published ? 'Publicado' : 'Rascunho'}
                      </span>
                      {Array.isArray(event.event_images) && event.event_images.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-royal-blue/10 text-royal-blue">
                          {event.event_images.length} fotos
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">{event.title}</h2>
                    <p className="text-stone text-sm mb-3">{event.description}</p>
                    <div className="flex items-center gap-3 text-xs text-stone flex-wrap">
                      <time>{format(new Date(event.event_date), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</time>
                      {event.location && (
                        <>
                          <span>•</span>
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/events/edit/${event.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-4 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="enfoco-glass rounded-[42px] p-10 text-center">
            <p className="text-stone mb-4">Nenhum evento criado ainda.</p>
            <Link
              to="/admin/events/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeiro Evento
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvents;


