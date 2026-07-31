import React, { useState } from 'react';
import {
  Track,
  Workout,
  WorkoutMovement,
  Movement,
  WorkoutResult,
  WorkoutResultMovement,
  Profile,
  ViewRole,
  WorkoutViewingMode,
  MovementHistoryEntry,
  RxType,
  FistBump,
} from '../types';
import { queryUserMovementHistorySimulated } from '../data/mockDatabase';
import {
  Calendar,
  Eye,
  Lock,
  History,
  Trophy,
  Check,
  Plus,
  Flame,
  User,
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Bell,
} from 'lucide-react';

interface WorkoutViewProps {
  tracks: Track[];
  selectedTrackId: string;
  setSelectedTrackId: (id: string) => void;
  workouts: Workout[];
  workoutMovements: WorkoutMovement[];
  movements: Movement[];
  workoutResults: WorkoutResult[];
  workoutResultMovements: WorkoutResultMovement[];
  profiles: Profile[];
  fistBumps: FistBump[];
  activeRole: ViewRole;
  onLogResult: (
    workoutId: string,
    scoreDisplay: string,
    scoreNumeric: number,
    rxType: RxType,
    notes: string,
    movementScores: { movement_id: string; weight_lbs?: number; reps?: number }[]
  ) => void;
  onToggleFistBump: (resultId: string) => void;
  onOpenCreateTrack: () => void;
  onOpenCreateWorkout: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  tracks,
  selectedTrackId,
  setSelectedTrackId,
  workouts,
  workoutMovements,
  movements,
  workoutResults,
  workoutResultMovements,
  profiles,
  fistBumps,
  activeRole,
  onLogResult,
  onToggleFistBump,
  onOpenCreateTrack,
  onOpenCreateWorkout,
}) => {
  // Current active profile based on role
  const activeProfile =
    profiles.find((p) => p.role === activeRole) || profiles.find((p) => p.id === 'usr-1')!;

  // Viewing toggle: Coach Viewing vs Athlete Viewing
  const [viewingMode, setViewingMode] = useState<WorkoutViewingMode>(
    activeRole === 'member' ? 'athlete' : 'coach'
  );

  // Date selection filter (defaults to today 2026-07-29)
  const [selectedDate, setSelectedDate] = useState('2026-07-29');

  const handlePrevDay = () => {
    const parts = (selectedDate || '2026-07-29').split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() - 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextDay = () => {
    const parts = (selectedDate || '2026-07-29').split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() + 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Filter accessible tracks based on role
  const accessibleTracks = tracks.filter((t) => {
    if (activeRole === 'coach' || activeRole === 'admin') return true;
    return !t.is_hidden && !t.is_planning;
  });

  const activeTrack =
    accessibleTracks.find((t) => t.id === selectedTrackId) || accessibleTracks[0];

  // Current Workout for active track & date
  const currentWorkout = workouts.find(
    (w) => w.track_id === activeTrack?.id && w.scheduled_date === selectedDate
  );

  // Movements included in this day's workout
  const currentWmRows = currentWorkout
    ? workoutMovements.filter((wm) => wm.workout_id === currentWorkout.id)
    : [];

  const currentMovementIds = currentWmRows.map((wm) => wm.movement_id);

  // CRITICAL REQUIREMENT: Automatic Query of Member's Movement History
  const movementHistoryLogs: MovementHistoryEntry[] = queryUserMovementHistorySimulated(
    activeProfile.id,
    currentMovementIds,
    workoutResults,
    workoutResultMovements,
    workouts,
    tracks,
    movements
  );

  // Score Logging Form State
  const [showLogModal, setShowLogModal] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState('');
  const [scoreNumeric, setScoreNumeric] = useState<number>(0);
  const [rxType, setRxType] = useState<RxType>('rx');
  const [logNotes, setLogNotes] = useState('');
  const [movementWeights, setMovementWeights] = useState<{ [movId: string]: number }>({});

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkout || !scoreDisplay.trim()) return;

    const movementScores = currentMovementIds.map((movId) => ({
      movement_id: movId,
      weight_lbs: movementWeights[movId] || undefined,
    }));

    onLogResult(currentWorkout.id, scoreDisplay, scoreNumeric || 100, rxType, logNotes, movementScores);

    setShowLogModal(false);
    setScoreDisplay('');
    setLogNotes('');
  };

  // Results logged for this specific workout - filtered by Privacy Settings (is_public)
  const currentWorkoutResults = currentWorkout
    ? workoutResults.filter((r) => {
        if (r.workout_id !== currentWorkout.id) return false;
        const athlete = profiles.find((p) => p.id === r.user_id);
        const isPublic = athlete?.is_public ?? true;
        if (isPublic) return true;
        if (r.user_id === activeProfile.id) return true;
        if (activeRole === 'coach' || activeRole === 'admin') return true;
        return false;
      })
    : [];

  return (
    <div className="space-y-5">
      {/* Track Tabs & Date Header */}
      <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Track Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none font-mono">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold hidden sm:inline mr-1">
            Tracks:
          </label>
          {accessibleTracks.map((t) => {
            const isSelected = t.id === activeTrack?.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTrackId(t.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-zinc-800 text-white border border-zinc-700 font-bold shadow-sm'
                    : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800/80'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span>{t.name}</span>
                {t.is_hidden && (
                  <span className="bg-purple-950/80 text-purple-300 text-[9px] px-1 py-0.2 rounded border border-purple-800 font-mono">
                    HIDDEN
                  </span>
                )}
                <span className="text-[9px] bg-zinc-800 px-1 py-0.2 rounded text-zinc-400 font-mono">
                  LIVE
                </span>
              </button>
            );
          })}

          {(activeRole === 'coach' || activeRole === 'admin') && (
            <button
              onClick={onOpenCreateTrack}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition border border-zinc-700"
              title="Manage Dynamic Tracks"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date Selector & Viewing Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-zinc-950 p-1 rounded border border-zinc-800 font-mono text-xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition active:scale-95"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center px-2 py-0.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400 mr-1.5 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none font-mono cursor-pointer"
              />
            </div>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition active:scale-95"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Visibility Toggle: Coach Viewing vs Athlete Viewing */}
          {(activeRole === 'coach' || activeRole === 'admin') && (
            <div className="flex items-center bg-zinc-950 p-1 rounded border border-zinc-800 font-mono">
              <button
                onClick={() => setViewingMode('athlete')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                  viewingMode === 'athlete'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>ATHLETE VIEW</span>
              </button>
              <button
                onClick={() => setViewingMode('coach')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                  viewingMode === 'coach'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="View Coaches Secret Notes"
              >
                <Lock className="h-3 w-3" />
                <span>COACH VIEW</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workout Display Grid */}
      {currentWorkout ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column (2 spans): Workout Details & Movements */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
              {/* Header Title & Date */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white italic uppercase">
                    {currentWorkout.title} // PHASE 2
                  </h2>
                  <p className="text-zinc-400 text-xs font-mono mt-0.5">
                    {currentWorkout.scheduled_date} — {activeTrack?.name} Track
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                    {currentWorkout.scoring_type}
                  </span>
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="bg-zinc-100 text-black px-3.5 py-1.5 text-xs font-bold uppercase tracking-tight rounded hover:bg-white transition"
                  >
                    Log Result
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="text-zinc-300 text-xs leading-relaxed font-sans bg-zinc-950/50 p-3 rounded border border-zinc-800/80">
                <p className="whitespace-pre-line">{currentWorkout.description}</p>
              </div>

              {/* Movement Prescription Blocks */}
              {currentWmRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono">A</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Prescribed Movement Blocks</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentWmRows.map((wm, index) => {
                      const mov = (movements || []).find((m) => m.id === wm.movement_id);
                      return (
                        <div
                          key={wm.id}
                          className="bg-zinc-950 p-3.5 rounded border border-zinc-800 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">{mov?.name}</span>
                            <span className="text-[9px] font-bold text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-mono">
                              {mov?.category}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center space-x-3 font-mono">
                            {wm.rx_weight_male_lbs && (
                              <span>
                                Rx: <strong className="text-zinc-200">{wm.rx_weight_male_lbs} / {wm.rx_weight_female_lbs} lbs</strong>
                              </span>
                            )}
                            {wm.target_reps && (
                              <span>
                                Target: <strong className="text-zinc-200">{wm.target_reps} reps</strong>
                              </span>
                            )}
                          </div>
                          {wm.notes && <p className="text-[11px] text-zinc-500 italic mt-1">{wm.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes Sections */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                {currentWorkout.athlete_notes && (
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                      Athlete Notes & Intent
                    </p>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {currentWorkout.athlete_notes}
                    </p>
                  </div>
                )}

                {(activeRole === 'coach' || activeRole === 'admin') ? (
                  viewingMode === 'coach' ? (
                    <div className="bg-zinc-950 border border-amber-900/50 p-3 rounded">
                      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1 font-mono">
                        <Lock className="h-3 w-3" /> Coach's Internal Notes
                      </p>
                      <p className="text-xs text-amber-200/80 italic leading-relaxed font-sans">
                        {currentWorkout.coaches_notes || 'Watch for form execution and proper depth. Ensure appropriate scaling.'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-zinc-600" />
                        <span>Coaches notes hidden in Athlete View.</span>
                      </span>
                      <button
                        onClick={() => setViewingMode('coach')}
                        className="text-indigo-400 font-bold hover:underline"
                      >
                        COACH VIEW
                      </button>
                    </div>
                  )
                ) : null}
              </div>
            </div>

            {/* High Density Movement History Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Movement History: {(movements || []).find(m => currentMovementIds.includes(m.id))?.name || 'Today\'s Exercises'}</span>
                </h3>
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-indigo-300 font-mono">
                  LATERAL JOIN QUERY
                </span>
              </div>

              {movementHistoryLogs.length > 0 ? (
                <div className="font-mono text-[11px] overflow-hidden">
                  <div className="grid grid-cols-3 pb-2 text-zinc-500 border-b border-zinc-800 mb-2 font-bold text-[10px] uppercase">
                    <span>DATE</span>
                    <span>RESULT</span>
                    <span>SESSION / VOLUME</span>
                  </div>
                  <div className="space-y-1">
                    {movementHistoryLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 py-1.5 px-2 rounded border-b border-zinc-800/50 hover:bg-zinc-800/40 transition items-center"
                      >
                        <span className="text-zinc-400">{log.workout_date}</span>
                        <span className="text-emerald-400 font-bold">
                          {log.weight_used_lbs ? `${log.weight_used_lbs} lbs` : log.score_display} ({log.rx_type.toUpperCase()})
                        </span>
                        <span className="text-zinc-500 italic truncate">
                          {log.workout_title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-zinc-950 rounded border border-zinc-800/60 font-mono text-xs text-zinc-500">
                  No movement records found for {activeProfile.full_name} on today's exercises.
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 span): Benchmark PRs (JSONB Store) & Leaderboard */}
          <div className="space-y-5">
            {/* Benchmark PRs / JSONB Store Card */}
            <div className="bg-zinc-900 border border-indigo-900/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1 font-mono">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <span>Benchmark PRs (JSONB Store)</span>
                </h3>
                <span className="text-[9px] font-mono text-zinc-500">jsonb_column</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-black/40 p-2 rounded border border-zinc-800">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">"fran"</p>
                  <p className="text-sm font-bold text-indigo-300">
                    {activeProfile.benchmark_prs?.fran?.time_seconds
                      ? `${Math.floor(activeProfile.benchmark_prs.fran.time_seconds / 60)}:${(activeProfile.benchmark_prs.fran.time_seconds % 60).toString().padStart(2, '0')}`
                      : '2:44'}
                  </p>
                </div>
                <div className="bg-black/40 p-2 rounded border border-zinc-800">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">"grace"</p>
                  <p className="text-sm font-bold text-indigo-300">
                    {activeProfile.benchmark_prs?.grace?.time_seconds
                      ? `${Math.floor(activeProfile.benchmark_prs.grace.time_seconds / 60)}:${(activeProfile.benchmark_prs.grace.time_seconds % 60).toString().padStart(2, '0')}`
                      : '1:58'}
                  </p>
                </div>
                <div className="bg-black/40 p-2 rounded border border-zinc-800">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">"back_squat_1rm"</p>
                  <p className="text-sm font-bold text-indigo-300">
                    {activeProfile.barbell_prs?.back_squat?.weight_lbs || 405} lbs
                  </p>
                </div>
                <div className="bg-black/40 p-2 rounded border border-zinc-800">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">"clean_jerk_1rm"</p>
                  <p className="text-sm font-bold text-indigo-300">
                    {activeProfile.barbell_prs?.clean_and_jerk?.weight_lbs || 275} lbs
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Results Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4 text-amber-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                    Daily Results
                  </h3>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
                  <span>{currentWorkoutResults.length} Logged</span>
                </div>
              </div>

              {currentWorkoutResults.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {currentWorkoutResults
                    .sort((a, b) => b.score_numeric - a.score_numeric)
                    .map((res, index) => {
                      const athlete = profiles.find((p) => p.id === res.user_id);
                      const resBumps = fistBumps.filter((fb) => fb.result_id === res.id);
                      const hasBumped = resBumps.some((fb) => fb.giver_user_id === activeProfile.id);
                      const isPrivateResult = athlete && athlete.is_public === false;

                      return (
                        <div
                          key={res.id}
                          className="bg-zinc-950 p-2.5 rounded border border-zinc-800/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-zinc-500 w-4 flex-shrink-0">
                              #{index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white flex items-center space-x-1.5 truncate">
                                <span className="truncate">{athlete?.full_name || 'Athlete'}</span>
                                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded uppercase flex-shrink-0">
                                  {res.rx_type}
                                </span>
                                {isPrivateResult && (
                                  <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded uppercase flex-shrink-0">
                                    Private
                                  </span>
                                )}
                              </div>
                              {res.notes && (
                                <p className="text-[10px] text-zinc-500 italic truncate">{res.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-300">
                              {res.score_display}
                            </span>

                            {/* Fist Bump Action Button */}
                            <button
                              type="button"
                              onClick={() => onToggleFistBump(res.id)}
                              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono transition border ${
                                hasBumped
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border-zinc-800'
                              }`}
                              title={hasBumped ? 'Remove fist bump' : 'Give fist bump 👊'}
                            >
                              <span>👊</span>
                              <span className="text-[11px]">{resBumps.length}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-4 font-mono text-xs text-zinc-500">
                  No public scores logged for today's track yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-10 text-center space-y-3 font-mono">
          <Calendar className="h-10 w-10 text-zinc-600 mx-auto" />
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">No Workout Scheduled for {selectedDate}</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Track <strong className="text-indigo-400">{activeTrack?.name}</strong> has no active session on this date.
          </p>
        </div>
      )}

      {/* Score Logging Modal */}
      {showLogModal && currentWorkout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200 font-mono">
                Log Score: {currentWorkout.title}
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScoreSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[10px] uppercase font-bold mb-1">Score Display</label>
                <input
                  type="text"
                  required
                  placeholder='e.g. "12:45" or "345 lbs" or "5 rounds + 12 reps"'
                  value={scoreDisplay}
                  onChange={(e) => setScoreDisplay(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1">Rx Division</label>
                  <select
                    value={rxType}
                    onChange={(e) => setRxType(e.target.value as RxType)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-xs font-semibold"
                  >
                    <option value="rx">Rx (Standard)</option>
                    <option value="rx_plus">Rx+ (Heavy/Advanced)</option>
                    <option value="scaled">Scaled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1">Numeric Sort</label>
                  <input
                    type="number"
                    placeholder="e.g. 345 or 765"
                    value={scoreNumeric || ''}
                    onChange={(e) => setScoreNumeric(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {currentWmRows.length > 0 && (
                <div className="space-y-2 bg-zinc-950 p-2.5 rounded border border-zinc-800 font-mono">
                  <span className="text-zinc-400 text-[10px] font-bold uppercase block">Movement Loads (lbs):</span>
                  {currentWmRows.map((wm) => {
                    const mov = (movements || []).find((m) => m.id === wm.movement_id);
                    return (
                      <div key={wm.id} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300">{mov?.name}</span>
                        <input
                          type="number"
                          placeholder="lbs"
                          value={movementWeights[wm.movement_id] || ''}
                          onChange={(e) =>
                            setMovementWeights({
                              ...movementWeights,
                              [wm.movement_id]: Number(e.target.value),
                            })
                          }
                          className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-right text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-zinc-400 font-mono text-[10px] uppercase font-bold mb-1">Athlete Notes</label>
                <input
                  type="text"
                  placeholder="Strategy notes..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold uppercase bg-zinc-100 hover:bg-white text-black rounded transition shadow"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
