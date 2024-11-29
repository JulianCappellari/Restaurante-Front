import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
}

const useAuthStore = create<AuthState>(
  devtools((set) => ({
    isAuthenticated: false,
    setAuthenticated: (status) => {
      console.log('Changing authentication state:', status);
      set({ isAuthenticated: status });
    },
  }))
);

export default useAuthStore;
