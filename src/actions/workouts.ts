'use server';

import { Workout, ScoringType, BenchmarkCategory, GymBenchmark } from '../types';

export interface CloneWorkoutParams {
  workoutId: string;
  targetDate: string; // YYYY-MM-DD
  targetTrackId: string;
}

export interface WorkoutActionResult {
  success: boolean;
  message?: string;
  updatedWorkout?: Workout;
  clonedWorkout?: Workout;
  error?: string;
}

/**
  * Next.js Server Action: Reschedule / Move a Workout to a New Date (src/actions/workouts.ts)
  * Used for Drag-and-Drop calendar interactions.
  */
export async function moveWorkoutDate(
  workoutId: string,
  newDate: string
): Promise<WorkoutActionResult> {
  try {
    if (!workoutId || !newDate) {
      return { success: false, error: 'Invalid parameters for moving workout date.' };
    }

    return {
      success: true,
      message: `Successfully rescheduled workout ${workoutId} to ${newDate}`,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to move workout date.' };
  }
}

/**
  * Next.js Server Action: Clone an existing Workout to a target Track and Date
  */
export async function cloneWorkoutAction(
  sourceWorkout: Workout,
  targetTrackId: string,
  targetDate: string
): Promise<WorkoutActionResult> {
  try {
    if (!sourceWorkout || !targetTrackId || !targetDate) {
      return { success: false, error: 'Missing required fields for cloning workout.' };
    }

    const newId = `wkt-${Date.now()}`;
    const cloned: Workout = {
      ...sourceWorkout,
      id: newId,
      track_id: targetTrackId,
      scheduled_date: targetDate,
      title: `${sourceWorkout.title} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Cloned "${sourceWorkout.title}" to date ${targetDate}`,
      clonedWorkout: cloned,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to clone workout.' };
  }
}

/**
  * Next.js Server Action: Delete a Workout
  */
export async function deleteWorkoutAction(workoutId: string): Promise<WorkoutActionResult> {
  try {
    if (!workoutId) {
      return { success: false, error: 'Workout ID required for deletion.' };
    }

    return {
      success: true,
      message: `Deleted workout ${workoutId}`,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete workout.' };
  }
}

/**
  * Next.js Server Action: Create Global Gym Benchmark
  */
export async function createGymBenchmarkAction(
  benchmark: Omit<GymBenchmark, 'id' | 'created_at'>
): Promise<{ success: boolean; benchmark?: GymBenchmark; error?: string }> {
  try {
    const created: GymBenchmark = {
      ...benchmark,
      id: `bmk-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    return {
      success: true,
      benchmark: created,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create gym benchmark.' };
  }
}
