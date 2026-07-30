import React, { useState } from 'react';
import { SUPABASE_SQL_SCHEMA } from '../data/schemaSql';
import { RLS_POLICIES_SQL } from '../data/rlsPoliciesSql';
import { Copy, Check, Database, FileCode, ShieldAlert, Cpu, Layers, Lock, KeyRound, Server } from 'lucide-react';

export const SchemaArchitect: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const [copiedTypes, setCopiedTypes] = useState(false);
  const [copiedSsr, setCopiedSsr] = useState(false);
  const [copiedAction, setCopiedAction] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'rls_sql' | 'ssr_client' | 'action_code' | 'types' | 'rls'>('rls_sql');

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyRlsSql = () => {
    navigator.clipboard.writeText(RLS_POLICIES_SQL);
    setCopiedRlsSql(true);
    setTimeout(() => setCopiedRlsSql(false), 2000);
  };

  const SSR_CLIENT_CODE = `import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Next.js Supabase Server Client Utility (src/lib/supabaseServer.ts)
 * Creates an authenticated Supabase client for Server Components, Server Actions, and Route Handlers.
 * Uses HTTP-only cookies for safe SSR JWT session management.
 * Strictly uses process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

export function createClient(cookieStore?: {
  get: (name: string) => { value: string } | undefined;
  set?: (name: string, value: string, options: CookieOptions) => void;
  remove?: (name: string, options: CookieOptions) => void;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase Environment Variables');
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore?.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore?.set?.(name, value, options);
        } catch {
          // Handled in middleware
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore?.set?.(name, '', { ...options, maxAge: 0 });
        } catch {
          // Handled in middleware
        }
      },
    },
  });
}`;

  const SERVER_ACTION_CODE = `'use server';

import { createClient } from '../lib/supabaseServer';

export interface ElevateRoleResult {
  success: boolean;
  message: string;
  updatedProfile?: {
    id: string;
    email: string;
    full_name: string;
    role: 'member' | 'coach' | 'admin';
  };
  error?: string;
}

/**
 * Next.js Server Action: Elevates a Member to a Coach (src/actions/roles.ts)
 * 
 * Security Enforcement:
 * 1. Verifies current authenticated user JWT session.
 * 2. Checks public.profiles to confirm requester has 'admin' role.
 * 3. Updates target profile's role from 'member' to 'coach'.
 */
export async function elevateMemberToCoach(targetUserId: string): Promise<ElevateRoleResult> {
  try {
    const supabase = createClient();

    // 1. Get authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return {
        success: false,
        error: 'Authentication required. You must be signed in as an Admin.',
      };
    }

    // 2. Verify Requester is an Admin in public.profiles
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!requesterProfile || requesterProfile.role !== 'admin') {
      return {
        success: false,
        error: 'Forbidden: Only administrators can elevate member roles.',
      };
    }

    // 3. Elevate Member to Coach
    const { data: updatedData, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'coach', updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select('id, email, full_name, role')
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      message: \`Successfully elevated \${updatedData.full_name} to Coach!\`,
      updatedProfile: updatedData as ElevateRoleResult['updatedProfile'],
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server error occurred.' };
  }
}`;

  const TYPES_CODE = `/**
 * TypeScript Database Interfaces for Supabase (types/database.ts)
 */

export type UserRole = 'member' | 'coach' | 'admin';
export type ScoringType = 'time' | 'reps' | 'weight' | 'rounds_reps' | 'completion';
export type WorkoutStatus = 'draft' | 'published' | 'archived';
export type RxType = 'rx' | 'rx_plus' | 'scaled';
export type MovementCategory = 'barbell' | 'gymnastics' | 'monostructural' | 'benchmark_wod' | 'mobility';
export type MovementUnit = 'lbs' | 'kg' | 'reps' | 'seconds' | 'meters' | 'calories';

export interface Profile {
  id: string; // references auth.users
  email: string;
  full_name: string;
  role: UserRole;
  benchmark_prs: Record<string, any>;
  barbell_prs: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  is_hidden: boolean;
  is_planning: boolean;
  display_order: number;
}

export interface Workout {
  id: string;
  track_id: string;
  scheduled_date: string;
  title: string;
  description: string;
  athlete_notes: string;
  coaches_notes: string; // Restricted to Coaches & Admins
  scoring_type: ScoringType;
  status: WorkoutStatus;
}`;

  return (
    <div className="space-y-5 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-zinc-900 text-white rounded-lg p-5 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold uppercase tracking-wider italic">Supabase RLS & SSR Auth Engine</h2>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-2xl font-sans">
            Row Level Security (RLS) policies, Next.js <code className="text-indigo-300">@supabase/ssr</code> server client setup, and <code className="text-emerald-300">elevateMemberToCoach</code> server action.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('rls_sql')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition ${
              activeSubTab === 'rls_sql' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'
            }`}
          >
            RLS SQL Policies
          </button>
          <button
            onClick={() => setActiveSubTab('action_code')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition ${
              activeSubTab === 'action_code' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'
            }`}
          >
            Server Action Code
          </button>
          <button
            onClick={() => setActiveSubTab('ssr_client')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition ${
              activeSubTab === 'ssr_client' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'
            }`}
          >
            @supabase/ssr Setup
          </button>
          <button
            onClick={() => setActiveSubTab('sql')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition ${
              activeSubTab === 'sql' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'
            }`}
          >
            Full DDL Schema
          </button>
          <button
            onClick={() => setActiveSubTab('rls')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition ${
              activeSubTab === 'rls' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'
            }`}
          >
            Security Matrix
          </button>
        </div>
      </div>

      {/* RLS Policies SQL Script */}
      {activeSubTab === 'rls_sql' && (
        <div className="bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase text-zinc-200">supabase_rls_policies.sql</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                Exact User Request Requirements
              </span>
            </div>
            <button
              onClick={handleCopyRlsSql}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
            >
              {copiedRlsSql ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Copied RLS SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy RLS SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] select-all">
            <code>{RLS_POLICIES_SQL}</code>
          </pre>
        </div>
      )}

      {/* Server Action Code */}
      {activeSubTab === 'action_code' && (
        <div className="bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <KeyRound className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase text-zinc-200">actions/roles.ts</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                Server Action (Admin Elevate Role)
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(SERVER_ACTION_CODE);
                setCopiedAction(true);
                setTimeout(() => setCopiedAction(false), 2000);
              }}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
            >
              {copiedAction ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Copied Server Action!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Action Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] select-all">
            <code>{SERVER_ACTION_CODE}</code>
          </pre>
        </div>
      )}

      {/* @supabase/ssr Server Setup Code */}
      {activeSubTab === 'ssr_client' && (
        <div className="bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase text-zinc-200">lib/supabaseServer.ts</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                @supabase/ssr Cookie Engine
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(SSR_CLIENT_CODE);
                setCopiedSsr(true);
                setTimeout(() => setCopiedSsr(false), 2000);
              }}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
            >
              {copiedSsr ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Copied SSR Code!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy SSR Client Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] select-all">
            <code>{SSR_CLIENT_CODE}</code>
          </pre>
        </div>
      )}

      {/* Full DDL SQL */}
      {activeSubTab === 'sql' && (
        <div className="bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase text-zinc-200">supabase_schema_migration.sql</span>
            </div>
            <button
              onClick={handleCopySql}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-bold uppercase bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
            >
              {copiedSql ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Copied SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy DDL SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-zinc-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[550px] select-all">
            <code>{SUPABASE_SQL_SCHEMA}</code>
          </pre>
        </div>
      )}

      {/* Security Matrix Table */}
      {activeSubTab === 'rls' && (
        <div className="bg-zinc-900 rounded border border-zinc-800 p-4 space-y-4 font-mono">
          <div className="flex items-center space-x-2 text-amber-400 border-b border-zinc-800 pb-2">
            <ShieldAlert className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Supabase Row-Level Security Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Table Name</th>
                  <th className="py-2.5 px-3">Member Permissions</th>
                  <th className="py-2.5 px-3">Coach Permissions</th>
                  <th className="py-2.5 px-3">Admin Permissions</th>
                  <th className="py-2.5 px-3">Coaches Notes Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-indigo-400">profiles</td>
                  <td className="py-2.5 px-3">Read Public / Update Own PRs</td>
                  <td className="py-2.5 px-3">Read Public / Update Own PRs</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">Elevate Roles & Full CRUD</td>
                  <td className="py-2.5 px-3 text-zinc-500">N/A</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-indigo-400">tracks</td>
                  <td className="py-2.5 px-3">Read Athlete Viewing Tracks Only</td>
                  <td className="py-2.5 px-3">Full CRUD (Planning & Hidden)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">Full CRUD</td>
                  <td className="py-2.5 px-3 text-zinc-500">N/A</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-indigo-400">workouts</td>
                  <td className="py-2.5 px-3">Read Published Workouts Only</td>
                  <td className="py-2.5 px-3">Full CRUD (Draft/Published/Archived)</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">Full CRUD</td>
                  <td className="py-2.5 px-3 text-amber-400 font-bold">Coaches & Admins Only</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-indigo-400">workout_results</td>
                  <td className="py-2.5 px-3">Read Leaderboard / Write Own</td>
                  <td className="py-2.5 px-3">Read Leaderboard & Review Team</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">Full CRUD</td>
                  <td className="py-2.5 px-3 text-zinc-500">N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

