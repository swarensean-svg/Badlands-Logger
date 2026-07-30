/**
 * Complete Supabase PostgreSQL DDL Schema Migration & RLS Script
 */

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR GYM MANAGEMENT & WORKOUT TRACKING APP
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM ('member', 'coach', 'admin');
CREATE TYPE scoring_type AS ENUM ('time', 'reps', 'weight', 'rounds_reps', 'completion');
CREATE TYPE workout_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE rx_type AS ENUM ('rx', 'rx_plus', 'scaled');
CREATE TYPE movement_category AS ENUM ('barbell', 'gymnastics', 'monostructural', 'benchmark_wod', 'mobility');
CREATE TYPE movement_unit AS ENUM ('lbs', 'kg', 'reps', 'seconds', 'meters', 'calories');

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- 3.1 PROFILES (Tied to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  is_public BOOLEAN NOT NULL DEFAULT true, -- Privacy setting: toggle public or private results
  -- Flexible JSONB column for rapid key-value PR lookups (e.g. Fran time, Back Squat 1RM)
  benchmark_prs JSONB NOT NULL DEFAULT '{}'::jsonb,
  barbell_prs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 TRACKS (Dynamic Workout Tracks e.g. Daily Workout, Turf Circuit, Hidden Planning)
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  color TEXT NOT NULL DEFAULT '#3B82F6', -- Hex color tag
  is_hidden BOOLEAN NOT NULL DEFAULT false, -- Hidden from normal members if true
  is_planning BOOLEAN NOT NULL DEFAULT false, -- Used by coaches for upcoming cycles
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2.1 TRACK PARSING RULES (AI Smart Importer Rules tied to specific Track IDs)
CREATE TABLE public.track_parsing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE UNIQUE,
  rules TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 MOVEMENTS (Library of Exercises & Benchmarks)
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category movement_category NOT NULL,
  default_unit movement_unit NOT NULL DEFAULT 'lbs',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 WORKOUTS (Daily Programming per Track & Date)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  athlete_notes TEXT NOT NULL DEFAULT '', -- Visible to all athletes
  coaches_notes TEXT NOT NULL DEFAULT '', -- Visible ONLY to Coaches & Admins
  scoring_type scoring_type NOT NULL DEFAULT 'time',
  status workout_status NOT NULL DEFAULT 'published',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 WORKOUT_MOVEMENTS (Junction mapping movements in a specific workout)
CREATE TABLE public.workout_movements (
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

-- 3.6 WORKOUT_RESULTS (Athlete Performance Logs)
CREATE TABLE public.workout_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_display TEXT NOT NULL, -- Human readable score e.g. "12:45"
  score_numeric NUMERIC(10,2) NOT NULL, -- Standardized number for leaderboard sorting
  rx_type rx_type NOT NULL DEFAULT 'rx',
  notes TEXT DEFAULT '',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_workout_log UNIQUE(workout_id, user_id)
);

-- 3.7 WORKOUT_RESULT_MOVEMENTS (Granular movement scores logged per result)
CREATE TABLE public.workout_result_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.workout_results(id) ON DELETE CASCADE,
  movement_id UUID NOT NULL REFERENCES public.movements(id) ON DELETE CASCADE,
  weight_used_lbs NUMERIC(6,2),
  reps_completed INT,
  time_seconds INT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 FIST_BUMPS (Social Interaction / High Fives on Workout Results)
CREATE TABLE public.fist_bumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NOT NULL REFERENCES public.workout_results(id) ON DELETE CASCADE,
  giver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_result_fist_bump UNIQUE(result_id, giver_user_id)
);

-- ============================================================================
-- 4. HIGHLY OPTIMIZED INDEXES FOR MOVEMENT HISTORY & CALENDAR LOOKUPS
-- ============================================================================

-- Fast Workout lookup by Track & Scheduled Date
CREATE INDEX idx_workouts_track_date ON public.workouts(track_id, scheduled_date);
CREATE INDEX idx_workouts_status_date ON public.workouts(status, scheduled_date DESC);

-- Fast Athlete Workout Log lookups
CREATE INDEX idx_workout_results_user ON public.workout_results(user_id, logged_at DESC);
CREATE INDEX idx_workout_results_workout ON public.workout_results(workout_id, score_numeric ASC);

-- Fist Bump Lookups
CREATE INDEX idx_fist_bumps_result ON public.fist_bumps(result_id);
CREATE INDEX idx_fist_bumps_receiver ON public.fist_bumps(receiver_user_id, created_at DESC);

-- CRITICAL INDEX FOR MOVEMENT HISTORY QUERY
-- Allows instant JOIN filtering on specific athlete + specific movement + chronological ordering
CREATE INDEX idx_result_movements_lookup 
ON public.workout_result_movements(movement_id, result_id);

CREATE INDEX idx_workout_movements_lookup 
ON public.workout_movements(movement_id, workout_id);

-- JSONB GIN Indexes for fast JSON queries if needed
CREATE INDEX idx_profiles_barbell_prs ON public.profiles USING GIN (barbell_prs);
CREATE INDEX idx_profiles_benchmark_prs ON public.profiles USING GIN (benchmark_prs);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_result_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fist_bumps ENABLE ROW LEVEL SECURITY;

-- Helper Function to check user role from JWT / profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5.1 PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by authenticated users" 
  ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles FOR ALL USING (public.get_user_role() = 'admin');

-- 5.2 TRACKS POLICIES
CREATE POLICY "Members can view non-hidden, non-planning tracks" 
  ON public.tracks FOR SELECT USING (
    (is_hidden = false AND is_planning = false) 
    OR public.get_user_role() IN ('coach', 'admin')
  );

CREATE POLICY "Coaches and Admins can create and edit tracks" 
  ON public.tracks FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- 5.3 MOVEMENTS POLICIES
CREATE POLICY "Everyone can read movements" 
  ON public.movements FOR SELECT USING (true);

CREATE POLICY "Coaches and Admins can manage movements" 
  ON public.movements FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- 5.4 WORKOUTS POLICIES
-- Athletes only see published workouts on non-hidden tracks
CREATE POLICY "Athletes can view published workouts" 
  ON public.workouts FOR SELECT USING (
    status = 'published' OR public.get_user_role() IN ('coach', 'admin')
  );

CREATE POLICY "Coaches and Admins can insert/update/delete workouts" 
  ON public.workouts FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- 5.5 WORKOUT MOVEMENTS POLICIES
CREATE POLICY "Anyone can read workout movements" 
  ON public.workout_movements FOR SELECT USING (true);

CREATE POLICY "Coaches/Admins manage workout movements" 
  ON public.workout_movements FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- 5.6 WORKOUT RESULTS POLICIES (Respects Privacy Settings)
CREATE POLICY "Members read public athlete results for daily results" 
  ON public.workout_results FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = workout_results.user_id AND (p.is_public = true OR p.id = auth.uid())
    )
    OR public.get_user_role() IN ('coach', 'admin')
  );

CREATE POLICY "Users can insert/update their own workout results" 
  ON public.workout_results FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Coaches and Admins can manage all results" 
  ON public.workout_results FOR ALL USING (public.get_user_role() IN ('coach', 'admin'));

-- 5.7 WORKOUT RESULT MOVEMENTS POLICIES
CREATE POLICY "Anyone can read workout result movements" 
  ON public.workout_result_movements FOR SELECT USING (true);

CREATE POLICY "Users insert/update their own result movements" 
  ON public.workout_result_movements FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_results r 
      WHERE r.id = workout_result_movements.result_id AND r.user_id = auth.uid()
    )
  );

-- 5.8 FIST BUMPS POLICIES
CREATE POLICY "Authenticated users can read fist bumps" 
  ON public.fist_bumps FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can give or remove their own fist bumps" 
  ON public.fist_bumps FOR ALL USING (auth.uid() = giver_user_id) WITH CHECK (auth.uid() = giver_user_id);

-- ============================================================================
-- 6. AUTOMATED TRIGGER ON NEW USER SIGNUP (Supabase Auth Hook)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'member')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. MOVEMENT HISTORY RPC STORED PROCEDURE (LATERAL JOIN QUERY ENGINE)
-- ============================================================================
-- This function receives a user_id and array of movement_ids (from today's workout)
-- and returns top past performance logs per movement with max efficiency.

CREATE OR REPLACE FUNCTION public.get_user_movement_history(
  p_user_id UUID,
  p_movement_ids UUID[],
  p_limit_per_movement INT DEFAULT 5
)
RETURNS TABLE (
  movement_id UUID,
  movement_name TEXT,
  movement_category movement_category,
  logged_at TIMESTAMPTZ,
  workout_title TEXT,
  workout_date DATE,
  track_name TEXT,
  rx_type rx_type,
  weight_used_lbs NUMERIC,
  reps_completed INT,
  time_seconds INT,
  score_display TEXT,
  workout_result_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS movement_id,
    m.name AS movement_name,
    m.category AS movement_category,
    res.logged_at,
    w.title AS workout_title,
    w.scheduled_date AS workout_date,
    t.name AS track_name,
    res.rx_type,
    rm.weight_used_lbs,
    rm.reps_completed,
    rm.time_seconds,
    res.score_display,
    res.id AS workout_result_id
  FROM unnest(p_movement_ids) AS target_mov_id
  JOIN public.movements m ON m.id = target_mov_id
  CROSS JOIN LATERAL (
    SELECT 
      r.id,
      r.workout_id,
      r.score_display,
      r.rx_type,
      r.logged_at,
      w_sub.title,
      w_sub.scheduled_date,
      w_sub.track_id,
      rm_sub.weight_used_lbs,
      rm_sub.reps_completed,
      rm_sub.time_seconds
    FROM public.workout_results r
    JOIN public.workouts w_sub ON w_sub.id = r.workout_id
    JOIN public.workout_result_movements rm_sub ON rm_sub.result_id = r.id
    WHERE r.user_id = p_user_id
      AND rm_sub.movement_id = target_mov_id
    ORDER BY r.logged_at DESC
    LIMIT p_limit_per_movement
  ) res
  JOIN public.workouts w ON w.id = res.workout_id
  JOIN public.tracks t ON t.id = w.track_id
  ORDER BY m.name ASC, res.logged_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
`;
