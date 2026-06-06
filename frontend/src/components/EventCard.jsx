import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventCard = ({ event }) => {
  return (
    <div className="enfoco-glass rounded-[28px] p-6 hover:shadow-enfoco-card transition-shadow">
      <Link to={`/eventos/${event.slug}`}>
        <h3 className="font-display text-lg md:text-xl font-bold leading-tight mb-2 hover:text-stone transition-colors" style={{ letterSpacing: '-0.04em' }}>
          {event.title}
        </h3>
      </Link>
      <p className="text-stone text-sm leading-relaxed mb-3">
        {event.description.substring(0, 120)}...
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center px-3 py-1 rounded-full border border-charcoal/8 bg-white/86 text-charcoal-light">
          {format(new Date(event.event_date), "d 'de' MMMM, yyyy", { locale: ptBR })}
        </span>
        {event.location && (
          <span className="text-stone">{event.location}</span>
        )}
      </div>
    </div>
  );
};

export default EventCard;