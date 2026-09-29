import { create } from "zustand";

export type AuthModalMode = "login" | "register";
export type AuthRole = "PASSENGER" | "DRIVER";

export interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  role: AuthRole;
  openModal: (mode?: AuthModalMode, role?: AuthRole) => void;
  closeModal: () => void;
  setMode: (mode: AuthModalMode) => void;
  setRole: (role: AuthRole) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "login",
  role: "PASSENGER",
  openModal: (mode = "login", role = "PASSENGER") =>
    set({ isOpen: true, mode, role }),
  closeModal: () => set({ isOpen: false }),
  setMode: (mode: AuthModalMode) => set({ mode }),
  setRole: (role: AuthRole) => set({ role }),
}));

export default useAuthModalStore;
