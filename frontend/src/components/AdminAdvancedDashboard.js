import React from 'react';

const AdminAdvancedDashboard = ({ stats = {} }) => {
  const {
    totalPosts = 0,
    totalColumns = 0,
    totalEvents = 0,
    totalEditions = 0,
    publishedPosts = 0,
    draftPosts = 0,
    recentActivity = []
  } = stats;

  const safePostTotal = totalPosts > 0 ? totalPosts : 1;

  const StatCard = ({ icon, title, value, color, trend }) => (
    <div className="enfoco-glass rounded-xl p-6 hover:shadow-premium transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${color}`}>
          {icon}
        </div>
        {typeof trend === 'number' && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-stone text-sm font-light mb-1">{title}</p>
      <p className="font-display text-3xl font-bold text-charcoal">{value}</p>
    </div>
  );

  const ChartBar = ({ label, value, maxValue, color }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-charcoal">{label}</span>
        <span className="text-sm font-semibold text-charcoal">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon="📰"
          title="Total de Notícias"
          value={totalPosts}
          color="bg-blue-100 text-blue-600"
          trend={12}
        />
        <StatCard
          icon="✍️"
          title="Total de Colunas"
          value={totalColumns}
          color="bg-purple-100 text-purple-600"
          trend={5}
        />
        <StatCard
          icon="📅"
          title="Total de Eventos"
          value={totalEvents}
          color="bg-green-100 text-green-600"
          trend={-2}
        />
        <StatCard
          icon="📑"
          title="Total de Edições"
          value={totalEditions}
          color="bg-orange-100 text-orange-600"
          trend={8}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <h3 className="font-display text-lg font-bold text-charcoal mb-6">Status de Publicação</h3>
          <ChartBar
            label="Publicados"
            value={publishedPosts}
            maxValue={safePostTotal}
            color="bg-green-500"
          />
          <ChartBar
            label="Rascunhos"
            value={draftPosts}
            maxValue={safePostTotal}
            color="bg-gray-500"
          />
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-stone">
              <span className="font-semibold text-charcoal">
                {Math.round((publishedPosts / safePostTotal) * 100)}%
              </span>{' '}
              do conteúdo publicado
            </p>
          </div>
        </div>

        <div className="enfoco-glass rounded-xl p-6 shadow-premium">
          <h3 className="font-display text-lg font-bold text-charcoal mb-6">Resumo editorial</h3>
          <ChartBar
            label="Notícias"
            value={totalPosts}
            maxValue={Math.max(totalPosts, totalColumns, totalEvents, totalEditions, 1)}
            color="bg-blue-500"
          />
          <ChartBar
            label="Colunas"
            value={totalColumns}
            maxValue={Math.max(totalPosts, totalColumns, totalEvents, totalEditions, 1)}
            color="bg-purple-500"
          />
          <ChartBar
            label="Eventos"
            value={totalEvents}
            maxValue={Math.max(totalPosts, totalColumns, totalEvents, totalEditions, 1)}
            color="bg-green-500"
          />
          <ChartBar
            label="Edições"
            value={totalEditions}
            maxValue={Math.max(totalPosts, totalColumns, totalEvents, totalEditions, 1)}
            color="bg-orange-500"
          />
        </div>
      </div>

      <div className="enfoco-glass rounded-xl p-6 shadow-premium">
        <h3 className="font-display text-lg font-bold text-charcoal mb-6">Atividade Recente</h3>
        <div className="space-y-4">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div
                key={`${activity.title}-${index}`}
                className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    activity.type === 'create'
                      ? 'bg-green-100 text-green-600'
                      : activity.type === 'edit'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {activity.type === 'create' && '✓'}
                  {activity.type === 'edit' && '✎'}
                  {activity.type === 'publish' && '→'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal">{activity.title}</p>
                  <p className="text-xs text-stone mt-1">{activity.description}</p>
                  <p className="text-xs text-stone/50 mt-2">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-stone text-sm">Nenhuma atividade recente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAdvancedDashboard;
