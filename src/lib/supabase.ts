import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase credentials from LocalStorage or environment variables
export const getSupabaseConfig = () => {
  const url = localStorage.getItem('bodima_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem('bodima_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
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
      auth: { persistSession: false }
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

// SQL setup script for Supabase SQL Editor
export const SUPABASE_SQL_SETUP = `-- බෝඩිම (Bodima.lk) Supabase PostgreSQL Database Setup
-- Run this in your Supabase SQL Editor (1-click setup)

-- 1. Bodimas Table
CREATE TABLE IF NOT EXISTS bodimas (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  bodima_id TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'member',
  role_title_si TEXT,
  role_title_en TEXT,
  avatar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  eats_at_bodima BOOLEAN DEFAULT TRUE,
  bank_name TEXT,
  bank_account TEXT,
  bank_account_name TEXT,
  bank_branch TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  bodima_id TEXT NOT NULL,
  title_si TEXT NOT NULL,
  title_en TEXT,
  category TEXT NOT NULL,
  collector_id TEXT NOT NULL,
  target_per_person NUMERIC NOT NULL,
  due_date TEXT NOT NULL,
  cycle TEXT NOT NULL,
  description_si TEXT,
  description_en TEXT,
  participating_member_ids JSONB DEFAULT '[]'::jsonb,
  collector_bank_info JSONB,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TEXT,
  payment_method TEXT,
  note TEXT
);

-- 5. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  bodima_id TEXT NOT NULL,
  title_si TEXT NOT NULL,
  title_en TEXT,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by_id TEXT NOT NULL,
  date TEXT NOT NULL,
  receipt_url TEXT,
  receipt_name TEXT,
  notes TEXT,
  collection_pool_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shopping Requests Table
CREATE TABLE IF NOT EXISTS shopping_requests (
  id TEXT PRIMARY KEY,
  bodima_id TEXT NOT NULL,
  catalog_item_id TEXT,
  name_si TEXT NOT NULL,
  name_en TEXT,
  unit_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  requested_by_id TEXT NOT NULL,
  requested_at TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  votes JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

-- Enable Row Level Security (RLS) with Public Access policies for boarding house members
ALTER TABLE bodimas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access using Anon Key
CREATE POLICY "Public bodimas access" ON bodimas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public users access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public collections access" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public payments access" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public expenses access" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public shopping access" ON shopping_requests FOR ALL USING (true) WITH CHECK (true);
`;
