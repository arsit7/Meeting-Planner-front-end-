import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';
import { getMe } from '../api/users.js';
import { setUnauthorizedHandler } from '../api/client.js';
import { clearToken, getToken, getTokenExpiryMs, isTokenExpired, setToken } from './tokenStorage.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" while an existing token is being checked against the backend on first load.
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'ready'));
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback((expired = false) => {
    clearToken();
    setUser(null);
    setSessionExpired(expired);
    setStatus('ready');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (isTokenExpired(token)) {
      logout(true);
      return;
    }
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) logout(true);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Log out as soon as the token expires, even if the user makes no further requests.
  useEffect(() => {
    if (!user) return undefined;
    const expiry = getTokenExpiryMs(getToken());
    if (expiry === null) return undefined;
    const timer = setTimeout(() => logout(true), Math.max(expiry - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [user, logout]);

  const startSession = useCallback((auth) => {
    setToken(auth.token);
    setUser(auth.user);
    setSessionExpired(false);
    setStatus('ready');
  }, []);

  const login = useCallback(
    async (email, password) => startSession(await authApi.login(email, password)),
    [startSession],
  );

  const signup = useCallback(
    async (name, email, password) => startSession(await authApi.signup(name, email, password)),
    [startSession],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: status === 'loading',
      sessionExpired,
      login,
      signup,
      logout: () => logout(false),
      updateUser: setUser,
    }),
    [user, status, sessionExpired, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
