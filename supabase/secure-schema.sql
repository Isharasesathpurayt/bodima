-- Bodima.lk schema for the Supabase Free project.
-- Run in Supabase SQL Editor. All application tables require Supabase Auth;
-- house membership is enforced by row-level security policies below.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.bodimas (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bodimas ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.bodimas ALTER COLUMN password DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.users (
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
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bodima_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_branch TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS eats_at_bodima BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.collections (
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
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS participating_member_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS collector_bank_info JSONB;

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TEXT,
  payment_method TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS public.expenses (
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

CREATE TABLE IF NOT EXISTS public.shopping_requests (
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

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id TEXT PRIMARY KEY,
  bodima_id TEXT NOT NULL,
  name_si TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  estimated_price NUMERIC NOT NULL,
  last_updated TEXT
);

CREATE OR REPLACE FUNCTION public.connection_check()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT TRUE $$;
REVOKE ALL ON FUNCTION public.connection_check() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.connection_check() TO anon, authenticated;

DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY['bodimas','users','collections','payments','expenses','shopping_requests','catalog_items'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END
$$;

ALTER TABLE public.bodimas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.bodimas, public.users, public.collections, public.payments,
  public.expenses, public.shopping_requests, public.catalog_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections, public.payments,
  public.expenses, public.shopping_requests, public.catalog_items TO authenticated;

CREATE OR REPLACE FUNCTION public.current_bodima_id()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$ SELECT bodima_id FROM public.users WHERE id = auth.uid()::text LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_bodima_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$ SELECT role FROM public.users WHERE id = auth.uid()::text LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.is_bodima_manager()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$ SELECT COALESCE(public.current_bodima_role() IN ('admin','collector'), FALSE) $$;

REVOKE ALL ON FUNCTION public.current_bodima_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_bodima_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_bodima_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_bodima_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_bodima_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bodima_manager() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_bodima(p_name TEXT, p_password TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE new_id TEXT; house public.bodimas;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF length(trim(p_name)) < 2 OR length(p_password) < 6 THEN RAISE EXCEPTION 'House name and a password of at least 6 characters are required'; END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND bodima_id IS NOT NULL) THEN RAISE EXCEPTION 'Already connected to a house'; END IF;
  new_id := 'b_' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.bodimas (id, name, password_hash, created_by)
    VALUES (new_id, trim(p_name), extensions.crypt(p_password, extensions.gen_salt('bf')), auth.uid()::text)
    RETURNING * INTO house;
  UPDATE public.users SET bodima_id = new_id, role = 'admin', role_title_si = 'මාසික කුලී භාරකරු', role_title_en = 'Rent Collector / Admin'
    WHERE id = auth.uid()::text;
  RETURN jsonb_build_object('id', house.id, 'name', house.name, 'password', p_password, 'created_by', house.created_by);
END;
$$;

CREATE OR REPLACE FUNCTION public.connect_bodima(p_name TEXT, p_password TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE house public.bodimas; existing_id TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT bodima_id INTO existing_id FROM public.users WHERE id = auth.uid()::text;
  SELECT * INTO house FROM public.bodimas WHERE lower(name) = lower(trim(p_name)) LIMIT 1;
  IF house.id IS NULL THEN RAISE EXCEPTION 'House not found'; END IF;
  IF house.password_hash IS NOT NULL THEN
    IF house.password_hash <> extensions.crypt(p_password, house.password_hash) THEN RAISE EXCEPTION 'Incorrect house password'; END IF;
  ELSIF house.password IS DISTINCT FROM p_password THEN
    RAISE EXCEPTION 'Incorrect house password';
  ELSE
    UPDATE public.bodimas SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')), password = NULL WHERE id = house.id;
  END IF;
  IF existing_id IS NOT NULL AND existing_id <> house.id THEN RAISE EXCEPTION 'Leave your current house before joining another'; END IF;
  UPDATE public.users SET bodima_id = house.id WHERE id = auth.uid()::text;
  RETURN jsonb_build_object('id', house.id, 'name', house.name, 'password', p_password, 'created_by', house.created_by);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_bodima()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  UPDATE public.users SET bodima_id = NULL, role = 'member' WHERE id = auth.uid()::text;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_bodima(TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.connect_bodima(TEXT,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_bodima() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_bodima(TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.connect_bodima(TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_bodima() TO authenticated;

CREATE POLICY users_read_house ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR bodima_id = public.current_bodima_id());
CREATE POLICY users_add_self ON public.users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text AND bodima_id IS NULL AND role = 'member');
CREATE POLICY users_add_member ON public.users FOR INSERT TO authenticated
  WITH CHECK (public.is_bodima_manager() AND bodima_id = public.current_bodima_id());
CREATE POLICY users_update_self ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);
CREATE POLICY users_update_house ON public.users FOR UPDATE TO authenticated
  USING (public.is_bodima_manager() AND bodima_id = public.current_bodima_id())
  WITH CHECK (public.is_bodima_manager() AND bodima_id = public.current_bodima_id());
CREATE POLICY users_delete_house ON public.users FOR DELETE TO authenticated
  USING (public.is_bodima_manager() AND bodima_id = public.current_bodima_id() AND id <> auth.uid()::text);

CREATE POLICY bodimas_read_house ON public.bodimas FOR SELECT TO authenticated
  USING (id = public.current_bodima_id());

CREATE POLICY collections_read_house ON public.collections FOR SELECT TO authenticated
  USING (bodima_id = public.current_bodima_id());
CREATE POLICY collections_add_house ON public.collections FOR INSERT TO authenticated
  WITH CHECK (public.is_bodima_manager() AND bodima_id = public.current_bodima_id());
CREATE POLICY collections_update_house ON public.collections FOR UPDATE TO authenticated
  USING (public.is_bodima_manager() AND bodima_id = public.current_bodima_id())
  WITH CHECK (public.is_bodima_manager() AND bodima_id = public.current_bodima_id());
CREATE POLICY collections_delete_house ON public.collections FOR DELETE TO authenticated
  USING (public.is_bodima_manager() AND bodima_id = public.current_bodima_id());

CREATE POLICY payments_read_house ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.bodima_id = public.current_bodima_id()));
CREATE POLICY payments_add_house ON public.payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.bodima_id = public.current_bodima_id()));
CREATE POLICY payments_update_house ON public.payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.bodima_id = public.current_bodima_id()
    AND (c.collector_id = auth.uid()::text OR public.is_bodima_manager())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.bodima_id = public.current_bodima_id()));
CREATE POLICY payments_delete_house ON public.payments FOR DELETE TO authenticated
  USING (public.is_bodima_manager() AND EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.bodima_id = public.current_bodima_id()));

CREATE POLICY expenses_read_house ON public.expenses FOR SELECT TO authenticated
  USING (bodima_id = public.current_bodima_id());
CREATE POLICY expenses_add_house ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (bodima_id = public.current_bodima_id());
CREATE POLICY expenses_update_house ON public.expenses FOR UPDATE TO authenticated
  USING (public.is_bodima_manager() AND bodima_id = public.current_bodima_id())
  WITH CHECK (public.is_bodima_manager() AND bodima_id = public.current_bodima_id());
CREATE POLICY expenses_delete_house ON public.expenses FOR DELETE TO authenticated
  USING (bodima_id = public.current_bodima_id() AND (public.is_bodima_manager() OR paid_by_id = auth.uid()::text));

CREATE POLICY shopping_read_house ON public.shopping_requests FOR SELECT TO authenticated
  USING (bodima_id = public.current_bodima_id());
CREATE POLICY shopping_add_house ON public.shopping_requests FOR INSERT TO authenticated
  WITH CHECK (bodima_id = public.current_bodima_id() AND requested_by_id = auth.uid()::text);
CREATE POLICY shopping_update_house ON public.shopping_requests FOR UPDATE TO authenticated
  USING (bodima_id = public.current_bodima_id()) WITH CHECK (bodima_id = public.current_bodima_id());
CREATE POLICY shopping_delete_house ON public.shopping_requests FOR DELETE TO authenticated
  USING (bodima_id = public.current_bodima_id() AND (public.is_bodima_manager() OR requested_by_id = auth.uid()::text));

CREATE POLICY catalog_read_house ON public.catalog_items FOR SELECT TO authenticated
  USING (bodima_id = public.current_bodima_id());
CREATE POLICY catalog_add_house ON public.catalog_items FOR INSERT TO authenticated
  WITH CHECK (bodima_id = public.current_bodima_id());
CREATE POLICY catalog_update_house ON public.catalog_items FOR UPDATE TO authenticated
  USING (bodima_id = public.current_bodima_id()) WITH CHECK (bodima_id = public.current_bodima_id());
CREATE POLICY catalog_delete_house ON public.catalog_items FOR DELETE TO authenticated
  USING (bodima_id = public.current_bodima_id());

-- Restrict profile changes to ordinary profile fields; only the RPCs above can
-- assign a user to a house or make its creator an administrator.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (name, phone, email, role_title_si, role_title_en, avatar, is_active,
  eats_at_bodima, bank_name, bank_account, bank_account_name, bank_branch)
  ON public.users TO authenticated;
