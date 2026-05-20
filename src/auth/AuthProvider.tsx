import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as backend from '../api/backend';
import { setAccessToken, getAccessToken } from '../api/http';
import type { Me } from '../api/types';
import { apiBaseUrl, useMockApi } from '../config';
import { AuthContext, type AuthState } from './context';

function readToken(): string | null {
  return getAccessToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const t = readToken();
    if (!t) {
      setUser(null);
      return;
    }
    const me = await backend.getMe();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = readToken();
      if (!t) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const me = await backend.getMe();
        if (!cancelled) setUser(me);
      } catch {
        setAccessToken(null);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (loginId: string, password: string) => {
      setError(null);
      if (!useMockApi && !apiBaseUrl) {
        setError('Set VITE_API_BASE_URL for live API, or VITE_USE_MOCK_API=true for demo.');
        return;
      }
      setBusy(true);
      try {
        const tokens = await backend.login({ login: loginId, password });
        setAccessToken(tokens.access_token);
        setToken(tokens.access_token);
        await refreshMe();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in failed');
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refreshMe],
  );

  const register = useCallback(
    async (
      phone: string,
      password: string,
      displayName: string,
      acceptTerms: boolean,
      email?: string,
    ) => {
      setError(null);
      if (!acceptTerms) {
        setError('Please accept the terms to create an account.');
        return;
      }
      if (!useMockApi && !apiBaseUrl) {
        setError('Set VITE_API_BASE_URL for live API, or VITE_USE_MOCK_API=true for demo.');
        return;
      }
      setBusy(true);
      try {
        const tokens = await backend.register({
          phone,
          email: email?.trim() || undefined,
          password,
          display_name: displayName.trim(),
          accept_terms: acceptTerms,
        });
        setAccessToken(tokens.access_token);
        setToken(tokens.access_token);
        await refreshMe();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Registration failed');
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await backend.logout();
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      ready,
      busy,
      error,
      login,
      register,
      logout,
      refreshMe,
      clearError,
    }),
    [token, user, ready, busy, error, login, register, logout, refreshMe, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
