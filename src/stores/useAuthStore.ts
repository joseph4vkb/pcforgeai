import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  email: string | null;
  role: "admin" | "user" | null;
  setAuth: (token: string, email: string, role: "admin" | "user") => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      role: null,
      setAuth: (token, email, role) => set({ token, email, role }),
      logout: () => set({ token: null, email: null, role: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
