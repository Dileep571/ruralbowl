'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

// Custom events for auth state changes
const AUTH_LOGIN_EVENT = 'auth:login';
const AUTH_LOGOUT_EVENT = 'auth:logout';

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: (_user) => {},
  logout: () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage and verify with server
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get user from localStorage
        const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const localUser = uStr ? JSON.parse(uStr) : null;
        
        if (localUser) {
          // Verify session with server (cookies sent automatically)
          try {
            const { user: serverUser } = await authAPI.getMe();
            if (serverUser) {
              setUser(serverUser);
              localStorage.setItem('user', JSON.stringify(serverUser));
            } else {
              // Session invalid, clear user
              localStorage.removeItem('user');
              setUser(null);
            }
          } catch (err) {
            // Session expired or invalid
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = useCallback((u) => {
    setUser(u || null);
    if (typeof window !== 'undefined') {
      if (u) {
        localStorage.setItem('user', JSON.stringify(u));
      } else {
        localStorage.removeItem('user');
      }
    }
    // Notify other components that user has logged in
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_LOGIN_EVENT, { detail: { user: u } }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await authAPI.getMe();
      if (me?.user) {
        setUser(me.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(me.user));
        }
      }
    } catch (error) {
      // Token invalid or expired
      const errorMsg = error?.message?.toLowerCase() || '';
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('expired')) {
        // Clear session
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
        }
      }
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
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
 