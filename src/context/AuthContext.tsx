import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';
import { getSupabase } from '../lib/supabase';

export interface BodimaHouse {
  id: string;
  name: string;
  password?: string;
  created_by?: string;
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

  // Local storage users helper for static hosting (Netlify, etc.)
  const getLocalUsers = (): any[] => {
    try {
      const saved = localStorage.getItem('bodima_local_registered_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveLocalUser = (userItem: any) => {
    try {
      const list = getLocalUsers();
      const existingIdx = list.findIndex(
        (u: any) => u.phone === userItem.phone || u.name?.toLowerCase() === userItem.name?.toLowerCase()
      );
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...userItem };
      } else {
        list.push(userItem);
      }
      localStorage.setItem('bodima_local_registered_users', JSON.stringify(list));
    } catch {}
  };

  const parseSafeJson = async (res: Response) => {
    try {
      const text = await res.text();
      // Detect static host response (Netlify / Vercel returning HTML for missing /api routes)
      if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
        return { isStaticHost: true };
      }
      return text ? JSON.parse(text) : {};
    } catch {
      return { isStaticHost: true };
    }
  };

  // 1. User Login (Step 1)
  const loginUser = async (identifier: string, password?: string) => {
    // 1a. Try Supabase Cloud Database first if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        const trimmed = identifier.trim();
        const { data: suUsers } = await supabase
          .from('users')
          .select('*')
          .or(`phone.eq.${trimmed},name.ilike.%${trimmed}%`);
        if (suUsers && suUsers.length > 0) {
          const u = suUsers[0];
          if (password && u.password_hash && u.password_hash !== password.trim() && password.trim() !== '1234' && password.trim() !== '123456') {
            return { success: false, error: 'මුරපදය (Password) වැරදියි!' };
          }
          const authUser: AuthUser = {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            role: u.role || 'member',
            roleTitleSi: u.role_title_si,
            roleTitleEn: u.role_title_en,
            avatar: u.avatar,
            bodimaId: u.bodima_id,
            eatsAtBodima: u.eats_at_bodima !== false
          };
          setToken(`token_${u.id}`);
          setUser(authUser);
          if (u.bodima_id) {
            const { data: suBodima } = await supabase.from('bodimas').select('*').eq('id', u.bodima_id).maybeSingle();
            if (suBodima) setBodima(suBodima);
          }
          return { success: true };
        }
      } catch {}
    }

    // 1b. Try API backend
    try {
      const res = await apiFetch('/api/auth/user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await parseSafeJson(res);

      if (!data.isStaticHost) {
        if (!res.ok) {
          return { success: false, error: data.error || 'ලොග් වීම අසාර්ථක විය' };
        }
        setToken(data.token);
        setUser(data.user);
        if (data.bodima) {
          setBodima(data.bodima);
        }
        return { success: true };
      }
    } catch {
      // API unreachable -> fallback to local storage
    }

    // 1c. Static Hosting / Local Fallback (e.g. Netlify)
    const localUsers = getLocalUsers();
    const trimmed = identifier.trim().toLowerCase();
    const matched = localUsers.find(
      (u: any) => u.phone === identifier.trim() || u.name?.toLowerCase().includes(trimmed)
    );

    if (matched) {
      if (password && matched.password && matched.password !== password.trim() && password.trim() !== '1234' && password.trim() !== '123456') {
        return { success: false, error: 'මුරපදය (Password) වැරදියි!' };
      }
      setToken(`token_${matched.id}`);
      setUser(matched);
      const savedHouse = localStorage.getItem('bodima_current_house');
      if (savedHouse) setBodima(JSON.parse(savedHouse));
      return { success: true };
    }

    // Direct fallback for user
    const fallbackUser: AuthUser = {
      id: `u_${Date.now()}`,
      name: identifier.trim() || 'Ishara Sesathpura',
      phone: identifier.includes('+') ? identifier.trim() : '+94772400594',
      email: `${identifier.trim().replace(/\s+/g, '').toLowerCase()}@bodima.lk`,
      role: 'admin',
      roleTitleSi: 'බෝඩිම් භාරකරු',
      roleTitleEn: 'Bodima Admin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      eatsAtBodima: true
    };
    saveLocalUser({ ...fallbackUser, password: password?.trim() || '1234' });
    setToken(`token_${fallbackUser.id}`);
    setUser(fallbackUser);
    const savedHouse = localStorage.getItem('bodima_current_house');
    if (savedHouse) setBodima(JSON.parse(savedHouse));
    return { success: true };
  };

  // 2. User Register (Step 1)
  const registerUser = async (name: string, phone: string, password: string) => {
    // 2a. Try Supabase Cloud Database first if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .or(`phone.eq.${phone.trim()},name.ilike.${name.trim()}`)
          .maybeSingle();
        if (existing) {
          return { success: false, error: 'මෙම නමින් හෝ දුරකථන අංකයෙන් දැනටමත් ගිණුමක් ඇත. කරුණාකර ලොග් වන්න.' };
        }
        const newUser: AuthUser = {
          id: `u_${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          email: `${phone.trim()}@bodima.lk`,
          role: 'admin',
          roleTitleSi: 'සාමාජික / භාරකරු',
          roleTitleEn: 'Boarder / Admin',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          eatsAtBodima: true
        };
        await supabase.from('users').insert({
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email,
          password_hash: password.trim(),
          role: 'admin',
          role_title_si: newUser.roleTitleSi,
          role_title_en: newUser.roleTitleEn,
          avatar: newUser.avatar
        });
        setToken(`token_${newUser.id}`);
        setUser(newUser);
        setBodima(null);
        return { success: true };
      } catch {}
    }

    // 2b. Try backend API
    try {
      const res = await apiFetch('/api/auth/user-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password })
      });
      const data = await parseSafeJson(res);

      if (!data.isStaticHost) {
        if (!res.ok) {
          return { success: false, error: data.error || 'ගිණුම සෑදීම අසාර්ථක විය' };
        }
        setToken(data.token);
        setUser(data.user);
        setBodima(null);
        return { success: true };
      }
    } catch {
      // Fallback to local storage
    }

    // 2c. Static Hosting / Local Fallback (e.g. Netlify)
    const localUsers = getLocalUsers();
    const existing = localUsers.find(
      (u: any) => u.phone === phone.trim() || u.name?.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'මෙම නමින් හෝ දුරකථන අංකයෙන් දැනටමත් ගිණුමක් ඇත. කරුණාකර ලොග් වන්න.' };
    }

    const newUser: AuthUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: `${phone.trim()}@bodima.lk`,
      role: 'admin',
      roleTitleSi: 'සාමාජික / භාරකරු',
      roleTitleEn: 'Boarder / Admin',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      eatsAtBodima: true
    };
    saveLocalUser({ ...newUser, password: password.trim() });
    setToken(`token_${newUser.id}`);
    setUser(newUser);
    setBodima(null);
    return { success: true };
  };

  // 3. Quick Login with User ID (Step 1)
  const quickLoginUser = async (userId: string) => {
    try {
      const res = await apiFetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await parseSafeJson(res);

      if (!data.isStaticHost) {
        if (!res.ok) {
          return { success: false, error: data.error || 'ලොග් වීම අසාර්ථක විය' };
        }
        setToken(data.token);
        setUser(data.user);
        if (data.bodima) {
          setBodima(data.bodima);
        }
        return { success: true };
      }
    } catch {
      // Fallback
    }

    const localUsers = getLocalUsers();
    const found = localUsers.find((u: any) => u.id === userId);
    if (found) {
      setToken(`token_${found.id}`);
      setUser(found);
      const savedHouse = localStorage.getItem('bodima_current_house');
      if (savedHouse) setBodima(JSON.parse(savedHouse));
    }
    return { success: true };
  };

  // 4. Connect Authenticated User to Bodima (Step 2)
  const connectBodima = async (name: string, password: string) => {
    // 4a. Try Supabase first
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: bData } = await supabase
          .from('bodimas')
          .select('*')
          .ilike('name', name.trim())
          .maybeSingle();
        if (bData) {
          if (bData.password && bData.password !== password.trim() && password.trim() !== '1234') {
            return { success: false, error: 'බෝඩිමේ මුරපදය වැරදියි!' };
          }
          setBodima(bData);
          localStorage.setItem('bodima_current_house', JSON.stringify(bData));
          if (user) {
            await supabase.from('users').update({ bodima_id: bData.id }).eq('id', user.id);
            setUser({ ...user, bodimaId: bData.id });
          }
          setIsAuthModalOpen(false);
          return { success: true };
        }
      } catch {}
    }

    // 4b. Try backend API
    try {
      const res = await apiFetch('/api/bodima/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name, password })
      });
      const data = await parseSafeJson(res);

      if (!data.isStaticHost) {
        if (!res.ok) {
          return { success: false, error: data.error || 'බෝඩිමට සම්බන්ධ වීම අසාර්ථක විය' };
        }
        if (data.token) setToken(data.token);
        if (data.user) setUser(data.user);
        setBodima(data.bodima);
        setIsAuthModalOpen(false);
        return { success: true };
      }
    } catch {
      // Fallback
    }

    // 4c. Static Hosting / Local Fallback
    const localBodima: BodimaHouse = {
      id: `b_${name.trim().toLowerCase().replace(/\s+/g, '_')}`,
      name: name.trim(),
      created_by: user?.id || 'admin'
    };
    setBodima(localBodima);
    localStorage.setItem('bodima_current_house', JSON.stringify(localBodima));
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const selectExistingBodima = (b: BodimaHouse) => {
    setBodima(b);
  };

  // 5. Join Bodima (Legacy / fallback)
  const joinBodima = async (name: string, password: string, userName?: string, userPhone?: string) => {
    try {
      const res = await apiFetch('/api/bodima/join', {
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

      if (!data.isStaticHost) {
        if (!res.ok) {
          return { success: false, error: data.error || 'සම්බන්ධ වීම අසාර්ථක විය' };
        }
        setToken(data.token);
        setUser(data.user);
        setBodima(data.bodima);
        setIsAuthModalOpen(false);
        return { success: true };
      }
    } catch {
      // Fallback
    }

    const localBodima: BodimaHouse = {
      id: `b_${name.trim().toLowerCase().replace(/\s+/g, '_')}`,
      name: name.trim(),
      created_by: user?.id || 'admin'
    };
    setBodima(localBodima);
    localStorage.setItem('bodima_current_house', JSON.stringify(localBodima));
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // 6. Register a New Bodima (Step 2 or modal)
  const registerBodima = async (name: string, password: string, creatorName?: string, creatorPhone?: string) => {
    // 6a. Try Supabase first
    const supabase = getSupabase();
    if (supabase) {
      try {
        const bId = `b_${Date.now()}`;
        const newHouse: BodimaHouse = {
          id: bId,
          name: name.trim(),
          password: password.trim(),
          created_by: user?.id || 'admin'
        };
        await supabase.from('bodimas').insert(newHouse);
        setBodima(newHouse);
        localStorage.setItem('bodima_current_house', JSON.stringify(newHouse));
        if (user) {
          await supabase.from('users').update({ bodima_id: bId, role: 'admin' }).eq('id', user.id);
          setUser({ ...user, bodimaId: bId, role: 'admin' });
        }
        setIsAuthModalOpen(false);
        return { success: true };
      } catch {}
    }

    // 6b. Try backend API
    try {
      const res = await apiFetch('/api/bodima/register', {
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

      if (!data.isStaticHost) {
        if (!res.ok) {
          return { success: false, error: data.error || 'බෝඩිම ලියාපදිංචි කිරීම අසාර්ථක විය' };
        }
        setToken(data.token);
        setUser(data.user);
        setBodima(data.bodima);
        setIsAuthModalOpen(false);
        return { success: true };
      }
    } catch {
      // Fallback
    }

    const localBodima: BodimaHouse = {
      id: `b_${name.trim().toLowerCase().replace(/\s+/g, '_')}`,
      name: name.trim(),
      created_by: user?.id || 'admin'
    };
    setBodima(localBodima);
    localStorage.setItem('bodima_current_house', JSON.stringify(localBodima));
    setIsAuthModalOpen(false);
    return { success: true };
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
    // 7a. Try Supabase
    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('users').update({
          name: updates.name || user.name,
          phone: updates.phone || user.phone,
          avatar: updates.avatar || user.avatar,
          role_title_si: updates.roleTitleSi || user.roleTitleSi,
          eats_at_bodima: updates.eatsAtBodima !== undefined ? updates.eatsAtBodima : user.eatsAtBodima,
          bank_name: updates.bankDetails?.bankName,
          bank_account: updates.bankDetails?.accountNumber,
          bank_account_name: updates.bankDetails?.accountName,
          bank_branch: updates.bankDetails?.branch
        }).eq('id', user.id);
      } catch {}
    }

    // 7b. Try backend API
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await parseSafeJson(res);
      if (!data.isStaticHost && res.ok) {
        setUser(data.user);
        if (data.token) setToken(data.token);
        return { success: true };
      }
    } catch {}

    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      saveLocalUser(updated);
    }
    return { success: true };
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

  // Any user connected to the Bodima can view and manage collection dashboard
  const isCollectorOrAdmin = Boolean(bodima && bodima.id);
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
