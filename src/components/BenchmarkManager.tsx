import React, { useState } from 'react';
import { GymBenchmark, BenchmarkCategory, ScoringType, Track, MovementUnit } from '../types';
import { createGymBenchmarkAction } from '../actions/workouts';
import { Award, Plus, X, Check, ShieldCheck, Flame, Dumbbell, Clock, Filter, Calendar } from 'lucide-react';

interface BenchmarkManagerProps {
  benchmarks: GymBenchmark[];
  tracks: Track[];
  onAddBenchmark: (newBm: GymBenchmark) => void;
  onScheduleAsWorkout?: (bm: GymBenchmark, trackId: string, date: string) => void;
  onClose: () => void;
}

export const BenchmarkManager: React.FC<BenchmarkManagerProps> = ({
  benchmarks,
  tracks,
  onAddBenchmark,
  onScheduleAsWorkout,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [scheduleBm, setScheduleBm] = useState<GymBenchmark | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || 'trk-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-29');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BenchmarkCategory>('girl_wod');
  const [description, setDescription] = useState('');
  const [scoringType, setScoringType] = useState<ScoringType>('time');
  const [defaultUnit, setDefaultUnit] = useState<MovementUnit>('seconds');
  const [rxMale, setRxMale] = useState('');
  const [rxFemale, setRxFemale] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setLoading(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await createGymBenchmarkAction({
      name,
      slug,
      category,
      description,
      scoring_type: scoringType,
      default_unit: defaultUnit,
      rx_male: rxMale,
      rx_female: rxFemale,
    });

    if (result.success && result.benchmark) {
      onAddBenchmark(result.benchmark);
      setFeedback(`Successfully created benchmark "${result.benchmark.name}"!`);
      setName('');
      setDescription('');
      setRxMale('');
      setRxFemale('');
      setShowAddForm(false);
    } else {
      setFeedback(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  const handleConfirmSchedule = () => {
    if (!scheduleBm || !selectedTrackId || !selectedDate) return;
    if (onScheduleAsWorkout) {
      onScheduleAsWorkout(scheduleBm, selectedTrackId, selectedDate);
    }
    setFeedback(`Scheduled "${scheduleBm.name}" into track on ${selectedDate}!`);
    setScheduleBm(null);
  };

  const filteredBenchmarks = benchmarks.filter((b) => {
    if (activeCategory === 'all') return true;
    return b.category === activeCategory;
  });

  const getCategoryBadge = (cat: BenchmarkCategory) => {
    switch (cat) {
      case 'girl_wod':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'hero':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'barbell_max':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'gymnastics':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-4xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase italic">Gym Benchmarks Manager</h2>
              <p className="text-[11px] text-zinc-400 font-sans">
                Admin portal to create global benchmark WODs, Hero tests, and 1RM standards.
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

        {/* Action Banner */}
        {feedback && (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 rounded text-[11px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Category Filter & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 p-2.5 rounded border border-zinc-800">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <span className="text-[10px] text-zinc-500 uppercase mr-1">Filter:</span>
            {[
              { id: 'all', label: 'All Benchmarks' },
              { id: 'girl_wod', label: 'Girl WODs' },
              { id: 'hero', label: 'Hero Tests' },
              { id: 'barbell_max', label: 'Barbell 1RMs' },
              { id: 'gymnastics', label: 'Gymnastics' },
              { id: 'custom_gym', label: 'Custom Gym' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border transition ${
                  activeCategory === tab.id
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold uppercase text-[10px] flex items-center space-x-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showAddForm ? 'Cancel New' : 'Add New Benchmark'}</span>
          </button>
        </div>

        {/* Add Benchmark Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-zinc-950 p-4 rounded border border-indigo-500/30 space-y-3">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2 border-b border-zinc-800 pb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Create Global Benchmark Standard</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Benchmark Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amanda, King Kong..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BenchmarkCategory)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="girl_wod">Girl WOD</option>
                  <option value="hero">Hero Test</option>
                  <option value="barbell_max">Barbell 1RM</option>
                  <option value="gymnastics">Gymnastics Test</option>
                  <option value="custom_gym">Custom Gym Benchmark</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Scoring Metric</label>
                <select
                  value={scoringType}
                  onChange={(e) => setScoringType(e.target.value as ScoringType)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="time">For Time (Seconds/MM:SS)</option>
                  <option value="weight">Max Weight (lbs)</option>
                  <option value="reps">Total Reps</option>
                  <option value="rounds_reps">Rounds & Reps (AMRAP)</option>
                  <option value="completion">Completion Checkbox</option>
                  <option value="other">Other Metric</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Description & Scheme</label>
              <textarea
                rows={2}
                required
                placeholder="e.g. 9-7-5 Muscle-ups & Squat Snatches (135/95 lbs)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Rx Male Weight/Standard</label>
                <input
                  type="text"
                  placeholder="e.g. 135 lbs / 20 lb vest"
                  value={rxMale}
                  onChange={(e) => setRxMale(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Rx Female Weight/Standard</label>
                <input
                  type="text"
                  placeholder="e.g. 95 lbs / 14 lb vest"
                  value={rxFemale}
                  onChange={(e) => setRxFemale(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 border-t border-zinc-800 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase rounded shadow"
              >
                {loading ? 'Creating...' : 'Save Benchmark'}
              </button>
            </div>
          </form>
        )}

        {/* Schedule Modal Overlay */}
        {scheduleBm && (
          <div className="p-4 bg-zinc-950 border border-amber-500/40 rounded space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Schedule "{scheduleBm.name}" into Programming Calendar</span>
              </span>
              <button onClick={() => setScheduleBm(null)} className="text-zinc-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Target Track</label>
                <select
                  value={selectedTrackId}
                  onChange={(e) => setSelectedTrackId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold uppercase mb-1">Target Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setScheduleBm(null)} className="px-3 py-1 text-zinc-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase rounded"
              >
                Confirm Programming
              </button>
            </div>
          </div>
        )}

        {/* Benchmarks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredBenchmarks.map((bm) => (
            <div key={bm.id} className="bg-zinc-950 p-3 rounded border border-zinc-800 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    <span>{bm.name}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getCategoryBadge(bm.category)}`}>
                    {bm.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{bm.description}</p>
                {(bm.rx_male || bm.rx_female) && (
                  <div className="text-[10px] text-zinc-500 mt-2 space-x-3 font-mono">
                    {bm.rx_male && <span>Male Rx: <strong className="text-zinc-300">{bm.rx_male}</strong></span>}
                    {bm.rx_female && <span>Female Rx: <strong className="text-zinc-300">{bm.rx_female}</strong></span>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-[10px]">
                <span className="text-zinc-500 uppercase font-bold">Metric: {bm.scoring_type}</span>
                <button
                  onClick={() => setScheduleBm(bm)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold uppercase transition flex items-center space-x-1"
                >
                  <Calendar className="h-3 w-3" />
                  <span>Program WOD</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
