import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  isStaff: boolean;
  /** null until the profile has been read; true once the welcome popup was shown. */
  welcomeSeen: boolean | null;
  dismissWelcome: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  logout: () => void;
  updateCurrentUser: (data: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
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

  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);

  /**
   * Pull the authoritative profile from the API and merge it into local state.
   * Role in particular must come from the server — it gates admin and mentor
   * features, and a stale local copy would show the wrong navigation.
   */
  const syncProfile = useCallback(async (fallbackId?: string | null) => {
    const userId = fallbackId || localStorage.getItem('uid');

    const freshData = await profileApi.getProfile(userId || undefined);
    if (!freshData) return;

    setUser((prev) => {
      const normalized: User = {
        id: String(freshData.id || freshData._id || userId || prev?.id || ''),
        _id: String(freshData.id || freshData._id || userId || prev?.id || ''),
        name: freshData.fullname || freshData.name || prev?.name || 'User',
        email: freshData.email || prev?.email || '',
        role: (freshData.role as any) || prev?.role || 'Student',
        avatar: freshData.profile || freshData.avatar || prev?.avatar,
        phone: freshData.phone ?? prev?.phone,
        bio: freshData.bio ?? prev?.bio,
        expertise: freshData.expertise ?? prev?.expertise,
        availability: prev?.availability,
        rating: prev?.rating,
        skills: (freshData as any).skills || prev?.skills,
      };
      localStorage.setItem('pragya_user', JSON.stringify(normalized));
      localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    });

    if (typeof (freshData as any).welcome_seen !== 'undefined') {
      setWelcomeSeen(Number((freshData as any).welcome_seen) === 1);
    }
  }, []);

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

          // 2. Pull the live profile so role and details are never stale
          if (isMounted) {
            await syncProfile(user?.id || user?._id);
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
  }, [syncProfile]);

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

        // Pull the full profile so the welcome flag and any extra details land
        try {
          await syncProfile(u.id);
        } catch {
          // Login still succeeds if the follow-up sync fails
        }
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const dismissWelcome = async () => {
    setWelcomeSeen(true);
    try {
      await profileApi.markWelcomeSeen();
    } catch {
      // The popup stays dismissed for this session even if the write fails
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWelcomeSeen(null);
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
  const isMentor = role === 'mentor' || role === 'teacher';
  const isStudent = role === 'student' || (!isAdmin && !isMentor);
  const isStaff = isAdmin || isMentor;

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
        isStaff,
        welcomeSeen,
        dismissWelcome,
        login,
        logout,
        updateCurrentUser,
        refreshProfile: () => syncProfile(user?.id),
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
