import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import SafeImage from '../components/SafeImage';

const AdminTeams = () => {
  const navigate = useNavigate();
  const token = 'cookie-session';
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }

    const fetchTeam = async () => {
      try {
        const response = await axios.get(apiUrl('/api/team'), {
          headers: {  }
        });
        setTeamMembers(response.data);
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [token, navigate]);

  const handleDelete = async (teamMemberId) => {
    if (!window.confirm('Tem certeza que deseja remover este perfil da equipe?')) {
      return;
    }

    try {
      await axios.delete(apiUrl(`/api/team/${teamMemberId}`), {
        headers: {  }
      });
      setTeamMembers((current) => current.filter((member) => member.id !== teamMemberId));
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Erro ao deletar perfil da equipe');
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
              <h1 className="font-display text-4xl font-bold">Equipe Editorial</h1>
              <p className="text-stone mt-2">Gerenciar nome, cargo, foto, bio e ordem de exibição.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/dashboard" className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors">
                Voltar
              </Link>
              <Link to="/admin/team/new" className="px-4 py-2 rounded-full bg-charcoal text-white text-sm hover:bg-charcoal-light transition-colors">
                Novo Perfil
              </Link>
            </div>
          </div>
        </div>

        {teamMembers.length > 0 ? (
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="enfoco-glass rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {member.image ? (
                      <SafeImage
                        src={member.image}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover object-top shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                        {member.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full border border-charcoal/8 bg-white/86 text-xs text-charcoal-light">
                          Ordem {member.display_order ?? 0}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                          member.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.published ? 'Publicado' : 'Oculto'}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl font-bold mb-2">{member.name}</h2>
                      <p className="text-charcoal/70 text-sm font-medium mb-3">{member.role}</p>
                      <p className="text-stone text-sm line-clamp-2">{member.bio}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/admin/team/edit/${member.id}`}
                      className="px-4 py-2 rounded-full border border-charcoal/16 text-sm hover:bg-white/78 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(member.id)}
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
            <p className="text-stone mb-4">Nenhum perfil da equipe cadastrado ainda.</p>
            <Link
              to="/admin/team/new"
              className="inline-flex items-center px-6 py-3 rounded-full bg-charcoal text-white font-semibold hover:bg-charcoal-light transition-colors"
            >
              Criar Primeiro Perfil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeams;


