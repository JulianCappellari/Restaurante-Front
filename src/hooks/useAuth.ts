'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuth() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for user in localStorage or sessionStorage
    const checkAuth = () => {
      try {
        // This is a mock implementation - replace with your actual auth check
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setAuth({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuth(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setAuth({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, [router]);

  const login = async (email: string, password: string) => {
    // Mock login - replace with your actual login logic
    const mockUser = {
      id: 1,
      email,
      firstName: 'Usuario',
      lastName: 'Demo',
      role: 'customer',
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    setAuth({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    });
    
    return { success: true, user: mockUser };
  };

  const logout = () => {
    localStorage.removeItem('user');
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/auth/login');
  };

  return {
    ...auth,
    login,
    logout,
  };
}

export type { User };
