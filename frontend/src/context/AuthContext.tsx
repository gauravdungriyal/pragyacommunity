import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '../types';
import { authApi, profileApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isMentor: boolean;
  isStudent: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  register: (userData: { name: string; email: string; password: string; role?: string }) => Promise<AuthResponse>;
  logout: () => void;
  updateCurrentUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('pragya_user') || localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return (
      localStorage.getItem('access_token') ||
      localStorage.getItem('pragya_token') ||
      localStorage.getItem('token')
    );
  });

  // If user and token already exist in localStorage, do not block initial render
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('pragya_user') || localStorage.getItem('user');
    const savedToken =
      localStorage.getItem('access_token') ||
      localStorage.getItem('pragya_token') ||
      localStorage.getItem('token');
    return !(savedUser && savedToken);
  });

  useEffect(() => {
    let isMounted = true;

    // Background verification and fresh profile sync without blocking UI
    const verifyUser = async () => {
      const currentToken =
        localStorage.getItem('access_token') ||
        localStorage.getItem('pragya_token') ||
        localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (currentToken) {
        try {
          // 1. Check token / refresh if needed
          if (refreshToken) {
            const checkRes = await authApi.checkToken(currentToken, refreshToken);
            if (checkRes.status && checkRes.access_token && isMounted) {
              setToken(checkRes.access_token);
              localStorage.setItem('access_token', checkRes.access_token);
              localStorage.setItem('token', checkRes.access_token);
            }
          }

          // 2. Fetch fresh profile details in background if user has valid ID
          const userId = user?.id || user?._id || localStorage.getItem('uid');
          if (userId) {
            const freshData = await profileApi.getProfile(userId);
            if (freshData && isMounted) {
              const normalized: User = {
                id: String(freshData.id || freshData._id || userId),
                _id: String(freshData.id || freshData._id || userId),
                name: freshData.fullname || freshData.name || user?.name || 'User',
                email: freshData.email || user?.email || '',
                role: (freshData.role as any) || user?.role || 'Student',
                avatar: freshData.profile || freshData.avatar || user?.avatar,
                phone: freshData.phone || user?.phone,
                bio: freshData.bio || user?.bio,
                expertise: freshData.expertise || user?.expertise,
                availability: freshData.availability || user?.availability,
                rating: freshData.rating || user?.rating,
                skills: freshData.skills || user?.skills,
              };
              setUser(normalized);
              localStorage.setItem('pragya_user', JSON.stringify(normalized));
              localStorage.setItem('user', JSON.stringify(normalized));
            }
          }
        } catch {
          // Non-blocking catch
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      if (data.status) {
        const authToken = data.access_token || data.token || '';
        const u: User = data.user || {
          id: String(data.uid || '1'),
          _id: String(data.uid || '1'),
          name: data.name || 'User',
          email: credentials.email,
          role: 'Student',
        };

        setUser(u);
        setToken(authToken);

        if (authToken) {
          localStorage.setItem('access_token', authToken);
          localStorage.setItem('token', authToken);
          localStorage.setItem('pragya_token', authToken);
        }
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        if (data.uid) {
          localStorage.setItem('uid', String(data.uid));
        }
        localStorage.setItem('pragya_user', JSON.stringify(u));
        localStorage.setItem('user', JSON.stringify(u));
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string; role?: string }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const data = await authApi.register(userData);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('uid');
    localStorage.removeItem('pragya_token');
    localStorage.removeItem('token');
    localStorage.removeItem('pragya_user');
    localStorage.removeItem('user');
  };

  const updateCurrentUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('pragya_user', JSON.stringify(updated));
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const role = user?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin';
  const isMentor = role === 'mentor';
  const isStudent = role === 'student' || (!isAdmin && !isMentor);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isAdmin,
        isMentor,
        isStudent,
        login,
        register,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
