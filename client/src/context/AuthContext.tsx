import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@shared/types';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const data = await api.get<User>('/users/profile');
      setUser(data);
    } catch (e) {
      console.warn('Failed to restore auth session. Clearing token.');
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('trimaki_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
        email,
        password,
      });

      setUser(data.user);
      localStorage.setItem('trimaki_token', data.accessToken);
      localStorage.setItem('trimaki_refresh_token', data.refreshToken);
      localStorage.setItem('trimaki_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/google', {
        idToken: credential,
      });

      setUser(data.user);
      localStorage.setItem('trimaki_token', data.accessToken);
      localStorage.setItem('trimaki_refresh_token', data.refreshToken);
      localStorage.setItem('trimaki_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, phone: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
        fullName,
        email,
        phone,
        password,
      });

      setUser(data.user);
      localStorage.setItem('trimaki_token', data.accessToken);
      localStorage.setItem('trimaki_refresh_token', data.refreshToken);
      localStorage.setItem('trimaki_user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('trimaki_token');
    localStorage.removeItem('trimaki_refresh_token');
    localStorage.removeItem('trimaki_user');
    disconnectSocket();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await api.put<User>('/users/profile', data);
      setUser(updatedUser);
      localStorage.setItem('trimaki_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to update profile info', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthProvider;
