import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth.types";

interface AuthState {
  user?: User;
  accessToken: string | null;
  refreshToken: string | null;
  temporaryLoginCredentials?: { email: string; password: string } | null;

  setUser: (user: User) => void;
  resetUser: () => void;

  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setTemporaryLoginCredentials: (credentials: { email: string; password: string } | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      accessToken: null,
      refreshToken: null,
      temporaryLoginCredentials: null,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setTemporaryLoginCredentials: (credentials) =>
        set({ temporaryLoginCredentials: credentials }),

      resetUser: () =>
        set({
          user: undefined,
          accessToken: null,
          refreshToken: null,
          temporaryLoginCredentials: null,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
