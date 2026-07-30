import React from 'react';
import { UserRole, AppTab, ViewRole, Profile } from '../types';
import { Dumbbell, Database, Shield, FileCode, Layers, Plus, LogOut, LogIn, UserPlus } from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  activeRole: ViewRole;
  setActiveRole: (role: ViewRole) => void;
  currentUser: Profile | null;
  authRoute: 'login' | 'signup' | 'forgot-password' | 'dashboard';
  onNavigateAuth: (route: 'login' | 'signup' | 'forgot-password') => void;
  onSignOut: () => void;
  onOpenCreateTrack: () => void;
  onOpenCreateWorkout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeRole,
  setActiveRole,
  currentUser,
  authRoute,
  onNavigateAuth,
  onSignOut,
  onOpenCreateTrack,
  onOpenCreateWorkout,
}) => {
  return (
    <header className="h-14 bg-zinc-900/50 border-b border-zinc-800 text-zinc-100 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* App Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold italic text-white shadow-sm text-xs">
              BL
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white italic">
                Badlands Logger
              </span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                v2.4.0
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 font-mono text-xs">
            <button
              onClick={() => setActiveTab('app')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
                activeTab === 'app'
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Dumbbell className="h-3.5 w-3.5 text-indigo-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
                activeTab === 'schema'
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span>DDL Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('types')}
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded transition ${
                activeTab === 'types'
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-amber-400" />
              <span>TypeScript</span>
            </button>

            <button
              onClick={() => setActiveTab('strategy')}
              className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded transition ${
                activeTab === 'strategy'
                  ? 'bg-zinc-800 text-white border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span>Strategy</span>
            </button>
          </nav>

          {/* Controls: Role Switcher, Auth & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Action Buttons for Coach/Admin */}
            {(activeRole === 'coach' || activeRole === 'admin') && (
              <div className="hidden xl:flex items-center space-x-2">
                <button
                  onClick={onOpenCreateTrack}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition"
                >
                  <Layers className="h-3 w-3 text-indigo-400" />
                  <span>Tracks</span>
                </button>
                <button
                  onClick={onOpenCreateWorkout}
                  className="flex items-center space-x-1 px-3 py-1 text-xs font-bold bg-zinc-100 hover:bg-white text-black uppercase tracking-tight rounded transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log WOD</span>
                </button>
              </div>
            )}

            {/* Role Switcher Pill */}
            {currentUser?.role === 'member' ? (
              <div className="hidden sm:flex items-center bg-zinc-800/80 px-2 py-1 rounded-md border border-zinc-700/80 text-[10px] font-mono font-bold text-zinc-300">
                <span>ATHLETE</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center bg-zinc-800/80 p-1 rounded-md border border-zinc-700/80">
                <button
                  onClick={() => setActiveRole('member')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded transition ${
                    activeRole === 'member'
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Member view"
                >
                  ATHLETE
                </button>
                <button
                  onClick={() => setActiveRole('coach')}
                  className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded transition ${
                    activeRole === 'coach'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Coach view"
                >
                  COACH
                </button>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setActiveRole('admin')}
                    className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded transition ${
                      activeRole === 'admin'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Admin view"
                  >
                    ADMIN
                  </button>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            {authRoute === 'dashboard' ? (
              <div className="flex items-center space-x-2">
                <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-300 font-bold truncate max-w-[100px]">
                    {currentUser?.full_name.split(' ')[0] || 'Athlete'}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-red-400 rounded border border-zinc-700 transition"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 font-mono text-xs">
                <button
                  onClick={() => onNavigateAuth('login')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded transition border ${
                    authRoute === 'login'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                  }`}
                >
                  <LogIn className="h-3 w-3" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => onNavigateAuth('signup')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded transition border ${
                    authRoute === 'signup'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-zinc-100 hover:bg-white text-black border-white font-bold'
                  }`}
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Signup</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

