import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// ── Token storage helpers ─────────────────────────────────────────────────────
const storage = {
  getAccess:   () => localStorage.getItem('access_token'),
  getRefresh:  () => localStorage.getItem('refresh_token'),
  getUser:     () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  set: (access, refresh, user) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(storage.getUser);
  const [loading, setLoading] = useState(!!storage.getAccess()); // true si hay token para verificar
  const refreshTimerRef       = useRef(null);

  // ── Setup axios interceptors ───────────────────────────────────────────────
  useEffect(() => {
    const reqInterceptor = API.interceptors.request.use(config => {
      const token = storage.getAccess();
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
      return config;
    });

    const resInterceptor = API.interceptors.response.use(
      res => res.data,
      async err => {
        const original = err.config;
        // Si 401 + TOKEN_EXPIRED y no es un reintento → refresh
        if (err.response?.status === 401 &&
            err.response?.data?.code === 'TOKEN_EXPIRED' &&
            !original._retry) {
          original._retry = true;
          try {
            const refreshToken = storage.getRefresh();
            if (!refreshToken) throw new Error('No refresh token');
            const res = await axios.post('/api/auth/refresh', { refreshToken });
            const { accessToken, refreshToken: newRefresh, user: newUser } = res.data.data;
            storage.set(accessToken, newRefresh, newUser);
            setUser(newUser);
            original.headers['Authorization'] = `Bearer ${accessToken}`;
            return API(original);
          } catch {
            storage.clear();
            setUser(null);
            return Promise.reject(new Error('Sesión expirada. Por favor inicia sesión.'));
          }
        }
        const message = err.response?.data?.error || err.message || 'Error de conexión';
        return Promise.reject(new Error(message));
      }
    );

    return () => {
      API.interceptors.request.eject(reqInterceptor);
      API.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // ── Verificar sesión existente al montar ───────────────────────────────────
  useEffect(() => {
    const token = storage.getAccess();
    if (!token) { setLoading(false); return; }

    API.get('/auth/me')
      .then(res => { setUser(res.data); storage.set(token, storage.getRefresh(), res.data); })
      .catch(() => { storage.clear(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: userData } = res.data;
    storage.set(accessToken, refreshToken, userData);
    setUser(userData);
    return userData;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await API.post('/auth/logout', { refreshToken: storage.getRefresh() });
    } catch (_) { /* ignorar errores de red en logout */ }
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    storage.clear();
    setUser(null);
  }, []);

  // ── Change password ────────────────────────────────────────────────────────
  const changePassword = useCallback((currentPassword, newPassword) =>
    API.post('/auth/change-password', { currentPassword, newPassword }),
  []);

  // ── Permission helper ──────────────────────────────────────────────────────
  const can = useCallback((permission) =>
    user?.permissions?.includes(permission) ?? false,
  [user]);

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, can, isAdmin, isManager, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Exportamos la instancia de API para que otros servicios la usen
export { API };
