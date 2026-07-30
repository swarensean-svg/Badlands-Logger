import React from 'react';
import { Cpu, Zap, Layers, GitBranch, Key, Table, ChevronRight, CheckCircle2 } from 'lucide-react';

export const StrategyDoc: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 border border-indigo-900/50 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Cpu className="h-64 w-64 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            <Zap className="h-3.5 w-3.5" />
            <span>Senior Architectural Strategy Report</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Supabase Gym Database Architecture & Movement History Query Engine
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            Detailed breakdown of data modeling decisions, dynamic track security, coach notes protection, and the high-performance SQL JOIN strategy for fetching athlete movement history.
          </p>
        </div>
      </div>

      {/* Section 1: JSONB vs Relational Structure Analysis */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Table className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-white">1. Data Model Architecture: JSONB vs. Relational Tables</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-semibold text-blue-400 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Profiles Table (Hybrid JSONB approach)</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              We store <code className="text-amber-300 font-mono">benchmark_prs</code> and <code className="text-amber-300 font-mono">barbell_prs</code> inside <code className="text-blue-300 font-mono">public.profiles</code> as <code className="text-purple-300 font-mono">JSONB</code>.
            </p>
            <ul className="text-slate-400 text-xs space-y-1.5 list-disc list-inside">
              <li><strong className="text-slate-200">Why JSONB for Profile PRs:</strong> Instant single-query key-value lookup for profile header cards (e.g. Back Squat 1RM: 345 lbs, Fran: 2:45) without joining multiple tables.</li>
              <li><strong className="text-slate-200">GIN Indexing:</strong> Allows fast filtering via Postgres <code className="text-emerald-400 font-mono">USING GIN (barbell_prs)</code> if gym leaderboards search for specific JSON keys.</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-semibold text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Normalized Movement History Tables</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              For workout tracking and historical analytics, we use normalized relational tables: <code className="text-blue-300 font-mono">movements</code>, <code className="text-blue-300 font-mono">workout_movements</code>, <code className="text-blue-300 font-mono">workout_results</code>, and <code className="text-blue-300 font-mono">workout_result_movements</code>.
            </p>
            <ul className="text-slate-400 text-xs space-y-1.5 list-disc list-inside">
              <li><strong className="text-slate-200">Strict Foreign Keys:</strong> Prevents orphan data when movements are renamed or recategorized.</li>
              <li><strong className="text-slate-200">Chrono Indexing:</strong> Enables sub-millisecond querying of past load/reps across years of workouts.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Movement History Query Strategy */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">2. Movement History SQL JOIN Strategy</h2>
            <p className="text-xs text-slate-400">High-performance query pattern for fetching an athlete's past logs when viewing today's workout.</p>
          </div>
        </div>

        {/* Strategy Breakdown Steps */}
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-sm font-semibold text-indigo-300 flex items-center space-x-2">
              <span className="h-5 w-5 rounded-full bg-indigo-600/30 border border-indigo-400 text-indigo-300 flex items-center justify-center text-xs font-bold">1</span>
              <span>The Problem: The "Top-N per Group" Query Trap</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              When an athlete views today's workout, it may contain 3-5 movements (e.g., Back Squat, Thrusters, Pull-ups). Standard SQL <code className="text-rose-400 font-mono">JOIN ... WHERE movement_id IN (...)</code> orders all results together, making it slow and difficult to retrieve the top 3-5 chronological logs <em>per individual movement</em>.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300 flex items-center space-x-2">
              <span className="h-5 w-5 rounded-full bg-emerald-600/30 border border-emerald-400 text-emerald-300 flex items-center justify-center text-xs font-bold">2</span>
              <span>The Architectural Solution: CROSS JOIN LATERAL in PostgreSQL</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              We encapsulate the query into a Supabase RPC stored procedure (<code className="text-emerald-400 font-mono">get_user_movement_history</code>) using a <code className="text-indigo-400 font-mono">CROSS JOIN LATERAL</code> subquery over an <code className="text-amber-400 font-mono">unnest(p_movement_ids)</code> array.
            </p>

            <pre className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto">
              <code>{`-- Supabase Stored Procedure (RPC)
SELECT 
  m.name AS movement_name,
  res.logged_at,
  w.title AS workout_title,
  res.score_display,
  rm.weight_used_lbs,
  rm.reps_completed
FROM unnest(p_movement_ids) AS target_mov_id
JOIN public.movements m ON m.id = target_mov_id
CROSS JOIN LATERAL (
  SELECT 
    r.id, r.workout_id, r.score_display, r.logged_at,
    rm_sub.weight_used_lbs, rm_sub.reps_completed
  FROM public.workout_results r
  JOIN public.workout_result_movements rm_sub ON rm_sub.result_id = r.id
  WHERE r.user_id = p_user_id
    AND rm_sub.movement_id = target_mov_id
  ORDER BY r.logged_at DESC
  LIMIT p_limit_per_movement
) res
JOIN public.workouts w ON w.id = res.workout_id;`}</code>
            </pre>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center space-x-2">
              <span className="h-5 w-5 rounded-full bg-amber-600/30 border border-amber-400 text-amber-300 flex items-center justify-center text-xs font-bold">3</span>
              <span>Composite B-Tree Indexes for Sub-Millisecond Execution</span>
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              To guarantee execution in &lt;5ms even with 100,000+ logged workouts, we deploy composite B-Tree indexes:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-300 border border-slate-800">
              CREATE INDEX idx_workout_results_user ON public.workout_results(user_id, logged_at DESC);<br/>
              CREATE INDEX idx_result_movements_lookup ON public.workout_result_movements(movement_id, result_id);
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Notes Visibility & Dynamic Tracks Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <Key className="h-5 w-5" />
            <h3 className="font-bold text-white text-base">Athlete vs. Coach Notes Security</h3>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            <code className="text-slate-200 font-mono">athlete_notes</code> are visible to all members. <code className="text-amber-300 font-mono">coaches_notes</code> are intended strictly for coaches (pacing cues, scaling options, target caps).
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="text-slate-200 font-semibold">Security Enforcement:</p>
            <p>1. <strong>Database Level:</strong> Create a Postgres View or RPC function that nullifies <code className="text-amber-400 font-mono">coaches_notes</code> if <code className="text-indigo-400 font-mono">get_user_role() = 'member'</code>.</p>
            <p>2. <strong>UI Level:</strong> Render explicit "Coach Viewing" vs "Athlete Viewing" toggles.</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-blue-400">
            <Layers className="h-5 w-5" />
            <h3 className="font-bold text-white text-base">Dynamic Track Management</h3>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Tracks can be created, renamed, reordered, or deleted dynamically by Coaches and Admins.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="text-slate-200 font-semibold">Hidden & Planning Tracks:</p>
            <p>Tracks with <code className="text-purple-400 font-mono">is_hidden = true</code> or <code className="text-purple-400 font-mono">is_planning = true</code> are excluded from Member SQL queries using RLS policies.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
