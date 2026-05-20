import { createContext } from 'react';
import type { Me } from '../api/types';

export type AuthState = {
  token: string | null;
  user: Me | null;
  ready: boolean;
  busy: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<void>;
  register: (
    phone: string,
    password: string,
    displayName: string,
    acceptTerms: boolean,
    email?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
