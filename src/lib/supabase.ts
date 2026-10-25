import { createClient, SupabaseClient } from '@supabase/supabase-js';
import secureSchema from '../../supabase/secure-schema.sql?raw';

// Configure Supabase with environment variables or the Settings screen.
// Never ship a project's credentials as application defaults.
export const DEFAULT_SUPABASE_URL = '';
export const DEFAULT_SUPABASE_ANON_KEY = '';

// Get Supabase credentials from LocalStorage or environment variables or defaults
export const getSupabaseConfig = () => {
  const url = localStorage.getItem('bodima_supabase_url') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = localStorage.getItem('bodima_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConfigured: Boolean(url.trim() && anonKey.trim())
  };
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabase = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && url === lastUrl && anonKey === lastKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (url.trim()) localStorage.setItem('bodima_supabase_url', url.trim());
  else localStorage.removeItem('bodima_supabase_url');

  if (anonKey.trim()) localStorage.setItem('bodima_supabase_anon_key', anonKey.trim());
  else localStorage.removeItem('bodima_supabase_anon_key');

  cachedClient = null;
  lastUrl = '';
  lastKey = '';
};

// SQL setup script for Supabase SQL Editor. Kept in a separate reviewed SQL file.
export const SUPABASE_SQL_SETUP = secureSchema;
