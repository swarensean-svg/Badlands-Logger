import React, { useState } from 'react';
import { loginAction } from '../../actions/auth';
import { Dumbbell, Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Profile } from '../../types';

interface LoginPageProps {
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
  onLoginSuccess: (profile: Profile) => void;
  profiles: Profile[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToSignup,
  onNavigateToForgotPassword,
  onLoginSuccess,
  profiles,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await loginAction({ email, password });

      if (result.success) {
        setSuccessMessage(result.message || 'Login successful!');
        // Find existing matching profile in memory or use returned profile
        const matched = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
        const userProfile: Profile = matched || {
          id: result.profile?.id || `usr-${Date.now()}`,
          email: email.trim(),
          full_name: result.profile?.full_name || 'Gym Member',
          role: result.profile?.role || 'member',
          is_public: result.profile?.is_public ?? true,
          benchmark_prs: {},
          barbell_prs: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setTimeout(() => {
          onLoginSuccess(userProfile);
        }, 600);
      } else {
        setErrorMessage(result.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-zinc-950 text-zinc-100 font-sans">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 mb-1">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tight text-white uppercase">
            BADLANDS <span className="text-indigo-400">LOGGER</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Welcome back! Sign in to access your daily WODs, log scores & high five teammates.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="font-mono">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="font-mono">{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@gym.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 left-10 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                Password
              </label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-sans"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-bold rounded-lg uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Athlete Core</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation link */}
        <div className="text-center pt-2 font-sans text-xs text-zinc-400 border-t border-zinc-800">
          Don't have an athlete account yet?{' '}
          <button
            type="button"
            onClick={onNavigateToSignup}
            className="text-indigo-400 hover:text-indigo-300 font-bold underline transition"
          >
            Sign Up Free
          </button>
        </div>
      </div>
    </div>
  );
};
