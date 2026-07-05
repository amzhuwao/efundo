'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@efundo/shared-types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  hasHydrated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  accessToken: () => string | null;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      hasHydrated: false,
      setAuth: (user, tokens) => set({ user, tokens }),
      logout: () => set({ user: null, tokens: null }),
      accessToken: () => get().tokens?.accessToken ?? null,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'efundo-auth',
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
