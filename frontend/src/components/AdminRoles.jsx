import React, { useState } from 'react';

const AdminRoles = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin Master', email: 'admin@revista.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Editor Chefe', email: 'editor@revista.com', role: 'editor', status: 'active' },
    { id: 3, name: 'Jornalista', email: 'jornalista@revista.com', role: 'author', status: 'active' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const roles = [
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Acesso completo ao painel',
      permissions: ['Criar', 'Editar', 'Deletar', 'Publicar', 'Gerenciar Usuários', 'Configurações']
    },
    {
      id: 'editor',
      name: 'Editor',
      description: 'Gerencia conteúdo e publicações',
      permissions: ['Criar', 'Editar', 'Deletar', 'Publicar', 'Revisar']
    },
    {
      id: 'author',
      name: 'Autor',
      description: 'Cria e edita seu próprio conteúdo',
      permissions: ['Criar', 'Editar Próprio', 'Enviar para Revisão']
    },
    {
      id: 'viewer',
      name: 'Visualizador',
      description: 'Apenas visualiza conteúdo',
      permissions: ['Visualizar']
    }
  ];

  const changeRole = (userId, newRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setSelectedUser(null);
  };

  const toggleUserStatus = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  const removeUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'author':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Roles Overview */}
      <div>
        <h3 className="font-display text-2xl font-bold text-charcoal mb-6">Funções e Permissões</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map(role => (
            <div key={role.id} className="enfoco-glass rounded-xl p-6 shadow-premium">
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getRoleColor(role.id)}`}>
                {role.name}
              </div>
              <p className="text-sm text-stone mb-4">{role.description}</p>
              <div className="space-y-2">
                {role.permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-charcoal">
                    <span className="text-green-600">✓</span>
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Management */}
      <div className="enfoco-glass rounded-xl p-6 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold text-charcoal">Gerenciar Usuários</h3>
          <button className="px-4 py-2 rounded-lg bg-royal-blue text-white text-sm font-medium hover:bg-royal-blue/90 transition-colors">
            + Novo Usuário
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-charcoal text-sm">Usuário</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal text-sm">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal text-sm">Função</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-charcoal text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-medium text-charcoal">{user.name}</p>
                  </td>
                  <td className="py-4 px-4 text-sm text-stone">{user.email}</td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)} hover:shadow-md transition-all cursor-pointer`}
                    >
                      {roles.find(r => r.id === user.role)?.name}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'active' ? '✓ Ativo' : '◯ Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        {user.status === 'active' ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => removeUser(user.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-slide-down">
            <h3 className="font-display text-xl font-bold text-charcoal mb-4">
              Alterar Função de {selectedUser.name}
            </h3>
            <div className="space-y-3 mb-6">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => changeRole(selectedUser.id, role.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedUser.role === role.id
                      ? 'border-royal-blue bg-royal-blue/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-charcoal">{role.name}</p>
                  <p className="text-xs text-stone mt-1">{role.description}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="w-full px-4 py-2 rounded-lg border border-charcoal/20 text-charcoal font-medium hover:bg-charcoal/5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
