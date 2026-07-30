/**
 * Supabase Database & Domain Types for Gym Management & Workout Tracker
 */

export type UserRole = 'member' | 'coach' | 'admin';

export type ScoringType = 'time' | 'reps' | 'weight' | 'rounds_reps' | 'completion' | 'other';

export type BenchmarkCategory = 'hero' | 'girl_wod' | 'barbell_max' | 'gymnastics' | 'custom_gym';

export interface GymBenchmark {
  id: string;
  name: string;
  slug: string;
  category: BenchmarkCategory;
  description: string;
  scoring_type: ScoringType;
  default_unit: MovementUnit;
  rx_male?: string;
  rx_female?: string;
  created_at: string;
}

export type WorkoutStatus = 'draft' | 'published' | 'archived';

export type RxType = 'rx' | 'rx_plus' | 'scaled';

export type MovementCategory = 'barbell' | 'gymnastics' | 'monostructural' | 'benchmark_wod' | 'mobility';

export type MovementUnit = 'lbs' | 'kg' | 'reps' | 'seconds' | 'meters' | 'calories';

// JSONB PR structures in profiles
export interface BenchmarkPRs {
  fran?: { time_seconds: number; date: string; rx_type: RxType; notes?: string };
  grace?: { time_seconds: number; date: string; rx_type: RxType; notes?: string };
  murph?: { time_seconds: number; date: string; rx_type: RxType; notes?: string };
  helen?: { time_seconds: number; date: string; rx_type: RxType; notes?: string };
  cindy?: { rounds: number; reps: number; date: string; rx_type: RxType };
  [key: string]: any;
}

export interface BarbellPRs {
  back_squat?: { weight_lbs: number; date: string; reps?: number; notes?: string };
  front_squat?: { weight_lbs: number; date: string; reps?: number; notes?: string };
  deadlift?: { weight_lbs: number; date: string; reps?: number; notes?: string };
  clean_and_jerk?: { weight_lbs: number; date: string; reps?: number; notes?: string };
  snatch?: { weight_lbs: number; date: string; reps?: number; notes?: string };
  bench_press?: { weight_lbs: number; date: string; reps?: number; notes?: string };
  strict_press?: { weight_lbs: number; date: string; reps?: number; notes?: string };
  [key: string]: any;
}

// Table Row Types
export interface Profile {
  id: string; // references auth.users
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  is_public: boolean; // Privacy setting: true = results visible on Daily Results board
  benchmark_prs: BenchmarkPRs;
  barbell_prs: BarbellPRs;
  created_at: string;
  updated_at: string;
}

export interface FistBump {
  id: string;
  result_id: string;
  giver_user_id: string;
  receiver_user_id: string;
  created_at: string;
}

export interface Track {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  is_hidden: boolean;
  is_planning: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrackParsingRule {
  id?: string;
  track_id: string;
  rules: string;
  created_at?: string;
  updated_at?: string;
}

export interface Movement {
  id: string;
  name: string;
  slug: string;
  category: MovementCategory;
  default_unit: MovementUnit;
  description?: string;
  created_at: string;
}

export interface Workout {
  id: string;
  track_id: string;
  scheduled_date: string; // YYYY-MM-DD
  title: string;
  description: string;
  athlete_notes: string; // Visible to everyone
  coaches_notes: string; // Visible ONLY to Coaches & Admins
  scoring_type: ScoringType;
  status: WorkoutStatus;
  is_benchmark?: boolean;
  benchmark_category?: BenchmarkCategory;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutMovement {
  id: string;
  workout_id: string;
  movement_id: string;
  order_index: number;
  rx_weight_male_lbs?: number;
  rx_weight_female_lbs?: number;
  target_reps?: number;
  target_distance_meters?: number;
  notes?: string;
}

export interface WorkoutResult {
  id: string;
  workout_id: string;
  user_id: string;
  score_display: string; // e.g., "12:45" or "185 lbs" or "5 rounds + 12 reps"
  score_numeric: number; // Normalized number for sorting leaderboards
  rx_type: RxType;
  notes?: string;
  logged_at: string;
}

export interface WorkoutResultMovement {
  id: string;
  result_id: string;
  movement_id: string;
  weight_used_lbs?: number;
  reps_completed?: number;
  time_seconds?: number;
  notes?: string;
}

// Aggregated Movement History Query Result
export interface MovementHistoryEntry {
  movement_id: string;
  movement_name: string;
  movement_category: MovementCategory;
  logged_at: string;
  workout_title: string;
  workout_date: string;
  track_name: string;
  rx_type: RxType;
  weight_used_lbs?: number;
  reps_completed?: number;
  time_seconds?: number;
  score_display: string;
  workout_result_id: string;
}

// App View Modes
export type AppTab = 'app' | 'schema' | 'types' | 'strategy';
export type ViewRole = 'member' | 'coach' | 'admin';
export type WorkoutViewingMode = 'athlete' | 'coach';
