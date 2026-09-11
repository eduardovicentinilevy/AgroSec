import React, { createContext, useContext, useState, useCallback } from 'react';
import { api, STORAGE_KEY, getStoredSession } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());

  // Sincronizado imediatamente (não em um useEffect) para que a primeira
  // requisição disparada pela página de destino, logo após login/registro,
  // já saia com o header Authorization — evita uma corrida onde o efeito de
  // busca de dados de uma página filha roda antes do efeito deste provider.
  const persist = (next) => {
    api.setToken(next?.token || null);
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    persist({ token: data.token, user: data.user });
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    persist({ token: data.token, user: data.user, organization: data.organization });
    return data;
  }, []);

  const logout = useCallback(() => persist(null), []);

  return (
    <AuthContext.Provider value={{ session, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
