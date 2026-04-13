import React, { useState } from 'react';

const AdminAudit = () => {
  const [auditLog, setAuditLog] = useState([
    {
      id: 1,
      user: 'Admin Master',
      action: 'create',
      target: 'Post: "Notícia sobre Santa Maria"',
      timestamp: new Date(Date.now() - 3600000),
      details: 'Criou novo post com categoria Política'
    },
    {
      id: 2,
      user: 'Editor Chefe',
      action: 'edit',
      target: 'Post: "Evento Cultural"',
      timestamp: new Date(Date.now() - 7200000),
      details: 'Editou título e descrição'
    },
    {
      id: 3,
      user: 'Jornalista',
      action: 'publish',
      target: 'Post: "Futevôlei em Santa Maria"',
      timestamp: new Date(Date.now() - 86400000),
      details: 'Publicou post em rascunho'
    },
    {
      id: 4,
      user: 'Admin Master',
      action: 'delete',
      target: 'Post: "Notícia Antiga"',
      timestamp: new Date(Date.now() - 172800000),
      details: 'Deletou post de arquivo'
    },
    {
      id: 5,
      user: 'Editor Chefe',
      action: 'edit',
      target: 'Categoria: "Tecnologia"',
      timestamp: new Date(Date.now() - 259200000),
      details: 'Alterou cor e ícone da categoria'
    }
  ]);

  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const actions = [
    { id: 'all', name: 'Todas as Ações', icon: '📋' },
    { id: 'create', name: 'Criações', icon: '✓' },
    { id: 'edit', name: 'Edições', icon: '✎' },
    { id: 'publish', name: 'Publicações', icon: '→' },
    { id: 'delete', name: 'Deleções', icon: '✗' }
  ];

  const users = ['all', ...new Set(auditLog.map(log => log.user))];

  const filteredLogs = auditLog.filter(log => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesUser = filterUser === 'all' || log.user === filterUser;
    const matchesSearch = log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesUser && matchesSearch;
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'edit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'publish':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionLabel = (action) => {
    const actionObj = actions.find(a => a.id === action);
    return actionObj ? actionObj.name : action;
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-display text-2xl font-bold text-charcoal mb-2">Auditoria e Histórico</h3>
        <p className="text-stone">Acompanhe todas as ações realizadas no painel administrativo</p>
      </div>

      {/* Filters */}
      <div className="enfoco-glass rounded-xl p-6 shadow-premium">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por post, usuário, ação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Filtrar por Ação</label>
            <div className="flex flex-wrap gap-2">
              {actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => setFilterAction(action.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterAction === action.id
                      ? 'bg-royal-blue text-white shadow-premium'
                      : 'bg-gray-100 text-charcoal hover:bg-gray-200'
                  }`}
                >
                  {action.icon} {action.name}
                </button>
              ))}
            </div>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">Filtrar por Usuário</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-charcoal/10 focus:border-royal-blue focus:outline-none transition-colors"
            >
              <option value="all">Todos os Usuários</option>
              {users.filter(u => u !== 'all').map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className="enfoco-glass rounded-xl p-6 shadow-premium hover:shadow-lg transition-all animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                {/* Action Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 ${getActionColor(log.action)}`}>
                  {actions.find(a => a.id === log.action)?.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs text-stone">{formatTime(log.timestamp)}</span>
                  </div>

                  <p className="font-semibold text-charcoal mb-1">{log.target}</p>
                  <p className="text-sm text-stone mb-2">{log.details}</p>
                  <p className="text-xs text-stone/60">Por: <strong>{log.user}</strong></p>
                </div>

                {/* Timestamp */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-stone/50">
                    {log.timestamp.toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-stone/50">
                    {log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="enfoco-glass rounded-xl p-12 text-center shadow-premium">
            <p className="text-stone">Nenhum registro encontrado</p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="enfoco-glass rounded-xl p-6 shadow-premium text-center">
          <p className="text-3xl font-bold text-green-600 mb-1">{auditLog.filter(l => l.action === 'create').length}</p>
          <p className="text-xs text-stone">Criações</p>
        </div>
        <div className="enfoco-glass rounded-xl p-6 shadow-premium text-center">
          <p className="text-3xl font-bold text-blue-600 mb-1">{auditLog.filter(l => l.action === 'edit').length}</p>
          <p className="text-xs text-stone">Edições</p>
        </div>
        <div className="enfoco-glass rounded-xl p-6 shadow-premium text-center">
          <p className="text-3xl font-bold text-purple-600 mb-1">{auditLog.filter(l => l.action === 'publish').length}</p>
          <p className="text-xs text-stone">Publicações</p>
        </div>
        <div className="enfoco-glass rounded-xl p-6 shadow-premium text-center">
          <p className="text-3xl font-bold text-red-600 mb-1">{auditLog.filter(l => l.action === 'delete').length}</p>
          <p className="text-xs text-stone">Deleções</p>
        </div>
        <div className="enfoco-glass rounded-xl p-6 shadow-premium text-center">
          <p className="text-3xl font-bold text-charcoal mb-1">{new Set(auditLog.map(l => l.user)).size}</p>
          <p className="text-xs text-stone">Usuários Ativos</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAudit;
