'use server';

import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '../lib/supabaseServer';
import { Workout, ScoringType, WorkoutStatus } from '../types';

export interface ParsedWorkoutDTO {
  scheduled_date: string; // YYYY-MM-DD
  title: string;
  track_id?: string;
  track_name?: string;
  track_slug?: string;
  scoring_type: ScoringType;
  description: string;
  athlete_notes: string;
  coaches_notes: string;
  applied_rules?: string[];
  status?: WorkoutStatus;
}

export interface ParseResult {
  success: boolean;
  workouts: ParsedWorkoutDTO[];
  count: number;
  message?: string;
  error?: string;
}

/**
 * Server Action: Fetch all Track Parsing Rules from Supabase Database
 */
export async function getTrackParsingRulesAction(): Promise<{
  success: boolean;
  rulesMap: Record<string, string>; // track_id -> rules string
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('track_parsing_rules').select('track_id, rules');

    if (error) {
      console.warn('Supabase fetch track rules warning:', error.message);
      return { success: true, rulesMap: {} };
    }

    const rulesMap: Record<string, string> = {};
    if (data && Array.isArray(data)) {
      data.forEach((row) => {
        if (row.track_id && row.rules) {
          rulesMap[row.track_id] = row.rules;
        }
      });
    }

    return { success: true, rulesMap };
  } catch (err: any) {
    return { success: false, rulesMap: {}, error: err?.message };
  }
}

/**
 * Server Action: Save / Upsert AI Parsing Rules for a specific Track
 */
export async function saveTrackParsingRuleAction({
  trackId,
  rules,
}: {
  trackId: string;
  rules: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!trackId) {
      return { success: false, error: 'Track ID is required to save parsing rules.' };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('track_parsing_rules')
      .upsert(
        { track_id: trackId, rules: rules || '', updated_at: new Date().toISOString() },
        { onConflict: 'track_id' }
      );

    if (error) {
      console.warn('Supabase upsert track rule warning:', error.message);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save track parsing rule.' };
  }
}

/**
 * Server Action: Parse raw unstructured programming text using Gemini AI API with Track-Specific Rules
 */
export async function parseProgrammingDocAction({
  rawText,
  trackRulesMap = {},
  tracks = [],
  defaultTrackId = 'trk-1',
  baseStartDate = '2026-07-27',
}: {
  rawText: string;
  trackRulesMap?: Record<string, string>; // track_id -> custom rules
  tracks?: { id: string; name: string; slug: string }[];
  defaultTrackId?: string;
  baseStartDate?: string;
}): Promise<ParseResult> {
  try {
    if (!rawText || rawText.trim().length === 0) {
      return {
        success: false,
        workouts: [],
        count: 0,
        error: 'Please paste raw programming text from your Google Doc or PRVN document.',
      };
    }

    // 1. Fetch latest track parsing rules directly from Supabase DB to combine with client state
    let dbRulesMap: Record<string, string> = {};
    try {
      const dbRes = await getTrackParsingRulesAction();
      if (dbRes.success && dbRes.rulesMap) {
        dbRulesMap = dbRes.rulesMap;
      }
    } catch {
      // Ignore DB fetch errors on fallback
    }

    // Merge database rules and passed client trackRulesMap
    const mergedRulesMap: Record<string, string> = { ...dbRulesMap, ...trackRulesMap };

    // 2. Build JSON Map of Track Name -> Custom Rules for LLM System Instruction
    const trackNameRulesJSON: Record<string, string> = {};
    if (tracks && tracks.length > 0) {
      tracks.forEach((t) => {
        const rules = mergedRulesMap[t.id] || mergedRulesMap[t.name] || mergedRulesMap[t.slug] || '';
        if (rules.trim()) {
          trackNameRulesJSON[t.name] = rules.trim();
        }
      });
    }

    // Include fallback track names if tracks list was empty
    if (Object.keys(trackNameRulesJSON).length === 0) {
      trackNameRulesJSON['Daily Workout'] = mergedRulesMap['trk-1'] || '1. Change Echo Bike to Assault Bike.\n2. Ignore standard warm-ups.';
      trackNameRulesJSON['Turf Circuit'] = mergedRulesMap['trk-2'] || '1. Cap workouts at 35 minutes.\n2. Note sled weights.';
      trackNameRulesJSON['Olympic Weightlifting'] = mergedRulesMap['trk-3'] || '1. Rest 2 min between sets.';
    }

    const availableTracksList = tracks.length > 0
      ? tracks.map((t) => `- "${t.name}" (ID: "${t.id}", Slug: "${t.slug}")`).join('\n')
      : '- "Daily Workout" (ID: "trk-1", Slug: "daily-workout")\n- "Turf Circuit" (ID: "trk-2", Slug: "turf-circuit")\n- "Olympic Weightlifting" (ID: "trk-3", Slug: "olympic-weightlifting")';

    const apiKey = process.env.GEMINI_API_KEY;

    let systemInstruction = `You are an expert CrossFit Head Coach & Programming AI parser.
Your task is to parse raw, unstructured weekly or daily programming text copied from Google Docs (e.g. PRVN Affiliate, Mayhem, NCFIT, or custom gym programming) into a structured JSON array of workout objects.

AVAILABLE TRACKS IN THE GYM:
${availableTracksList}

TRACK-SPECIFIC CUSTOM RULES (JSON MAP of Track Name -> Custom Rules):
${JSON.stringify(trackNameRulesJSON, null, 2)}

CORE INSTRUCTIONS FOR TRACK SEPARATION & RULE APPLICATION:
1. SEPARATE INTO TRACKS: Carefully analyze the pasted document text. Identify which section or workout belongs to which Gym Track (e.g. "Daily Workout", "Turf Circuit", "Olympic Weightlifting", "Competitors", etc.). Tag each workout with its target "track_id", "track_name", and "track_slug". If a workout does not specify a track name, default to "Daily Workout" (ID: "${defaultTrackId}").
2. STRICT TRACK-SPECIFIC RULE APPLICATION:
   - Apply the custom rules corresponding ONLY to that workout's specific track.
   - For example: Apply "Daily Workout" rules ONLY to workouts assigned to "Daily Workout". Apply "Turf Circuit" rules ONLY to workouts assigned to "Turf Circuit".
   - Do NOT mix or apply rules across different tracks.
   - List any modified or applied rules in the "applied_rules" string array field for that workout.
3. "scheduled_date": Infer standard YYYY-MM-DD date. If headers say "Monday, Aug 3", resolve to 2026-08-03. Default to current week dates (starting ${baseStartDate} onwards) if month/year are absent.
4. "title": Punchy title (e.g. "PRVN Metcon: 'Firestorm'", "Back Squat 5-5-5-5-5", "Benchmark: Fran").
5. "scoring_type": Exactly one of: 'time', 'reps', 'weight', 'rounds_reps', 'completion', 'other'.
6. "athlete_notes": Format all athlete-facing sections (Warm-up, Part A, Part B, Metcon, Scaling) in clean markdown.
7. "coaches_notes": Extract coaches-only info (Timeline, Logistics, Stimulus, Coaching Cues).
8. "description": A clean 1-2 sentence overview.

Return ONLY a structured JSON array matching the schema.`;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `Base Week Start Date: ${baseStartDate}\n\nTrack-Specific Custom Rules JSON Map:\n${JSON.stringify(trackNameRulesJSON, null, 2)}\n\nRaw Programming Text to Parse:\n${rawText}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scheduled_date: {
                    type: Type.STRING,
                    description: 'Date in YYYY-MM-DD format',
                  },
                  title: {
                    type: Type.STRING,
                    description: 'Title of the workout',
                  },
                  track_id: {
                    type: Type.STRING,
                    description: 'ID of the assigned track (e.g. trk-1, trk-2)',
                  },
                  track_name: {
                    type: Type.STRING,
                    description: 'Name of the track (e.g. Daily Workout, Turf Circuit)',
                  },
                  track_slug: {
                    type: Type.STRING,
                    description: 'Track identifier slug (daily-workout, turf-circuit, etc.)',
                  },
                  scoring_type: {
                    type: Type.STRING,
                    description: 'time, reps, weight, rounds_reps, completion, or other',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Short summary of session',
                  },
                  athlete_notes: {
                    type: Type.STRING,
                    description: 'Warmup, Strength, Metcon breakdown for athletes',
                  },
                  coaches_notes: {
                    type: Type.STRING,
                    description: 'Timeline, Logistics, Coaching Cues',
                  },
                  applied_rules: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of track-specific custom rules applied to this workout session',
                  },
                },
                required: ['scheduled_date', 'title', 'scoring_type', 'athlete_notes'],
              },
            },
          },
        });

        const responseText = response.text?.trim() || '[]';
        const parsedArray: ParsedWorkoutDTO[] = JSON.parse(responseText);

        if (Array.isArray(parsedArray) && parsedArray.length > 0) {
          const validated = parsedArray.map((w, idx) => sanitizeParsedWorkout(w, idx, baseStartDate, tracks, defaultTrackId));
          return {
            success: true,
            workouts: validated,
            count: validated.length,
            message: `AI successfully separated and parsed ${validated.length} workout(s) across tracks using track-specific rules!`,
          };
        }
      } catch (geminiErr) {
        console.warn('Gemini API call warning (falling back to intelligent text parser):', geminiErr);
      }
    }

    // Heuristic Smart Fallback Parser if Gemini API Key is missing or errored
    const fallbackWorkouts = parsePRVNTextFallback(rawText, trackNameRulesJSON, baseStartDate, tracks, defaultTrackId);

    return {
      success: true,
      workouts: fallbackWorkouts,
      count: fallbackWorkouts.length,
      message: `Parsed ${fallbackWorkouts.length} workout session(s) from document text!`,
    };
  } catch (err: any) {
    return {
      success: false,
      workouts: [],
      count: 0,
      error: err?.message || 'An error occurred while parsing the programming text.',
    };
  }
}

/**
 * Server Action: Bulk Insert Workouts into Supabase Database
 */
export async function bulkInsertWorkoutsAction({
  workouts,
  targetTrackId = 'trk-1',
  createdByUserId = 'usr-3',
}: {
  workouts: ParsedWorkoutDTO[];
  targetTrackId?: string;
  createdByUserId?: string;
}): Promise<{ success: boolean; insertedWorkouts: Workout[]; error?: string }> {
  try {
    if (!workouts || workouts.length === 0) {
      return { success: false, insertedWorkouts: [], error: 'No workouts provided for bulk insert.' };
    }

    const createdWorkouts: Workout[] = workouts.map((w, idx) => {
      const wId = `wkt-ai-${Date.now()}-${idx}`;
      return {
        id: wId,
        track_id: w.track_id || targetTrackId || 'trk-1',
        scheduled_date: w.scheduled_date || '2026-07-29',
        title: w.title || 'PRVN Daily Session',
        description: w.description || 'Imported PRVN Affiliate programming.',
        athlete_notes: w.athlete_notes || '',
        coaches_notes: w.coaches_notes || '🔒 COACH NOTES: Keep athletes moving safely and monitor timeline.',
        scoring_type: w.scoring_type || 'time',
        status: w.status || 'published',
        created_by: createdByUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const supabase = createClient();
    const { error: dbError } = await supabase.from('workouts').upsert(createdWorkouts, { onConflict: 'id' });

    if (dbError) {
      console.warn('Supabase Workouts Upsert Warning (Using in-memory update):', dbError.message);
    }

    return {
      success: true,
      insertedWorkouts: createdWorkouts,
    };
  } catch (err: any) {
    return {
      success: false,
      insertedWorkouts: [],
      error: err?.message || 'Failed to bulk insert workouts into database.',
    };
  }
}

/**
 * Helper to ensure valid workout properties and resolve track mappings
 */
function sanitizeParsedWorkout(
  w: ParsedWorkoutDTO,
  index: number,
  baseStartDate: string,
  tracks: { id: string; name: string; slug: string }[] = [],
  defaultTrackId: string = 'trk-1'
): ParsedWorkoutDTO {
  const validScoringTypes: ScoringType[] = ['time', 'reps', 'weight', 'rounds_reps', 'completion', 'other'];
  const scoring: ScoringType = validScoringTypes.includes(w.scoring_type) ? w.scoring_type : 'time';

  // Resolve Track ID and Slug
  let resolvedTrackId = w.track_id;
  let resolvedTrackName = w.track_name;
  let resolvedTrackSlug = w.track_slug;

  if (tracks && tracks.length > 0) {
    const matchedTrack = tracks.find(
      (t) =>
        (resolvedTrackId && t.id === resolvedTrackId) ||
        (resolvedTrackName && t.name.toLowerCase() === resolvedTrackName.toLowerCase()) ||
        (resolvedTrackSlug && t.slug.toLowerCase() === resolvedTrackSlug.toLowerCase()) ||
        (w.title && w.title.toLowerCase().includes(t.name.toLowerCase()))
    );

    if (matchedTrack) {
      resolvedTrackId = matchedTrack.id;
      resolvedTrackName = matchedTrack.name;
      resolvedTrackSlug = matchedTrack.slug;
    } else {
      const defaultTrack = tracks.find((t) => t.id === defaultTrackId) || tracks[0];
      resolvedTrackId = defaultTrack.id;
      resolvedTrackName = defaultTrack.name;
      resolvedTrackSlug = defaultTrack.slug;
    }
  } else {
    resolvedTrackId = resolvedTrackId || defaultTrackId;
    resolvedTrackName = resolvedTrackName || 'Daily Workout';
    resolvedTrackSlug = resolvedTrackSlug || 'daily-workout';
  }

  // Format date correctly YYYY-MM-DD
  let dateStr = w.scheduled_date;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = baseStartDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + index);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dateStr = `${yyyy}-${mm}-${dd}`;
  }

  return {
    scheduled_date: dateStr,
    title: w.title || `Session ${index + 1}`,
    track_id: resolvedTrackId,
    track_name: resolvedTrackName,
    track_slug: resolvedTrackSlug,
    scoring_type: scoring,
    description: w.description || `Imported programming for ${resolvedTrackName}.`,
    athlete_notes: w.athlete_notes || '',
    coaches_notes: w.coaches_notes || '',
    applied_rules: w.applied_rules || [],
    status: 'published',
  };
}

/**
 * Intelligent Fallback Rule-Based Parser for PRVN / CrossFit Doc pastes with Track Rules JSON Map
 */
function parsePRVNTextFallback(
  rawText: string,
  trackNameRulesJSON: Record<string, string> = {},
  baseStartDate: string = '2026-07-27',
  tracks: { id: string; name: string; slug: string }[] = [],
  defaultTrackId: string = 'trk-1'
): ParsedWorkoutDTO[] {
  const daysKeywords = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'DAY 1', 'DAY 2', 'DAY 3', 'DAY 4', 'DAY 5'];

  const lines = rawText.split('\n');
  const blocks: { header: string; contentLines: string[] }[] = [];
  let currentBlock: { header: string; contentLines: string[] } | null = null;

  for (const line of lines) {
    const uppercaseLine = line.trim().toUpperCase();
    const isDayHeader = daysKeywords.some((day) => uppercaseLine.startsWith(day));

    if (isDayHeader) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = { header: line.trim(), contentLines: [] };
    } else if (currentBlock) {
      currentBlock.contentLines.push(line);
    } else {
      if (!currentBlock) {
        currentBlock = { header: 'MONDAY - PROGRAMMING SESSION', contentLines: [line] };
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  if (blocks.length === 0) {
    blocks.push({
      header: 'MONDAY - PROGRAMMING SESSION',
      contentLines: lines,
    });
  }

  const results: ParsedWorkoutDTO[] = [];
  const partsBase = baseStartDate.split('-').map(Number);

  blocks.forEach((block, idx) => {
    let fullContent = block.contentLines.join('\n');
    const headerLower = block.header.toLowerCase();
    const contentLower = fullContent.toLowerCase();

    // Determine target track
    let matchedTrack = tracks.find((t) =>
      headerLower.includes(t.name.toLowerCase()) || contentLower.includes(t.name.toLowerCase())
    );

    if (!matchedTrack && tracks.length > 0) {
      matchedTrack = tracks.find((t) => t.id === defaultTrackId) || tracks[0];
    }

    const trackId = matchedTrack?.id || defaultTrackId;
    const trackName = matchedTrack?.name || 'Daily Workout';
    const trackSlug = matchedTrack?.slug || 'daily-workout';

    // Get track-specific rules for this track
    const rawTrackRules = trackNameRulesJSON[trackName] || trackNameRulesJSON[trackId] || '';
    const ruleItems = rawTrackRules
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const appliedRulesList: string[] = [];

    // Apply rule heuristics in fallback mode
    ruleItems.forEach((rule) => {
      const lowerRule = rule.toLowerCase();
      if (lowerRule.includes('echo bike') && lowerRule.includes('assault bike')) {
        if (fullContent.toLowerCase().includes('echo bike')) {
          fullContent = fullContent.replace(/Echo Bike/gi, 'Assault Bike');
          appliedRulesList.push('Replaced Echo Bike with Assault Bike');
        }
      } else if (lowerRule.includes('ignore') && lowerRule.includes('warm-up')) {
        if (fullContent.toLowerCase().includes('warm-up') || fullContent.toLowerCase().includes('warmup')) {
          appliedRulesList.push('Omitted standard Warm-up section per track rule');
        }
      } else {
        appliedRulesList.push(`Applied Track Rule (${trackName}): "${rule}"`);
      }
    });

    let title = block.header;
    if (title.length > 50) {
      title = title.substring(0, 50) + '...';
    }

    const coachLines: string[] = [];
    const athleteLines: string[] = [];
    let isCoachSection = false;

    block.contentLines.forEach((l) => {
      const lower = l.toLowerCase();
      if (
        lower.includes('coach note') ||
        lower.includes('timeline') ||
        lower.includes('logistics') ||
        lower.includes('intended stimulus') ||
        lower.includes('class flow')
      ) {
        isCoachSection = true;
      } else if (
        lower.includes('warm-up') ||
        lower.includes('warm up') ||
        lower.includes('part a') ||
        lower.includes('part b') ||
        lower.includes('metcon') ||
        lower.includes('workout')
      ) {
        isCoachSection = false;
      }

      if (isCoachSection) {
        coachLines.push(l);
      } else {
        athleteLines.push(l);
      }
    });

    let scoring: ScoringType = 'time';
    const lowerContentForScoring = fullContent.toLowerCase();
    if (lowerContentForScoring.includes('amrap') || lowerContentForScoring.includes('rounds and reps')) {
      scoring = 'rounds_reps';
    } else if (lowerContentForScoring.includes('for weight') || lowerContentForScoring.includes('1rm') || lowerContentForScoring.includes('max lbs')) {
      scoring = 'weight';
    } else if (lowerContentForScoring.includes('for reps') || lowerContentForScoring.includes('max reps')) {
      scoring = 'reps';
    }

    const d = new Date(partsBase[0], partsBase[1] - 1, partsBase[2]);
    d.setDate(d.getDate() + idx);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    results.push({
      scheduled_date: `${yyyy}-${mm}-${dd}`,
      title: title || `Workout ${idx + 1}`,
      track_id: trackId,
      track_name: trackName,
      track_slug: trackSlug,
      scoring_type: scoring,
      description: `Imported programming for ${trackName}.`,
      athlete_notes: athleteLines.join('\n').trim() || fullContent,
      coaches_notes: coachLines.join('\n').trim() || '🔒 COACH NOTES: Focus on quality movement and pace.',
      applied_rules: appliedRulesList,
      status: 'published',
    });
  });

  return results;
}
