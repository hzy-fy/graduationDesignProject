import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phone: string;
  constitution?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isFirstLogin: boolean;
  login: (token: string, user: User, isFirstLogin: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isFirstLogin: false,
      login: (token, user, isFirstLogin) => set({ token, user, isFirstLogin }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
