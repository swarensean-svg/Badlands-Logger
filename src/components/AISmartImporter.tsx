import React, { useState, useEffect } from 'react';
import {
  parseProgrammingDocAction,
  bulkInsertWorkoutsAction,
  getTrackParsingRulesAction,
  saveTrackParsingRuleAction,
  ParsedWorkoutDTO,
} from '../actions/parseProgramming';
import { Track, Workout } from '../types';
import {
  Sparkles,
  FileText,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Dumbbell,
  Trash2,
  ShieldCheck,
  Check,
  Settings2,
  Save,
  Wand2,
} from 'lucide-react';

interface AISmartImporterProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  baseStartDate: string; // YYYY-MM-DD
  onImportSuccess: (newWorkouts: Workout[]) => void;
}

const DEFAULT_TRACK_RULES: Record<string, string> = {
  'trk-1': `1. Always change Echo Bike to Assault Bike.
2. Ignore standard PRVN warm-ups (our coaches lead custom dynamic warm-ups).
3. If workout contains dumbbell thrusters, add a note: "Keep elbow position high on DB thrusters".`,
  'trk-2': `1. Cap all Turf Circuit workouts at 35 minutes max duration.
2. If workout includes sled pushes, add note: "Sled weight: 4 plates for men, 3 plates for women".`,
  'trk-3': `1. Rest strictly 2:00 between snatch complex sets.
2. Always list percentage targets in bold text.`,
};

const SAMPLE_PRVN_DOC = `MONDAY, AUGUST 3 - DAILY WORKOUT: PRVN METCON "FIRESTORM"

[WARM-UP]
3 Rounds for Quality:
- 200m Easy Jog
- 10 Banded Pass-Throughs
- 10 Air Squats with 3 sec pause at bottom

[PART A: STRENGTH / BACK SQUAT]
Every 2:30 x 5 Sets:
- 5 Back Squats @ 72-78% 1RM
*Focus on speed out of the hole and vertical torso.

[PART B: METCON - "FIRESTORM"]
12 Minute AMRAP:
- 12 Dumbbell Thrusters (50/35 lbs)
- 12 Toes to Bar
- 24 Double Unders (or 15 Calorie Echo Bike)
*Target Score: 4+ Rounds. Rx+ 70/50 lbs DBs.

[TIMELINE & LOGISTICS - COACHES ONLY]
0:00-10:00 - General Warm-up & Movement Prep
10:00-25:00 - Back Squat Sets
25:00-35:00 - Metcon Brief & Scaling
35:00-47:00 - Metcon "Firestorm"
47:00-60:00 - Cool-down & Score Logging

--------------------------------------------------

MONDAY, AUGUST 3 - TURF CIRCUIT: "TURF ENGINE #42"

[WARM-UP & PREP]
2 Rounds:
- 400m Row
- 15 Kettlebell Swings (53/35 lbs)

[PART A: TURF CIRCUIT METCON]
4 Rounds for Time:
- 50ft Sled Push
- 15 Dumbbell Devil Presses (45/30 lbs)
- 20 Calorie Rower / Echo Bike
*Time Cap: 40 Minutes.

--------------------------------------------------

TUESDAY, AUGUST 4 - OLYMPIC WEIGHTLIFTING: "SNATCH COMPLEX"

[WARM-UP]
2 Rounds: 8 Snatch High Pulls, 8 Muscle Snatches, 8 Overhead Squats.

[PART A: HEAVY OLYMPIC COMPLEX]
Snatch Complex (Floor + Above Knee + Hang Snatch):
- Build to a heavy triple complex in 15 Minutes. Rest 2 min between sets.
*Target percentages: 75-85% 1RM Snatch.`;

export const AISmartImporter: React.FC<AISmartImporterProps> = ({
  isOpen,
  onClose,
  tracks,
  baseStartDate,
  onImportSuccess,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || 'trk-1');

  // Track-Specific Rules State: Map of track_id -> rules string
  const [trackRulesMap, setTrackRulesMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('track_parsing_rules_map');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return DEFAULT_TRACK_RULES;
  });

  // Track ID selected in the "My Track-Specific Adjustments" dropdown for editing
  const [editingRuleTrackId, setEditingRuleTrackId] = useState<string>(tracks[0]?.id || 'trk-1');
  const [currentRuleText, setCurrentRuleText] = useState<string>(
    DEFAULT_TRACK_RULES[tracks[0]?.id || 'trk-1'] || ''
  );

  const [isEditingRules, setIsEditingRules] = useState<boolean>(false);
  const [rulesSavedNotification, setRulesSavedNotification] = useState<boolean>(false);
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false);

  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSavingWorkouts, setIsSavingWorkouts] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedWorkoutDTO[] | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  // Fetch track parsing rules from database on mount or when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getTrackParsingRulesAction().then((res) => {
      if (isMounted && res.success && res.rulesMap && Object.keys(res.rulesMap).length > 0) {
        setTrackRulesMap((prev) => {
          const merged = { ...prev, ...res.rulesMap };
          localStorage.setItem('track_parsing_rules_map', JSON.stringify(merged));
          return merged;
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync current textarea rule when changing the editing rule track ID
  useEffect(() => {
    setCurrentRuleText(trackRulesMap[editingRuleTrackId] || '');
  }, [editingRuleTrackId, trackRulesMap]);

  if (!isOpen) return null;

  const currentEditingTrackObj = tracks.find((t) => t.id === editingRuleTrackId) || tracks[0];

  // Handler: Save Track-Specific Rule to DB & State
  const handleSaveTrackRule = async () => {
    setIsSavingRule(true);
    try {
      const updatedMap = { ...trackRulesMap, [editingRuleTrackId]: currentRuleText };
      setTrackRulesMap(updatedMap);
      localStorage.setItem('track_parsing_rules_map', JSON.stringify(updatedMap));

      await saveTrackParsingRuleAction({
        trackId: editingRuleTrackId,
        rules: currentRuleText,
      });

      setRulesSavedNotification(true);
      setTimeout(() => setRulesSavedNotification(false), 2500);
    } catch (err: any) {
      console.warn('Error saving track rule:', err);
    } finally {
      setIsSavingRule(false);
    }
  };

  // Handler: Execute AI Parsing Action
  const handleParseWithAI = async () => {
    if (!rawText || rawText.trim().length === 0) {
      setErrorMsg('Please paste raw text from your Google Doc or click "Load Sample PRVN Doc".');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setParsedWorkouts(null);

    try {
      const result = await parseProgrammingDocAction({
        rawText,
        trackRulesMap,
        tracks: tracks.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
        defaultTrackId: selectedTrackId,
        baseStartDate,
      });

      if (result.success && result.workouts.length > 0) {
        setParsedWorkouts(result.workouts);
        setActivePreviewIndex(0);
      } else {
        setErrorMsg(result.error || 'AI parsing returned no workouts. Please check input text.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process document text with AI.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handler: Bulk Save to Supabase
  const handleSaveToCalendar = async () => {
    if (!parsedWorkouts || parsedWorkouts.length === 0) return;

    setIsSavingWorkouts(true);
    setErrorMsg(null);

    try {
      const result = await bulkInsertWorkoutsAction({
        workouts: parsedWorkouts,
        targetTrackId: selectedTrackId,
      });

      if (result.success && result.insertedWorkouts) {
        onImportSuccess(result.insertedWorkouts);
        onClose();
      } else {
        setErrorMsg(result.error || 'Failed to save workouts to calendar.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred during bulk save.');
    } finally {
      setIsSavingWorkouts(false);
    }
  };

  // Helper to edit parsed workout field in preview
  const handleUpdateParsedField = (index: number, field: keyof ParsedWorkoutDTO, val: any) => {
    if (!parsedWorkouts) return;
    const updated = [...parsedWorkouts];

    if (field === 'track_id') {
      const selectedTrack = tracks.find((t) => t.id === val);
      updated[index] = {
        ...updated[index],
        track_id: val,
        track_name: selectedTrack?.name || updated[index].track_name,
        track_slug: selectedTrack?.slug || updated[index].track_slug,
      };
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }

    setParsedWorkouts(updated);
  };

  const handleRemoveParsedItem = (index: number) => {
    if (!parsedWorkouts) return;
    const updated = parsedWorkouts.filter((_, i) => i !== index);
    setParsedWorkouts(updated.length > 0 ? updated : null);
    if (activePreviewIndex >= updated.length) {
      setActivePreviewIndex(Math.max(0, updated.length - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[92vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white uppercase italic tracking-wide flex items-center gap-2">
                <span>AI Smart Import</span>
                <span className="text-[10px] font-mono not-italic px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full font-semibold">
                  Track-Specific Rules Engine
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-sans">
                Paste unstructured weekly programming text to automatically separate workouts by track and apply track-specific AI rules.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Default Target Track & Start Date Header Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                <Layers className="h-3 w-3 text-indigo-400" />
                <span>Default Target Track (for unassigned blocks):</span>
              </label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none font-sans"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-indigo-400" />
                <span>Base Week Start Date:</span>
              </label>
              <input
                type="date"
                value={baseStartDate}
                disabled
                className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs rounded p-2 cursor-not-allowed font-sans"
              />
            </div>
          </div>

          {/* Track-Specific Rules Configuration Panel */}
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings2 className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                  Track-Specific AI Rules Engine
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {rulesSavedNotification && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                    <Check className="h-3 w-3" /> Saved for {currentEditingTrackObj?.name}!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingRules(!isEditingRules)}
                  className="text-[10px] text-purple-300 hover:text-purple-100 bg-purple-900/50 border border-purple-700/50 px-2.5 py-1 rounded transition font-bold uppercase"
                >
                  {isEditingRules ? 'Hide Rule Editor' : 'Configure Track Rules'}
                </button>
              </div>
            </div>

            {/* Rule Editor with Active Track Dropdown */}
            {isEditingRules ? (
              <div className="space-y-3 pt-1 border-t border-purple-800/30 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-950/80 p-2.5 rounded-lg border border-purple-900/40">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-purple-300 uppercase">Select Track to Edit Rules:</span>
                    <select
                      value={editingRuleTrackId}
                      onChange={(e) => setEditingRuleTrackId(e.target.value)}
                      className="bg-zinc-900 border border-purple-700/60 text-white text-xs rounded px-2.5 py-1 focus:ring-1 focus:ring-purple-500 outline-none font-sans font-semibold"
                    >
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentEditingTrackObj?.color || '#3B82F6' }} />
                    <span className="text-[10px] text-zinc-400 font-mono">Active Track: {currentEditingTrackObj?.name}</span>
                  </div>
                </div>

                <textarea
                  value={currentRuleText}
                  onChange={(e) => setCurrentRuleText(e.target.value)}
                  rows={4}
                  placeholder={`Enter AI rules specific to ${currentEditingTrackObj?.name} (e.g., '1. Cap workouts at 35 minutes.', '2. Always convert Echo Bike to Assault Bike')...`}
                  className="w-full bg-zinc-950 border border-purple-800/60 text-purple-100 placeholder-purple-400/40 text-xs p-3 rounded-lg focus:border-purple-500 outline-none font-mono resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-purple-300/70 italic">
                    Rules saved here strictly apply ONLY when parsing workouts assigned to <strong className="text-purple-200">{currentEditingTrackObj?.name}</strong>.
                  </span>

                  <button
                    type="button"
                    onClick={handleSaveTrackRule}
                    disabled={isSavingRule}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-[10px] uppercase rounded-lg transition flex items-center space-x-1.5 shadow-md shadow-purple-600/30"
                  >
                    {isSavingRule ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    <span>Save Rules for {currentEditingTrackObj?.name}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Summary Cards of Rules Across All Tracks */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {tracks.map((t) => {
                  const ruleVal = trackRulesMap[t.id];
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setEditingRuleTrackId(t.id);
                        setIsEditingRules(true);
                      }}
                      className="bg-zinc-950/60 hover:bg-zinc-950 border border-purple-900/30 hover:border-purple-700/50 p-2.5 rounded-lg cursor-pointer transition flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || '#3B82F6' }} />
                          {t.name}
                        </span>
                        <span className="text-[9px] font-mono text-purple-400 bg-purple-900/30 border border-purple-800/40 px-1.5 py-0.2 rounded">
                          {ruleVal ? 'Custom Rules Active' : 'No Custom Rules'}
                        </span>
                      </div>

                      <p className="text-[10px] text-purple-300/70 font-mono truncate">
                        {ruleVal ? ruleVal.replace(/\n/g, ' • ') : 'Click to configure track rules...'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Text Area & Load Sample Button */}
          {!parsedWorkouts ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>Paste Raw Google Doc / PRVN Text:</span>
                </label>

                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_PRVN_DOC)}
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-zinc-700 px-2.5 py-1 rounded transition flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>Load Multi-Track Sample Doc</span>
                </button>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste weekly programming doc text here (e.g. MONDAY: Daily Workout Metcon, Turf Circuit Engine, Olympic Weightlifting Snatch Complex...)"
                rows={10}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-xs p-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono leading-relaxed resize-none"
              />
            </div>
          ) : (
            /* Parsed Preview Section */
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-xs font-bold">
                    AI Parsed {parsedWorkouts.length} Session(s) Across Tracks
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setParsedWorkouts(null)}
                  className="text-[11px] text-zinc-400 hover:text-white underline"
                >
                  Edit Raw Text Again
                </button>
              </div>

              {/* Day / Track Tabs */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {parsedWorkouts.map((pw, idx) => {
                  const tObj = tracks.find((t) => t.id === pw.track_id || t.name === pw.track_name);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition shrink-0 flex items-center space-x-2 border ${
                        activePreviewIndex === idx
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border-zinc-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tObj?.color || '#10B981' }} />
                      <span>{pw.scheduled_date}</span>
                      <span className="text-[9px] opacity-80">({pw.track_name || 'Daily Workout'})</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Workout Card Inspector */}
              {parsedWorkouts[activePreviewIndex] && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Workout Title:</label>
                      <input
                        type="text"
                        value={parsedWorkouts[activePreviewIndex].title}
                        onChange={(e) => handleUpdateParsedField(activePreviewIndex, 'title', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-bold rounded px-2.5 py-1 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="w-44">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Assigned Track:</label>
                      <select
                        value={parsedWorkouts[activePreviewIndex].track_id || selectedTrackId}
                        onChange={(e) => handleUpdateParsedField(activePreviewIndex, 'track_id', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded px-2 py-1 outline-none font-sans"
                      >
                        {tracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Scheduled Date:</label>
                      <input
                        type="date"
                        value={parsedWorkouts[activePreviewIndex].scheduled_date}
                        onChange={(e) => handleUpdateParsedField(activePreviewIndex, 'scheduled_date', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded px-2 py-1 outline-none font-sans"
                      />
                    </div>

                    <div className="w-28">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Scoring:</label>
                      <select
                        value={parsedWorkouts[activePreviewIndex].scoring_type}
                        onChange={(e) => handleUpdateParsedField(activePreviewIndex, 'scoring_type', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded px-2 py-1 outline-none font-sans"
                      >
                        <option value="time">Time</option>
                        <option value="rounds_reps">Rounds & Reps</option>
                        <option value="weight">Weight / Lbs</option>
                        <option value="reps">Reps</option>
                        <option value="completion">Completion</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveParsedItem(activePreviewIndex)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded transition mt-4"
                      title="Remove this workout session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Applied Track-Specific Rules Badge */}
                  {parsedWorkouts[activePreviewIndex].applied_rules &&
                    parsedWorkouts[activePreviewIndex].applied_rules!.length > 0 && (
                      <div className="bg-purple-950/40 border border-purple-800/40 rounded-lg p-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                          <Wand2 className="h-3 w-3 text-purple-400" /> Applied Rules for Track ({parsedWorkouts[activePreviewIndex].track_name}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedWorkouts[activePreviewIndex].applied_rules!.map((ruleText, rIdx) => (
                            <span
                              key={rIdx}
                              className="text-[10px] font-mono bg-purple-900/60 text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded-full"
                            >
                              ✓ {ruleText}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Athlete Notes Field */}
                  <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      <span>Athlete Notes (Warm-up, Parts A & B, Metcon):</span>
                    </label>
                    <textarea
                      value={parsedWorkouts[activePreviewIndex].athlete_notes}
                      onChange={(e) => handleUpdateParsedField(activePreviewIndex, 'athlete_notes', e.target.value)}
                      rows={6}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs p-2.5 rounded focus:border-indigo-500 outline-none font-mono leading-relaxed resize-none"
                    />
                  </div>

                  {/* Coaches Notes Field */}
                  <div>
                    <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Coaches Notes & Timeline (Coaches Only):</span>
                    </label>
                    <textarea
                      value={parsedWorkouts[activePreviewIndex].coaches_notes}
                      onChange={(e) => handleUpdateParsedField(activePreviewIndex, 'coaches_notes', e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 text-amber-200/90 text-xs p-2.5 rounded focus:border-amber-500 outline-none font-mono leading-relaxed resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase rounded transition"
          >
            Cancel
          </button>

          {!parsedWorkouts ? (
            <button
              type="button"
              onClick={handleParseWithAI}
              disabled={isParsing || !rawText.trim()}
              className="py-2 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Parsing Doc with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Parse with AI</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveToCalendar}
              disabled={isSavingWorkouts}
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition flex items-center space-x-2 shadow-lg shadow-emerald-600/30"
            >
              {isSavingWorkouts ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Saving to Calendar...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Confirm & Save to Calendar ({parsedWorkouts.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
