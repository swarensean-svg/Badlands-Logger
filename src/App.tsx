import React, { useState } from 'react';
import {
  AppTab,
  ViewRole,
  Track,
  Workout,
  WorkoutMovement,
  Movement,
  WorkoutResult,
  WorkoutResultMovement,
  Profile,
  BarbellPRs,
  BenchmarkPRs,
  RxType,
  GymBenchmark,
  FistBump,
} from './types';
import {
  INITIAL_TRACKS,
  INITIAL_WORKOUTS,
  INITIAL_WORKOUT_MOVEMENTS,
  INITIAL_MOVEMENTS,
  INITIAL_WORKOUT_RESULTS,
  INITIAL_WORKOUT_RESULT_MOVEMENTS,
  INITIAL_PROFILES,
  INITIAL_GYM_BENCHMARKS,
  INITIAL_FIST_BUMPS,
} from './data/mockDatabase';
import { Navbar } from './components/Navbar';
import { SchemaArchitect } from './components/SchemaArchitect';
import { StrategyDoc } from './components/StrategyDoc';
import { TrackManager } from './components/TrackManager';
import { WorkoutPlanner } from './components/WorkoutPlanner';
import { WorkoutView } from './components/WorkoutView';
import { ProfilePRsView } from './components/ProfilePRsView';
import { RoleManager } from './components/RoleManager';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { signOutAction } from './actions/auth';
import { Layers, Dumbbell, Shield, User, Trophy, Database, Sparkles, UserCheck, ShieldCheck, Calendar, LogIn, UserPlus } from 'lucide-react';

export default function App() {
  // Navigation, Auth & Role State
  const [activeTab, setActiveTab] = useState<AppTab>('app');
  const [activeRole, setActiveRole] = useState<ViewRole>('member');
  const [subSection, setSubSection] = useState<'workouts' | 'prs' | 'programmer' | 'tracks' | 'roles'>('workouts');

  // Auth Routing State: 'login' | 'signup' | 'forgot-password' | 'dashboard'
  const [authRoute, setAuthRoute] = useState<'login' | 'signup' | 'forgot-password' | 'dashboard'>('dashboard');
  const [currentUser, setCurrentUser] = useState<Profile | null>(INITIAL_PROFILES[0]);

  // Database Models State
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('trk-1');
  const [workouts, setWorkouts] = useState<Workout[]>(INITIAL_WORKOUTS);
  const [workoutMovements, setWorkoutMovements] = useState<WorkoutMovement[]>(INITIAL_WORKOUT_MOVEMENTS);
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS);
  const [workoutResults, setWorkoutResults] = useState<WorkoutResult[]>(INITIAL_WORKOUT_RESULTS);
  const [workoutResultMovements, setWorkoutResultMovements] = useState<WorkoutResultMovement[]>(
    INITIAL_WORKOUT_RESULT_MOVEMENTS
  );
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [benchmarks, setBenchmarks] = useState<GymBenchmark[]>(INITIAL_GYM_BENCHMARKS);
  const [fistBumps, setFistBumps] = useState<FistBump[]>(INITIAL_FIST_BUMPS);

  // Modals state
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  // Active user profile based on auth or role
  const activeProfile = currentUser || profiles.find((p) => p.role === activeRole) || profiles[0];

  // Auth Action Handlers
  const handleAuthSuccess = (userProfile: Profile) => {
    // Upsert user profile into memory state
    const exists = profiles.some((p) => p.id === userProfile.id || p.email.toLowerCase() === userProfile.email.toLowerCase());
    if (!exists) {
      setProfiles([userProfile, ...profiles]);
    } else {
      setProfiles(profiles.map((p) => (p.email.toLowerCase() === userProfile.email.toLowerCase() ? userProfile : p)));
    }

    setCurrentUser(userProfile);
    setActiveRole(userProfile.role);
    setAuthRoute('dashboard');
  };

  const handleSignOut = async () => {
    await signOutAction();
    setCurrentUser(null);
    setAuthRoute('login');
  };

  // Fist Bump Toggle Handler (Optimistic update on Daily Results)
  const handleToggleFistBump = (resultId: string) => {
    const result = workoutResults.find((r) => r.id === resultId);
    if (!result) return;

    const existingIndex = fistBumps.findIndex(
      (fb) => fb.result_id === resultId && fb.giver_user_id === activeProfile.id
    );

    if (existingIndex >= 0) {
      setFistBumps(fistBumps.filter((_, idx) => idx !== existingIndex));
    } else {
      const newBump: FistBump = {
        id: `fb-${Date.now()}`,
        result_id: resultId,
        giver_user_id: activeProfile.id,
        receiver_user_id: result.user_id,
        created_at: new Date().toISOString(),
      };
      setFistBumps([newBump, ...fistBumps]);
    }
  };

  // Profile Privacy Setting Handler (is_public toggle)
  const handleTogglePrivacy = (profileId: string, isPublic: boolean) => {
    setProfiles(
      profiles.map((p) =>
        p.id === profileId ? { ...p, is_public: isPublic, updated_at: new Date().toISOString() } : p
      )
    );
  };

  // Role Elevation Handler
  const handleElevateUserRole = (userId: string, newRole: 'member' | 'coach' | 'admin') => {
    setProfiles(
      profiles.map((p) =>
        p.id === userId ? { ...p, role: newRole, updated_at: new Date().toISOString() } : p
      )
    );
  };

  // Track Handlers
  const handleCreateTrack = (newTrack: Omit<Track, 'id' | 'created_at' | 'updated_at'>) => {
    const created: Track = {
      ...newTrack,
      id: `trk-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTracks([...tracks, created]);
    setSelectedTrackId(created.id);
  };

  const handleUpdateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(
      tracks.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );
  };

  const handleDeleteTrack = (id: string) => {
    setTracks(tracks.filter((t) => t.id !== id));
    if (selectedTrackId === id && tracks.length > 1) {
      setSelectedTrackId(tracks.find((t) => t.id !== id)?.id || '');
    }
  };

  // Workout Creation Handler
  const handleCreateWorkout = (
    newWorkout: Omit<Workout, 'id' | 'created_at' | 'updated_at'>,
    selectedMovs: { movement_id: string; rx_male?: number; rx_female?: number; reps?: number }[]
  ) => {
    const wktId = `wkt-${Date.now()}`;
    const createdWkt: Workout = {
      ...newWorkout,
      id: wktId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newWmRows: WorkoutMovement[] = selectedMovs.map((sm, idx) => ({
      id: `wm-${Date.now()}-${idx}`,
      workout_id: wktId,
      movement_id: sm.movement_id,
      order_index: idx + 1,
      rx_weight_male_lbs: sm.rx_male,
      rx_weight_female_lbs: sm.rx_female,
      target_reps: sm.reps,
    }));

    setWorkouts([createdWkt, ...workouts]);
    setWorkoutMovements([...workoutMovements, ...newWmRows]);
    setSelectedTrackId(createdWkt.track_id);
  };

  // Workout Update Handler
  const handleUpdateWorkout = (
    workoutId: string,
    updates: Partial<Workout>,
    selectedMovs: { movement_id: string; rx_male?: number; rx_female?: number; reps?: number }[]
  ) => {
    setWorkouts(
      workouts.map((w) =>
        w.id === workoutId ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
      )
    );
  };

  // Workout Delete Handler
  const handleDeleteWorkout = (workoutId: string) => {
    setWorkouts(workouts.filter((w) => w.id !== workoutId));
  };

  // Benchmark Addition Handler
  const handleAddBenchmark = (newBm: GymBenchmark) => {
    setBenchmarks([...benchmarks, newBm]);
  };

  // Result Logging Handler
  const handleLogResult = (
    workoutId: string,
    scoreDisplay: string,
    scoreNumeric: number,
    rxType: RxType,
    notes: string,
    movementScores: { movement_id: string; weight_lbs?: number; reps?: number }[]
  ) => {
    const resultId = `res-${Date.now()}`;
    const createdResult: WorkoutResult = {
      id: resultId,
      workout_id: workoutId,
      user_id: activeProfile.id,
      score_display: scoreDisplay,
      score_numeric: scoreNumeric,
      rx_type: rxType,
      notes,
      logged_at: new Date().toISOString(),
    };

    const createdResMovs: WorkoutResultMovement[] = movementScores.map((ms, idx) => ({
      id: `res-mov-${Date.now()}-${idx}`,
      result_id: resultId,
      movement_id: ms.movement_id,
      weight_used_lbs: ms.weight_lbs,
      reps_completed: ms.reps,
      notes: notes,
    }));

    setWorkoutResults([createdResult, ...workoutResults]);
    setWorkoutResultMovements([...workoutResultMovements, ...createdResMovs]);
  };

  // PR Updates Handler
  const handleUpdatePRs = (
    profileId: string,
    barbellPRs: BarbellPRs,
    benchmarkPRs: BenchmarkPRs
  ) => {
    setProfiles(
      profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              barbell_prs: barbellPRs,
              benchmark_prs: benchmarkPRs,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        currentUser={currentUser}
        authRoute={authRoute}
        onNavigateAuth={(route) => setAuthRoute(route)}
        onSignOut={handleSignOut}
        onOpenCreateTrack={() => setShowTrackModal(true)}
        onOpenCreateWorkout={() => setShowWorkoutModal(true)}
      />

      {/* Main Body Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 bg-[#0c0c0e]">
        {/* Render Auth View Pages (/login, /signup, /forgot-password) when active */}
        {authRoute === 'login' && (
          <LoginPage
            onNavigateToSignup={() => setAuthRoute('signup')}
            onNavigateToForgotPassword={() => setAuthRoute('forgot-password')}
            onLoginSuccess={handleAuthSuccess}
            profiles={profiles}
          />
        )}

        {authRoute === 'signup' && (
          <SignupPage
            onNavigateToLogin={() => setAuthRoute('login')}
            onSignupSuccess={handleAuthSuccess}
          />
        )}

        {authRoute === 'forgot-password' && (
          <ForgotPasswordPage
            onNavigateToLogin={() => setAuthRoute('login')}
          />
        )}

        {/* Render Main Athlete Dashboard when in 'dashboard' route */}
        {authRoute === 'dashboard' && (
          <>
            {/* Main Application Simulator Tab */}
            {activeTab === 'app' && (
              <div className="space-y-5">
                {/* Secondary Navigation Bar (Workouts / PRs / Tracks) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-900/60 p-2 rounded-lg border border-zinc-800 gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setSubSection('workouts')}
                      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-mono font-bold tracking-tight transition ${
                        subSection === 'workouts'
                          ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                      }`}
                    >
                      <Dumbbell className="h-3.5 w-3.5 text-indigo-400" />
                      <span>WORKOUTS & LOGS</span>
                    </button>

                    <button
                      onClick={() => setSubSection('prs')}
                      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-mono font-bold tracking-tight transition ${
                        subSection === 'prs'
                          ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                      }`}
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>BENCHMARK & BARBELL PRS</span>
                    </button>

                    {(activeRole === 'coach' || activeRole === 'admin') && (
                      <>
                        <button
                          onClick={() => setSubSection('programmer')}
                          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-mono font-bold tracking-tight transition ${
                            subSection === 'programmer'
                              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          <span>WEEKLY PROGRAMMER</span>
                        </button>

                        <button
                          onClick={() => setSubSection('tracks')}
                          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-mono font-bold tracking-tight transition ${
                            subSection === 'tracks'
                              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                          }`}
                        >
                          <Layers className="h-3.5 w-3.5 text-purple-400" />
                          <span>TRACK MANAGER</span>
                        </button>

                        <button
                          onClick={() => setSubSection('roles')}
                          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded text-xs font-mono font-bold tracking-tight transition ${
                            subSection === 'roles'
                              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                          }`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>ROLE ELEVATION & SECURITY</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Persona Status Badge */}
                  <div className="flex items-center space-x-2 px-3 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ATHLETE: <strong className="text-zinc-200">{activeProfile.full_name}</strong></span>
                  </div>
                </div>

                {/* Sub-Section Content Rendering */}
                {subSection === 'workouts' && (
                  <WorkoutView
                    tracks={tracks}
                    selectedTrackId={selectedTrackId}
                    setSelectedTrackId={setSelectedTrackId}
                    workouts={workouts}
                    workoutMovements={workoutMovements}
                    movements={movements}
                    workoutResults={workoutResults}
                    workoutResultMovements={workoutResultMovements}
                    profiles={profiles}
                    fistBumps={fistBumps}
                    activeRole={activeRole}
                    onLogResult={handleLogResult}
                    onToggleFistBump={handleToggleFistBump}
                    onOpenCreateTrack={() => setShowTrackModal(true)}
                    onOpenCreateWorkout={() => setShowWorkoutModal(true)}
                  />
                )}

                {subSection === 'prs' && (
                  <ProfilePRsView
                    activeProfile={activeProfile}
                    profiles={profiles}
                    workouts={workouts}
                    workoutResults={workoutResults}
                    fistBumps={fistBumps}
                    onUpdatePRs={handleUpdatePRs}
                    onTogglePrivacy={handleTogglePrivacy}
                    onImportResults={(newResults) =>
                      setWorkoutResults((prev) => [...newResults, ...prev])
                    }
                  />
                )}

                {subSection === 'programmer' && (activeRole === 'coach' || activeRole === 'admin') && (
                  <WeeklyPlanner
                    tracks={tracks}
                    workouts={workouts}
                    movements={movements}
                    benchmarks={benchmarks}
                    activeRole={activeRole}
                    onUpdateWorkouts={(updated) => setWorkouts(updated)}
                    onAddBenchmark={handleAddBenchmark}
                    onCreateWorkout={handleCreateWorkout}
                    onUpdateWorkout={handleUpdateWorkout}
                    onDeleteWorkout={handleDeleteWorkout}
                  />
                )}

                {subSection === 'tracks' && (activeRole === 'coach' || activeRole === 'admin') && (
                  <TrackManager
                    tracks={tracks}
                    onCreateTrack={handleCreateTrack}
                    onUpdateTrack={handleUpdateTrack}
                    onDeleteTrack={handleDeleteTrack}
                  />
                )}

                {subSection === 'roles' && (activeRole === 'coach' || activeRole === 'admin') && (
                  <RoleManager
                    profiles={profiles}
                    activeRole={activeRole}
                    onUpdateRole={handleElevateUserRole}
                  />
                )}
              </div>
            )}

            {/* SQL Schema Architect View */}
            {activeTab === 'schema' && <SchemaArchitect />}

            {/* TypeScript Types View */}
            {activeTab === 'types' && <SchemaArchitect />}

            {/* Movement Query Strategy View */}
            {activeTab === 'strategy' && <StrategyDoc />}
          </>
        )}
      </main>

      {/* Global Modals for Coach / Admin */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full">
            <TrackManager
              tracks={tracks}
              onCreateTrack={handleCreateTrack}
              onUpdateTrack={handleUpdateTrack}
              onDeleteTrack={handleDeleteTrack}
              onClose={() => setShowTrackModal(false)}
            />
          </div>
        </div>
      )}

      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8">
            <WorkoutPlanner
              tracks={tracks}
              movements={movements}
              onCreateWorkout={handleCreateWorkout}
              onClose={() => setShowWorkoutModal(false)}
            />
          </div>
        </div>
      )}

      {/* High Density DB Metrics Footer Bar */}
      <footer className="h-8 border-t border-zinc-800 bg-zinc-950 flex items-center px-4 justify-between font-mono text-[10px]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">QUERY_LATENCY:</span>
            <span className="text-emerald-400 font-bold">14ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">ACTIVE_SESSIONS:</span>
            <span className="text-zinc-300 font-bold">1,244</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-zinc-500">DB_NODE:</span>
            <span className="text-indigo-400 font-bold">SUPABASE_PROD_1</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase text-zinc-500 tracking-widest hidden sm:inline">Schema Integrity Verified</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
}
