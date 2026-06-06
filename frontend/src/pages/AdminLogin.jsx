import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/admin/dashboard');
    } catch (error) {
      if (error?.response?.status === 429) {
        setError('Muitas tentativas. Aguarde 15 minutos e tente novamente.');
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="enfoco-glass rounded-[42px] p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="login" className="mx-auto mb-4" />
          <p className="text-stone text-sm">Painel Administrativo</p>
        </div>

        {location.state?.message && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center mb-4">
            {location.state.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Senha</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 rounded-2xl border border-charcoal/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-charcoal text-white font-semibold uppercase tracking-wider hover:bg-charcoal-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
