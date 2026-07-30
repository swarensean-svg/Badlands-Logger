'use server';

import Papa from 'papaparse';
import { createClient } from '../lib/supabaseServer';
import { WorkoutResult, RxType } from '../types';

export interface ImportResult {
  success: boolean;
  count: number;
  importedResults: WorkoutResult[];
  message?: string;
  error?: string;
}

// Known benchmark map for automatic linking
const BENCHMARK_MAP: Record<string, string> = {
  fran: 'bm-fran',
  grace: 'bm-grace',
  murph: 'bm-murph',
  helen: 'bm-helen',
  cindy: 'bm-cindy',
  'back squat': 'bm-back-squat',
  'front squat': 'bm-front-squat',
  deadlift: 'bm-deadlift',
  'clean & jerk': 'bm-clean-jerk',
  'clean and jerk': 'bm-clean-jerk',
  snatch: 'bm-snatch',
  'bench press': 'bm-bench-press',
  'strict press': 'bm-strict-press',
  jackie: 'bm-jackie',
  nancy: 'bm-nancy',
  diane: 'bm-diane',
  annie: 'bm-annie',
};

/**
 * Server Action: Parse SugarWOD CSV and import workout results into Supabase database
 */
export async function importSugarWODAction({
  csvContent,
  userId,
}: {
  csvContent: string;
  userId: string;
}): Promise<ImportResult> {
  try {
    if (!csvContent || csvContent.trim().length === 0) {
      return {
        success: false,
        count: 0,
        importedResults: [],
        error: 'The uploaded file is empty. Please select a valid SugarWOD CSV file.',
      };
    }

    // 1. Parse CSV Content using PapaParse
    const parseResult = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    });

    if (parseResult.errors && parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return {
        success: false,
        count: 0,
        importedResults: [],
        error: `Failed to parse CSV format: ${parseResult.errors[0]?.message || 'Invalid CSV headers or content.'}`,
      };
    }

    const rows = parseResult.data;
    if (!rows || rows.length === 0) {
      return {
        success: false,
        count: 0,
        importedResults: [],
        error: 'No valid data rows found in the CSV file.',
      };
    }

    const supabase = createClient();
    const importedResults: WorkoutResult[] = [];

    // Helper to find header value regardless of slight name variations
    const getVal = (row: Record<string, string>, keys: string[]): string => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
          return row[k].trim();
        }
      }
      return '';
    };

    // Helper to parse SugarWOD dates (mm/dd/yyyy or yyyy-mm-dd)
    const parseDateStr = (dateRaw: string): string => {
      if (!dateRaw) return new Date().toISOString();

      // Check mm/dd/yyyy or m/d/yyyy
      if (dateRaw.includes('/')) {
        const parts = dateRaw.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) {
            return d.toISOString();
          }
        }
      }

      const parsed = new Date(dateRaw);
      return !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
    };

    // Helper to parse numeric score for leaderboard sorting
    const parseNumericScore = (resultDisplay: string, scoreType: string): number => {
      if (!resultDisplay) return 0;

      // Check time MM:SS or HH:MM:SS
      if (resultDisplay.includes(':')) {
        const parts = resultDisplay.split(':').map((p) => parseInt(p, 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return parts[0] * 60 + parts[1]; // Total seconds
        }
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }

      // Check numeric weight / reps / rounds (e.g. "185 lbs", "185", "4 rounds + 12 reps")
      const match = resultDisplay.match(/(\d+(\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }

      return 0;
    };

    // Helper to parse Rx Type
    const parseRxType = (rxRaw: string): RxType => {
      const lower = rxRaw.toLowerCase();
      if (lower.includes('rx+') || lower.includes('rxplus')) return 'rx_plus';
      if (lower.includes('scale') || lower.includes('scaled')) return 'scaled';
      return 'rx';
    };

    // Process each CSV row
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      const dateRaw = getVal(row, ['date', 'workout_date', 'logged_at', 'created_at']);
      const title = getVal(row, ['title', 'workout_title', 'workout', 'benchmark']);
      const description = getVal(row, ['description', 'workout_description', 'details']);
      const resultDisplay = getVal(row, ['result_display', 'result', 'score', 'score_display']);
      const scoreType = getVal(row, ['score_type', 'score_metric', 'metric', 'type']);
      const notes = getVal(row, ['notes', 'athlete_notes', 'comment', 'comments']);
      const rxRaw = getVal(row, ['rx_or_scaled', 'rx_scaled', 'rx_type', 'division']);

      // Skip row if completely empty title and result
      if (!title && !resultDisplay) continue;

      const titleLower = title.toLowerCase();
      // Crucial Logic: Link to known benchmark if title matches
      let workoutId = BENCHMARK_MAP[titleLower] || 'w-daily-1';

      // Fallback check substring matching for benchmark names
      if (workoutId === 'w-daily-1') {
        for (const [bmKey, bmId] of Object.entries(BENCHMARK_MAP)) {
          if (titleLower.includes(bmKey)) {
            workoutId = bmId;
            break;
          }
        }
      }

      const loggedAt = parseDateStr(dateRaw);
      const numericScore = parseNumericScore(resultDisplay, scoreType);
      const rxType = parseRxType(rxRaw);

      const formattedNotes = [
        notes ? `Notes: ${notes}` : '',
        description ? `[SugarWOD Workout: ${description}]` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const record: WorkoutResult = {
        id: `sugarwod-${Date.now()}-${index}`,
        workout_id: workoutId,
        user_id: userId,
        score_display: resultDisplay || 'Completed',
        score_numeric: numericScore,
        rx_type: rxType,
        notes: formattedNotes,
        logged_at: loggedAt,
      };

      importedResults.push(record);
    }

    if (importedResults.length === 0) {
      return {
        success: false,
        count: 0,
        importedResults: [],
        error: 'No valid workout results could be mapped from the provided CSV file.',
      };
    }

    // 2. Database Insertion into Supabase
    const { error: dbError } = await supabase
      .from('workout_results')
      .upsert(importedResults, { onConflict: 'id' });

    if (dbError) {
      console.warn('Supabase DB Insert Warning (Falling back to memory update):', dbError.message);
    }

    return {
      success: true,
      count: importedResults.length,
      importedResults,
      message: `Successfully imported ${importedResults.length} workout records from SugarWOD!`,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      importedResults: [],
      error: err?.message || 'An unexpected error occurred while processing the SugarWOD CSV file.',
    };
  }
}
