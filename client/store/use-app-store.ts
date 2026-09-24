import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface AppState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  user: { id: string; name: string; email: string } | null;

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setUser: (user: { id: string; name: string; email: string } | null) => void;
  reset: () => void;
}

const initialState = {
  theme: "system" as const,
  sidebarOpen: false,
  user: null,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        setUser: (user) => set({ user }),
        reset: () => set(initialState),
      }),
      {
        name: "app-storage",
      }
    )
  )
);

export default useAppStore;
