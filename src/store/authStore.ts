import { create } from 'zustand';

interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  username?: string | null;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setUsername: (username: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  setUsername: (username) => set((state) => ({ user: state.user ? { ...state.user, username } : null })),
}));
