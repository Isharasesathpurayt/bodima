import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BodimaHouse {
  id: string;
  name: string;
  password?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'admin' | 'collector' | 'member';
  roleTitleSi?: string;
  roleTitleEn?: string;
  avatar?: string;
  bodimaId?: string;
  eatsAtBodima?: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  bodima: BodimaHouse | null;
  token: string | null;
  isAuthenticated: boolean;
  isBodimaConnected: boolean;
  isCollectorOrAdmin: boolean;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginUser: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (name: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickLoginUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  connectBodima: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  selectExistingBodima: (bodima: BodimaHouse) => void;
  joinBodima: (name: string, password: string, userName?: string, userPhone?: string) => Promise<{ success: boolean; error?: string }>;
  registerBodima: (name: string, password: string, creatorName?: string, creatorPhone?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: {
    name?: string;
    phone?: string;
    avatar?: string;
    roleTitleSi?: string;
    eatsAtBodima?: boolean;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      branch?: string;
    };
  }) => Promise<{ success: boolean; error?: string }>;
  leaveBodima: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bodima_jwt_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('bodima_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [bodima, setBodima] = useState<BodimaHouse | null>(() => {
    const saved = localStorage.getItem('bodima_current_house');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem('bodima_jwt_token', token);
    else localStorage.removeItem('bodima_jwt_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('bodima_auth_user', JSON.stringify(user));
    else localStorage.removeItem('bodima_auth_user');
  }, [user]);

  useEffect(() => {
    if (bodima) localStorage.setItem('bodima_current_house', JSON.stringify(bodima));
    else localStorage.removeItem('bodima_current_house');
  }, [bodima]);

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const parseSafeJson = async (res: Response) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return { error: 'සේවාදායකයෙන් දෝෂ සහිත ප්‍රතිචාරයක් ලැබුණි (Invalid server response)' };
    }
  };

  // 1. User Login (Step 1)
  const loginUser = async (identifier: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await parseSafeJson(res);
      if (!res.ok) {
        return { success: false, error: data.error || 'ලොග් වීම අසාර්ථක විය' };
      }

      setToken(data.token);
      setUser(data.user);
      if (data.bodima) {
        setBodima(data.bodima);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ජාල දෝෂයක් (Network error)' };
    }
  };

  // 2. User Register (Step 1)
  const registerUser = async (name: string, phone: string, password: string) => {
    try {
      const res = await fetch('/api/auth/user-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password })
      });
      const data = await parseSafeJson(res);
      if (!res.ok) {
        return { success: false, error: data.error || 'ගිණුම සෑදීම අසාර්ථක විය' };
      }

      setToken(data.token);
      setUser(data.user);
      setBodima(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ජාල දෝෂයක් (Network error)' };
    }
  };

  // 3. Quick Login with User ID (Step 1)
  const quickLoginUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await parseSafeJson(res);
      if (!res.ok) {
        return { success: false, error: data.error || 'ලොග් වීම අසාර්ථක විය' };
      }

      setToken(data.token);
      setUser(data.user);
      if (data.bodima) {
        setBodima(data.bodima);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ජාල දෝෂයක් (Network error)' };
    }
  };

  // 4. Connect Authenticated User to Bodima (Step 2)
  const connectBodima = async (name: string, password: string) => {
    try {
      const res = await fetch('/api/bodima/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name, password })
      });
      const data = await parseSafeJson(res);
      if (!res.ok) {
        return { success: false, error: data.error || 'බෝඩිමට සම්බන්ධ වීම අසාර්ථක විය' };
      }

      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      setBodima(data.bodima);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ජාල දෝෂයක් (Network error)' };
    }
  };

  const selectExistingBodima = (b: BodimaHouse) => {
    setBodima(b);
  };

  // 5. Join Bodima (Legacy / fallback)
  const joinBodima = async (name: string, password: string, userName?: string, userPhone?: string) => {
    try {
      const res = await fetch('/api/bodima/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          password,
          userName: userName || user?.name || 'සාමාජික',
          userPhone: userPhone || user?.phone || '+94',
          userId: user?.id
        })
      });
      const data = await parseSafeJson(res);
      if (!res.ok) {
        return { success: false, error: data.error || 'සම්බන්ධ වීම අසාර්ථක විය' };
      }

      setToken(data.token);
      setUser(data.user);
      setBodima(data.bodima);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ජාල දෝෂයක් (Network error)' };
    }
  };

  // 6. Register a New Bodima (Step 2 or modal)
  const registerBodima = async (name: string, password: string, creatorName?: string, creatorPhone?: string) => {
    try {
      const res = await fetch('/api/bodima/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name,
          password,
          creatorName: creatorName || user?.name,
          creatorPhone: creatorPhone || user?.phone
        })
      });
      const data = await parseSafeJson(res);
      if (!res.ok) {
        return { success: false, error: data.error || 'බෝඩිම ලියාපදිංචි කිරීම අසාර්ථක විය' };
      }

      setToken(data.token);
      setUser(data.user);
      setBodima(data.bodima);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'ජාල දෝෂයක් (Network error)' };
    }
  };

  // 7. Update Profile & Avatar Photo
  const updateProfile = async (updates: {
    name?: string;
    phone?: string;
    avatar?: string;
    roleTitleSi?: string;
    eatsAtBodima?: boolean;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      branch?: string;
    };
  }) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await parseSafeJson(res);
      if (!res.ok) {
        return { success: false, error: data.error || 'යාවත්කාලීන කිරීම අසාර්ථක විය' };
      }

      setUser(data.user);
      if (data.token) setToken(data.token);
      return { success: true };
    } catch (err: any) {
      if (user) {
        setUser({ ...user, ...updates });
      }
      return { success: true };
    }
  };

  // Switch Bodima: Clears current bodima, prompts user to select or join a bodima
  const leaveBodima = () => {
    setBodima(null);
    localStorage.removeItem('bodima_current_house');
  };

  // Complete Logout: Clears user and bodima session
  const logout = () => {
    setUser(null);
    setBodima(null);
    setToken(null);
    localStorage.removeItem('bodima_jwt_token');
    localStorage.removeItem('bodima_auth_user');
    localStorage.removeItem('bodima_current_house');
  };

  const isCollectorOrAdmin = user?.role === 'admin' || user?.role === 'collector';
  const isBodimaConnected = Boolean(bodima && bodima.id);

  return (
    <AuthContext.Provider
      value={{
        user,
        bodima,
        token,
        isAuthenticated: !!user,
        isBodimaConnected,
        isCollectorOrAdmin,
        isSettingsOpen,
        openSettings,
        closeSettings,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginUser,
        registerUser,
        quickLoginUser,
        connectBodima,
        selectExistingBodima,
        joinBodima,
        registerBodima,
        updateProfile,
        leaveBodima,
        logout
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
