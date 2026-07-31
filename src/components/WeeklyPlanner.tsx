import React, { useState } from 'react';
import { Track, Workout, ViewRole, Movement, GymBenchmark } from '../types';
import { moveWorkoutDate, cloneWorkoutAction, deleteWorkoutAction } from '../actions/workouts';
import { WorkoutPlanner } from './WorkoutPlanner';
import { BenchmarkManager } from './BenchmarkManager';
import { AISmartImporter } from './AISmartImporter';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Edit3,
  Trash2,
  Lock,
  Eye,
  Award,
  Layers,
  Sparkles,
  GripVertical,
  Check,
  X,
  Filter,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';

interface WeeklyPlannerProps {
  tracks: Track[];
  workouts: Workout[];
  movements: Movement[];
  benchmarks: GymBenchmark[];
  activeRole: ViewRole;
  onUpdateWorkouts: (updatedWorkouts: Workout[]) => void;
  onAddBenchmark: (newBm: GymBenchmark) => void;
  onCreateWorkout: (
    workout: Omit<Workout, 'id' | 'created_at' | 'updated_at'>,
    selectedMovements: { movement_id: string; rx_male?: number; rx_female?: number; reps?: number }[]
  ) => void;
  onUpdateWorkout: (
    workoutId: string,
    updates: Partial<Workout>,
    selectedMovements: { movement_id: string; rx_male?: number; rx_female?: number; reps?: number }[]
  ) => void;
  onDeleteWorkout: (workoutId: string) => void;
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  tracks,
  workouts,
  movements,
  benchmarks,
  activeRole,
  onUpdateWorkouts,
  onAddBenchmark,
  onCreateWorkout,
  onUpdateWorkout,
  onDeleteWorkout,
}) => {
  // Navigation State
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all');
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<string>('2026-07-27'); // Monday of current week
  const [draggedWorkoutId, setDraggedWorkoutId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIImportModal, setShowAIImportModal] = useState(false);
  const [createDate, setCreateDate] = useState<string>('2026-07-29');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [cloningWorkout, setCloningWorkout] = useState<Workout | null>(null);
  const [cloneTargetTrack, setCloneTargetTrack] = useState<string>(tracks[0]?.id || 'trk-1');
  const [cloneTargetDate, setCloneTargetDate] = useState<string>('2026-07-30');
  const [showBenchmarkManager, setShowBenchmarkManager] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Helper to calculate 7 days array [Mon, Tue, Wed, Thu, Fri, Sat, Sun] from start date
  const getDaysOfWeek = (startDateStr: string) => {
    const days = [];
    const parts = (startDateStr || '2026-07-27').split('-');
    const startDate = new Date(Number(parts[0] || 2026), Number(parts[1] || 7) - 1, Number(parts[2] || 27));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[d.getDay()];

      days.push({
        dateStr,
        dayName,
        dayNum: d.getDate(),
        monthName: d.toLocaleString('en-US', { month: 'short' }),
        isToday: dateStr === '2026-07-29',
      });
    }
    return days;
  };

  const weekDays = getDaysOfWeek(currentWeekStartDate);

  // Week Shift Handlers
  const handlePrevWeek = () => {
    const parts = (currentWeekStartDate || '2026-07-27').split('-');
    const d = new Date(Number(parts[0] || 2026), Number(parts[1] || 7) - 1, Number(parts[2] || 27));
    d.setDate(d.getDate() - 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCurrentWeekStartDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextWeek = () => {
    const parts = (currentWeekStartDate || '2026-07-27').split('-');
    const d = new Date(Number(parts[0] || 2026), Number(parts[1] || 7) - 1, Number(parts[2] || 27));
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCurrentWeekStartDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleResetCurrentWeek = () => {
    setCurrentWeekStartDate('2026-07-27');
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, workoutId: string) => {
    e.dataTransfer.setData('text/plain', workoutId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedWorkoutId(workoutId);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const workoutId = e.dataTransfer.getData('text/plain') || draggedWorkoutId;
    if (!workoutId) return;

    // Optimistically update local workouts state
    const updated = workouts.map((w) =>
      w.id === workoutId ? { ...w, scheduled_date: targetDateStr, updated_at: new Date().toISOString() } : w
    );
    onUpdateWorkouts(updated);

    // Invoke Server Action
    const result = await moveWorkoutDate(workoutId, targetDateStr);
    if (result.success) {
      setFeedback(`Moved workout to ${targetDateStr}`);
    } else {
      setFeedback(`Move failed: ${result.error}`);
    }
    setDraggedWorkoutId(null);
  };

  // Clone Handler
  const handleConfirmClone = async () => {
    if (!cloningWorkout) return;
    const result = await cloneWorkoutAction(cloningWorkout, cloneTargetTrack, cloneTargetDate);

    if (result.success && result.clonedWorkout) {
      onUpdateWorkouts([result.clonedWorkout, ...workouts]);
      setFeedback(`Cloned "${cloningWorkout.title}" to ${cloneTargetDate}`);
      setCloningWorkout(null);
    } else {
      setFeedback(`Clone failed: ${result.error}`);
    }
  };

  // Delete Handler
  const handleDeleteWorkout = async (wkt: Workout) => {
    if (!window.confirm(`Are you sure you want to delete "${wkt.title}"?`)) return;

    onDeleteWorkout(wkt.id);
    const result = await deleteWorkoutAction(wkt.id);
    if (result.success) {
      setFeedback(`Deleted "${wkt.title}"`);
    }
  };

  // Schedule Benchmark as Workout
  const handleScheduleBenchmark = (bm: GymBenchmark, targetTrackId: string, targetDate: string) => {
    onCreateWorkout(
      {
        track_id: targetTrackId,
        scheduled_date: targetDate,
        title: `Benchmark: ${bm.name}`,
        description: bm.description,
        athlete_notes: `Official Gym Benchmark (${(bm?.category || '').replace('_', ' ')}). Give it 100% effort!`,
        coaches_notes: `🔒 COACH NOTES: Validate full range of motion. Male Rx: ${bm.rx_male || 'Standard'}, Female Rx: ${bm.rx_female || 'Standard'}.`,
        scoring_type: bm.scoring_type,
        status: 'published',
        is_benchmark: true,
        benchmark_category: bm.category,
        created_by: 'usr-2',
      },
      []
    );
    setShowBenchmarkManager(false);
    setFeedback(`Programmed benchmark "${bm.name}" on ${targetDate}`);
  };

  // Filter workouts by track and role permissions
  const filteredWorkouts = workouts.filter((w) => {
    const track = tracks.find((t) => t.id === w.track_id);

    // Role check for hidden tracks
    if (activeRole === 'member') {
      if (track?.is_hidden || track?.is_planning) return false;
      if (w.status === 'draft') return false;
    }

    // Selected track filter
    if (selectedTrackFilter !== 'all' && w.track_id !== selectedTrackFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Controller Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white uppercase italic tracking-wide">
                Weekly Track Calendar & Programming
              </h1>
              <p className="text-[11px] text-zinc-400 font-sans">
                Drag and drop workouts across days, clone programming, and manage tracks.
              </p>
            </div>
          </div>

          {(activeRole === 'coach' || activeRole === 'admin') && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAIImportModal(true)}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded font-bold uppercase text-[10px] flex items-center space-x-1.5 transition shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Import Daily/Weekly Doc</span>
              </button>

              <button
                onClick={() => setShowBenchmarkManager(true)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold uppercase text-[10px] flex items-center space-x-1.5 transition"
              >
                <Award className="h-3.5 w-3.5" />
                <span>Gym Benchmarks</span>
              </button>

              <button
                onClick={() => {
                  setCreateDate('2026-07-29');
                  setShowCreateModal(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold uppercase text-[10px] flex items-center space-x-1.5 transition shadow"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Workout</span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-2 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded text-[11px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Track Filter Tabs */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 gap-2 overflow-x-auto">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1 flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Track:
            </span>

            <button
              onClick={() => setSelectedTrackFilter('all')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition ${
                selectedTrackFilter === 'all'
                  ? 'bg-zinc-100 text-black border-white'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              All Tracks
            </button>

            {tracks.map((trk) => {
              const isSelected = selectedTrackFilter === trk.id;
              return (
                <button
                  key={trk.id}
                  onClick={() => setSelectedTrackFilter(trk.id)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-zinc-800 text-white border-zinc-600'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: trk.color }} />
                  <span>{trk.name}</span>
                  {trk.is_planning && (
                    <span className="px-1 py-0.2 bg-purple-500/20 text-purple-300 rounded text-[8px] border border-purple-500/30">
                      PLAN
                    </span>
                  )}
                  {trk.is_hidden && (
                    <span className="px-1 py-0.2 bg-zinc-800 text-zinc-400 rounded text-[8px]">
                      HIDDEN
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Week Controls */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded transition"
              title="Previous Week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={handleResetCurrentWeek}
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold uppercase transition"
            >
              Today
            </button>

            <button
              onClick={handleNextWeek}
              className="p-1.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded transition"
              title="Next Week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayWorkouts = filteredWorkouts.filter((w) => w.scheduled_date === day.dateStr);
          const isTargetOver = dragOverDate === day.dateStr;

          return (
            <div
              key={day.dateStr}
              onDragOver={(e) => handleDragOver(e, day.dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.dateStr)}
              className={`bg-zinc-950 border rounded-lg p-2.5 flex flex-col justify-between min-h-[380px] transition-all ${
                isTargetOver
                  ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/30'
                  : day.isToday
                  ? 'border-indigo-500/50 bg-zinc-900/60'
                  : 'border-zinc-800/80'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold uppercase text-[11px] text-zinc-400">{day.dayName}</span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 bg-indigo-500 text-white text-[8px] font-bold uppercase rounded">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {day.monthName} {day.dayNum}
                  </div>
                </div>

                {(activeRole === 'coach' || activeRole === 'admin') && (
                  <button
                    onClick={() => {
                      setCreateDate(day.dateStr);
                      setShowCreateModal(true);
                    }}
                    className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 transition"
                    title={`Add workout to ${day.dateStr}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Workouts List for Day */}
              <div className="space-y-2.5 flex-1">
                {dayWorkouts.length === 0 ? (
                  <div className="h-32 border border-dashed border-zinc-800/60 rounded flex flex-col items-center justify-center p-2 text-center text-zinc-600">
                    <p className="text-[10px] italic">Rest Day or Empty</p>
                    {(activeRole === 'coach' || activeRole === 'admin') && (
                      <p className="text-[9px] text-zinc-700 mt-1">Drag workout here</p>
                    )}
                  </div>
                ) : (
                  dayWorkouts.map((wkt) => {
                    const track = tracks.find((t) => t.id === wkt.track_id);

                    return (
                      <div
                        key={wkt.id}
                        draggable={activeRole === 'coach' || activeRole === 'admin'}
                        onDragStart={(e) => handleDragStart(e, wkt.id)}
                        className={`bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-md p-2.5 space-y-2 transition shadow-sm group relative ${
                          activeRole === 'coach' || activeRole === 'admin' ? 'cursor-grab active:cursor-grabbing' : ''
                        }`}
                      >
                        {/* Track Dot & Title */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center space-x-1.5 text-[9px] font-bold uppercase text-zinc-400">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: track?.color || '#3B82F6' }}
                              />
                              <span className="truncate max-w-[90px]">{track?.name || 'Track'}</span>
                            </span>

                            <div className="flex items-center space-x-1">
                              {wkt.is_benchmark && (
                                <span
                                  className="p-0.5 bg-amber-500/20 text-amber-300 rounded"
                                  title="Official Gym Benchmark"
                                >
                                  <Award className="h-3 w-3" />
                                </span>
                              )}
                              {wkt.status === 'draft' ? (
                                <span
                                  className="px-1 py-0.2 bg-amber-500/20 text-amber-300 text-[8px] font-bold rounded uppercase border border-amber-500/30 flex items-center space-x-0.5"
                                  title="Coach Viewing / Draft Mode"
                                >
                                  <Lock className="h-2.5 w-2.5" />
                                  <span>DRAFT</span>
                                </span>
                              ) : (
                                <span
                                  className="px-1 py-0.2 bg-emerald-500/20 text-emerald-300 text-[8px] font-bold rounded uppercase border border-emerald-500/30 flex items-center space-x-0.5"
                                  title="Athlete Viewing / Live Mode"
                                >
                                  <Eye className="h-2.5 w-2.5" />
                                  <span>LIVE</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                            {wkt.title}
                          </h3>
                        </div>

                        {/* Description Preview */}
                        <p className="text-[10px] text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                          {wkt.description}
                        </p>

                        {/* Card Action Controls (Edit, Clone, Delete) */}
                        <div className="flex items-center justify-between border-t border-zinc-800/80 pt-1.5 text-[10px]">
                          <span className="text-zinc-500 text-[9px] font-mono uppercase">
                            {wkt.scoring_type}
                          </span>

                          {(activeRole === 'coach' || activeRole === 'admin') && (
                            <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingWorkout(wkt)}
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-300 rounded transition"
                                title="Edit Workout"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setCloningWorkout(wkt);
                                  setCloneTargetTrack(wkt.track_id);
                                  setCloneTargetDate(wkt.scheduled_date);
                                }}
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 rounded transition"
                                title="Clone Workout to Target Date/Track"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteWorkout(wkt)}
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded transition"
                                title="Delete Workout"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Day Bottom Count */}
              <div className="border-t border-zinc-800/60 pt-1.5 mt-2 text-[9px] text-zinc-500 flex justify-between items-center font-mono">
                <span>{dayWorkouts.length} WOD{dayWorkouts.length === 1 ? '' : 's'}</span>
                <span className="text-zinc-600 italic">Drag to move</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clone Workout Modal Overlay */}
      {cloningWorkout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-4 space-y-4 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center space-x-2 text-amber-400">
                <Copy className="h-4 w-4" />
                <h3 className="font-bold uppercase tracking-wider text-xs">Clone Workout</h3>
              </div>
              <button
                onClick={() => setCloningWorkout(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Source Workout:</p>
              <p className="font-bold text-white text-xs">{cloningWorkout.title}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Target Track
                </label>
                <select
                  value={cloneTargetTrack}
                  onChange={(e) => setCloneTargetTrack(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={cloneTargetDate}
                  onChange={(e) => setCloneTargetDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 border-t border-zinc-800 pt-3">
              <button
                onClick={() => setCloningWorkout(null)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClone}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded"
              >
                Clone Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Workout Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <WorkoutPlanner
            tracks={tracks}
            movements={movements}
            initialDate={createDate}
            onCreateWorkout={onCreateWorkout}
            onClose={() => setShowCreateModal(false)}
          />
        </div>
      )}

      {/* Edit Workout Modal */}
      {editingWorkout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <WorkoutPlanner
            tracks={tracks}
            movements={movements}
            editingWorkout={editingWorkout}
            onCreateWorkout={onCreateWorkout}
            onUpdateWorkout={onUpdateWorkout}
            onClose={() => setEditingWorkout(null)}
          />
        </div>
      )}

      {/* Benchmark Manager Modal */}
      {showBenchmarkManager && (
        <BenchmarkManager
          benchmarks={benchmarks}
          tracks={tracks}
          onAddBenchmark={onAddBenchmark}
          onScheduleAsWorkout={handleScheduleBenchmark}
          onClose={() => setShowBenchmarkManager(false)}
        />
      )}

      {/* AI Smart Importer Modal */}
      <AISmartImporter
        isOpen={showAIImportModal}
        onClose={() => setShowAIImportModal(false)}
        tracks={tracks}
        baseStartDate={currentWeekStartDate}
        onImportSuccess={(newWorkouts) => {
          onUpdateWorkouts([...newWorkouts, ...workouts]);
          setFeedback(`Successfully imported and scheduled ${newWorkouts.length} workout session(s) with AI!`);
          setShowAIImportModal(false);
        }}
      />
    </div>
  );
};
