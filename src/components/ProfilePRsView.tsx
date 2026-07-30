import React, { useState } from 'react';
import { Profile, BarbellPRs, BenchmarkPRs, FistBump, WorkoutResult, Workout } from '../types';
import { Dumbbell, Trophy, Edit3, Check, Code, Eye, EyeOff, Globe, Lock, Flame, ShieldCheck, Zap } from 'lucide-react';
import { SugarWODImporter } from './profile/SugarWODImporter';

interface ProfilePRsViewProps {
  activeProfile: Profile;
  profiles: Profile[];
  workouts: Workout[];
  workoutResults: WorkoutResult[];
  fistBumps: FistBump[];
  onUpdatePRs: (
    profileId: string,
    barbellPRs: BarbellPRs,
    benchmarkPRs: BenchmarkPRs
  ) => void;
  onTogglePrivacy: (profileId: string, isPublic: boolean) => void;
  onImportResults?: (importedResults: WorkoutResult[]) => void;
}

export const ProfilePRsView: React.FC<ProfilePRsViewProps> = ({
  activeProfile,
  profiles,
  workouts,
  workoutResults,
  fistBumps,
  onUpdatePRs,
  onTogglePrivacy,
  onImportResults,
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [isEditing, setIsEditing] = useState(false);

  // Privacy state (controlled by profile)
  const isPublic = activeProfile.is_public ?? true;

  // Form states for Barbell PRs
  const [backSquat, setBackSquat] = useState(activeProfile.barbell_prs?.back_squat?.weight_lbs || 345);
  const [deadlift, setDeadlift] = useState(activeProfile.barbell_prs?.deadlift?.weight_lbs || 455);
  const [cleanAndJerk, setCleanAndJerk] = useState(activeProfile.barbell_prs?.clean_and_jerk?.weight_lbs || 265);
  const [snatch, setSnatch] = useState(activeProfile.barbell_prs?.snatch?.weight_lbs || 215);

  // Form states for Benchmark PRs (Fran time in seconds)
  const [franTime, setFranTime] = useState(activeProfile.benchmark_prs?.fran?.time_seconds || 165);
  const [graceTime, setGraceTime] = useState(activeProfile.benchmark_prs?.grace?.time_seconds || 110);
  const [murphTime, setMurphTime] = useState(activeProfile.benchmark_prs?.murph?.time_seconds || 2145);

  // Filter fist bumps received by this profile
  const receivedFistBumps = fistBumps.filter((fb) => fb.receiver_user_id === activeProfile.id);

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];

    const updatedBarbell: BarbellPRs = {
      ...activeProfile.barbell_prs,
      back_squat: { weight_lbs: Number(backSquat), date: today, reps: 1 },
      deadlift: { weight_lbs: Number(deadlift), date: today, reps: 1 },
      clean_and_jerk: { weight_lbs: Number(cleanAndJerk), date: today, reps: 1 },
      snatch: { weight_lbs: Number(snatch), date: today, reps: 1 },
    };

    const updatedBenchmark: BenchmarkPRs = {
      ...activeProfile.benchmark_prs,
      fran: { time_seconds: Number(franTime), date: today, rx_type: 'rx' },
      grace: { time_seconds: Number(graceTime), date: today, rx_type: 'rx' },
      murph: { time_seconds: Number(murphTime), date: today, rx_type: 'rx' },
    };

    onUpdatePRs(activeProfile.id, updatedBarbell, updatedBenchmark);
    setIsEditing(false);
  };

  const formatSeconds = (sec?: number) => {
    if (!sec) return 'N/A';
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}:${remainingSec < 10 ? '0' : ''}${remainingSec}`;
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-5 font-mono">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-base">
            {activeProfile.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white uppercase italic">{activeProfile.full_name}</h2>
              <span className="text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                {activeProfile.role}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border flex items-center space-x-1 ${
                  isPublic
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {isPublic ? <Globe className="h-3 w-3 mr-0.5 inline" /> : <Lock className="h-3 w-3 mr-0.5 inline" />}
                <span>{isPublic ? 'Public Results' : 'Private Results'}</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">{activeProfile.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setViewMode(viewMode === 'visual' ? 'json' : 'visual')}
            className="flex items-center space-x-1.5 px-3 py-1.5 font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
          >
            <Code className="h-3.5 w-3.5 text-indigo-400" />
            <span>{viewMode === 'visual' ? 'JSONB Store' : 'Visual Grid'}</span>
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 font-bold uppercase bg-zinc-100 hover:bg-white text-black rounded transition"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Records</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 font-bold uppercase bg-emerald-500 hover:bg-emerald-400 text-black rounded transition"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>

      {/* Privacy Toggle Section */}
      <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase text-zinc-200">Daily Results Privacy Settings</h3>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans max-w-xl">
            Control whether your logged workout scores and PRs appear on the community <strong>Daily Results</strong> board.
            {isPublic ? (
              <span className="text-emerald-400 ml-1">Currently PUBLIC (Visible on Daily Results).</span>
            ) : (
              <span className="text-amber-400 ml-1">Currently PRIVATE (Only visible to you and coaches).</span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-zinc-900 p-2 rounded-md border border-zinc-800">
          <span className={`text-xs font-bold ${!isPublic ? 'text-amber-400' : 'text-zinc-500'}`}>
            Private
          </span>
          <button
            type="button"
            onClick={() => onTogglePrivacy(activeProfile.id, !isPublic)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPublic ? 'bg-indigo-600' : 'bg-zinc-700'
            }`}
            role="switch"
            aria-checked={isPublic}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${isPublic ? 'text-emerald-400' : 'text-zinc-500'}`}>
            Public
          </span>
        </div>
      </div>

      {/* SugarWOD CSV History Importer Component */}
      <SugarWODImporter
        userId={activeProfile.id}
        onImportSuccess={(newResults) => {
          if (onImportResults) {
            onImportResults(newResults);
          }
        }}
      />

      {viewMode === 'json' ? (
        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">PostgreSQL JSONB Representation:</span>
          </div>
          <pre className="text-indigo-300 text-xs overflow-x-auto leading-relaxed">
            <code>{JSON.stringify({ barbell_prs: activeProfile.barbell_prs, benchmark_prs: activeProfile.benchmark_prs }, null, 2)}</code>
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono">
          {/* Barbell PRs Card */}
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 border-b border-zinc-800 pb-2">
              <Dumbbell className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Barbell Maximums (1RM)</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-300 font-bold">Back Squat</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={backSquat}
                    onChange={(e) => setBackSquat(Number(e.target.value))}
                    className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right text-xs"
                  />
                ) : (
                  <span className="font-bold text-amber-400 text-xs font-mono">
                    {activeProfile.barbell_prs?.back_squat?.weight_lbs || 0} lbs
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-300 font-bold">Deadlift</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={deadlift}
                    onChange={(e) => setDeadlift(Number(e.target.value))}
                    className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right text-xs"
                  />
                ) : (
                  <span className="font-bold text-amber-400 text-xs font-mono">
                    {activeProfile.barbell_prs?.deadlift?.weight_lbs || 0} lbs
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-300 font-bold">Clean & Jerk</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={cleanAndJerk}
                    onChange={(e) => setCleanAndJerk(Number(e.target.value))}
                    className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right text-xs"
                  />
                ) : (
                  <span className="font-bold text-amber-400 text-xs font-mono">
                    {activeProfile.barbell_prs?.clean_and_jerk?.weight_lbs || 0} lbs
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded border border-zinc-800">
                <span className="text-zinc-300 font-bold">Snatch</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={snatch}
                    onChange={(e) => setSnatch(Number(e.target.value))}
                    className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right text-xs"
                  />
                ) : (
                  <span className="font-bold text-amber-400 text-xs font-mono">
                    {activeProfile.barbell_prs?.snatch?.weight_lbs || 0} lbs
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Benchmark WOD PRs Card */}
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 border-b border-zinc-800 pb-2">
              <Trophy className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Benchmark WOD Records</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded border border-zinc-800">
                <div>
                  <span className="font-bold text-zinc-200 block">Fran</span>
                  <span className="text-[9px] text-zinc-500 font-mono">21-15-9 Thrusters & Pull-ups</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={franTime}
                      onChange={(e) => setFranTime(Number(e.target.value))}
                      className="w-16 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right text-xs"
                    />
                    <span className="text-zinc-500 text-[10px]">sec</span>
                  </div>
                ) : (
                  <span className="font-bold text-indigo-300 text-xs font-mono">
                    {formatSeconds(activeProfile.benchmark_prs?.fran?.time_seconds)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded border border-zinc-800">
                <div>
                  <span className="font-bold text-zinc-200 block">Grace</span>
                  <span className="text-[9px] text-zinc-500 font-mono">30 Clean & Jerks (135 lbs)</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={graceTime}
                      onChange={(e) => setGraceTime(Number(e.target.value))}
                      className="w-16 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right text-xs"
                    />
                    <span className="text-zinc-500 text-[10px]">sec</span>
                  </div>
                ) : (
                  <span className="font-bold text-indigo-300 text-xs font-mono">
                    {formatSeconds(activeProfile.benchmark_prs?.grace?.time_seconds)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded border border-zinc-800">
                <div>
                  <span className="font-bold text-zinc-200 block">Murph</span>
                  <span className="text-[9px] text-zinc-500 font-mono">1 Mi, 100/200/300, 1 Mi</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={murphTime}
                      onChange={(e) => setMurphTime(Number(e.target.value))}
                      className="w-16 bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-white font-mono text-right text-xs"
                    />
                    <span className="text-zinc-500 text-[10px]">sec</span>
                  </div>
                ) : (
                  <span className="font-bold text-indigo-300 text-xs font-mono">
                    {formatSeconds(activeProfile.benchmark_prs?.murph?.time_seconds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fist Bumps Activity Section */}
      <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center space-x-2 text-amber-400">
            <Flame className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">
              Fist Bumps Activity ({receivedFistBumps.length})
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">Recent high-fives on your scores</span>
        </div>

        {receivedFistBumps.length > 0 ? (
          <div className="space-y-2 text-xs">
            {receivedFistBumps.map((fb) => {
              const giver = profiles.find((p) => p.id === fb.giver_user_id);
              const result = workoutResults.find((r) => r.id === fb.result_id);
              const workout = workouts.find((w) => w.id === result?.workout_id);

              return (
                <div
                  key={fb.id}
                  className="bg-zinc-900 p-2.5 rounded border border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                      👊
                    </div>
                    <div>
                      <span className="font-bold text-white mr-1.5">
                        {giver?.full_name || 'An Athlete'}
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        bumped your score {result?.score_display ? `(${result.score_display})` : ''} on{' '}
                        <strong className="text-indigo-300">{workout?.title || 'Daily Workout'}</strong>
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-zinc-500 italic">
            No fist bumps received yet. Log workout scores on Daily Results to get high-fives from teammates!
          </div>
        )}
      </div>
    </div>
  );
};
