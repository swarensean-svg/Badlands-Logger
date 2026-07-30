/**
 * Supabase Row Level Security (RLS) Policies Script
 * 
 * Enforces key security requirements:
 * 1. Members can only read workouts marked for "Athlete Viewing" (published on non-hidden/non-planning tracks).
 * 2. Members can only read/write their own logged results and PRs (and view public leaderboard rankings).
 * 3. Coaches/Admins can read all workouts, including "Coaches Notes" and "Planning" tracks.
 * 4. Only Admins/Coaches can write new workouts or modify tracks.
 */

export const RLS_POLICIES_SQL = `-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES FOR GYM MANAGEMENT
-- ============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_result_movements ENABLE ROW LEVEL SECURITY;

-- Helper SQL Function: Fetch current user's role from JWT / profiles table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- 1. TRACKS POLICIES
-- - Members: Can ONLY read tracks marked for "Athlete Viewing" (is_hidden = false AND is_planning = false).
-- - Coaches / Admins: Can read/write all tracks including Planning & Hidden tracks.
-- ----------------------------------------------------------------------------
CREATE POLICY "Members read athlete visible tracks"
  ON public.tracks
  FOR SELECT
  USING (
    (is_hidden = false AND is_planning = false)
    OR public.get_user_role() IN ('coach', 'admin')
  );

CREATE POLICY "Coaches and Admins manage all tracks"
  ON public.tracks
  FOR ALL
  USING (public.get_user_role() IN ('coach', 'admin'))
  WITH CHECK (public.get_user_role() IN ('coach', 'admin'));


-- ----------------------------------------------------------------------------
-- 2. WORKOUTS & COACHES NOTES POLICIES
-- - Members: Can ONLY read workouts in published status on accessible tracks.
-- - Coaches / Admins: Can read ALL workouts including drafts and planning tracks.
-- - Write Access: ONLY Admins and Coaches can insert, update, or delete workouts.
-- ----------------------------------------------------------------------------
CREATE POLICY "Athletes view published workouts"
  ON public.workouts
  FOR SELECT
  USING (
    (
      status = 'published'
      AND EXISTS (
        SELECT 1 FROM public.tracks t
        WHERE t.id = workouts.track_id
          AND t.is_hidden = false
          AND t.is_planning = false
      )
    )
    OR public.get_user_role() IN ('coach', 'admin')
  );

CREATE POLICY "Coaches and Admins can create and modify workouts"
  ON public.workouts
  FOR ALL
  USING (public.get_user_role() IN ('coach', 'admin'))
  WITH CHECK (public.get_user_role() IN ('coach', 'admin'));


-- ----------------------------------------------------------------------------
-- 3. LOGGED RESULTS & PROFILE PRs POLICIES
-- - Members: Can read public leaderboard results.
-- - Members: Can ONLY insert, update, or delete THEIR OWN logged results & PRs.
-- - Coaches / Admins: Full read/write access across all athlete logs.
-- ----------------------------------------------------------------------------

-- PROFILES (PRs stored in JSONB columns: barbell_prs, benchmark_prs)
CREATE POLICY "Public profiles viewable by authenticated athletes"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Members can update their own profile PRs"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage all profiles and role elevations"
  ON public.profiles
  FOR ALL
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- WORKOUT RESULTS (Athlete performance logs - Filtered by public privacy setting)
CREATE POLICY "Members read public athlete results for daily results"
  ON public.workout_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = workout_results.user_id AND (p.is_public = true OR p.id = auth.uid())
    )
    OR public.get_user_role() IN ('coach', 'admin')
  );

CREATE POLICY "Members insert and manage their own workout results"
  ON public.workout_results
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches and Admins manage team workout results"
  ON public.workout_results
  FOR ALL
  USING (public.get_user_role() IN ('coach', 'admin'));

-- WORKOUT RESULT MOVEMENTS (Granular movement breakdown)
CREATE POLICY "Members view workout result movements"
  ON public.workout_result_movements
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Members insert and edit own result movements"
  ON public.workout_result_movements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_results r
      WHERE r.id = workout_result_movements.result_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches and Admins manage all result movements"
  ON public.workout_result_movements
  FOR ALL
  USING (public.get_user_role() IN ('coach', 'admin'));

-- ----------------------------------------------------------------------------
-- 4. FIST BUMPS POLICIES (Social Interactions)
-- - Members: Can read all fist bumps.
-- - Members: Can ONLY insert or delete THEIR OWN given fist bumps.
-- ----------------------------------------------------------------------------
ALTER TABLE public.fist_bumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fist bumps"
  ON public.fist_bumps
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can give or remove their own fist bumps"
  ON public.fist_bumps
  FOR ALL
  USING (auth.uid() = giver_user_id)
  WITH CHECK (auth.uid() = giver_user_id);
`;
