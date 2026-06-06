import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos sem interação

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const timerRef = useRef(null);

  const handleTimeout = useCallback(async () => {
    await logout();
    navigate('/admin', {
      state: { message: 'Sessão encerrada por inatividade.' }
    });
  }, [logout, navigate]);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleTimeout, TIMEOUT_MS);
  }, [handleTimeout]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
};
