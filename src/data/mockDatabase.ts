/**
 * Initial Seed Data & Movement Catalog Engine
 */

import { Profile, Track, Movement, Workout, WorkoutMovement, WorkoutResult, WorkoutResultMovement, MovementHistoryEntry, UserRole, GymBenchmark, FistBump } from '../types';

export const INITIAL_GYM_BENCHMARKS: GymBenchmark[] = [
  {
    id: 'bmk-1',
    name: 'Fran',
    slug: 'fran',
    category: 'girl_wod',
    description: '21-15-9 Thrusters (95/65 lbs) and Pull-ups for Time.',
    scoring_type: 'time',
    default_unit: 'seconds',
    rx_male: '95 lbs',
    rx_female: '65 lbs',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bmk-2',
    name: 'Grace',
    slug: 'grace',
    category: 'girl_wod',
    description: '30 Clean & Jerks (135/95 lbs) for Time.',
    scoring_type: 'time',
    default_unit: 'seconds',
    rx_male: '135 lbs',
    rx_female: '95 lbs',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bmk-3',
    name: 'Murph',
    slug: 'murph',
    category: 'hero',
    description: '1 Mile Run, 100 Pull-ups, 200 Push-ups, 300 Air Squats, 1 Mile Run (with 20/14lb vest).',
    scoring_type: 'time',
    default_unit: 'seconds',
    rx_male: '20 lb Vest',
    rx_female: '14 lb Vest',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bmk-4',
    name: 'Back Squat 1RM',
    slug: 'back-squat-1rm',
    category: 'barbell_max',
    description: '1 Repetition Maximum Back Squat from rack.',
    scoring_type: 'weight',
    default_unit: 'lbs',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bmk-5',
    name: 'Clean & Jerk 1RM',
    slug: 'clean-jerk-1rm',
    category: 'barbell_max',
    description: '1 Repetition Maximum Clean & Jerk from floor to overhead.',
    scoring_type: 'weight',
    default_unit: 'lbs',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bmk-6',
    name: 'Cindy',
    slug: 'cindy',
    category: 'girl_wod',
    description: '20 Minute AMRAP: 5 Pull-ups, 10 Push-ups, 15 Air Squats.',
    scoring_type: 'rounds_reps',
    default_unit: 'reps',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-1',
    email: 'alex.riviera@gym.com',
    full_name: 'Alex Riviera',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'member',
    is_public: true,
    benchmark_prs: {
      fran: { time_seconds: 165, date: '2026-05-14', rx_type: 'rx', notes: 'Unbroken thrusters!' },
      grace: { time_seconds: 110, date: '2026-03-22', rx_type: 'rx', notes: 'Singles on clean & jerk' },
      murph: { time_seconds: 2145, date: '2026-05-25', rx_type: 'rx', notes: 'Partitioned 5-10-15' },
    },
    barbell_prs: {
      back_squat: { weight_lbs: 345, date: '2026-06-10', reps: 1, notes: 'Felt solid at depth' },
      deadlift: { weight_lbs: 455, date: '2026-04-18', reps: 1, notes: 'Hook grip' },
      clean_and_jerk: { weight_lbs: 265, date: '2026-05-02', reps: 1 },
      snatch: { weight_lbs: 215, date: '2026-06-20', reps: 1 },
    },
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-06-20T10:00:00Z',
  },
  {
    id: 'usr-2',
    email: 'marcus.coach@gym.com',
    full_name: 'Coach Marcus Vance',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'coach',
    is_public: true,
    benchmark_prs: {
      fran: { time_seconds: 142, date: '2026-04-10', rx_type: 'rx' },
    },
    barbell_prs: {
      back_squat: { weight_lbs: 425, date: '2026-05-01', reps: 1 },
      deadlift: { weight_lbs: 525, date: '2026-03-12', reps: 1 },
    },
    created_at: '2025-11-01T08:00:00Z',
    updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'usr-3',
    email: 'sarah.admin@gym.com',
    full_name: 'Sarah Jenkins (Admin)',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    role: 'admin',
    is_public: true,
    benchmark_prs: {},
    barbell_prs: {},
    created_at: '2025-08-01T08:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
];

export const INITIAL_FIST_BUMPS: FistBump[] = [
  {
    id: 'fb-1',
    result_id: 'res-1', // Alex Riviera's result
    giver_user_id: 'usr-2', // Coach Marcus
    receiver_user_id: 'usr-1', // Alex Riviera
    created_at: '2026-07-29T09:30:00Z',
  },
  {
    id: 'fb-2',
    result_id: 'res-1', // Alex Riviera's result
    giver_user_id: 'usr-3', // Sarah Admin
    receiver_user_id: 'usr-1', // Alex Riviera
    created_at: '2026-07-29T10:00:00Z',
  },
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'trk-1',
    name: 'Daily Workout',
    slug: 'daily-workout',
    description: 'Main CrossFit & Functional Fitness daily programming track for all athletes.',
    color: '#3B82F6', // Blue
    is_hidden: false,
    is_planning: false,
    display_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trk-2',
    name: 'Turf Circuit',
    slug: 'turf-circuit',
    description: 'High-intensity conditioning, sled pushes, dumbbell work, and endurance intervals.',
    color: '#10B981', // Emerald
    is_hidden: false,
    is_planning: false,
    display_order: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trk-3',
    name: 'Olympic Weightlifting',
    slug: 'olympic-weightlifting',
    description: 'Specialized Snatch, Clean & Jerk technique, pulls, and squat strength progression.',
    color: '#F59E0B', // Amber
    is_hidden: false,
    is_planning: false,
    display_order: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'trk-4',
    name: 'Cycle Alpha Planning',
    slug: 'cycle-alpha-planning',
    description: 'Coaches-only hidden planning track for testing upcoming 8-week block programming.',
    color: '#8B5CF6', // Purple
    is_hidden: true,
    is_planning: true,
    display_order: 99,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
];

export const INITIAL_TRACK_PARSING_RULES: Record<string, string> = {
  'trk-1': `1. Always change Echo Bike to Assault Bike.
2. Ignore standard PRVN warm-ups (our coaches lead custom dynamic warm-ups).
3. If workout contains dumbbell thrusters, add a note: "Keep elbow position high on DB thrusters".`,
  'trk-2': `1. Cap all Turf Circuit workouts at 35 minutes max duration.
2. If workout includes sled pushes, add note: "Sled weight: 4 plates for men, 3 plates for women".`,
  'trk-3': `1. Rest strictly 2:00 between snatch complex sets.
2. Always list percentage targets in bold text.`,
};

export const INITIAL_MOVEMENTS: Movement[] = [
  {
    id: 'mov-1',
    name: 'Back Squat',
    slug: 'back-squat',
    category: 'barbell',
    default_unit: 'lbs',
    description: 'Barbell dynamic squat targeting lower body strength.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-2',
    name: 'Thruster',
    slug: 'thruster',
    category: 'barbell',
    default_unit: 'lbs',
    description: 'Front squat directly into push press overhead.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-3',
    name: 'Pull-up',
    slug: 'pull-up',
    category: 'gymnastics',
    default_unit: 'reps',
    description: 'Kipping, butterfly, or strict pull-ups to chin above bar.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-4',
    name: 'Deadlift',
    slug: 'deadlift',
    category: 'barbell',
    default_unit: 'lbs',
    description: 'Conventional or sumo stance deadlift from ground.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-5',
    name: 'Clean & Jerk',
    slug: 'clean-and-jerk',
    category: 'barbell',
    default_unit: 'lbs',
    description: 'Olympic power clean or squat clean to overhead split or push jerk.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-6',
    name: 'Fran (Benchmark WOD)',
    slug: 'fran',
    category: 'benchmark_wod',
    default_unit: 'seconds',
    description: '21-15-9 Thrusters (95/65 lbs) and Pull-ups for time.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-7',
    name: 'Row 500m',
    slug: 'row-500m',
    category: 'monostructural',
    default_unit: 'seconds',
    description: 'Concept2 rower sprint 500 meter effort.',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mov-8',
    name: 'Dumbbell Devil Press',
    slug: 'dumbbell-devil-press',
    category: 'monostructural',
    default_unit: 'lbs',
    description: 'Burpee on dumbbells to double snatch overhead.',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_WORKOUTS: Workout[] = [
  {
    id: 'wkt-101',
    track_id: 'trk-1',
    scheduled_date: '2026-07-29', // Today
    title: 'Heavy Heavy Heavy + "Firestorm"',
    description: 'Part A: Heavy Back Squat 5-5-3-3-1-1 RM build.\nPart B: 3 Rounds for Time of 15 Thrusters & 15 Pull-ups.',
    athlete_notes: 'Focus on depth on Part A. On Part B, pace your thrusters so you can stay unbroken on the pull-ups!',
    coaches_notes: '🔒 COACH SECRET NOTES: Watch Alex and Jordan on Part A squat depth—they tend to cut parallel when going over 80%. Cap Part B at 12 minute total time cap. If an athlete scales thrusters, keep bar at 75/55 lbs.',
    scoring_type: 'time',
    status: 'published',
    created_by: 'usr-2',
    created_at: '2026-07-28T14:00:00Z',
    updated_at: '2026-07-28T14:00:00Z',
  },
  {
    id: 'wkt-102',
    track_id: 'trk-2',
    scheduled_date: '2026-07-29', // Today
    title: 'Turf Engine #42',
    description: '40 Min AMRAP: 500m Rower + 50ft Heavy Sled Push + 20 DB Devil Presses (50/35s) + 400m Run.',
    athlete_notes: 'Zone 2/3 aerobic endurance building. Maintain 80% effort level across all 40 minutes.',
    coaches_notes: '🔒 COACH SECRET NOTES: Keep turf lanes clear. Sled weight is 4 plates for guys, 3 plates for ladies. Encourage nasal breathing.',
    scoring_type: 'rounds_reps',
    status: 'published',
    created_by: 'usr-2',
    created_at: '2026-07-28T15:00:00Z',
    updated_at: '2026-07-28T15:00:00Z',
  },
  {
    id: 'wkt-103',
    track_id: 'trk-1',
    scheduled_date: '2026-07-22', // Past
    title: 'Heavy Back Squat & Sprint',
    description: 'Part A: 3x3 Back Squat @ 85% 1RM.\nPart B: 5 Rounds of 10 Pull-ups and 200m Sprint.',
    athlete_notes: 'Log your heaviest Back Squat 3RM set in Part A!',
    coaches_notes: '🔒 COACH SECRET NOTES: Check athletes squat knees for caving.',
    scoring_type: 'weight',
    status: 'published',
    created_by: 'usr-2',
    created_at: '2026-07-21T10:00:00Z',
    updated_at: '2026-07-21T10:00:00Z',
  },
  {
    id: 'wkt-104',
    track_id: 'trk-1',
    scheduled_date: '2026-06-15', // Past
    title: 'Clean & Jerk Ladder + Fran Benchmark',
    description: 'Benchmark Testing Day: "Fran" (21-15-9 Thrusters 95/65 & Pull-ups)',
    athlete_notes: 'Give this 100% effort! Benchmark PR day.',
    coaches_notes: '🔒 COACH SECRET NOTES: Validate full elbow extension at top of thrusters.',
    scoring_type: 'time',
    status: 'published',
    created_by: 'usr-2',
    created_at: '2026-06-14T10:00:00Z',
    updated_at: '2026-06-14T10:00:00Z',
  },
  {
    id: 'wkt-105',
    track_id: 'trk-4',
    scheduled_date: '2026-08-05', // Future Hidden
    title: 'Secret Test WOD: Barbell Extravaganza',
    description: 'Cycle Alpha Preview: Heavy Deadlift 1RM into 50 DB Devil Presses.',
    athlete_notes: 'Coming soon for the championship test cycle.',
    coaches_notes: '🔒 COACH SECRET NOTES: Do NOT reveal this track to members until Aug 1.',
    scoring_type: 'time',
    status: 'draft',
    created_by: 'usr-3',
    created_at: '2026-07-25T10:00:00Z',
    updated_at: '2026-07-25T10:00:00Z',
  },
];

export const INITIAL_WORKOUT_MOVEMENTS: WorkoutMovement[] = [
  // Workout 101: Back Squat, Thruster, Pull-up
  { id: 'wm-1', workout_id: 'wkt-101', movement_id: 'mov-1', order_index: 1, rx_weight_male_lbs: 315, rx_weight_female_lbs: 215, target_reps: 5, notes: 'Heavy 5-5-3-3-1-1 set' },
  { id: 'wm-2', workout_id: 'wkt-101', movement_id: 'mov-2', order_index: 2, rx_weight_male_lbs: 95, rx_weight_female_lbs: 65, target_reps: 45, notes: '3 rounds x 15 reps' },
  { id: 'wm-3', workout_id: 'wkt-101', movement_id: 'mov-3', order_index: 3, target_reps: 45, notes: '3 rounds x 15 kipping/butterfly' },

  // Workout 102: Row 500m, DB Devil Press
  { id: 'wm-4', workout_id: 'wkt-102', movement_id: 'mov-7', order_index: 1, target_distance_meters: 500, notes: 'Pace at 1:45/500m' },
  { id: 'wm-5', workout_id: 'wkt-102', movement_id: 'mov-8', order_index: 2, rx_weight_male_lbs: 50, rx_weight_female_lbs: 35, target_reps: 20 },

  // Workout 103: Back Squat, Pull-up
  { id: 'wm-6', workout_id: 'wkt-103', movement_id: 'mov-1', order_index: 1, rx_weight_male_lbs: 295, rx_weight_female_lbs: 195, target_reps: 3, notes: '3x3 heavy working sets' },
  { id: 'wm-7', workout_id: 'wkt-103', movement_id: 'mov-3', order_index: 2, target_reps: 50, notes: '5 rounds x 10 reps' },

  // Workout 104: Thruster, Pull-up (Fran)
  { id: 'wm-8', workout_id: 'wkt-104', movement_id: 'mov-2', order_index: 1, rx_weight_male_lbs: 95, rx_weight_female_lbs: 65, target_reps: 45, notes: '21-15-9' },
  { id: 'wm-9', workout_id: 'wkt-104', movement_id: 'mov-3', order_index: 2, target_reps: 45, notes: '21-15-9' },
];

export const INITIAL_WORKOUT_RESULTS: WorkoutResult[] = [
  // Alex logged results
  {
    id: 'res-1',
    workout_id: 'wkt-103',
    user_id: 'usr-1',
    score_display: '315 lbs (3RM)',
    score_numeric: 315,
    rx_type: 'rx',
    notes: 'Built to 315 lbs on Part A! Felt super strong.',
    logged_at: '2026-07-22T17:30:00Z',
  },
  {
    id: 'res-2',
    workout_id: 'wkt-104',
    user_id: 'usr-1',
    score_display: '2:45 (165s)',
    score_numeric: 165,
    rx_type: 'rx',
    notes: 'New PR on Fran! All thrusters unbroken.',
    logged_at: '2026-06-15T18:15:00Z',
  },
  // Coach Marcus logged results
  {
    id: 'res-3',
    workout_id: 'wkt-103',
    user_id: 'usr-2',
    score_display: '385 lbs (3RM)',
    score_numeric: 385,
    rx_type: 'rx_plus',
    notes: 'Easy speed sets.',
    logged_at: '2026-07-22T16:00:00Z',
  },
];

export const INITIAL_WORKOUT_RESULT_MOVEMENTS: WorkoutResultMovement[] = [
  {
    id: 'res-mov-1',
    result_id: 'res-1',
    movement_id: 'mov-1', // Back Squat
    weight_used_lbs: 315,
    reps_completed: 3,
    notes: '3 reps at 315 lbs',
  },
  {
    id: 'res-mov-2',
    result_id: 'res-1',
    movement_id: 'mov-3', // Pull-ups
    reps_completed: 50,
    time_seconds: 420,
    notes: 'Butterfly unbroken sets of 10',
  },
  {
    id: 'res-mov-3',
    result_id: 'res-2',
    movement_id: 'mov-2', // Thruster
    weight_used_lbs: 95,
    reps_completed: 45,
    notes: 'Unbroken 21-15-9',
  },
  {
    id: 'res-mov-4',
    result_id: 'res-2',
    movement_id: 'mov-3', // Pull-up
    reps_completed: 45,
    notes: 'Quick singles on set of 9',
  },
  {
    id: 'res-mov-5',
    result_id: 'res-3',
    movement_id: 'mov-1', // Back Squat (Marcus)
    weight_used_lbs: 385,
    reps_completed: 3,
    notes: '385 lbs 3RM',
  },
];

/**
 * SIMULATED POSTGRES / SUPABASE QUERY ENGINE
 */
export function queryUserMovementHistorySimulated(
  userId: string,
  movementIds: string[],
  workoutResults: WorkoutResult[],
  workoutResultMovements: WorkoutResultMovement[],
  workouts: Workout[],
  tracks: Track[],
  movements: Movement[]
): MovementHistoryEntry[] {
  const entries: MovementHistoryEntry[] = [];
  const safeMovements = movements || [];
  const safeResultMovements = workoutResultMovements || [];
  const safeWorkoutResults = workoutResults || [];
  const safeWorkouts = workouts || [];
  const safeTracks = tracks || [];

  for (const movId of (movementIds || [])) {
    const mov = safeMovements.find((m) => m.id === movId);
    if (!mov) continue;

    // Find all result movements matching this movement for this user
    const matchingResultMovements = safeResultMovements.filter((rm) => rm.movement_id === movId);

    for (const rm of matchingResultMovements) {
      const result = safeWorkoutResults.find((r) => r.id === rm.result_id && r.user_id === userId);
      if (!result) continue;

      const workout = safeWorkouts.find((w) => w.id === result.workout_id);
      if (!workout) continue;

      const track = safeTracks.find((t) => t.id === workout.track_id);

      entries.push({
        movement_id: mov.id,
        movement_name: mov.name,
        movement_category: mov.category,
        logged_at: result.logged_at,
        workout_title: workout.title,
        workout_date: workout.scheduled_date,
        track_name: track?.name || 'Unknown Track',
        rx_type: result.rx_type,
        weight_used_lbs: rm.weight_used_lbs,
        reps_completed: rm.reps_completed,
        time_seconds: rm.time_seconds,
        score_display: result.score_display,
        workout_result_id: result.id,
      });
    }
  }

  // Sort chronologically descending
  return entries.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
}
