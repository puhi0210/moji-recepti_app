import { create } from "zustand";
import { loginRequest, meRequest } from "../api/auth.api";
import { clearTokens, getTokens, saveTokens } from "./tokenStorage";
import type { AuthUser } from "../types/auth.types";

type AuthState = {
  user: AuthUser | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,
  isAuthenticated: false,

  login: async (email, password) => {
    const data = await loginRequest({ email, password });

    await saveTokens(data.tokens);

    set({
      user: data.user,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  hydrate: async () => {
    try {
      const tokens = await getTokens();

      if (!tokens) {
        set({
          user: null,
          isAuthenticated: false,
          isHydrated: true,
        });
        return;
      }

      const user = await meRequest();

      set({
        user,
        isAuthenticated: true,
        isHydrated: true,
      });
    } catch {
      await clearTokens();

      set({
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },

  logout: async () => {
    await clearTokens();

    set({
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
}));