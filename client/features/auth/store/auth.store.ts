import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User } from "../types/auth.types";

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setAuth: (token, user) =>
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          }),
        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
          }),
        setLoading: (isLoading) => set({ isLoading }),
        logout: () => {
          set(initialState);
          if (typeof window !== "undefined") {
            localStorage.removeItem("oitesla_auth");
          }
        },
      }),
      {
        name: "oitesla_auth",
        partialize: (state) => ({
          token: state.token,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);

export default useAuthStore;
