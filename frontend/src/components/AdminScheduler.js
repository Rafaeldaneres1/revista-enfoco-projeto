import React, { useState } from 'react';

const AdminScheduler = ({ onSchedule }) => {
  const [scheduleMode, setScheduleMode] = useState('immediate'); // immediate, scheduled
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [scheduledPosts, setScheduledPosts] = useState([
    {
      id: 1,
      title: 'Notícia Agendada Exemplo',
      scheduledFor: '2026-04-05T14:30:00',
      status: 'scheduled'
    }
  ]);

  const handleSchedule = () => {
    if (scheduleMode === 'scheduled' && !scheduledDate) {
      alert('Selecione uma data para agendar');
      return;
    }

    const scheduleData = {
      mode: scheduleMode,
      scheduledFor: scheduleMode === 'scheduled' ? `${scheduledDate}T${scheduledTime}:00` : null
    };

    onSchedule && onSchedule(scheduleData);
  };

  const cancelSchedule = (id) => {
    setScheduledPosts(scheduledPosts.filter(p => p.id !== id));
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="enfoco-glass rounded-xl p-6 shadow-premium">
      <h3 className="font-display text-lg font-bold text-charcoal mb-6">Agendamento de Publicação</h3>

      {/* Mode Selection */}
      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="schedule-mode"
            value="immediate"
            checked={scheduleMode === 'immediate'}
            onChange={(e) => setScheduleMode(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-charcoal font-medium">Publicar Agora</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="schedule-mode"
            value="scheduled"
            checked={scheduleMode === 'scheduled'}
            onChange={(e) => setScheduleMode(e.target.value)}
            className="w-4 h-4"
          />
          <span className="text-charcoal font-medium">Agendar Publicação</span>
        </label>
      </div>

      {/* Schedule Inputs */}
      {scheduleMode === 'scheduled' && (
        <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Data</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getMinDate()}
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Hora</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
              />
            </div>
          </div>
          {scheduledDate && (
            <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded-lg">
              📅 Será publicado em: <strong>{formatDateTime(`${scheduledDate}T${scheduledTime}:00`)}</strong>
            </div>
          )}
        </div>
      )}

      {/* Scheduled Posts */}
      {scheduledPosts.length > 0 && (
        <div className="mb-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-charcoal mb-4 text-sm">Publicações Agendadas</h4>
          <div className="space-y-3">
            {scheduledPosts.map(post => (
              <div key={post.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="font-medium text-charcoal">{post.title}</p>
                  <p className="text-xs text-stone mt-1">
                    📅 {formatDateTime(post.scheduledFor)}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                    ⏱ Agendado
                  </span>
                </div>
                <button
                  onClick={() => cancelSchedule(post.id)}
                  className="text-red-600 hover:text-red-800 font-semibold text-sm ml-4"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSchedule}
        className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-royal-blue to-royal-blue/90 text-white font-semibold hover:shadow-premium transition-all duration-300"
      >
        {scheduleMode === 'immediate' ? '✓ Publicar Agora' : '📅 Agendar Publicação'}
      </button>

      {/* Calendar Preview */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs font-semibold text-charcoal mb-3">Calendário de Publicações</p>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
            <div key={day} className="text-xs font-semibold text-stone py-2">{day}</div>
          ))}
          {Array.from({ length: 35 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - date.getDay() + i);
            const isScheduled = scheduledPosts.some(p => 
              new Date(p.scheduledFor).toDateString() === date.toDateString()
            );
            return (
              <div
                key={i}
                className={`p-2 rounded text-xs font-medium transition-colors ${
                  isScheduled
                    ? 'bg-royal-blue text-white'
                    : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                }`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminScheduler;
