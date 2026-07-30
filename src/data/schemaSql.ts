/**
 * Complete Supabase PostgreSQL DDL Schema Migration & RLS Script
 */

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- MASTER SUPABASE POSTGRESQL SCHEMA FOR GYM MANAGEMENT & WORKOUT TRACKER
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('member', 'coach', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.scoring_type AS ENUM ('time', 'reps', 'weight', 'rounds_reps', 'completion', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.workout_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.rx_type AS ENUM ('rx', 'rx_plus', 'scaled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.movement_category AS ENUM ('barbell', 'gymnastics', 'monostructural', 'benchmark_wod', 'mobility');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.movement_unit AS ENUM ('lbs', 'kg', 'reps', 'seconds', 'meters', 'calories');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.benchmark_category AS ENUM ('hero', 'girl_wod', 'barbell_max', 'gymnastics', 'custom_gym');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- 3.1 PROFILES (Tied to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'member'::public.user_role,
  is_public BOOLEAN NOT NULL DEFAULT true,
  benchmark_prs JSONB NOT NULL DEFAULT '{}'::jsonb,
  barbell_prs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 TRACKS
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_planning BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2.1 TRACK PARSING RULES
CREATE TABLE IF NOT EXISTS public.track_parsing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE UNIQUE,
  rules TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 BENCHMARKS
CREATE TABLE IF NOT EXISTS public.benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category public.benchmark_category NOT NULL DEFAULT 'custom_gym'::public.benchmark_category,
  description TEXT DEFAULT '',
  scoring_type public.scoring_type NOT NULL DEFAULT 'time'::public.scoring_type,
  default_unit public.movement_unit NOT NULL DEFAULT 'lbs'::public.movement_unit,
  rx_male TEXT,
  rx_female TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 MOVEMENTS
CREATE TABLE IF NOT EXISTS public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category public.movement_category NOT NULL,
  default_unit public.movement_unit NOT NULL DEFAULT 'lbs'::public.movement_unit,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 WORKOUTS
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  athlete_notes TEXT NOT NULL DEFAULT '',
  coaches_notes TEXT NOT NULL DEFAULT '',
  scoring_type public.scoring_type NOT NULL DEFAULT 'time'::public.scoring_type,
  status public.workout_status NOT NULL DEFAULT 'published'::public.workout_status,
  is_benchmark BOOLEAN DEFAULT false,
  benchmark_category public.benchmark_category,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 WORKOUT_MOVEMENTS
CREATE TABLE IF NOT EXISTS public.workout_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  movement_id UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  rx_weight_male_lbs NUMERIC(6,2),
  rx_weight_female_lbs NUMERIC(6,2),
  target_reps INT,
  target_distance_meters INT,
  notes TEXT DEFAULT '',
  CONSTRAINT unique_workout_movement_order UNIQUE(workout_id, movement_id, order_index)
);

-- 3.7 WORKOUT_RESULTS
CREATE TABLE IF NOT EXISTS public.workout_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_display TEXT NOT NULL,
  score_numeric NUMERIC(10,2) NOT NULL DEFAULT 0,
  rx_type public.rx_type NOT NULL DEFAULT 'rx'::public.rx_type,
  notes TEXT DEFAULT '',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_workout_log UNIQUE(workout_id, user_id)
);

-- 3.8 WORKOUT_RESULT_MOVEMENTS
CREATE TABLE IF NOT EXISTS public.workout_result_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.workout_results(id) ON DELETE CASCADE,
  movement_id UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  weight_used_lbs NUMERIC(6,2),
  reps_completed INT,
  time_seconds INT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 FIST_BUMPS
CREATE TABLE IF NOT EXISTS public.fist_bumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.workout_results(id) ON DELETE CASCADE,
  giver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_result_fist_bump UNIQUE(result_id, giver_user_id)
);

-- 3.10 COMPATIBILITY VIEWS
CREATE OR REPLACE VIEW public.logged_results AS SELECT * FROM public.workout_results;
CREATE OR REPLACE VIEW public.gym_benchmarks AS SELECT * FROM public.benchmarks;

-- ============================================================================
-- 4. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_workouts_track_date ON public.workouts(track_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_workouts_status_date ON public.workouts(status, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_results_user ON public.workout_results(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_results_workout ON public.workout_results(workout_id, score_numeric ASC);
CREATE INDEX IF NOT EXISTS idx_fist_bumps_result ON public.fist_bumps(result_id);
CREATE INDEX IF NOT EXISTS idx_fist_bumps_receiver ON public.fist_bumps(receiver_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_result_movements_lookup ON public.workout_result_movements(movement_id, result_id);
CREATE INDEX IF NOT EXISTS idx_workout_movements_lookup ON public.workout_movements(movement_id, workout_id);

-- ============================================================================
-- 5. AUTOMATED AUTH TRIGGER FOR NEW SIGNUPS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_role public.user_role;
BEGIN
  v_first_name := NULLIF(TRIM(new.raw_user_meta_data->>'first_name'), '');
  v_last_name  := NULLIF(TRIM(new.raw_user_meta_data->>'last_name'), '');

  IF new.raw_user_meta_data->>'full_name' IS NOT NULL AND TRIM(new.raw_user_meta_data->>'full_name') <> '' THEN
    v_full_name := TRIM(new.raw_user_meta_data->>'full_name');
  ELSIF v_first_name IS NOT NULL OR v_last_name IS NOT NULL THEN
    v_full_name := TRIM(CONCAT(COALESCE(v_first_name, ''), ' ', COALESCE(v_last_name, '')));
  ELSE
    v_full_name := split_part(new.email, '@', 1);
  END IF;

  BEGIN
    v_role := (new.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'member'::public.user_role;
  END;

  IF v_role IS NULL THEN
    v_role := 'member'::public.user_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    full_name,
    role,
    is_public,
    benchmark_prs,
    barbell_prs,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_first_name,
    v_last_name,
    v_full_name,
    v_role,
    true,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_parsing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_result_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fist_bumps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.get_user_role() = 'admin');

-- Tracks Policies
DROP POLICY IF EXISTS "Members view non-hidden non-planning tracks" ON public.tracks;
CREATE POLICY "Members view non-hidden non-planning tracks" ON public.tracks FOR SELECT USING (
  (is_hidden = false AND is_planning = false) OR public.get_user_role() IN ('coach', 'admin')
);

DROP POLICY IF EXISTS "Coaches and Admins manage tracks" ON public.tracks;
CREATE POLICY "Coaches and Admins manage tracks" ON public.tracks FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- Track Parsing Rules Policies
DROP POLICY IF EXISTS "Coaches and Admins manage track parsing rules" ON public.track_parsing_rules;
CREATE POLICY "Coaches and Admins manage track parsing rules" ON public.track_parsing_rules FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- Movements & Benchmarks Policies
DROP POLICY IF EXISTS "Everyone can read movements" ON public.movements;
CREATE POLICY "Everyone can read movements" ON public.movements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone can read benchmarks" ON public.benchmarks;
CREATE POLICY "Everyone can read benchmarks" ON public.benchmarks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Coaches and Admins manage movements" ON public.movements;
CREATE POLICY "Coaches and Admins manage movements" ON public.movements FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Coaches and Admins manage benchmarks" ON public.benchmarks;
CREATE POLICY "Coaches and Admins manage benchmarks" ON public.benchmarks FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- Workouts & Workout Movements Policies
DROP POLICY IF EXISTS "Athletes view published workouts" ON public.workouts;
CREATE POLICY "Athletes view published workouts" ON public.workouts FOR SELECT USING (
  status = 'published' OR public.get_user_role() IN ('coach', 'admin')
);

DROP POLICY IF EXISTS "Coaches and Admins manage workouts" ON public.workouts;
CREATE POLICY "Coaches and Admins manage workouts" ON public.workouts FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Anyone can read workout movements" ON public.workout_movements;
CREATE POLICY "Anyone can read workout movements" ON public.workout_movements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Coaches and Admins manage workout movements" ON public.workout_movements;
CREATE POLICY "Coaches and Admins manage workout movements" ON public.workout_movements FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- Workout Results Policies
DROP POLICY IF EXISTS "Members read public athlete results" ON public.workout_results;
CREATE POLICY "Members read public athlete results" ON public.workout_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = workout_results.user_id AND (p.is_public = true OR p.id = auth.uid())
  ) OR public.get_user_role() IN ('coach', 'admin')
);

DROP POLICY IF EXISTS "Users manage their own results" ON public.workout_results;
CREATE POLICY "Users manage their own results" ON public.workout_results FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches and Admins manage all results" ON public.workout_results;
CREATE POLICY "Coaches and Admins manage all results" ON public.workout_results FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- Workout Result Movements Policies
DROP POLICY IF EXISTS "Anyone read workout result movements" ON public.workout_result_movements;
CREATE POLICY "Anyone read workout result movements" ON public.workout_result_movements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage their own result movements" ON public.workout_result_movements;
CREATE POLICY "Users manage their own result movements" ON public.workout_result_movements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workout_results r 
    WHERE r.id = workout_result_movements.result_id AND r.user_id = auth.uid()
  )
);

-- Fist Bumps Policies
DROP POLICY IF EXISTS "Authenticated users read fist bumps" ON public.fist_bumps;
CREATE POLICY "Authenticated users read fist bumps" ON public.fist_bumps FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users manage their own fist bumps" ON public.fist_bumps;
CREATE POLICY "Users manage their own fist bumps" ON public.fist_bumps FOR ALL USING (auth.uid() = giver_user_id) WITH CHECK (auth.uid() = giver_user_id);

-- ============================================================================
-- 7. INITIAL SEED DATA (DEFAULT TRACKS)
-- ============================================================================
INSERT INTO public.tracks (id, name, slug, description, color, is_hidden, is_planning, display_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'PRVN Daily Workout', 'prvn-daily', 'Main daily affiliate programming track', '#3B82F6', false, false, 1),
  ('22222222-2222-2222-2222-222222222222', 'Turf Circuit', 'turf-circuit', 'High-intensity functional conditioning', '#10B981', false, false, 2),
  ('33333333-3333-3333-3333-333333333333', 'Engine & Conditioning', 'engine-conditioning', 'Aerobic capacity & monostructural endurance', '#F59E0B', false, false, 3),
  ('44444444-4444-4444-4444-444444444444', 'Coach Planning Track', 'coach-planning', 'Internal track for future cycle drafting', '#8B5CF6', true, true, 4)
ON CONFLICT (slug) DO NOTHING;
`;

