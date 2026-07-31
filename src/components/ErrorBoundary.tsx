import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage clear errors
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0c0e] text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-400 border-b border-zinc-800 pb-4">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-wide text-zinc-100 font-mono">
                  {this.props.fallbackTitle || 'Application State Error'}
                </h2>
                <p className="text-xs text-zinc-400">
                  An unexpected render issue occurred.
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-2">
              <p className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                Error Summary:
              </p>
              <p className="text-xs font-mono text-rose-300 break-words leading-relaxed">
                {this.state.error?.message || 'Unknown application exception'}
              </p>
            </div>

            <div className="text-xs text-zinc-400 space-y-1 leading-relaxed">
              <p>
                This can occur if Supabase tables are still initializing, environment configuration changed, or local cache state requires a refresh.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold font-mono transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold font-mono transition border border-zinc-700"
              >
                <Database className="h-4 w-4 text-zinc-400" />
                <span>Clear Cache & Reset</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
