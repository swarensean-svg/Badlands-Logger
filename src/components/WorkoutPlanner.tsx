import React, { useState, useEffect } from 'react';
import { Track, Movement, Workout, ScoringType, WorkoutStatus, BenchmarkCategory } from '../types';
import { Calendar, Dumbbell, Plus, Trash2, Check, X, FileText, Lock, Award } from 'lucide-react';

interface WorkoutPlannerProps {
  tracks: Track[];
  movements: Movement[];
  editingWorkout?: Workout | null;
  initialDate?: string;
  initialTrackId?: string;
  onCreateWorkout: (
    workout: Omit<Workout, 'id' | 'created_at' | 'updated_at'>,
    selectedMovements: { movement_id: string; rx_male?: number; rx_female?: number; reps?: number }[]
  ) => void;
  onUpdateWorkout?: (
    workoutId: string,
    updates: Partial<Workout>,
    selectedMovements: { movement_id: string; rx_male?: number; rx_female?: number; reps?: number }[]
  ) => void;
  onClose: () => void;
}

export const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({
  tracks,
  movements,
  editingWorkout,
  initialDate,
  initialTrackId,
  onCreateWorkout,
  onUpdateWorkout,
  onClose,
}) => {
  const [trackId, setTrackId] = useState(editingWorkout?.track_id || initialTrackId || tracks[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(
    editingWorkout?.scheduled_date || initialDate || new Date().toISOString().split('T')[0]
  );
  const [title, setTitle] = useState(editingWorkout?.title || '');
  const [description, setDescription] = useState(editingWorkout?.description || '');
  const [athleteNotes, setAthleteNotes] = useState(editingWorkout?.athlete_notes || '');
  const [coachesNotes, setCoachesNotes] = useState(editingWorkout?.coaches_notes || '');
  const [scoringType, setScoringType] = useState<ScoringType>(editingWorkout?.scoring_type || 'time');
  const [status, setStatus] = useState<WorkoutStatus>(editingWorkout?.status || 'published');
  const [isBenchmark, setIsBenchmark] = useState<boolean>(editingWorkout?.is_benchmark || false);
  const [benchmarkCategory, setBenchmarkCategory] = useState<BenchmarkCategory>(
    editingWorkout?.benchmark_category || 'girl_wod'
  );

  // Movements added to workout
  const [selectedMovements, setSelectedMovements] = useState<
    { movement_id: string; rx_male?: number; rx_female?: number; reps?: number }[]
  >([
    { movement_id: movements[0]?.id || '', rx_male: 315, rx_female: 205, reps: 5 },
    { movement_id: movements[2]?.id || '', reps: 45 },
  ]);

  useEffect(() => {
    if (editingWorkout) {
      setTrackId(editingWorkout.track_id);
      setScheduledDate(editingWorkout.scheduled_date);
      setTitle(editingWorkout.title);
      setDescription(editingWorkout.description);
      setAthleteNotes(editingWorkout.athlete_notes);
      setCoachesNotes(editingWorkout.coaches_notes);
      setScoringType(editingWorkout.scoring_type);
      setStatus(editingWorkout.status);
      setIsBenchmark(!!editingWorkout.is_benchmark);
      if (editingWorkout.benchmark_category) {
        setBenchmarkCategory(editingWorkout.benchmark_category);
      }
    }
  }, [editingWorkout]);

  const addMovementRow = () => {
    if (movements.length > 0) {
      setSelectedMovements([
        ...selectedMovements,
        { movement_id: movements[0].id, rx_male: 95, rx_female: 65, reps: 15 },
      ]);
    }
  };

  const removeMovementRow = (index: number) => {
    setSelectedMovements(selectedMovements.filter((_, i) => i !== index));
  };

  const updateMovementRow = (index: number, field: string, value: any) => {
    const updated = [...selectedMovements];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMovements(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trackId) return;

    const payload = {
      track_id: trackId,
      scheduled_date: scheduledDate,
      title,
      description,
      athlete_notes: athleteNotes,
      coaches_notes: coachesNotes,
      scoring_type: scoringType,
      status,
      is_benchmark: isBenchmark,
      benchmark_category: isBenchmark ? benchmarkCategory : undefined,
      created_by: editingWorkout?.created_by || 'usr-2', // Coach Marcus
    };

    if (editingWorkout && onUpdateWorkout) {
      onUpdateWorkout(editingWorkout.id, payload, selectedMovements);
    } else {
      onCreateWorkout(payload, selectedMovements);
    }

    onClose();
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-5 max-w-3xl mx-auto font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase italic">
              {editingWorkout ? 'Edit Workout Programming' : 'Coach & Admin Workout Programmer'}
            </h2>
            <p className="text-[11px] text-zinc-400 font-sans">
              Schedule programming, assign movement loads, promote benchmarks, and author secret Coach Notes.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Track & Date Header Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Workout Track</label>
            <select
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_hidden ? '(Hidden Track)' : ''} {t.is_planning ? '(Planning)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Scheduled Date</label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Result Type / Scoring</label>
            <select
              value={scoringType}
              onChange={(e) => setScoringType(e.target.value as ScoringType)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="time">Time (For Time - Seconds/MM:SS)</option>
              <option value="weight">Lbs / Max Load (Weight)</option>
              <option value="reps">Reps (Total Repetition Count)</option>
              <option value="rounds_reps">Rounds & Reps (AMRAP Score)</option>
              <option value="completion">Checkbox (Completion Pass/Fail)</option>
              <option value="other">Other Score Type</option>
            </select>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div>
            <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Workout Title</label>
            <input
              type="text"
              required
              placeholder='e.g. Heavy Back Squat + "Firestorm" Benchmark'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 font-bold text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-bold mb-1 uppercase text-[10px]">Workout Movements & Scheme</label>
            <textarea
              rows={3}
              placeholder="Detail the work: e.g. Part A: 5-5-3-3-1 RM Back Squat. Part B: 3 Rounds for time..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Promote to Gym Benchmark Card */}
        <div className="bg-zinc-950 p-3 rounded border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Award className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-amber-300 uppercase text-[11px]">
                <input
                  type="checkbox"
                  checked={isBenchmark}
                  onChange={(e) => setIsBenchmark(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-0"
                />
                <span>Promote to Gym Benchmark</span>
              </label>
              <p className="text-[10px] text-zinc-400 font-sans">
                Marks workout as a official benchmark WOD to show on athlete PR profiles.
              </p>
            </div>
          </div>

          {isBenchmark && (
            <div className="w-full sm:w-auto">
              <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Benchmark Category</label>
              <select
                value={benchmarkCategory}
                onChange={(e) => setBenchmarkCategory(e.target.value as BenchmarkCategory)}
                className="bg-zinc-900 border border-amber-500/40 text-amber-300 rounded px-2.5 py-1 text-xs font-mono"
              >
                <option value="girl_wod">Girl WOD</option>
                <option value="hero">Hero WOD</option>
                <option value="barbell_max">Barbell 1RM</option>
                <option value="gymnastics">Gymnastics Test</option>
                <option value="custom_gym">Custom Gym Benchmark</option>
              </select>
            </div>
          )}
        </div>

        {/* Movement Selector Engine */}
        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-indigo-400 flex items-center space-x-1.5 uppercase">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Target Movements (Triggers History Lookup)</span>
            </h3>
            <button
              type="button"
              onClick={addMovementRow}
              className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold uppercase bg-zinc-100 hover:bg-white text-black rounded transition"
            >
              <Plus className="h-3 w-3" />
              <span>Add Movement</span>
            </button>
          </div>

          <div className="space-y-2">
            {selectedMovements.map((sm, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 bg-zinc-900 p-2 rounded border border-zinc-800">
                <span className="font-mono text-zinc-500 font-bold text-[10px]">#{index + 1}</span>
                <select
                  value={sm.movement_id}
                  onChange={(e) => updateMovementRow(index, 'movement_id', e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs font-mono min-w-[150px]"
                >
                  {movements.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-1">
                  <span className="text-zinc-500 text-[10px]">Rx Male:</span>
                  <input
                    type="number"
                    placeholder="lbs"
                    value={sm.rx_male || ''}
                    onChange={(e) => updateMovementRow(index, 'rx_male', Number(e.target.value))}
                    className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-white text-xs font-mono"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-zinc-500 text-[10px]">Rx Female:</span>
                  <input
                    type="number"
                    placeholder="lbs"
                    value={sm.rx_female || ''}
                    onChange={(e) => updateMovementRow(index, 'rx_female', Number(e.target.value))}
                    className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-white text-xs font-mono"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-zinc-500 text-[10px]">Reps:</span>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={sm.reps || ''}
                    onChange={(e) => updateMovementRow(index, 'reps', Number(e.target.value))}
                    className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-white text-xs font-mono"
                  />
                </div>

                {selectedMovements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMovementRow(index)}
                    className="p-1 text-rose-400 hover:text-rose-300 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Athlete Notes vs Coaches Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-1.5">
            <label className="block text-zinc-200 font-bold text-[10px] uppercase flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Athlete Notes (Public to Members)</span>
            </label>
            <textarea
              rows={3}
              placeholder="General warm-up cues, pacing strategy, stimulus intent for all members..."
              value={athleteNotes}
              onChange={(e) => setAthleteNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-zinc-950 p-3 rounded border border-amber-500/30 space-y-1.5">
            <label className="block text-amber-300 font-bold text-[10px] uppercase flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>Coaches Notes (Coaches & Admins Only)</span>
            </label>
            <textarea
              rows={3}
              placeholder="🔒 Secret cues: Cap time at 12 mins, watch Alex on squat depth, scaling substitutions..."
              value={coachesNotes}
              onChange={(e) => setCoachesNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-amber-500/40 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Visibility Toggle & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-zinc-800 pt-3 gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-zinc-400 text-[10px] uppercase font-bold">Visibility Mode:</span>
            <div className="flex items-center rounded border border-zinc-800 p-0.5 bg-zinc-950">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                  status === 'draft'
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Coach Viewing (Draft)
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                  status === 'published'
                    ? 'bg-emerald-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Athlete Viewing (Live)
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold uppercase bg-emerald-500 hover:bg-emerald-400 text-black rounded shadow transition flex items-center space-x-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{editingWorkout ? 'Update Workout' : 'Schedule Workout'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
