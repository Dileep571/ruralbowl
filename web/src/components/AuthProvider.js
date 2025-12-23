'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  login: (_user, _token) => {},
  logout: () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const u = uStr ? JSON.parse(uStr) : null;
      if (t) setToken(t);
      if (u) setUser(u);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const setSession = useCallback((u, t) => {
    setUser(u || null);
    setToken(t || null);
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem('token', t); else localStorage.removeItem('token');
      if (u) localStorage.setItem('user', JSON.stringify(u)); else localStorage.removeItem('user');
    }
  }, []);

  const login = useCallback((u, t) => {
    setSession(u, t);
  }, [setSession]);

  const logout = useCallback(() => {
    setSession(null, null);
    try { authAPI.logout(); } catch {}
  }, [setSession]);

  const refresh = useCallback(async () => {
    try {
      const me = await authAPI.getMe();
      if (me?.user) {
        // preserve token, update user
        const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : token;
        setSession(me.user, currentToken);
      }
    } catch (error) {
      // Token invalid or expired
      const errorMsg = error?.message?.toLowerCase() || '';
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('expired')) {
        // Clear session and force re-login
        setSession(null, null);
      }
      // Otherwise keep current state
    }
  }, [setSession, token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
 