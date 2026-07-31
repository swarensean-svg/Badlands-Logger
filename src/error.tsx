'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center space-x-3 text-amber-400 border-b border-zinc-800 pb-4">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide text-zinc-100 font-mono">
              Application State Error
            </h2>
            <p className="text-xs text-zinc-400">
              An unexpected render or data formatting issue occurred.
            </p>
          </div>
        </div>

        <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2">
          <p className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
            Error Summary:
          </p>
          <p className="text-xs font-mono text-rose-300 break-words leading-relaxed">
            {error?.message || 'Unknown application exception'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => (reset ? reset() : window.location.reload())}
            className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold font-mono transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => {
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch {}
              window.location.reload();
            }}
            className="flex-1 flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold font-mono transition border border-zinc-700"
          >
            <Database className="h-4 w-4 text-zinc-400" />
            <span>Clear Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
}
