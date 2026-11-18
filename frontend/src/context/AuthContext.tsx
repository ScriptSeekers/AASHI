import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDTO, LoginInput, RegisterInput } from '@aashi/shared';
import { authApi } from '../api/endpoints.js';
import { soundManager } from '../utils/sound.js';

interface AuthContextType {
  user: UserDTO | null;
  loading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
      soundManager.setEnabled(res.user.soundEnabled ?? true);
    } catch {
      setUser(null);
      localStorage.removeItem('aashi_token');
      localStorage.removeItem('duvora_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.token) {
        localStorage.setItem('aashi_token', res.token);
      }
      setUser(res.user);
      soundManager.setEnabled(res.user.soundEnabled ?? true);
      soundManager.playPop();
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.token) {
        localStorage.setItem('aashi_token', res.token);
      }
      setUser(res.user);
      soundManager.setEnabled(true);
      soundManager.playVictory();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('aashi_token');
    localStorage.removeItem('duvora_token');
    setUser(null);
    soundManager.playPop();
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
