import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  googleLogin: (email: string, name: string, googleId: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (password: string, token: string) => Promise<string>;
  verifyEmail: (token: string) => Promise<string>;
  bypassAuth: (name?: string, email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto load token and verify session on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data);
        } catch (err) {
          console.error('Session restore failed:', err);
          // Clean up expired session
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;
      
      setToken(userToken);
      setUser(userData);

      if (rememberMe) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('token', userToken);
        // Still keep in state, but clear from localStorage
        localStorage.removeItem('token');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (email: string, name: string, googleId: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { email, name, googleId });
      const { token: userToken, user: userData } = res.data;

      setToken(userToken);
      setUser(userData);
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const register = async (name: string, email: string, password: string): Promise<string> => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      return res.data.message;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Registration failed.');
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data.message;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to request reset link.');
    }
  };

  const resetPassword = async (password: string, resetToken: string): Promise<string> => {
    try {
      const res = await api.post('/auth/reset-password', { password, token: resetToken });
      return res.data.message;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const verifyEmail = async (verificationToken: string): Promise<string> => {
    try {
      const res = await api.get(`/auth/verify-email?token=${verificationToken}`);
      return res.data.message;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Email verification failed.');
    }
  };

  const bypassAuth = (customName?: string, customEmail?: string) => {
    const mockUserData: UserProfile = {
      id: 'guest-user-id',
      name: customName || 'Guest Patient',
      email: customEmail || 'guest@symptomcare.ai',
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    const mockToken = 'guest-mock-jwt-token';
    setToken(mockToken);
    setUser(mockUserData);
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUserData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        googleLogin,
        logout,
        register,
        forgotPassword,
        resetPassword,
        verifyEmail,
        bypassAuth,
      }}
    >
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
