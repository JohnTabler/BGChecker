-- ============================================================
-- BGTrack — Supabase Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- 1. USERS TABLE
-- Mirrors auth.users with role assignment
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','manager','viewer')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. RECORDS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project         TEXT NOT NULL,
  employee_name   TEXT NOT NULL,
  date_ordered    DATE,
  date_processed  DATE,
  vendor          TEXT,
  status          TEXT CHECK (status IN ('Pending','Cleared','Failed','Cancelled')),
  expiration_date DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS records_updated_at ON public.records;
CREATE TRIGGER records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 3. SETTINGS TABLE
-- Stores app-wide config (reminder window)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_days INT NOT NULL DEFAULT 20,
  updated_by    UUID REFERENCES public.users(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings row
INSERT INTO public.settings (reminder_days)
VALUES (20)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;


-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;


-- ---- USERS policies ----

-- All authenticated users can read users table (for nav/display)
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can update roles
CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Only admin can delete users
CREATE POLICY "users_delete_admin"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');


-- ---- RECORDS policies ----

-- All authenticated users can read records
CREATE POLICY "records_select_authenticated"
  ON public.records FOR SELECT
  TO authenticated
  USING (true);

-- Admin and Manager can insert
CREATE POLICY "records_insert_manager"
  ON public.records FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin','manager'));

-- Admin and Manager can update
CREATE POLICY "records_update_manager"
  ON public.records FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('admin','manager'));

-- Only Admin can delete
CREATE POLICY "records_delete_admin"
  ON public.records FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');


-- ---- SETTINGS policies ----

-- All authenticated users can read settings (needed for reminder window)
CREATE POLICY "settings_select_authenticated"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

-- Only Admin can modify settings
CREATE POLICY "settings_modify_admin"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');


-- ============================================================
-- 5. GRANT PostgREST ACCESS
-- Required for projects created after May 30, 2026
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.records  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT SELECT ON public.users    TO anon;
GRANT SELECT ON public.settings TO anon;


-- ============================================================
-- DONE. Next steps:
-- 1. Go to Authentication → Settings → disable "Confirm email" for initial setup
--    (re-enable for production)
-- 2. Create your first Admin user via Authentication → Users → Invite
-- 3. After they sign up, run:
--    UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================================
